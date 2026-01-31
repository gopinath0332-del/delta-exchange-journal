<template>
  <div class="calendar-heatmap" ref="heatmapRef" @mouseleave="hideTooltip">
    <div 
      v-if="tooltip.visible" 
      class="custom-tooltip" 
      :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
    >
      <div class="tooltip-header">
        <span class="tooltip-date">{{ formatShortDate(tooltip.day.date) }}</span>
        <span class="tooltip-pnl" :class="getPnLClass(tooltip.day.pnl)">
          {{ formatCurrency(tooltip.day.pnl) }}
        </span>
      </div>
      <div class="tooltip-stats">
        {{ tooltip.day.tradeCount }} trade{{ tooltip.day.tradeCount !== 1 ? 's' : '' }}
      </div>
      <div v-if="tooltip.day.trades && tooltip.day.trades.length > 0" class="tooltip-trades">
        <div v-for="trade in tooltip.day.trades.slice(0, 5)" :key="trade.id" class="tooltip-trade-row">
           <span class="trade-symbol">{{ trade.symbol }}</span>
           <span :class="getPnLClass(trade.pnl)">{{ formatCurrency(trade.pnl) }}</span>
        </div>
        <div v-if="tooltip.day.trades.length > 5" class="tooltip-more">
           +{{ tooltip.day.trades.length - 5 }} more
        </div>
      </div>
    </div>
    <h3 class="mb-md">{{ title }}</h3>
    <p class="subtitle mb-lg">{{ subtitle }}</p>
    
    <div class="heatmap-container">
      <!-- Month labels -->
      <div class="month-labels">
        <span v-for="month in monthLabels" :key="month.index" :style="{ gridColumn: month.gridColumn }">
          {{ month.name }}
        </span>
      </div>
      
      <!-- Day labels -->
      <div class="day-labels">
        <span>Mon</span>
        <span>Wed</span>
        <span>Fri</span>
      </div>
      
      <!-- Calendar grid -->
      <div class="calendar-grid">
        <div
          v-for="(day, index) in calendarData"
          :key="index"
          :class="['day-cell', `intensity-${day.intensity}`, day.color]"
          @mouseenter="showTooltip($event, day)"
          @click="selectDay(day)"
        >
        </div>
      </div>
    </div>
    
    <!-- Legend -->
    <div class="legend mt-md">
      <span class="legend-label">Less</span>
      <div class="legend-scale">
        <div class="legend-cell intensity-0"></div>
        <div class="legend-cell profit intensity-1"></div>
        <div class="legend-cell profit intensity-2"></div>
        <div class="legend-cell profit intensity-3"></div>
        <div class="legend-cell profit intensity-4"></div>
      </div>
      <span class="legend-label">More Profit</span>
      
      <div class="legend-scale ml-lg">
        <div class="legend-cell loss intensity-1"></div>
        <div class="legend-cell loss intensity-2"></div>
        <div class="legend-cell loss intensity-3"></div>
        <div class="legend-cell loss intensity-4"></div>
      </div>
      <span class="legend-label">More Loss</span>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { calculateDailyPerformance } from '../utils/calculations';
import { formatCurrency, formatShortDate } from '../utils/formatters';

export default {
  name: 'CalendarHeatmap',
  props: {
    trades: {
      type: Array,
      required: true,
    },
    title: {
      type: String,
      default: 'Trading Activity',
    },
    subtitle: {
      type: String,
      default: 'Daily profit/loss heatmap for the last year',
    },
    daysToShow: {
      type: Number,
      default: 365,
    },
  },
  emits: ['day-selected'],
  setup(props, { emit }) {
    const calendarData = computed(() => 
      calculateDailyPerformance(props.trades, props.daysToShow)
    );

    // Calculate month labels for the grid
    const monthLabels = computed(() => {
      const labels = [];
      let currentMonth = -1;
      let weekIndex = 0;

      calendarData.value.forEach((day, index) => {
        const month = day.date.getMonth();
        const weekDay = day.date.getDay();
        
        if (weekDay === 1) weekIndex++; // Monday starts a new week
        
        if (month !== currentMonth && weekDay === 1) {
          labels.push({
            name: day.date.toLocaleDateString('en-US', { month: 'short' }),
            index: month,
            gridColumn: Math.floor(weekIndex) + 1,
          });
          currentMonth = month;
        }
      });

      return labels;
    });

    const heatmapRef = ref(null);
    const tooltip = ref({
      visible: false,
      x: 0,
      y: 0,
      day: null,
    });

    const getPnLClass = (pnl) => {
      if (!pnl) return 'neutral';
      return pnl > 0 ? 'profit' : 'loss';
    };

    const showTooltip = (event, day) => {
      if (day.tradeCount === 0) return;
      
      const cellRect = event.target.getBoundingClientRect();
      // Calculate position relative to container or viewport
      // Using simple offset implementation
      tooltip.value = {
        visible: true,
        x: cellRect.right + 10, // Position to right of cell
        y: cellRect.top - 10,  // Slightly elevated
        day: day,
      };
    };

    const hideTooltip = () => {
      tooltip.value.visible = false;
    };

    const selectDay = (day) => {
      if (day.tradeCount > 0) {
        emit('day-selected', day);
      }
    };

    return {
      calendarData,
      monthLabels,
      heatmapRef,
      tooltip,
      getPnLClass,
      showTooltip,
      hideTooltip,
      formatShortDate,
      formatCurrency,
      selectDay,
    };
  },
};
</script>

