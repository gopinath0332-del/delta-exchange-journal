<template>
  <div class="pnl-breakdown">
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
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { calculatePnLBySymbol } from '../utils/calculations';

Chart.register(...registerables);

export default {
  name: 'PnLBreakdown',
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

    watch([() => props.trades], () => {
      const now = new Date();
      const currentMonthVal = String(now.getMonth() + 1).padStart(2, '0');
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
        const date = trade.entry_timestamp?.toDate?.() || new Date(trade.entry_timestamp);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return selectedMonth.value === 'all' || month === selectedMonth.value;
      });
    });

    const createChart = () => {
      if (!chartCanvas.value) return;
      if (chartInstance) chartInstance.destroy();

      const symbolData = calculatePnLBySymbol(filteredTrades.value);
      if (symbolData.length === 0) return;

      const labels = symbolData.map(d => d.symbol);
      const values = symbolData.map(d => d.pnl);

      const ctx = chartCanvas.value.getContext('2d');

      // Generate distinct colors for symbols
      const colors = labels.map((_, i) => `hsla(${i * (360 / labels.length)}, 70%, 60%, 0.8)`);

      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#9ca3af',
                font: { size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed;
                  return `PnL: $${value.toFixed(2)}`;
                }
              }
            }
          }
        }
      });
    };

    onMounted(createChart);
    watch([() => props.trades, selectedMonth], createChart);

    return { chartCanvas, selectedMonth, months };
  },
};
</script>

<style scoped>
.pnl-breakdown {
  width: 100%;
  height: 100%;
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
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}
</style>
