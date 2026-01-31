<template>
  <div class="analytics fade-in">
    <!-- Header -->
    <div class="analytics-header">
      <h1>Analytics</h1>
      <p>Deep dive into your trading performance and statistics</p>
    </div>

    <!-- Streak & Risk Statistics -->
    <div class="grid grid-cols-4 mb-xl">
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
      <StatsCard
        label="Max Drawdown"
        :value="'-' + formatCurrency(maxDrawdown).replace('$', '')"
        valueClass="loss"
        icon="📉"
        iconBg="var(--gradient-danger)"
        subtitle="Largest peak-to-trough drop"
      />
    </div>

    <!-- Calendar Heatmap -->
    <div class="glass-card p-xl mb-xl">
      <CalendarHeatmap :trades="trades" />
    </div>

    <!-- Time Analysis -->
    <div class="mb-xl">
      <TimeAnalysis :trades="trades" />
    </div>

    <!-- Performance Ratio Metrics -->
    <div class="grid grid-cols-3 mb-xl">
      <StatsCard
        label="Win Rate"
        :value="formatPercentage(winRate)"
        :valueClass="winRate >= 50 ? 'profit' : 'loss'"
        icon="🎯"
        :iconBg="winRate >= 50 ? 'var(--gradient-success)' : 'var(--gradient-danger)'"
        subtitle="Percentage of profitable trades"
      />
      <StatsCard
        label="Profit Factor"
        :value="profitFactor.toFixed(2)"
        :valueClass="profitFactor >= 1.5 ? 'profit' : profitFactor >= 1 ? 'neutral' : 'loss'"
        icon="💰"
        :iconBg="profitFactor >= 1.5 ? 'var(--gradient-success)' : profitFactor >= 1 ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'var(--gradient-danger)'"
        subtitle="Gross Profit / Gross Loss"
      />
      <StatsCard
        label="Risk/Reward"
        :value="riskRewardRatio.toFixed(2)"
        :valueClass="riskRewardRatio >= 1.5 ? 'profit' : riskRewardRatio >= 1 ? 'neutral' : 'loss'"
        icon="⚖️"
        :iconBg="riskRewardRatio >= 1.5 ? 'var(--gradient-success)' : riskRewardRatio >= 1 ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'var(--gradient-danger)'"
        subtitle="Avg Win / Avg Loss"
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
import CalendarHeatmap from './CalendarHeatmap.vue';
import TimeAnalysis from './TimeAnalysis.vue';
import {
  getBestTrade,
  getWorstTrade,
  calculateStreaks,
  getCurrentStreak,
  calculateMaxDrawdown,
  calculateWinRate,
  calculateRiskRewardRatio,
  calculateProfitFactor,
} from '../utils/calculations';

import { formatCurrency, formatPercentage } from '../utils/formatters';

export default {
  name: 'Analytics',
  components: {
    StatsCard,
    TradeCard,
    PnLChart,
    StrategyPerformance,
    CalendarHeatmap,
    TimeAnalysis,
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
    
    // Risk metrics
    const maxDrawdown = computed(() => calculateMaxDrawdown(closedTrades.value));

    // Performance Ratios
    const winRate = computed(() => calculateWinRate(closedTrades.value));
    const riskRewardRatio = computed(() => calculateRiskRewardRatio(closedTrades.value));
    const profitFactor = computed(() => calculateProfitFactor(closedTrades.value));

    return {
      bestTrade,
      worstTrade,
      streakStats,
      currentStreakInfo,
      maxDrawdown,
      winRate,
      riskRewardRatio,
      profitFactor,
      formatCurrency,
      formatPercentage,
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
