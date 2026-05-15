import React, { useState } from 'react';
import './Login.css';
import CreateAccount from './CreateAccount';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Login = ({ onLogin }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Show the actual error from the backend (wrong email/password)
        setError(data.detail || 'Invalid email or password.');
        return;
      }

      // Only proceed if login was truly successful
      onLogin(data);

    } catch {
      // Only show a connection error — never allow guest access
      setError('Unable to connect to the server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => alert('Password reset coming soon.');

  if (showCreate) {
    return (
      <CreateAccount
        onBack={()           => setShowCreate(false)}
        onAccountCreated={() => setShowCreate(false)}
      />
    );
  }

  return (
    <div className="login-overlay">
      <div className="login-header">
        <h1 className="brand-name">Sanctuary</h1>
        <p className="brand-tagline">A space for mindful finance</p>
      </div>

      <div className="login-card">
        <div className="card-top">
          <h2 className="welcome-title">Welcome back</h2>
          <p className="welcome-sub">Continue your journey to clarity.</p>
        </div>

        <form onSubmit={handleSignIn} className="login-form">

          <div className="input-group">
            <label>EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="hello@sanctuary.com"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <div className="password-label-row">
              <label>PASSWORD</label>
            </div>
            
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <div className="remember-row">
            <label className="toggle-label">
              <div
                className={`toggle-switch ${rememberDevice ? 'active' : ''}`}
                onClick={() => setRememberDevice(!rememberDevice)}
                role="switch"
                aria-checked={rememberDevice}
              >
                <div className="toggle-thumb" />
              </div>
              <span>Remember this device</span>
            </label>
          </div>

          <button type="submit" className="sign-in-btn" disabled={loading}>
            {loading ? <span className="login-spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="create-account">
          New to Sanctuary?{' '}
          <button
            type="button"
            className="create-link"
            onClick={() => setShowCreate(true)}
          >
            Create an account.
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;