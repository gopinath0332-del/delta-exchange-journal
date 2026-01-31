# Streak Tracking Feature - Implementation Summary

## Feature Added: Consecutive Wins/Losses Tracking

### Date: January 31, 2026

---

## Overview

Added comprehensive win/loss streak tracking to the trading journal application, allowing traders to monitor their current streak and historical best/worst streaks.

## Changes Made

### 1. Utility Functions - `src/utils/calculations.js`

Added two new functions:

#### `calculateStreaks(trades)`

Calculates streak statistics from trade history:

- **currentStreak**: Current consecutive wins or losses
- **currentStreakType**: 'win', 'loss', or null
- **longestWinStreak**: Best winning streak ever
- **longestLossStreak**: Worst losing streak ever

#### `getCurrentStreak(trades)`

Returns user-friendly streak information:

- **count**: Number of consecutive wins/losses
- **type**: 'win' or 'loss'
- **emoji**: 🔥 for wins, ❄️ for losses
- **message**: Descriptive message for display

### 2. Dashboard Display - `src/components/Dashboard.vue`

Added three new StatsCard components:

1. **Current Streak Card**
   - Shows active win/loss streak
   - Dynamic color (green for wins, red for losses)
   - Fire emoji (🔥) for win streaks
   - Snowflake emoji (❄️) for loss streaks

2. **Longest Win Streak Card**
   - Displays best winning run
   - Always green gradient
   - Fire emoji indicator

3. **Longest Loss Streak Card**
   - Shows worst losing run
   - Always red gradient
   - Snowflake emoji indicator

## Visual Layout

The streak cards appear in a 3-column grid below the main statistics (Total PnL, Win Rate, Total Trades, Avg Profit) and above the charts section.

## Technical Details

### Algorithm

- Sorts trades by exit timestamp (chronological order)
- Iterates through closed trades
- Tracks consecutive wins/losses
- Updates longest streaks as it finds them
- Returns current streak based on most recent trade

### Edge Cases Handled

- Empty trade list returns 0 for all streaks
- Handles Firestore timestamps and regular Date objects
- Only considers closed trades with valid PnL values

## User Benefits

1. **Motivation**: See winning streaks with encouraging fire emoji
2. **Risk Awareness**: Identify when on a losing streak
3. **Historical Context**: Compare current performance to best/worst runs
4. **Psychological Insight**: Understand trading patterns and streaks

## Example Display

```
Current Streak: 🔥 3
"3 consecutive wins!"

Longest Win Streak: 🔥 5
"Best winning run"

Longest Loss Streak: ❄️ 2
"Worst losing run"
```

## Future Enhancements

Potential additions:

- Streak chart visualization
- Alerts when approaching longest loss streak
- Average streak length
- Probability analysis based on streaks
- Streak-based performance comparison

---

**Status**: ✅ Complete and deployed
