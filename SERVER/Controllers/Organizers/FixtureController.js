import mongoose from "mongoose";
import Tournament from "../../Models/Organizer/Tournament.js";
import Team from "../../Models/Organizer/Teams.js";
import Events from "../../Models/Organizer/Event.js";
import TeamIndividual from "../../Models/Organizer/TeamIndividual.js";
import TeamGroup from "../../Models/Organizer/TeamGroup.js";

// Lazy import to avoid circular deps
const getFixtureModel = async () => {
  const module = await import("../../Models/Fixture/FixtureModel.js");
  return module.default;
};

// Validate ObjectId helper
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper to map round index to readable name
const getRoundName = (roundNum, totalRounds) => {
  const roundsFromEnd = totalRounds - 1 - roundNum;
  if (roundsFromEnd === 0) return "Final";
  if (roundsFromEnd === 1) return "Semi-Final";
  if (roundsFromEnd === 2) return "Quarter-Final";
  if (roundsFromEnd === 3) return "Round of 16";
  return `Round ${roundNum + 1}`;
};

// ----------------- Controllers -----------------

// DELETE /api/organizer/fixtures/:tournamentId/knockout (optional ?eventId=)
export const deleteKnockoutFixtures = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { eventId } = req.query || {};
    if (!isValidId(tournamentId)) {
      return res.json({ success: false, message: "Invalid tournament id" });
    }

    const Fixture = await getFixtureModel();
    const filter = {
      tournament: tournamentId,
      phase: "ko",
      ...(eventId && isValidId(eventId) ? { event: eventId } : {}),
    };

    await Fixture.deleteMany(filter);

    return res.json({ success: true, message: "Knockout fixtures deleted" });
  } catch (error) {
    console.log("Error deleting knockout fixtures:", error);
    return res.json({ success: false, message: "Error deleting knockout fixtures" });
  }
};

// GET /api/organizer/fixtures/:tournamentId/teams (optionally ?eventId=)
export const getTeams = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { eventId } = req.query || {};

    if (!isValidId(tournamentId)) {
      return res.json({ success: false, message: "Invalid tournament id" });
    }

    // If eventId present, fetch participants based on event type
    if (eventId && isValidId(eventId)) {
      const event = await Events.findById(eventId);
      if (!event)
        return res.json({ success: false, message: "Event not found" });

      let participants = [];

      if (event.eventType2 === "individual") {
        participants = await TeamIndividual.find({ tournamentId, eventId });
        participants = participants.map((p) => ({ _id: p._id, name: p.name }));
      } else if (event.eventType2 === "group") {
        // For doubles/group events we want to surface the two player names as a readable pair
        const groups = await TeamGroup.find({ tournamentId, eventId }).lean();
        participants = groups.map((g) => {
          // Default to saved teamName
          let pairLabel = g.teamName;
          if (Array.isArray(g.members) && g.members.length >= 2) {
            const [m1, m2] = g.members;
            if (m1?.name && m2?.name) {
              pairLabel = `${m1.name} & ${m2.name}`;
            }
          }
          return {
            _id: g._id,
            name: pairLabel,
            teamName: g.teamName,
            members: g.members, // pass full members for richer client-side rendering
          };
        });
      }

      return res.json({ success: true, teams: participants });
    }

    // Fallback – classic teams attached to tournament
    const tournament = await Tournament.findById(tournamentId).populate("teams");
    if (!tournament) {
      return res.json({ success: false, message: "Tournament not found" });
    }

    const teams = tournament.teams.map((t) => ({
      _id: t._id,
      name: t.teamName,
    }));

    return res.json({ success: true, teams });
  } catch (error) {
    console.log("Error in getTeams:", error);
    return res.json({ success: false, message: "Error fetching teams" });
  }
};

// GET /api/organizer/fixtures/:tournamentId
export const getFixtures = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { eventId } = req.query || {};

    if (!isValidId(tournamentId)) {
      return res.json({ success: false, message: "Invalid tournament id" });
    }

    const Fixture = await getFixtureModel();
    const filter = { tournament: tournamentId };
    if (eventId && isValidId(eventId)) {
      filter.event = eventId;
    }

    const fixtures = await Fixture.find(filter)
      .populate('teamA teamB winner')
      .sort({ round: 1, matchIndex: 1 });

    return res.json({ success: true, fixtures });
  } catch (error) {
    console.log("Error in getFixtures:", error);
    return res.json({ success: false, message: "Error fetching fixtures" });
  }
};

