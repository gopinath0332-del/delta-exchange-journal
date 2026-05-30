<template>
  <div class="symbol-equity-curve">
    <div class="chart-header">
      <div class="filter-group">
        <label for="symbolEquityFilter">Symbol</label>
        <select v-model="selectedSymbol" id="symbolEquityFilter" class="select select-sm">
          <option v-for="sym in availableSymbols" :key="sym" :value="sym">
            {{ sym }}
          </option>
        </select>
      </div>
    </div>

    <!-- Symbol Stats Summary -->
    <div v-if="stats" class="symbol-stats-row">
      <div class="stat-pill">
        <span class="stat-label">Total PnL</span>
        <span class="stat-value" :class="stats.totalPnL >= 0 ? 'profit' : 'loss'">
          {{ stats.totalPnL >= 0 ? '+' : '' }}{{ formatCurrency(stats.totalPnL) }}
        </span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Trades</span>
        <span class="stat-value">{{ stats.tradeCount }}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Win Rate</span>
        <span class="stat-value" :class="stats.winRate >= 50 ? 'profit' : 'loss'">
          {{ stats.winRate.toFixed(1) }}%
        </span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Profit Factor</span>
        <span class="stat-value" :class="stats.profitFactor >= 1 ? 'profit' : 'loss'">
          {{ stats.profitFactor === Infinity ? '∞' : stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : '—' }}
        </span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Avg Win</span>
        <span class="stat-value profit">{{ formatCurrency(stats.avgWin) }}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Avg Loss</span>
        <span class="stat-value loss">{{ formatCurrency(stats.avgLoss) }}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Max Drawdown</span>
        <span class="stat-value loss">{{ formatCurrency(stats.maxDrawdown) }}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Best Trade</span>
        <span class="stat-value profit">{{ formatCurrency(stats.bestTrade) }}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Worst Trade</span>
        <span class="stat-value loss">{{ formatCurrency(stats.worstTrade) }}</span>
      </div>
    </div>

    <canvas v-show="hasChartData" ref="chartCanvas"></canvas>
    <div v-if="!hasChartData" class="empty-chart-state">
      No closed trades available for this symbol
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { getTradePnL } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

Chart.register(...registerables);

const getTradeDate = (trade) => {
  const rawExit = trade.exit_timestamp?.toDate?.() || (trade.exit_timestamp ? new Date(trade.exit_timestamp) : null);
  const rawEntry = trade.entry_timestamp?.toDate?.() || (trade.entry_timestamp ? new Date(trade.entry_timestamp) : null);
  return rawExit && !isNaN(rawExit) ? rawExit : rawEntry;
};

