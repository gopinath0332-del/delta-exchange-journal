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

/**
 * Calculate daily performance data for calendar heatmap
 * @param {Array} trades - Array of trade objects
 * @param {number} daysToShow - Number of days to show (default 365)
 * @returns {Array} Array of {date, pnl, tradeCount, color, trades} objects
 */
export function calculateDailyPerformance(trades, daysToShow = 365) {
  const closedTrades = trades.filter((t) => t.status === 'CLOSED');
  
  // Create a map of date -> {pnl, count, trades}
  const dailyData = {};
  
  closedTrades.forEach((trade) => {
    const exitDate = trade.exit_timestamp?.toDate?.() || new Date(trade.exit_timestamp);
    const dateKey = exitDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        pnl: 0,
        tradeCount: 0,
        trades: [],
      };
    }
    
    dailyData[dateKey].pnl += trade.pnl || 0;
    dailyData[dateKey].tradeCount += 1;
    dailyData[dateKey].trades.push(trade);
  });
  
  // Generate array for last N days
  const result = [];
  const today = new Date();
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const dayData = dailyData[dateKey] || { pnl: 0, tradeCount: 0, trades: [] };
    
    // Determine color intensity based on PnL
    let color = 'neutral';
    let intensity = 0;
    
    if (dayData.tradeCount > 0) {
      if (dayData.pnl > 0) {
        color = 'profit';
        // Scale intensity based on PnL (you can adjust these thresholds)
        if (dayData.pnl > 500) intensity = 4;
        else if (dayData.pnl > 200) intensity = 3;
        else if (dayData.pnl > 50) intensity = 2;
        else intensity = 1;
      } else if (dayData.pnl < 0) {
        color = 'loss';
        if (dayData.pnl < -500) intensity = 4;
        else if (dayData.pnl < -200) intensity = 3;
        else if (dayData.pnl < -50) intensity = 2;
        else intensity = 1;
      } else {
        color = 'neutral';
        intensity = 1;
      }
    }
    
    result.push({
      date,
      dateKey,
      pnl: dayData.pnl,
      tradeCount: dayData.tradeCount,
      trades: dayData.trades,
      color,
      intensity,
    });
  }
  
  return result;
}

/**
 * Calculate performance metrics by time (Day of Week, Hour of Day)
 * @param {Array} trades - Array of trade objects
 * @returns {Object} { byDay: Array, byHour: Array }
 */
export function calculateTimeBasedPerformance(trades) {
  const closedTrades = trades.filter((t) => t.status === 'CLOSED');
  
  // Initialize buckets
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayBuckets = days.map(day => ({ name: day, pnl: 0, wins: 0, total: 0 }));
  const hourBuckets = Array(24).fill(0).map((_, i) => ({ 
    hour: i, 
    label: `${i.toString().padStart(2, '0')}:00`, 
    pnl: 0, 
    wins: 0, 
    total: 0 
  }));

  closedTrades.forEach(trade => {
    const exitDate = trade.exit_timestamp?.toDate?.() || new Date(trade.exit_timestamp);
    const dayIndex = exitDate.getDay(); // 0 = Sunday
    const hourIndex = exitDate.getHours(); // 0-23

    // Update Day Bucket
    dayBuckets[dayIndex].pnl += trade.pnl || 0;
    dayBuckets[dayIndex].total += 1;
    if ((trade.pnl || 0) > 0) dayBuckets[dayIndex].wins += 1;

    // Update Hour Bucket
    hourBuckets[hourIndex].pnl += trade.pnl || 0;
    hourBuckets[hourIndex].total += 1;
    if ((trade.pnl || 0) > 0) hourBuckets[hourIndex].wins += 1;
  });

  // Calculate Win Rates and format final data
  const byDay = dayBuckets.map(d => ({
    ...d,
    winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0
  }));

  // For chart display, maybe better to start with Monday?
  // Let's rotate so Monday is first (Index 1)
  const byDaySorted = [...byDay.slice(1), byDay[0]];

  const byHour = hourBuckets.map(h => ({
    ...h,
    winRate: h.total > 0 ? (h.wins / h.total) * 100 : 0
  }));

  return { byDay: byDaySorted, byHour };
}

/**
 * Calculate Maximum Drawdown (absolute currency value)
 * @param {Array} trades - Array of trade objects
 * @returns {number} Maximum drawdown amount (positive number representing the drop)
 */
export function calculateMaxDrawdown(trades) {
  const closedTrades = trades.filter((t) => t.status === 'CLOSED');
  
  if (closedTrades.length === 0) return 0;
  
  // Sort by exit time
  const sortedTrades = [...closedTrades].sort((a, b) => {
    const timeA = a.exit_timestamp?.toDate?.() || new Date(a.exit_timestamp);
    const timeB = b.exit_timestamp?.toDate?.() || new Date(b.exit_timestamp);
    return timeA - timeB;
  });
  
  let currentPnL = 0;
  let peak = 0;
  let maxDrawdown = 0;
  
  sortedTrades.forEach(trade => {
    currentPnL += (trade.pnl || 0);
    
    if (currentPnL > peak) {
      peak = currentPnL;
    }
    
    const drawdown = peak - currentPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  return maxDrawdown;
}

/**
 * Calculate Realized Risk/Reward Ratio (Avg Win / Avg Loss)
 * @param {Array} trades - Array of trade objects
 * @returns {number} Risk Reward Ratio (e.g. 1.5)
 */
export function calculateRiskRewardRatio(trades) {
  const avgWin = calculateAverageProfit(trades);
  const avgLoss = calculateAverageLoss(trades);
  
  if (avgLoss === 0) return avgWin > 0 ? 100 : 0; // Infinite or zero
  
  return Math.abs(avgWin / avgLoss);
}

/**
 * Calculate Profit Factor (Gross Profit / Gross Loss)
 * @param {Array} trades - Array of trade objects
 * @returns {number} Profit Factor
 */
export function calculateProfitFactor(trades) {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  
  const grossProfit = closedTrades
    .filter(t => (t.pnl || 0) > 0)
    .reduce((sum, t) => sum + t.pnl, 0);
    
  const grossLoss = closedTrades
    .filter(t => (t.pnl || 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnl), 0);
    
  if (grossLoss === 0) return grossProfit > 0 ? 100 : 0;
  
  return grossProfit / grossLoss;
}

