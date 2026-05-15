<template>
  <div class="analytics fade-in">
    <!-- Header -->
    <div class="analytics-header mb-2xl">
      <div class="header-info">
        <h1>Analytics</h1>
        <p>Deep dive into your trading performance and statistics</p>
      </div>

      <div class="header-controls">
        <div class="sub-tab-nav">
          <button 
            v-for="tab in subTabs" 
            :key="tab.id"
            @click="activeSubTab = tab.id"
            :class="['sub-tab-btn', { active: activeSubTab === tab.id }]"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="filter-group">
          <label for="analyticsYearFilter" class="mr-sm text-sm text-muted">Year</label>
          <select v-model="selectedYear" id="analyticsYearFilter" class="select select-sm">
            <option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- OVERVIEW TAB -->
      <div v-if="activeSubTab === 'overview'" class="fade-in">
        <!-- Performance Ratio Metrics -->
        <div class="grid grid-cols-4 mb-xl">
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
          <StatsCard
            label="Sharpe Ratio"
            :value="sharpeRatio.toFixed(2)"
            :valueClass="sharpeRatio >= 1.0 ? 'profit' : sharpeRatio >= 0.5 ? 'neutral' : 'loss'"
            icon="📈"
            :iconBg="sharpeRatio >= 1.0 ? 'var(--gradient-success)' : sharpeRatio >= 0.5 ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'var(--gradient-danger)'"
            subtitle="Risk-adjusted return"
          />
        </div>

        <!-- Behavioral & Risk Analysis Group -->
        <div class="section-group mb-xl">
          <div class="flex-between mb-md px-sm">
            <h3 class="text-sm uppercase tracking-wider text-tertiary">Psychology & Risk Momentum</h3>
            <span class="text-xs text-muted">Behavioral health indicators</span>
          </div>
          <div class="grid grid-cols-5 gap-md">
            <StatsCard
              label="Current Streak"
              :value="currentStreakInfo.count"
              :valueClass="currentStreakInfo.type === 'win' ? 'profit' : currentStreakInfo.type === 'loss' ? 'loss' : 'neutral'"
              :icon="currentStreakInfo.emoji"
              :iconBg="currentStreakInfo.type === 'win' ? 'var(--gradient-success)' : currentStreakInfo.type === 'loss' ? 'var(--gradient-danger)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'"
              :subtitle="currentStreakInfo.message"
            />
            <StatsCard
              label="Longest Win"
              :value="streakStats.longestWinStreak"
              valueClass="profit"
              icon="🔥"
              iconBg="var(--gradient-success)"
              subtitle="Best run"
            />
            <StatsCard
              label="Longest Loss"
              :value="streakStats.longestLossStreak"
              valueClass="loss"
              icon="❄️"
              iconBg="var(--gradient-danger)"
              subtitle="Worst run"
            />
            <StatsCard
              label="Max Drawdown"
              :value="'-' + formatCurrency(maxDrawdown).replace('$', '')"
              valueClass="loss"
              icon="📉"
              iconBg="var(--gradient-danger)"
              subtitle="Peak drop"
            />
            <StatsCard
              label="Discipline"
              :value="avgDisciplineScore !== null ? avgDisciplineScore.toFixed(0) : 'N/A'"
              :valueClass="avgDisciplineScore === null ? 'neutral' : (avgDisciplineScore >= 80 ? 'profit' : avgDisciplineScore >= 60 ? 'neutral' : 'loss')"
              icon="🧠"
              :iconBg="avgDisciplineScore === null ? 'var(--gradient-card)' : (avgDisciplineScore >= 80 ? 'var(--gradient-success)' : avgDisciplineScore >= 60 ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'var(--gradient-danger)')"
              subtitle="Plan adherence"
              tooltip="Measures adherence to your 1R risk plan. Penalties apply for losing >1R (moving stops) or capturing <2R on winners (early exits)."
            />
          </div>
        </div>

        <!-- PnL Chart -->
        <div class="glass-card p-xl mb-xl">
          <h3 class="mb-md">Cumulative PnL Performance</h3>
          <PnLChart :trades="yearTrades" :showMonthFilter="false" />
        </div>
      </div>

      <!-- ASSETS TAB -->
      <div v-if="activeSubTab === 'assets'" class="fade-in">
        <!-- Strategy Performance -->
        <div class="glass-card p-xl mb-xl">
          <h3 class="mb-md">Strategy Performance</h3>
          <StrategyPerformance :trades="yearTrades" />
        </div>

        <!-- Symbol Performance Chart -->
        <div class="glass-card p-xl mb-xl">
          <h3 class="mb-md">Symbol Performance (PnL Distribution)</h3>
          <PnLBreakdown :trades="yearTrades" :showMonthFilter="false" />
        </div>

        <!-- Detailed Symbol Performance Table -->
        <div class="glass-card p-xl mb-xl">
          <h3 class="mb-md">Detailed Symbol Analysis</h3>
          <SymbolPerformanceTable :trades="yearTrades" />
        </div>
      </div>

      <!-- INSIGHTS TAB -->
      <div v-if="activeSubTab === 'insights'" class="fade-in">
        <!-- Win/Loss Streak Distribution -->
        <div class="glass-card p-xl mb-xl">
          <div class="flex-between mb-md">
            <h3>Streak Distribution</h3>
            <span class="text-xs text-muted">Frequency of consecutive wins vs. losses</span>
          </div>
          <StreakChart :trades="yearTrades" />
        </div>

        <!-- Time Analysis -->
        <div class="glass-card p-xl mb-xl">
          <h3 class="mb-md">Time-Based Performance</h3>
          <TimeAnalysis :trades="yearTrades" />
        </div>
      </div>

      <!-- ACTIVITY TAB -->
      <div v-if="activeSubTab === 'activity'" class="fade-in">
        <!-- Calendar Heatmap -->
        <div class="glass-card p-xl mb-xl">
          <h3 class="mb-md">Trading Activity Calendar</h3>
          <CalendarHeatmap :trades="yearTrades" />
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
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import StatsCard from './StatsCard.vue';
import TradeCard from './TradeCard.vue';
import PnLChart from './PnLChart.vue';
import StreakChart from './StreakChart.vue';
import StrategyPerformance from './StrategyPerformance.vue';
import PnLBreakdown from './PnLBreakdown.vue';
import SymbolPerformanceTable from './SymbolPerformanceTable.vue';
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
  calculateDisciplineScore,
  calculateSharpeRatio,
} from '../utils/calculations';

