<template>
  <div class="trade-counter-card glass-card p-xl">
    <div class="counter-header">
      <h3>Trade Counter</h3>
      <div class="counter-actions">
        <button @click="showReset = !showReset" class="btn btn-secondary btn-sm">
          {{ showReset ? 'Cancel' : 'Reset' }}
        </button>
      </div>
    </div>

    <div class="counter-body">
      <div v-if="loading" class="flex justify-center p-lg">
        <span class="text-muted">Loading counter...</span>
      </div>
      <template v-else>
        <div class="remaining-display">
          <span class="count-value">{{ remainingCount }}</span>
          <span class="count-label">Trades Remaining</span>
        </div>

        <div v-if="showReset" class="reset-form mt-lg">
          <div class="flex gap-sm">
            <input
              v-model.number="resetValue"
              type="number"
              class="input"
              placeholder="Target trades (e.g. 20)"
            />
            <button @click="handleReset" class="btn btn-primary">Apply</button>
          </div>
          <p class="text-xs text-muted mt-sm">
            Sets a new target. The count will reduce with each new trade added.
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { subscribeToTradeCounter, updateTradeCounter } from '../firebase/settings';

export default {
  name: 'TradeCounter',
  props: {
    totalTrades: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const showReset = ref(false);
    const resetValue = ref(20);
    const loading = ref(true);
    
    // Remote state from Firestore
    const targetCount = ref(0);
    const startTradeCount = ref(0);
    let unsubscribe = null;

    onMounted(() => {
      unsubscribe = subscribeToTradeCounter((settings) => {
        targetCount.value = settings.targetCount || 0;
        startTradeCount.value = settings.startTradeCount || 0;
        loading.value = false;
      });
    });

    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });

    const remainingCount = computed(() => {
      const tradesSinceReset = props.totalTrades - startTradeCount.value;
      const remaining = targetCount.value - tradesSinceReset;
      return Math.max(0, remaining);
    });

    const handleReset = async () => {
      try {
        await updateTradeCounter(resetValue.value, props.totalTrades);
        showReset.value = false;
      } catch (error) {
        alert('Failed to update counter. Please check your connection.');
      }
    };

    return {
      showReset,
      resetValue,
      loading,
      remainingCount,
      handleReset,
    };
  },
};
</script>

<style scoped>
.trade-counter-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 180px;
}

.counter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.counter-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.remaining-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md);
}

.count-value {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.count-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: var(--spacing-xs);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.reset-form {
  animation: fadeIn 0.2s ease-out;
}

.text-xs {
  font-size: 0.75rem;
}
</style>