<style scoped>
.calendar-heatmap {
  width: 100%;
  position: relative; /* For tooltip positioning context if needed, though using fixed/absolute for simplicity */
}

.custom-tooltip {
  position: fixed; /* Fixed to viewport to avoid overflow issues */
  z-index: 1000;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  min-width: 180px;
  pointer-events: none; /* Let mouse events pass through so mouseleave works */
  animation: fadeIn 0.15s ease-out;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: var(--spacing-xs);
}

.tooltip-date {
  color: var(--color-text-primary);
}

.tooltip-pnl {
  font-weight: 700;
}

.tooltip-stats {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}

.tooltip-trades {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltip-trade-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
}

.trade-symbol {
  color: var(--color-text-secondary);
}

.tooltip-more {
  text-align: center;
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.heatmap-container {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-sm);
  overflow-x: auto;
}

.month-labels {
  grid-column: 2;
  display: grid;
  grid-template-columns: repeat(53, 12px);
  gap: 3px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xs);
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding-top: 3px;
}

.day-labels span {
  height: 12px;
  display: flex;
  align-items: center;
  line-height: 1;
}

.day-labels span:nth-child(2) {
  margin-top: 12px; /* Skip Tuesday */
}

.day-labels span:nth-child(3) {
  margin-top: 12px; /* Skip Thursday */
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(53, 12px);
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 12px);
  gap: 3px;
}

.day-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--glass-border);
}

.day-cell:hover {
  transform: scale(1.3);
  border-color: var(--color-primary);
  z-index: 10;
}

/* Profit intensities */
.day-cell.profit.intensity-1 {
  background: rgba(34, 197, 94, 0.2);
}

.day-cell.profit.intensity-2 {
  background: rgba(34, 197, 94, 0.4);
}

.day-cell.profit.intensity-3 {
  background: rgba(34, 197, 94, 0.6);
}

.day-cell.profit.intensity-4 {
  background: rgba(34, 197, 94, 0.8);
}

/* Loss intensities */
.day-cell.loss.intensity-1 {
  background: rgba(239, 68, 68, 0.2);
}

.day-cell.loss.intensity-2 {
  background: rgba(239, 68, 68, 0.4);
}

.day-cell.loss.intensity-3 {
  background: rgba(239, 68, 68, 0.6);
}

.day-cell.loss.intensity-4 {
  background: rgba(239, 68, 68, 0.8);
}

/* Neutral */
.day-cell.neutral.intensity-1 {
  background: var(--color-bg-tertiary);
  border-color: var(--color-text-muted);
}

/* Legend */
.legend {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.legend-label {
  font-weight: 500;
}

.legend-scale {
  display: flex;
  gap: 3px;
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--glass-border);
}

.legend-cell.intensity-0 {
  background: var(--color-bg-tertiary);
}

.legend-cell.profit.intensity-1 {
  background: rgba(34, 197, 94, 0.2);
}

.legend-cell.profit.intensity-2 {
  background: rgba(34, 197, 94, 0.4);
}

.legend-cell.profit.intensity-3 {
  background: rgba(34, 197, 94, 0.6);
}

.legend-cell.profit.intensity-4 {
  background: rgba(34, 197, 94, 0.8);
}

.legend-cell.loss.intensity-1 {
  background: rgba(239, 68, 68, 0.2);
}

.legend-cell.loss.intensity-2 {
  background: rgba(239, 68, 68, 0.4);
}

.legend-cell.loss.intensity-3 {
  background: rgba(239, 68, 68, 0.6);
}

.legend-cell.loss.intensity-4 {
  background: rgba(239, 68, 68, 0.8);
}

@media (max-width: 768px) {
  .calendar-grid {
    grid-template-columns: repeat(53, 10px);
    grid-template-rows: repeat(7, 10px);
    gap: 2px;
  }
  
  .day-cell,
  .legend-cell {
    width: 10px;
    height: 10px;
  }
  
  .month-labels {
    grid-template-columns: repeat(53, 10px);
    gap: 2px;
  }
}
</style>
