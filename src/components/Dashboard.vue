<template>
  <div class="dashboard fade-in">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>Trading Journal Dashboard</h1>
      <p>Track, analyze, and improve your trading performance</p>
    </div>

    <!-- Key Stats Grid -->
      <div class="grid grid-cols-4 mb-xl">
        <StatsCard
          label="Total PnL"
          :value="formatCurrency(totalPnL)"
          :valueClass="totalPnL >= 0 ? 'profit' : 'loss'"
          icon="💰"
          :iconBg="totalPnL >= 0 ? 'var(--gradient-success)' : 'var(--gradient-danger)'"
          :subtitle="`${formatPercentage(overallPnLPercent)} return`"
        />
        <StatsCard
          label="Win Rate"
          :value="formatPercentage(winRate)"
          valueClass="profit"
          icon="🎯"
          iconBg="var(--gradient-primary)"
          :subtitle="`${winningTrades}/${totalClosedTrades} wins`"
        />
        <StatsCard
          label="Total Trades"
          :value="trades.length"
          icon="📈"
          iconBg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
          :subtitle="`${openTrades.length} open, ${closedTrades.length} closed`"
        />
        <StatsCard
          label="Avg Profit"
          :value="formatCurrency(avgProfit)"
          valueClass="profit"
          icon="📊"
          iconBg="var(--gradient-success)"
          :subtitle="`Avg Loss: ${formatCurrency(avgLoss)}`"
        />
      </div>

      <!-- Recent Trades -->
      <div class="glass-card p-xl">
        <div class="flex justify-between items-center mb-lg">
          <h3>Recent Trades</h3>
          <router-link to="/trades" class="btn btn-secondary">View All</router-link>
        </div>
        <TradeList :trades="recentTrades" :limit="5" />
      </div>

      <!-- Quick Links to Other Views -->
      <div class="grid grid-cols-2 mb-xl mt-xl">
        <router-link to="/analytics" class="glass-card p-xl hover-lift" style="text-decoration: none; color: inherit;">
          <div class="quick-link-card">
            <div class="icon-large">📊</div>
            <h3>View Analytics</h3>
            <p class="text-muted">Deep dive into performance metrics and charts</p>
          </div>
        </router-link>
        <router-link to="/trades" class="glass-card p-xl hover-lift" style="text-decoration: none; color: inherit;">
          <div class="quick-link-card">
            <div class="icon-large">📋</div>
            <h3>All Trades</h3>
            <p class="text-muted">Browse complete trading history</p>
          </div>
        </router-link>
      </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import StatsCard from './StatsCard.vue';
import TradeList from './TradeList.vue';
import {
  calculateTotalPnL,
  calculateWinRate,
  calculateAverageProfit,
  calculateAverageLoss,
} from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default {
  name: 'Dashboard',
  components: {
    StatsCard,
    TradeList,
  },
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    // Computed statistics
    const closedTrades = computed(() =>
      props.trades.filter((t) => t.status === 'CLOSED')
    );

    const openTrades = computed(() =>
      props.trades.filter((t) => t.status === 'OPEN')
    );

    const totalClosedTrades = computed(() => closedTrades.value.length);

    const totalPnL = computed(() => calculateTotalPnL(closedTrades.value));

    const winRate = computed(() => calculateWinRate(closedTrades.value));

    const winningTrades = computed(() =>
      closedTrades.value.filter((t) => t.pnl > 0).length
    );

    const avgProfit = computed(() =>
      calculateAverageProfit(closedTrades.value)
    );

    const avgLoss = computed(() => calculateAverageLoss(closedTrades.value));

    const recentTrades = computed(() => props.trades.slice(0, 5));

    const overallPnLPercent = computed(() => {
      // Calculate overall PnL percentage based on total margin used
      const totalMargin = closedTrades.value.reduce(
        (sum, t) => sum + (t.margin_used || 0),
        0
      );
      if (totalMargin === 0) return 0;
      return (totalPnL.value / totalMargin) * 100;
    });

    return {
      closedTrades,
      openTrades,
      totalClosedTrades,
      totalPnL,
      winRate,
      winningTrades,
      avgProfit,
      avgLoss,
      recentTrades,
      overallPnLPercent,
      formatCurrency,
      formatPercentage,
    };
  },
};
</script>

<style scoped>
.dashboard {
  padding: var(--spacing-xl) 0;
}

.dashboard-header {
  margin-bottom: var(--spacing-2xl);
  text-align: center;
}

.dashboard-header h1 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-sm);
}

.dashboard-header p {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--spacing-lg);
}

.quick-link-card {
  text-align: center;
  transition: transform var(--transition-base);
}

.icon-large {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.quick-link-card h3 {
  margin-bottom: var(--spacing-sm);
}

.hover-lift {
  cursor: pointer;
}

.hover-lift:hover {
  transform: translateY(-4px);
}

.text-muted {
  color: var(--color-text-muted);
}
</style>
