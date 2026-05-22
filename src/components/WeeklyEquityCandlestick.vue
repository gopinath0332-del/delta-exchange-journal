<template>
  <div class="weekly-equity-candlestick">
    <canvas v-show="hasChartData" ref="chartCanvas"></canvas>
    <div v-if="!hasChartData" class="empty-chart-state">
      No closed trades available for the equity curve
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { getTradePnL } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

Chart.register(...registerables);

const getTradeDate = (trade) => {
  const rawExit = trade.exit_timestamp?.toDate?.() || (trade.exit_timestamp ? new Date(trade.exit_timestamp) : null);
  const rawEntry = trade.entry_timestamp?.toDate?.() || (trade.entry_timestamp ? new Date(trade.entry_timestamp) : null);

  return rawExit && !isNaN(rawExit) ? rawExit : rawEntry;
};

const getWeekStart = (date) => {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + offset);
  return weekStart;
};

const getWeekKey = (date) => getWeekStart(date).toISOString().slice(0, 10);

const addWeeks = (date, count) => {
  const result = new Date(date);
  result.setDate(result.getDate() + count * 7);
  return result;
};

const formatWeekLabel = (date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const equityCandlestickPlugin = {
  id: 'equityCandlesticks',
  afterDatasetsDraw(chart, _args, options) {
    const candles = options.candles || [];
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const { ctx, chartArea } = chart;
    const candleWidth = Math.max(4, Math.min(12, chartArea.width / Math.max(candles.length, 1) * 0.58));

    ctx.save();
    candles.forEach((candle, index) => {
      const x = xScale.getPixelForValue(index);
      const highY = yScale.getPixelForValue(candle.high);
      const lowY = yScale.getPixelForValue(candle.low);
      const openY = yScale.getPixelForValue(candle.open);
      const closeY = yScale.getPixelForValue(candle.close);
      const isUp = candle.close >= candle.open;
      const color = isUp ? options.profitColor : options.lossColor;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

      ctx.strokeStyle = color;
      ctx.fillStyle = isUp ? options.profitFill : options.lossFill;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      ctx.beginPath();
      ctx.rect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  },
};

const equityBaselinePlugin = {
  id: 'equityBaseline',
  afterDatasetsDraw(chart, _args, options) {
    const { ctx, chartArea } = chart;
    const yScale = chart.scales.y;
    const y = yScale.getPixelForValue(options.value);

    if (y < chartArea.top || y > chartArea.bottom) return;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = options.color;
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.stroke();
    ctx.restore();
  },
};

Chart.register(equityCandlestickPlugin, equityBaselinePlugin);

export default {
  name: 'WeeklyEquityCandlestick',
  props: {
    trades: {
      type: Array,
      required: true,
    },
    initialEquity: {
      type: Number,
      default: 1000,
    },
  },
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;

    const weeklyCandles = computed(() => {
      const sortedTrades = props.trades
        .filter((trade) => trade.status === 'CLOSED' || trade.status === 'PARTIAL_CLOSED')
        .map((trade) => ({
          trade,
          date: getTradeDate(trade),
          pnl: getTradePnL(trade),
        }))
        .filter((item) => item.date && !isNaN(item.date))
        .sort((a, b) => a.date - b.date);

      if (sortedTrades.length === 0) return [];

      const tradesByWeek = new Map();
      sortedTrades.forEach((item) => {
        const weekKey = getWeekKey(item.date);
        if (!tradesByWeek.has(weekKey)) tradesByWeek.set(weekKey, []);
        tradesByWeek.get(weekKey).push(item);
      });

      const firstWeek = getWeekStart(sortedTrades[0].date);
      const lastWeek = getWeekStart(sortedTrades[sortedTrades.length - 1].date);
      const candles = [];
      let equity = props.initialEquity;

      for (let week = new Date(firstWeek); week <= lastWeek; week = addWeeks(week, 1)) {
        const weekKey = week.toISOString().slice(0, 10);
        const weekTrades = tradesByWeek.get(weekKey) || [];
        const open = equity;
        let high = equity;
        let low = equity;

        weekTrades.forEach((item) => {
          equity += item.pnl;
          high = Math.max(high, equity);
          low = Math.min(low, equity);
        });

        candles.push({
          weekStart: new Date(week),
          label: formatWeekLabel(week),
          open,
          high,
          low,
          close: equity,
          tradeCount: weekTrades.length,
          pnl: equity - open,
        });
      }

      return candles;
    });

    const hasChartData = computed(() => weeklyCandles.value.length > 0);

    const createChart = () => {
      if (!chartCanvas.value) return;

      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      if (!hasChartData.value) return;

      const candles = weeklyCandles.value;
      const styles = getComputedStyle(document.documentElement);
      const profitColor = styles.getPropertyValue('--color-profit').trim() || '#22c55e';
      const lossColor = styles.getPropertyValue('--color-loss').trim() || '#ef4444';
      const textColor = styles.getPropertyValue('--color-text-secondary').trim() || '#d1d5db';
      const gridColor = 'rgba(255, 255, 255, 0.06)';
      const allValues = candles.flatMap((candle) => [candle.open, candle.high, candle.low, candle.close, props.initialEquity]);
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      const padding = Math.max((maxValue - minValue) * 0.12, 25);

      chartInstance = new Chart(chartCanvas.value.getContext('2d'), {
        type: 'line',
        data: {
          labels: candles.map((candle) => candle.label),
          datasets: [
            {
              label: 'Weekly close',
              data: candles.map((candle) => candle.close),
              borderColor: 'transparent',
              backgroundColor: 'transparent',
              pointRadius: 0,
              pointHoverRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2.55,
          plugins: {
            legend: {
              display: false,
            },
            equityCandlesticks: {
              candles,
              profitColor,
              lossColor,
              profitFill: 'rgba(34, 197, 94, 0.16)',
              lossFill: 'rgba(239, 68, 68, 0.16)',
            },
            equityBaseline: {
              value: props.initialEquity,
              color: profitColor,
            },
            title: {
              display: true,
              align: 'start',
              text: 'Equity Curve - Weekly Candlestick',
              color: textColor,
              font: {
                size: 16,
                weight: '700',
              },
              padding: {
                bottom: 18,
              },
            },
            tooltip: {
              backgroundColor: 'rgba(30, 36, 66, 0.95)',
              titleColor: '#f9fafb',
              bodyColor: '#d1d5db',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                title: (items) => candles[items[0].dataIndex]?.label || '',
                label: (context) => {
                  const candle = candles[context.dataIndex];
                  return [
                    `Open: ${formatCurrency(candle.open)}`,
                    `High: ${formatCurrency(candle.high)}`,
                    `Low: ${formatCurrency(candle.low)}`,
                    `Close: ${formatCurrency(candle.close)}`,
                    `Weekly PnL: ${formatCurrency(candle.pnl)}`,
                    `Trades: ${candle.tradeCount}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                color: gridColor,
                drawBorder: false,
              },
              ticks: {
                color: textColor,
                maxRotation: 0,
                autoSkip: true,
                autoSkipPadding: 28,
                callback(value, index) {
                  const candle = candles[index];
                  if (!candle) return '';
                  const previous = candles[index - 1];
                  if (!previous || candle.weekStart.getMonth() !== previous.weekStart.getMonth()) {
                    return candle.weekStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  }
                  return '';
                },
              },
            },
            y: {
              min: minValue - padding,
              max: maxValue + padding,
              title: {
                display: true,
                text: 'Equity ($)',
                color: textColor,
                font: {
                  size: 13,
                  weight: '600',
                },
              },
              grid: {
                color: gridColor,
                drawBorder: false,
              },
              ticks: {
                color: textColor,
                callback: (value) => `$${value}`,
              },
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
        },
      });
    };

    onMounted(createChart);
    watch(() => props.trades, createChart, { deep: true });
    watch(() => props.initialEquity, createChart);
    onBeforeUnmount(() => {
      if (chartInstance) chartInstance.destroy();
    });

    return {
      chartCanvas,
      hasChartData,
    };
  },
};
</script>

<style scoped>
.weekly-equity-candlestick {
  position: relative;
  width: 100%;
  min-height: 360px;
}

.empty-chart-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