// PUT /api/organizer/fixtures/fixture/:fixtureId - UPDATED WITH COMPLETE SETS SUPPORT
// PUT /api/organizer/fixtures/fixture/:fixtureId
export const updateFixture = async (req, res) => {
  try {
    const { fixtureId } = req.params;
    if (!isValidId(fixtureId)) {
      return res.json({ success: false, message: "Invalid fixture id" });
    }

    const Fixture = await getFixtureModel();
    
    // UPDATED: Include all match configuration fields
    const allowed = [
      "status",
      "scoreA",
      "scoreB", 
      "winner",
      "scheduledAt",
      "notes",
      "sets",           // Sets array
      "maxSets",        // Maximum sets
      "currentSet",     // Current set
      "pointsToWin",    // NEW: Points needed to win a set
      "isDeuce",        // NEW: Enable deuce rules
      "decidingPoint",  // NEW: Deciding point for deuce
      "courtNumber",     // NEW: Court number
      "isScheduled"
    ];

    const updateData = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) {
        updateData[f] = req.body[f];
      }
    });

    // Validate and process sets data if provided
    if (updateData.sets && Array.isArray(updateData.sets)) {
      updateData.sets = updateData.sets.map((set, index) => ({
        setNumber: set.setNumber || (index + 1),
        teamAScore: Math.max(0, parseInt(set.teamAScore) || 0),
        teamBScore: Math.max(0, parseInt(set.teamBScore) || 0),
        completed: Boolean(set.completed),
        winner: set.winner && ['teamA', 'teamB'].includes(set.winner) ? set.winner : null
      }));

      // Calculate overall match winner from sets
      const completedSets = updateData.sets.filter(set => set.completed);
      const teamAWins = completedSets.filter(set => set.winner === 'teamA').length;
      const teamBWins = completedSets.filter(set => set.winner === 'teamB').length;
      const maxSets = updateData.maxSets || 3;
      const setsNeededToWin = Math.ceil(maxSets / 2);

      if (teamAWins >= setsNeededToWin) {
        const fixture = await Fixture.findById(fixtureId);
        updateData.winner = fixture.teamA;
        updateData.status = 'completed';
      } else if (teamBWins >= setsNeededToWin) {
        const fixture = await Fixture.findById(fixtureId);
        updateData.winner = fixture.teamB;
        updateData.status = 'completed';
      } else if (completedSets.length > 0) {
        updateData.status = 'ongoing';
      }
    }

    // Validate match config fields
    if (updateData.pointsToWin !== undefined) {
      updateData.pointsToWin = Math.max(1, parseInt(updateData.pointsToWin) || 30);
    }
    if (updateData.decidingPoint !== undefined) {
      updateData.decidingPoint = Math.max(1, parseInt(updateData.decidingPoint) || 50);
    }
    if (updateData.courtNumber !== undefined) {
      updateData.courtNumber = Math.max(1, parseInt(updateData.courtNumber) || 1);
    }

    // Legacy support: If both scores provided and winner not explicitly set, derive winner
    if (
      updateData.scoreA !== undefined &&
      updateData.scoreB !== undefined &&
      updateData.winner === undefined
    ) {
      const scoreA = Number(updateData.scoreA);
      const scoreB = Number(updateData.scoreB);
      if (!isNaN(scoreA) && !isNaN(scoreB) && scoreA !== scoreB) {
        updateData.winner = scoreA > scoreB ? req.body.teamA : req.body.teamB;
      }
    }

    const updated = await Fixture.findByIdAndUpdate(fixtureId, updateData, {
      new: true,
      runValidators: true
    }).populate("teamA teamB winner");

    if (!updated)
      return res.json({ success: false, message: "Fixture not found" });

    // Propagate winner to next round if winner is set
    const winnerId = updated.winner;
    if (winnerId) {
      try {
        const nextFilter = {
          tournament: updated.tournament,
          event: updated.event,
          round: updated.round + 1,
          matchIndex: Math.floor(updated.matchIndex / 2),
        };

        const nextFix = await Fixture.findOne(nextFilter);
        if (nextFix) {
          if (updated.matchIndex % 2 === 0) {
            nextFix.teamA = winnerId;
          } else {
            nextFix.teamB = winnerId;
          }
          await nextFix.save();
        }
      } catch (err) {
        console.log("Error propagating winner:", err);
      }
    }

    return res.json({ success: true, fixture: updated });
  } catch (error) {
    console.log("Error in updateFixture:", error);
    return res.json({ success: false, message: "Error updating fixture: " + error.message });
  }
};

