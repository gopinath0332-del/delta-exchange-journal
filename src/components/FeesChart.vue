<template>
  <div class="fees-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { calculateDailyFeesMap } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

Chart.register(...registerables);

export default {
  name: 'FeesChart',
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

      if (chartInstance) {
        chartInstance.destroy();
      }

      const dailyFeesMap = calculateDailyFeesMap(props.trades);
      const sortedDates = Object.keys(dailyFeesMap).sort();

      if (sortedDates.length === 0) {
        return;
      }

      const labels = sortedDates.map(date => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      const data = sortedDates.map(date => dailyFeesMap[date]);

      // Calculate cumulative fees for the line chart
      let cumulativeSum = 0;
      const cumulativeData = data.map(val => {
        cumulativeSum += val;
        return cumulativeSum;
      });

      const ctx = chartCanvas.value.getContext('2d');

      chartInstance = new Chart(ctx, {
        data: {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Cumulative Fees',
              data: cumulativeData,
              borderColor: '#a5b4fc', // Indigo-300
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0.1,
              yAxisID: 'yCumulative',
            },
            {
              type: 'bar',
              label: 'Daily Fees',
              data,
              backgroundColor: '#6366f1', // Indigo-500
              borderColor: '#4f46e5',
              borderWidth: 1,
              borderRadius: 4,
              yAxisID: 'yDaily',
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
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  return `${label}: ${formatCurrency(value)}`;
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
            yDaily: {
              type: 'linear',
              display: true,
              position: 'left',
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: '#9ca3af',
                callback: (value) => `$${value}`,
              },
            },
            yCumulative: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: {
                drawOnChartArea: false,
              },
              ticks: {
                color: '#9ca3af',
                callback: (value) => `$${value}`,
              },
            },
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
.fees-chart {
  width: 100%;
  min-height: 300px;
}
</style>
