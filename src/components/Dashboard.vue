<template>
  <div class="dashboard fade-in">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>Trading Journal Dashboard</h1>
      <p>Track, analyze, and improve your trading performance</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading your trades...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
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

      <!-- Charts Section -->
      <div class="grid grid-cols-2 mb-xl">
        <!-- PnL Chart -->
        <div class="glass-card p-xl">
          <h3>Cumulative PnL</h3>
          <PnLChart :trades="closedTrades" />
        </div>

        <!-- Strategy Performance -->
        <div class="glass-card p-xl">
          <h3>Strategy Performance</h3>
          <StrategyPerformance :trades="closedTrades" />
        </div>
      </div>

      <!-- Best & Worst Trades -->
      <div class="grid grid-cols-2 mb-xl">
        <div class="glass-card p-xl">
          <h3 class="mb-md">🏆 Best Trade</h3>
          <TradeCard v-if="bestTrade" :trade="bestTrade" compact />
          <p v-else class="text-muted">No closed trades yet</p>
        </div>

        <div class="glass-card p-xl">
          <h3 class="mb-md">📉 Worst Trade</h3>
          <TradeCard v-if="worstTrade" :trade="worstTrade" compact />
          <p v-else class="text-muted">No closed trades yet</p>
        </div>
      </div>

      <!-- Recent Trades -->
      <div class="glass-card p-xl">
        <div class="flex justify-between items-center mb-lg">
          <h3>Recent Trades</h3>
          <router-link to="/trades" class="btn btn-secondary">View All</router-link>
        </div>
        <TradeList :trades="recentTrades" :limit="5" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import StatsCard from './StatsCard.vue';
import TradeCard from './TradeCard.vue';
import TradeList from './TradeList.vue';
import PnLChart from './PnLChart.vue';
import StrategyPerformance from './StrategyPerformance.vue';
import { subscribeToTrades } from '../firebase/trades';
import {
  calculateTotalPnL,
  calculateWinRate,
  calculateAverageProfit,
  calculateAverageLoss,
  getBestTrade,
  getWorstTrade,
} from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default {
  name: 'Dashboard',
  components: {
    StatsCard,
    TradeCard,
    TradeList,
    PnLChart,
    StrategyPerformance,
  },
  setup() {
    const trades = ref([]);
    const loading = ref(true);
    let unsubscribe = null;

    // Computed statistics
    const closedTrades = computed(() =>
      trades.value.filter((t) => t.status === 'CLOSED')
    );

    const openTrades = computed(() =>
      trades.value.filter((t) => t.status === 'OPEN')
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

    const bestTrade = computed(() => getBestTrade(closedTrades.value));

    const worstTrade = computed(() => getWorstTrade(closedTrades.value));

    const recentTrades = computed(() => trades.value.slice(0, 5));

    const overallPnLPercent = computed(() => {
      // Calculate overall PnL percentage based on total margin used
      const totalMargin = closedTrades.value.reduce(
        (sum, t) => sum + (t.margin_used || 0),
        0
      );
      if (totalMargin === 0) return 0;
      return (totalPnL.value / totalMargin) * 100;
    });

    // Subscribe to trades
    onMounted(() => {
      unsubscribe = subscribeToTrades((newTrades) => {
        trades.value = newTrades;
        loading.value = false;
      });
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    return {
      trades,
      loading,
      closedTrades,
      openTrades,
      totalClosedTrades,
      totalPnL,
      winRate,
      winningTrades,
      avgProfit,
      avgLoss,
      bestTrade,
      worstTrade,
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

.text-muted {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-xl);
}
</style>
