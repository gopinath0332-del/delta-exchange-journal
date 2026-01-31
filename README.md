# 📈 Trading Journal

A modern, beautiful trading journal application built with Vue.js and Firebase to track, analyze, and improve your trading performance.

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat-square&logo=vite)

## ✨ Features

- **📊 Real-time Dashboard** - Monitor your trading performance with live updates
- **💰 PnL Tracking** - Comprehensive profit/loss analysis with cumulative charts
- **📈 Strategy Analytics** - Compare performance across different trading strategies
- **🎯 Win Rate Metrics** - Track your success rate and identify improvement areas
- **🔍 Advanced Filtering** - Search and filter trades by symbol, strategy, status, and more
- **📱 Responsive Design** - Beautiful UI that works on desktop, tablet, and mobile
- **🎨 Modern Aesthetics** - Glassmorphism effects, vibrant gradients, and smooth animations
- **🔒 Secure** - Firebase credentials stored in environment variables, never committed to repo

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase project with Firestore database
- Git

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd delta-exchange-journal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase credentials**

   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Firebase credentials:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   > **Important**: The `.env` file is gitignored and will never be committed to the repository.

4. **Start development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (⚙️ icon)
4. Scroll down to "Your apps" section
5. Click on the web app icon (`</>`) or create a new web app
6. Copy the config values to your `.env` file

### Firestore Database Structure

Your Firestore database should have a `trades` collection with documents containing:

```javascript
{
  symbol: "ETHUSD",                    // Trading pair symbol
  strategy_name: "Calc Fields Test",   // Strategy name
  entry_action: "ENTRY_LONG",          // Entry action
  entry_side: "buy",                   // Entry side (buy/sell)
  entry_price: 3400,                   // Entry price
  entry_execution_price: 3402.5,       // Actual execution price
  entry_timestamp: Timestamp,          // Entry timestamp
  entry_reason: "Entry signal",        // Entry reason
  entry_rsi: 58.3,                     // RSI at entry
  exit_action: "EXIT_LONG",            // Exit action
  exit_side: "sell",                   // Exit side
  exit_price: 3570,                    // Exit price
  exit_execution_price: 3568.75,       // Actual execution price
  exit_timestamp: Timestamp,           // Exit timestamp
  exit_reason: "Profit target",        // Exit reason
  exit_rsi: 42.1,                      // RSI at exit
  pnl: 850,                            // Profit/Loss
  pnl_percentage: 50,                  // PnL percentage
  days_held: 0,                        // Days held
  trading_fees: 12.5,                  // Trading fees
  funding_charges: -5.25,              // Funding charges
  status: "CLOSED",                    // Status (OPEN/CLOSED)
  mode: "paper",                       // Mode (paper/live)
  leverage: 10,                        // Leverage
  order_size: 5,                       // Order size
  margin_used: 1700,                   // Margin used
  product_id: 27,                      // Product ID
  remaining_margin: 9532.25            // Remaining margin
}
```

## 🌐 Deployment to GitHub Pages

### Step 1: Configure GitHub Repository

1. **Update `vite.config.js`**

   Replace the repository name in `vite.config.js`:

   ```javascript
   export default defineConfig({
     plugins: [vue()],
     base: "/your-repository-name/", // Change this to your repo name
   });
   ```

2. **Commit and push your code**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### Step 2: Configure GitHub Secrets

Your Firebase credentials must be stored as GitHub Secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following secrets:

   | Secret Name                         | Value                             |
   | ----------------------------------- | --------------------------------- |
   | `VITE_FIREBASE_API_KEY`             | Your Firebase API Key             |
   | `VITE_FIREBASE_AUTH_DOMAIN`         | Your Firebase Auth Domain         |
   | `VITE_FIREBASE_PROJECT_ID`          | Your Firebase Project ID          |
   | `VITE_FIREBASE_STORAGE_BUCKET`      | Your Firebase Storage Bucket      |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
   | `VITE_FIREBASE_APP_ID`              | Your Firebase App ID              |

### Step 3: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**
3. The workflow will automatically build and deploy on every push to `main`

### Step 4: Deploy

Push code to the `main` branch:

```bash
git push origin main
```

The GitHub Actions workflow will:

- Build your application
- Inject Firebase credentials from GitHub Secrets
- Deploy to GitHub Pages

Your site will be available at: `https://your-username.github.io/your-repository-name/`

## 📦 Available Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally

## 🎨 Design System

The application uses a modern design system with:

- **Dark Theme** - Easy on the eyes for long trading sessions
- **Glassmorphism** - Modern frosted glass effect on cards
- **Vibrant Gradients** - Eye-catching color combinations
- **Inter Font** - Professional, highly readable typography
- **Smooth Animations** - Polished micro-interactions
- **Responsive Grid** - Adaptive layout for all screen sizes

### Color Palette

- **Primary**: Purple/Blue gradient (`#667eea` → `#764ba2`)
- **Success/Profit**: Vibrant green (`#22c55e`)
- **Danger/Loss**: Vibrant red (`#ef4444`)
- **Background**: Deep dark (`#0a0e27` → `#151934`)

## 📱 Screenshots

The application features:

- **Dashboard** with key metrics and performance charts
- **Trade List** with advanced filtering and sorting
- **Strategy Analytics** showing comparative performance
- **PnL Charts** visualizing cumulative returns
- **Trade Details** with comprehensive information

## 🛠️ Tech Stack

- **Vue.js 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend tooling
- **Firebase/Firestore** - Real-time database
- **Chart.js** - Beautiful, responsive charts
- **Luxon** - Modern date/time library
- **CSS Custom Properties** - Design system tokens

## 🔒 Security

- Firebase credentials are **never** committed to the repository
- Environment variables are used for all sensitive data
- GitHub Secrets inject credentials at build time
- `.env` is gitignored by default

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with ❤️ using Vue.js and Firebase**
