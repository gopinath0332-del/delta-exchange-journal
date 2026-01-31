<template>
  <div class="pnl-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { calculateCumulativePnL } from '../utils/calculations';

Chart.register(...registerables);

export default {
  name: 'PnLChart',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;

    const createChart = () => {
      if (!chartCanvas.value) return;

      // Destroy existing chart
      if (chartInstance) {
        chartInstance.destroy();
      }

      // Calculate cumulative PnL
      const cumulativeData = calculateCumulativePnL(props.trades);

      if (cumulativeData.length === 0) {
        return;
      }

      // Prepare data for Chart.js
      const labels = cumulativeData.map((d) =>
        d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );
      const data = cumulativeData.map((d) => d.cumulativePnL);

      // Determine if overall PnL is positive or negative
      const finalPnL = data[data.length - 1] || 0;
      const lineColor = finalPnL >= 0 ? '#22c55e' : '#ef4444';
      const gradientColor = finalPnL >= 0
        ? 'rgba(34, 197, 94, 0.2)'
        : 'rgba(239, 68, 68, 0.2)';

      const ctx = chartCanvas.value.getContext('2d');

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, gradientColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Cumulative PnL',
              data,
              borderColor: lineColor,
              backgroundColor: gradient,
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: lineColor,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            legend: {
              display: false,
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
                label: (context) => {
                  const value = context.parsed.y;
                  return `PnL: $${value.toFixed(2)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: '#9ca3af',
                maxRotation: 0,
                autoSkipPadding: 20,
              },
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: '#9ca3af',
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

    onMounted(() => {
      createChart();
    });

    watch(
      () => props.trades,
      () => {
        createChart();
      },
      { deep: true }
    );

    return {
      chartCanvas,
    };
  },
};
</script>

<style scoped>
.pnl-chart {
  width: 100%;
  min-height: 300px;
}
</style>
