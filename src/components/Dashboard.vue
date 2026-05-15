<template>
  <div class="dashboard fade-in">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>Trading Journal Dashboard</h1>
      <p>Track, analyze, and improve your trading performance</p>
    </div>

    <!-- Trade Counter -->
    <div class="mb-lg">
      <TradeCounter :totalTrades="trades.length" />
    </div>

    <!-- Global Year Filter -->
    <div class="global-filter-bar mb-lg">
      <div class="filter-group">
        <label for="globalYearFilter">Year</label>
        <select v-model="selectedYear" id="globalYearFilter" class="select">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
    </div>

    <!-- Key Stats Grid -->
      <div class="mb-lg">
        <!-- Hero Row: Always Visible -->
        <div class="grid grid-cols-4 mb-lg">
          <StatsCard
            label="Net PnL"
            :value="formatCurrency(totalPnL)"
            :valueClass="totalPnL >= 0 ? 'profit' : 'loss'"
            icon="💰"
            :iconBg="totalPnL >= 0 ? 'var(--gradient-success)' : 'var(--gradient-danger)'"
          />
          <StatsCard
            label="Win Rate"
            :value="formatPercentage(winRate)"
            valueClass="profit"
            icon="🎯"
            iconBg="var(--gradient-primary)"
          />
          <StatsCard
            label="Total Trades"
            :value="totalTrades"
            :subtitle="totalClosedTrades + ' closed'"
            icon="📈"
            iconBg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
          />
          <StatsCard
            label="Avg Daily PnL"
            :value="formatCurrency(dailyStats.avgDailyPnL)"
            :valueClass="dailyStats.avgDailyPnL >= 0 ? 'profit' : 'loss'"
            icon="📊"
            :iconBg="dailyStats.avgDailyPnL >= 0 ? 'var(--gradient-success)' : 'var(--gradient-danger)'"
          />
        </div>

        <!-- Detailed Metrics Tabs -->
        <div class="glass-card p-xl">
          <div class="tabs-container">
            <div class="flex justify-center gap-sm mb-xl tabs-list">
              <button
                @click="activeTab = 'daily'"
                :class="['btn btn-secondary', activeTab === 'daily' ? 'active-tab' : '']"
              >
                Daily Performance
              </button>
              <button
                @click="activeTab = 'consistency'"
                :class="['btn btn-secondary', activeTab === 'consistency' ? 'active-tab' : '']"
              >
                Consistency
              </button>
              <button
                @click="activeTab = 'financials'"
                :class="['btn btn-secondary', activeTab === 'financials' ? 'active-tab' : '']"
              >
                Financials
              </button>
            </div>
          </div>

          <div v-if="activeTab === 'daily'" class="grid grid-cols-4 gap-md">
            <StatsCard label="Total Trading Days" :value="dailyStats.tradingDays" icon="📅" iconBg="var(--gradient-primary)" />
            <StatsCard label="Winning Days" :value="dailyStats.winningDays" valueClass="profit" icon="☀️" iconBg="var(--gradient-success)" />
            <StatsCard label="Loss Days" :value="dailyStats.lossDays" valueClass="loss" icon="🌧️" iconBg="var(--gradient-danger)" />
            <StatsCard label="Max Profit Day" :value="formatCurrency(dailyStats.maxProfitDay)" valueClass="profit" icon="🚀" iconBg="var(--gradient-success)" />
            <StatsCard label="Max Loss Day" :value="formatCurrency(dailyStats.maxLossDay)" valueClass="loss" icon="⚠️" iconBg="var(--gradient-danger)" />
          </div>

          <div v-else-if="activeTab === 'consistency'" class="grid grid-cols-4 gap-md">
            <StatsCard label="Max Win Streak" :value="streaks.longestWinStreak" valueClass="profit" icon="🔥" iconBg="var(--gradient-success)" />
            <StatsCard label="Max Loss Streak" :value="streaks.longestLossStreak" valueClass="loss" icon="❄️" iconBg="var(--gradient-danger)" />
            <StatsCard label="Avg Profit/Day" :value="formatCurrency(dailyAverages.avgProfitDay)" valueClass="profit" icon="📊" iconBg="var(--gradient-success)" />
            <StatsCard label="Avg Loss/Day" :value="formatCurrency(dailyAverages.avgLossDay)" valueClass="loss" icon="📊" iconBg="var(--gradient-danger)" />
          </div>

          <div v-else-if="activeTab === 'financials'" class="grid grid-cols-4 gap-md">
            <StatsCard label="Total Profit" :value="formatCurrency(grossTotals.totalProfit)" valueClass="profit" icon="📈" iconBg="var(--gradient-success)" />
            <StatsCard label="Total Loss" :value="formatCurrency(grossTotals.totalLoss)" valueClass="loss" icon="📉" iconBg="var(--gradient-danger)" />
            <StatsCard label="Total Fees" :value="formatCurrency(totalFees)" valueClass="loss" icon="💸" iconBg="var(--gradient-danger)" />
            <StatsCard label="Total Funding" :value="formatCurrency(totalFunding)" :valueClass="totalFunding >= 0 ? 'profit' : 'loss'" icon="🏦" iconBg="var(--gradient-primary)" />
            <StatsCard
              label="Sharpe Ratio"
              :value="sharpeRatio.toFixed(2)"
              :valueClass="sharpeRatio >= 1.0 ? 'profit' : sharpeRatio >= 0.5 ? 'neutral' : 'loss'"
              icon="📈"
              :iconBg="sharpeRatio >= 1.0 ? 'var(--gradient-success)' : sharpeRatio >= 0.5 ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'var(--gradient-danger)'"
            />
          </div>
        </div>
      </div>

      <!-- Performance Charts -->
      <div class="glass-card p-xl mb-lg flex flex-col">
        <div class="flex justify-between items-center mb-lg">
          <h3>Yearly PnL Curve</h3>
          <div class="text-muted text-sm">Cumulative growth for {{ selectedYear }}</div>
        </div>
        <div class="flex-grow">
          <PnLChart :trades="pnlTrades" :showMonthFilter="false" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-xl mb-lg">
        <div class="glass-card p-xl flex flex-col">
          <div class="flex justify-between items-center mb-lg">
            <h3>Monthly PnL Curve</h3>
            <div class="text-muted text-sm">Cumulative growth by month</div>
          </div>
          <div class="flex-grow">
            <PnLChart :trades="pnlTrades" />
          </div>
        </div>

        <div class="glass-card p-xl flex flex-col">
          <div class="flex justify-between items-center mb-lg">
            <h3>PnL by Symbol</h3>
            <div class="text-muted text-sm">PnL distribution per symbol</div>
          </div>
          <div class="flex-grow">
            <PnLBreakdown :trades="closedTrades" />
          </div>
        </div>
      </div>

      <!-- Monthly Breakdown -->
      <div class="glass-card p-xl mb-lg">
        <div class="flex justify-between items-center mb-lg">
          <h3>Monthly Performance Breakdown</h3>
          <div class="text-muted text-sm">Detailed metrics by month for {{ selectedYear }}</div>
        </div>
        <MonthlyBreakdownCard :data="monthlyBreakdown" />
      </div>

      <!-- Open Trades -->
      <div class="glass-card p-xl">
        <div class="flex justify-between items-center mb-lg">
          <h3>Open Trades</h3>
        </div>
        <TradeList :trades="openTrades" :limit="5" />
      </div>
    </div>
  </template>

