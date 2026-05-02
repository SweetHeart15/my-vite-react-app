import React from 'react';
import './Dashboard.css';

const Dashboard = ({ transactions, currentUser, savingsGoals }) => {
  const monthlyIncome   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalBalance    = monthlyIncome - monthlyExpenses;

  const totalSaved      = (savingsGoals || []).reduce((s, g) => s + g.current_amount, 0);
  const totalGoal       = (savingsGoals || []).reduce((s, g) => s + g.goal_amount, 0);
  const savingsProgress = totalGoal > 0 ? Math.round((totalSaved / totalGoal) * 100) : 0;

  const recentTransactions = transactions.slice(0, 3);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  const firstName    = currentUser?.first_name || 'there';
  const avatarLetter = firstName.charAt(0).toUpperCase();

  // No currency symbol — just formatted number
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const categoryIcon = (cat) => ({
    'Dining & Drinks': '☕', 'Income': '💳', 'Personal Growth': '📚',
    'Bills': '🏠', 'Lifestyle': '✨', 'Wellness': '🌿',
    'Savings': '🏦', 'Transport': '🚗', 'Health': '💊',
  }[cat] || '💰');

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h1 className="dash-greeting">{getGreeting()}, {firstName}</h1>
        <div className="dash-actions">
          <div className="profile-chip">
            <div className="profile-avatar">{avatarLetter}</div>
            <span>Profile</span>
          </div>
        </div>
      </div>

      <div className="dash-grid">

        {/* ── Balance Card ── */}
        <div className="balance-card">
          <div className="balance-label">Current Fintrack Balance</div>
          <div className="balance-amount">₱{fmt(totalBalance)}</div>
          <div className="balance-meta">
            <span>Month <strong>{new Date().toLocaleString('default', { month: 'long' })}</strong></span>
            <span>Status <strong className={totalBalance >= 0 ? 'status-balanced' : 'status-deficit'}>
              {totalBalance >= 0 ? 'Balanced' : 'Deficit'}
            </strong></span>
            <span>Entries <strong>{transactions.length}</strong></span>
          </div>
          <div className="savings-progress-section">
            <div className="progress-label-row">
              <span>Savings Goal Progress</span>
              <strong>{savingsProgress}%</strong>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${savingsProgress}%` }} />
            </div>
          </div>
        </div>

        {/* ── Income & Expenses ── */}
        <div className="side-cards">
          <div className="info-card income-card">
            <div className="info-card-icon income-icon">↓</div>
            <div>
              <div className="info-card-label">Total Income</div>
              <div className="info-card-value">₱{fmt(monthlyIncome)}</div>
              <div className="info-card-sub">{transactions.filter(t => t.amount > 0).length} income entries</div>
            </div>
          </div>
          <div className="info-card expense-card">
            <div className="info-card-icon expense-icon">↑</div>
            <div>
              <div className="info-card-label">Total Expenses</div>
              <div className="info-card-value">₱{fmt(monthlyExpenses)}</div>
              <div className="info-card-sub">{transactions.filter(t => t.amount < 0).length} expense entries</div>
            </div>
          </div>
        </div>

        {/* ── Recent Rituals — no status badge ── */}
        <div className="rituals-card">
          <div className="section-header">
            <h2>Recent Rituals</h2>
          </div>
          <div className="ritual-list">
            {recentTransactions.length === 0 ? (
              <div className="ritual-empty">
                No transactions yet. Add your first entry in the Transactions page.
              </div>
            ) : recentTransactions.map((t) => (
              <div key={t.id} className="ritual-item">
                <div className="ritual-icon">{categoryIcon(t.category)}</div>
                <div className="ritual-info">
                  <div className="ritual-name">{t.merchantName || t.merchant_name}</div>
                  <div className="ritual-meta">{t.category} · {t.date}</div>
                </div>
                {/* Amount only — no status badge */}
                <div className={`ritual-amount ${t.amount < 0 ? 'negative' : 'positive'}`}>
                  {t.amount < 0 ? '-' : '+'}₱{Math.abs(t.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mindful Insight ── */}
        <div className="insight-card">
          <div className="insight-badge">MINDFUL INSIGHT</div>
          {monthlyIncome === 0 && monthlyExpenses === 0 ? (
            <>
              <p className="insight-text">Your journey begins here.</p>
              <p className="insight-sub">Add your income and expenses in the Transactions page to start tracking your financial sanctuary.</p>
            </>
          ) : totalBalance < 0 ? (
            <>
              <p className="insight-text">Your expenses exceed your income.</p>
              <p className="insight-sub">You've spent ₱{fmt(monthlyExpenses - monthlyIncome)} more than earned. Consider reviewing your spending.</p>
            </>
          ) : (
            <>
              <p className="insight-text">You're ahead by ₱{fmt(totalBalance)}.</p>
              <p className="insight-sub">Your balance is positive — consider putting some toward your savings goals to build your sanctuary.</p>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;