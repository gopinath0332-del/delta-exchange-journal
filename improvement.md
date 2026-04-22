# Project Improvement Roadmap

## 🛠️ High Priority (Core Functionality & Stability)
- [ ] **Backend Trade Management**: Implement a proper backend (Cloud Functions) to handle the Entry/Exit logic. Currently, the frontend merges separate documents, which is a fragile workaround.
- [ ] **Trade CRUD Operations**: Add the ability to manually add, edit, or delete trades directly from the UI instead of relying solely on Firestore imports.
- [ ] **Comprehensive Validation**: Add input validation and error handling for all trade-related forms to prevent corrupted data in Firestore.
- [ ] **Advanced Filtering**: Implement a global filter system that persists across page navigations (e.g., using Vuex or Pinia).

## 📊 Analytics & Insights
- [ ] **Equity Curve Enhancements**: Add "Drawdown" and "Recovery Factor" metrics to the PnL chart.
- [ ] **Strategy Comparison**: Create a side-by-side comparison view to see which strategy (e.g., Donchian vs. others) has the best Profit Factor.
- [ ] **Daily/Weekly PnL Heatmap**: Implement a GitHub-style contribution grid showing daily PnL (Green for profit, Red for loss).
- [ ] **Trade Distribution Analysis**: Add charts for "PnL by Day of Week" or "PnL by Hour of Day" to identify peak performance windows.

## 🎨 UI/UX Enhancements
- [ ] **Dark/Light Mode Toggle**: While the current theme is a "glass" dark mode, adding a light mode option would improve accessibility.
- [ ] **Interactive Trade Timeline**: A visual timeline of trades to see exactly when positions were opened and closed relative to each other.
- [ ] **Enhanced Trade Details**: Expand the `TradeCard` to include screenshots of the chart at entry/exit for psychological review.
- [ ] **Responsive Optimization**: Further refine the mobile experience for the `TradeList` table, perhaps using a card-based layout on very small screens.

## 🚀 Performance & Infrastructure
- [ ] **Caching Layer**: Implement local storage caching to reduce Firebase read costs and improve page load speed.
- [ ] **Automated Testing**: Add unit tests for the calculation utilities (`calculations.js`) to ensure PnL and Win Rate are always accurate.
- [ ] **CI/CD Pipeline**: Set up GitHub Actions to run tests and auto-deploy to GitHub Pages on every merge to master.
- [ ] **Export Functionality**: Add the ability to export the trade journal to CSV or PDF for external auditing.
