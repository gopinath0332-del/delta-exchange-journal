<template>
  <div class="pnl-breakdown">
    <div v-if="showMonthFilter" class="chart-header">
      <div class="filters-row">
        <div class="filter-group">
          <label for="monthFilter">Month</label>
          <select v-model="selectedMonth" id="monthFilter" class="select select-sm">
            <option value="all">Entire Year</option>
            <option v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="symbol-list-container">
      <div v-if="symbolStats.length === 0" class="text-muted text-center py-xl">
        No symbol data available
      </div>
      <div v-else class="symbol-list">
        <div v-for="(stat, index) in symbolStats" :key="stat.symbol" class="symbol-row">
          <div class="symbol-info">
            <span class="rank-badge">{{ index + 1 }}</span>
            <span class="symbol-name">{{ stat.symbol }}</span>
            <span class="trade-count">({{ stat.tradeCount }} trades)</span>
          </div>
          <div class="bar-track">
            <div 
              class="bar-fill" 
              :class="stat.pnl >= 0 ? 'profit-bg' : 'loss-bg'"
              :style="{ width: `${(Math.abs(stat.pnl) / maxAbsPnL) * 100}%` }"
            >
              <span class="bar-text">{{ formatCurrency(stat.pnl) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { calculatePnLBySymbol } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

export default {
  name: 'PnLBreakdown',
  props: {
    trades: {
      type: Array,
      required: true,
    },
    showMonthFilter: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
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
      if (!props.showMonthFilter) {
        selectedMonth.value = 'all';
        return;
      }

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

    const symbolStats = computed(() => {
      const data = calculatePnLBySymbol(filteredTrades.value);
      // Sort by positive PnL (green) first, then negative PnL (red), keeping absolute PnL descending within groups
      return data.sort((a, b) => {
        const aIsPositive = a.pnl >= 0;
        const bIsPositive = b.pnl >= 0;
        
        if (aIsPositive !== bIsPositive) {
          return aIsPositive ? -1 : 1;
        }
        
        return Math.abs(b.pnl) - Math.abs(a.pnl);
      });
    });

    const maxAbsPnL = computed(() => {
      if (symbolStats.value.length === 0) return 1; // avoid division by zero
      return Math.max(...symbolStats.value.map(s => Math.abs(s.pnl)));
    });

    return { 
      selectedMonth, 
      months, 
      symbolStats, 
      maxAbsPnL, 
      formatCurrency 
    };
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

/* Custom Symbol List UI */
.symbol-list-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

.symbol-list-container::-webkit-scrollbar {
  width: 6px;
}
.symbol-list-container::-webkit-scrollbar-thumb {
  background-color: var(--glass-border);
  border-radius: 4px;
}

.symbol-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.symbol-info {
  display: flex;
  align-items: center;
  width: 220px; /* fixed width for labels */
  flex-shrink: 0;
}

.rank-badge {
  background: #3b82f6; /* Blue badge */
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.symbol-name {
  font-weight: 700;
  color: var(--color-text-primary);
  margin-right: 8px;
  font-size: 13px;
  white-space: nowrap;
}

.trade-count {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.bar-track {
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.05);
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 6px;
  min-width: fit-content;
  transition: width 0.5s ease-out;
}

.profit-bg {
  background: #10b981; /* Green */
}

.loss-bg {
  background: #ef4444; /* Red */
}

.bar-text {
  color: white;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .symbol-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .symbol-info {
    width: 100%;
    margin-bottom: 6px;
  }
  .bar-track {
    width: 100%;
  }
}
</style>
