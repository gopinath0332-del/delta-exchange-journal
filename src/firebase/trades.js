// Firestore queries and data fetching functions for trades
import { db } from './config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

/**
 * Get all trades with real-time updates
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTrades(callback) {
  const tradesRef = collection(db, 'trades');
  const q = query(tradesRef, orderBy('entry_timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const trades = [];
    snapshot.forEach((doc) => {
      trades.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(trades);
  });
}

/**
 * Get trades filtered by status
 * @param {string} status - 'OPEN' or 'CLOSED'
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTradesByStatus(status, callback) {
  const tradesRef = collection(db, 'trades');
  const q = query(
    tradesRef,
    where('status', '==', status),
    orderBy('entry_timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const trades = [];
    snapshot.forEach((doc) => {
      trades.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(trades);
  });
}

/**
 * Get trades filtered by symbol
 * @param {string} symbol - e.g., 'ETHUSD', 'BTCUSD'
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTradesBySymbol(symbol, callback) {
  const tradesRef = collection(db, 'trades');
  const q = query(
    tradesRef,
    where('symbol', '==', symbol),
    orderBy('entry_timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const trades = [];
    snapshot.forEach((doc) => {
      trades.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(trades);
  });
}

/**
 * Get trades filtered by strategy
 * @param {string} strategyName - Strategy name
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTradesByStrategy(strategyName, callback) {
  const tradesRef = collection(db, 'trades');
  const q = query(
    tradesRef,
    where('strategy_name', '==', strategyName),
    orderBy('entry_timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const trades = [];
    snapshot.forEach((doc) => {
      trades.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(trades);
  });
}

/**
 * Get trades within a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of trades
 */
export async function getTradesByDateRange(startDate, endDate) {
  const tradesRef = collection(db, 'trades');
  const q = query(
    tradesRef,
    where('entry_timestamp', '>=', Timestamp.fromDate(startDate)),
    where('entry_timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('entry_timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  const trades = [];
  snapshot.forEach((doc) => {
    trades.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return trades;
}

/**
 * Get all closed trades (for statistics)
 * @returns {Promise<Array>} Array of closed trades
 */
export async function getAllClosedTrades() {
  const tradesRef = collection(db, 'trades');
  const q = query(
    tradesRef,
    where('status', '==', 'CLOSED'),
    orderBy('entry_timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  const trades = [];
  snapshot.forEach((doc) => {
    trades.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return trades;
}