export default {
  name: 'SymbolEquityCurve',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;
    const selectedSymbol = ref('');

    // Get sorted unique symbols, ordered by total PnL descending
    const availableSymbols = computed(() => {
      const symbolPnL = {};
      props.trades.forEach((t) => {
        if (t.status === 'CLOSED' || t.status === 'PARTIAL_CLOSED') {
          const sym = t.symbol || 'Unknown';
          symbolPnL[sym] = (symbolPnL[sym] || 0) + getTradePnL(t);
        }
      });
      return Object.keys(symbolPnL).sort((a, b) => symbolPnL[b] - symbolPnL[a]);
    });

    // Default to first symbol when data changes
    watch(
      availableSymbols,
      (symbols) => {
        if (symbols.length > 0 && (!selectedSymbol.value || !symbols.includes(selectedSymbol.value))) {
          selectedSymbol.value = symbols[0];
        }
      },
      { immediate: true }
    );

    // Get trades for the selected symbol
    const symbolTrades = computed(() => {
      if (!selectedSymbol.value) return [];
      return props.trades
        .filter(
          (t) =>
            (t.status === 'CLOSED' || t.status === 'PARTIAL_CLOSED') &&
            (t.symbol || 'Unknown') === selectedSymbol.value
        )
        .map((t) => ({ trade: t, date: getTradeDate(t), pnl: getTradePnL(t) }))
        .filter((item) => item.date && !isNaN(item.date))
        .sort((a, b) => a.date - b.date);
    });

    // Compute stats for the selected symbol
    const stats = computed(() => {
      const trades = symbolTrades.value;
      if (trades.length === 0) return null;

      const pnls = trades.map((t) => t.pnl);
      const totalPnL = pnls.reduce((s, v) => s + v, 0);
      const wins = trades.filter((t) => t.pnl > 0);
      const losses = trades.filter((t) => t.pnl < 0);
      const winRate = (wins.length / trades.length) * 100;

      const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
      const grossLoss = losses.reduce((s, t) => s + Math.abs(t.pnl), 0);
      const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : null) : grossProfit / grossLoss;

      const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;

      // Max drawdown
      let peak = 0;
      let cumulative = 0;
      let maxDrawdown = 0;
      trades.forEach((t) => {
        cumulative += t.pnl;
        if (cumulative > peak) peak = cumulative;
        const dd = peak - cumulative;
        if (dd > maxDrawdown) maxDrawdown = dd;
      });

      const bestTrade = Math.max(...pnls);
      const worstTrade = Math.min(...pnls);

      return {
        totalPnL,
        tradeCount: trades.length,
        winRate,
        profitFactor,
        avgWin,
        avgLoss,
        maxDrawdown,
        bestTrade,
        worstTrade,
      };
    });

    // Build cumulative PnL for the selected symbol
    const cumulativeData = computed(() => {
      const trades = symbolTrades.value;
      if (trades.length === 0) return [];

      let cumulative = 0;
      return trades.map((item) => {
        cumulative += item.pnl;
        return {
          date: item.date,
          cumulativePnL: cumulative,
          trade: item.trade,
        };
      });
    });

    const hasChartData = computed(() => cumulativeData.value.length > 0);

    const createChart = () => {
      if (!chartCanvas.value) return;

      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      if (!hasChartData.value) return;

      const dataPoints = cumulativeData.value;
      const labels = dataPoints.map((d) =>
        d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );
      const data = dataPoints.map((d) => d.cumulativePnL);

      const ctx = chartCanvas.value.getContext('2d');

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Cumulative PnL',
              data,
              fill: {
                target: 'origin',
                above: 'rgba(34, 197, 94, 0.2)',
                below: 'rgba(239, 68, 68, 0.2)',
              },
              borderWidth: 3,
              tension: 0,
              pointRadius: 4,
              pointHoverRadius: 6,
              segment: {
                borderColor: (ctx) => (ctx.p1.parsed.y < 0 ? '#ef4444' : '#22c55e'),
              },
              pointBackgroundColor: (ctx) =>
                ctx.parsed && ctx.parsed.y < 0 ? '#ef4444' : '#22c55e',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(30, 36, 66, 0.95)',
              titleColor: '#f9fafb',
              bodyColor: '#d1d5db',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y;
                  return `PnL: $${value.toFixed(4)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: '#9ca3af',
                maxRotation: 0,
                autoSkipPadding: 20,
              },
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: '#9ca3af',
                callback: (value) => `$${value}`,
              },
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
        },
      });
    };

    onMounted(createChart);
    watch([() => props.trades, selectedSymbol], createChart, { deep: true });
    onBeforeUnmount(() => {
      if (chartInstance) chartInstance.destroy();
    });

    return {
      chartCanvas,
      hasChartData,
      availableSymbols,
      selectedSymbol,
      stats,
      formatCurrency,
    };
  },
};
</script>

<style scoped>
.symbol-equity-curve {
  position: relative;
  width: 100%;
  min-height: 300px;
}

.chart-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
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

.select-sm {
  padding: 4px 8px;
  font-size: var(--font-size-xs);
}

/* Stats row */
.symbol-stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: var(--spacing-lg);
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
}

.stat-pill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-width: 90px;
  transition: background 0.2s ease;
}

.stat-pill:hover {
  background: rgba(255, 255, 255, 0.07);
}

.stat-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary, #f9fafb);
}

.stat-value.profit {
  color: var(--color-profit, #22c55e);
}

.stat-value.loss {
  color: var(--color-loss, #ef4444);
}

.empty-chart-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
