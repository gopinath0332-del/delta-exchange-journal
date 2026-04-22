<template>
  <div class="pnl-chart">
    <div class="chart-header">
      <div class="filters-row">
        <div class="filter-group">
          <label for="monthFilter">Month</label>
          <select v-model="selectedMonth" id="monthFilter" class="select select-sm">
            <option v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
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

    const selectedMonth = ref('all');

    const months = computed(() => {
      const activeMonths = new Set();

      props.trades.forEach(trade => {
        const date = trade.entry_timestamp?.toDate?.() || new Date(trade.entry_timestamp);
        // Note: props.trades is already filtered by year from Dashboard.vue
        activeMonths.add(date.getMonth());
      });

      const result = [];
      for (let i = 0; i < 12; i++) {
        if (activeMonths.has(i)) {
          const d = new Date(2000, i, 1);
          result.push({
            value: String(i + 1).padStart(2, '0'),
            label: d.toLocaleDateString('en-US', { month: 'long' })
          });
        }
      }
      return result;
    });

    // Effect to handle default month selection based on current date and data availability
    watch([() => props.trades], () => {
      const now = new Date();
      const currentMonthVal = String(now.getMonth() + 1).padStart(2, '0');

      // 2. Handle Month Default
      const hasCurrentMonth = months.value.some(m => m.value === currentMonthVal);

      if (hasCurrentMonth) {
        selectedMonth.value = currentMonthVal;
      } else if (months.value.length > 0) {
        selectedMonth.value = months.value[months.value.length - 1].value;
      } else {
        selectedMonth.value = 'all';
      }
    }, { immediate: true });

    const filteredTrades = computed(() => {
      return props.trades.filter(trade => {
        const month = String((trade.entry_timestamp?.toDate?.() || new Date(trade.entry_timestamp)).getMonth() + 1).padStart(2, '0');
        const matchMonth = selectedMonth.value === 'all' || month === selectedMonth.value;
        return matchMonth;
      });
    });

    const createChart = () => {
      if (!chartCanvas.value) return;

      if (chartInstance) {
        chartInstance.destroy();
      }

      const cumulativeData = calculateCumulativePnL(filteredTrades.value);

      if (cumulativeData.length === 0) {
        // Optionally clear the canvas or show "No Data"
        return;
      }

      // Only display labels for months that actually have data
      const labels = cumulativeData.map((d) =>
        d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );
      const data = cumulativeData.map((d) => d.cumulativePnL);

      const finalPnL = data[data.length - 1] || 0;
      const lineColor = finalPnL >= 0 ? '#22c55e' : '#ef4444';
      const gradientColor = finalPnL >= 0
        ? 'rgba(34, 197, 94, 0.2)'
        : 'rgba(239, 68, 68, 0.2)';

      const ctx = chartCanvas.value.getContext('2d');

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

    watch([() => props.trades, selectedMonth], () => {
      createChart();
    });

    return {
      chartCanvas,
      selectedMonth,
      months,
    };
  },
};
</script>

<style scoped>
.pnl-chart {
  width: 100%;
  min-height: 300px;
}

.chart-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

.filters-row {
  display: flex;
  gap: var(--spacing-md);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-group label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.select-sm {
  padding: 4px 8px;
  font-size: var(--font-size-xs);
}
</style>
