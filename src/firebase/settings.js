import { db } from './config';
import {
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';

const COUNTER_DOC_ID = 'trade_counter';
const SETTINGS_COLLECTION = 'settings';

/**
 * Subscribe to the trade counter settings
 * @param {Function} callback - Function to call when settings update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTradeCounter(callback) {
  const counterDocRef = doc(db, SETTINGS_COLLECTION, COUNTER_DOC_ID);

  return onSnapshot(
    counterDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        // Initial default state if document doesn't exist
        callback({ targetCount: 0, startTradeCount: 0 });
      }
    },
    (error) => {
      console.error('Error subscribing to trade counter settings:', error);
      callback({ targetCount: 0, startTradeCount: 0 });
    }
  );
}

/**
 * Update the trade counter settings in Firestore
 * @param {number} targetCount - The target number of trades
 * @param {number} startTradeCount - The total trades count at the time of reset
 * @returns {Promise<void>}
 */
export async function updateTradeCounter(targetCount, startTradeCount) {
  const counterDocRef = doc(db, SETTINGS_COLLECTION, COUNTER_DOC_ID);
  
  try {
    await setDoc(counterDocRef, {
      targetCount,
      startTradeCount,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating trade counter settings:', error);
    throw error;
  }
}
