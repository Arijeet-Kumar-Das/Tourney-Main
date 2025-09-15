import React, { useState } from 'react';
import '../CSS/ResetPassword.css';
import { IoChevronBack } from 'react-icons/io5';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { OrganizerContext } from '../../../Contexts/OrganizerContext/OrganizerContext';
import { useContext } from 'react';

const ResetPassword = () => {
  const { state } = useLocation();
  const email = state?.email || '';
  const navigate = useNavigate();
  const { backend_URL } = useContext(OrganizerContext);

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = e => setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Missing email in reset flow!");
    if (formData.password.length < 8) return toast.error('Password must have at least 8 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match!');
    try {
      setIsSubmitting(true);
      const fetchOptions = {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: formData.password })
      };
      const response = await fetch(`${backend_URL}/api/player/reset-password`, fetchOptions);
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Password successfully reset!');
        setTimeout(() => {
          navigate('/login/player');
        }, 800);
      } else {
        toast.error(data.message || 'Reset failed');
      }
    } catch (error) {
      toast.error("Error resetting password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="resetpw-container">
      <div className="resetpw-wrapper">
        <button className="resetpw-back-button" onClick={() => navigate(-1)}>
          <IoChevronBack className="resetpw-back-icon" />
          Back
        </button>
        <div className="resetpw-card">
          <h1 className="resetpw-title">Reset Password</h1>
          <div className="resetpw-email">Email: <span>{email}</span></div>
          <form onSubmit={handleReset} className="resetpw-form">
            <div className="resetpw-form-group">
              <label className="resetpw-label">New Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={onChange}
                className="resetpw-input"
                placeholder="Enter new password"
                required
                minLength={8}
              />
            </div>
            <div className="resetpw-form-group">
              <label className="resetpw-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={onChange}
                className="resetpw-input"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>
            <button
              className="resetpw-submit-btn"
              disabled={
                isSubmitting ||
                !formData.password.trim() ||
                !formData.confirmPassword.trim()
              }
              type="submit"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ResetPassword;
