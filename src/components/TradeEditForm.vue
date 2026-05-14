<template>
  <div class="trade-edit-form">
    <div class="form-header mb-lg">
      <div class="header-icon">✏️</div>
      <div class="header-text">
        <h3>Edit Trade — {{ formData.symbol }}</h3>
        <p>Modify trade details, exits, and event history</p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-nav mb-lg">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        {{ tab.label }}
        <span v-if="tab.id === 'events' && events.length" class="tab-badge">{{ events.length }}</span>
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="form-content">

      <!-- ===== TAB: General ===== -->
      <div v-show="activeTab === 'general'">
        <div class="form-section mb-xl">
          <h4 class="section-title">General Information</h4>
          <div class="grid grid-cols-2 gap-md">
            <div class="form-group">
              <label>Symbol</label>
              <input v-model="formData.symbol" type="text" class="input" required placeholder="e.g. BTCUSD" />
            </div>
            <div class="form-group">
              <label>Strategy</label>
              <input v-model="formData.strategy_name" type="text" class="input" placeholder="e.g. Donchian Channel" />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="formData.status" class="select">
                <option value="OPEN">OPEN</option>
                <option value="PARTIAL_CLOSED">PARTIAL CLOSED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div class="form-group">
              <label>Mode</label>
              <select v-model="formData.mode" class="select">
                <option value="LIVE">LIVE</option>
                <option value="PAPER">PAPER</option>
              </select>
            </div>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="form-section mb-xl">
          <h4 class="section-title">Entry Details</h4>
          <div class="grid grid-cols-2 gap-md">
            <div class="form-group">
              <label>Entry Date</label>
              <input v-model="entryDateStr" type="datetime-local" class="input" required />
            </div>
            <div class="form-group">
              <label>Leverage</label>
              <div class="input-with-suffix">
                <input v-model.number="formData.leverage" type="number" step="1" class="input" />
                <span class="suffix">x</span>
              </div>
            </div>
            <div class="form-group">
              <label>Entry Price</label>
              <input v-model.number="formData.entry_price" type="number" step="0.000001" class="input" required />
            </div>
            <div class="form-group">
              <label>Entry Side</label>
              <div class="side-selector">
                <label class="side-option" :class="{ active: formData.entry_side === 'buy' }">
                  <input type="radio" v-model="formData.entry_side" value="buy" />
                  <span>BUY</span>
                </label>
                <label class="side-option" :class="{ active: formData.entry_side === 'sell' }">
                  <input type="radio" v-model="formData.entry_side" value="sell" />
                  <span>SELL</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="form-section mb-xl">
          <h4 class="section-title">Final Exit Details</h4>
          <div class="grid grid-cols-2 gap-md">
            <div class="form-group">
              <label>Exit Price</label>
              <input v-model.number="formData.exit_price" type="number" step="0.000001" class="input" />
            </div>
            <div class="form-group">
              <label>Exit Side</label>
              <div class="side-selector">
                <label class="side-option" :class="{ active: formData.exit_side === 'buy' }">
                  <input type="radio" v-model="formData.exit_side" value="buy" />
                  <span>BUY</span>
                </label>
                <label class="side-option" :class="{ active: formData.exit_side === 'sell' }">
                  <input type="radio" v-model="formData.exit_side" value="sell" />
                  <span>SELL</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="form-section mb-xl">
          <h4 class="section-title">Performance Metrics</h4>
          <div class="grid grid-cols-3 gap-md">
            <div class="form-group">
              <label>PnL ($)</label>
              <input v-model.number="formData.pnl" type="number" step="0.0001" class="input" :class="getPnLClass(formData.pnl)" />
            </div>
            <div class="form-group">
              <label>R-Multiple</label>
              <input v-model.number="formData.r_multiple" type="number" step="0.01" class="input" />
            </div>
            <div class="form-group">
              <label>Days Held</label>
              <input v-model.number="formData.days_held" type="number" step="0.01" class="input" />
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB: Events (Partial / Milestone Exits) ===== -->
      <div v-show="activeTab === 'events'">
        <div class="events-header mb-lg">
          <div>
            <h4 class="section-title" style="margin-bottom: 4px;">Trade Events</h4>
            <p class="events-subtitle">Partial exits, milestone exits, and re-entries recorded for this trade</p>
          </div>
          <button type="button" @click="addEvent" class="btn-add-event">
            + Add Event
          </button>
        </div>

        <!-- Empty state -->
        <div v-if="events.length === 0" class="events-empty">
          <span class="events-empty-icon">📭</span>
          <p>No events recorded for this trade.</p>
          <button type="button" @click="addEvent" class="btn btn-secondary mt-md">Add First Event</button>
        </div>

        <!-- Event Cards -->
        <div v-else class="events-list">
          <div
            v-for="(event, idx) in events"
            :key="idx"
            class="event-card"
            :class="getEventClass(event.action)"
          >
            <div class="event-card-header">
              <div class="event-badge">
                <span class="event-index">#{{ idx + 1 }}</span>
                <span class="event-action-badge" :class="getEventClass(event.action)">{{ formatAction(event.action) }}</span>
              </div>
              <button type="button" @click="removeEvent(idx)" class="btn-remove-event" title="Remove event">✕</button>
            </div>

            <div class="grid grid-cols-2 gap-md mt-md">
              <div class="form-group">
                <label>Action</label>
                <select v-model="event.action" class="select select-sm">
                  <option value="ENTRY_LONG">ENTRY LONG</option>
                  <option value="ENTRY_SHORT">ENTRY SHORT</option>
                  <option value="EXIT_LONG">EXIT LONG (Full)</option>
                  <option value="EXIT_SHORT">EXIT SHORT (Full)</option>
                  <option value="EXIT_LONG_PARTIAL">EXIT LONG (Partial)</option>
                  <option value="EXIT_SHORT_PARTIAL">EXIT SHORT (Partial)</option>
                  <option value="PARTIAL_EXIT">PARTIAL EXIT</option>
                  <option value="MILESTONE_EXIT">MILESTONE EXIT</option>
                </select>
              </div>
              <div class="form-group">
                <label>Side</label>
                <div class="side-selector">
                  <label class="side-option" :class="{ active: event.side === 'buy' }">
                    <input type="radio" v-model="event.side" value="buy" />
                    <span>BUY</span>
                  </label>
                  <label class="side-option" :class="{ active: event.side === 'sell' }">
                    <input type="radio" v-model="event.side" value="sell" />
                    <span>SELL</span>
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>Price</label>
                <input v-model.number="event.price" type="number" step="0.000001" class="input" />
              </div>
              <div class="form-group">
                <label>Order Size</label>
                <input v-model.number="event.order_size" type="number" step="1" class="input" />
              </div>
              <div class="form-group">
                <label>PnL ($)</label>
                <input v-model.number="event.pnl" type="number" step="0.0001" class="input" :class="getPnLClass(event.pnl)" />
              </div>
              <div class="form-group">
                <label>Timestamp</label>
                <input :value="formatEventTimestamp(event.timestamp)" @change="updateEventTimestamp(idx, $event.target.value)" type="datetime-local" class="input" />
              </div>
              <div class="form-group col-span-2">
                <label>Reason / Notes</label>
                <input v-model="event.reason" type="text" class="input" placeholder="e.g. Milestone 1 hit, took 50% profit" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions mt-2xl">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="loading" class="btn-spinner"></span>
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { updateTrade } from '../firebase/tradeService';
import { TRADE_COLLECTION } from '../firebase/constants';

