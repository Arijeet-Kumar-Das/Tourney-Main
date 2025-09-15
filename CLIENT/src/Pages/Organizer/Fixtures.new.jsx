import React, { useState, useEffect, useCallback, useMemo } from "react";
import RoundRobinFixtures from "./RoundRobinFixtures.jsx";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchEvents, fetchTeams, fetchFixtures, generateFixtures, generateKnockout, updateFixture, createFixture } from "../../lib/api.js";
import { Plus, Trash2, RotateCcw, Trophy, Users, User, Calendar, Award } from "lucide-react";
import SetScoresModal from "../../components/SetScoresModal";

const TournamentBracket = () => {
  // ---------------------------- STATE -----------------------------
  const [savingRound, setSavingRound] = useState(null);
  const [scheduleRound, setScheduleRound] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [competitionType, setCompetitionType] = useState("individual");
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [bracket, setBracket] = useState([]);
  const [fixtureMap, setFixtureMap] = useState({});
  const [winners, setWinners] = useState({});
  const [newTeamName, setNewTeamName] = useState("");
  const [newPlayer1, setNewPlayer1] = useState("");
  const [newPlayer2, setNewPlayer2] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [playerPairs, setPlayerPairs] = useState([]);

  const { tournamentId, id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tid = tournamentId || id;
  const eventId = searchParams.get("eventId");

  // Simple 24-char hex check for Mongo ObjectId
  const isValidObjectId = (val) => /^[a-f\d]{24}$/i.test(val);

  // Handle match click to show scores
  const handleMatchClick = (match) => {
    if (!match) return;
    
    setSelectedMatch({
      ...match,
      teamAName: idNameMap[match.teamA] || 'Team A',
      teamBName: idNameMap[match.teamB] || 'Team B'
    });
    setShowScoresModal(true);
  };

  // Save scores from the modal
  const handleSaveScores = async (updatedMatch) => {
    if (!selectedMatch) return;
    
    setIsSavingScores(true);
    try {
      const result = await updateFixture(selectedMatch._id, {
        sets: updatedMatch.sets,
        status: updatedMatch.status,
        winner: updatedMatch.winner,
        scoreA: updatedMatch.scoreA,
        scoreB: updatedMatch.scoreB
      });

      // Update local state
      setFixtureMap(prev => ({
        ...prev,
        [selectedMatch._id]: {
          ...prev[selectedMatch._id],
          ...result
        }
      }));
      
      setShowScoresModal(false);
    } catch (error) {
      console.error('Error saving scores:', error);
      alert('Failed to save scores. Please try again.');
    } finally {
      setIsSavingScores(false);
    }
  };

  // Render match component with scheduling and winner selection
  const renderMatch = (match, roundIndex, matchIndex) => {
    if (!match) return null;
    
    const matchId = match?._id || `round${roundIndex}_match${matchIndex}`;
    const isBye = !match?.teamA || !match?.teamB;
    const scheduledTime = match?.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : null;
    const matchStatus = match?.status || 'scheduled';
    const isCompleted = matchStatus === 'completed';
    
    // Calculate set scores if available
    const setScores = match?.sets?.length > 0 
      ? match.sets
          .filter(set => set.completed)
          .map(set => `${set.teamAScore}-${set.teamBScore}`)
          .join(', ')
      : null;

    return (
      <div 
        key={`${matchId}-${matchIndex}`}
        className={`p-3 border rounded-lg mb-4 ${
          isBye ? 'bg-gray-100' : 'bg-white hover:shadow-md cursor-pointer'
        } transition-shadow`}
        onClick={() => !isBye && handleMatchClick(match)}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium">Match {matchIndex + 1}</div>
          {scheduledTime && (
            <div className="text-xs text-gray-500">
              {scheduledTime}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div 
            className={`p-2 rounded flex justify-between items-center ${
              isCompleted && match.winner === match.teamA 
                ? 'bg-green-100 border-l-4 border-green-500' 
                : 'bg-gray-50'
            }`}
          >
            <span>{match?.teamA ? idNameMap[match.teamA] || 'TBD' : 'Bye'}</span>
            {isCompleted && (
              <span className="font-medium">
                {match.scoreA}
                {match.winner === match.teamA && (
                  <Award className="inline-block ml-1 w-4 h-4 text-yellow-500" />
                )}
              </span>
            )}
          </div>
          
          {!isBye && (
            <div className="text-center text-xs text-gray-500">
              {setScores || (isCompleted ? 'Match completed' : 'Click to enter scores')}
            </div>
          )}
          
          <div 
            className={`p-2 rounded flex justify-between items-center ${
              isCompleted && match.winner === match.teamB 
                ? 'bg-green-100 border-l-4 border-green-500' 
                : 'bg-gray-50'
            }`}
          >
            <span>{match?.teamB ? idNameMap[match.teamB] || 'TBD' : 'Bye'}</span>
            {isCompleted && (
              <span className="font-medium">
                {match.scoreB}
                {match.winner === match.teamB && (
                  <Award className="inline-block ml-1 w-4 h-4 text-yellow-500" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Rest of the component code...
  // [Previous code for other functions and effects remains the same]
  
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header and other UI components */}
        
        {/* Bracket rendering */}
        {currentEvent?.matchType?.includes("round-robin") && !hasKnockout ? (
          <RoundRobinFixtures />
        ) : currentParticipants.length >= 2 ? (
          <div className="flex gap-12 min-w-max py-4 overflow-x-auto">
            {displayedBracket.map((round, roundIndex) => (
              <div key={`round-${round.roundNumber}`} className="min-w-[300px]">
                <div className="text-center mb-6">
                  <div className="flex flex-col items-center mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-blue-600">
                        {round.roundName}
                      </h3>
                      <Calendar
                        size={18}
                        className="cursor-pointer text-gray-600 hover:text-blue-600"
                        onClick={() => handleScheduleRound(round)}
                      />
                    </div>
                    {round.matches?.[0]?.scheduledAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(round.matches[0].scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {round.matches?.map((match, matchIndex) => (
                      renderMatch(match, roundIndex, matchIndex)
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800">
              Ready to Start?
            </h3>
            <p className="text-gray-600">
              Add at least 2 {competitionType === 'individual' ? 'individuals' : 'pairs'} to generate the tournament bracket
            </p>
          </div>
        )}
      </div>
      
      {/* Schedule Round Modal */}
      {scheduleRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">
              Schedule {scheduleRound.roundName}
            </h3>
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setScheduleRound(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={savingRound === scheduleRound.roundNumber}
              >
                {savingRound === scheduleRound.roundNumber ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Set Scores Modal */}
      <SetScoresModal
        isOpen={showScoresModal}
        onClose={() => setShowScoresModal(false)}
        match={selectedMatch}
        onSave={handleSaveScores}
      />
    </div>
  );
};

export default TournamentBracket;
