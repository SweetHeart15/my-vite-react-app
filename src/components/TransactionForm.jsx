import React, { useState } from 'react';
import './TransactionForm.css';

const CATEGORIES = [
  'Dining & Drinks',
  'Income',
  'Personal Growth',
  'Bills',
  'Lifestyle',
  'Wellness',
  'Savings',
  'Transport',
  'Health',
];

const TransactionForm = ({ onAddTransaction, currentUser, activeType = 'expense' }) => {
  const [type, setType] = useState(activeType); // 'expense' | 'income'
  const [formData, setFormData] = useState({
    merchantName: '',
    amount: '',
    date: '',
    category: 'Dining & Drinks',
  });
  const [status, setStatus] = useState(null); // { type: 'loading'|'success'|'error', message }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSwitch = (t) => {
    setType(t);
    // Auto-set category to Income when switching to income type
    if (t === 'income') {
      setFormData(prev => ({ ...prev, category: 'Income' }));
    } else {
      setFormData(prev => ({ ...prev, category: 'Dining & Drinks' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.merchantName.trim() || !formData.amount) {
      setStatus({ type: 'error', message: 'Please fill in the merchant name and amount.' });
      return;
    }
    if (!currentUser) {
      setStatus({ type: 'error', message: 'No user session found. Please log in again.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Recording your entry…' });

    // Expense = negative, Income = positive
    const signedAmount = type === 'expense'
      ? -Math.abs(parseFloat(formData.amount))
      :  Math.abs(parseFloat(formData.amount));

    const payload = {
      merchantName: formData.merchantName.trim(),
      amount:       signedAmount,
      date:         formData.date || null,
      category:     formData.category,
      user_id:      currentUser.id,
    };

    try {
      await onAddTransaction(payload);
      setStatus({ type: 'success', message: '✓ Entry recorded successfully!' });
      setFormData({ merchantName: '', amount: '', date: '', category: type === 'income' ? 'Income' : 'Dining & Drinks' });
      setTimeout(() => setStatus(null), 2500);
    } catch {
      setStatus({ type: 'error', message: '✕ Failed to record. Please try again.' });
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const handleDiscard = () => {
    setFormData({ merchantName: '', amount: '', date: '', category: type === 'income' ? 'Income' : 'Dining & Drinks' });
    setStatus(null);
  };

  const isExpense = type === 'expense';

  return (
    <div className="new-transaction-container">

      {/* Type toggle */}
      <div className="tx-type-toggle">
        <button
          type="button"
          className={`tx-type-btn ${isExpense ? 'active expense' : ''}`}
          onClick={() => handleTypeSwitch('expense')}
        >
          ↑ Expense
        </button>
        <button
          type="button"
          className={`tx-type-btn ${!isExpense ? 'active income' : ''}`}
          onClick={() => handleTypeSwitch('income')}
        >
          ↓ Income
        </button>
      </div>

      {/* Entry label */}
      <div className="tx-entry-label">
        <span className={`tx-badge ${isExpense ? 'expense' : 'income'}`}>
          {isExpense ? '↑ EXPENSE' : '↓ INCOME'}
        </span>
        <span className="tx-entry-title">
          {isExpense ? 'New Expense Entry' : 'New Income Entry'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">

        {/* Merchant */}
        <div className="form-group">
          <label>MERCHANT NAME</label>
          <input
            type="text"
            name="merchantName"
            value={formData.merchantName}
            onChange={handleChange}
            placeholder={isExpense ? 'Where did you spend?' : 'Source of income?'}
          />
        </div>

        {/* Amount + Date */}
        <div className="form-row">
          <div className="form-group">
            <label>AMOUNT (₱)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>DATE</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <label>CATEGORY</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status feedback */}
        {status && (
          <div className={`tx-status ${status.type}`}>
            {status.message}
          </div>
        )}

        {/* Buttons */}
        <div className="button-group">
          <button type="button" className="discard-btn" onClick={handleDiscard}>
            Discard
          </button>
          <button
            type="submit"
            className={`record-btn ${isExpense ? 'expense' : 'income'}`}
            disabled={status?.type === 'loading'}
          >
            {status?.type === 'loading'
              ? 'Recording…'
              : isExpense ? 'Record Expense' : 'Record Income'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;