export default {
  name: 'TradeEditForm',
  props: {
    trade: {
      type: Object,
      required: true,
    },
  },
  emits: ['updated', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({ ...props.trade });
    const loading = ref(false);
    const entryDateStr = ref('');
    const activeTab = ref('general');
    const events = ref([]);

    const tabs = [
      { id: 'general', label: 'Trade Details' },
      { id: 'events', label: 'Events / Exits' },
    ];

    onMounted(() => {
      // Format entry timestamp for datetime-local input
      if (props.trade.entry_timestamp) {
        const date = props.trade.entry_timestamp.toDate?.() || new Date(props.trade.entry_timestamp);
        entryDateStr.value = toLocalDateTimeString(date);
      }

      // Deep-clone events array, converting Firestore Timestamps to strings
      const rawEvents = props.trade.events || [];
      events.value = rawEvents.map(e => ({
        ...e,
        timestamp: e.timestamp
          ? (e.timestamp.toDate?.() || new Date(e.timestamp))
          : null,
      }));
    });

    const toLocalDateTimeString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formatEventTimestamp = (ts) => {
      if (!ts) return '';
      const date = ts instanceof Date ? ts : new Date(ts);
      return toLocalDateTimeString(date);
    };

    const updateEventTimestamp = (idx, value) => {
      events.value[idx].timestamp = value ? new Date(value) : null;
    };

    const getPnLClass = (pnl) => {
      if (!pnl) return '';
      return pnl > 0 ? 'text-profit' : 'text-loss';
    };

    const getEventClass = (action) => {
      if (!action) return 'event-neutral';
      if (action.includes('ENTRY')) return 'event-entry';
      if (action === 'MILESTONE_EXIT' || action.includes('MILESTONE')) return 'event-milestone';
      if (action.includes('PARTIAL')) return 'event-partial';
      return 'event-exit';
    };

    const formatAction = (action) => {
      if (!action) return 'EVENT';
      return action.replace(/_/g, ' ');
    };

    const addEvent = () => {
      events.value.push({
        action: 'PARTIAL_EXIT',
        side: 'sell',
        price: null,
        order_size: null,
        pnl: null,
        reason: '',
        timestamp: new Date(),
      });
      activeTab.value = 'events';
    };

    const removeEvent = (idx) => {
      events.value.splice(idx, 1);
    };

    const handleSubmit = async () => {
      loading.value = true;
      try {
        // Serialize events: convert Date objects back to ISO strings for Firestore
        const serializedEvents = events.value.map(e => {
          const evt = { ...e };
          if (evt.timestamp instanceof Date) {
            evt.timestamp = evt.timestamp.toISOString();
          }
          // Remove null/empty fields
          return Object.fromEntries(Object.entries(evt).filter(([, v]) => v !== null && v !== '' && v !== undefined));
        });

        const updatedData = {
          ...formData.value,
          entry_timestamp: entryDateStr.value,
          events: serializedEvents,
        };

        const result = await updateTrade(TRADE_COLLECTION, props.trade.id, updatedData);
        if (result.success) {
          emit('updated');
        } else {
          alert('Failed to update trade: ' + result.error?.message);
        }
      } catch (error) {
        console.error('Error in handleSubmit:', error);
        alert('An unexpected error occurred');
      } finally {
        loading.value = false;
      }
    };

    return {
      formData,
      entryDateStr,
      loading,
      activeTab,
      tabs,
      events,
      handleSubmit,
      getPnLClass,
      getEventClass,
      formatAction,
      formatEventTimestamp,
      updateEventTimestamp,
      addEvent,
      removeEvent,
    };
  },
};
</script>

