import React, { useEffect, useState } from "react";
import { fetchMatchFixtures } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

const MatchesTab = ({ tournamentId, eventId }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!tournamentId || !eventId) throw new Error("Tournament or Event ID missing");
        const fixtures = await fetchMatchFixtures(tournamentId, eventId);
        const processedFixtures = fixtures.map(match => {
          if (Array.isArray(match.sets)) {
            return {
              ...match,
              sets: match.sets.map(set => ({
                ...set,
                teamAScore: set.teamAScore ?? 0, // Default to 0 if null or undefined
                teamBScore: set.teamBScore ?? 0, // Default to 0 if null or undefined
              }))
            };
          }
          return match;
        });
        setMatches(processedFixtures);
      } catch (err) {
        setError(err.message || "Failed to load matches");
      } finally {
        setLoading(false);
      }
    };
    loadMatches();
  }, [tournamentId, eventId]);

  if (loading) return <div className="text-center py-8">Loading matches...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!matches.length) return <div className="text-center py-8">No matches found for this event.</div>;

  return (
    <div className="flex flex-col gap-6">
      {matches.map((match) => (
        <Card key={match._id} className="w-full max-w-3xl mx-auto mb-4">
          <CardContent className="flex flex-col gap-2">
            {/* Combined div for Scheduled and Match Status Badge */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 text-sm">
                <b>Scheduled:</b> {match.scheduledAt ?
                  new Date(match.scheduledAt).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                  }) : 'TBD'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                ${match.status === 'completed' ? 'bg-green-100 text-green-700' : match.status === 'ongoing' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {match.status ? match.status.charAt(0).toUpperCase() + match.status.slice(1) : 'Scheduled'}
              </span>
            </div>

            {Array.isArray(match.sets) && (
              <div className="w-full rounded-xl p-0.5 mb-2">
                <div className="bg-white rounded-xl p-2 ">
                  <div className="font-bold text-white bg-[#e11d48] px-4 py-1 rounded-t-xl mb-2">
                    {match.roundName || `Round ${match.round || ''}`} - {match.matchIndex || ''}
                  </div>
                  <table className="w-full text-center">
                    <thead>
                      <tr>
                        <th></th>
                        {match.sets.map((set, idx) => (
                          <th key={idx} className="font-semibold">SET {set.setNumber}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="flex items-center font-bold gap-2 text-black"><span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-2"></span>{match.teamA?.teamName || match.teamA || 'Player 1'}</td>
                        {match.sets.map((set, idx) => (
                          <td key={idx} className="font-semibold">{set.teamAScore}</td>
                        ))}
                      </tr>
                      <tr className="border-t border-red-300">
                        <td className="flex items-center font-bold gap-2 text-black"><span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-2"></span>{match.teamB?.teamName || match.teamB || 'Player 2'}</td>
                        {match.sets.map((set, idx) => (
                          <td key={idx}>{set.teamBScore}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {match.scoreA != null && match.scoreB != null && (
              <div className="flex justify-center mt-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                  {match.scoreA} - {match.scoreB}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchesTab;
