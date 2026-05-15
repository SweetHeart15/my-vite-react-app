import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import SavingsGoals from './components/SavingsGoals';
import Profile from './components/Profile';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const App = () => {
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [currentUser, setCurrentUser]   = useState(null);
  const [currentPage, setCurrentPage]   = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);

  // ── Fetch user's transactions ──────────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetch(`${API}/transactions?user_id=${currentUser.id}`)
        .then(r => r.json())
        .then(data => setTransactions(data.map(tx => ({ ...tx, merchantName: tx.merchant_name }))))
        .catch(err => console.error('Failed to fetch transactions:', err));
    }
  }, [isLoggedIn, currentUser]);

  // ── Fetch user's savings goals (so Dashboard shows progress) ──────────────
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetch(`${API}/goals?user_id=${currentUser.id}`)
        .then(r => r.json())
        .then(setSavingsGoals)
        .catch(err => console.error('Failed to fetch goals:', err));
    }
  }, [isLoggedIn, currentUser]);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleLogin      = (user) => { setCurrentUser(user); setIsLoggedIn(true); };
  const handleUserUpdate = (updatedUser) => setCurrentUser(updatedUser);
  const handleLogout     = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setTransactions([]);
    setSavingsGoals([]);
    setCurrentPage('dashboard');
  };

  // ── Add transaction — THROWS on failure so forms can show error ────────────
  const handleAddTransaction = async (newTx) => {
    // newTx already comes fully formed from ExpenseForm/IncomeForm
    // (merchant_name, amount, date, category, user_id are all set there)
    // We just prepend it to state — the form does the fetch itself.
    setTransactions(prev => [{ ...newTx, merchantName: newTx.merchant_name }, ...prev]);
  };

  // ── Delete transaction ─────────────────────────────────────────────────────
  const handleDeleteTransaction = async (id) => {
    try {
      await fetch(`${API}/transactions/${id}`, { method: 'DELETE' });
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <main className="app-main">

        {currentPage === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            currentUser={currentUser}
            savingsGoals={savingsGoals}
          />
        )}

        {currentPage === 'transactions' && (
          <Transactions
            transactions={transactions}
            onAddTransaction={handleAddTransaction}   // ← called AFTER form saves to DB
            onDeleteTransaction={handleDeleteTransaction}
            currentUser={currentUser}                 // ← now passed correctly
          />
        )}

        {currentPage === 'savings' && (
          <SavingsGoals
            currentUser={currentUser}
            onGoalsChange={setSavingsGoals}
          />
        )}

        {currentPage === 'profile' && (
          <Profile
            currentUser={currentUser}
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
          />
        )}

      </main>
    </div>
  );
};

export default App;