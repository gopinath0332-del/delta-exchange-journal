<template>
  <div id="app">
    <div class="app-container">
      <!-- Header -->
      <header class="app-header">
        <div class="container">
          <div class="header-content">
            <div class="logo">
              <h1>📈 Trading Journal</h1>
            </div>
            <nav class="nav">
              <a href="#" @click.prevent="currentView = 'dashboard'" :class="{ active: currentView === 'dashboard' }">
                Dashboard
              </a>
              <a href="#" @click.prevent="currentView = 'analytics'" :class="{ active: currentView === 'analytics' }">
                Analytics
              </a>
              <a href="#" @click.prevent="currentView = 'trades'" :class="{ active: currentView === 'trades' }">
                All Trades
              </a>
              <button @click="toggleTheme" class="btn btn-secondary theme-toggle" title="Toggle Light/Dark Mode">
                <span v-if="!isLightMode">☀️</span>
                <span v-else>🌙</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="app-main">
        <div class="container">
          <Dashboard v-if="currentView === 'dashboard'" :trades="trades" />
          <Analytics v-else-if="currentView === 'analytics'" :trades="trades" />
          <AllTrades v-else-if="currentView === 'trades'" />
        </div>
      </main>

      <!-- Footer -->
      <footer class="app-footer">
        <div class="container">
          <p>&copy; 2026 Trading Journal. Built with Vue.js & Firebase.</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import Dashboard from './components/Dashboard.vue';
import Analytics from './components/Analytics.vue';
import AllTrades from './components/AllTrades.vue';
import { subscribeToCryptoTrades } from './firebase/crypto';

export default {
  name: 'App',
  components: {
    Dashboard,
    Analytics,
    AllTrades,
  },
  setup() {
    const currentView = ref('dashboard');
    const trades = ref([]);
    const isLightMode = ref(true);
    let unsubscribe = null;

    const toggleTheme = () => {
      isLightMode.value = !isLightMode.value;
      localStorage.setItem('theme', isLightMode.value ? 'light' : 'dark');
      document.documentElement.classList.toggle('light-theme', isLightMode.value);
    };

    // Subscribe to trades for all views
    onMounted(() => {
      // Initialize theme
      const savedTheme = localStorage.getItem('theme');
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

      if (savedTheme === 'dark' || (!savedTheme && !prefersLight)) {
        isLightMode.value = false;
        document.documentElement.classList.remove('light-theme');
      } else {
        isLightMode.value = true;
        document.documentElement.classList.add('light-theme');
      }

      unsubscribe = subscribeToCryptoTrades((newTrades) => {
        trades.value = newTrades;
      });
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    return {
      currentView,
      trades,
      isLightMode,
      toggleTheme,
    };
  },
};
</script>

<style>
/* Global app styles */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--glass-border);
  padding: var(--spacing-lg) 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo h1 {
  font-size: var(--font-size-2xl);
  margin: 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.theme-toggle {
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
}

.nav a {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 600;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.nav a:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.nav a.active {
  color: var(--color-primary);
  background: var(--color-surface);
}

.app-main {
  flex: 1;
  padding: var(--spacing-2xl) 0;
}

.app-footer {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--glass-border);
  padding: var(--spacing-xl) 0;
  margin-top: var(--spacing-2xl);
  text-align: center;
}

.app-footer p {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}

@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }

  .nav {
    width: 100%;
    justify-content: space-around;
  }
}
</style>
