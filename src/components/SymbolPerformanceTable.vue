<template>
  <div class="symbol-performance-table">
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Trades</th>
            <th>Win Rate</th>
            <th>Avg PnL</th>
            <th>Total PnL</th>
            <th>Profit Factor</th>
            <th>Best Trade</th>
            <th>Worst Trade</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in sortedStats" :key="stat.symbol">
            <td class="font-bold">{{ stat.symbol }}</td>
            <td>{{ stat.tradeCount }}</td>
            <td :class="stat.winRate >= 50 ? 'profit' : 'loss'">
              {{ formatPercentage(stat.winRate) }}
            </td>
            <td :class="stat.avgPnL >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(stat.avgPnL) }}
            </td>
            <td :class="stat.pnl >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(stat.pnl) }}
            </td>
            <td>{{ stat.profitFactor.toFixed(2) }}</td>
            <td class="profit">{{ formatCurrency(stat.bestTrade) }}</td>
            <td class="loss">{{ formatCurrency(stat.worstTrade) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { calculatePnLBySymbol } from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default {
  name: 'SymbolPerformanceTable',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const sortedStats = computed(() => {
      const stats = calculatePnLBySymbol(props.trades);
      // Sort by Total PnL descending
      return stats.sort((a, b) => b.pnl - a.pnl);
    });

    return {
      sortedStats,
      formatCurrency,
      formatPercentage,
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
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
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
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--glass-border);
}

.table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.table tr:last-child td {
  border-bottom: none;
}

.font-bold {
  font-weight: 700;
}

@media (max-width: 1024px) {
  .table {
    font-size: var(--font-size-xs);
  }
}
</style>
