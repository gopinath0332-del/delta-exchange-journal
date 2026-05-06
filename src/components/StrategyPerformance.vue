<template>
  <div class="strategy-performance">
    <div class="symbol-list-container">
      <div v-if="statsList.length === 0" class="text-muted text-center py-xl">
        No data available
      </div>
      <div v-else class="symbol-list">
        <div v-for="(stat, index) in statsList" :key="stat.name" class="symbol-row">
          <div class="symbol-info">
            <span class="rank-badge">{{ index + 1 }}</span>
            <span class="symbol-name">{{ stat.name }}</span>
            <span class="trade-count">({{ stat.totalTrades }} trades)</span>
          </div>
          <div class="bar-track">
            <div 
              class="bar-fill" 
              :class="stat.totalPnL >= 0 ? 'profit-bg' : 'loss-bg'"
              :style="{ width: `${(Math.abs(stat.totalPnL) / maxAbsPnL) * 100}%` }"
            >
              <span class="bar-text">{{ formatCurrency(stat.totalPnL) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { calculateStrategyStats } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

export default {
  name: 'StrategyPerformance',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const statsList = computed(() => {
      const statsObj = calculateStrategyStats(props.trades);
      const arr = Object.keys(statsObj).map(name => ({
        name,
        ...statsObj[name]
      }));
      // Sort by positive PnL (green) first, then negative PnL (red), keeping absolute PnL descending within groups
      return arr.sort((a, b) => {
        const aIsPositive = a.totalPnL >= 0;
        const bIsPositive = b.totalPnL >= 0;
        
        if (aIsPositive !== bIsPositive) {
          return aIsPositive ? -1 : 1;
        }
        
        return Math.abs(b.totalPnL) - Math.abs(a.totalPnL);
      });
    });

    const maxAbsPnL = computed(() => {
      if (statsList.value.length === 0) return 1;
      return Math.max(...statsList.value.map(s => Math.abs(s.totalPnL)));
    });

    return {
      statsList,
      maxAbsPnL,
      formatCurrency,
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
