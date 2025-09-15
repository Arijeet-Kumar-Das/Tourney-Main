import React from 'react';
import { IoClose, IoHelpCircleOutline } from 'react-icons/io5';

const EventEditModal = ({ show, onClose, eventData, onChange, onSubmit }) => {
  if (!show) return null;

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...eventData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="events-modal-overlay" onClick={onClose}>
      <div
        className="events-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="events-modal-header">
          <div className="events-modal-title-section">
            <h2 className="events-modal-title">EDIT EVENT</h2>
            <p className="events-modal-subtitle">Update event details</p>
          </div>
          <button className="events-modal-close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form onSubmit={onSubmit} className="events-modal-form">
          {/* Event Name */}
          <div className="events-form-group">
            <label className="events-form-label">
              EVENT NAME <span className="events-required">*</span>
            </label>
            <input
              type="text"
              name="eventName"
              value={eventData.eventName}
              onChange={handleInput}
              className="events-form-input"
              required
            />
          </div>

          {/* Event Type */}
          <div className="events-form-group">
            <label className="events-form-label">
              EVENT TYPE <span className="events-required">*</span>
            </label>
            <div className="events-radio-group">
              {['singles', 'doubles'].map((type) => (
                <label className="events-radio-option" key={type}>
                  <input
                    type="radio"
                    name="eventType"
                    value={type}
                    checked={eventData.eventType === type}
                    onChange={handleInput}
                    className="events-radio-input"
                  />
                  <span className="events-radio-label">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Event Type2 */}
          <div className="events-form-group">
            <label className="events-form-label">
              EVENT TYPE <span className="events-required">*</span>
            </label>
            <div className="events-radio-group">
              {['individual', 'group'].map((t) => (
                <label className="events-radio-option" key={t}>
                  <input
                    type="radio"
                    name="eventType2"
                    value={t}
                    checked={eventData.eventType2 === t}
                    onChange={handleInput}
                    className="events-radio-input"
                  />
                  <span className="events-radio-label">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Match Type */}
          <div className="events-form-group">
            <label className="events-form-label">
              MATCH TYPE <span className="events-required">*</span>
              <button type="button" className="events-help-btn" title="Fixture Calculator Helper">
                <IoHelpCircleOutline />
              </button>
            </label>
            <div className="events-radio-group">
              {['knockout', 'round-robin', 'round-robin-knockout'].map((m) => (
                <label className="events-radio-option" key={m}>
                  <input
                    type="radio"
                    name="matchType"
                    value={m}
                    checked={eventData.matchType === m}
                    onChange={handleInput}
                    className="events-radio-input"
                  />
                  <span className="events-radio-label">
                    {m.replace(/-/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Max Teams */}
          <div className="events-form-group">
            <label className="events-form-label">MAXIMUM NUMBER OF TEAMS</label>
            <input
              type="number"
              name="maxTeams"
              value={eventData.maxTeams}
              onChange={handleInput}
              className="events-form-input"
            />
          </div>

          {/* Entry Fee */}
          <div className="events-form-group">
            <label className="events-form-label">TEAM ENTRY FEE</label>
            <div className="events-fee-input-wrapper">
              <span className="events-currency-prefix">INR</span>
              <input
                type="number"
                name="entryFee"
                value={eventData.entryFee}
                onChange={handleInput}
                className="events-form-input events-fee-input"
              />
            </div>
          </div>

          {/* Allow Booking */}
          <div className="events-form-group">
            <label className="events-form-label">ALLOW BOOKING</label>
            <div className="events-toggle-wrapper">
              <label className="events-toggle">
                <input
                  type="checkbox"
                  name="allowBooking"
                  checked={eventData.allowBooking}
                  onChange={handleInput}
                  className="events-toggle-input"
                />
                <span className="events-toggle-slider" />
              </label>
              <span className="events-toggle-label">
                {eventData.allowBooking ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="events-modal-actions">
            <button type="button" className="events-modal-btn events-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="events-modal-btn events-modal-save">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEditModal;
