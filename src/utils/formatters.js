// Formatting utilities for displaying data in a user-friendly way
import { DateTime } from 'luxon';

/**
 * Format currency value with proper decimals and sign
 * @param {number} value - Currency value
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = '$') {
  if (typeof value !== 'number' || isNaN(value)) return `${currency}0.00`;

  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = absValue.toFixed(2);

  return `${isNegative ? '-' : ''}${currency}${formatted}`;
}

/**
 * Format currency with color class based on positive/negative
 * @param {number} value - Currency value
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {Object} {value: formatted string, className: CSS class}
 */
export function formatPnL(value, currency = '$') {
  const formatted = formatCurrency(value, currency);
  let className = 'neutral';

  if (value > 0) {
    className = 'profit';
  } else if (value < 0) {
    className = 'loss';
  }

  return {
    value: formatted,
    className,
  };
}

/**
 * Format percentage value
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) return '0.00%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date/timestamp for display
 * @param {any} timestamp - Firestore timestamp or Date object
 * @param {string} format - Date format (default: 'LLL dd, yyyy HH:mm')
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp, format = 'LLL dd, yyyy HH:mm') {
  if (!timestamp) return 'N/A';

  let date;
  // Handle Firestore Timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'Invalid Date';
  }

  try {
    return DateTime.fromJSDate(date).toFormat(format);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
}

/**
 * Format date for display in short format
 * @param {any} timestamp - Firestore timestamp or Date object
 * @returns {string} Formatted short date string
 */
export function formatShortDate(timestamp) {
  return formatDate(timestamp, 'LLL dd, yyyy');
}

/**
 * Format time only
 * @param {any} timestamp - Firestore timestamp or Date object
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
  return formatDate(timestamp, 'HH:mm:ss');
}

/**
 * Format trade status with appropriate styling
 * @param {string} status - Trade status ('OPEN' or 'CLOSED')
 * @returns {Object} {text: status, className: CSS class}
 */
export function formatTradeStatus(status) {
  const statusUpper = (status || 'UNKNOWN').toUpperCase();

  return {
    text: statusUpper,
    className: statusUpper === 'OPEN' ? 'status-open' : 'status-closed',
  };
}

/**
 * Format trade side (entry/exit action) with color
 * @param {string} side - 'buy' or 'sell'
 * @returns {Object} {text: formatted side, className: CSS class}
 */
export function formatTradeSide(side) {
  const sideUpper = (side || '').toUpperCase();

  return {
    text: sideUpper,
    className: sideUpper === 'BUY' ? 'side-buy' : 'side-sell',
  };
}

/**
 * Format large numbers with K/M suffix
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 */
export function formatLargeNumber(value) {
  if (typeof value !== 'number' || isNaN(value)) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(2)}M`;
  } else if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(2)}K`;
  } else {
    return `${sign}${absValue.toFixed(2)}`;
  }
}

/**
 * Format mode (paper/live) with appropriate styling
 * @param {string} mode - Trading mode
 * @returns {Object} {text: mode, className: CSS class}
 */
export function formatMode(mode) {
  const modeUpper = (mode || 'UNKNOWN').toUpperCase();

  return {
    text: modeUpper,
    className: modeUpper === 'PAPER' ? 'mode-paper' : 'mode-live',
  };
}

/**
 * Calculate and format days held
 * @param {any} entryTimestamp - Entry timestamp
 * @param {any} exitTimestamp - Exit timestamp (null if trade is open)
 * @returns {string} Days held string
 */
export function formatDaysHeld(entryTimestamp, exitTimestamp) {
  if (!entryTimestamp) return 'N/A';

  const entryDate =
    entryTimestamp.toDate?.() || new Date(entryTimestamp);
  const exitDate = exitTimestamp
    ? exitTimestamp.toDate?.() || new Date(exitTimestamp)
    : new Date();

  const diffMs = exitDate - entryDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  } else {
    return `${diffHours}h`;
  }
}
