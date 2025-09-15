// Models/Fixture/FixtureModel.js
import mongoose from "mongoose";

const SetScoreSchema = new mongoose.Schema({
  setNumber: { type: Number, required: true },
  teamAScore: { type: Number, default: 0 },
  teamBScore: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  winner: { type: String, enum: ['teamA', 'teamB', null], default: null }
}, { _id: false });

const FixtureSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tournament",
    required: true,
    index: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "event",
  },
  round: {
    type: Number,
    required: true,
  },
  roundName: String,
  matchIndex: {
    type: Number,
    required: true,
  },
  teamA: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'teamModelA',
    default: null,
  },
  teamB: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'teamModelB',
    default: null,
  },
  teamModelA: { type: String, enum: ['teamIndividual', 'teamGroup'] },
  teamModelB: { type: String, enum: ['teamIndividual', 'teamGroup'] },
  scheduledAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["scheduled", "ongoing", "completed", "cancelled"],
    default: "scheduled",
  },
  isScheduled: { type: Boolean, default: true }, 
  
  sets: [SetScoreSchema],
  maxSets: { type: Number, default: 3 },

  currentSet: { type: Number, default: 1 },
  pointsToWin: { type: Number, default: 30 },
  isDeuce: { type: Boolean, default: true },
  decidingPoint: { type: Number, default: 50 },
  courtNumber: { type: Number, default: 1 },

  winner: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'winnerModel',
  },
  winnerModel: { type: String, enum: ['teamIndividual', 'teamGroup'] },
  notes: String,

  scoreA: Number,
  scoreB: Number,
  phase: { type: String, enum: ['rr', 'ko'], default: 'ko' }
}, { timestamps: true });

const Fixture = mongoose.model("fixture", FixtureSchema);

export default Fixture;
