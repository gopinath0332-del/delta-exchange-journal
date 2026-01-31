<template>
  <div class="trade-list">
    <!-- Filters (if not limited) -->
    <div v-if="!limit" class="filters-section mb-lg">
      <div class="filters-grid">
        <!-- Search -->
        <input
          v-model="searchQuery"
          type="text"
          class="input"
          placeholder="Search by symbol, strategy..."
        />

        <!-- Status Filter -->
        <select v-model="statusFilter" class="select">
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>

        <!-- Symbol Filter -->
        <select v-model="symbolFilter" class="select">
          <option value="">All Symbols</option>
          <option v-for="symbol in uniqueSymbols" :key="symbol" :value="symbol">
            {{ symbol }}
          </option>
        </select>

        <!-- Strategy Filter -->
        <select v-model="strategyFilter" class="select">
          <option value="">All Strategies</option>
          <option v-for="strategy in uniqueStrategies" :key="strategy" :value="strategy">
            {{ strategy }}
          </option>
        </select>
      </div>

      <!-- Date Range Filters -->
      <div class="date-filters mt-md">
        <div class="date-filter-group">
          <label for="startDate" class="date-label">From Date</label>
          <input
            id="startDate"
            v-model="startDate"
            type="date"
            class="input date-input"
            placeholder="Start date"
          />
        </div>
        <div class="date-filter-group">
          <label for="endDate" class="date-label">To Date</label>
          <input
            id="endDate"
            v-model="endDate"
            type="date"
            class="input date-input"
            placeholder="End date"
          />
        </div>
      </div>

      <button v-if="hasActiveFilters" @click="clearFilters" class="btn btn-secondary mt-md">
        Clear Filters
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th @click="sortBy('symbol')" class="sortable">
              Symbol
              <span v-if="sortColumn === 'symbol'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th @click="sortBy('entry_timestamp')" class="sortable">
              Entry Date
              <span v-if="sortColumn === 'entry_timestamp'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Entry</th>
            <th>Exit</th>
            <th @click="sortBy('pnl')" class="sortable">
              PnL
              <span v-if="sortColumn === 'pnl'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>Strategy</th>
            <th>Status</th>
            <th>Mode</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="trade in displayedTrades"
            :key="trade.id"
            @click="selectTrade(trade)"
            class="trade-row"
          >
            <td class="font-semibold">{{ trade.symbol }}</td>
            <td>{{ formatShortDate(trade.entry_timestamp) }}</td>
            <td>
              <span :class="`side-${trade.entry_side}`">
                {{ trade.entry_side?.toUpperCase() }}
              </span>
              @ {{ formatCurrency(trade.entry_price, '') }}
            </td>
            <td>
              <span v-if="trade.status === 'CLOSED'">
                <span :class="`side-${trade.exit_side}`">
                  {{ trade.exit_side?.toUpperCase() }}
                </span>
                @ {{ formatCurrency(trade.exit_price, '') }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td :class="getPnLClass(trade.pnl)">
              {{ trade.status === 'CLOSED' ? formatCurrency(trade.pnl) : 'OPEN' }}
            </td>
            <td>{{ trade.strategy_name || 'N/A' }}</td>
            <td>
              <span class="badge" :class="`badge-${trade.status.toLowerCase()}`">
                {{ trade.status }}
              </span>
            </td>
            <td>
              <span class="badge" :class="`badge-${trade.mode?.toLowerCase()}`">
                {{ trade.mode }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredTrades.length === 0" class="empty-state">
        <p>No trades found</p>
      </div>
    </div>

    <!-- Trade Detail Modal (if selected) -->
    <div v-if="selectedTrade" class="modal-overlay" @click="selectedTrade = null">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="selectedTrade = null">×</button>
        <TradeCard :trade="selectedTrade" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import TradeCard from './TradeCard.vue';
import { formatCurrency, formatShortDate } from '../utils/formatters';

export default {
  name: 'TradeList',
  components: {
    TradeCard,
  },
  props: {
    trades: {
      type: Array,
      required: true,
    },
    limit: {
      type: Number,
      default: null,
    },
  },
  setup(props) {
    const searchQuery = ref('');
    const statusFilter = ref('');
    const symbolFilter = ref('');
    const strategyFilter = ref('');
    const startDate = ref('');
    const endDate = ref('');
    const sortColumn = ref('entry_timestamp');
    const sortDirection = ref('desc');
    const selectedTrade = ref(null);

    // Get unique values for filters
    const uniqueSymbols = computed(() => {
      return [...new Set(props.trades.map((t) => t.symbol))].filter(Boolean).sort();
    });

    const uniqueStrategies = computed(() => {
      return [...new Set(props.trades.map((t) => t.strategy_name))].filter(Boolean).sort();
    });

    // Filter trades
    const filteredTrades = computed(() => {
      let result = [...props.trades];

      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
          (t) =>
            t.symbol?.toLowerCase().includes(query) ||
            t.strategy_name?.toLowerCase().includes(query)
        );
      }

      // Status filter
      if (statusFilter.value) {
        result = result.filter((t) => t.status === statusFilter.value);
      }

      // Symbol filter
      if (symbolFilter.value) {
        result = result.filter((t) => t.symbol === symbolFilter.value);
      }

      // Strategy filter
      if (strategyFilter.value) {
        result = result.filter((t) => t.strategy_name === strategyFilter.value);
      }

      // Date range filter
      if (startDate.value) {
        const start = new Date(startDate.value);
        start.setHours(0, 0, 0, 0);
        result = result.filter((t) => {
          const tradeDate = t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp);
          return tradeDate >= start;
        });
      }

      if (endDate.value) {
        const end = new Date(endDate.value);
        end.setHours(23, 59, 59, 999);
        result = result.filter((t) => {
          const tradeDate = t.entry_timestamp?.toDate?.() || new Date(t.entry_timestamp);
          return tradeDate <= end;
        });
      }

      // Sort
      result.sort((a, b) => {
        let aVal = a[sortColumn.value];
        let bVal = b[sortColumn.value];

        // Handle timestamps
        if (sortColumn.value.includes('timestamp')) {
          aVal = aVal?.toDate?.() || new Date(aVal);
          bVal = bVal?.toDate?.() || new Date(bVal);
        }

        // Handle null/undefined
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (sortDirection.value === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      return result;
    });

    // Apply limit if specified
    const displayedTrades = computed(() => {
      if (props.limit) {
        return filteredTrades.value.slice(0, props.limit);
      }
      return filteredTrades.value;
    });

    const hasActiveFilters = computed(() => {
      return !!(
        searchQuery.value ||
        statusFilter.value ||
        symbolFilter.value ||
        strategyFilter.value ||
        startDate.value ||
        endDate.value
      );
    });

    const sortBy = (column) => {
      if (sortColumn.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn.value = column;
        sortDirection.value = 'desc';
      }
    };

    const clearFilters = () => {
      searchQuery.value = '';
      statusFilter.value = '';
      symbolFilter.value = '';
      strategyFilter.value = '';
      startDate.value = '';
      endDate.value = '';
    };

    const getPnLClass = (pnl) => {
      if (!pnl) return 'neutral';
      return pnl > 0 ? 'profit' : 'loss';
    };

    const selectTrade = (trade) => {
      selectedTrade.value = trade;
    };

    return {
      searchQuery,
      statusFilter,
      symbolFilter,
      strategyFilter,
      startDate,
      endDate,
      sortColumn,
      sortDirection,
      selectedTrade,
      uniqueSymbols,
      uniqueStrategies,
      filteredTrades,
      displayedTrades,
      hasActiveFilters,
      sortBy,
      clearFilters,
      getPnLClass,
      selectTrade,
      formatCurrency,
      formatShortDate,
    };
  },
};
</script>

<style scoped>
.trade-list {
  width: 100%;
}

.filters-section {
  background: var(--color-bg-tertiary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.date-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.date-filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.date-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-input {
  cursor: pointer;
}

.table-container {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast);
}

.sortable:hover {
  color: var(--color-primary);
}

.trade-row {
  cursor: pointer;
}

.empty-state {
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--color-text-muted);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-xl);
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideIn 0.3s ease-out;
}

.modal-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--glass-border);
  color: var(--color-text-primary);
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  z-index: 10;
}

.modal-close:hover {
  background: var(--color-surface-hover);
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .table-container {
    font-size: var(--font-size-xs);
  }

  .table th,
  .table td {
    padding: var(--spacing-sm);
  }
}
</style>