// POST /api/organizer/fixtures/:tournamentId/create
export const createFixture = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { 
      eventId, 
      round, 
      matchIndex, 
      roundNumber, 
      matchNumber, 
      scheduledAt, 
      teamA, 
      teamB, 
      sets, 
      maxSets,
      pointsToWin,
      isDeuce,
      decidingPoint,
      courtNumber,
      isScheduled,
      status,
      phase
    } = req.body;

    if (!isValidId(tournamentId)) {
      return res.json({ success: false, message: "Invalid tournament ID" });
    }

    const Fixture = await getFixtureModel();

    const newFixture = new Fixture({
      tournament: tournamentId,
      event: eventId || null,
      round: round !== undefined ? round : (roundNumber || 0),
      matchIndex: matchIndex !== undefined ? matchIndex : (matchNumber ? matchNumber - 1 : 0),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      teamA: teamA || null,
      teamB: teamB || null,
      status: status || "scheduled",
      phase: phase || "ko",
      sets: sets || [],
      maxSets: maxSets || 3,
      pointsToWin: pointsToWin || 30,
      isDeuce: isDeuce !== undefined ? isDeuce : true,
      decidingPoint: decidingPoint || 50,
      courtNumber: courtNumber || 1,
      isScheduled: isScheduled !== undefined ? isScheduled : true
    });

    await newFixture.save();
    
    const populatedFixture = await newFixture.populate("teamA teamB winner");

    console.log('Created fixture with full config:', populatedFixture);

    return res.json({
      success: true,
      fixture: populatedFixture
    });
  } catch (error) {
    console.log("Error in createFixture:", error);
    return res.json({ success: false, message: "Error creating fixture" });
  }
};

// POST /api/organizer/fixtures/:tournamentId/generate
export const generateFixtures = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { eventId, force = false, seedOrder = [] } = req.body || {};

    if (!isValidId(tournamentId)) {
      return res.json({ success: false, message: "Invalid tournament id" });
    }

    const tournament = await Tournament.findById(tournamentId).populate("teams");
    if (!tournament) {
      return res.json({ success: false, message: "Tournament not found" });
    }

    let participants = [];
    if (eventId && isValidId(eventId)) {
      const event = await Events.findById(eventId);
      if (!event)
        return res.json({ success: false, message: "Event not found" });

      if (event.eventType2 === "individual") {
        const inds = await TeamIndividual.find({ tournamentId, eventId });
        participants = inds.map((p) => p._id.toString());
      } else if (event.eventType2 === "group") {
        const grps = await TeamGroup.find({ tournamentId, eventId }).lean();
        participants = grps.map((g) => g._id.toString());
      }
    }

    if (!participants.length) {
      // fallback to tournament teams
      participants = tournament.teams.map((t) => t._id.toString());
    }

    if (participants.length < 2) {
      return res.json({
        success: false,
        message: "Need at least 2 participants to generate fixtures",
      });
    }

    // Determine the match type for the event
    const evtMatchType = eventId ? (await Events.findById(eventId))?.matchType?.toLowerCase() : null;
    const isRoundRobin = evtMatchType?.includes("round-robin");
    const isHybridRRKO = evtMatchType === "round-robin-knockout";

    const Fixture = await getFixtureModel();

    if (isRoundRobin) {
      // Round-Robin Generation Logic
      if (force) {
        await Fixture.deleteMany({
          tournament: tournamentId,
          ...(eventId ? { event: eventId } : {}),
          phase: "ko",
        });
      }

      await Fixture.deleteMany({
        tournament: tournamentId,
        ...(eventId ? { event: eventId } : {}),
        $or: [{ phase: "rr" }, { phase: { $exists: false } }, { phase: null }],
      });

      // Round-Robin generation code
      let arr = [...participants];
      if (arr.length % 2 === 1) arr.push(null);
      const totalRounds = arr.length - 1;
      const matchesPerRound = arr.length / 2;
      const docs = [];

      for (let round = 0; round < totalRounds; round++) {
        for (let i = 0; i < matchesPerRound; i++) {
          const teamA = arr[i];
          const teamB = arr[arr.length - 1 - i];
          if (teamA === null || teamB === null) continue;

          docs.push({
            tournament: tournamentId,
            event: eventId,
            round,
            roundName: `Matchday ${round + 1}`,
            matchIndex: i,
            teamA,
            teamB,
            phase: "rr",
            status: "scheduled",
            sets: [],
            maxSets: 3
          });
        }
        const last = arr.pop();
        arr.splice(1, 0, last);
      }

      const created = await Fixture.insertMany(docs);
      return res.json({ success: true, fixtures: created });
    }

    // Knockout Generation
    if (Array.isArray(seedOrder) && seedOrder.length >= 2) {
      // retain provided order and append any missing ids randomly
      const remaining = participants.filter((id) => !seedOrder.includes(id));
      remaining.sort(() => 0.5 - Math.random());
      participants = [...seedOrder, ...remaining];
    } else {
      participants = participants.sort(() => 0.5 - Math.random());
    }
    const nextPower = Math.pow(2, Math.ceil(Math.log2(participants.length)));
    while (participants.length < nextPower) participants.push(null);

    await Fixture.deleteMany({
      tournament: tournamentId,
      ...(eventId ? { event: eventId } : {}),
    });

    const totalRounds = Math.log2(nextPower);
    const docs = [];
    let current = participants;
    let round = 0;

    while (current.length > 1) {
      for (let i = 0; i < current.length; i += 2) {
        docs.push({
          tournament: tournamentId,
          event: eventId,
          round,
          roundName: getRoundName(round, totalRounds),
          matchIndex: i / 2,
          teamA: current[i],
          teamB: current[i + 1],
          phase: "ko",
          status: "scheduled",
          sets: [],
          maxSets: 3
        });
      }
      current = new Array(current.length / 2).fill(null);
      round += 1;
    }

    const created = await Fixture.insertMany(docs);
    return res.json({ success: true, fixtures: created });
  } catch (error) {
    console.log("Error in generateFixtures:", error);
    return res.json({ success: false, message: "Error generating fixtures" });
  }
};

