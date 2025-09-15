import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchFixtures, updateFixture, fetchEvents } from "../../lib/api.js";

export default function LiveScoring() {
  const { id: tournamentId } = useParams();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({}); // fixtureId -> bool

  // Auto-advance a bye fixture (only one team)
  const autoAdvanceBye = async (fx) => {
    if (!fx) return;
    const winnerId = fx.teamA && !fx.teamB ? fx.teamA : fx.teamB;
    if (!winnerId) return;
    try {
      await updateFixture(fx._id, { winner: winnerId, status: "completed" });
    } catch (e) {
      console.error("Auto-advance failed", e);
    }
  };

  // Function to load fixtures - DISABLED to prevent interference
  const loadFixtures = async () => {
    try {
      // Disabled to prevent interference with Fixtures page
      return;
      const data = await fetchFixtures(tournamentId, eventId);
      // auto-advance bye fixtures first
      const byePromises = data
        .filter(
          (f) =>
            (f.phase === "ko" || f.phase === "knockout") &&
            ((f.teamA && !f.teamB) || (!f.teamA && f.teamB)) &&
            f.status !== "completed"
        )
        .map(autoAdvanceBye);
      if (byePromises.length) await Promise.all(byePromises);
      // refetch after auto-advance
      const refreshed = byePromises.length ? await fetchFixtures(tournamentId, eventId) : data;
      // Filter to knockout fixtures for this event with both teams set
      const ko = refreshed.filter(
        (f) =>
          (f.phase === "ko" || f.phase === "knockout") &&
          (eventId ? String(f.event) === eventId : true) &&
          f.teamA &&
          f.teamB
      );
      // Determine the current active round (lowest round number not fully completed)
      const incomplete = ko.filter((fx) => fx.status !== "completed");
      const activeRound = incomplete.length
        ? Math.min(...incomplete.map((fx) => fx.round))
        : Math.min(...ko.map((fx) => fx.round));

      const display = ko.filter((fx) => fx.round === activeRound);
      setFixtures(display);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to load fixtures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFixtures();
  }, [tournamentId, eventId]);

  // Listen for fixtures reset & fixturesUpdated events
  useEffect(() => {
    const handleFixturesReset = (event) => {
      if (
        event.detail.tournamentId === tournamentId &&
        event.detail.eventId === eventId
      ) {
        setLoading(true);
        loadFixtures();
      }
    };

    const handleFixturesUpdated = (e) => {
      if (e.detail.tournamentId === tournamentId && e.detail.eventId === eventId) {
        setLoading(true);
        loadFixtures();
      }
    };
    window.addEventListener('fixturesReset', handleFixturesReset);
    window.addEventListener('fixturesUpdated', handleFixturesUpdated);
    return () => {
      window.removeEventListener('fixturesReset', handleFixturesReset);
      window.removeEventListener('fixturesUpdated', handleFixturesUpdated);
    };
  }, [tournamentId, eventId]);

  const handleScoreChange = (fixture, setIdx, team, val) => {
    const n = Number(val);
    if (isNaN(n) || n < 0) return;
    
    const pointsToWin = fixture.pointsToWin || 21;
    const isDeuce = fixture.isDeuce !== undefined ? fixture.isDeuce : false;
    const decidingPoint = fixture.decidingPoint || 30;
    
    setFixtures((prev) =>
      prev.map((fx) => {
        if (fx._id !== fixture._id) return fx;
        const sets = [...(fx.sets || [])];
        while (sets.length < fixture.maxSets) {
          sets.push({ teamAScore: 0, teamBScore: 0, completed: false });
        }
        
        const currentSet = { ...sets[setIdx] };
        
        // Check if set is already completed
        if (currentSet.completed) return fx;
        
        // Update the score
        if (team === "A") {
          currentSet.teamAScore = n;
        } else {
          currentSet.teamBScore = n;
        }
        
        // Check if set is completed based on scoring rules
        let completed = false;
        let winner = null;
        
        if (isDeuce && decidingPoint && currentSet.teamAScore === decidingPoint) {
          completed = true;
          winner = "teamA";
        } else if (isDeuce && decidingPoint && currentSet.teamBScore === decidingPoint) {
          completed = true;
          winner = "teamB";
        } else if (currentSet.teamAScore >= pointsToWin && currentSet.teamAScore - currentSet.teamBScore >= 2) {
          completed = true;
          winner = "teamA";
        } else if (currentSet.teamBScore >= pointsToWin && currentSet.teamBScore - currentSet.teamAScore >= 2) {
          completed = true;
          winner = "teamB";
        }
        
        currentSet.completed = completed;
        currentSet.winner = winner;
        
        sets[setIdx] = currentSet;
        return { ...fx, sets };
      })
    );
  };

  // Function to advance winner to next round - FIXED LOGIC
  const advanceWinnerToNextRound = async (completedFixture, winner) => {
    try {
      // The backend updateFixture already handles winner advancement
      // We just need to refresh the fixtures to show the changes
      const updatedFixtures = await fetchFixtures(tournamentId, eventId);
      const updatedKo = updatedFixtures.filter(
        (f) =>
          (f.phase === "ko" || f.phase === "knockout") &&
          (eventId ? String(f.event) === eventId : true) &&
          f.teamA &&
          f.teamB
      );
      setFixtures(updatedKo);

      // Notify Fixtures.jsx to refresh its bracket
      window.dispatchEvent(
        new CustomEvent('fixturesUpdated', {
          detail: { tournamentId: tournamentId, eventId },
        })
      );
    } catch (err) {
      console.error("Failed to refresh fixtures after winner advancement:", err);
    }
  };

  // Assign winner to next fixture if backend didn't
  const propagateWinnerFrontend = async (updatedFixture) => {
    try {
      if (!updatedFixture.winner) return;
      // Determine next fixture index
      const nextRound = updatedFixture.round + 1;
      const nextMatchIndex = Math.floor(updatedFixture.matchIndex / 2);
      const all = await fetchFixtures(tournamentId, eventId);
      const next = all.find(
        (f) => f.round === nextRound && f.matchIndex === nextMatchIndex && (f.phase === "ko" || f.phase === "knockout")
      );
      if (!next) return;
      const isFirstMatch = updatedFixture.matchIndex % 2 === 0;
      const payload = isFirstMatch ? { teamA: updatedFixture.winner } : { teamB: updatedFixture.winner };
      const res = await updateFixture(next._id, payload);
      const updatedFx = res;
      await propagateWinnerFrontend(updatedFx);
      await advanceWinnerToNextRound(updatedFx, updatedFx.winner);
    } catch (e) {
      console.error("Front-end winner propagation failed", e);
    }
  };

  const saveFixture = async (fixture) => {
    if (updating[fixture._id]) return;
    setUpdating((p) => ({ ...p, [fixture._id]: true }));
    try {
      // determine winners per set & match using proper scoring logic
      const pointsToWin = fixture.pointsToWin || 21;
      const isDeuce = fixture.isDeuce !== undefined ? fixture.isDeuce : false;
      const decidingPoint = fixture.decidingPoint || 30;
      
      const sets = fixture.sets.map((s) => {
        const { teamAScore, teamBScore } = s;
        let completed = false;
        let winner = null;
        
        // Check for deciding point (if deuce is enabled)
        if (isDeuce && decidingPoint && (teamAScore === decidingPoint || teamBScore === decidingPoint)) {
          completed = true;
          winner = teamAScore === decidingPoint ? "teamA" : "teamB";
        }
        // Standard win condition: reach points threshold with 2-point lead
        else if (teamAScore >= pointsToWin && teamAScore - teamBScore >= 2) {
          completed = true;
          winner = "teamA";
        }
        else if (teamBScore >= pointsToWin && teamBScore - teamAScore >= 2) {
          completed = true;
          winner = "teamB";
        }
        // If deuce is disabled, just need to reach points threshold
        if (!isDeuce && teamAScore >= pointsToWin && teamAScore > teamBScore) {
          completed = true;
          winner = "teamA";
        }
        else if (!isDeuce && teamBScore >= pointsToWin && teamBScore > teamAScore) {
          completed = true;
          winner = "teamB";
        }
        
        return { ...s, completed, winner };
      });
      
      const completedSets = sets.filter((s) => s.completed);
      const teamAWins = completedSets.filter((s) => s.winner === "teamA").length;
      const teamBWins = completedSets.filter((s) => s.winner === "teamB").length;
      const setsNeededToWin = Math.ceil(fixture.maxSets / 2);
      
      let winner = null;
      let status = "ongoing";
      if (teamAWins >= setsNeededToWin) {
        winner = fixture.teamA._id || fixture.teamA;
        status = "completed";
      } else if (teamBWins >= setsNeededToWin) {
        winner = fixture.teamB._id || fixture.teamB;
        status = "completed";
      }
      
      const payload = { sets, status };
      if (winner) payload.winner = winner;
      
      const updatedFixture = await updateFixture(fixture._id, payload);
      
      // Update local state to reflect changes
      setFixtures(prev => prev.map(f => 
        f._id === fixture._id ? { ...f, sets, status, winner } : f
      ));
      
      // If match is completed, manually advance winner
      if (status === "completed" && winner) {
        console.log(`Match completed. Winner: ${winner}`);
        await propagateWinnerFrontend({ ...fixture, winner, status });
        await advanceWinnerToNextRound(updatedFixture, winner);
      }
      
      alert("Scores saved successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Save failed");
    } finally {
      setUpdating((p) => ({ ...p, [fixture._id]: false }));
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  if (!fixtures.length) return <div className="p-6">No knockout fixtures.</div>;

  return (
    <div className="p-6 space-y-8">
      {fixtures.map((fx) => (
        <div key={fx._id} className="border rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">
            {fx.teamA?.teamName || fx.teamA?.name || "Team A"} vs {" "}
            {fx.teamB?.teamName || fx.teamB?.name || "Team B"}
          </h3>
          <div className="mb-4 text-sm text-gray-600">
            <strong>Match Config:</strong> {fx.maxSets || 1} sets, {fx.pointsToWin || 21} points to win
            {fx.isDeuce ? `, deuce enabled (deciding point: ${fx.decidingPoint || 30})` : ', no deuce'}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-max text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-1">Set</th>
                  <th className="px-3 py-1">Team A</th>
                  <th className="px-3 py-1">Team B</th>
                  <th className="px-3 py-1">Winner</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: fx.maxSets }, (_, idx) => {
                  const set = fx.sets?.[idx] || { teamAScore: 0, teamBScore: 0, completed: false, winner: null };
                  const pointsToWin = fx.pointsToWin || 21;
                  const isDeuce = fx.isDeuce !== undefined ? fx.isDeuce : false;
                  const decidingPoint = fx.decidingPoint || 30;
                  
                  // Calculate if set is won
                  let setWinner = null;
                  if (isDeuce && decidingPoint && (set.teamAScore === decidingPoint || set.teamBScore === decidingPoint)) {
                    setWinner = set.teamAScore === decidingPoint ? "Team A" : "Team B";
                  } else if (set.teamAScore >= pointsToWin && set.teamAScore - set.teamBScore >= 2) {
                    setWinner = "Team A";
                  } else if (set.teamBScore >= pointsToWin && set.teamBScore - set.teamAScore >= 2) {
                    setWinner = "Team B";
                  } else if (!isDeuce && set.teamAScore >= pointsToWin && set.teamAScore > set.teamBScore) {
                    setWinner = "Team A";
                  } else if (!isDeuce && set.teamBScore >= pointsToWin && set.teamBScore > set.teamAScore) {
                    setWinner = "Team B";
                  }
                  
                  return (
                    <tr key={idx} className={setWinner ? 'bg-green-50' : ''}>
                      <td className="px-3 py-1 text-center font-medium">{idx + 1}</td>
                      <td className="px-3 py-1">
                        <input
                          type="number"
                          min="0"
                          max={setWinner ? set.teamAScore : (isDeuce ? decidingPoint : Math.max(pointsToWin + 10, set.teamBScore + 2))}
                          value={set.teamAScore}
                          onChange={(e) => handleScoreChange(fx, idx, "A", e.target.value)}
                          className="w-16 border rounded px-1 py-0.5"
                          disabled={setWinner !== null}
                        />
                      </td>
                      <td className="px-3 py-1">
                        <input
                          type="number"
                          min="0"
                          max={setWinner ? set.teamBScore : (isDeuce ? decidingPoint : Math.max(pointsToWin + 10, set.teamAScore + 2))}
                          value={set.teamBScore}
                          onChange={(e) => handleScoreChange(fx, idx, "B", e.target.value)}
                          className="w-16 border rounded px-1 py-0.5"
                          disabled={setWinner !== null}
                        />
                      </td>
                      <td className="px-3 py-1 text-center">
                        {setWinner && (
                          <span className="text-green-600 font-semibold">🏆 {setWinner}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded disabled:opacity-50"
            disabled={updating[fx._id]}
            onClick={() => saveFixture(fx)}
          >
            {updating[fx._id] ? "Saving…" : "Save Scores"}
          </button>
        </div>
      ))}
    </div>
  );
}
