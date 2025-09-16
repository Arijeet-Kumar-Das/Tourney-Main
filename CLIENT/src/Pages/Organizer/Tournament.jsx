import React from "react";
import "./CSS/Tournament.css";
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoTrophyOutline,
  IoTimeOutline,
  IoShareOutline,
  IoBookmarkOutline,
  IoStatsChartOutline,
} from "react-icons/io5";

import Events from "./Events";
import Teams from "./Teams";
import Notification from "./Notification";
import Payments from "./Payments";
import Settings from "./Settings";
import Fixtures from "./Fixtures";

import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useState, useEffect, useContext } from "react";

import { OrganizerContext } from "../../Contexts/OrganizerContext/OrganizerContext";

import { marked } from "marked";

const Tournament = () => {
  const {
    backend_URL,
    fetchTournamentDetails,
    updateTournamentDetails,
    tournament,
    isOrganizerLoggedIn,
  } = useContext(OrganizerContext);

  const navigate = useNavigate();

  //   useEffect(()=>{
  //   if (!isOrganizerLoggedIn) {
  //     navigate('/');
  //   }
  //  },[isOrganizerLoggedIn]);

  const [activeTab, setActiveTab] = useState("basic-info");
  // Modal editing state
  const [isEditing, setIsEditing] = useState(false);

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isEditing) {
      // store previous overflow to restore later
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isEditing]);
  const [formData, setFormData] = useState({});
  const [editFormData, setEditFormData] = useState({
    name: "",
    sport: "",
    startDate: "",
    endDate: "",
    address: "",
    mapsLink: "",
    isFeatured: false,
    description: ""
  });

  // Mock tournament data
  const tournamentData = {
    id: 1,
    name: "Summer Badminton Championship 2024",
    status: "Active",
    isPublic: true,
    isVerified: true,
    startDate: "7/15/2024",
    endDate: "7/20/2024",
    startTime: "9:00 AM",
    endTime: "4:30 PM",
    location: "Sports Complex, Mumbai",
    venue: "XFCR+W86, Kuvempu Rd, Sir M Visvesvaraya nagara 8th block",
    participants: { current: 64, max: 128 },
    totalEvents: 8,
    registeredPlayers: 64,
    completedMatches: 12,
    revenue: "₹32,000",
    description: `
      <h2>Welcome to the Summer Badminton Championship 2024</h2>
      <p>Join us for an exciting badminton tournament featuring players from across the region. This championship promises to deliver high-quality matches and competitive spirit.</p>
      
      <h3>Tournament Highlights:</h3>
      <ul>
        <li><strong>Multiple Categories:</strong> Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles</li>
        <li><strong>Professional Setup:</strong> International standard courts with professional lighting</li>
        <li><strong>Prize Pool:</strong> Total prize money of ₹50,000 across all categories</li>
        <li><strong>Live Streaming:</strong> All matches will be live streamed on our platform</li>
      </ul>
      
      <h3>Rules & Regulations:</h3>
      <p>All matches will be played according to BWF (Badminton World Federation) rules. Players must arrive 30 minutes before their scheduled match time. Proper sports attire is mandatory.</p>
      
      <h3>Registration Details:</h3>
      <p>Registration is open until July 10th, 2024. Entry fees vary by category. All participants will receive a tournament kit including t-shirt, water bottle, and certificate.</p>
    `,
    poster:
      "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/62963688f252eaaed8ae569c3847dad3_screen.jpg?ts=1626605071", // Placeholder for tournament poster
  };

  const navItems = [
    { id: 'back', label: 'Back to Tournaments'},
    { id: "basic-info", label: "Basic Info", active: true },
    { id: "events", label: "Events" },
    { id: "teams", label: "Teams" },
    { id: "notifications", label: "Notifications" },
    { id: "fixtures", label: "Fixtures" },
    // { id: "live-scoring", label: "Live Scoring" },
    { id: "payment", label: "Payment" },
    { id: "settings", label: "Settings" },
  ];

  const stats = [
    // {
    //   label: "Total Events",
    //   value: tournamentData.totalEvents,
    //   icon: <IoTrophyOutline />,
    //   color: "#4f46e5",
    // },
    // {
    //   label: "Registered Players",
    //   value: tournamentData.registeredPlayers,
    //   icon: <IoPeopleOutline />,
    //   color: "#10b981",
    // },
    // {
    //   label: "Completed Matches",
    //   value: tournamentData.completedMatches,
    //   icon: <IoStatsChartOutline />,
    //   color: "#8b5cf6",
    // },
    // {
    //   label: "Revenue",
    //   value: tournamentData.revenue,
    //   icon: <IoTrophyOutline />,
    //   color: "#f59e0b",
    // },
  ];

  const { id } = useParams();

  useEffect(() => {
    // Whenever tournament is fetched initialise form data
    if (tournament) {
      setFormData({
        name: tournament.name || "",
        type: tournament.type || "Public",
        sport: tournament.sport || "",
        startDate: tournament.startDate ? tournament.startDate.slice(0,10) : "",
        endDate: tournament.endDate ? tournament.endDate.slice(0,10) : "",
        address: tournament.address || "",
        mapsLink: tournament.mapsLink || "",
        description: tournament.description || "",
        coverImage: tournament.coverImage || "",
        isFeatured: tournament.isFeatured || false,
      });
    }
  }, [tournament]);

  useEffect(() => {
    fetchTournamentDetails(id);
  }, []);

  // Open modal and preload form
  const handleEditClick = () => {
    if (tournament) {
      setEditFormData({
        name: tournament.name || "",
        sport: tournament.sport || "",
        startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : "",
        endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : "",
        address: tournament.address || "",
        mapsLink: tournament.mapsLink || "",
        isFeatured: tournament.isFeatured || false,
        description: tournament.description || ""
      });
      setIsEditing(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save edited data
  const handleSaveClick = async () => {
    if (!tournament) return;
    
    const success = await updateTournamentDetails(tournament._id, editFormData);
    if (success) {
      // refetch fresh copy to ensure UI sync
      await fetchTournamentDetails(id);
      setIsEditing(false);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  /**
 * coverImage: "https://res.cloudinary.com/dsk16aew0/image/upload/v1751658334/caf7zt0hhcgutzwwuf9x.png"
createdAt: "2025-07-04T19:45:34.895Z"
description: "The Description is Very **Important**\n\n<u>Because It is description</u>\n\n# This is Created By ByteDocker\n\n1. Canvas is Working Properly \n• Hopefully It should Work on ~~Tournament~~ *Description*"
endDate: "2025-08-07T00:00:00.000Z"
events: []
isVerified: false
location: "Mangalore"
name: "Badminton"
organization: "68681de33959317d43433dce"
settings: {url: null, otp: '983620', seedingOptionInFixtures: false, askEmailFromPlayer: true, askMobileFromPlayer: true, …}
sport: "Badminton"
startDate: "2025-07-19T00:00:00.000Z"
status: "Upcoming"
teams: []
type: "Public"
updatedAt: "2025-07-04T19:45:34.895Z"
__v : 0
_id : "68682f5e643f91a48cb952b1"
 */

  return (
    <div className="tournament-page-container">
      {/* Header Section */}
      <div className="tournament-header-section">
        <div className="tournament-header-content">
          <div className="tournament-title-area">
            <div className="tournament-badges">
              <span className="tournament-badge tournament-badge-public">
                {" "}
                {tournament?.type}{" "}
              </span>

              {tournament?.isVerified ? (
                <span className="tournament-badge tournament-badge-verified">
                  Verified
                </span>
              ) : (
                <span className="tournament-badge tournament-badge-verified">
                  Not Verified
                </span>
              )}
              {tournament?.isFeatured? (
                <span className="tournament-badge tournament-badge-verified">
                  Featured
                </span>
              ) : (
                <span className="tournament-badge tournament-badge-verified">
                  Not Featured
                </span>
              )}
            </div>
            <h1 className="tournament-main-title">{tournament?.name}</h1>
            <div className="tournament-status-indicator">
              <span
                className={`tournament-status tournament-status-${tournament?.status.toLowerCase()}`}
              >
                {tournament?.status}
              </span>
            </div>
          </div>

          {/* <div className="tournament-action-buttons">
            <button className="tournament-action-btn tournament-edit-btn">
              Edit Tournament
            </button>
            <button className="tournament-action-btn tournament-add-event-btn">
              + Add Event
            </button>
          </div> */}
        </div>

        {/* Tournament Quick Info */}
        <div className="tournament-quick-info">
          <div className="tournament-info-item">
            <IoCalendarOutline className="tournament-info-icon" />
            <span>
              {" "}
              {new Date(tournament?.startDate).toLocaleDateString()} -{" "}
              {new Date(tournament?.endDate).toLocaleDateString()}{" "}
            </span>
          </div>
          <div className="tournament-info-item">
            <IoLocationOutline className="tournament-info-icon" />
            <span>{tournament?.address}</span>
            {tournament?.mapsLink && (
              <a href={tournament.mapsLink} target="_blank" rel="noopener noreferrer" style={{marginLeft: '8px', color: '#4f46e5'}}>
                View on Maps
              </a>
            )}
          </div>
          {/* <div className="tournament-info-item">
            <IoPeopleOutline className="tournament-info-icon" />
            <span>{tournamentData.participants.current}/{tournamentData.participants.max} participants</span>
          </div> */}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tournament-navigation">
        <div className="tournament-nav-container">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`tournament-nav-item ${
                activeTab === item.id ? "tournament-nav-active" : ""
              }`}
              onClick={() => { if(item.id==='back'){ navigate('/organizer/tournaments')}else {   setActiveTab(item.id) }}}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={handleCancelClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Tournament Details</h2>
            <div className="modal-form">
              <label>
                Name:
                <input type="text" name="name" value={editFormData.name} onChange={handleInputChange} />
              </label>
              <label>
                Sport:
                <input type="text" name="sport" value={editFormData.sport} onChange={handleInputChange} />
              </label>
              <label>
                Start Date:
                <input type="date" name="startDate" value={editFormData.startDate} onChange={handleInputChange} />
              </label>
              <label>
                End Date:
                <input type="date" name="endDate" value={editFormData.endDate} onChange={handleInputChange} />
              </label>
              <label>
                Address:
                <input type="text" name="address" value={editFormData.address} onChange={handleInputChange} />
              </label>
              <label>
                Maps Link:
                <input type="text" name="mapsLink" value={editFormData.mapsLink} onChange={handleInputChange} />
              </label>
              <label style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input type="checkbox" name="isFeatured" checked={editFormData.isFeatured} onChange={handleInputChange} />
                Featured
              </label>
              <label>
                Description:
                <textarea name="description" rows="4" value={editFormData.description} onChange={handleInputChange} />
              </label>
            </div>
            <div className="modal-actions">
              <button className="tournament-action-btn tournament-save-btn" onClick={handleSaveClick}>Save</button>
              <button className="tournament-action-btn tournament-cancel-btn" onClick={handleCancelClick}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="tournament-main-content">
        {activeTab === "basic-info" && (
          <div className="tournament-basic-info-content">
            {/* Statistics Cards */}
            <div className="tournament-stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="tournament-stat-card">
                  <div className="tournament-stat-content">
                    <div className="tournament-stat-text">
                      <span className="tournament-stat-label">
                        {stat.label}
                      </span>
                      <span className="tournament-stat-value">
                        {stat.value}
                      </span>
                    </div>
                    <div
                      className="tournament-stat-icon"
                      style={{ color: stat.color }}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <button
              className="tournament-action-btn tournament-edit-btn"
              style={{ marginBottom: '16px' }}
              onClick={handleEditClick}
            >
              Edit Details
            </button>

            {/* Tournament Details Section */}
            <div className="tournament-details-section">
              <div className="tournament-details-grid">
                {/* Tournament Information */}
                <div className="tournament-info-card">
                  <h2 className="tournament-section-title">
                    Tournament Information
                  </h2>

                  <div className="tournament-detail-item">
                    <label className="tournament-detail-label">
                      Tournament Name
                    </label>
                    <div className="tournament-detail-value">
                      {tournament?.name}
                    </div>
                  </div>

                  <div className="tournament-detail-row">
                    <div className="tournament-detail-item">
                      <label className="tournament-detail-label">
                        Start Date
                      </label>
                      <div className="tournament-detail-value">
                        <IoCalendarOutline className="tournament-detail-icon" />
                        {new Date(tournament?.startDate).toLocaleDateString()}
                        {/* {tournamentData.startTime} */}
                      </div>
                    </div>
                    <div className="tournament-detail-item">
                      <label className="tournament-detail-label">
                        End Date
                      </label>
                      <div className="tournament-detail-value">
                        <IoCalendarOutline className="tournament-detail-icon" />
                        {new Date(tournament?.endDate).toLocaleDateString()}
                        {/* {tournamentData.endTime} */}
                      </div>
                    </div>
                  </div>

                  <div className="tournament-detail-item">
                    <label className="tournament-detail-label">Venue</label>
                    <div className="tournament-detail-value">
                      <IoLocationOutline className="tournament-detail-icon" />
                      {tournament?.address}
                      {tournament?.mapsLink && (
                        <a href={tournament.mapsLink} target="_blank" rel="noopener noreferrer" style={{marginLeft: '8px', color: '#4f46e5', textDecoration: 'underline'}}>
                          View on Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tournament Poster */}
                <div className="tournament-poster-card">
                  <h3 className="tournament-section-title">
                    Tournament Poster
                  </h3>
                  <div className="tournament-poster-container">
                    <img
                      src={tournament?.coverImage}
                      alt="Tournament Poster"
                      className="tournament-poster-image"
                    />
                  </div>
                </div>
              </div>

              {/* Tournament Description */}
              <div className="tournament-description-card">
                <h2 className="tournament-section-title">
                  Tournament Description
                </h2>
                <div
                  className="tournament-description-content"
                  dangerouslySetInnerHTML={{
                    __html: marked(tournament?.description || ""),
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {/* Events Tab Content */}
        {activeTab === "events" && (
          <div className="tournament-tab-content">
            <Events />
          </div>
        )}

        {activeTab === "teams" && (
          <div className="tournament-tab-content">
            <Teams />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="tournament-tab-content">
            <Notification />
          </div>
        )}

        {activeTab === "fixtures" && (
          <div className="tournament-tab-content">
            <Fixtures />
          </div>
        )}

        {activeTab === "payment" && (
          <div className="tournament-tab-content">
            <Payments />
          </div>
        )}


        {activeTab === "settings" && (
          <div className="tournament-tab-content">
            <Settings />
          </div>
        )}

        {/* Other tabs placeholder */}
        {/* {activeTab !== 'basic-info' && activeTab !== 'events' && activeTab !== 'teams' && activeTab !== 'notifications' && activeTab !== 'payment' && activeTab !== 'live-scoring' && activeTab !== 'settings' &&(
          <div className="tournament-placeholder-content">
            <div className="tournament-placeholder-card">
              <h2 className="tournament-placeholder-title">
                {navItems.find(item => item.id === activeTab)?.label}
              </h2>
              <p className="tournament-placeholder-text">
                This section is under development. Content for {navItems.find(item => item.id === activeTab)?.label} will be available soon.
              </p>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Tournament;