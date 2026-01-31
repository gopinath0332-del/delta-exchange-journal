<template>
  <div class="all-trades fade-in">
    <div class="page-header mb-xl">
      <h2>All Trades</h2>
      <p>Complete history of your trading activity</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading trades...</p>
    </div>

    <!-- Trades List -->
    <div v-else>
      <TradeList :trades="trades" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import TradeList from './TradeList.vue';
import { subscribeToTrades } from '../firebase/trades';

export default {
  name: 'AllTrades',
  components: {
    TradeList,
  },
  setup() {
    const trades = ref([]);
    const loading = ref(true);
    let unsubscribe = null;

    onMounted(() => {
      unsubscribe = subscribeToTrades((newTrades) => {
        trades.value = newTrades;
        loading.value = false;
      });
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    return {
      trades,
      loading,
    };
  },
};
</script>

<style scoped>
.all-trades {
  min-height: 60vh;
}

.page-header {
  text-align: center;
}

.page-header h2 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: var(--font-size-3xl);
}

.page-header p {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--spacing-lg);
}
</style>
