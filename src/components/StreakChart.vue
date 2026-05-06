<template>
  <div class="streak-distribution-container">
    <div class="chart-wrapper">
      <canvas ref="chartRef"></canvas>
    </div>
    <div class="streak-summary">
      <div class="summary-item">
        <span class="label">Avg Win Streak</span>
        <span class="value profit">{{ avgWinStreak.toFixed(1) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">Avg Loss Streak</span>
        <span class="value loss">{{ avgLossStreak.toFixed(1) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import Chart from 'chart.js/auto';
import { calculateStreakDistribution } from '../utils/calculations';

export default {
  name: 'StreakDistributionChart',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const chartRef = ref(null);
    let chart = null;

    const distribution = computed(() => calculateStreakDistribution(props.trades));

    const avgWinStreak = computed(() => {
      const wins = distribution.value.win;
      const totalStreaks = Object.values(wins).reduce((a, b) => a + b, 0);
      if (totalStreaks === 0) return 0;
      const weightedSum = Object.entries(wins).reduce((sum, [len, count]) => sum + (Number(len) * count), 0);
      return weightedSum / totalStreaks;
    });

    const avgLossStreak = computed(() => {
      const losses = distribution.value.loss;
      const totalStreaks = Object.values(losses).reduce((a, b) => a + b, 0);
      if (totalStreaks === 0) return 0;
      const weightedSum = Object.entries(losses).reduce((sum, [len, count]) => sum + (Number(len) * count), 0);
      return weightedSum / totalStreaks;
    });

    const renderChart = () => {
      if (!chartRef.value) return;
      if (chart) chart.destroy();

      const dist = distribution.value;
      const winLengths = Object.keys(dist.win).map(Number);
      const lossLengths = Object.keys(dist.loss).map(Number);
      const maxLen = Math.max(0, ...winLengths, ...lossLengths);

      if (maxLen === 0) return;

      const labels = Array.from({ length: maxLen }, (_, i) => `${i + 1} Trades`);
      const winData = Array.from({ length: maxLen }, (_, i) => dist.win[i + 1] || 0);
      const lossData = Array.from({ length: maxLen }, (_, i) => dist.loss[i + 1] || 0);

      const ctx = chartRef.value.getContext('2d');

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Winning Streaks',
              data: winData,
              backgroundColor: 'rgba(34, 197, 94, 0.6)',
              borderColor: '#22c55e',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Losing Streaks',
              data: lossData,
              backgroundColor: 'rgba(239, 68, 68, 0.6)',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#94a3b8', boxWidth: 12, padding: 20 }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#94a3b8',
              bodyColor: '#fff',
              padding: 12,
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', stepSize: 1 },
              title: { display: true, text: 'Frequency (Count)', color: '#94a3b8', font: { size: 10 } }
            }
          }
        }
      });
    };

    onMounted(() => renderChart());
    watch(() => props.trades, () => renderChart(), { deep: true });
    onBeforeUnmount(() => { if (chart) chart.destroy(); });

    return { chartRef, avgWinStreak, avgLossStreak };
  },
};
</script>

<style scoped>
.streak-distribution-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.chart-wrapper {
  width: 100%;
  height: 250px;
}

.streak-summary {
  display: flex;
  justify-content: space-around;
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-md);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-item .label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

.summary-item .value {
  font-size: var(--font-size-xl);
  font-weight: 700;
}
</style>
