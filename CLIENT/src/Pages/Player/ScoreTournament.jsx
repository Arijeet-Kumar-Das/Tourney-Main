import React, { useState, useEffect, useRef } from 'react';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { Search, AlertCircle } from 'lucide-react';

const MatchScoreSimple = ({
  teamA = 'Team A',
  teamB = 'Team B',
  setScores = [],
  selectedSet = 1,
  status = 'IN PROGRESS',
}) => {
  const current = setScores[selectedSet - 1] || { teamAScore: 0, teamBScore: 0 };

  return (
    <div className="max-w-3xl mx-auto mt-12 rounded-3xl shadow bg-white">
      <div className="relative bg-white rounded-[2.5rem] overflow-hidden py-10 px-8 md:px-16 flex flex-col gap-6">
        {/* Status badge */}
        <div className="absolute top-6 right-8">
          <span className="px-4 py-1 rounded-full text-xs font-bold tracking-wider shadow-sm bg-yellow-100 text-yellow-700">
            {status} – SET {selectedSet}
          </span>
        </div>
        <div className="flex flex-row items-center justify-between gap-8">
          {/* Team A */}
          <div className="flex-1 text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold text-rose-600 drop-shadow-lg uppercase">
              {teamA}
            </h2>
          </div>
          {/* Score */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-400 mb-2 tracking-widest">
              CURRENT SET
            </span>
            <div className="bg-gradient-to-b from-red-500 to-rose-600 text-white text-4xl md:text-5xl font-extrabold rounded-2xl px-6 py-4 flex flex-row items-center justify-center gap-4">
              <span>{current.teamAScore}</span>
              <span className="text-3xl md:text-4xl font-extrabold mx-1">-</span>
              <span>{current.teamBScore}</span>
            </div>
          </div>
          {/* Team B */}
          <div className="flex-1 text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold text-blue-600 drop-shadow-lg uppercase">
              {teamB}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreTournament = () => {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [maxSets, setMaxSets] = useState(3);
  const [selectedSet, setSelectedSet] = useState(1);
  const [setScores, setSetScores] = useState([
    { teamAScore: 0, teamBScore: 0 },
    { teamAScore: 0, teamBScore: 0 },
    { teamAScore: 0, teamBScore: 0 },
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Pad setScores if maxSets is changed
    let scores = [...setScores];
    while (scores.length < maxSets) scores.push({ teamAScore: 0, teamBScore: 0 });
    setSetScores(scores.slice(0, maxSets));
    setSelectedSet(1);
  };

  const handleSetChange = (e) => {
    setSelectedSet(Number(e.target.value));
  };

  const handleScoreChange = (team, delta) => {
    setSetScores(scores =>
      scores.map((s, idx) =>
        idx === selectedSet - 1
          ? {
            ...s,
            [team]: Math.max(0, s[team] + delta),
          }
          : s
      )
    );
  };

  const handleMaxSetsChange = (e) => {
    const newMax = Number(e.target.value);
    setMaxSets(newMax);
    let scores = [...setScores];
    while (scores.length < newMax) scores.push({ teamAScore: 0, teamBScore: 0 });
    setSetScores(scores.slice(0, newMax));
    if (selectedSet > newMax) setSelectedSet(1);
  };

  const totalScoreA = setScores.reduce((sum, s) => sum + s.teamAScore, 0);
  const totalScoreB = setScores.reduce((sum, s) => sum + s.teamBScore, 0);

  const sets = setScores.map((set, idx) => ({
    setNumber: idx + 1,
    teamAScore: set.teamAScore,
    teamBScore: set.teamBScore,
  }));

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex flex-col items-center justify-center px-4 mt-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-8 text-center">Score Your Team</h1>
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="w-full focus:outline-none placeholder-gray-400"
                placeholder="Enter Team A"
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="w-full focus:outline-none placeholder-gray-400"
                placeholder="Enter Team B"
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold">Max Sets:</label>
              <select
                className="border rounded px-2 py-1"
                value={maxSets}
                onChange={handleMaxSetsChange}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 transition-all duration-200 text-white font-semibold py-3 rounded-full shadow-md flex justify-center items-center gap-2"
            >
              <span className="text-md font-medium">
                Create Dummy Match
              </span>
            </button>
          </form>
        ) : (
          <div className="w-full max-w-2xl mt-10">
            <div className="bg-[#f5f9fc] rounded-xl shadow-md p-6 border">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  Dummy Match
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
                  UPCOMING
                </span>
              </div>
              <div className="text-center mb-2">
                {/* <div className="text-lg font-semibold text-gray-800">
                  {teamA} <span className="text-gray-500">vs</span> {teamB}
                </div> */}
                <div className="text-pink-700 font-mono text-md mt-1">
                  {submitted && (
                    <div className="text-center space-y-4">
                      <MatchScoreSimple
                        teamA={teamA}
                        teamB={teamB}
                        setScores={setScores}
  selectedSet={selectedSet}
  status="LIVE"
                      />

                      {/* Set-wise breakdown table */}
                      <div className="overflow-x-auto mt-12 border rounded-lg ">
                        <table className="w-full text-center border">
                          <thead>
                            <tr>
                              <th></th>
                              {sets.map((set, idx) => (
                                <th key={idx} className="font-semibold px-2 py-1">SET {set.setNumber}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-gray-300">
                              <td className="flex items-center font-bold gap-2 px-2 py-1 text-black">
                                <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>
                                {teamA || 'Player 1'}
                              </td>
                              {sets.map((set, idx) => (
                                <td key={idx} className="font-semibold px-2 py-1">{set.teamAScore}</td>
                              ))}
                            </tr>
                            <tr className="border-t border-red-300">
                              <td className="flex items-center font-bold gap-2 px-2 py-1 text-black">
                                <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>
                                {teamB || 'Player 2'}
                              </td>
                              {sets.map((set, idx) => (
                                <td key={idx} className="px-2 py-1">{set.teamBScore}</td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center mt-3">
                <label className="block font-semibold mb-2">Select Set</label>
                <select
                  className="block mx-auto mb-4 px-3 py-2 border rounded-lg"
                  value={selectedSet}
                  onChange={handleSetChange}
                >
                  {Array.from({ length: maxSets }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Set {i + 1}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-6 bg-blue-50 rounded-xl py-6">
                  {/* Team A */}
                  <div className="flex flex-col items-center justify-center">
                    <h3 className="font-semibold mb-2">
                      {teamA}
                    </h3>
                    <div className="text-5xl font-bold text-blue-600 mb-4">{setScores[selectedSet - 1]?.teamAScore ?? 0}</div>
                    <div className="flex gap-4">
                      <button
                        className="w-10 h-10 rounded-full bg-gray-100 text-xl text-gray-700"
                        onClick={() => handleScoreChange('teamAScore', -1)}
                      >
                        -
                      </button>
                      <button
                        className="w-10 h-10 rounded-full bg-blue-500 text-white text-xl"
                        onClick={() => handleScoreChange('teamAScore', 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/* Team B */}
                  <div className="flex flex-col items-center justify-center">
                    <h3 className="font-semibold mb-2">
                      {teamB}
                    </h3>
                    <div className="text-5xl font-bold text-red-500 mb-4">{setScores[selectedSet - 1]?.teamBScore ?? 0}</div>
                    <div className="flex gap-4">
                      <button
                        className="w-10 h-10 rounded-full bg-gray-100 text-xl text-gray-700"
                        onClick={() => handleScoreChange('teamBScore', -1)}
                      >
                        -
                      </button>
                      <button
                        className="w-10 h-10 rounded-full bg-red-500 text-white text-xl"
                        onClick={() => handleScoreChange('teamBScore', 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <button
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition mr-4"
                  onClick={() => setSubmitted(false)}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ScoreTournament;
