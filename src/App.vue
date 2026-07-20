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

            <!-- Profile Switcher -->
            <div class="profile-switcher">
              <button
                :class="['profile-btn', 'live', { active: profileMode === 'LIVE' }]"
                @click="setProfileMode('LIVE')"
                title="Live Trading Profile"
              >
                <span class="dot"></span> Live
              </button>
              <button
                :class="['profile-btn', 'paper', { active: profileMode === 'PAPER' }]"
                @click="setProfileMode('PAPER')"
                title="Paper Trading Profile"
              >
                <span class="dot"></span> Paper
              </button>
            </div>

            <div class="collection-switcher">
              <button
                :class="['collection-btn', { active: collectionStore.activeCollection === TRADE_COLLECTION }]"
                @click="collectionStore.setActiveCollection(TRADE_COLLECTION)"
                title="Trades Collection"
              >
                Trades
              </button>
              <button
                :class="['collection-btn', { active: collectionStore.activeCollection === OPTIONS_COLLECTION }]"
                @click="collectionStore.setActiveCollection(OPTIONS_COLLECTION)"
                title="Options Collection"
              >
                Options
              </button>
            </div>

            <button class="menu-toggle" @click="isMenuOpen = !isMenuOpen" aria-label="Toggle Menu">
              <span class="hamburger" :class="{ 'open': isMenuOpen }"></span>
            </button>
            <nav class="nav" :class="{ 'nav-open': isMenuOpen }">
              <a href="#" @click.prevent="currentView = 'dashboard'; isMenuOpen = false" :class="{ active: currentView === 'dashboard' }">
                Dashboard
              </a>
              <a href="#" @click.prevent="currentView = 'analytics'; isMenuOpen = false" :class="{ active: currentView === 'analytics' }">
                Analytics
              </a>
              <a href="#" @click.prevent="currentView = 'trades'; isMenuOpen = false" :class="{ active: currentView === 'trades' }">
                All Trades
              </a>
              <a href="#" @click.prevent="currentView = 'calendar'; isMenuOpen = false" :class="{ active: currentView === 'calendar' }">
                Calendar View
              </a>
              <button @click="toggleTheme" class="btn btn-secondary theme-toggle" title="Toggle Light/Dark Mode">
                <span v-if="!isLightMode">☀️</span>
                <span v-else>🌙</span>
              </button>
            </nav>
            <div class="menu-overlay" v-if="isMenuOpen" @click="isMenuOpen = false"></div>

          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="app-main">
        <div class="container">
          <Dashboard v-if="currentView === 'dashboard'" :trades="trades" :profileMode="profileMode" />
          <Analytics v-else-if="currentView === 'analytics'" :trades="trades" />
          <AllTrades v-else-if="currentView === 'trades'" :trades="trades" />
          <CalendarView v-else-if="currentView === 'calendar'" :trades="trades" />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import Dashboard from './components/Dashboard.vue';
import Analytics from './components/Analytics.vue';
import AllTrades from './components/AllTrades.vue';
import CalendarView from './components/CalendarView.vue';
import { subscribeToTrades } from './firebase/tradeService';
import { TRADE_COLLECTION, OPTIONS_COLLECTION } from './firebase/constants';
import { collectionStore } from './firebase/collectionStore';

export default {
  name: 'App',
  components: {
    Dashboard,
    Analytics,
    AllTrades,
    CalendarView,
  },
  setup() {
    const currentView = ref('dashboard');
    const allTrades = ref([]);
    const profileMode = ref(localStorage.getItem('profileMode') || 'LIVE');
    const isLightMode = ref(true);
    const isMenuOpen = ref(false);
    let unsubscribe = null;

    const setProfileMode = (mode) => {
      profileMode.value = mode;
      localStorage.setItem('profileMode', mode);
    };

    const trades = computed(() => {
      return allTrades.value.filter(
        t => (t.mode || 'LIVE').toUpperCase() === profileMode.value
      );
    });

    const toggleTheme = () => {
      isLightMode.value = !isLightMode.value;
      localStorage.setItem('theme', isLightMode.value ? 'light' : 'dark');
      document.documentElement.classList.toggle('light-theme', isLightMode.value);
    };

    const startSubscription = () => {
      if (unsubscribe) unsubscribe();
      unsubscribe = subscribeToTrades(collectionStore.activeCollection, (newTrades) => {
        allTrades.value = newTrades;
      });
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

      startSubscription();
    });

    watch(() => collectionStore.activeCollection, () => {
      startSubscription();
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    return {
      currentView,
      trades,
      profileMode,
      setProfileMode,
      isLightMode,
      isMenuOpen,
      toggleTheme,
      collectionStore,
      TRADE_COLLECTION,
      OPTIONS_COLLECTION,
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

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-sm);
  z-index: 110;
}

.hamburger {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-text-primary);
  position: relative;
  transition: all var(--transition-base);
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background: var(--color-text-primary);
  transition: all var(--transition-base);
}

.hamburger::before { top: -8px; }
.hamburger::after { bottom: -8px; }

.hamburger.open {
  background: transparent;
}

.hamburger.open::before {
  transform: rotate(45deg);
  top: 0;
}

.hamburger.open::after {
  transform: rotate(-45deg);
  bottom: 0;
}

.logo h1 {
  font-size: var(--font-size-2xl);
  margin: 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Profile Switcher Styles */
.profile-switcher {
  display: flex;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  padding: 4px;
  border: 1px solid var(--glass-border);
  gap: 4px;
  margin: 0 var(--spacing-md);
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-lg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family);
}

.profile-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.profile-btn .dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  display: inline-block;
  background: currentColor;
}

.profile-btn.live .dot {
  background: var(--color-profit);
  box-shadow: 0 0 8px var(--color-profit);
}

.profile-btn.paper .dot {
  background: var(--color-warning);
  box-shadow: 0 0 8px var(--color-warning);
}

.profile-btn.live.active {
  background: var(--color-profit-bg);
  color: var(--color-profit);
  border-color: var(--color-profit-border);
}

.profile-btn.paper.active {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-color: rgba(245, 158, 11, 0.3);
}

.collection-switcher {
  display: flex;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  padding: 4px;
  border: 1px solid var(--glass-border);
  gap: 4px;
  margin: 0 var(--spacing-md);
}

.collection-btn {
  padding: var(--spacing-xs) var(--spacing-lg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family);
}

.collection-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.collection-btn.active {
  background: var(--color-surface);
  color: var(--color-primary);
  border-color: var(--glass-border);
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
  .menu-toggle {
    display: block;
  }

  .header-content {
    flex-direction: row;
    gap: var(--spacing-md);
    align-items: center;
  }

  .profile-switcher {
    margin: 0;
  }

  .profile-btn {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: var(--font-size-xs);
  }

  .nav {
    position: fixed;
    top: 0;
    right: -100%;
    width: 280px;
    height: 100vh;
    background: var(--color-bg-secondary);
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--spacing-2xl) var(--spacing-xl);
    gap: var(--spacing-lg);
    transition: right var(--transition-base);
    z-index: 105;
    border-left: 1px solid var(--glass-border);
    box-shadow: var(--shadow-xl);
  }

  .nav-open {
    right: 0;
  }

  .nav a {
    width: 100%;
    text-align: left;
    padding: var(--spacing-md);
  }

  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 101;
  }
}

@media (max-width: 480px) {
  .logo h1 {
    font-size: var(--font-size-lg);
  }
  .profile-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
}
</style>
