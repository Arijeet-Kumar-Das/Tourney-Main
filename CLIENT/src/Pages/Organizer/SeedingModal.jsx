import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

/**
 * SeedingModal
 * Allows organiser to pick the exact order in which teams are seeded before generating fixtures.
 * props:
 *  - participants: array of participant objects with at least {_id, name/teamName}
 *  - onCancel: () => void
 *  - onConfirm: (seedOrderIds: string[]) => void
 */
const SeedingModal = ({ participants = [], onCancel, onConfirm }) => {
  const [seedOrder, setSeedOrder] = useState([]);

  console.log("froom seeding modal")
  // Build options list once
  const options = participants.map((p) => ({
    id: p._id.toString(),
    label: p.teamName || p.name,
  }));

  // Number of slots equals number of participants (no byes handled here)
  const slots = participants.length;

  useEffect(() => {
    // initialise empty seed order
    setSeedOrder(Array(slots).fill(""));
  }, [slots]);

  const handleSelect = (index, value) => {
    setSeedOrder((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const chosenSet = new Set(seedOrder.filter(Boolean));

  const allChosen = seedOrder.every((v) => v);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onCancel}
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4">Seed Teams</h2>

        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {seedOrder.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-medium w-8 text-right">{idx + 1}.</span>
              <select
                className="flex-1 border rounded px-3 py-2"
                value={val}
                onChange={(e) => handleSelect(idx, e.target.value)}
              >
                <option value="">Select team</option>
                {options.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    disabled={chosenSet.has(opt.id) && opt.id !== val}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!allChosen}
            onClick={() => onConfirm(seedOrder)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Confirm & Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeedingModal;
