import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '@/Components/Navigation';
import Footer from '@/Components/Footer';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { fetchMatchFixtures } from "@/lib/api";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const Fixtures = () => {
  const location = useLocation();
  const eventName = location.state?.eventName || "Tournament";
  const tournamentId = location.state?.tournamentId;
  const eventId = location.state?.eventId;

  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventType, setEventType] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadEventData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!tournamentId || !eventId) throw new Error("Tournament or Event ID not provided");
        const eventsResponse = await fetch(`${BASE_URL}/api/player/tournaments/${tournamentId}/events`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!eventsResponse.ok) throw new Error(`HTTP error! status: ${eventsResponse.status}`);

        const eventsData = await eventsResponse.json();
        if (!eventsData.success) throw new Error(eventsData.message || 'Failed to load events');

        const currentEvent = eventsData.message.find(event => event._id === eventId);
        if (!currentEvent) throw new Error('Current event not found in tournament');

        const eventMatchType = currentEvent.matchType || '';
        setEventType(eventMatchType);

        const fixturesData = await fetchMatchFixtures(tournamentId, eventId);
        const grouped = {};
        fixturesData.forEach(fx => {
          const round = fx.roundName || `Round ${fx.round ?? 1}`;
          if (!grouped[round]) grouped[round] = [];
          grouped[round].push(fx);
        });
        const rounds = Object.entries(grouped).map(([round, matches], i) => ({
          id: i + 1,
          round,
          matches: matches.map(m => ({
            id: m._id,
            team1: m.teamA?.teamName || m.teamAName || m.teamA?._id || m.teamA || "TBD",
            team2: m.teamB?.teamName || m.teamBName || m.teamB?._id || m.teamB || "TBD",
            time: m.time || "",
            date: m.date ? m.date.split('T')[0] : "",
            ...m
          }))
        }));
        setFixtures(rounds);
      } catch (err) {
        setError(err.message || "Failed to load fixtures");
      } finally {
        setLoading(false);
      }
    };
    loadEventData();
  }, [tournamentId, eventId]);

  const calculateStandings = (fixtures) => {
    const teams = new Map();
    fixtures.forEach(round => {
      round.matches.forEach(match => {
        if (!teams.has(match.team1)) teams.set(match.team1, {
          teamName: match.team1, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0
        });
        if (!teams.has(match.team2)) teams.set(match.team2, {
          teamName: match.team2, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0
        });

        const team1 = teams.get(match.team1);
        const team2 = teams.get(match.team2);
        if (match.teamAScore === undefined || match.teamBScore === undefined) return;

        team1.played++; team2.played++;
        team1.goalsFor += match.teamAScore || 0;
        team1.goalsAgainst += match.teamBScore || 0;
        team2.goalsFor += match.teamBScore || 0;
        team2.goalsAgainst += match.teamAScore || 0;

        if (match.teamAScore > match.teamBScore) {
          team1.won++; team1.points += 3; team2.lost++;
        } else if (match.teamAScore < match.teamBScore) {
          team2.won++; team2.points += 3; team1.lost++;
        } else {
          team1.drawn++; team1.points += 1;
          team2.drawn++; team2.points += 1;
        }
      });
    });
    return Array.from(teams.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  };

  const standings = (eventType === 'round-robin' || eventType === 'round-robin-knockout')
    ? calculateStandings(fixtures) : [];

  const MatchComponent = ({ match }) => {
    let winnerName = null;
    if (match.winner) {
      const winner = match.winner?.toString();
      const teamAId = match.teamA?._id?.toString();
      const teamBId = match.teamB?._id?.toString();
      const teamAName = match.teamA?.teamName || match.team1;
      const teamBName = match.teamB?.teamName || match.team2;

      winnerName = winner === teamAId || winner === teamAName ? teamAName :
                   winner === teamBId || winner === teamBName ? teamBName : winner;
    }
    const dateObj = match.scheduledAt ? new Date(match.scheduledAt) : null;
    const formattedDateTime = dateObj
      ? `${dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} - ${dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`
      : match.date && match.time ? `${match.date} - ${match.time}` : "Date & Time TBD";

    return (
      <Card className="w-[220px] mb-4 shadow-md hover:shadow-lg transition-shadow mx-auto p-5">
        <CardContent className="text-center">
          <p className="text-sm text-gray-500 mb-3">{formattedDateTime}</p>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-full py-2 px-4 rounded-md font-semibold ${winnerName === match.team1 ? 'bg-green-100 border border-green-400' : 'bg-blue-50'}`}>{match.team1}</div>
            <span className="text-sm text-orange-800 bg-orange-100 px-3 py-1 rounded-full font-bold">VS</span>
            <div className={`w-full py-2 px-4 rounded-md font-semibold ${winnerName === match.team2 ? 'bg-green-100 border border-green-400' : 'bg-blue-50'}`}>{match.team2}</div>
            {winnerName && <div className="mt-3 text-green-700 font-semibold flex items-center gap-2 text-sm"><Trophy className="w-4 h-4 text-yellow-500" />Winner: {winnerName}</div>}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="pt-20 pb-8 container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{eventName} Fixtures</h1>
          <p className="text-gray-600 mt-2">View all matches and tournament brackets</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 font-semibold py-8">{error}</div>
        ) : (
          <>
            {(eventType === 'round-robin' || eventType === 'round-robin-knockout') && standings.length > 0 && (
              <div className="mb-8 bg-blue-50 rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Standings</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left border">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-3 py-2 border">#</th>
                        <th className="px-3 py-2 border">Team</th>
                        <th className="px-3 py-2 border">P</th>
                        <th className="px-3 py-2 border">W</th>
                        <th className="px-3 py-2 border">D</th>
                        <th className="px-3 py-2 border">L</th>
                        <th className="px-3 py-2 border">GF</th>
                        <th className="px-3 py-2 border">GA</th>
                        <th className="px-3 py-2 border">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, idx) => (
                        <tr key={row.teamId || idx} className="border-b">
                          <td className="px-3 py-2 border">{idx + 1}</td>
                          <td className="px-3 py-2 border font-semibold">{row.teamName}</td>
                          <td className="px-3 py-2 border">{row.played}</td>
                          <td className="px-3 py-2 border">{row.won}</td>
                          <td className="px-3 py-2 border">{row.drawn}</td>
                          <td className="px-3 py-2 border">{row.lost}</td>
                          <td className="px-3 py-2 border">{row.goalsFor}</td>
                          <td className="px-3 py-2 border">{row.goalsAgainst}</td>
                          <td className="px-3 py-2 border font-bold">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="w-full overflow-x-auto py-4">
              <div className="flex flex-nowrap gap-6 px-4">
                {fixtures.map((round) => (
                  <div key={round.id} className="flex-shrink-0 w-72">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-blue-600 flex items-center">
                          {round.round}
                          {round.round === "Final" && (
                            <Trophy className="ml-2 w-5 h-5 text-yellow-500" />
                          )}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {round.matches.map((match) => (
                          <div key={match.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                            <MatchComponent match={match} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Fixtures;
