import { db } from './config';
import {
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';

const COUNTER_DOC_ID = 'trade_counter';
const SETTINGS_COLLECTION = 'settings';

/**
 * Subscribe to the trade counter settings for a specific profile
 * @param {string} profileMode - The active profile ('LIVE' or 'PAPER')
 * @param {Function} callback - Function to call when settings update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTradeCounter(profileMode, callback) {
  const docId = `trade_counter_${(profileMode || 'live').toLowerCase()}`;
  const counterDocRef = doc(db, SETTINGS_COLLECTION, docId);

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
      console.error(`Error subscribing to trade counter settings (${docId}):`, error);
      callback({ targetCount: 0, startTradeCount: 0 });
    }
  );
}

/**
 * Update the trade counter settings in Firestore for a specific profile
 * @param {string} profileMode - The active profile ('LIVE' or 'PAPER')
 * @param {number} targetCount - The target number of trades
 * @param {number} startTradeCount - The total trades count at the time of reset
 * @returns {Promise<void>}
 */
export async function updateTradeCounter(profileMode, targetCount, startTradeCount) {
  const docId = `trade_counter_${(profileMode || 'live').toLowerCase()}`;
  const counterDocRef = doc(db, SETTINGS_COLLECTION, docId);
  
  try {
    await setDoc(counterDocRef, {
      targetCount,
      startTradeCount,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error(`Error updating trade counter settings (${docId}):`, error);
    throw error;
  }
}
