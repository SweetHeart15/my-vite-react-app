import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SavingsGoals.css';

const API = import.meta.env.VITE_API_URL;

// ─── Extracted outside parent so it never remounts on re-render ───────────────
const AddMoneyRow = ({ goal, onConfirm, onCancel }) => {
  const inputRef = useRef(null);
  const [amount, setAmount] = useState('');
  const [date, setDate]     = useState('');
  const [err, setErr]       = useState('');

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) { setErr('Enter a valid amount.'); return; }
    if (!date) { setErr('Please select a date.'); return; }
    onConfirm(parseFloat(amount), date);
  };

  // ✅ FIX: Use uncontrolled ref for amount to prevent focus loss
  const handleAmountChange = useCallback((e) => {
    setAmount(e.target.value);
    setErr('');
  }, []);

  const handleDateChange = useCallback((e) => {
    setDate(e.target.value);
    setErr('');
  }, []);

  return (
    <div className="add-money-row">
      {err && <div className="add-inline-err">{err}</div>}
      <input
        ref={inputRef}
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={handleAmountChange}
        className="add-money-input"
        min="0"
        step="0.01"
        onKeyDown={e => e.key === 'Enter' && handleConfirm()}
        autoFocus
      />
      <input
        type="date"
        value={date}
        onChange={handleDateChange}
        className="add-money-input add-money-date"
      />
      <button className="add-money-confirm" onClick={handleConfirm}>Add</button>
      <button className="add-money-cancel" onClick={onCancel}>✕</button>
    </div>
  );
};

