<template>
  <div class="time-analysis">
    <!-- Day of Week Chart -->
    <div class="glass-card p-xl">
      <h3 class="mb-md">Performance by Day</h3>
      <div class="symbol-list-container">
        <div v-if="dayStats.length === 0" class="text-muted text-center py-xl">
          No data available
        </div>
        <div v-else class="symbol-list">
          <div v-for="(stat, index) in dayStats" :key="stat.name" class="symbol-row">
            <div class="symbol-info">
              <span class="rank-badge">{{ index + 1 }}</span>
              <span class="symbol-name">{{ stat.name }}</span>
              <span class="trade-count">({{ stat.total }} trades)</span>
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
  </div>
</template>

<script>
import { computed } from 'vue';
import { calculateTimeBasedPerformance } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

export default {
  name: 'TimeAnalysis',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const dayStats = computed(() => {
      if (!props.trades.length) return [];
      const { byDay } = calculateTimeBasedPerformance(props.trades);
      // Sort by absolute PnL descending
      return byDay.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
    });

    const maxAbsPnL = computed(() => {
      if (dayStats.value.length === 0) return 1;
      return Math.max(...dayStats.value.map(s => Math.abs(s.pnl)));
    });

    return { 
      dayStats, 
      maxAbsPnL, 
      formatCurrency 
    };
  },
};
</script>

<style scoped>
/* Custom List UI (matches Symbol Performance) */
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
  width: 180px; /* fixed width for labels */
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
