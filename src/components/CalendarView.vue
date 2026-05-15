<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <div class="calendar-nav">
        <button @click="prevMonth" class="btn btn-secondary btn-sm">&lt;</button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="nextMonth" class="btn btn-secondary btn-sm">&gt;</button>
      </div>
      <div class="calendar-stats">
        <div class="stat-item">
          <span class="stat-label">Monthly PnL:</span>
          <span class="stat-value" :class="monthlyPnL >= 0 ? 'profit' : 'loss'">
            {{ formatCurrency(monthlyPnL) }}
          </span>
        </div>
      </div>
    </div>

    <div class="calendar-grid-container">
      <div class="calendar-weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday-label">{{ day }}</div>
      </div>
      <div class="calendar-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'is-today': day.isToday,
            'has-trades': day.tradeCount > 0
          }"
          @click="selectDay(day)"
        >
          <div class="day-number">{{ day.date.day }}</div>
          <div v-if="day.tradeCount > 0" class="day-content">
            <div class="day-pnl" :class="day.pnl >= 0 ? 'profit' : 'loss'">
              {{ formatCurrency(day.pnl) }}
            </div>
            <div class="day-trade-count">{{ day.tradeCount }} trades</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Trades Detail -->
    <div v-if="selectedDay" class="day-details mt-xl">
      <div class="details-header">
        <h3>Trades for {{ formatFullDate(selectedDay.date) }}</h3>
        <button @click="selectedDay = null" class="btn btn-secondary btn-sm">Close</button>
      </div>
      <TradeList :trades="selectedDay.trades" :limit="0" />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { DateTime } from 'luxon';
import { formatCurrency } from '../utils/formatters';
import { getTradePnL } from '../utils/calculations';
import TradeList from './TradeList.vue';

export default {
  name: 'CalendarView',
  components: {
    TradeList,
  },
  props: {
    trades: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const currentDate = ref(DateTime.now());
    const selectedDay = ref(null);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const currentMonthName = computed(() => currentDate.value.monthLong);
    const currentYear = computed(() => currentDate.value.year);

    const prevMonth = () => {
      currentDate.value = currentDate.value.minus({ months: 1 });
      selectedDay.value = null;
    };

    const nextMonth = () => {
      currentDate.value = currentDate.value.plus({ months: 1 });
      selectedDay.value = null;
    };

    const calendarDays = computed(() => {
      const startOfMonth = currentDate.value.startOf('month');
      const endOfMonth = currentDate.value.endOf('month');
      
      // Start from the first Sunday before or on the 1st
      // luxon's startOf('week') is always Monday, so we adjust manually for Sunday
      let startDay = startOfMonth.minus({ days: startOfMonth.weekday % 7 });
      // End at the last Saturday after or on the last day
      // We want to fill the last week until Saturday (which is 6 days after Sunday)
      let endDay = endOfMonth.plus({ days: 6 - (endOfMonth.weekday % 7) });

      const days = [];
      let curr = startDay;

      while (curr <= endDay) {
        const dateKey = curr.toISODate();
        
        // Filter trades for this day
        const dayTrades = props.trades.filter(trade => {
          const rawExit = trade.exit_timestamp?.toDate?.() || (trade.exit_timestamp ? new Date(trade.exit_timestamp) : null);
          const rawEntry = trade.entry_timestamp?.toDate?.() || (trade.entry_timestamp ? new Date(trade.entry_timestamp) : null);
          const exitDate = (rawExit && !isNaN(rawExit)) ? rawExit : rawEntry;
          if (!exitDate || isNaN(exitDate)) return false;
          
          return DateTime.fromJSDate(exitDate).toISODate() === dateKey;
        });

        const dayPnL = dayTrades.reduce((sum, t) => {
           if (t.status === 'CLOSED' || t.status === 'PARTIAL_CLOSED') {
             return sum + getTradePnL(t);
           }
           return sum;
        }, 0);

        days.push({
          date: curr,
          isCurrentMonth: curr.month === currentDate.value.month,
          isToday: curr.hasSame(DateTime.now(), 'day'),
          trades: dayTrades,
          tradeCount: dayTrades.length,
          pnl: dayPnL
        });

        curr = curr.plus({ days: 1 });
      }

      return days;
    });

    const monthlyPnL = computed(() => {
      return calendarDays.value
        .filter(d => d.isCurrentMonth)
        .reduce((sum, d) => sum + d.pnl, 0);
    });

    const selectDay = (day) => {
      if (day.tradeCount > 0) {
        selectedDay.value = day;
      }
    };

    const formatFullDate = (dt) => {
      return dt.toLocaleString(DateTime.DATE_HUGE);
    };

    return {
      currentMonthName,
      currentYear,
      weekDays,
      calendarDays,
      monthlyPnL,
      selectedDay,
      prevMonth,
      nextMonth,
      selectDay,
      formatCurrency,
      formatFullDate,
    };
  },
};
</script>

<style scoped>
.calendar-view {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--glass-border);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.calendar-nav h2 {
  margin: 0;
  min-width: 200px;
  text-align: center;
}

.stat-label {
  color: var(--color-text-tertiary);
  margin-right: var(--spacing-sm);
  font-weight: 500;
}

.stat-value {
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.calendar-grid-container {
  width: 100%;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--spacing-sm);
}

.weekday-label {
  text-align: center;
  font-weight: 600;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  padding: var(--spacing-sm);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--glass-border);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.calendar-day {
  background: var(--color-bg-secondary);
  min-height: 100px;
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  transition: all var(--transition-fast);
  cursor: default;
}

.calendar-day.has-trades {
  cursor: pointer;
}

.calendar-day.has-trades:hover {
  background: var(--color-surface-hover);
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.is-today {
  box-shadow: inset 0 0 0 2px var(--color-primary);
}

.day-number {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.day-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
}

.day-pnl {
  font-weight: 700;
  font-size: var(--font-size-sm);
}

.day-trade-count {
  font-size: 10px;
  color: var(--color-text-muted);
}

.day-details {
  background: var(--color-bg-tertiary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  animation: slideUp 0.3s ease-out;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1024px) {
  .calendar-day {
    min-height: 80px;
  }
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 60px;
    font-size: 10px;
  }
  .day-pnl {
    font-size: 10px;
  }
  .day-trade-count {
    display: none;
  }
}
</style>
