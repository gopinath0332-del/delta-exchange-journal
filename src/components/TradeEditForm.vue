<template>
  <div class="trade-edit-form glass-card p-xl">
    <div class="form-header mb-lg">
      <h3>Edit Trade</h3>
      <p>Modify the values of the selected trade</p>
    </div>

    <form @submit.prevent="handleSubmit" class="grid grid-cols-2 gap-lg">
      <!-- Symbol -->
      <div class="form-group">
        <label>Symbol</label>
        <input v-model="formData.symbol" type="text" class="input" required />
      </div>

      <!-- Strategy -->
      <div class="form-group">
        <label>Strategy</label>
        <input v-model="formData.strategy_name" type="text" class="input" />
      </div>

      <!-- Entry Date -->
      <div class="form-group">
        <label>Entry Date</label>
        <input v-model="entryDateStr" type="datetime-local" class="input" required />
      </div>

      <!-- Leverage -->
      <div class="form-group">
        <label>Leverage</label>
        <input v-model.number="formData.leverage" type="number" step="1" class="input" />
      </div>

      <!-- Entry Price -->
      <div class="form-group">
        <label>Entry Price</label>
        <input v-model.number="formData.entry_price" type="number" step="0.000001" class="input" required />
      </div>

      <!-- Entry Side -->
      <div class="form-group">
        <label>Entry Side</label>
        <select v-model="formData.entry_side" class="select">
          <option value="buy">BUY</option>
          <option value="sell">SELL</option>
        </select>
      </div>

      <!-- Exit Price -->
      <div class="form-group">
        <label>Exit Price</label>
        <input v-model.number="formData.exit_price" type="number" step="0.000001" class="input" />
      </div>

      <!-- Exit Side -->
      <div class="form-group">
        <label>Exit Side</label>
        <select v-model="formData.exit_side" class="select">
          <option value="buy">BUY</option>
          <option value="sell">SELL</option>
        </select>
      </div>

      <!-- PnL -->
      <div class="form-group">
        <label>PnL ($)</label>
        <input v-model.number="formData.pnl" type="number" step="0.0001" class="input" />
      </div>

      <!-- R-Multiple -->
      <div class="form-group">
        <label>R-Multiple</label>
        <input v-model.number="formData.r_multiple" type="number" step="0.01" class="input" />
      </div>

      <!-- Days Held -->
      <div class="form-group">
        <label>Days Held</label>
        <input v-model.number="formData.days_held" type="number" step="0.01" class="input" />
      </div>

      <!-- Status -->
      <div class="form-group">
        <label>Status</label>
        <select v-model="formData.status" class="select">
          <option value="OPEN">OPEN</option>
          <option value="PARTIAL_CLOSED">PARTIAL CLOSED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      <!-- Mode -->
      <div class="form-group">
        <label>Mode</label>
        <select v-model="formData.mode" class="select">
          <option value="LIVE">LIVE</option>
          <option value="PAPER">PAPER</option>
        </select>
      </div>

      <div class="form-actions col-span-2 mt-xl">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Updating...' : 'Update Trade' }}
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
      // Format timestamp for datetime-local input
      if (props.trade.entry_timestamp) {
        const date = props.trade.entry_timestamp.toDate?.() || new Date(props.trade.entry_timestamp);
        // Format to YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        entryDateStr.value = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    });

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
    };
  },
};
</script>

<style scoped>
.trade-edit-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-header h3 {
  margin-bottom: var(--spacing-xs);
  color: var(--color-primary-light);
}

.form-header p {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
}

.col-span-2 {
  grid-column: span 2;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

@media (max-width: 640px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
  .col-span-2 {
    grid-column: span 1;
  }
}
</style>
