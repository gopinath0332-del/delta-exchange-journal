<template>
  <div class="mae-mfe-chart">
    <canvas v-show="hasChartData" ref="chartCanvas"></canvas>
    <div v-if="!hasChartData" class="empty-chart-state">
      No MAE / MFE data available
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { getTradePnL } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

Chart.register(...registerables);

const formatPercent = (value) => `${value.toFixed(Math.abs(value) >= 10 ? 0 : 1)}%`;

const niceMax = (value) => {
  if (!Number.isFinite(value) || value <= 0) return 10;

  const padded = value * 1.08;
  const exponent = Math.floor(Math.log10(padded));
  const fraction = padded / Math.pow(10, exponent);
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;

  return niceFraction * Math.pow(10, exponent);
};

export default {
  name: 'MaeMfeChart',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;

    const chartTrades = computed(() =>
      props.trades
        .filter((trade) => trade.status === 'CLOSED' || trade.status === 'PARTIAL_CLOSED')
        .map((trade) => {
          const mae = Math.abs(Number(trade.mae_pct));
          const mfe = Math.abs(Number(trade.mfe_pct));
          const pnl = getTradePnL(trade);

          return {
            x: mfe,
            y: mae,
            pnl,
            symbol: trade.symbol || 'Unknown',
            strategy: trade.strategy_name || 'Unknown',
          };
        })
        .filter((trade) => Number.isFinite(trade.x) && Number.isFinite(trade.y))
    );

    const hasChartData = computed(() => chartTrades.value.length > 0);

    const createChart = () => {
      if (!chartCanvas.value) return;

      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      if (!hasChartData.value) return;

      const styles = getComputedStyle(document.documentElement);
      const profitColor = styles.getPropertyValue('--color-profit').trim() || '#22c55e';
      const lossColor = styles.getPropertyValue('--color-loss').trim() || '#ef4444';
      const textColor = styles.getPropertyValue('--color-text-secondary').trim() || '#d1d5db';
      const gridColor = 'rgba(255, 255, 255, 0.06)';
      const referenceColor = 'rgba(209, 213, 219, 0.75)';
      const trades = chartTrades.value;
      const maxValue = niceMax(Math.max(...trades.map((trade) => Math.max(trade.x, trade.y))));
      const winners = trades.filter((trade) => trade.pnl > 0);
      const losers = trades.filter((trade) => trade.pnl <= 0);

      chartInstance = new Chart(chartCanvas.value.getContext('2d'), {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Winners',
              data: winners,
              backgroundColor: profitColor,
              borderColor: profitColor,
              borderWidth: 1,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              label: 'Losers',
              data: losers,
              backgroundColor: lossColor,
              borderColor: lossColor,
              borderWidth: 1,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              type: 'line',
              label: 'MFE = MAE',
              data: [
                { x: 0, y: 0 },
                { x: maxValue, y: maxValue },
              ],
              borderColor: referenceColor,
              borderDash: [10, 8],
              borderWidth: 1.5,
              pointRadius: 0,
              pointHoverRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2.6,
          parsing: false,
          plugins: {
            legend: {
              align: 'end',
              labels: {
                color: textColor,
                usePointStyle: true,
                boxWidth: 8,
                boxHeight: 8,
              },
            },
            title: {
              display: true,
              align: 'start',
              text: 'MAE / MFE Scatter Plot',
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
              filter: (item) => item.dataset.label !== 'MFE = MAE',
              callbacks: {
                title: (items) => items[0]?.raw?.symbol || '',
                label: (context) => {
                  const trade = context.raw;
                  return [
                    `MFE: ${formatPercent(trade.x)}`,
                    `MAE: ${formatPercent(trade.y)}`,
                    `PnL: ${formatCurrency(trade.pnl)}`,
                    `Strategy: ${trade.strategy}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              min: 0,
              max: maxValue,
              title: {
                display: true,
                text: 'MFE % (best unrealised profit during trade)',
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
                callback: (value) => formatPercent(value),
              },
            },
            y: {
              min: 0,
              max: maxValue,
              title: {
                display: true,
                text: 'MAE % (worst adverse move during trade)',
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
                callback: (value) => formatPercent(value),
              },
            },
          },
        },
      });
    };

    onMounted(createChart);
    watch(() => props.trades, createChart, { deep: true });
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
.mae-mfe-chart {
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
