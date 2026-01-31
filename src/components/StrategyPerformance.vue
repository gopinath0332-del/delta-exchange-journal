<template>
  <div class="strategy-performance">
    <canvas ref="chartCanvas"></canvas>

    <!-- Strategy Stats Table -->
    <div class="strategy-stats mt-lg">
      <div v-for="(stats, name) in strategyStats" :key="name" class="strategy-stat-row">
        <div class="strategy-name">{{ name }}</div>
        <div class="strategy-metrics">
          <span class="metric">{{ stats.totalTrades }} trades</span>
          <span class="metric" :class="stats.totalPnL >= 0 ? 'profit' : 'loss'">
            {{ formatCurrency(stats.totalPnL) }}
          </span>
          <span class="metric profit">{{ formatPercentage(stats.winRate) }} win rate</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { calculateStrategyStats } from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/formatters';

Chart.register(...registerables);

export default {
  name: 'StrategyPerformance',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;

    const strategyStats = computed(() => calculateStrategyStats(props.trades));

    const createChart = () => {
      if (!chartCanvas.value || Object.keys(strategyStats.value).length === 0) return;

      // Destroy existing chart
      if (chartInstance) {
        chartInstance.destroy();
      }

      const strategies = Object.keys(strategyStats.value);
      const pnlData = strategies.map((name) => strategyStats.value[name].totalPnL);

      // Create color array based on PnL
      const backgroundColors = pnlData.map((pnl) =>
        pnl >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
      );
      const borderColors = pnlData.map((pnl) =>
        pnl >= 0 ? '#22c55e' : '#ef4444'
      );

      const ctx = chartCanvas.value.getContext('2d');

      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: strategies,
          datasets: [
            {
              label: 'Total PnL',
              data: pnlData,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 2,
              borderRadius: 8,
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
              callbacks: {
                label: (context) => {
                  const strategyName = context.label;
                  const stats = strategyStats.value[strategyName];
                  return [
                    `PnL: $${stats.totalPnL.toFixed(2)}`,
                    `Trades: ${stats.totalTrades}`,
                    `Win Rate: ${stats.winRate.toFixed(2)}%`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                color: '#9ca3af',
                maxRotation: 45,
                minRotation: 0,
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
      strategyStats,
      formatCurrency,
      formatPercentage,
    };
  },
};
</script>

<style scoped>
.strategy-performance {
  width: 100%;
}

.strategy-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.strategy-stat-row {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
}

.strategy-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.strategy-metrics {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.metric {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
