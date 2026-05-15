import React, { useState } from 'react';
import './Transactions.css';

const API = import.meta.env.VITE_API_URL;

const categoryIcon = (cat) => ({
  'Dining & Drinks': '☕',
  'Income':          '💳',
  'Personal Growth': '📚',
  'Bills':           '🏠',
  'Lifestyle':       '✨',
  'Wellness':        '🌿',
  'Savings':         '🏦',
  'Transport':       '🚗',
  'Health':          '💊',
}[cat] || '💰');

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

// ── Expense Form ──────────────────────────────────────────────────────────────
const ExpenseForm = ({ currentUser, onTransactionSaved }) => {
  const [formData, setFormData] = useState({
    merchantName: '', amount: '', date: '', category: 'Dining & Drinks',
  });
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.merchantName || !formData.amount || !formData.date) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    setLoading(true); setStatus(null);
    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:       currentUser.id,
          merchant_name: formData.merchantName,
          amount:        -Math.abs(parseFloat(formData.amount)),
          date:          formatDate(formData.date),
          category:      formData.category,
        }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      onTransactionSaved({ ...saved, merchantName: saved.merchant_name });
      setStatus({ type: 'success', message: '✓ Expense recorded successfully!' });
      setFormData({ merchantName: '', amount: '', date: '', category: 'Dining & Drinks' });
    } catch {
      setStatus({ type: 'error', message: '✕ Failed to save. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="entry-form-card expense-form-card">
      <div className="form-card-header">
        <span className="form-type-badge expense-badge">↑ EXPENSE</span>
        <h3>New Expense Entry</h3>
      </div>
      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-group">
          <label>MERCHANT NAME</label>
          <input type="text" name="merchantName" value={formData.merchantName}
            onChange={handleChange} placeholder="Where did you spend?" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>AMOUNT (₱)</label>
            <input type="number" name="amount" value={formData.amount}
              onChange={handleChange} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label>DATE</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>CATEGORY</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option>Dining & Drinks</option>
            <option>Personal Growth</option>
            <option>Bills</option>
            <option>Lifestyle</option>
            <option>Wellness</option>
            <option>Savings</option>
            <option>Transport</option>
            <option>Health</option>
          </select>
        </div>
        {status && <div className={`form-status ${status.type}`}>{status.message}</div>}
        <div className="button-group">
          <button type="button" className="discard-btn"
            onClick={() => { setFormData({ merchantName: '', amount: '', date: '', category: 'Dining & Drinks' }); setStatus(null); }}>
            Discard
          </button>
          <button type="submit" className="record-btn expense-btn" disabled={loading}>
            {loading ? 'Saving…' : 'Record Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Income Form ───────────────────────────────────────────────────────────────
const IncomeForm = ({ currentUser, onTransactionSaved }) => {
  const [formData, setFormData] = useState({ source: '', amount: '', date: '', note: '' });
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.source || !formData.amount || !formData.date) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    setLoading(true); setStatus(null);
    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:       currentUser.id,
          merchant_name: formData.source,
          amount:        Math.abs(parseFloat(formData.amount)),
          date:          formatDate(formData.date),
          category:      'Income',
        }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      onTransactionSaved({ ...saved, merchantName: saved.merchant_name });
      setStatus({ type: 'success', message: '✓ Income recorded successfully!' });
      setFormData({ source: '', amount: '', date: '', note: '' });
    } catch {
      setStatus({ type: 'error', message: '✕ Failed to save. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="entry-form-card income-form-card">
      <div className="form-card-header">
        <span className="form-type-badge income-badge">↓ INCOME</span>
        <h3>New Income Entry</h3>
      </div>
      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-group">
          <label>INCOME SOURCE</label>
          <input type="text" name="source" value={formData.source}
            onChange={handleChange} placeholder="e.g. Salary, Freelance, Transfer" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>AMOUNT (₱)</label>
            <input type="number" name="amount" value={formData.amount}
              onChange={handleChange} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label>DATE</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>NOTE <span className="label-optional">(optional)</span></label>
          <input type="text" name="note" value={formData.note}
            onChange={handleChange} placeholder="Any details about this income?" />
        </div>
        {status && <div className={`form-status ${status.type}`}>{status.message}</div>}
        <div className="button-group">
          <button type="button" className="discard-btn"
            onClick={() => { setFormData({ source: '', amount: '', date: '', note: '' }); setStatus(null); }}>
            Discard
          </button>
          <button type="submit" className="record-btn income-btn" disabled={loading}>
            {loading ? 'Saving…' : 'Record Income'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Main Transactions Page ────────────────────────────────────────────────────
const Transactions = ({ transactions, onAddTransaction, onDeleteTransaction, currentUser }) => {
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('All');
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeTab, setActiveTab]       = useState('expense');

  const categories = ['All', 'Dining', 'Income', 'Personal', 'Bills', 'Lifestyle', 'Wellness'];
  const categoryMap = { 'Dining': 'Dining & Drinks', 'Personal': 'Personal Growth' };

  const filtered = transactions.filter(t => {
    const name = t.merchantName || t.merchant_name || '';
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(search.toLowerCase());
    const mapped = categoryMap[filter] || filter;
    const matchFilter = filter === 'All' || t.category === mapped;
    return matchSearch && matchFilter;
  });

  return (
    <div className="transactions-page">
      <div className="tx-header">
        <h1 className="tx-title">Transaction History</h1>
        <p className="tx-sub">A calm reflection of your financial journey. Every entry tells a story of intention.</p>
      </div>

      <div className="tx-grid">

        {/* ── Left: transaction list ── */}
        <div className="tx-list-panel">
          <div className="tx-controls">
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search by merchant or category…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-tabs">
              {categories.map(c => (
                <button key={c} className={`filter-tab ${filter === c ? 'active' : ''}`}
                  onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>
          </div>

          <div className="tx-table">
            {/* Header — no Status column */}
            <div className="tx-table-header">
              <span>Date</span>
              <span>Merchant / Category</span>
              <span className="align-right">Amount</span>
            </div>

            {filtered.length === 0 && (
              <div className="tx-empty">No transactions found.</div>
            )}

            {filtered.slice(0, visibleCount).map(t => (
              <div key={t.id} className="tx-row">
                <div className="tx-date">
                  <span>{t.date}</span>
                  <span className="tx-time">{t.time}</span>
                </div>
                <div className="tx-merchant">
                  <div className="tx-icon">{categoryIcon(t.category)}</div>
                  <div>
                    <div className="tx-name">{t.merchantName || t.merchant_name}</div>
                    <div className="tx-cat">{t.category}</div>
                  </div>
                </div>
                {/* Amount only — no status */}
                <div className={`tx-amount ${t.amount < 0 ? 'neg' : 'pos'}`}>
                  {t.amount < 0 ? '-' : '+'}₱{Math.abs(t.amount).toFixed(2)}
                </div>
                {/* ── NEW: action buttons ── */}
                <div className="tx-actions">
                  <button className="tx-del-btn" onClick={() => onDeleteTransaction(t.id)}>✕</button>
                </div>
              </div>
            ))}

            {filtered.length > visibleCount && (
              <button className="load-more-btn" onClick={() => setVisibleCount(v => v + 5)}>
                Load More Entries ↓
              </button>
            )}
          </div>
        </div>

        {/* ── Right: entry forms ── */}
        <div className="tx-form-panel">
          <div className="form-tab-switcher">
            <button className={`form-tab-btn ${activeTab === 'expense' ? 'active-expense' : ''}`}
              onClick={() => setActiveTab('expense')}>↑ Expense</button>
            <button className={`form-tab-btn ${activeTab === 'income' ? 'active-income' : ''}`}
              onClick={() => setActiveTab('income')}>↓ Income</button>
          </div>

          {activeTab === 'expense'
            ? <ExpenseForm currentUser={currentUser} onTransactionSaved={onAddTransaction} />
            : <IncomeForm  currentUser={currentUser} onTransactionSaved={onAddTransaction} />
          }

          <div className="mindful-card">
            <div className="mindful-badge">MINDFUL WORKPLACE</div>
            <p><em>Every transaction is a choice. Make it intentional.</em></p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Transactions;