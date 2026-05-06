<template>
  <div class="monthly-breakdown">
    <div class="table-container">
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Trades</th>
            <th>PnL</th>
            <th>Win Rate</th>
            <th>Avg PnL</th>
            <th>R:R</th>
            <th>Funding</th>
            <th>Fees</th>
            <th>W/L</th>
          </tr>
        </thead>
        <tbody >
          <tr v-for="month in data.filter(m => m.tradeCount > 0)" :key="month.month" :class="{ 'month-empty': month.tradeCount === 0 }">
            <td class="font-medium">{{ month.month }}</td>
            <td>{{ month.tradeCount }}</td>
            <td :class="month.pnl >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(month.pnl) }}
            </td>
            <td>{{ formatPercentage(month.winRate) }}</td>
            <td :class="month.avgPnL >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(month.avgPnL) }}
            </td>
            <td>{{ month.rrRatio.toFixed(2) }}</td>
            <td>{{ formatCurrency(month.funding) }}</td>
            <td>{{ formatCurrency(month.fees) }}</td>
            <td>
              <span class="win-count">{{ month.wins }}</span>
              <span class="separator">/</span>
              <span class="loss-count">{{ month.losses }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default {
  name: 'MonthlyBreakdownCard',
  props: {
    data: {
      type: Array,
      required: true,
    },
  },
  setup() {
    return {
      formatCurrency,
      formatPercentage,
    };
  },
};
</script>

<style scoped>
.monthly-breakdown {
  width: 100%;
}

.table-container {
  overflow-x: auto;
  width: 100%;
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  color: var(--color-text-primary);
}

.breakdown-table th {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

.breakdown-table td {
  padding: var(--spacing-md) var(--spacing-md);
  font-size: var(--font-size-sm);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.text-center {
  text-align: center;
}

.font-medium {
  font-weight: 500;
}

.profit {
  color: var(--color-profit) !important;
}

.loss {
  color: var(--color-loss) !important;
}

.month-empty {
  opacity: 0.5;
}

.win-count {
  color: var(--color-success);
  font-weight: 600;
}

.loss-count {
  color: var(--color-danger);
  font-weight: 600;
}

.separator {
  margin: 0 2px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .breakdown-table td, .breakdown-table th {
    padding: var(--spacing-sm) var(--spacing-xs);
    font-size: var(--font-size-xs);
  }
}
</style>
