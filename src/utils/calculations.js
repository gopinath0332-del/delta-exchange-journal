// Utility functions for calculating trading statistics and metrics

/**
 * Calculate total PnL from an array of trades
 * @param {Array} trades - Array of trade objects
 * @returns {number} Total PnL
 */
export function calculateTotalPnL(trades) {
  return trades.reduce((total, trade) => {
    // Only count closed trades
    if (trade.status === 'CLOSED' && typeof trade.pnl === 'number') {
      return total + trade.pnl;
    }
    return total;
  }, 0);
}

/**
 * Calculate win rate (percentage of winning trades)
 * @param {Array} trades - Array of trade objects
 * @returns {number} Win rate as percentage (0-100)
 */
export function calculateWinRate(trades) {
  const closedTrades = trades.filter((t) => t.status === 'CLOSED');
  if (closedTrades.length === 0) return 0;

  const winningTrades = closedTrades.filter(
    (t) => typeof t.pnl === 'number' && t.pnl > 0
  );
  return (winningTrades.length / closedTrades.length) * 100;
}

/**
 * Calculate average profit for winning trades
 * @param {Array} trades - Array of trade objects
 * @returns {number} Average profit
 */
export function calculateAverageProfit(trades) {
  const winningTrades = trades.filter(
    (t) => t.status === 'CLOSED' && typeof t.pnl === 'number' && t.pnl > 0
  );
  if (winningTrades.length === 0) return 0;

  const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  return totalProfit / winningTrades.length;
}

/**
 * Calculate average loss for losing trades
 * @param {Array} trades - Array of trade objects
 * @returns {number} Average loss (negative number)
 */
export function calculateAverageLoss(trades) {
  const losingTrades = trades.filter(
    (t) => t.status === 'CLOSED' && typeof t.pnl === 'number' && t.pnl < 0
  );
  if (losingTrades.length === 0) return 0;

  const totalLoss = losingTrades.reduce((sum, t) => sum + t.pnl, 0);
  return totalLoss / losingTrades.length;
}

/**
 * Get the best trade (highest PnL)
 * @param {Array} trades - Array of trade objects
 * @returns {Object|null} Best trade object
 */
export function getBestTrade(trades) {
  const closedTrades = trades.filter(
    (t) => t.status === 'CLOSED' && typeof t.pnl === 'number'
  );
  if (closedTrades.length === 0) return null;

  return closedTrades.reduce((best, current) =>
    current.pnl > best.pnl ? current : best
  );
}

/**
 * Get the worst trade (lowest PnL)
 * @param {Array} trades - Array of trade objects
 * @returns {Object|null} Worst trade object
 */
export function getWorstTrade(trades) {
  const closedTrades = trades.filter(
    (t) => t.status === 'CLOSED' && typeof t.pnl === 'number'
  );
  if (closedTrades.length === 0) return null;

  return closedTrades.reduce((worst, current) =>
    current.pnl < worst.pnl ? current : worst
  );
}

/**
 * Calculate statistics by strategy
 * @param {Array} trades - Array of trade objects
 * @returns {Object} Object with strategy names as keys and stats as values
 */
export function calculateStrategyStats(trades) {
  const closedTrades = trades.filter((t) => t.status === 'CLOSED');
  const strategyStats = {};

  closedTrades.forEach((trade) => {
    const strategyName = trade.strategy_name || 'Unknown';

    if (!strategyStats[strategyName]) {
      strategyStats[strategyName] = {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalPnL: 0,
        winRate: 0,
        averagePnL: 0,
      };
    }

    const stats = strategyStats[strategyName];
    stats.totalTrades += 1;

    if (typeof trade.pnl === 'number') {
      stats.totalPnL += trade.pnl;
      if (trade.pnl > 0) {
        stats.winningTrades += 1;
      } else if (trade.pnl < 0) {
        stats.losingTrades += 1;
      }
    }
  });

  // Calculate derived metrics
  Object.values(strategyStats).forEach((stats) => {
    stats.winRate =
      stats.totalTrades > 0
        ? (stats.winningTrades / stats.totalTrades) * 100
        : 0;
    stats.averagePnL =
      stats.totalTrades > 0 ? stats.totalPnL / stats.totalTrades : 0;
  });

  return strategyStats;
}

