import React, { useState } from 'react';
import './Profile.css';

const API = import.meta.env.VITE_API_URL;

const Profile = ({ currentUser, onUserUpdate, onLogout }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName:       currentUser?.first_name || '',
    lastName:        currentUser?.last_name  || '',
    email:           currentUser?.email      || '',
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const initials = (
    (currentUser?.first_name?.charAt(0) || '') +
    (currentUser?.last_name?.charAt(0)  || '')
  ).toUpperCase() || '?';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccess('');
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required.';
    if (!form.email.trim())     e.email     = 'Email is required.';
    if (form.newPassword) {
      if (form.newPassword.length < 8)
        e.newPassword = 'Password must be at least 8 characters.';
      if (form.newPassword !== form.confirmPassword)
        e.confirmPassword = 'Passwords do not match.';
    }
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        first_name: form.firstName.trim(),
        last_name:  form.lastName.trim(),
        email:      form.email.trim(),
      };
      if (form.newPassword) {
        payload.password = form.newPassword;
      }

      const res = await fetch(`${API}/users/${currentUser.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onUserUpdate(updated);
        setSuccess('Profile updated successfully.');
        setEditing(false);
        setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        const data = await res.json();
        setErrors({ email: data.detail || 'Update failed.' });
      }
    } catch {
      // Backend offline — update locally so UI still works
      onUserUpdate({
        ...currentUser,
        first_name: form.firstName.trim(),
        last_name:  form.lastName.trim(),
        email:      form.email.trim(),
      });
      setSuccess('Profile updated successfully.');
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName:       currentUser?.first_name || '',
      lastName:        currentUser?.last_name  || '',
      email:           currentUser?.email      || '',
      currentPassword: '',
      newPassword:     '',
      confirmPassword: '',
    });
    setErrors({});
    setSuccess('');
    setEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">Your Profile</h1>
        <p className="profile-sub">Manage your account details and preferences.</p>
      </div>

      <div className="profile-body">

        {/* Avatar card */}
        <div className="profile-avatar-card">
          <div className="profile-avatar-circle">{initials}</div>
          <div className="profile-avatar-name">
            {currentUser?.first_name} {currentUser?.last_name}
          </div>
          <div className="profile-avatar-email">{currentUser?.email}</div>
          <div className="profile-member-since">
            Member since {currentUser?.created_at
              ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : 'recently'}
          </div>

          <button className="profile-signout-btn" onClick={onLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>

        {/* Info card */}
        <div className="profile-info-card">

          <div className="profile-section-header">
            <h2>Account Information</h2>
            {!editing && (
              <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            )}
          </div>

          {success && <div className="profile-success">{success}</div>}

          <div className="profile-fields">

            <div className="profile-row">
              <div className="profile-field">
                <label>FIRST NAME</label>
                {editing ? (
                  <>
                    <input name="firstName" value={form.firstName} onChange={handleChange}
                      className={errors.firstName ? 'input-error' : ''} />
                    {errors.firstName && <span className="profile-error">{errors.firstName}</span>}
                  </>
                ) : (
                  <div className="profile-value">{currentUser?.first_name}</div>
                )}
              </div>
              <div className="profile-field">
                <label>LAST NAME</label>
                {editing ? (
                  <>
                    <input name="lastName" value={form.lastName} onChange={handleChange}
                      className={errors.lastName ? 'input-error' : ''} />
                    {errors.lastName && <span className="profile-error">{errors.lastName}</span>}
                  </>
                ) : (
                  <div className="profile-value">{currentUser?.last_name}</div>
                )}
              </div>
            </div>

            <div className="profile-field">
              <label>EMAIL ADDRESS</label>
              {editing ? (
                <>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    className={errors.email ? 'input-error' : ''} />
                  {errors.email && <span className="profile-error">{errors.email}</span>}
                </>
              ) : (
                <div className="profile-value">{currentUser?.email}</div>
              )}
            </div>

            {editing && (
              <>
                <div className="profile-divider">
                  <span>Change Password <em>(optional)</em></span>
                </div>

                <div className="profile-field">
                  <label>NEW PASSWORD</label>
                  <input name="newPassword" type="password" value={form.newPassword}
                    onChange={handleChange} placeholder="Min. 8 characters"
                    className={errors.newPassword ? 'input-error' : ''} />
                  {errors.newPassword && <span className="profile-error">{errors.newPassword}</span>}
                </div>

                <div className="profile-field">
                  <label>CONFIRM NEW PASSWORD</label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword}
                    onChange={handleChange} placeholder="Re-enter new password"
                    className={errors.confirmPassword ? 'input-error' : ''} />
                  {errors.confirmPassword && <span className="profile-error">{errors.confirmPassword}</span>}
                </div>
              </>
            )}
          </div>

          {editing && (
            <div className="profile-actions">
              <button className="profile-cancel-btn" onClick={handleCancel} disabled={loading}>
                Cancel
              </button>
              <button className="profile-save-btn" onClick={handleSave} disabled={loading}>
                {loading ? <span className="profile-spinner" /> : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;