// GET /api/organizer/fixtures/:tournamentId/standings
export const getStandings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { eventId } = req.query || {};

    if (!isValidId(tournamentId)) {
      return res.json({ success: false, message: "Invalid tournament id" });
    }

    const Fixture = await getFixtureModel();
    const filter = { tournament: tournamentId };
    if (eventId && isValidId(eventId)) filter.event = eventId;

    // For hybrid events, only consider round-robin fixtures for standings
    if (eventId && isValidId(eventId)) {
      const event = await Events.findById(eventId);
      if (event && event.matchType === "round-robin-knockout") {
        filter.$or = [{ phase: "rr" }, { phase: { $exists: false } }, { phase: null }];
      }
    }

    const fixtures = await Fixture.find(filter);

    // stats map
    const stats = {};
    const ensure = (id) => {
      if (!id) return;
      if (!stats[id])
        stats[id] = {
          teamId: id,
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        };
    };

    fixtures.forEach((fx) => {
      if (fx.scoreA == null || fx.scoreB == null) return; // result not entered
      const a = fx.teamA?.toString();
      const b = fx.teamB?.toString();
      ensure(a);
      ensure(b);
      if (!a || !b) return;

      const sA = Number(fx.scoreA);
      const sB = Number(fx.scoreB);

      stats[a].played += 1;
      stats[b].played += 1;
      stats[a].goalsFor += sA;
      stats[a].goalsAgainst += sB;
      stats[b].goalsFor += sB;
      stats[b].goalsAgainst += sA;

      if (sA === sB) {
        stats[a].draw += 1;
        stats[b].draw += 1;
        stats[a].points += 1;
        stats[b].points += 1;
      } else if (sA > sB) {
        stats[a].won += 1;
        stats[b].lost += 1;
        stats[a].points += 3;
      } else {
        stats[b].won += 1;
        stats[a].lost += 1;
        stats[b].points += 3;
      }
    });

    const standings = Object.values(stats).sort((x, y) => {
      if (y.points !== x.points) return y.points - x.points;
      const gdY = y.goalsFor - y.goalsAgainst;
      const gdX = x.goalsFor - x.goalsAgainst;
      return gdY - gdX;
    });

    return res.json({ success: true, standings });
  } catch (error) {
    console.log("Error in getStandings:", error);
    return res.json({ success: false, message: "Error generating standings" });
  }
};