/**
 * Calculate cumulative PnL over time
 * @param {Array} trades - Array of trade objects (should be sorted by date)
 * @returns {Array} Array of {date, cumulativePnL} objects
 */
export function calculateCumulativePnL(trades) {
  const closedTrades = trades
    .filter((t) => t.status === 'CLOSED' && typeof t.pnl === 'number')
    .sort((a, b) => {
      const dateA = a.exit_timestamp?.toDate?.() || new Date(a.exit_timestamp);
      const dateB = b.exit_timestamp?.toDate?.() || new Date(b.exit_timestamp);
      return dateA - dateB;
    });

  let cumulative = 0;
  return closedTrades.map((trade) => {
    cumulative += trade.pnl;
    const date = trade.exit_timestamp?.toDate?.() || new Date(trade.exit_timestamp);
    return {
      date,
      cumulativePnL: cumulative,
      trade,
    };
  });
}

/**
 * Calculate total fees paid
 * @param {Array} trades - Array of trade objects
 * @returns {number} Total fees
 */
export function calculateTotalFees(trades) {
  return trades.reduce((total, trade) => {
    if (typeof trade.trading_fees === 'number') {
      return total + trade.trading_fees;
    }
    return total;
  }, 0);
}

/**
 * Calculate total funding charges
 * @param {Array} trades - Array of trade objects
 * @returns {number} Total funding charges
 */
export function calculateTotalFunding(trades) {
  return trades.reduce((total, trade) => {
    if (typeof trade.funding_charges === 'number') {
      return total + trade.funding_charges;
    }
    return total;
  }, 0);
}

/**
 * Calculate win/loss streaks
 * @param {Array} trades - Array of trade objects
 * @returns {Object} Streak statistics
 */
export function calculateStreaks(trades) {
  const closedTrades = trades
    .filter((t) => t.status === 'CLOSED' && typeof t.pnl === 'number')
    .sort((a, b) => {
      const dateA = a.exit_timestamp?.toDate?.() || new Date(a.exit_timestamp);
      const dateB = b.exit_timestamp?.toDate?.() || new Date(b.exit_timestamp);
      return dateA - dateB;
    });

  if (closedTrades.length === 0) {
    return {
      currentStreak: 0,
      currentStreakType: null,
      longestWinStreak: 0,
      longestLossStreak: 0,
    };
  }

  let currentStreak = 0;
  let currentStreakType = null;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  closedTrades.forEach((trade) => {
    const isWin = trade.pnl > 0;

    if (isWin) {
      tempWinStreak++;
      tempLossStreak = 0;
      
      if (tempWinStreak > longestWinStreak) {
        longestWinStreak = tempWinStreak;
      }

      // Update current streak
      currentStreak = tempWinStreak;
      currentStreakType = 'win';
    } else {
      tempLossStreak++;
      tempWinStreak = 0;
      
      if (tempLossStreak > longestLossStreak) {
        longestLossStreak = tempLossStreak;
      }

      // Update current streak
      currentStreak = tempLossStreak;
      currentStreakType = 'loss';
    }
  });

  return {
    currentStreak,
    currentStreakType, // 'win' or 'loss'
    longestWinStreak,
    longestLossStreak,
  };
}

/**
 * Get the current active streak details
 * @param {Array} trades - Array of trade objects
 * @returns {Object} Current streak information
 */
export function getCurrentStreak(trades) {
  const streaks = calculateStreaks(trades);
  
  return {
    count: streaks.currentStreak,
    type: streaks.currentStreakType,
    emoji: streaks.currentStreakType === 'win' ? '🔥' : '❄️',
    message: streaks.currentStreakType === 'win' 
      ? `${streaks.currentStreak} consecutive wins!`
      : streaks.currentStreakType === 'loss'
      ? `${streaks.currentStreak} consecutive losses`
      : 'No trades yet',
  };
}