// ─── Quick Savings Calculator Panel ──────────────────────────────────────────
const SavingsCalculator = ({ goals }) => {
  const [targetAmount, setTargetAmount] = useState('');
  const [months, setMonths]             = useState('');
  const [existingSavings, setExisting]  = useState('');
  const [result, setResult]             = useState(null);
  const [activeTab, setActiveTab]       = useState('calc'); // 'calc' | 'tips'

  const fmt = n => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const handleCalc = () => {
    const target   = parseFloat(targetAmount) || 0;
    const mos      = parseInt(months) || 1;
    const existing = parseFloat(existingSavings) || 0;
    const needed   = Math.max(target - existing, 0);
    const monthly  = needed / mos;
    const weekly   = monthly / 4.33;
    const daily    = monthly / 30;
    setResult({ monthly, weekly, daily, needed, mos });
  };

  const tips = [
    { icon: '☕', title: 'Skip one coffee a day', desc: 'Saving ₱150/day = ₱4,500/month. Small swaps add up fast.' },
    { icon: '📦', title: 'Automate your savings', desc: 'Set an auto-transfer on payday before you spend anything.' },
    { icon: '🧾', title: 'Track every peso', desc: 'Awareness is the first step. Use the Transactions tab to log all expenses.' },
    { icon: '🎯', title: 'Use the 50/30/20 rule', desc: '50% needs, 30% wants, 20% savings — adjust to fit your goals.' },
    { icon: '🔁', title: 'Round up purchases', desc: 'Round every purchase up and save the difference.' },
    { icon: '🏦', title: 'High-yield savings', desc: 'Look into digital banks (Maya, GCash GSave) for better interest rates.' },
  ];

  return (
    <div className="calculator-panel">
      <div className="calc-panel-header">
        <div className="calc-tabs">
          <button
            className={`calc-tab ${activeTab === 'calc' ? 'active' : ''}`}
            onClick={() => setActiveTab('calc')}
          >🧮 Calculator</button>
          <button
            className={`calc-tab ${activeTab === 'tips' ? 'active' : ''}`}
            onClick={() => setActiveTab('tips')}
          >💡 Tips</button>
        </div>
      </div>

      {activeTab === 'calc' && (
        <div className="calc-body">
          <p className="calc-subtitle">How much do you need to save per month?</p>
          <div className="calc-fields">
            <div className="calc-field">
              <label>Target Amount (₱)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                className="calc-input"
              />
            </div>
            <div className="calc-field">
              <label>Current Savings (₱)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={existingSavings}
                onChange={e => setExisting(e.target.value)}
                className="calc-input"
              />
            </div>
            <div className="calc-field">
              <label>Time Frame (months)</label>
              <input
                type="number"
                placeholder="e.g. 12"
                value={months}
                onChange={e => setMonths(e.target.value)}
                className="calc-input"
                min="1"
              />
            </div>
          </div>

          {/* Quick fill from existing goals */}
          {goals.length > 0 && (
            <div className="calc-quick-fill">
              <span className="calc-quick-label">Fill from goal:</span>
              <div className="calc-quick-btns">
                {goals.slice(0, 3).map(g => (
                  <button
                    key={g.id}
                    className="calc-quick-btn"
                    onClick={() => {
                      setTargetAmount(g.goal_amount);
                      setExisting(g.current_amount);
                    }}
                  >{g.image} {g.name}</button>
                ))}
              </div>
            </div>
          )}

          <button className="calc-submit-btn" onClick={handleCalc}>Calculate</button>

          {result && (
            <div className="calc-result">
              <div className="calc-result-title">You need to save:</div>
              <div className="calc-result-grid">
                <div className="calc-result-item primary">
                  <span className="calc-result-val">₱{fmt(result.monthly)}</span>
                  <span className="calc-result-period">per month</span>
                </div>
                <div className="calc-result-item">
                  <span className="calc-result-val">₱{fmt(result.weekly)}</span>
                  <span className="calc-result-period">per week</span>
                </div>
                <div className="calc-result-item">
                  <span className="calc-result-val">₱{fmt(result.daily)}</span>
                  <span className="calc-result-period">per day</span>
                </div>
              </div>
              <div className="calc-result-note">
                ₱{fmt(result.needed)} still needed over {result.mos} month{result.mos !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tips' && (
        <div className="tips-body">
          {tips.map((tip, i) => (
            <div key={i} className="tip-row">
              <span className="tip-icon">{tip.icon}</span>
              <div className="tip-text">
                <div className="tip-title">{tip.title}</div>
                <div className="tip-desc">{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Momentum Panel ───────────────────────────────────────────────────────────
const MomentumPanel = ({ goals, history }) => {
  const fmt = n => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const insights = goals.map(g => {
    const entries    = history[g.id] || [];
    const totalAdded = entries.reduce((s, e) => s + e.amount, 0);
    const remaining  = Math.max(g.goal_amount - g.current_amount, 0);
    const pct        = Math.min(Math.round((g.current_amount / g.goal_amount) * 100), 100);
    const avgContrib = entries.length ? totalAdded / entries.length : 0;
    const contribsNeeded = avgContrib > 0 ? Math.ceil(remaining / avgContrib) : null;
    const uniqueDates = [...new Set(entries.map(e => e.date))];

    let nudge = '';
    if (pct === 0)      nudge = 'Every journey starts with one step. Make your first deposit! 🌱';
    else if (pct < 25)  nudge = "You've begun! Keep the momentum going. 💪";
    else if (pct < 50)  nudge = 'Great start — you\'re building a habit. 🔥';
    else if (pct < 75)  nudge = "Halfway there! You're unstoppable. ⚡";
    else if (pct < 100) nudge = 'Almost there — the finish line is in sight! 🏁';
    else                nudge = 'Goal achieved! You did it! 🎉';

    return { g, pct, remaining, avgContrib, contribsNeeded, uniqueDates, nudge, entries };
  });

  const activeInsights = insights.filter(i => i.pct < 100);
  if (activeInsights.length === 0) return null;

  const totalRemaining = activeInsights.reduce((s, i) => s + i.remaining, 0);
  const totalContribs  = Object.values(history).flat().length;
  const mostProgress   = [...activeInsights].sort((a, b) => b.pct - a.pct)[0];
  const needsAttention = [...activeInsights].sort((a, b) => a.pct - b.pct)[0];

  return (
    <div className="momentum-panel">
      <div className="momentum-header">
        <span className="momentum-icon">✦</span>
        <h3 className="momentum-title">Savings Momentum</h3>
        <span className="momentum-sub">Your progress at a glance</span>
      </div>

      <div className="momentum-strip">
        <div className="momentum-stat">
          <span className="mstat-value">₱{fmt(totalRemaining)}</span>
          <span className="mstat-label">Still to save</span>
        </div>
        <div className="momentum-stat">
          <span className="mstat-value">{totalContribs}</span>
          <span className="mstat-label">Total deposits</span>
        </div>
        <div className="momentum-stat">
          <span className="mstat-value">{activeInsights.length}</span>
          <span className="mstat-label">Active goals</span>
        </div>
      </div>

      <div className="momentum-spotlights">
        <div className="spotlight-card spotlight-lead">
          <div className="spotlight-label">🏆 Leading Goal</div>
          <div className="spotlight-name">{mostProgress.g.image} {mostProgress.g.name}</div>
          <div className="spotlight-pct">{mostProgress.pct}%</div>
          <div className="spotlight-bar">
            <div className="spotlight-fill" style={{ width: `${mostProgress.pct}%` }} />
          </div>
          <div className="spotlight-nudge">{mostProgress.nudge}</div>
          {mostProgress.avgContrib > 0 && (
            <div className="spotlight-hint">
              Avg deposit: ₱{fmt(mostProgress.avgContrib)}
              {mostProgress.contribsNeeded && ` · ~${mostProgress.contribsNeeded} more to go`}
            </div>
          )}
        </div>

        {needsAttention.g.id !== mostProgress.g.id && (
          <div className="spotlight-card spotlight-attention">
            <div className="spotlight-label">⚡ Needs a Push</div>
            <div className="spotlight-name">{needsAttention.g.image} {needsAttention.g.name}</div>
            <div className="spotlight-pct">{needsAttention.pct}%</div>
            <div className="spotlight-bar">
              <div className="spotlight-fill attn" style={{ width: `${needsAttention.pct}%` }} />
            </div>
            <div className="spotlight-nudge">{needsAttention.nudge}</div>
            <div className="spotlight-hint">₱{fmt(needsAttention.remaining)} remaining</div>
          </div>
        )}
      </div>

      {activeInsights.length > 1 && (
        <div className="momentum-velocity">
          <div className="velocity-header">All Goals Progress</div>
          {activeInsights.map(({ g, pct, remaining, entries }) => (
            <div key={g.id} className="velocity-row">
              <span className="vel-emoji">{g.image}</span>
              <div className="vel-info">
                <span className="vel-name">{g.name}</span>
                <div className="vel-bar-wrap">
                  <div className="vel-bar">
                    <div className="vel-fill" style={{ width: `${pct}%`, background: g.color !== '#2d1f14' ? g.color : '#c4a090' }} />
                  </div>
                  <span className="vel-pct">{pct}%</span>
                </div>
              </div>
              <div className="vel-meta">
                <span className="vel-deposits">{entries.length} deposits</span>
                <span className="vel-remaining">₱{remaining.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} left</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Completed chip ───────────────────────────────────────────────────────────
const CompletedChip = ({ g, onDelete }) => {
  const fmt = n => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  return (
    <div className="goal-completed-chip" style={{ borderLeft: `4px solid ${g.color !== '#2d1f14' ? g.color : '#c4a090'}` }}>
      <span className="goal-completed-chip-emoji">{g.image}</span>
      <div className="goal-completed-chip-info">
        <span className="goal-completed-chip-name">{g.name}</span>
        <span className="goal-completed-chip-meta">{g.type} · ₱{fmt(g.goal_amount)} · {g.due_date}</span>
      </div>
      <span className="goal-completed-chip-badge">🎉 Completed</span>
      <button className="goal-del-btn goal-chip-del" onClick={() => onDelete(g.id)}>Remove</button>
    </div>
  );
};

// ─── Goal Card ────────────────────────────────────────────────────────────────
const GoalCard = ({ g, featured, addingTo, setAddingTo, onAddMoney, onDelete, addStatus, history }) => {
  const fmt         = n => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  const pct         = Math.min(Math.round((g.current_amount / g.goal_amount) * 100), 100);
  const goalHistory = history[g.id] || [];
  const isActive    = addingTo === g.id;

  const handleConfirm = useCallback((amount, date) => {
    onAddMoney(g, amount, date);
  }, [g, onAddMoney]);

  const handleCancel = useCallback(() => {
    setAddingTo(null);
  }, [setAddingTo]);

return (
  <div className={featured ? 'goal-featured' : 'goal-card'} style={{ background: g.color }}>
    {/* Always show these on every card */}
    <div className="goal-type-badge">{g.type}</div>
    <div className="goal-due">
      COMPLETION DATE<br />
      <strong>{g.due_date}</strong>
    </div>
    <div className="goal-emoji-bg">{g.image}</div>

    <h2 className={featured ? 'goal-name' : 'goal-card-name'}>{g.name}</h2>

      <div className="goal-card-amounts">
  <div>
    <span className="gc-label">CURRENT SAVINGS</span>
    <span className="gc-current">₱{fmt(g.current_amount)}</span>
  </div>
  <div>
    <span className="gc-label">GOAL AMOUNT</span>
    <span className="gc-current">₱{fmt(g.goal_amount)}</span>
  </div>
</div>

      <div className={`goal-progress-bar ${featured ? '' : 'slim'}`}>
        <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="goal-progress-meta">
        <span>{pct}% of goal reached</span>
      </div>

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

      {isActive ? (
        <AddMoneyRow goal={g} onConfirm={handleConfirm} onCancel={handleCancel} />
      ) : (
        <div className="goal-card-btns">
          <button className="goal-add-btn" onClick={() => setAddingTo(g.id)}>+ Add Money</button>
          <button className="goal-del-btn" onClick={() => onDelete(g.id)}>Remove</button>
        </div>
        
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SavingsGoals = ({ currentUser, onGoalsChange }) => {
  const [goals, setGoals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [addingTo, setAddingTo]     = useState(null);
  const [addStatus, setAddStatus]   = useState({});
  const [history, setHistory]       = useState({});
  const [newGoal, setNewGoal] = useState({
  name: '', type: '', goal_amount: '', current_amount: '', due_date: '',
  color: '#e8d5c4', image: '🎯',
  showTypeOther: false,   // ← add this
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
  const fmt          = n => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  const isCompleted  = g => Math.min(Math.round((g.current_amount / g.goal_amount) * 100), 100) >= 100;

  const fmtDate = d => {
    if (!d) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // ── Add new goal ────────────────────────────────────────────────────────────
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
          color:          newGoal.color,
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

  // ── Add money ───────────────────────────────────────────────────────────────
  const handleAddMoney = useCallback(async (goal, amount, date) => {
    if (isCompleted(goal)) return;
    const newAmount = Math.min(goal.current_amount + amount, goal.goal_amount);
    try {
      const res = await fetch(`${API}/goals/${goal.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_amount: newAmount }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setGoals(prev => {
        const next = prev.map(g => g.id === goal.id ? updated : g);
        if (onGoalsChange) onGoalsChange(next);
        return next;
      });

      const entry = { amount, date: fmtDate(date) };
      setHistory(prev => ({ ...prev, [goal.id]: [...(prev[goal.id] || []), entry] }));

      const justCompleted = newAmount >= goal.goal_amount;
      setAddStatus(prev => ({
        ...prev,
        [goal.id]: { type: 'success', message: justCompleted ? '🎉 Goal completed!' : '✓ Added!' },
      }));
      setAddingTo(null);
      setTimeout(() => setAddStatus(prev => { const n = {...prev}; delete n[goal.id]; return n; }), 3000);
    } catch {
      setAddStatus(prev => ({ ...prev, [goal.id]: { type: 'error', message: '✕ Failed to update.' } }));
      setTimeout(() => setAddStatus(prev => { const n = {...prev}; delete n[goal.id]; return n; }), 3000);
    }
  }, [onGoalsChange]);

  // ── Delete goal ─────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Remove this savings goal?')) return;
    try {
      await fetch(`${API}/goals/${id}`, { method: 'DELETE' });
      setGoals(prev => {
        const next = prev.filter(g => g.id !== id);
        if (onGoalsChange) onGoalsChange(next);
        return next;
      });
      setHistory(prev => { const n = {...prev}; delete n[id]; return n; });
    } catch (err) { console.error('Failed to delete goal:', err); }
  }, [onGoalsChange]);


  const COLOR_OPTIONS = ['#e8d5c4','#d4e8d4','#d4d4e8','#e8e4d4','#f0e8d8','#e0d4e8'];

  const GOAL_TYPES = [
  '✈️ Travel',
  '🏠 Housing',
  '🚗 Vehicle',
  '📚 Education',
  '🏥 Health',
  '💍 Wedding',
  '🛡️ Emergency Fund',
  '💻 Tech & Gadgets',
  '🎉 Events',
  '💼 Business',
  '🌿 Wellness',
  '🎓 Tuition',
  'Other',
  ];
  
  if (loading) return (
    <div className="savings-page">
      <p style={{ padding: '2rem', color: 'var(--text-light)' }}>Loading your goals…</p>
    </div>
  );

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
                <div className="goal-type-picker">
                  {GOAL_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`goal-type-opt ${newGoal.type === t ? 'selected' : ''}`}
                      onClick={() => setNewGoal({ ...newGoal, type: t === 'Other' ? '' : t, showTypeOther: t === 'Other' })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {newGoal.showTypeOther && (
                  <input
                    type="text"
                    placeholder="Describe your goal type…"
                    value={newGoal.type}
                    onChange={e => setNewGoal({ ...newGoal, type: e.target.value })}
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
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
              <label>CARD COLOR</label>
              <div className="color-picker">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} type="button"
                    className={`color-opt ${newGoal.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewGoal({ ...newGoal, color: c })} />
                ))}
              </div>
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

      {/* ── Main layout with sidebar calculator ── */}
      <div className="savings-main-layout">
        <div className="savings-left-col">
          {/* ── Active goals grid ── */}

        {activeGoals.length > 0 && (
          <div className="goals-grid">
            {activeGoals.map(g => (
              <GoalCard
                key={g.id}
                g={g}
                featured={false}
                addingTo={addingTo}
                setAddingTo={setAddingTo}
                onAddMoney={handleAddMoney}
                onDelete={handleDelete}
                addStatus={addStatus}
                history={history}
              />
            ))}
            <div className="total-savings-card" style={{ marginTop: '1.5rem' }}>
              <div className="ts-label">Total Intentional Savings</div>
              <div className="ts-sub">Across {goals.length} goal{goals.length !== 1 ? 's' : ''}</div>
              <div className="ts-amount">₱{fmt(totalSavings)}</div>
            </div>
          </div>
        )}

          {/* ── Momentum Panel ── */}
          <MomentumPanel goals={goals} history={history} />

          {/* ── Completed goals ── */}
          {completedGoals.length > 0 && (
            <div className="completed-goals-section">
              <div className="completed-goals-header">
                <span className="completed-goals-label">✓ Completed Goals</span>
                <span className="completed-goals-count">{completedGoals.length}</span>
              </div>
              <div className="completed-goals-list">
                {completedGoals.map(g => <CompletedChip key={g.id} g={g} onDelete={handleDelete} />)}
              </div>
            </div>
          )}

          {activeGoals.length === 0 && completedGoals.length > 0 && (
            <div className="total-savings-card" style={{ marginTop: '1.5rem' }}>
              <div className="ts-label">Total Intentional Savings</div>
              <div className="ts-sub">Across {goals.length} goal{goals.length !== 1 ? 's' : ''}</div>
              <div className="ts-amount">₱{fmt(totalSavings)}</div>
            </div>
          )}
        </div>

        {/* ── Right sidebar: Calculator & Tips ── */}
        <div className="savings-right-col">
          <SavingsCalculator goals={activeGoals} />
        </div>
      </div>
    </div>
  );
};

export default SavingsGoals;