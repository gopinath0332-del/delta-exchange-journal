<template>
  <div class="symbol-performance-table">
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              @click="toggleSort(col.key)"
              class="sortable-th"
              :class="{ 'sorted': sortKey === col.key }"
            >
              <span class="th-content">
                {{ col.label }}
                <span class="sort-icon">
                  <span v-if="sortKey === col.key">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
                  <span v-else class="sort-icon-idle">⇅</span>
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedStats.length === 0">
            <td colspan="10" class="empty-state">
              <div class="empty-state-content">
                <span class="empty-icon">📊</span>
                <p class="empty-text">No symbol performance data available for this period.</p>
              </div>
            </td>
          </tr>
          <tr v-else v-for="stat in sortedStats" :key="stat.symbol">
            <td>
              <span class="symbol-badge">{{ stat.symbol }}</span>
            </td>
            <td class="font-medium">{{ stat.tradeCount }}</td>
            <td :class="stat.winRate >= 50 ? 'profit' : 'loss'">
              {{ formatPercentage(stat.winRate) }}
            </td>
            <td :class="stat.avgPnL >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(stat.avgPnL) }}
            </td>
            <td :class="stat.pnl >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(stat.pnl) }}
            </td>
            <td class="loss">
              {{ formatCurrency(stat.fees) }}
            </td>
            <td :class="stat.funding >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(stat.funding) }}
            </td>
            <td :class="getProfitFactorClass(stat.profitFactor)">
              {{ formatRatio(stat.profitFactor) }}
            </td>
            <td :class="stat.bestTrade >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(stat.bestTrade) }}
            </td>
            <td :class="stat.worstTrade >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(stat.worstTrade) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { calculatePnLBySymbol } from '../utils/calculations';
import { formatCurrency, formatPercentage, formatRatio } from '../utils/formatters';

export default {
  name: 'SymbolPerformanceTable',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const sortKey = ref('pnl');
    const sortDir = ref('desc');

    const columns = [
      { key: 'symbol', label: 'Symbol' },
      { key: 'tradeCount', label: 'Trades' },
      { key: 'winRate', label: 'Win Rate' },
      { key: 'avgPnL', label: 'Avg PnL' },
      { key: 'pnl', label: 'Total PnL' },
      { key: 'fees', label: 'Fees' },
      { key: 'funding', label: 'Funding' },
      { key: 'profitFactor', label: 'Profit Factor' },
      { key: 'bestTrade', label: 'Best Trade' },
      { key: 'worstTrade', label: 'Worst Trade' },
    ];

    const toggleSort = (key) => {
      if (sortKey.value === key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey.value = key;
        // Default to descending for numeric columns, ascending for symbol
        sortDir.value = key === 'symbol' ? 'asc' : 'desc';
      }
    };

    const sortedStats = computed(() => {
      const stats = calculatePnLBySymbol(props.trades);
      const key = sortKey.value;
      const dir = sortDir.value === 'asc' ? 1 : -1;

      return stats.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        // Handle Infinity for profitFactor (treat as very large number)
        if (valA === Infinity) valA = Number.MAX_VALUE;
        if (valB === Infinity) valB = Number.MAX_VALUE;
        if (valA === null || valA === undefined) valA = -Number.MAX_VALUE;
        if (valB === null || valB === undefined) valB = -Number.MAX_VALUE;

        // String comparison for symbol
        if (key === 'symbol') {
          return dir * String(valA).localeCompare(String(valB));
        }

        return dir * (valA - valB);
      });
    });

    const getProfitFactorClass = (value) => {
      if (value === null || value === undefined) return 'neutral';
      if (value === Infinity || value >= 1.5) return 'profit';
      if (value >= 1.0) return 'neutral';
      return 'loss';
    };

    return {
      columns,
      sortKey,
      sortDir,
      toggleSort,
      sortedStats,
      formatCurrency,
      formatPercentage,
      formatRatio,
      getProfitFactorClass,
    };
  },
};
</script>

<style scoped>
.symbol-performance-table {
  width: 100%;
}

.table-container {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--glass-shadow);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background: var(--color-bg-tertiary);
  padding: var(--spacing-md);
  text-align: left;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.75px;
  border-bottom: 2px solid var(--glass-border);
  font-weight: 700;
}

.sortable-th {
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast), background-color var(--transition-fast);
  white-space: nowrap;
}

.sortable-th:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.sortable-th.sorted {
  color: var(--color-primary-light);
}

.th-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sort-icon {
  font-size: 0.7rem;
  line-height: 1;
  flex-shrink: 0;
}

.sort-icon-idle {
  opacity: 0.3;
  transition: opacity var(--transition-fast);
}

.sortable-th:hover .sort-icon-idle {
  opacity: 0.7;
}

.table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  vertical-align: middle;
  transition: background-color var(--transition-fast);
}

.table tr {
  transition: transform var(--transition-fast), background-color var(--transition-fast);
}

.table tbody tr:not(.empty-state):hover {
  background: var(--color-surface-hover);
  transform: translateY(-1px);
}

.table tr:last-child td {
  border-bottom: none;
}

.font-medium {
  font-weight: 500;
}

.symbol-badge {
  background: rgba(102, 126, 234, 0.12);
  border: 1px solid rgba(102, 126, 234, 0.25);
  padding: 4px 10px;
  border-radius: var(--radius-md);
  color: var(--color-primary-light);
  font-weight: 700;
  font-family: var(--font-family);
  letter-spacing: 0.5px;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.light-theme .symbol-badge {
  background: rgba(102, 126, 234, 0.08);
  border-color: rgba(102, 126, 234, 0.2);
  color: var(--color-primary-dark);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl) !important;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.empty-icon {
  font-size: var(--font-size-3xl);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  animation: pulse 2s infinite ease-in-out;
}

.empty-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: 500;
  margin: 0;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .table {
    font-size: var(--font-size-xs);
  }
  .table th, .table td {
    padding: var(--spacing-sm);
  }
}
</style>
