import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from "@/components/Footer";
import { fetchTournamentDetails } from '@/lib/api';

const OrganizationList = () => {
  const navigate = useNavigate();
  const [otpInput, setOtpInput] = useState('');
  const [otpFeedback, setOtpFeedback] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matchedTournaments, setMatchedTournaments] = useState([]);

  // Handle OTP submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMatchedTournaments([]);
    setOtpFeedback('');
    setOtpVerified(false);
    try {
      const url = import.meta.env.VITE_BACKEND_URL
        ? `${import.meta.env.VITE_BACKEND_URL.replace(/['\s]/g, '')}/api/player/tournaments/public`
        : '/api/player/tournaments/public';
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      
      // Access the tournaments array from data.message
      const tournamentData = data.message || [];
      let tournaments = [];

      // Handle different possible response formats
      if (Array.isArray(tournamentData)) {
        tournaments = tournamentData;
      } else if (tournamentData && typeof tournamentData === 'object' && tournamentData.settings && typeof tournamentData.settings.otp !== 'undefined') {
        tournaments = [tournamentData];
      }

      // Only filter if OTP is non-empty
      let matches = [];
      if (otpInput.trim() !== "") {
        matches = tournaments.filter(t => t.settings && String(t.settings.otp) === otpInput.trim());
      }
      
      if (matches.length > 0) {
        setMatchedTournaments(matches);
        setOtpVerified(true);
        setOtpFeedback('');
      } else {
        setMatchedTournaments([]);
        setOtpVerified(false);
        setOtpFeedback('No tournaments found for this OTP.');
      }
    } catch (err) {
      console.error('Error in handleOtpSubmit:', err);
      setError('Error fetching tournaments: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };


  

  const handleOrgClick = async (orgId) => {
    if (expandedOrg === orgId) {
      setExpandedOrg(null);
      return;
    }
    setExpandedOrg(orgId);
    if (!orgTournaments[orgId]) {
      setTournamentLoading(true);
      setTournamentError(null);
      try {
        const url = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL.replace(/['\s]/g, '')}/api/player/organizations/${orgId}/tournaments` : `/api/player/organizations/${orgId}/tournaments`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
          setOrgTournaments((prev) => ({ ...prev, [orgId]: data.tournaments }));
        } else {
          setTournamentError(data.message || 'Failed to fetch tournaments');
        }
      } catch (err) {
        setTournamentError('Error fetching tournaments');
      } finally {
        setTournamentLoading(false);
      }
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col ">
        <Navigation />

        <main className="flex-1">
          {/* OTP input modal or section */}
          {!otpVerified && (
            <div className="fixed inset-0 z-50 bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-96 relative">
                <h3 className="text-xl font-bold mb-4 text-center">
                  Enter Tournament OTP
                </h3>
                <input
                  type="text"
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleOtpSubmit(e)}
                  disabled={false}
                />
                <button
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg shadow transition mb-2"
                  onClick={handleOtpSubmit}
                  disabled={loading || !otpInput}
                >
                  {loading ? 'Checking...' : 'Submit OTP'}
                </button>
                {otpFeedback && (
                  <div className="text-red-500 text-sm text-center mt-2">{otpFeedback}</div>
                )}
                {error && (
                  <div className="text-red-600 text-center mt-2">{error}</div>
                )}
              </div>
            </div>
          )}
          {/* Show tournaments if OTP verified and matches found */}
          {otpVerified && matchedTournaments.length > 0 && (
            <div className="max-w-5xl mx-auto mt-24 px-6 pb-16">
              <div className="bg-white shadow-2xl rounded-3xl p-10 sm:p-12 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-2">Tournaments</h2>
                <p className="text-gray-600 text-base sm:text-lg mb-10">
                  The following tournaments match your OTP.
                </p>
                <div className="grid grid-cols-1 gap-4 justify-center items-start">
                  {matchedTournaments.map((tournament) => (
                    <div
                    key={tournament._id}
                    className="w-full bg-gray-50 rounded-2xl shadow-md p-6 cursor-pointer hover:bg-red-500 hover:text-white transition-all duration-300 text-left text-xl font-semibold text-red-500"
                    onClick={() => navigate(`/player/tournaments/${tournament._id}/events`)}
                  >
                    {tournament.name || 'Unnamed Tournament'}
                  </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default OrganizationList;
