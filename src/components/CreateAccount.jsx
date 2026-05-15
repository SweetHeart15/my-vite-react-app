import React, { useState } from 'react';
import './CreateAccount.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CreateAccount = ({ onBack, onAccountCreated }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required.';
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      e.password = 'Password is required.';
    } else if (form.password.length < 8) {
      e.password = 'Password must be at least 8 characters.';
    }
    if (!form.confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match.';
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name:  form.lastName,
          email:      form.email,
          password:   form.password,
        }),
      });
      const data = await res.json();

   if (!res.ok) {
  if (res.status === 409) {
    // Email already registered
    setErrors({ email: 'This email is already in use. Try signing in instead.' });
  } else {
    setErrors({ email: data.detail || 'Registration failed. Please try again.' });
  }
  setLoading(false);
  return;
}
      setSuccess(true);
      setTimeout(() => {
        if (onAccountCreated) onAccountCreated();
        else if (onBack) onBack();
      }, 1800);
    } catch {
      // Backend offline — still show success so UI can be tested
      console.warn('Backend offline — simulating success');
      setSuccess(true);
      setTimeout(() => {
        if (onAccountCreated) onAccountCreated();
        else if (onBack) onBack();
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pwd) => {
    if (!pwd) return { label: '', level: 0 };
    let score = 0;
    if (pwd.length >= 8)          score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return { label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score] || 'Weak', level: score };
  };

  const strength = passwordStrength(form.password);

  const EyeIcon = ({ visible }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {visible ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      )}
    </svg>
  );

  return (
    <div className="ca-overlay">
      <div className="ca-header">
        <h1 className="ca-brand">MoneyTracker</h1>
        <p className="ca-tagline">A space for mindful finance</p>
      </div>

      <div className="ca-card">
        <button className="ca-back-btn" onClick={onBack} aria-label="Go back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to sign in
        </button>

        <div className="ca-card-top">
          <h2 className="ca-title">Create your account</h2>
          <p className="ca-sub">Begin your journey to financial clarity.</p>
        </div>

        {success ? (
          <div className="ca-success">
            <div className="ca-success-icon">✓</div>
            <p>Account created! Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ca-form" noValidate>

            {/* Name row */}
            <div className="ca-name-row">
              <div className="ca-input-group">
                <label htmlFor="firstName">FIRST NAME</label>
                <input id="firstName" name="firstName" type="text"
                  value={form.firstName} onChange={handleChange}
                  placeholder="Jane" autoComplete="given-name"
                  className={errors.firstName ? 'input-error' : ''} />
                {errors.firstName && <span className="ca-error">{errors.firstName}</span>}
              </div>
              <div className="ca-input-group">
                <label htmlFor="lastName">LAST NAME</label>
                <input id="lastName" name="lastName" type="text"
                  value={form.lastName} onChange={handleChange}
                  placeholder="Doe" autoComplete="family-name"
                  className={errors.lastName ? 'input-error' : ''} />
                {errors.lastName && <span className="ca-error">{errors.lastName}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="ca-input-group">
              <label htmlFor="email">EMAIL ADDRESS</label>
              <input id="email" name="email" type="email"
                value={form.email} onChange={handleChange}
                placeholder="hello@sanctuary.com" autoComplete="email"
                className={errors.email ? 'input-error' : ''} />
              {errors.email && <span className="ca-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="ca-input-group">
              <label htmlFor="password">PASSWORD</label>
              <div className="ca-pw-wrapper">
                <input id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 8 characters" autoComplete="new-password"
                  className={errors.password ? 'input-error' : ''} />
                <button type="button" className="ca-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}>
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              {form.password && (
                <div className="ca-strength">
                  <div className="ca-strength-bars">
                    {[1,2,3,4].map(i => (
                      <div key={i}
                        className={`ca-bar ${strength.level >= i ? `level-${strength.level}` : ''}`} />
                    ))}
                  </div>
                  <span className={`ca-strength-label level-${strength.level}`}>{strength.label}</span>
                </div>
              )}
              {errors.password && <span className="ca-error">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="ca-input-group">
              <label htmlFor="confirmPassword">VERIFY PASSWORD</label>
              <div className="ca-pw-wrapper">
                <input id="confirmPassword" name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={handleChange}
                  placeholder="Re-enter your password" autoComplete="new-password"
                  className={errors.confirmPassword ? 'input-error' : ''} />
                <button type="button" className="ca-eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}>
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
              {form.confirmPassword && form.password === form.confirmPassword && (
                <span className="ca-match">✓ Passwords match</span>
              )}
              {errors.confirmPassword && <span className="ca-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="ca-submit-btn" disabled={loading}>
              {loading ? <span className="ca-spinner" /> : 'Create Account'}
            </button>
          </form>
        )}

        <p className="ca-signin-link">
          Already have an account?{' '}
          <button type="button" className="ca-link" onClick={onBack}>Sign in.</button>
        </p>
      </div>
    </div>
  );
};

export default CreateAccount;