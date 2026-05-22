<template>
  <div class="pnl-distribution-chart">
    <canvas v-show="hasDistributionData" ref="chartCanvas"></canvas>
    <div v-if="!hasDistributionData" class="empty-chart-state">
      No return percentage data available
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const markerPlugin = {
  id: 'pnlDistributionMarkers',
  afterDatasetsDraw(chart, _args, options) {
    const markers = options.markers || [];
    const xScale = chart.scales.x;
    const { ctx, chartArea } = chart;

    markers.forEach((marker) => {
      if (!Number.isFinite(marker.value)) return;
      if (marker.value < xScale.min || marker.value > xScale.max) return;

      const x = xScale.getPixelForValue(marker.value);
      const y = chartArea.bottom - 8;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = marker.color;
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textBaseline = 'middle';
      const textWidth = ctx.measureText(marker.label).width;
      const paddingX = 5;
      const labelX = marker.align === 'right'
        ? Math.max(chartArea.left + paddingX, x - textWidth - paddingX)
        : Math.min(chartArea.right - textWidth - paddingX, x + paddingX);

      ctx.fillStyle = marker.backgroundColor;
      ctx.fillRect(labelX - 3, y - 8, textWidth + 6, 16);
      ctx.fillStyle = marker.color;
      ctx.fillText(marker.label, labelX, y);
      ctx.restore();
    });
  },
};

Chart.register(markerPlugin);

const niceStep = (rawStep) => {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 10;

  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, exponent);
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;

  return niceFraction * Math.pow(10, exponent);
};

const formatPercent = (value) => `${value.toFixed(Math.abs(value) >= 10 ? 0 : 1)}%`;

export default {
  name: 'PnLDistributionChart',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;

    const returns = computed(() =>
      props.trades
        .filter((trade) => trade.status === 'CLOSED' || trade.status === 'PARTIAL_CLOSED')
        .map((trade) => Number(trade.pnl_percentage))
        .filter((value) => Number.isFinite(value))
    );

    const hasDistributionData = computed(() => returns.value.length > 0);

    const distribution = computed(() => {
      if (!hasDistributionData.value) {
        return {
          bins: [],
          min: 0,
          max: 0,
          binSize: 10,
          avgLoss: null,
          avgProfit: null,
        };
      }

      const values = returns.value;
      const losses = values.filter((value) => value < 0);
      const profits = values.filter((value) => value > 0);
      const avgLoss = losses.length
        ? losses.reduce((sum, value) => sum + value, 0) / losses.length
        : null;
      const avgProfit = profits.length
        ? profits.reduce((sum, value) => sum + value, 0) / profits.length
        : null;

      const minValue = Math.min(...values, avgLoss ?? 0, 0);
      const maxValue = Math.max(...values, avgProfit ?? 0, 0);
      const binSize = niceStep((maxValue - minValue || 10) / 10);
      let min = Math.floor(minValue / binSize) * binSize;
      let max = Math.ceil(maxValue / binSize) * binSize;
      if (min === max) {
        min -= binSize;
        max += binSize;
      }
      const binCount = Math.max(1, Math.round((max - min) / binSize));
      const bins = Array.from({ length: binCount }, (_, index) => {
        const start = min + index * binSize;
        const end = start + binSize;

        return {
          start,
          end,
          center: start + binSize / 2,
          count: 0,
        };
      });

      values.forEach((value) => {
        const rawIndex = Math.floor((value - min) / binSize);
        const index = Math.min(Math.max(rawIndex, 0), bins.length - 1);
        bins[index].count += 1;
      });

      return {
        bins,
        min,
        max,
        binSize,
        avgLoss,
        avgProfit,
      };
    });

    const createChart = () => {
      if (!chartCanvas.value) return;

      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      if (!hasDistributionData.value) return;

      const chartData = distribution.value;
      const styles = getComputedStyle(document.documentElement);
      const profitColor = styles.getPropertyValue('--color-profit').trim() || '#22c55e';
      const lossColor = styles.getPropertyValue('--color-loss').trim() || '#ef4444';
      const textColor = styles.getPropertyValue('--color-text-secondary').trim() || '#d1d5db';
      const gridColor = 'rgba(255, 255, 255, 0.06)';
      const cardBg = styles.getPropertyValue('--color-bg-primary').trim() || '#0a0e27';

      const markers = [
        chartData.avgLoss !== null
          ? {
              value: chartData.avgLoss,
              label: `Avg loss ${formatPercent(chartData.avgLoss)}`,
              color: lossColor,
              backgroundColor: cardBg,
              align: 'right',
            }
          : null,
        chartData.avgProfit !== null
          ? {
              value: chartData.avgProfit,
              label: `Avg profit ${formatPercent(chartData.avgProfit)}`,
              color: profitColor,
              backgroundColor: cardBg,
              align: 'left',
            }
          : null,
      ].filter(Boolean);

      chartInstance = new Chart(chartCanvas.value.getContext('2d'), {
        type: 'bar',
        data: {
          datasets: [
            {
              label: 'Number of trades',
              data: chartData.bins.map((bin) => ({
                x: bin.center,
                y: bin.count,
                start: bin.start,
                end: bin.end,
              })),
              backgroundColor: chartData.bins.map((bin) =>
                bin.end <= 0 ? lossColor : profitColor
              ),
              borderColor: chartData.bins.map((bin) =>
                bin.end <= 0 ? lossColor : profitColor
              ),
              borderWidth: 1,
              borderRadius: 2,
              barPercentage: 0.86,
              categoryPercentage: 0.9,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2.25,
          parsing: false,
          plugins: {
            legend: {
              display: false,
            },
            pnlDistributionMarkers: {
              markers,
            },
            title: {
              display: true,
              text: 'P&L Distribution',
              color: textColor,
              font: {
                size: 16,
                weight: '700',
              },
              padding: {
                bottom: 8,
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
                title: (items) => {
                  const raw = items[0]?.raw;
                  if (!raw) return '';
                  return `${formatPercent(raw.start)} to ${formatPercent(raw.end)}`;
                },
                label: (context) => `${context.raw.y} trades`,
              },
            },
          },
          scales: {
            x: {
              type: 'linear',
              min: chartData.min,
              max: chartData.max,
              offset: false,
              title: {
                display: true,
                text: 'Return %',
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
                stepSize: chartData.binSize,
                callback: (value) => formatPercent(value),
                maxRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of trades',
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
                precision: 0,
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
      hasDistributionData,
    };
  },
};
</script>

<style scoped>
.pnl-distribution-chart {
  position: relative;
  width: 100%;
  min-height: 320px;
}

.empty-chart-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
