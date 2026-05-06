// Firestore queries and data fetching functions for the 'crypto' collection
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
 * Subscribe to all crypto trades with real-time updates
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCryptoTrades(callback) {
  const cryptoRef = collection(db, 'crypto');
  const q = query(cryptoRef, orderBy('entry_timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const trades = [];
      snapshot.forEach((doc) => {
        trades.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(trades);
    },
    (error) => {
      console.error('Error subscribing to crypto collection:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to crypto trades filtered by status
 * @param {string} status - 'OPEN' or 'CLOSED'
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCryptoTradesByStatus(status, callback) {
  const cryptoRef = collection(db, 'crypto');
  const q = query(
    cryptoRef,
    where('status', '==', status),
    orderBy('entry_timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const trades = [];
      snapshot.forEach((doc) => {
        trades.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(trades);
    },
    (error) => {
      console.error(`Error subscribing to crypto trades by status (${status}):`, error);
      callback([]);
    }
  );
}

/**
 * Subscribe to crypto trades filtered by symbol
 * @param {string} symbol - e.g., 'ETHUSD', 'BTCUSD'
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCryptoTradesBySymbol(symbol, callback) {
  const cryptoRef = collection(db, 'crypto');
  const q = query(
    cryptoRef,
    where('symbol', '==', symbol),
    orderBy('entry_timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const trades = [];
      snapshot.forEach((doc) => {
        trades.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(trades);
    },
    (error) => {
      console.error(`Error subscribing to crypto trades by symbol (${symbol}):`, error);
      callback([]);
    }
  );
}

/**
 * Subscribe to crypto trades filtered by strategy
 * @param {string} strategyName - Strategy name
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCryptoTradesByStrategy(strategyName, callback) {
  const cryptoRef = collection(db, 'crypto');
  const q = query(
    cryptoRef,
    where('strategy_name', '==', strategyName),
    orderBy('entry_timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const trades = [];
      snapshot.forEach((doc) => {
        trades.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(trades);
    },
    (error) => {
      console.error(`Error subscribing to crypto trades by strategy (${strategyName}):`, error);
      callback([]);
    }
  );
}

/**
 * Get crypto trades within a date range (one-time fetch)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of trades
 */
export async function getCryptoTradesByDateRange(startDate, endDate) {
  const cryptoRef = collection(db, 'crypto');
  const q = query(
    cryptoRef,
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
 * Get all closed crypto trades (for statistics, one-time fetch)
 * @returns {Promise<Array>} Array of closed trades
 */
export async function getAllClosedCryptoTrades() {
  const cryptoRef = collection(db, 'crypto');
  const q = query(
    cryptoRef,
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
