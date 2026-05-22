<template>
  <div class="monthly-returns-heatmap">
    <div v-if="rows.length" class="heatmap-scroll">
      <div class="heatmap-grid" :style="{ '--row-count': rows.length }">
        <div class="corner-cell"></div>
        <div v-for="month in months" :key="month" class="month-label">
          {{ month }}
        </div>

        <template v-for="row in rows" :key="row.year">
          <div class="year-label">{{ row.year }}</div>
          <div
            v-for="cell in row.months"
            :key="`${row.year}-${cell.monthIndex}`"
            class="return-cell"
            :class="{ empty: !cell.hasData }"
            :style="{ backgroundColor: getCellColor(cell) }"
            :title="getCellTitle(row.year, cell)"
          >
            <span v-if="cell.hasData">{{ formatReturn(cell.returnPct) }}</span>
          </div>
        </template>
      </div>

      <div class="heatmap-legend">
        <span class="legend-title">Return %</span>
        <div class="legend-scale"></div>
        <div class="legend-values">
          <span>{{ formatReturn(maxAbsReturn, false) }}</span>
          <span>0</span>
          <span>{{ formatReturn(-maxAbsReturn, false) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-heatmap-state">
      No monthly return data available
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { getTradePnL } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getTradeDate = (trade) => {
  const rawExit = trade.exit_timestamp?.toDate?.() || (trade.exit_timestamp ? new Date(trade.exit_timestamp) : null);
  const rawEntry = trade.entry_timestamp?.toDate?.() || (trade.entry_timestamp ? new Date(trade.entry_timestamp) : null);

  return rawExit && !isNaN(rawExit) ? rawExit : rawEntry;
};

export default {
  name: 'MonthlyReturnsHeatmap',
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const rows = computed(() => {
      const yearMap = new Map();

      props.trades
        .filter((trade) => trade.status === 'CLOSED' || trade.status === 'PARTIAL_CLOSED')
        .forEach((trade) => {
          const date = getTradeDate(trade);
          if (!date || isNaN(date)) return;

          const year = date.getFullYear();
          const monthIndex = date.getMonth();

          if (!yearMap.has(year)) {
            yearMap.set(year, MONTHS.map((_, index) => ({
              monthIndex: index,
              tradeCount: 0,
              pnl: 0,
              margin: 0,
              returnValues: [],
            })));
          }

          const month = yearMap.get(year)[monthIndex];
          const pnl = getTradePnL(trade);
          const margin = Number(trade.margin_used);
          const pnlPercentage = Number(trade.pnl_percentage);

          month.tradeCount += 1;
          month.pnl += pnl;
          if (Number.isFinite(margin) && margin > 0) month.margin += margin;
          if (Number.isFinite(pnlPercentage)) month.returnValues.push(pnlPercentage);
        });

      return Array.from(yearMap.entries())
        .sort(([yearA], [yearB]) => yearB - yearA)
        .map(([year, months]) => ({
          year,
          months: months.map((month) => {
            const averageReturn = month.returnValues.length
              ? month.returnValues.reduce((sum, value) => sum + value, 0) / month.returnValues.length
              : 0;
            const returnPct = month.margin > 0 ? (month.pnl / month.margin) * 100 : averageReturn;

            return {
              ...month,
              returnPct,
              hasData: month.tradeCount > 0,
            };
          }),
        }));
    });

    const maxAbsReturn = computed(() => {
      const values = rows.value
        .flatMap((row) => row.months)
        .filter((cell) => cell.hasData)
        .map((cell) => Math.abs(cell.returnPct));

      return Math.max(1, ...values);
    });

    const getCellColor = (cell) => {
      if (!cell.hasData) return 'var(--color-bg-tertiary)';

      const intensity = Math.min(Math.abs(cell.returnPct) / maxAbsReturn.value, 1);
      if (Math.abs(cell.returnPct) < 0.05) return '#2f4053';

      const alpha = 0.45 + intensity * 0.45;
      return cell.returnPct > 0
        ? `rgba(34, 197, 94, ${alpha})`
        : `rgba(239, 68, 68, ${alpha})`;
    };

    const formatReturn = (value, includePlus = true) => {
      const sign = value > 0 && includePlus ? '+' : '';
      return `${sign}${value.toFixed(1)}%`;
    };

    const getCellTitle = (year, cell) => {
      if (!cell.hasData) return `${MONTHS[cell.monthIndex]} ${year}: No closed trades`;

      return [
        `${MONTHS[cell.monthIndex]} ${year}`,
        `Return: ${formatReturn(cell.returnPct)}`,
        `PnL: ${formatCurrency(cell.pnl)}`,
        `Trades: ${cell.tradeCount}`,
      ].join('\n');
    };

    return {
      months: MONTHS,
      rows,
      maxAbsReturn,
      getCellColor,
      formatReturn,
      getCellTitle,
    };
  },
};
</script>

<style scoped>
.monthly-returns-heatmap {
  width: 100%;
}

.heatmap-scroll {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  overflow-x: auto;
  padding-bottom: var(--spacing-xs);
}

.heatmap-grid {
  display: grid;
  grid-template-columns: 64px repeat(12, minmax(76px, 1fr));
  grid-template-rows: 28px repeat(var(--row-count), 72px);
  min-width: 1040px;
  flex: 1;
}

.corner-cell,
.month-label,
.year-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.month-label {
  display: flex;
  align-items: end;
  justify-content: center;
  padding-bottom: 2px;
}

.year-label {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--spacing-sm);
  font-weight: 500;
}

.return-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  transition: filter var(--transition-fast);
}

.return-cell:hover {
  filter: brightness(1.12);
}

.return-cell.empty {
  color: transparent;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)),
    var(--color-bg-tertiary);
}

.heatmap-legend {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto 134px;
  align-items: center;
  column-gap: var(--spacing-sm);
  flex: 0 0 auto;
}

.legend-title {
  grid-column: 1 / 3;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.legend-scale {
  width: 14px;
  height: 134px;
  background: linear-gradient(
    180deg,
    rgba(34, 197, 94, 0.9) 0%,
    #2f4053 50%,
    rgba(239, 68, 68, 0.9) 100%
  );
}

.legend-values {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 134px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.empty-heatmap-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
  .heatmap-scroll {
    align-items: flex-start;
    gap: var(--spacing-lg);
  }

  .heatmap-grid {
    grid-template-columns: 52px repeat(12, 68px);
    grid-template-rows: 28px repeat(var(--row-count), 60px);
    min-width: 868px;
  }

  .return-cell,
  .month-label,
  .year-label {
    font-size: var(--font-size-xs);
  }
}
</style>
