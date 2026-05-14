// Generic Firestore queries and data fetching functions for trade collections
import { db } from './config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';

/**
 * Get a reference to a collection
 * @param {string} collectionName 
 * @returns CollectionReference
 */
const getRef = (collectionName) => collection(db, collectionName);

/**
 * Subscribe to trades with real-time updates
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Function} callback - Function to call when trades update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTrades(collectionName, callback) {
  const q = query(getRef(collectionName), orderBy('entry_timestamp', 'desc'));

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
      console.error(`Error subscribing to ${collectionName}:`, error);
      callback([]);
    }
  );
}

/**
 * Subscribe to trades filtered by status
 * @param {string} collectionName 
 * @param {string} status - 'OPEN', 'CLOSED', 'PARTIAL_CLOSED'
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTradesByStatus(collectionName, status, callback) {
  const q = query(
    getRef(collectionName),
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
      console.error(`Error subscribing to ${collectionName} by status (${status}):`, error);
      callback([]);
    }
  );
}

/**
 * Subscribe to trades filtered by symbol
 * @param {string} collectionName 
 * @param {string} symbol 
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTradesBySymbol(collectionName, symbol, callback) {
  const q = query(
    getRef(collectionName),
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
      console.error(`Error subscribing to ${collectionName} by symbol (${symbol}):`, error);
      callback([]);
    }
  );
}

/**
 * Subscribe to trades filtered by strategy
 * @param {string} collectionName 
 * @param {string} strategyName 
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTradesByStrategy(collectionName, strategyName, callback) {
  const q = query(
    getRef(collectionName),
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
      console.error(`Error subscribing to ${collectionName} by strategy (${strategyName}):`, error);
      callback([]);
    }
  );
}

/**
 * Get trades within a date range (one-time fetch)
 * @param {string} collectionName 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Array>}
 */
export async function getTradesByDateRange(collectionName, startDate, endDate) {
  const q = query(
    getRef(collectionName),
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
 * Get all closed trades (for statistics, one-time fetch)
 * @param {string} collectionName 
 * @returns {Promise<Array>}
 */
export async function getAllClosedTrades(collectionName) {
  const q = query(
    getRef(collectionName),
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

/**
 * Update a trade in Firestore
 * @param {string} collectionName 
 * @param {string} tradeId 
 * @param {Object} updatedData 
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function updateTrade(collectionName, tradeId, updatedData) {
  const tradeRef = doc(db, collectionName, tradeId);
  try {
    // Remove id from updatedData to avoid saving it back to document fields
    const { id, ...dataToUpdate } = updatedData;
    
    // Convert top-level timestamps
    if (dataToUpdate.entry_timestamp && typeof dataToUpdate.entry_timestamp === 'string') {
      dataToUpdate.entry_timestamp = Timestamp.fromDate(new Date(dataToUpdate.entry_timestamp));
    }
    if (dataToUpdate.exit_timestamp && typeof dataToUpdate.exit_timestamp === 'string') {
      dataToUpdate.exit_timestamp = Timestamp.fromDate(new Date(dataToUpdate.exit_timestamp));
    }

    // Convert timestamps inside the events array
    if (Array.isArray(dataToUpdate.events)) {
      dataToUpdate.events = dataToUpdate.events.map(event => {
        const e = { ...event };
        if (e.timestamp) {
          if (typeof e.timestamp === 'string') {
            e.timestamp = Timestamp.fromDate(new Date(e.timestamp));
          } else if (e.timestamp instanceof Date) {
            e.timestamp = Timestamp.fromDate(e.timestamp);
          }
        }
        return e;
      });
    }

    await updateDoc(tradeRef, dataToUpdate);
    return { success: true };
  } catch (error) {
    console.error(`Error updating trade ${tradeId} in ${collectionName}:`, error);
    return { success: false, error };
  }
}
