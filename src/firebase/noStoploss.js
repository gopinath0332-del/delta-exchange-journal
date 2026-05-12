// Firestore queries and data fetching functions for the 'noStoplossTrades' collection
import { db } from './config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

/**
 * Subscribe to all noStoplossTrades with real-time updates
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNoStoplossTrades(callback) {
  const tradesRef = collection(db, 'noStoplossTrades');
  const q = query(tradesRef, orderBy('entry_timestamp', 'desc'));

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
      console.error('Error subscribing to noStoplossTrades collection:', error);
      callback([]);
    }
  );
}

/**
 * Get noStoplossTrades within a date range (one-time fetch)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of trades
 */
export async function getNoStoplossTradesByDateRange(startDate, endDate) {
  const tradesRef = collection(db, 'noStoplossTrades');
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
 * Get all closed noStoplossTrades (for statistics, one-time fetch)
 * @returns {Promise<Array>} Array of closed trades
 */
export async function getAllClosedNoStoplossTrades() {
  const tradesRef = collection(db, 'noStoplossTrades');
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