// Generate Knockout Stage after Round-Robin
export const generateKnockoutFromStandings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { eventId, qualifiers = 4 } = req.body;

    if (!isValidId(tournamentId) || !isValidId(eventId)) {
      return res.json({ success: false, message: "Invalid IDs" });
    }

    const event = await Events.findById(eventId);
    if (!event || !(event.matchType?.includes("round-robin") && event.matchType?.includes("knockout"))) {
      return res.json({ success: false, message: "Event is not RR+KO" });
    }

    const Fixture = await getFixtureModel();

    const rrFixtures = await Fixture.find({
      tournament: tournamentId,
      event: eventId,
      $or: [{ phase: "rr" }, { phase: { $exists: false } }, { phase: null }],
    });

    if (!rrFixtures.length) {
      return res.json({ success: false, message: "No round-robin fixtures found" });
    }

    // Compute standings (same logic as getStandings)
    const stats = {};
    const ensure = (id) => {
      if (!id) return;
      if (!stats[id]) stats[id] = { teamId: id, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
    };

    rrFixtures.forEach((fx) => {
      if (fx.scoreA == null || fx.scoreB == null) return;
      const a = fx.teamA?.toString();
      const b = fx.teamB?.toString();
      ensure(a);
      ensure(b);
      if (!a || !b) return;

      const sA = Number(fx.scoreA);
      const sB = Number(fx.scoreB);

      stats[a].played += 1;
      stats[b].played += 1;
      stats[a].goalsFor += sA;
      stats[a].goalsAgainst += sB;
      stats[b].goalsFor += sB;
      stats[b].goalsAgainst += sA;

      if (sA === sB) {
        stats[a].draw += 1; stats[b].draw += 1; stats[a].points += 1; stats[b].points += 1;
      } else if (sA > sB) {
        stats[a].won += 1; stats[b].lost += 1; stats[a].points += 3;
      } else {
        stats[b].won += 1; stats[a].lost += 1; stats[b].points += 3;
      }
    });

    const standings = Object.values(stats).sort((x,y)=> y.points - x.points || (y.goalsFor - y.goalsAgainst) - (x.goalsFor - x.goalsAgainst));

    const qualifiedIds = standings.slice(0, qualifiers).map((s)=> s.teamId);
    if (qualifiedIds.length < 2) {
      return res.json({ success:false, message:`Need at least 2 qualified teams, got ${qualifiedIds.length}` });
    }

    // Determine new round index after RR
    const lastRR = await Fixture.findOne({ tournament: tournamentId, event: eventId, phase: "rr" }).sort({ round: -1 });
    const startRound = lastRR ? lastRR.round + 1 : 0;

    // Clear existing knockout fixtures for this event beyond startRound
    await Fixture.deleteMany({ tournament: tournamentId, event: eventId, round: { $gte: startRound }, phase: "ko" });

    // Order seeds for balanced bracket
    const participantsArr = [];
    let l = 0, r = qualifiedIds.length - 1;
    while (l <= r) {
      participantsArr.push(qualifiedIds[l]);
      if (l !== r) participantsArr.push(qualifiedIds[r]);
      l++; r--;
    }

    // pad to next power of two with null byes
    const nextPow = Math.pow(2, Math.ceil(Math.log2(participantsArr.length)));
    while (participantsArr.length < nextPow) participantsArr.push(null);

    const totalRoundsKO = Math.log2(nextPow);
    const docs = [];
    let current = participantsArr;
    let relRound = 0;

    while (current.length > 1) {
      for (let i = 0; i < current.length; i += 2) {
        docs.push({
          tournament: tournamentId,
          event: eventId,
          round: startRound + relRound,
          roundName: getRoundName(relRound, totalRoundsKO),
          matchIndex: i / 2,
          teamA: current[i],
          teamB: current[i+1],
          phase: "ko",
          status: "scheduled",
          sets: [],
          maxSets: 3
        });
      }
      current = new Array(current.length / 2).fill(null);
      relRound += 1;
    }

    const created = await Fixture.insertMany(docs);
    return res.json({ success:true, fixtures: created });
  } catch (error) {
    console.log("Error in generateKnockoutFromStandings:", error);
    return res.json({ success:false, message:"Error creating knockout stage" });
  }
};
