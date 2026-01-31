<template>
  <div class="trade-card" :class="{ compact: compact }">
    <div class="trade-header">
      <div class="trade-symbol">
        <h4>{{ trade.symbol }}</h4>
        <span class="badge" :class="`badge-${formatMode(trade.mode).className}`">
          {{ trade.mode }}
        </span>
      </div>
      <div class="trade-pnl" :class="pnlClass">
        {{ formattedPnL }}
      </div>
    </div>

    <div class="trade-details">
      <div class="detail-row">
        <span class="detail-label">Strategy</span>
        <span class="detail-value">{{ trade.strategy_name || 'N/A' }}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Entry</span>
        <span class="detail-value">
          <span :class="`side-${trade.entry_side}`">{{ trade.entry_side?.toUpperCase() }}</span>
          @ {{ formatCurrency(trade.entry_price, '') }}
        </span>
      </div>

      <div v-if="trade.status === 'CLOSED'" class="detail-row">
        <span class="detail-label">Exit</span>
        <span class="detail-value">
          <span :class="`side-${trade.exit_side}`">{{ trade.exit_side?.toUpperCase() }}</span>
          @ {{ formatCurrency(trade.exit_price, '') }}
        </span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Entry Time</span>
        <span class="detail-value">{{ formatDate(trade.entry_timestamp) }}</span>
      </div>

      <div v-if="trade.status === 'CLOSED'" class="detail-row">
        <span class="detail-label">Exit Time</span>
        <span class="detail-value">{{ formatDate(trade.exit_timestamp) }}</span>
      </div>

      <div v-if="!compact" class="detail-row">
        <span class="detail-label">Days Held</span>
        <span class="detail-value">{{ daysHeld }}</span>
      </div>

      <div v-if="!compact && trade.status === 'CLOSED'" class="detail-row">
        <span class="detail-label">PnL %</span>
        <span class="detail-value" :class="pnlClass">
          {{ formatPercentage(trade.pnl_percentage || 0) }}
        </span>
      </div>

      <div v-if="!compact" class="detail-row">
        <span class="detail-label">Fees</span>
        <span class="detail-value">{{ formatCurrency(trade.trading_fees || 0) }}</span>
      </div>

      <div v-if="!compact" class="detail-row">
        <span class="detail-label">Funding Charges</span>
        <span class="detail-value">{{ formatCurrency(trade.funding_charges || 0) }}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="badge" :class="`badge-${trade.status.toLowerCase()}`">
          {{ trade.status }}
        </span>
      </div>
    </div>

    <div v-if="!compact && trade.entry_reason" class="trade-notes">
      <strong>Entry Reason:</strong> {{ trade.entry_reason }}
    </div>

    <div v-if="!compact && trade.exit_reason" class="trade-notes">
      <strong>Exit Reason:</strong> {{ trade.exit_reason }}
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatDaysHeld,
  formatMode,
} from '../utils/formatters';

export default {
  name: 'TradeCard',
  props: {
    trade: {
      type: Object,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const pnlClass = computed(() => {
      if (!props.trade.pnl) return 'neutral';
      return props.trade.pnl > 0 ? 'profit' : 'loss';
    });

    const formattedPnL = computed(() => {
      if (props.trade.status === 'OPEN') {
        return 'OPEN';
      }
      return formatCurrency(props.trade.pnl || 0);
    });

    const daysHeld = computed(() => {
      return formatDaysHeld(props.trade.entry_timestamp, props.trade.exit_timestamp);
    });

    return {
      pnlClass,
      formattedPnL,
      daysHeld,
      formatCurrency,
      formatDate,
      formatPercentage,
      formatMode,
    };
  },
};
</script>

<style scoped>
.trade-card {
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--glass-border);
  transition: all var(--transition-base);
}

.trade-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.trade-card.compact {
  padding: var(--spacing-lg);
}

.trade-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
}

.trade-symbol {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.trade-symbol h4 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.trade-pnl {
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.trade-details {
  display: grid;
  gap: var(--spacing-md);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.detail-label {
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.detail-value {
  color: var(--color-text-primary);
  font-weight: 600;
  text-align: right;
}

.trade-notes {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--glass-border);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.trade-notes strong {
  color: var(--color-text-primary);
}

@media (max-width: 640px) {
  .trade-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .trade-symbol {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