<script>
import MonthlyBreakdownCard from './MonthlyBreakdownCard.vue';
import { ref, computed } from 'vue';
import StatsCard from './StatsCard.vue';
import TradeList from './TradeList.vue';
import PnLChart from './PnLChart.vue';
import PnLBreakdown from './PnLBreakdown.vue';
import TradeCounter from './TradeCounter.vue';
import {
  calculateTotalPnL,
  calculateWinRate,
  calculateAverageProfit,
  calculateAverageLoss,
  calculateMonthlyBreakdown,
  calculateDailyPnLMap,
  calculateDailyStats,
  calculateGrossTotals,
  calculateDailyAverages,
  calculateTotalFees,
  calculateTotalFunding,
  calculateStreaks,
  getTradePnL,
  calculateSharpeRatio,
} from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default {
  name: 'Dashboard',
  components: {
    StatsCard,
    TradeList,
    PnLChart,
    PnLBreakdown,
    MonthlyBreakdownCard,
    TradeCounter,
  },
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const selectedYear = ref(new Date().getFullYear());
    const activeTab = ref('daily');


    // Computed statistics
    const closedTrades = computed(() =>
      props.trades.filter((t) => (t.status === 'CLOSED' || t.status === 'PARTIAL_CLOSED') &&
        (t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp)).getFullYear() === selectedYear.value)
    );

    const openTrades = computed(() =>
      props.trades.filter((t) => t.status === 'OPEN' &&
        (t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp)).getFullYear() === selectedYear.value)
    );

    // All trades with realized PnL (CLOSED + PARTIAL_CLOSED) for the selected year
    const pnlTrades = computed(() =>
      props.trades.filter((t) =>
        (t.status === 'CLOSED' || t.status === 'PARTIAL_CLOSED') &&
        (t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp)).getFullYear() === selectedYear.value
      )
    );

    const totalClosedTrades = computed(() => closedTrades.value.length);

    const totalTrades = computed(() =>
      props.trades.filter((t) =>
        (t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp)).getFullYear() === selectedYear.value
      ).length
    );

    const totalPnL = computed(() => calculateTotalPnL(closedTrades.value));

    const winRate = computed(() => calculateWinRate(closedTrades.value));

    const winningTrades = computed(() =>
      closedTrades.value.filter((t) => getTradePnL(t) > 0).length
    );

    const avgProfit = computed(() =>
      calculateAverageProfit(closedTrades.value)
    );

    const avgLoss = computed(() => calculateAverageLoss(closedTrades.value));

    const recentTrades = computed(() =>
      props.trades
        .filter(t => (t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp)).getFullYear() === selectedYear.value)
        .slice(0, 5)
    );

    const overallPnLPercent = computed(() => {
      // Calculate overall PnL percentage based on total margin used
      const totalMargin = closedTrades.value.reduce(
        (sum, t) => sum + (t.margin_used || 0),
        0
      );
      if (totalMargin === 0) return 0;
      return (totalPnL.value / totalMargin) * 100;
    });

    const monthlyBreakdown = computed(() => calculateMonthlyBreakdown(closedTrades.value));

    const dailyPnLMap = computed(() => calculateDailyPnLMap(closedTrades.value));
    const dailyStats = computed(() => calculateDailyStats(dailyPnLMap.value));
    const dailyAverages = computed(() => calculateDailyAverages(dailyPnLMap.value));
    const grossTotals = computed(() => calculateGrossTotals(closedTrades.value));
    const streaks = computed(() => calculateStreaks(closedTrades.value));
    const totalFees = computed(() => calculateTotalFees(closedTrades.value));
    const totalFunding = computed(() => calculateTotalFunding(closedTrades.value));
    const sharpeRatio = computed(() => calculateSharpeRatio(closedTrades.value));

    const years = computed(() => {
      const activeYears = new Set();
      props.trades.forEach(trade => {
        const date = trade.entry_timestamp?.toDate?.() || new Date(trade.entry_timestamp);
        activeYears.add(date.getFullYear());
      });
      return Array.from(activeYears).sort((a, b) => b - a);
    });

    return {
      selectedYear,
      activeTab,
      years,
      closedTrades,
      openTrades,
      pnlTrades,
      totalClosedTrades,
      totalTrades,
      totalPnL,
      winRate,
      winningTrades,
      avgProfit,
      avgLoss,
      recentTrades,
      overallPnLPercent,
      monthlyBreakdown,
      dailyPnLMap,
      dailyStats,
      dailyAverages,
      grossTotals,
      streaks,
      totalFees,
      totalFunding,
      sharpeRatio,
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

.global-filter-bar {
  display: flex;
  justify-content: flex-end;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-group label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.active-tab {
  background: var(--color-primary) !important;
  color: white !important;
  border-color: var(--color-primary) !important;
}

.tabs-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tabs-list {
  display: inline-flex;
  min-width: 100%;
}

.tabs-container::-webkit-scrollbar {
  height: 4px;
}

.tabs-container::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: var(--radius-full);
}
</style>
