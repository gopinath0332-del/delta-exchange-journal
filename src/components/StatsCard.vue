<template>
  <div class="stats-card glass-card">
    <div class="stats-icon" :style="{ background: iconBg }">
      <span v-html="icon"></span>
    </div>
    <div class="stats-content">
      <div class="stats-label">{{ label }}</div>
      <div class="stats-value" :class="valueClass">
        <span v-if="isAnimating" class="value-animated">{{ displayValue }}</span>
        <span v-else>{{ value }}</span>
      </div>
      <div v-if="subtitle" class="stats-subtitle">{{ subtitle }}</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';

export default {
  name: 'StatsCard',
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number],
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '📊',
    },
    iconBg: {
      type: String,
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    valueClass: {
      type: String,
      default: '',
    },
    animate: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const displayValue = ref(0);
    const isAnimating = computed(() => props.animate && typeof props.value === 'number');

    // Animate number counting
    const animateValue = (end) => {
      const duration = 1000; // 1 second
      const steps = 60;
      const stepValue = end / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        current += stepValue;
        step++;
        displayValue.value = Math.round(current);

        if (step >= steps) {
          displayValue.value = end;
          clearInterval(timer);
        }
      }, duration / steps);
    };

    watch(
      () => props.value,
      (newVal) => {
        if (isAnimating.value) {
          animateValue(newVal);
        }
      }
    );

    onMounted(() => {
      if (isAnimating.value) {
        animateValue(props.value);
      }
    });

    return {
      displayValue,
      isAnimating,
    };
  },
};
</script>

<style scoped>
.stats-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  cursor: default;
}

.stats-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-lg);
}

.stats-content {
  flex: 1;
  min-width: 0;
}

.stats-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-xs);
}

.stats-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: var(--spacing-xs);
}

.stats-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.value-animated {
  display: inline-block;
  animation: fadeIn 0.3s ease-out;
}

/* Responsive */
@media (max-width: 640px) {
  .stats-card {
    padding: var(--spacing-lg);
  }

  .stats-icon {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }

  .stats-value {
    font-size: var(--font-size-2xl);
  }
}
</style>
