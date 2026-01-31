<template>
  <div class="analytics fade-in">
    <!-- Header -->
    <div class="analytics-header">
      <h1>Analytics</h1>
      <p>Deep dive into your trading performance and statistics</p>
    </div>

    <!-- Streak Statistics -->
    <div class="grid grid-cols-3 mb-xl">
      <StatsCard
        label="Current Streak"
        :value="currentStreakInfo.count"
        :valueClass="currentStreakInfo.type === 'win' ? 'profit' : currentStreakInfo.type === 'loss' ? 'loss' : 'neutral'"
        :icon="currentStreakInfo.emoji"
        :iconBg="currentStreakInfo.type === 'win' ? 'var(--gradient-success)' : currentStreakInfo.type === 'loss' ? 'var(--gradient-danger)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'"
        :subtitle="currentStreakInfo.message"
      />
      <StatsCard
        label="Longest Win Streak"
        :value="streakStats.longestWinStreak"
        valueClass="profit"
        icon="🔥"
        iconBg="var(--gradient-success)"
        subtitle="Best winning run"
      />
      <StatsCard
        label="Longest Loss Streak"
        :value="streakStats.longestLossStreak"
        valueClass="loss"
        icon="❄️"
        iconBg="var(--gradient-danger)"
        subtitle="Worst losing run"
      />
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-2 mb-xl">
      <!-- PnL Chart -->
      <div class="glass-card p-xl">
        <h3>Cumulative PnL</h3>
        <PnLChart :trades="trades" />
      </div>

      <!-- Strategy Performance -->
      <div class="glass-card p-xl">
        <h3>Strategy Performance</h3>
        <StrategyPerformance :trades="trades" />
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
  </div>
</template>

<script>
import { computed } from 'vue';
import StatsCard from './StatsCard.vue';
import TradeCard from './TradeCard.vue';
import PnLChart from './PnLChart.vue';
import StrategyPerformance from './StrategyPerformance.vue';
import {
  getBestTrade,
  getWorstTrade,
  calculateStreaks,
  getCurrentStreak,
} from '../utils/calculations';

export default {
  name: 'Analytics',
  components: {
    StatsCard,
    TradeCard,
    PnLChart,
    StrategyPerformance,
  },
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    // Filter closed trades for analytics
    const closedTrades = computed(() =>
      props.trades.filter((t) => t.status === 'CLOSED')
    );

    // Best and worst trades
    const bestTrade = computed(() => getBestTrade(closedTrades.value));
    const worstTrade = computed(() => getWorstTrade(closedTrades.value));

    // Streak statistics
    const streakStats = computed(() => calculateStreaks(closedTrades.value));
    const currentStreakInfo = computed(() => getCurrentStreak(closedTrades.value));

    return {
      bestTrade,
      worstTrade,
      streakStats,
      currentStreakInfo,
    };
  },
};
</script>

<style scoped>
.analytics {
  padding: var(--spacing-xl) 0;
}

.analytics-header {
  margin-bottom: var(--spacing-2xl);
  text-align: center;
}

.analytics-header h1 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-sm);
}

.analytics-header p {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
}

.text-muted {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-xl);
}
</style>
