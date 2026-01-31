<template>
  <div class="time-analysis">
    <div class="charts-grid">
      <!-- Day of Week Chart -->
      <div class="glass-card p-xl">
        <h3 class="mb-md">Performance by Day</h3>
        <div class="chart-container">
          <canvas ref="dayChartCanvas"></canvas>
        </div>
      </div>

      <!-- Hour of Day Chart -->
      <div class="glass-card p-xl">
        <h3 class="mb-md">Performance by Hour</h3>
        <div class="chart-container">
          <canvas ref="hourChartCanvas"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { calculateTimeBasedPerformance } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

Chart.register(...registerables);

export default {
  name: 'TimeAnalysis',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const dayChartCanvas = ref(null);
    const hourChartCanvas = ref(null);
    let dayChartInstance = null;
    let hourChartInstance = null;

    const createCharts = () => {
      if (!props.trades.length) return;

      const { byDay, byHour } = calculateTimeBasedPerformance(props.trades);

      // --- Create Day Chart ---
      if (dayChartCanvas.value) {
        if (dayChartInstance) dayChartInstance.destroy();
        
        const dayCtx = dayChartCanvas.value.getContext('2d');
        const dayColors = byDay.map(d => d.pnl >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)');
        const dayBorderColors = byDay.map(d => d.pnl >= 0 ? '#22c55e' : '#ef4444');

        dayChartInstance = new Chart(dayCtx, {
          type: 'bar',
          data: {
            labels: byDay.map(d => d.name.substring(0, 3)), // Mon, Tue, etc.
            datasets: [{
              label: 'Net PnL',
              data: byDay.map(d => d.pnl),
              backgroundColor: dayColors,
              borderColor: dayBorderColors,
              borderWidth: 1,
              borderRadius: 4,
            }]
          },
          options: getChartOptions('Day'),
        });
      }

      // --- Create Hour Chart ---
      if (hourChartCanvas.value) {
        if (hourChartInstance) hourChartInstance.destroy();

        const hourCtx = hourChartCanvas.value.getContext('2d');
        const hourColors = byHour.map(h => h.pnl >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)');
        const hourBorderColors = byHour.map(h => h.pnl >= 0 ? '#22c55e' : '#ef4444');

        hourChartInstance = new Chart(hourCtx, {
          type: 'bar',
          data: {
            labels: byHour.map(h => h.hour), // 0, 1, 2...
            datasets: [{
              label: 'Net PnL',
              data: byHour.map(h => h.pnl),
              backgroundColor: hourColors,
              borderColor: hourBorderColors,
              borderWidth: 1,
              borderRadius: 2,
            }]
          },
          options: getChartOptions('Hour'),
        });
      }
    };

    const getChartOptions = (type) => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30, 36, 66, 0.95)',
          titleColor: '#f9fafb',
          bodyColor: '#d1d5db',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (items) => {
              if (type === 'Hour') return `${items[0].label}:00 - ${items[0].label}:59`;
              return items[0].label;
            },
            label: (context) => {
              const val = context.parsed.y;
              return `PnL: ${formatCurrency(val)}`;
            },
            afterLabel: (context) => {
              // We need access to the original data objects for more info
              // But indexing matches, so we can access via index if scope allows, 
              // or just keep it simple for now. 
              // To enable accessing total trades/winrate, we'd need to pass arrays in scope.
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#9ca3af' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { 
            color: '#9ca3af',
            callback: (val) => val >= 1000 || val <= -1000 ? `${val/1000}k` : val
          }
        }
      }
    });

    onMounted(createCharts);
    watch(() => props.trades, createCharts, { deep: true });

    return { dayChartCanvas, hourChartCanvas };
  },
};
</script>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
}

.chart-container {
  height: 250px;
  width: 100%;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
