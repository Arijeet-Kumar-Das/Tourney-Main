import React, { useState, useEffect, useCallback, useMemo } from "react";
import RoundRobinFixtures from "./RoundRobinFixtures.jsx";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchEvents, fetchTeams, fetchFixtures, generateFixtures, generateFixturesWithOrder, generateKnockout, updateFixture, createFixture, deleteKnockoutFixtures } from "../../lib/api.js";
import { Plus, Trash2, RotateCcw, Trophy, Users, User, Calendar, X, Info, RefreshCw, Zap } from "lucide-react";
import SeedingModal from "./SeedingModal.jsx";

const TournamentBracket = () => {
  // ---------------------------- NEW STATE -----------------------------
  const [savingRound, setSavingRound] = useState(null);
  // ----- seeding modal state -----
  const [showSeedingModal, setShowSeedingModal] = useState(false);
  // ----- scheduling modal state -----
  const [scheduleRound, setScheduleRound] = useState(null); // round object being scheduled or null
  const [selectedDate, setSelectedDate] = useState(""); // ISO yyyy-MM-ddThh:mm for <input className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" type="datetime-local">
  
  // ----- match details modal state -----
  const [selectedMatch, setSelectedMatch] = useState(null); // Currently selected match for details modal
  const [matchConfig, setMatchConfig] = useState({
    maxSets: 3,
    pointsToWin: 30,
    isDeuce: true,
    decidingPoint: 50,
    courtNumber: 1
  });
  // ---- global config modal ----
  const [isGlobalConfigOpen, setIsGlobalConfigOpen] = useState(false);
  const [globalConfig, setGlobalConfig] = useState({
    maxSets: 3,
    pointsToWin: 30,
    isDeuce: true,
    decidingPoint: 50,
    courtNumber: 1
  });
  const [updatingMatch, setUpdatingMatch] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  // ---------------------------- STATE -----------------------------
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

  // Handle opening match details modal - UPDATED to load config from database
  const handleMatchClick = (match) => {
    console.log('Opening match details for:', match);
    console.log('Current fixtureMap:', fixtureMap);
    
    // Try multiple ways to find the fixture
    const matchId = `round${match.round}_match${match.matchIndex}`;
    let fixture = fixtureMap[matchId];
    
    if (!fixture) {
      // Try to find by _id
      const fixtureId = match._id || match.id || match.fixtureId || match.matchId;
      fixture = Object.values(fixtureMap).find(f => 
        f._id === fixtureId || 
        f._id === match._id ||
        `round${f.round}_match${f.matchIndex}` === match.id ||
        `round${f.round}_match${f.matchIndex}` === matchId
      );
    }
    
    console.log('Found fixture:', fixture);
    
    if (fixture) {
      setSelectedMatch({
        ...match,
        fixture: fixture,
        sets: fixture.sets || []
      });

      setIsScheduled(fixture.isScheduled !== undefined ? fixture.isScheduled : false);
      
      // Load match config from fixture database values
      setMatchConfig({
        maxSets: fixture.maxSets || 3,
        pointsToWin: fixture.pointsToWin || 30,
        isDeuce: fixture.isDeuce !== undefined ? fixture.isDeuce : true,
        decidingPoint: fixture.decidingPoint || 50,
        courtNumber: fixture.courtNumber || 1
      });
      
      // Set scheduled date if available
      if (fixture.scheduledAt) {
        setSelectedDate(new Date(fixture.scheduledAt).toISOString().slice(0, 16));
      } else {
        setSelectedDate('');
      }
      
      console.log('Loaded match config from database:', {
        maxSets: fixture.maxSets || 3,
        pointsToWin: fixture.pointsToWin || 30,
        isDeuce: fixture.isDeuce !== undefined ? fixture.isDeuce : true,
        decidingPoint: fixture.decidingPoint || 50,
        courtNumber: fixture.courtNumber || 1
      });
    } else {
      // Create a mock fixture for client-side generated matches
      const mockFixture = {
        id: match.id,
        round: match.round,
        matchIndex: match.matchIndex,
        teamA: nameIdMap[match.participant1] || match.participant1,
        teamB: nameIdMap[match.participant2] || match.participant2,
        sets: [],
        maxSets: 3,
        pointsToWin: 30,
        isDeuce: true,
        decidingPoint: 50,
        courtNumber: 1,
        status: 'scheduled'
      };
      
      setSelectedMatch({
        ...match,
        fixture: mockFixture,
        sets: []
      });
      
      setMatchConfig({
        maxSets: 3,
        pointsToWin: 30,
        isDeuce: true,
        decidingPoint: 50,
        courtNumber: 1
      });
      
      setIsScheduled(false);
      setSelectedDate('');
      console.log('No fixture found for match, using mock fixture:', match);
    }
  };

  // UPDATED: Handle maxSets changes dynamically
  const handleMaxSetsChange = (newMaxSets) => {
    const maxSetsNumber = parseInt(newMaxSets);
    if (maxSetsNumber < 1 || maxSetsNumber > 15) {
      alert('Number of sets must be between 1 and 15');
      return;
    }
    
    setMatchConfig(prev => ({ ...prev, maxSets: maxSetsNumber }));
    
    // Update sets array to match new maxSets
    if (selectedMatch) {
      const currentSets = [...selectedMatch.sets];
      
      // Add new empty sets if maxSets increased
      while (currentSets.length < maxSetsNumber) {
        currentSets.push({
          setNumber: currentSets.length + 1,
          teamAScore: 0,
          teamBScore: 0,
          completed: false,
          winner: null
        });
      }
      
      // Remove extra sets if maxSets decreased
      if (currentSets.length > maxSetsNumber) {
        currentSets.splice(maxSetsNumber);
      }
      
      setSelectedMatch(prev => ({
        ...prev,
        sets: currentSets
      }));
    }
  };

  // Update set score - IMPROVED VERSION
  const updateSetScore = async (setIndex, team, newScore) => {
    if (!selectedMatch || updatingMatch) return;
    
    // Check if this is a mock fixture (no real backend fixture)
    const isMockFixture = !selectedMatch.fixture._id || !isValidObjectId(selectedMatch.fixture._id);
    
    setUpdatingMatch(true);
    try {
      const updatedSets = [...selectedMatch.sets];
      
      // Ensure we have enough sets in the array up to the current maxSets
      while (updatedSets.length < matchConfig.maxSets) {
        updatedSets.push({
          setNumber: updatedSets.length + 1,
          teamAScore: 0,
          teamBScore: 0,
          completed: false,
          winner: null
        });
      }
      
      // Remove extra sets if maxSets was reduced
      if (updatedSets.length > matchConfig.maxSets) {
        updatedSets.splice(matchConfig.maxSets);
      }
      
      // Ensure set exists at the specific index
      if (!updatedSets[setIndex]) {
        updatedSets[setIndex] = {
          setNumber: setIndex + 1,
          teamAScore: 0,
          teamBScore: 0,
          completed: false,
          winner: null
        };
      }
      
      // Update score
      if (team === 'teamA') {
        updatedSets[setIndex].teamAScore = Math.max(0, newScore);
      } else {
        updatedSets[setIndex].teamBScore = Math.max(0, newScore);
      }
      
      // Check if set is completed
      const setData = updatedSets[setIndex];
      const { teamAScore, teamBScore } = setData;
      const pointsToWin = matchConfig.pointsToWin;
      const decidingPoint = matchConfig.decidingPoint;
      
      if (matchConfig.isDeuce && decidingPoint && teamAScore === decidingPoint) {
        setData.completed = true;
        setData.winner = 'teamA';
      } else if (matchConfig.isDeuce && decidingPoint && teamBScore === decidingPoint) {
        setData.completed = true;
        setData.winner = 'teamB';
      } else if (teamAScore >= pointsToWin && teamAScore - teamBScore >= 2) {
        setData.completed = true;
        setData.winner = 'teamA';
      } else if (teamBScore >= pointsToWin && teamBScore - teamAScore >= 2) {
        setData.completed = true;
        setData.winner = 'teamB';
      } else {
        setData.completed = false;
        setData.winner = null;
      }
      
      // Calculate overall match winner
      const completedSets = updatedSets.filter(s => s.completed);
      const teamAWins = completedSets.filter(s => s.winner === 'teamA').length;
      const teamBWins = completedSets.filter(s => s.winner === 'teamB').length;
      const setsNeededToWin = Math.ceil(matchConfig.maxSets / 2);
      
      let matchWinner = null;
      let matchStatus = 'ongoing';
      
      if (teamAWins >= setsNeededToWin) {
        matchWinner = selectedMatch.fixture.teamA;
        matchStatus = 'completed';
      } else if (teamBWins >= setsNeededToWin) {
        matchWinner = selectedMatch.fixture.teamB;
        matchStatus = 'completed';
      }
      
      // Update fixture in backend
      const updateData = {
        sets: updatedSets,
        maxSets: matchConfig.maxSets,
        pointsToWin: matchConfig.pointsToWin,
        isDeuce: matchConfig.isDeuce,
        decidingPoint: matchConfig.decidingPoint,
        courtNumber: matchConfig.courtNumber,
        status: matchStatus
      };
      
      if (matchWinner) {
        updateData.winner = matchWinner;
      }
      
      // Only update backend if this is a real fixture, not a mock one
      if (!isMockFixture) {
        console.log('Updating fixture in database:', selectedMatch.fixture._id, updateData);
        const updatedFixture = await updateFixture(selectedMatch.fixture._id, updateData);
        console.log('Database update result:', updatedFixture);
      } else {
        // For mock fixtures, create a real fixture in database
        try {
          const createData = {
            tournamentId: tid,
            eventId,
            round: selectedMatch.fixture.round,
            matchIndex: selectedMatch.fixture.matchIndex,
            teamA: selectedMatch.fixture.teamA,
            teamB: selectedMatch.fixture.teamB,
            ...updateData
          };
          
          const newFixture = await createFixture(createData);
          
          // Update the selected match with the real fixture ID
          setSelectedMatch(prev => ({
            ...prev,
            fixture: {
              ...prev.fixture,
              _id: newFixture._id
            }
          }));
        } catch (error) {
          console.error('Failed to create fixture:', error);
        }
      }
      
      // Update local state
      setSelectedMatch(prev => ({
        ...prev,
        sets: updatedSets,
        fixture: {
          ...prev.fixture,
          sets: updatedSets,
          winner: matchWinner,
          status: matchStatus
        }
      }));
      
      // Update fixture map
      setFixtureMap(prev => {
        const matchId = `round${selectedMatch.fixture.round}_match${selectedMatch.fixture.matchIndex}`;
        return {
          ...prev,
          [matchId]: {
            ...prev[matchId],
            sets: updatedSets,
            winner: matchWinner,
            status: matchStatus
          }
        };
      });
      
      // Update winners if match is completed
      if (matchWinner) {
        let winnerName;
        
        // Extract winner name properly
        winnerName = idNameMap[matchWinner.toString()] || matchWinner;
        
        if (winnerName) {
          const matchId = `round${selectedMatch.fixture.round}_match${selectedMatch.fixture.matchIndex}`;
          setWinners(prev => ({
            ...prev,
            [matchId]: winnerName
          }));
          
          // Propagate winner to next round
          updateNextRound(selectedMatch, winnerName);
        }
      }
      
    } catch (error) {
      console.error('Failed to update set score:', error);
      alert('Failed to update score: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdatingMatch(false);
    }
  };

  // Save match configuration - UPDATED to save all config fields
  const saveMatchConfig = async () => {
    if (!selectedMatch || updatingMatch) return;
    
    // Check if this is a mock fixture
    const isMockFixture = !selectedMatch.fixture._id || !isValidObjectId(selectedMatch.fixture._id);
    
    setUpdatingMatch(true);
    try {
      const updateData = {
        maxSets: matchConfig.maxSets,
        pointsToWin: matchConfig.pointsToWin,
        isDeuce: matchConfig.isDeuce,
        decidingPoint: matchConfig.decidingPoint,
        courtNumber: matchConfig.courtNumber,
        isScheduled: isScheduled,
        sets: selectedMatch.sets || [] // Preserve existing sets
      };
      
      if (selectedDate) {
        updateData.scheduledAt = new Date(selectedDate).toISOString();
      }
      
      let updatedFixture;
      let realFixtureId;
      
      if (isMockFixture) {
        // Create new fixture in database
        const createData = {
          tournamentId: tid,
          eventId,
          round: selectedMatch.fixture.round,
          matchIndex: selectedMatch.fixture.matchIndex,
          teamA: selectedMatch.fixture.teamA,
          teamB: selectedMatch.fixture.teamB,
          ...updateData
        };
        
        updatedFixture = await createFixture(createData);
        realFixtureId = updatedFixture._id;
        
        // Update selected match with real fixture ID
        setSelectedMatch(prev => ({
          ...prev,
          fixture: {
            ...prev.fixture,
            _id: realFixtureId,
            ...updateData
          }
        }));
      } else {
        // Update existing fixture
        updatedFixture = await updateFixture(selectedMatch.fixture._id, updateData);
        realFixtureId = selectedMatch.fixture._id;
      }
      
      // Update fixture map with the saved configuration
      setFixtureMap(prev => {
        const matchId = `round${selectedMatch.fixture.round}_match${selectedMatch.fixture.matchIndex}`;
        return {
          ...prev,
          [matchId]: {
            ...(prev[matchId] || {}),
            ...updatedFixture,
            _id: realFixtureId
          }
        };
      });
      
      alert('Match configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save match config:', error);
      alert('Failed to save configuration: ' + error.message);
    } finally {
      setUpdatingMatch(false);
    }
  };

  // Save chosen date/time for the opened modal round
  const saveSchedule = async () => {
    if (!scheduleRound || !selectedDate) {
      setScheduleRound(null);
      return;
    }
    setSavingRound(scheduleRound.roundNumber);
    
    try {
      // Process all matches - update existing or create new fixtures
      const results = await Promise.all(
        scheduleRound.matches.map(async (match, index) => {
          const fid = match._id || match.id || match.fixtureId || match.matchId;
          
          // If valid MongoDB ID, update existing fixture
          if (fid && /^[a-f\d]{24}$/i.test(fid)) {
            return updateFixture(fid, { scheduledAt: selectedDate });
          }
          
          // Otherwise create a new fixture
          return createFixture({
            tournamentId: tid,
            eventId,
            roundNumber: scheduleRound.roundNumber,
            matchNumber: index + 1,
            scheduledAt: selectedDate,
            teamA: match.teamA?._id || match.teamA,
            teamB: match.teamB?._id || match.teamB,
            // Copy other relevant match properties
            ...match
          });
        })
      );

      // Update local state with the saved fixtures
      setFixtureMap(prev => {
        const next = { ...prev };
        results.forEach(fixture => {
          if (fixture && fixture._id) {
            next[fixture._id] = fixture;
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Failed to schedule round", err);
      alert(err.message || "Failed to save schedule");
    } finally {
      setSavingRound(null);
      setScheduleRound(null);
    }
  };

  // NEW: Reset Fixtures function
  // ---------------- GLOBAL CONFIG SAVE ----------------
  const saveGlobalConfig = async () => {
    if (updatingMatch) return;
    setUpdatingMatch(true);
    try {
      const allMatches = bracket.flatMap(r => r.matches);
      const results = await Promise.all(allMatches.map(async (m) => {
        const matchId = `round${m.round}_match${m.matchIndex}`;
        const existing = fixtureMap[matchId];
        const payload = {
          maxSets: globalConfig.maxSets,
          pointsToWin: globalConfig.pointsToWin,
          isDeuce: globalConfig.isDeuce,
          decidingPoint: globalConfig.decidingPoint,
          courtNumber: globalConfig.courtNumber,
        };
        if (existing && existing._id) {
          // update
          await updateFixture(existing._id, payload);
          return { matchId, fixture: { ...existing, ...payload } };
        }
        // create new
        const teamAId = nameIdMap[m.participant1] || m.participant1;
        const teamBId = nameIdMap[m.participant2] || m.participant2;
        const created = await createFixture({
          tournamentId: tid,
          eventId,
          round: m.round,
          matchIndex: m.matchIndex,
          teamA: teamAId,
          teamB: teamBId,
          ...payload,
        });
        return { matchId, fixture: created };
      }));

      // merge results into fixtureMap
      setFixtureMap(prev => {
        const next = { ...prev };
        results.forEach(({ matchId, fixture }) => {
          next[matchId] = fixture;
          if (fixture._id) next[fixture._id] = fixture; // for lookup
        });
        return next;
      });
      alert("Configuration applied to all rounds!");
      setIsGlobalConfigOpen(false);
    } catch (err) {
      console.error("Failed to save global config", err);
      alert(err.message || "Failed to save configuration");
    } finally {
      setUpdatingMatch(false);
    }
  };

  // Delete Fixtures without auto-reload so user can manually generate again
  const handleDeleteFixtures = async () => {
    if (!window.confirm('Are you sure you want to delete all fixtures?')) return;
    try {
      await deleteKnockoutFixtures(tid, eventId);
      // Clear local state so UI reflects deletion
      setWinners({});
      setBracket([]);
      setFixtureMap({});
      // Inform other components if needed
      window.dispatchEvent(
        new CustomEvent('fixturesDeleted', {
          detail: { tournamentId: tid, eventId },
        })
      );
      alert('Fixtures deleted successfully! You can now click Generate to create new fixtures.');
    } catch (err) {
      console.error('Failed to delete fixtures', err);
      alert(err.message || 'Failed to delete fixtures');
    }
  };

  const handleResetFixtures = async () => {
    if (!window.confirm('Are you sure you want to reset all fixtures? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Call backend to delete knockout fixtures
      await deleteKnockoutFixtures(tid, eventId);
      
      // Clear local state
      setWinners({});
      setBracket([]);
      setFixtureMap({});
      
      // Trigger refresh event
      window.dispatchEvent(
        new CustomEvent('fixturesReset', {
          detail: { tournamentId: tid, eventId },
        })
      );
      
      // Force reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      alert('Fixtures reset successfully!');
    } catch (error) {
      console.error('Failed to reset fixtures:', error);
      alert('Failed to reset fixtures: ' + (error.message || 'Unknown error'));
    }
  };

  // NEW: Refresh Page function
  const handleRefreshPage = () => {
    window.location.reload();
  };

  // NEW: Auto-advance function for bye matches
  const handleAutoAdvance = async () => {
    if (!selectedMatch?.fixture) return;
    
    try {
      setUpdatingMatch(true);
      
      // Determine which team to advance
      const advancingTeam = selectedMatch.fixture.teamA || selectedMatch.fixture.teamB;
      const advancingTeamId = advancingTeam._id || advancingTeam;
      
      if (!advancingTeamId) {
        alert('No team found to advance');
        return;
      }
      
      // Update fixture as completed with winner
      const updateData = {
        status: 'completed',
        winner: advancingTeamId,
        sets: [{
          setNumber: 1,
          teamAScore: selectedMatch.fixture.teamA ? 1 : 0,
          teamBScore: selectedMatch.fixture.teamB ? 1 : 0,
          completed: true,
          winner: selectedMatch.fixture.teamA ? 'teamA' : 'teamB'
        }]
      };
      
      await updateFixture(selectedMatch.fixture._id, updateData);
      
      // Update local state
      const winnerName = idNameMap[advancingTeamId.toString()];
      if (winnerName) {
        const matchId = `round${selectedMatch.fixture.round}_match${selectedMatch.fixture.matchIndex}`;
        setWinners(prev => ({
          ...prev,
          [matchId]: winnerName
        }));
        
        // Propagate winner to next round
        updateNextRound(selectedMatch, winnerName);
      }
      
      // Close modal and reload fixtures
      setSelectedMatch(null);
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to auto-advance:', error);
      alert('Failed to auto-advance: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdatingMatch(false);
    }
  };

  // Maps for quick id<->name lookup
  const idNameMap = useMemo(() => {
    if (!participants.length) return {};
    const map = {};
    
    participants.forEach((p) => {
      const id = p._id.toString();
      let displayName;
      
      if (competitionType === "pairs") {
        // For pairs, use the constructed display name
        if (Array.isArray(p.members) && p.members.length) {
          const p1 = p.members[0]?.name || "";
          const p2 = p.members[1]?.name || null;
          displayName = p2 ? `${p1.trim()} & ${p2.trim()}` : `${p1.trim()} (Solo)`;
        } else {
          const originalName = p.name || p.teamName || "";
          if (originalName.includes(" & ")) {
            const [p1, p2] = originalName.split(" & ");
            displayName = `${p1.trim()} & ${p2.trim()}`;
          } else {
            displayName = originalName;
          }
        }
      } else {
        // For individual, use original name
        displayName = p.teamName || p.name;
      }
      
      if (displayName) {
        map[id] = displayName;
      }
    });
    
    return map;
  }, [participants, competitionType]);

  const nameIdMap = useMemo(() => {
    if (!participants.length) return {};
    const map = {};
    
    participants.forEach((p) => {
      const id = p._id.toString();
      
      // Add both name and teamName mappings
      if (p.name) {
        map[p.name] = id;
      }
      if (p.teamName && p.teamName !== p.name) {
        map[p.teamName] = id;
      }
      
      // Add display name mapping for multi-member teams
      if (Array.isArray(p.members) && p.members.length) {
        const p1 = p.members[0]?.name || "";
        const p2 = p.members[1]?.name || null;
        if (p1) {
          const displayName = p2 ? `${p1.trim()} & ${p2.trim()}` : `${p1.trim()} (Solo)`;
          // Only add if different from existing mappings
          if (!map[displayName]) {
            map[displayName] = id;
          }
        }
      } else {
        // Handle cases where team name contains " & " pattern
        const display = p.name || p.teamName || "";
        if (display.includes(" & ")) {
          const [p1, p2] = display.split(" & ");
          const displayName = `${p1.trim()} & ${p2.trim()}`;
          // Only add if different from existing mappings
          if (!map[displayName]) {
            map[displayName] = id;
          }
        }
      }
    });
    
    return map;
  }, [participants]);

  // Fetch all events for dropdown
  useEffect(() => {
    if (!tid || !isValidObjectId(tid)) return;
    (async () => {
      try {
        const evs = await fetchEvents(tid);
        setEvents(evs);
        const found = evs.find((e) => e._id === (eventId || ""));
        setCurrentEvent(found || null);
        if (!eventId && evs.length) {
          const firstId = evs[0]._id;
          setSearchParams(
            (prev) => {
              const np = new URLSearchParams(prev);
              np.set("eventId", firstId);
              return np;
            },
            { replace: true }
          );
        }
      } catch (err) {
        console.error("Failed to load events", err);
      }
    })();
    // eslint-disable-next-line
  }, [tid]);

  // --------------------- ROUND DATE SCHEDULING ---------------------
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return "";
    }
  };

  // Open modal to schedule round date/time
  const handleScheduleRound = (round) => {
    if (!round?.matches?.length) return;
    // Prefill with existing scheduledAt if any
    const firstFixtureId = round.matches[0]?.id;
    const existing = fixtureMap[firstFixtureId]?.scheduledAt;
    setSelectedDate(existing ? new Date(existing).toISOString().slice(0, 16) : "");
    setScheduleRound(round);
  };

  // Trigger backend bracket generation explicitly
  // Manual generate via seeding modal
  const handleConfirmSeeding = async (order) => {
    try {
      await generateFixturesWithOrder(tid, eventId, order);
      window.location.reload();
    } catch (err) {
      console.error("Failed to generate fixtures", err);
      alert(err.message || "Failed to generate fixtures");
    }
  };

  const handleGenerateFixtures = () => {
    setShowSeedingModal(true);
  };

  // Fetch teams
  useEffect(() => {
    if (!tid || !isValidObjectId(tid)) return;
    (async () => {
      try {
        const t = await fetchTeams(tid, eventId);
        setParticipants(t);
        setTeams(t.map((x) => x.teamName || x.name));

        // Derive player pairs from participant display names
        const derivedPairs = t.map((x) => {
          if (Array.isArray(x.members) && x.members.length) {
            const p1 = x.members[0]?.name || "";
            const p2 = x.members[1]?.name || null;
            return { player1: p1.trim(), player2: p2 ? p2.trim() : null };
          }
          const display = x.name || x.teamName || "";
          if (display.includes(" & ")) {
            const [p1, p2] = display.split(" & ");
            return { player1: p1.trim(), player2: p2.trim() };
          }
          const soloName = display.replace(" (Solo)", "").trim();
          return { player1: soloName, player2: null };
        });
        setPlayerPairs(derivedPairs);
      } catch (err) {
        console.error("Failed to load teams", err);
        setLoadError(true);
      }
    })();
  }, [tid, eventId]);

  // Fetch fixtures and build bracket structure
  useEffect(() => {
    if (!tid || !isValidObjectId(tid) || participants.length === 0) return;
    (async () => {
      try {
        let fixtures = await fetchFixtures(tid, eventId);
        
        // If KO fixtures have been created, focus the bracket on them; otherwise keep the RR fixtures intact
        if (currentEvent?.matchType?.includes("knockout")) {
          const koOnly = fixtures.filter(
            (fx) => fx.phase === "ko" || fx.phase === "knockout"
          );
          if (koOnly.length > 0) fixtures = koOnly; // switch view only when KO fixtures actually exist
        }
        
        // If no fixtures exist, generate client-side bracket for display
        if (!Array.isArray(fixtures) || !fixtures.length) {
          setBracket(generateBracket(currentParticipants));
          setFixtureMap({});
          setWinners({});
          return;
        }
        
        // If we have some fixtures but not a complete bracket, merge with generated bracket
        const generatedBracket = generateBracket(currentParticipants);
        const hasCompleteFixtures = fixtures.length >= generatedBracket.reduce((total, round) => total + round.matches.length, 0);
        const map = {};
        const roundsObj = {};
        const initialWinners = {};

        fixtures.forEach((fx) => {
          const matchId = `round${fx.round}_match${fx.matchIndex}`;
          
          // Store fixture with both matchId and _id as keys for better lookup
          const fixtureData = {
            ...fx,
            // Ensure sets data is preserved
            sets: fx.sets || [],
            maxSets: fx.maxSets || 3,
            pointsToWin: fx.pointsToWin || 30,
            isDeuce: fx.isDeuce !== undefined ? fx.isDeuce : true,
            decidingPoint: fx.decidingPoint || 50,
            courtNumber: fx.courtNumber || 1,
            isScheduled: fx.isScheduled !== undefined ? fx.isScheduled : true
          };
          
          map[matchId] = fixtureData;
          // Also store by _id for easier lookup
          if (fx._id) {
            map[fx._id] = fixtureData;
          }
          
          const getName = (teamField) => {
            if (!teamField) return null;
            if (typeof teamField === "string")
              return idNameMap[teamField] || null;
            if (typeof teamField === "object") {
              if (teamField.name) return teamField.name;
              if (teamField.teamName) return teamField.teamName;
              if (teamField._id)
                return idNameMap[teamField._id.toString()] || null;
              if (teamField.$oid)
                return idNameMap[teamField.$oid.toString()] || null;
            }
            try {
              const strId = teamField.toString();
              if (idNameMap[strId]) return idNameMap[strId];
            } catch {}
            return null;
          };
          
          const p1 = getName(fx.teamA);
          const p2 = getName(fx.teamB);
          if (!roundsObj[fx.round]) roundsObj[fx.round] = [];
          roundsObj[fx.round].push({
            id: matchId,
            participant1: p1,
            participant2: p2,
            round: fx.round,
            matchIndex: fx.matchIndex,
            _id: fx._id, // Preserve the actual fixture ID
            fixtureId: fx._id, // Additional reference
            matchId: matchId // Additional reference
          });
          if (fx.winner) {
            const wName = idNameMap[fx.winner.toString()] || null;
            if (wName) initialWinners[matchId] = wName;
          }
        });

        const totalRounds = Object.keys(roundsObj).length;
        const arr = Object.keys(roundsObj)
          .sort((a, b) => a - b)
          .map((roundNum) => ({
            roundNumber: Number(roundNum),
            roundName: getRoundName(Number(roundNum), totalRounds),
            matches: roundsObj[roundNum].sort(
              (a, b) => a.matchIndex - b.matchIndex
            ),
          }));

        // -------------------------------------------------------------
        // Propagate winners that already exist in earlier rounds so
        // that subsequent rounds (e.g. the Final) show correct
        // participants right after the page loads (without the user
        // needing to refresh or click anything).
        // -------------------------------------------------------------
        const propagateInitialWinners = (roundsArr, winnersObj) => {
          roundsArr.forEach((rd) => {
            rd.matches.forEach((m) => {
              const win = winnersObj[m.id];
              if (!win) return;
              const nextRoundIdx = m.round + 1;
              if (!roundsArr[nextRoundIdx]) return; // last round
              const nextMatchIdx = Math.floor(m.matchIndex / 2);
              const isFirst = m.matchIndex % 2 === 0;
              const nextMatch =
                roundsArr[nextRoundIdx].matches[nextMatchIdx];
              if (!nextMatch) return;
              if (isFirst) nextMatch.participant1 = win;
              else nextMatch.participant2 = win;
            });
          });
        };
        propagateInitialWinners(arr, initialWinners);
        
        // If we don't have complete fixtures, merge with generated bracket
        if (!hasCompleteFixtures) {
          const mergedBracket = generatedBracket.map(round => {
            const roundMatches = round.matches.map(match => {
              const existingMatch = arr.find(r => r.roundNumber === round.roundNumber)?.matches
                .find(m => m.matchIndex === match.matchIndex);
              return existingMatch || match;
            });
            return {
              ...round,
              matches: roundMatches
            };
          });
          setBracket(mergedBracket);
        } else {
          setBracket(arr);
        }
        
        setFixtureMap(map);
        setWinners((prev) => ({ ...prev, ...initialWinners }));
      } catch (err) {
        console.error("Failed to load fixtures", err);
      }
    })();
  }, [tid, participants, eventId, competitionType, idNameMap]);

  // Helpers
  const getRoundName = (roundNum, totalRounds) => {
    const roundsFromEnd = totalRounds - 1 - roundNum;
    if (roundsFromEnd === 0) return "Final";
    if (roundsFromEnd === 1) return "Semi-Final";
    if (roundsFromEnd === 2) return "Quarter-Final";
    if (roundsFromEnd === 3) return "Round of 16";
    return `Round ${roundNum + 1}`;
  };

  // Generate bracket client-side if backend fixtures missing
  const generateBracket = useCallback((participants) => {
    if (participants.length < 2) return [];
    const nextPower = Math.pow(2, Math.ceil(Math.log2(participants.length)));
    const padded = [...participants];
    while (padded.length < nextPower) padded.push(null);
    const rounds = [];
    let current = padded;
    let roundNum = 0;
    while (current.length > 1) {
      const matches = [];
      for (let i = 0; i < current.length; i += 2) {
        matches.push({
          id: `round${roundNum}_match${i / 2}`,
          participant1: current[i],
          participant2: current[i + 1],
          round: roundNum,
          matchIndex: i / 2,
        });
      }
      rounds.push({
        roundNumber: roundNum,
        roundName: getRoundName(roundNum, Math.log2(nextPower)),
        matches,
      });
      current = new Array(current.length / 2).fill(null);
      roundNum += 1;
    }
    return rounds;
  }, []);

  // Detect if knockout fixtures already generated (for hybrid events)
  const hasKnockout = useMemo(() => {
    return Object.values(fixtureMap).some((fx) => fx?.phase === "ko");
  }, [fixtureMap]);

  // current participants: memoized
  const currentParticipants = useMemo(() => {
    return competitionType === "individual"
      ? teams
      : playerPairs.map((p) =>
          p.player2 ? `${p.player1} & ${p.player2}` : `${p.player1} (Solo)`
        );
  }, [competitionType, teams, playerPairs]);

  // Generate bracket locally when fixtureMap empty
  useEffect(() => {
    if (Object.keys(fixtureMap).length) return;
    setBracket(generateBracket(currentParticipants));
    setWinners({});
  }, [currentParticipants, generateBracket, fixtureMap]);

  // ------- Winner selection & persistence --------
  const selectWinner = useCallback(
    async (matchId, winnerName, match) => {
      const newWinners = { ...winners };
      if (newWinners[matchId] === winnerName) {
        delete newWinners[matchId];
        clearSubsequentWinners(match, newWinners);
      } else {
        if (newWinners[matchId]) clearSubsequentWinners(match, newWinners);
        newWinners[matchId] = winnerName;
      }
      
      setWinners(newWinners);
      updateNextRound(match, newWinners[matchId] || null);

      // Persist to backend
      try {
        const fx = fixtureMap[matchId];
        if (fx) {
          const winnerId = nameIdMap[winnerName];
          if (winnerId) {
            await updateFixture(fx._id, {
              winner: winnerId,
              status: "completed",
            });
          }
        }
      } catch (err) {
        console.error("Failed to update fixture", err);
      }
    },
    [winners, fixtureMap, nameIdMap]
  );

  const clearSubsequentWinners = (match, winnersObj) => {
    const { round, matchIndex } = match;
    for (let r = round + 1; r < bracket.length; r++) {
      const nextMatchId = `round${r}_match${Math.floor(
        matchIndex / Math.pow(2, r - round)
      )}`;
      if (winnersObj[nextMatchId]) {
        delete winnersObj[nextMatchId];
        const nextMatch = bracket[r]?.matches.find((m) => m.id === nextMatchId);
        if (nextMatch) clearSubsequentWinners(nextMatch, winnersObj);
      }
    }
  };

  // ------------------- winner propagation helpers ------------------
  const applyWinnersToBracket = useCallback(
    (brk, winObj) => {
      const next = brk.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m })) }));
      next.forEach((round) => {
        round.matches.forEach((m) => {
          const win = winObj[m.id];
          if (!win) return;
          const nextRoundIdx = m.round + 1;
          if (!next[nextRoundIdx]) return;
          const nextMatchIdx = Math.floor(m.matchIndex / 2);
          const isFirst = m.matchIndex % 2 === 0;
          const nextMatch = next[nextRoundIdx].matches[nextMatchIdx];
          if (!nextMatch) return;
          if (isFirst) nextMatch.participant1 = win;
          else nextMatch.participant2 = win;
        });
      });
      return next;
    },
    []
  );

  // When winners change (e.g., scores edited elsewhere and fetched on reload)
  useEffect(() => {
    if (!bracket.length) return;
    setBracket((prev) => applyWinnersToBracket(prev, winners));
  }, [winners, applyWinnersToBracket]);

  const updateNextRound = (match, winner) => {
    if (match.round >= bracket.length - 1) return;
    setBracket((prev) => {
      const next = [...prev];
      const nextRoundIdx = match.round + 1;
      const nextMatchIdx = Math.floor(match.matchIndex / 2);
      const isFirst = match.matchIndex % 2 === 0;
      if (next[nextRoundIdx]?.matches[nextMatchIdx]) {
        const nm = next[nextRoundIdx].matches[nextMatchIdx];
        if (isFirst) nm.participant1 = winner;
        else nm.participant2 = winner;
      }
      return next;
    });
  };

  const truncateName = (n, max = 15) =>
    n ? (n.length > max ? n.slice(0, max) + "…" : n) : "TBD";

  // UI helpers for player pairs
  const parsePlayerDisplay = (name) => {
    if (competitionType !== "pairs" || !name) return null;
    if (name.includes(" & ")) {
      const [p1, p2] = name.split(" & ");
      return { player1: p1.trim(), player2: p2.trim() };
    }
    if (name.includes(" (Solo)"))
      return { player1: name.replace(" (Solo)", ""), player2: null };
    return null;
  };

  const ParticipantDisplay = ({ name, isWinner, onClick }) => {
    const playerInfo = parsePlayerDisplay(name);
    if (competitionType === "pairs" && playerInfo) {
      return (
        <div
          className={`cursor-pointer transition-all duration-200 p-3 rounded-lg border-2 ${
            isWinner
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg transform scale-105"
              : "bg-white border-blue-200 hover:border-blue-400 hover:shadow-md"
          }`}
          onClick={onClick}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500">
                {isWinner ? "" : "PAIR"}
              </div>
              {isWinner && <Trophy className="text-yellow-300" />}
            </div>
            <div className="space-y-1">
              <div className="bg-blue-50 px-2 py-1 rounded text-sm font-medium">
                {truncateName(playerInfo.player1, 12)}
              </div>
              {playerInfo.player2 && (
                <div className="bg-blue-50 px-2 py-1 rounded text-sm font-medium">
                  {truncateName(playerInfo.player2, 12)}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    console.log(showSeedingModal)
    return (
      <div
        className={`cursor-pointer transition-all duration-200 p-3 rounded-lg border-2 ${
          isWinner
            ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg transform scale-105"
            : "bg-white border-blue-200 hover:border-blue-400 hover:shadow-md"
        }`}
        onClick={onClick}
      >
        <span className="font-medium" title={name}>
          {truncateName(name)}
        </span>
        {isWinner && <Trophy className="text-yellow-300" />}
      </div>
    );
  };

  const MatchComponent = ({ match }) => {
    const { id, participant1, participant2 } = match;
    const winner = winners[id];
    
    return (
      <div className="bg-grey-500 rounded-xl shadow-lg border-2 border-gray-100 p-4 mb-6 transition-all duration-300 hover:shadow-xl relative">
        {/* Info button for match details */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMatchClick(match);
          }}
          className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 transition-colors"
          title="View Match Details"
        >
          <Info size={16} />
        </button>
        
        <div className="text-center mb-4">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            Match {match.matchIndex + 1}
          </span>
        </div>
        {participant1 ? (
          <ParticipantDisplay
            name={participant1}
            isWinner={winner === participant1}
            onClick={() => selectWinner(id, participant1, match)}
            className="mb-3"
          />
        ) : (
          <div className="p-3 mb-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <span className="text-gray-400">Waiting…</span>
          </div>
        )}
        <div className="text-center py-2">
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
            VS
          </span>
        </div>
        {participant2 ? (
          <ParticipantDisplay
            name={participant2}
            isWinner={winner === participant2}
            onClick={() => selectWinner(id, participant2, match)}
          />
        ) : participant1 ? (
          <div
            className="p-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg text-center cursor-pointer hover:from-yellow-500 hover:to-orange-500 transition-all"
            onClick={() => selectWinner(id, participant1, match)}
          >
            <span className="font-bold">AUTO ADVANCE</span>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <span className="text-gray-400">Waiting…</span>
          </div>
        )}
      </div>
    );
  };

  // Enhanced final winner detection with better logic
  const finalWinner = useMemo(() => {
    if (!bracket.length) return null;
    
    const finalRoundIndex = bracket.length - 1;
    const finalMatchId = `round${finalRoundIndex}_match0`;
    const finalWinner = winners[finalMatchId];
    
    // Also check if the final match fixture has a winner
    const finalMatchFixture = fixtureMap[finalMatchId];
    if (finalMatchFixture?.winner && !finalWinner) {
      const winnerName = idNameMap[finalMatchFixture.winner.toString()];
      if (winnerName) {
        // Update winners state to include this winner
        setWinners(prev => ({
          ...prev,
          [finalMatchId]: winnerName
        }));
        return winnerName;
      }
    }
    
    return finalWinner;
  }, [bracket, winners, fixtureMap, idNameMap]);

  // Filter out round-robin rounds when the event is hybrid
  const displayedBracket = currentEvent?.matchType?.includes("round-robin")
    ? bracket.filter((rnd) => rnd.matches.some((m) => m.phase !== "rr"))
    : bracket;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🏆 Tournament Bracket
          </h1>
          <p className="text-gray-600">Manage your tournament with ease</p>
        </div>

        {/* BEAUTIFUL NAVBAR - UPDATED */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-8 backdrop-blur-sm bg-white/90">
          <div className="flex items-center justify-between">
            
            {/* Left side - Event Selection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                <Trophy size={16} />
                Event
              </div>
              <select
                value={eventId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchParams(
                    (prev) => {
                      const np = new URLSearchParams(prev);
                      if (val) np.set("eventId", val);
                      else np.delete("eventId");
                      return np;
                    },
                    { replace: true }
                  );
                }}
                className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300"
              >
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex items-center gap-3">
              
              {/* Global Config Button */}
              <button
                onClick={() => setIsGlobalConfigOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg transform hover:scale-105"
              >
                Config&nbsp;All&nbsp;Rounds
              </button>
              {/* Reset Fixtures Button */}
              {/* <button
                onClick={handleResetFixtures}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:from-red-600 hover:to-pink-700 hover:shadow-lg transform hover:scale-105"
                title="Reset all fixtures"
              >
                <RotateCcw size={16} />
                Reset
              </button> */}

              {/* Delete Fixtures Button */}
              <button
                onClick={handleDeleteFixtures}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:from-red-700 hover:to-red-900 hover:shadow-lg transform hover:scale-105"
                title="Delete all fixtures"
              >
                <Trash2 size={16} />
                Delete
              </button>

              {/* Refresh Page Button */}
              <button
                onClick={handleRefreshPage}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:from-green-600 hover:to-emerald-700 hover:shadow-lg transform hover:scale-105"
                title="Refresh the page"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              {/* Generate Fixtures Button */}
              <button
                onClick={handleGenerateFixtures}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg transform hover:scale-105"
                title="Generate new fixtures"
              >
                <Zap size={16} />
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Bracket */}
        {currentEvent?.matchType?.includes("round-robin") && !hasKnockout ? (
          <RoundRobinFixtures />
        ) : currentParticipants.length >= 2 ? (
          <>
            <div className="flex gap-12 min-w-max py-4 overflow-x-auto">
              {displayedBracket.map((round) => (
                <div key={round.roundNumber} className="min-w-[300px]">
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
                      {(() => {
                        const sched = fixtureMap[round?.matches?.[0]?.id]?.scheduledAt;
                        return sched ? (
                          <p className="text-sm text-gray-500 mt-1">{formatDate(sched)}</p>
                        ) : null;
                      })()}
                    </div>
                    <div className="space-y-4">
                      {round.matches
                        .filter((m, index, self) => 
                          // Filter out duplicates by checking if this is the first occurrence of this ID
                          index === self.findIndex(t => (
                            (t.id === m.id) || 
                            (t._id && m._id && t._id === m._id)
                          ))
                        )
                        .map((m, index) => (
                          <MatchComponent 
                            key={`${m.id || m._id || `temp-${round.roundNumber}-${index}`}-${m.matchIndex || index}`} 
                            match={m} 
                          />
                        ))
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800">
              Ready to Start?
            </h3>
            <p className="text-gray-600">
              Generate fixtures to start the tournament
            </p>
          </div>
        )}

        {finalWinner && (
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-8 py-6 rounded-2xl inline-block shadow-2xl transform hover:scale-105 transition-transform">
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-2xl font-bold mb-2">TOURNAMENT CHAMPION</h2>
              <p className="text-xl font-semibold">{finalWinner}</p>
            </div>
          </div>
        )}
      </div>

      {/* -------- Global Config Modal -------- */}
      {isGlobalConfigOpen && (
        <div className="modal-overlay" onClick={() => setIsGlobalConfigOpen(false)}>
          <div className="modal-content max-w-lg" onClick={(e)=>e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">Match Configuration (All Rounds)</h2>
            <div className="modal-form grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700 space-y-1">
                Max Sets:
                <input className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type="number"
                  min="1"
                  max="15"
                  value={globalConfig.maxSets}
                  onChange={(e) => setGlobalConfig({...globalConfig,maxSets:parseInt(e.target.value)})}
                                 />
              </label>
              <label className="text-sm font-medium text-gray-700 space-y-1">
                Points to Win:
                <input className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type="number"
                  value={globalConfig.pointsToWin}
                  onChange={(e) => setGlobalConfig({...globalConfig,pointsToWin:parseInt(e.target.value)})}
                                 />
              </label>
              <label className="text-sm font-medium text-gray-700 space-y-1" style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  type="checkbox"
                  checked={globalConfig.isDeuce}
                  onChange={(e) => setGlobalConfig({...globalConfig,isDeuce:e.target.checked})}
                                 />
                Enable Deuce
              </label>
              <label className="text-sm font-medium text-gray-700 space-y-1">
                Deciding Point:
                <input className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type="number"
                  value={globalConfig.decidingPoint}
                  onChange={(e) => setGlobalConfig({...globalConfig,decidingPoint:parseInt(e.target.value)})}
                                 />
              </label>
              <label className="text-sm font-medium text-gray-700 space-y-1">
                Court Number:
                <input className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type="number"
                  min="1"
                  value={globalConfig.courtNumber}
                  onChange={(e) => setGlobalConfig({...globalConfig,courtNumber:parseInt(e.target.value)})}
                                 />
              </label>
            </div>
            <div className="modal-actions">
              <button className="tournament-action-btn tournament-save-btn" onClick={saveGlobalConfig} disabled={updatingMatch}>{updatingMatch?"Saving...":"Save"}</button>
              <button className="tournament-action-btn tournament-cancel-btn" onClick={()=>setIsGlobalConfigOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Schedule Round Modal -------- */}
      {scheduleRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              Schedule {scheduleRound.roundName}
            </h3>
            <input className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
                         />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setScheduleRound(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                disabled={savingRound === scheduleRound.roundNumber}
              >
                {savingRound === scheduleRound.roundNumber ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Match Details Modal - FIXED UI -------- */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Removed the black backdrop - bg-black bg-opacity-50 */}
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-blue-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b bg-blue-50">
              <h2 className="text-xl font-bold text-gray-800">Match Details</h2>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-gray-500 hover:text-gray-700 bg-gray-200 rounded-full p-2 hover:bg-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Teams */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 text-gray-800">Teams</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-600">
                      {selectedMatch.fixture?.teamA ? 
                        (idNameMap[selectedMatch.fixture.teamA] || selectedMatch.fixture.teamA || "Team A") : "Waiting..."}
                    </span>
                    <span className="text-sm text-gray-500">vs</span>
                    <span className="font-medium text-red-600">
                      {selectedMatch.fixture?.teamB ? 
                        (idNameMap[selectedMatch.fixture.teamB] || selectedMatch.fixture.teamB || "Team B") : "Waiting..."}
                    </span>
                  </div>
                </div>
              </div>

            {/* Match Config */}
<div className="bg-gray-50 p-4 rounded-lg border">
  <h3 className="font-semibold mb-3 text-gray-800">Match Configuration</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Number of Sets
      </label>
      <input 
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        type="number"
        min="1"
        max="15"
        value={matchConfig.maxSets}
        onChange={(e) => handleMaxSetsChange(e.target.value)}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Points to Win Set
      </label>
      <input 
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        type="number"
        min="1"
        max="100"
        value={matchConfig.pointsToWin}
        onChange={(e) => setMatchConfig(prev => ({ ...prev, pointsToWin: parseInt(e.target.value) || 30 }))}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Enable Deuce Rules?
      </label>
      <div className="flex items-center space-x-2">
        <input 
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          type="checkbox"
          checked={matchConfig.isDeuce}
          onChange={(e) => setMatchConfig(prev => ({ ...prev, isDeuce: e.target.checked }))}
        />
        <span className="text-sm text-gray-700">Yes, enable deuce</span>
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Deciding Point (if deuce)
      </label>
      <input 
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        type="number"
        min="1"
        max="200"
        value={matchConfig.decidingPoint}
        onChange={(e) => setMatchConfig(prev => ({ ...prev, decidingPoint: parseInt(e.target.value) || 50 }))}
        disabled={!matchConfig.isDeuce}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Court Number
      </label>
      <input 
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        type="number"
        min="1"
        value={matchConfig.courtNumber}
        onChange={(e) => setMatchConfig(prev => ({ ...prev, courtNumber: parseInt(e.target.value) || 1 }))}
      />
    </div>
  </div>
</div>

{/* Sets Scoring */}
<div className="bg-gray-50 p-4 rounded-lg border">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold text-gray-800">
      Sets (Best of {matchConfig.maxSets})
    </h3>
    <div className="text-sm text-gray-600">
      Sets needed to win: {Math.ceil(matchConfig.maxSets / 2)}
    </div>
  </div>
  <div className="space-y-3">
    {Array.from({ length: matchConfig.maxSets }, (_, index) => {
      const set = selectedMatch.sets?.[index] || {
        setNumber: index + 1,
        teamAScore: 0,
        teamBScore: 0,
        completed: false,
        winner: null
      };
      
      return (
        <div key={index} className={`flex items-center gap-4 p-3 rounded border ${
          set.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
        }`}>
          <span className="font-medium min-w-[60px]">Set {index + 1}</span>
          
          {/* Team A Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 min-w-[40px]">
              {selectedMatch.fixture?.teamA ? (idNameMap[selectedMatch.fixture.teamA] || selectedMatch.fixture.teamA || "Team A") : "Team A"}
            </span>
            <button
              onClick={() => updateSetScore(index, 'teamA', set.teamAScore - 1)}
              className="w-8 h-8 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              disabled={updatingMatch || set.teamAScore <= 0}
            >
              -
            </button>
            <input 
              className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="number"
              min="0"
              value={set.teamAScore}
              onChange={(e) => updateSetScore(index, 'teamA', parseInt(e.target.value) || 0)}
              disabled={updatingMatch}
            />
            <button
              onClick={() => updateSetScore(index, 'teamA', set.teamAScore + 1)}
              className="w-8 h-8 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={updatingMatch}
            >
              +
            </button>
          </div>

          <span className="text-gray-500 font-bold">vs</span>

          {/* Team B Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 min-w-[40px]">
              {selectedMatch.fixture?.teamB ? (idNameMap[selectedMatch.fixture.teamB] || selectedMatch.fixture.teamB || "Team B") : "Team B"}
            </span>
            <button
              onClick={() => updateSetScore(index, 'teamB', set.teamBScore - 1)}
              className="w-8 h-8 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              disabled={updatingMatch || set.teamBScore <= 0}
            >
              -
            </button>
            <input 
              className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="number"
              min="0"
              value={set.teamBScore}
              onChange={(e) => updateSetScore(index, 'teamB', parseInt(e.target.value) || 0)}
              disabled={updatingMatch}
            />
            <button
              onClick={() => updateSetScore(index, 'teamB', set.teamBScore + 1)}
              className="w-8 h-8 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={updatingMatch}
            >
              +
            </button>
          </div>

          {/* Set Winner Indicator */}
          <div className="flex items-center gap-2 min-w-[80px]">
            {set.completed && (
              <>
                <Trophy className="text-yellow-500" />
                <span className="text-sm font-medium">
                  {set.winner === 'teamA' ? 
                    (selectedMatch.fixture?.teamA ? (idNameMap[selectedMatch.fixture.teamA] || "Team A") : "Team A") : 
                    (selectedMatch.fixture?.teamB ? (idNameMap[selectedMatch.fixture.teamB] || "Team B") : "Team B")
                  }
                </span>
              </>
            )}
          </div>
        </div>
      );
    })}
  </div>
  
  {/* Match Status */}
  <div className="mt-4 p-3 bg-blue-50 rounded border">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">Match Status:</span>
      <span className={`text-sm font-bold ${
        selectedMatch.fixture?.status === 'completed' ? 'text-green-600' : 'text-blue-600'
      }`}>
        {selectedMatch.fixture?.status === 'completed' ? 'COMPLETED' : 'ONGOING'}
      </span>
    </div>
    
    {selectedMatch.fixture?.status === 'completed' && selectedMatch.fixture?.winner && (
      <div className="mt-2 text-center">
        <span className="text-lg font-bold text-green-600">
          🏆 Winner: {idNameMap[selectedMatch.fixture.winner] || 'Unknown'}
        </span>
      </div>
    )}
  </div>
{/* Auto-Advance for Bye Matches */}
{selectedMatch.fixture && 
 ((selectedMatch.fixture.teamA && !selectedMatch.fixture.teamB) || 
  (!selectedMatch.fixture.teamA && selectedMatch.fixture.teamB)) && (
  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
    <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
      <span>🏃‍♂️</span>
      Bye Match - Auto Advance
    </h3>
    <p className="text-sm text-gray-600 mb-3">
      This match has only one team. Click below to automatically advance them to the next round.
    </p>
    <button
      onClick={handleAutoAdvance}
      disabled={updatingMatch}
      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition-all"
    >
      {updatingMatch ? "Advancing..." : "Auto Advance to Next Round"}
    </button>
  </div>
)}
{/* Schedule Section */}
<div className="bg-gray-50 p-4 rounded-lg border">
  <h3 className="font-semibold mb-3 text-gray-800">Schedule</h3>
  <input 
    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"

    type="datetime-local"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
  />
</div>

{/* Is Scheduled Toggle */}
<div className="bg-gray-50 p-4 rounded-lg border">
  <h3 className="font-semibold mb-3 text-gray-800">Is Scheduled?</h3>
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-700">
      {isScheduled ? "Yes, this match is scheduled" : "Not scheduled"}
    </span>
    <button
      onClick={() => setIsScheduled(prev => !prev)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        isScheduled ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          isScheduled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
</div>

{/* Modal Footer */}
<div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
  <button
    onClick={() => setSelectedMatch(null)}
    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded transition-colors"
  >
    Cancel
  </button>
  <button
    onClick={saveMatchConfig}
    disabled={updatingMatch}
    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
  >
    {updatingMatch ? "Saving..." : "Save Configuration"}
  </button>
  </div>

        </div> {/* end modal container */}
       {/* end selectedMatch conditional */}

    </div> {/* end max-w-7xl */}
  </div> {/* end min-h-screen */}
</div>
      )}

      {/* Seeding Modal - Rendered at top level to avoid z-index issues */}
      {showSeedingModal && (
        <SeedingModal
          participants={participants}
          onCancel={() => setShowSeedingModal(false)}
          onConfirm={handleConfirmSeeding}
        />
      )}
</div>

    );
};

export default TournamentBracket;
