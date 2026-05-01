import React, { useState, useEffect } from 'react';
import './SavingsGoals.css';

const API = 'http://localhost:8000';

const SavingsGoals = ({ currentUser, onGoalsChange }) => {
  const [goals, setGoals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [addingTo, setAddingTo]     = useState(null);
  const [addAmount, setAddAmount]   = useState('');
  const [addDate, setAddDate]       = useState('');
  const [addStatus, setAddStatus]   = useState({});
  const [history, setHistory]       = useState({});
  const [newGoal, setNewGoal]       = useState({
    name: '', type: '', goal_amount: '', current_amount: '', due_date: '',
    color: '#e8d5c4', image: '🎯',
  });

  const syncGoals = (updated) => {
    setGoals(updated);
    if (onGoalsChange) onGoalsChange(updated);
  };

  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API}/goals?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => { syncGoals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentUser]);

  const totalSavings = goals.reduce((s, g) => s + g.current_amount, 0);
  const pct          = (g) => Math.min(Math.round((g.current_amount / g.goal_amount) * 100), 100);
  const isCompleted  = (g) => pct(g) >= 100;
  const fmt          = (n) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const fmtDate = (d) => {
    if (!d) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // ── Add new goal ───────────────────────────────────────────────────────────
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.goal_amount) {
      setSaveStatus({ type: 'error', message: 'Goal name and target amount are required.' });
      return;
    }
    setSaveStatus({ type: 'loading', message: 'Saving your intention…' });
    try {
      const res = await fetch(`${API}/goals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:        currentUser.id,
          name:           newGoal.name,
          type:           newGoal.type || 'General',
          goal_amount:    parseFloat(newGoal.goal_amount),
          current_amount: parseFloat(newGoal.current_amount) || 0,
          due_date:       newGoal.due_date || 'No date set',
          color:          newGoal.color,   // ← always save exactly what user picked
          image:          newGoal.image,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      syncGoals([...goals, created]);
      setSaveStatus({ type: 'success', message: '✓ Savings goal saved successfully!' });
      setNewGoal({ name: '', type: '', goal_amount: '', current_amount: '', due_date: '', color: '#e8d5c4', image: '🎯' });
      setTimeout(() => { setSaveStatus(null); setShowForm(false); }, 2000);
    } catch {
      setSaveStatus({ type: 'error', message: '✕ Failed to save goal. Please try again.' });
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // ── Add money to goal ──────────────────────────────────────────────────────
  const handleAddMoney = async (goal) => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;
    if (!addDate) {
      setAddStatus(prev => ({ ...prev, [goal.id]: { type: 'error', message: 'Please select a date.' } }));
      setTimeout(() => setAddStatus(prev => { const n = {...prev}; delete n[goal.id]; return n; }), 3000);
      return;
    }
    if (isCompleted(goal)) return;

    const newAmount = Math.min(goal.current_amount + amount, goal.goal_amount);
    try {
      const res = await fetch(`${API}/goals/${goal.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_amount: newAmount }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      syncGoals(goals.map(g => g.id === goal.id ? updated : g));

      const entry = { amount, date: fmtDate(addDate) };
      setHistory(prev => ({ ...prev, [goal.id]: [...(prev[goal.id] || []), entry] }));

      const justCompleted = newAmount >= goal.goal_amount;
      setAddStatus(prev => ({
        ...prev,
        [goal.id]: { type: 'success', message: justCompleted ? '🎉 Goal completed!' : '✓ Added!' },
      }));
      setAddingTo(null);
      setAddAmount('');
      setAddDate('');
      setTimeout(() => setAddStatus(prev => { const n = {...prev}; delete n[goal.id]; return n; }), 3000);
    } catch {
      setAddStatus(prev => ({ ...prev, [goal.id]: { type: 'error', message: '✕ Failed to update.' } }));
      setTimeout(() => setAddStatus(prev => { const n = {...prev}; delete n[goal.id]; return n; }), 3000);
    }
  };

  // ── Delete goal ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this savings goal?')) return;
    try {
      await fetch(`${API}/goals/${id}`, { method: 'DELETE' });
      syncGoals(goals.filter(g => g.id !== id));
      setHistory(prev => { const n = {...prev}; delete n[id]; return n; });
    } catch (err) { console.error('Failed to delete goal:', err); }
  };

  const EMOJI_OPTIONS = ['🎯','🏖️','🛡️','🖥️','🚗','✈️','🏠','💍','📚','🌿','💪','🎓'];
  const COLOR_OPTIONS = ['#e8d5c4','#d4e8d4','#d4d4e8','#e8e4d4','#2d1f14','#f0e8d8','#e0d4e8'];

  // ── Collapsed "completed" chip ─────────────────────────────────────────────
  const CompletedChip = ({ g }) => (
    <div className="goal-completed-chip" style={{ borderLeft: `4px solid ${g.color !== '#2d1f14' ? g.color : '#c4a090'}` }}>
      <span className="goal-completed-chip-emoji">{g.image}</span>
      <div className="goal-completed-chip-info">
        <span className="goal-completed-chip-name">{g.name}</span>
        <span className="goal-completed-chip-meta">{g.type} · ₱{fmt(g.goal_amount)} · {g.due_date}</span>
      </div>
      <span className="goal-completed-chip-badge">🎉 Completed</span>
      <button className="goal-del-btn goal-chip-del" onClick={() => handleDelete(g.id)}>Remove</button>
    </div>
  );

  // ── Active goal card ───────────────────────────────────────────────────────
  const GoalCard = ({ g, featured = false }) => {
    const goalHistory = history[g.id] || [];

    return (
      <div
        className={featured ? 'goal-featured' : 'goal-card'}
        style={{ background: g.color }}   // ← always use g.color, never override with dark class
      >
        <div className="goal-type-badge">{g.type}</div>
        {featured && (
          <div className="goal-due">
            COMPLETION DATE<br />
            <strong>{g.due_date}</strong>
          </div>
        )}
        <div className="goal-emoji-bg">{g.image}</div>
        <h2 className={featured ? 'goal-name' : 'goal-card-name'}>{g.name}</h2>

        <div className={featured ? 'goal-amounts' : 'goal-card-amounts'}>
          <div>
            <div className={featured ? 'amount-label' : ''}>CURRENT SAVINGS</div>
            <div className={featured ? 'amount-value' : 'gc-current'}>₱{fmt(g.current_amount)}</div>
          </div>
          <div>
            <div className={featured ? 'amount-label' : ''}>GOAL AMOUNT</div>
            <div className={featured ? 'amount-value' : 'gc-total'}>₱{fmt(g.goal_amount)}</div>
          </div>
        </div>

        <div className={`goal-progress-bar ${featured ? '' : 'slim'}`}>
          <div className="goal-progress-fill" style={{ width: `${pct(g)}%` }} />
        </div>
        <div className="goal-progress-meta">
          <span>{pct(g)}% of goal reached{!featured && ` · Due ${g.due_date}`}</span>
        </div>

        {/* Contribution history */}
        {goalHistory.length > 0 && (
          <div className="goal-history">
            <div className="goal-history-title">Contribution History</div>
            {goalHistory.map((entry, i) => (
              <div key={i} className="goal-history-row">
                <span className="goal-history-date">{entry.date}</span>
                <span className="goal-history-amount">+₱{fmt(entry.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {addStatus[g.id] && (
          <div className={`add-status-msg ${addStatus[g.id].type}`}>{addStatus[g.id].message}</div>
        )}

        {/* Add money row */}
        {addingTo === g.id ? (
          <div className="add-money-row">
            <input type="number" placeholder="Amount" value={addAmount}
              onChange={e => setAddAmount(e.target.value)} className="add-money-input" min="0" step="0.01" />
            <input type="date" value={addDate}
              onChange={e => setAddDate(e.target.value)} className="add-money-input add-money-date" />
            <button className="add-money-confirm" onClick={() => handleAddMoney(g)}>Add</button>
            <button className="add-money-cancel" onClick={() => { setAddingTo(null); setAddAmount(''); setAddDate(''); }}>✕</button>
          </div>
        ) : (
          <div className="goal-card-btns">
            <button className="goal-add-btn" onClick={() => setAddingTo(g.id)}>+ Add Money</button>
            <button className="goal-del-btn" onClick={() => handleDelete(g.id)}>Remove</button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="savings-page">
      <p style={{ padding: '2rem', color: 'var(--text-light)' }}>Loading your goals…</p>
    </div>
  );

  // Separate active vs completed
  const activeGoals    = goals.filter(g => !isCompleted(g));
  const completedGoals = goals.filter(g => isCompleted(g));

  return (
    <div className="savings-page">
      <div className="savings-header">
        <div>
          <h1 className="savings-title">Your Financial Sanctuary</h1>
          <p className="savings-sub">Nurture your future self. Here are your active intentions for growth and security.</p>
        </div>
        <button className="set-goal-btn" onClick={() => { setShowForm(!showForm); setSaveStatus(null); }}>
          ✦ SET NEW GOAL
        </button>
      </div>

      {/* ── New goal form ── */}
      {showForm && (
        <div className="new-goal-form-card">
          <h3>New Savings Intention</h3>
          <form onSubmit={handleAddGoal} className="goal-form">
            <div className="goal-form-grid">
              <div className="form-group">
                <label>GOAL NAME</label>
                <input type="text" placeholder="e.g. Dream Vacation" value={newGoal.name}
                  onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>TYPE</label>
                <input type="text" placeholder="e.g. Travel, Security" value={newGoal.type}
                  onChange={e => setNewGoal({ ...newGoal, type: e.target.value })} />
              </div>
              <div className="form-group">
                <label>TARGET AMOUNT (₱)</label>
                <input type="number" placeholder="0.00" value={newGoal.goal_amount}
                  onChange={e => setNewGoal({ ...newGoal, goal_amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>CURRENT SAVINGS (₱)</label>
                <input type="number" placeholder="0.00" value={newGoal.current_amount}
                  onChange={e => setNewGoal({ ...newGoal, current_amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>TARGET DATE</label>
                <input type="date" value={newGoal.due_date}
                  onChange={e => setNewGoal({ ...newGoal, due_date: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label>ICON</label>
              <div className="emoji-picker">
                {EMOJI_OPTIONS.map(em => (
                  <button key={em} type="button"
                    className={`emoji-opt ${newGoal.image === em ? 'selected' : ''}`}
                    onClick={() => setNewGoal({ ...newGoal, image: em })}>{em}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>CARD COLOR</label>
              <div className="color-picker">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} type="button"
                    className={`color-opt ${newGoal.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewGoal({ ...newGoal, color: c })} />
                ))}
              </div>
              {/* Live preview swatch */}
              <div className="color-preview">
                <span>Preview:</span>
                <div className="color-preview-swatch" style={{ background: newGoal.color }} />
              </div>
            </div>

            {saveStatus && (
              <div className={`goal-save-status ${saveStatus.type}`}>{saveStatus.message}</div>
            )}
            <div className="goal-form-actions">
              <button type="button" className="cancel-btn"
                onClick={() => { setShowForm(false); setSaveStatus(null); }}>Cancel</button>
              <button type="submit" className="save-goal-btn" disabled={saveStatus?.type === 'loading'}>
                {saveStatus?.type === 'loading' ? 'Saving…' : 'Save Intention'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Empty state ── */}
      {goals.length === 0 && !showForm && (
        <div className="goals-empty">
          <p>🌱</p>
          <p>You haven't set any savings goals yet.</p>
          <p>Click <strong>✦ SET NEW GOAL</strong> to start your journey.</p>
        </div>
      )}

      {/* ── Active goals grid ── */}
      {activeGoals.length > 0 && (
        <div className="goals-grid">
          <GoalCard g={activeGoals[0]} featured={true} />
          <div className="goals-side">
            {activeGoals.slice(1).map(g => <GoalCard key={g.id} g={g} />)}
          </div>
          <div className="total-savings-card">
            <div className="ts-label">Total Intentional Savings</div>
            <div className="ts-sub">Across {goals.length} goal{goals.length !== 1 ? 's' : ''}</div>
            <div className="ts-amount">₱{fmt(totalSavings)}</div>
          </div>
        </div>
      )}

      {/* ── Completed goals — collapsed chips ── */}
      {completedGoals.length > 0 && (
        <div className="completed-goals-section">
          <div className="completed-goals-header">
            <span className="completed-goals-label">✓ Completed Goals</span>
            <span className="completed-goals-count">{completedGoals.length}</span>
          </div>
          <div className="completed-goals-list">
            {completedGoals.map(g => <CompletedChip key={g.id} g={g} />)}
          </div>
        </div>
      )}

      {/* Total when no active goals but completed exist */}
      {activeGoals.length === 0 && completedGoals.length > 0 && (
        <div className="total-savings-card" style={{ marginTop: '1.5rem' }}>
          <div className="ts-label">Total Intentional Savings</div>
          <div className="ts-sub">Across {goals.length} goal{goals.length !== 1 ? 's' : ''}</div>
          <div className="ts-amount">₱{fmt(totalSavings)}</div>
        </div>
      )}
    </div>
  );
};  

export default SavingsGoals;