<style scoped>
.trade-edit-form {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.form-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--glass-border);
}

.header-icon {
  width: 48px;
  height: 48px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: 1px solid rgba(102, 126, 234, 0.2);
  flex-shrink: 0;
}

.header-text h3 {
  margin: 0;
  color: var(--color-primary-light);
  font-size: var(--font-size-xl);
}

.header-text p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  gap: var(--spacing-xs);
  background: var(--color-bg-tertiary);
  padding: 4px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.tab-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  transition: all var(--transition-base);
  font-family: var(--font-family);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.tab-btn:not(.active):hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.tab-badge {
  background: rgba(255,255,255,0.25);
  color: inherit;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  padding: 1px 7px;
  font-weight: 700;
}

.tab-btn:not(.active) .tab-badge {
  background: var(--color-primary);
  color: white;
}

.form-content {
  padding-top: var(--spacing-md);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--spacing-sm);
}

.section-divider {
  height: 1px;
  background: var(--glass-border);
  margin: var(--spacing-lg) 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-left: var(--spacing-xs);
}

.col-span-2 {
  grid-column: span 2;
}

/* Side Selector */
.side-selector {
  display: flex;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  padding: 4px;
  border: 1px solid var(--glass-border);
}

.side-option {
  flex: 1;
  text-align: center;
  padding: var(--spacing-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 700;
  transition: all var(--transition-base);
  color: var(--color-text-muted);
}

.side-option input { display: none; }

.side-option:first-of-type.active {
  background: var(--color-profit-bg);
  color: var(--color-profit);
}

.side-option:last-of-type.active {
  background: var(--color-loss-bg);
  color: var(--color-loss);
}

/* Input with suffix */
.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-suffix .input { padding-right: 40px; }

.input-with-suffix .suffix {
  position: absolute;
  right: var(--spacing-md);
  color: var(--color-text-muted);
  font-weight: 600;
}

/* PnL coloring */
.text-profit {
  color: var(--color-profit) !important;
  border-color: var(--color-profit-border) !important;
}

.text-loss {
  color: var(--color-loss) !important;
  border-color: var(--color-loss-border) !important;
}

/* ===== Events Section ===== */
.events-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.events-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.btn-add-event {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: rgba(102, 126, 234, 0.12);
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius-md);
  color: var(--color-primary-light);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  font-family: var(--font-family);
  white-space: nowrap;
}

.btn-add-event:hover {
  background: rgba(102, 126, 234, 0.22);
}

.events-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--color-text-muted);
}

.events-empty-icon { font-size: 2rem; margin-bottom: var(--spacing-sm); }
.events-empty p { margin: 0; }

.events-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.event-card {
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--glass-border);
  border-left: 4px solid var(--glass-border);
  transition: all var(--transition-base);
}

.event-entry    { border-left-color: var(--color-primary); }
.event-milestone { border-left-color: #06b6d4; }
.event-partial  { border-left-color: var(--color-warning); }
.event-exit     { border-left-color: var(--color-profit); }

.event-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.event-index {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
}

.event-action-badge {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-action-badge.event-entry     { background: rgba(102,126,234,0.15); color: var(--color-primary-light); }
.event-action-badge.event-milestone  { background: rgba(6,182,212,0.15);   color: #22d3ee; }
.event-action-badge.event-partial   { background: var(--color-warning-bg); color: var(--color-warning); }
.event-action-badge.event-exit      { background: var(--color-profit-bg);  color: var(--color-profit); }
.event-action-badge.event-neutral   { background: var(--color-surface);    color: var(--color-text-secondary); }

.btn-remove-event {
  background: var(--color-loss-bg);
  border: 1px solid var(--color-loss-border);
  color: var(--color-loss);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-event:hover { background: var(--color-loss); color: white; }

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--glass-border);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: var(--spacing-sm);
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .grid-cols-2, .grid-cols-3 { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
  .events-header { flex-direction: column; align-items: stretch; }
}
</style>
