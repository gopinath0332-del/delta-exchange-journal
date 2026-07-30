<template>
  <div class="funding-by-symbol">
    <!-- Summary Stats Row -->
    <div class="funding-summary">
      <div class="summary-item">
        <span class="summary-label">Total Funding</span>
        <span class="summary-value" :class="totalFunding >= 0 ? 'profit' : 'loss'">
          {{ formatCurrency(totalFunding) }}
        </span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Symbols Earning</span>
        <span class="summary-value profit">{{ earningCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Symbols Paying</span>
        <span class="summary-value loss">{{ payingCount }}</span>
      </div>
    </div>

    <!-- Bar Chart -->
    <div class="bar-chart-container">
      <div v-if="fundingStats.length === 0" class="text-muted text-center py-xl">
        No funding data available
      </div>
      <div v-else class="bar-list">
        <div v-for="stat in fundingStats" :key="stat.symbol" class="bar-row">
          <div class="bar-label">
            <span class="symbol-badge">{{ stat.symbol }}</span>
            <span class="trade-count-label">({{ stat.tradeCount }} trades)</span>
          </div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :class="stat.funding >= 0 ? 'bar-profit' : 'bar-loss'"
              :style="{ width: `${barWidth(stat.funding)}%` }"
            >
              <span class="bar-value">{{ formatCurrency(stat.funding) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { calculatePnLBySymbol } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

export default {
  name: 'FundingBySymbol',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const fundingStats = computed(() => {
      const data = calculatePnLBySymbol(props.trades);
      // Sort: positive funding first (descending), then negative (ascending by abs)
      return data.sort((a, b) => {
        const aPos = a.funding >= 0;
        const bPos = b.funding >= 0;
        if (aPos !== bPos) return aPos ? -1 : 1;
        return Math.abs(b.funding) - Math.abs(a.funding);
      });
    });

    const maxAbsFunding = computed(() => {
      if (fundingStats.value.length === 0) return 1;
      return Math.max(...fundingStats.value.map(s => Math.abs(s.funding)));
    });

    const totalFunding = computed(() =>
      fundingStats.value.reduce((sum, s) => sum + s.funding, 0)
    );

    const earningCount = computed(() =>
      fundingStats.value.filter(s => s.funding > 0).length
    );

    const payingCount = computed(() =>
      fundingStats.value.filter(s => s.funding < 0).length
    );

    const barWidth = (funding) => {
      if (maxAbsFunding.value === 0) return 0;
      return Math.max((Math.abs(funding) / maxAbsFunding.value) * 100, 4);
    };

    return {
      fundingStats,
      totalFunding,
      earningCount,
      payingCount,
      barWidth,
      formatCurrency,
    };
  },
};
</script>

<style scoped>
.funding-by-symbol {
  width: 100%;
}

/* Summary Row */
.funding-summary {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

/* Bar Chart */
.bar-chart-container {
  max-height: 420px;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

.bar-chart-container::-webkit-scrollbar {
  width: 6px;
}
.bar-chart-container::-webkit-scrollbar-thumb {
  background-color: var(--glass-border);
  border-radius: 4px;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar-row {
  display: flex;
  align-items: center;
}

.bar-label {
  display: flex;
  align-items: center;
  width: 200px;
  flex-shrink: 0;
  gap: 8px;
}

.symbol-badge {
  background: rgba(102, 126, 234, 0.12);
  border: 1px solid rgba(102, 126, 234, 0.25);
  padding: 3px 8px;
  border-radius: var(--radius-md);
  color: var(--color-primary-light);
  font-weight: 700;
  font-size: var(--font-size-xs);
  letter-spacing: 0.5px;
}

.light-theme .symbol-badge {
  background: rgba(102, 126, 234, 0.08);
  border-color: rgba(102, 126, 234, 0.2);
  color: var(--color-primary-dark);
}

.trade-count-label {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.bar-track {
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.04);
  height: 30px;
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 6px;
  min-width: fit-content;
  transition: width 0.5s ease-out;
}

.bar-profit {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.bar-loss {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.bar-value {
  color: white;
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .funding-summary {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  .bar-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .bar-label {
    width: 100%;
    margin-bottom: 4px;
  }
  .bar-track {
    width: 100%;
  }
}
</style>
