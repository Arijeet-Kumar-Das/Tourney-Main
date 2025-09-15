import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

// Generic modal to configure a fixture's settings (sets, points, etc.)
// Props:
//  open: boolean – whether the modal is visible
//  onClose: () => void – closes the modal
//  fixture: object|null – the fixture object to configure (can be partial)
//  onSave: (config) => Promise – async save handler, should persist to backend
export default function MatchConfigModal({ open, onClose, fixture = {}, onSave }) {
  const [maxSets, setMaxSets] = useState(1);
  const [pointsToWin, setPointsToWin] = useState(21);
  const [isDeuce, setIsDeuce] = useState(false);
  const [courtNumber, setCourtNumber] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMaxSets(fixture.maxSets || 1);
    setPointsToWin(fixture.pointsToWin || 21);
    setIsDeuce(fixture.isDeuce ?? false);
    setCourtNumber(fixture.courtNumber || 1);
  }, [open, fixture]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ maxSets, pointsToWin, isDeuce, courtNumber });
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 relative shadow-xl">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Match Config
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Number of Sets
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={maxSets}
              onChange={(e) => setMaxSets(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Points</label>
            <input
              type="number"
              min="1"
              value={pointsToWin}
              onChange={(e) => setPointsToWin(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Is Deuce?</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isDeuce}
                onChange={(e) => setIsDeuce(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Court Number
            </label>
            <input
              type="number"
              min="1"
              value={courtNumber}
              onChange={(e) => setCourtNumber(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded font-semibold disabled:opacity-50"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
