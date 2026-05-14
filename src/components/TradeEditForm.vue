<template>
  <div class="trade-edit-form">
    <div class="form-header mb-lg">
      <div class="header-icon">✏️</div>
      <div class="header-text">
        <h3>Edit Trade</h3>
        <p>Modify the values of the selected trade</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="form-content">
      <!-- Section: General Info -->
      <div class="form-section mb-xl">
        <h4 class="section-title">General Information</h4>
        <div class="grid grid-cols-2 gap-md">
          <div class="form-group">
            <label>Symbol</label>
            <input v-model="formData.symbol" type="text" class="input" required placeholder="e.g. BTCUSD" />
          </div>
          <div class="form-group">
            <label>Strategy</label>
            <input v-model="formData.strategy_name" type="text" class="input" placeholder="e.g. EMA Cross" />
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

      <!-- Section: Entry Details -->
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

      <!-- Section: Exit Details -->
      <div class="form-section mb-xl">
        <h4 class="section-title">Exit Details</h4>
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

      <!-- Section: Performance -->
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

      <div class="form-actions mt-2xl">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="loading" class="btn-spinner"></span>
          {{ loading ? 'Updating...' : 'Save Changes' }}
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

    onMounted(() => {
      if (props.trade.entry_timestamp) {
        const date = props.trade.entry_timestamp.toDate?.() || new Date(props.trade.entry_timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        entryDateStr.value = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    });

    const getPnLClass = (pnl) => {
      if (!pnl) return '';
      return pnl > 0 ? 'text-profit' : 'text-loss';
    };

    const handleSubmit = async () => {
      loading.value = true;
      try {
        const updatedData = {
          ...formData.value,
          entry_timestamp: entryDateStr.value,
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
      handleSubmit,
      getPnLClass,
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
  background: var(--color-primary-bg, rgba(102, 126, 234, 0.1));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: 1px solid var(--color-primary-border, rgba(102, 126, 234, 0.2));
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

/* Side Selector Toggle */
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

.side-option input {
  display: none;
}

.side-option.active {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.side-option:first-of-type.active {
  background: var(--color-profit-bg);
  color: var(--color-profit);
}

.side-option:last-of-type.active {
  background: var(--color-loss-bg);
  color: var(--color-loss);
}

/* Input with Suffix */
.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-suffix .input {
  padding-right: 40px;
}

.input-with-suffix .suffix {
  position: absolute;
  right: var(--spacing-md);
  color: var(--color-text-muted);
  font-weight: 600;
}

.text-profit {
  color: var(--color-profit) !important;
  border-color: var(--color-profit-border) !important;
}

.text-loss {
  color: var(--color-loss) !important;
  border-color: var(--color-loss-border) !important;
}

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

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .grid-cols-2, .grid-cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>
