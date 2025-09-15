import React from 'react';
import {
  IoClose,
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoSchoolOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';

const TeamEditModal = ({ show, onClose, teamData, eventType, onChange, onSubmit }) => {
  if (!show) return null;

  const handleField = (field, value) => {
    onChange({ ...teamData, [field]: value });
  };

  const handleMemberChange = (idx, field, value) => {
    const members = [...teamData.members];
    members[idx] = { ...members[idx], [field]: value };
    onChange({ ...teamData, members });
  };

  return (
    <div className="teams-modal-overlay" onClick={onClose}>
      <div className="teams-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="teams-modal-header">
          <div className="teams-modal-title-section">
            <h2 className="teams-modal-title">EDIT {eventType === 'group' ? 'TEAM' : 'PARTICIPANT'}</h2>
          </div>
          <button className="teams-modal-close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form className="teams-modal-form" onSubmit={onSubmit}>
          {eventType === 'group' ? (
            <>
              {/* Team name */}
              <div className="teams-field-group">
                <label className="teams-field-label">TEAM NAME</label>
                <input
                  type="text"
                  value={teamData.teamName}
                  onChange={(e) => handleField('teamName', e.target.value)}
                  className="teams-field-input"
                  required
                />
              </div>

              {/* Members basic editing */}
              {(teamData.members || []).map((member, mIdx) => (
                <div className="teams-group-member-row" key={member._id || mIdx}>
                  <div className="teams-field-group">
                    <label className="teams-field-label">NAME</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleMemberChange(mIdx, 'name', e.target.value)}
                      className="teams-field-input"
                    />
                  </div>
                  <div className="teams-field-group">
                    <label className="teams-field-label">MOBILE</label>
                    <input
                      type="tel"
                      value={member.mobile}
                      onChange={(e) => handleMemberChange(mIdx, 'mobile', e.target.value)}
                      className="teams-field-input"
                    />
                  </div>
                  <div className="teams-field-group">
                    <label className="teams-field-label">FEES PAID</label>
                    <input
                      type="checkbox"
                      checked={member.feesPaid}
                      onChange={(e) => handleMemberChange(mIdx, 'feesPaid', e.target.checked)}
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Individual fields */}
              {[
                { label: 'NAME', field: 'name', icon: <IoPersonOutline /> },
                { label: 'EMAIL', field: 'email', icon: <IoMailOutline /> },
                { label: 'MOBILE', field: 'mobile', icon: <IoCallOutline /> },
                { label: 'ACADEMY NAME', field: 'academyName', icon: <IoSchoolOutline /> },
              ].map(({ label, field, icon }) => (
                <div className="teams-field-group" key={field}>
                  <label className="teams-field-label">{label}</label>
                  <input
                    type="text"
                    value={teamData[field] || ''}
                    onChange={(e) => handleField(field, e.target.value)}
                    className="teams-field-input"
                  />
                </div>
              ))}
              {/* feesPaid toggle */}
              <div className="teams-field-group">
                <label className="teams-field-label">FEES PAID</label>
                <input
                  type="checkbox"
                  checked={teamData.feesPaid}
                  onChange={(e) => handleField('feesPaid', e.target.checked)}
                />
              </div>
            </>
          )}

          <div className="teams-modal-actions">
            <button type="button" className="teams-modal-btn teams-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="teams-modal-btn teams-modal-save">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamEditModal;
