<template>
  <div class="all-trades fade-in">
    <div class="page-header mb-xl">
      <h2>All Trades</h2>
      <p>Complete history of your trading activity</p>
      <div class="total-count">Total Trades: {{ trades.length }}</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading trades...</p>
    </div>

    <!-- Trades List -->
    <div v-else>
      <div class="flex justify-center gap-sm mb-xl">
        <button
          @click="activeTab = 'all'"
          :class="['btn btn-secondary', activeTab === 'all' ? 'active-tab' : '']"
        >
          All Trades ({{ trades.length }})
        </button>
        <button
          @click="activeTab = 'open'"
          :class="['btn btn-secondary', activeTab === 'open' ? 'active-tab' : '']"
        >
          Open Trades ({{ openTrades.length }})
        </button>
        <button
          @click="activeTab = 'partial'"
          :class="['btn btn-secondary', activeTab === 'partial' ? 'active-tab' : '']"
        >
          Partial Trades ({{ partialTrades.length }})
        </button>
        <button
          @click="activeTab = 'closed'"
          :class="['btn btn-secondary', activeTab === 'closed' ? 'active-tab' : '']"
        >
          Closed Trades ({{ closedTrades.length }})
        </button>
      </div>

      <TradeList :trades="filteredTrades" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import TradeList from './TradeList.vue';
import { subscribeToTrades } from '../firebase/tradeService';
import { TRADE_COLLECTION } from '../firebase/constants';

export default {
  name: 'AllTrades',
  components: {
    TradeList,
  },
  setup() {
    const trades = ref([]);
    const loading = ref(true);
    const activeTab = ref('all');
    let unsubscribe = null;

    onMounted(() => {
      unsubscribe = subscribeToTrades(TRADE_COLLECTION, (newTrades) => {
        trades.value = newTrades;
        loading.value = false;
      });
    });

    const openTrades = computed(() => trades.value.filter(t => t.status === 'OPEN'));
    const partialTrades = computed(() => trades.value.filter(t => t.status === 'PARTIAL_CLOSED'));
    const closedTrades = computed(() => trades.value.filter(t => t.status === 'CLOSED'));

    const filteredTrades = computed(() => {
      if (activeTab.value === 'open') return openTrades.value;
      if (activeTab.value === 'partial') return partialTrades.value;
      if (activeTab.value === 'closed') return closedTrades.value;
      return trades.value;
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    return {
      trades,
      loading,
      activeTab,
      openTrades,
      partialTrades,
      closedTrades,
      filteredTrades,
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

.total-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  font-weight: 500;
}

.active-tab {
  background: var(--color-primary) !important;
  color: white !important;
  border-color: var(--color-primary) !important;
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