import { formatCurrency, formatPercentage } from '../utils/formatters';

export default {
  name: 'Analytics',
  components: {
    StatsCard,
    TradeCard,
    PnLChart,
    StreakChart,
    StrategyPerformance,
    PnLBreakdown,
    SymbolPerformanceTable,
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
    const activeSubTab = ref('overview');
    const subTabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'assets', label: 'Assets & Strategies' },
      { id: 'insights', label: 'Insights' },
      { id: 'activity', label: 'Activity' },
    ];

    const selectedYear = ref(new Date().getFullYear());

    const years = computed(() => {
      const yearSet = new Set();
      props.trades.forEach((t) => {
        const d = t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp);
        if (d && !isNaN(d)) yearSet.add(d.getFullYear());
      });
      const currentYear = new Date().getFullYear();
      yearSet.add(currentYear);
      return Array.from(yearSet).sort((a, b) => b - a);
    });

    const yearTrades = computed(() =>
      props.trades.filter((t) => {
        const d = t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp);
        return d.getFullYear() === selectedYear.value;
      })
    );

    // Filter closed trades for analytics
    const closedTrades = computed(() =>
      yearTrades.value.filter((t) => (t.status === 'CLOSED' || t.status === 'PARTIAL_CLOSED'))
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
    const sharpeRatio = computed(() => calculateSharpeRatio(closedTrades.value));

    const avgDisciplineScore = computed(() => {
      const scores = closedTrades.value
        .map(t => calculateDisciplineScore(t))
        .filter(s => s !== null);
      if (scores.length === 0) return null;
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    });

    return {
      activeSubTab,
      subTabs,
      selectedYear,
      years,
      yearTrades,
      bestTrade,
      worstTrade,
      streakStats,
      currentStreakInfo,
      maxDrawdown,
      winRate,
      riskRewardRatio,
      profitFactor,
      sharpeRatio,
      avgDisciplineScore,
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-info {
  text-align: left;
}

.header-info h1 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-2xl);
}

.header-info p {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.sub-tab-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sub-tab-btn:hover {
  color: var(--color-text-primary);
}

.sub-tab-btn.active {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
}

.tab-content {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.text-muted {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-xl);
}
</style>
