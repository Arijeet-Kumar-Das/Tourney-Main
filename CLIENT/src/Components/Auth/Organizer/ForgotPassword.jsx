import React, { useState } from 'react';
import '../CSS/ForgotPassword.css';
import { IoChevronBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { OrganizerContext } from '../../../Contexts/OrganizerContext/OrganizerContext';
import { useContext } from 'react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { backend_URL } = useContext(OrganizerContext);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter a valid email!');
    try {
      setIsSubmitting(true);
      const fetchOptions = {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      };
      const response = await fetch(`${backend_URL}/api/organizer/send-forgotpassword-otp`, fetchOptions);
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'OTP sent to your email!');
        setOtpSent(true);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error("Error sending OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!enteredOtp.trim()) return toast.error("Enter OTP");
    try {
      setIsSubmitting(true);
      const fetchOptions = {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOtp })
      };
      const response = await fetch(`${backend_URL}/api/organizer/verify-forgotpassword-otp`, fetchOptions);
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'OTP verified');
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 400);
      } else {
        toast.error(data.message || 'Wrong OTP, try again');
      }
    } catch (error) {
      toast.error("Error verifying OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgotpw-container">
      <div className="forgotpw-wrapper">
        <button className="forgotpw-back-button" onClick={() => navigate('/login/organizer')}>
          <IoChevronBack className="forgotpw-back-icon" />
          Back to Login
        </button>
        <div className="forgotpw-card">
          <h1 className="forgotpw-title">Forgot Password</h1>
          <form className="forgotpw-form" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
            <div className="forgotpw-form-group">
              <label className="forgotpw-label">Email</label>
              <input
                type="email"
                className="forgotpw-input"
                placeholder="Enter your email"
                value={email}
                disabled={otpSent}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            {otpSent && (
              <div className="forgotpw-form-group">
                <label className="forgotpw-label">Enter OTP</label>
                <input
                  type="text"
                  className="forgotpw-input"
                  placeholder="Enter OTP"
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value)}
                  required
                />
              </div>
            )}
            <button
              className="forgotpw-submit-btn"
              disabled={isSubmitting ||
                (!otpSent && !email.trim()) ||
                (otpSent && !enteredOtp.trim())
              }
              type="submit"
            >
              {isSubmitting ? (otpSent ? 'Verifying...' : 'Sending...') : (otpSent ? 'Verify OTP' : 'Send OTP')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
