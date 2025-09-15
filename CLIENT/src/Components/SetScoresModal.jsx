import React, { useState, useEffect } from 'react';
import { updateFixture } from '../lib/api';

const SetScoresModal = ({ isOpen, onClose, match, onSave }) => {
  const [scores, setScores] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (match) {
      // Initialize with existing sets or default empty sets
      const initialScores = match.sets && match.sets.length > 0 
        ? [...match.sets]
        : Array(match.maxSets || 3).fill().map((_, i) => ({
            setNumber: i + 1,
            teamAScore: 0,
            teamBScore: 0,
            completed: false,
            winner: null
          }));
      setScores(initialScores);
    }
  }, [match]);

  const handleScoreChange = (setIndex, team, value) => {
    const newScores = [...scores];
    const scoreValue = Math.max(0, parseInt(value) || 0);
    
    if (team === 'A') {
      newScores[setIndex].teamAScore = scoreValue;
    } else {
      newScores[setIndex].teamBScore = scoreValue;
    }
    
    // Auto-determine set winner if both scores are set
    if (newScores[setIndex].teamAScore > 0 || newScores[setIndex].teamBScore > 0) {
      if (newScores[setIndex].teamAScore > newScores[setIndex].teamBScore) {
        newScores[setIndex].winner = 'teamA';
      } else if (newScores[setIndex].teamBScore > newScores[setIndex].teamAScore) {
        newScores[setIndex].winner = 'teamB';
      } else {
        newScores[setIndex].winner = null;
      }
      newScores[setIndex].completed = true;
    } else {
      newScores[setIndex].completed = false;
      newScores[setIndex].winner = null;
    }
    
    setScores(newScores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!match) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const completedSets = scores.filter(set => set.completed);
      const teamAScore = completedSets.filter(set => set.winner === 'teamA').length;
      const teamBScore = completedSets.filter(set => set.winner === 'teamB').length;
      
      const winner = teamAScore > teamBScore ? 'teamA' : teamBScore > teamAScore ? 'teamB' : null;
      
      const updatedFixture = {
        ...match,
        sets: scores,
        status: winner ? 'completed' : 'ongoing',
        winner: winner ? match[winner] : null,
        scoreA: teamAScore,
        scoreB: teamBScore
      };
      
      await onSave(updatedFixture);
      onClose();
    } catch (err) {
      console.error('Error saving scores:', err);
      setError('Failed to save scores. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">
          {match.teamAName || 'Team A'} vs {match.teamBName || 'Team B'}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {scores.map((set, index) => (
              <div key={index} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
                <span className="w-16 font-medium">Set {index + 1}</span>
                
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={set.teamAScore}
                    onChange={(e) => handleScoreChange(index, 'A', e.target.value)}
                    className="w-16 p-2 border rounded text-center"
                    disabled={set.completed}
                  />
                  <span>:</span>
                  <input
                    type="number"
                    min="0"
                    value={set.teamBScore}
                    onChange={(e) => handleScoreChange(index, 'B', e.target.value)}
                    className="w-16 p-2 border rounded text-center"
                    disabled={set.completed}
                  />
                  {set.winner && (
                    <span className="ml-2 text-sm font-medium">
                      Winner: {set.winner === 'teamA' ? (match.teamAName || 'Team A') : (match.teamBName || 'Team B')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Scores'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetScoresModal;
