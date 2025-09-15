import express from "express";
import {
  getTeams,
  getFixtures,
  generateFixtures,
  updateFixture,
  getStandings,
  generateKnockoutFromStandings,
  deleteKnockoutFixtures,
  createFixture,
} from "../../Controllers/Organizers/FixtureController.js";
import { organizerAuthMidlleware } from "../../Middlewares/jwtAuth.js";

const router = express.Router();

// GET list of teams for a tournament (for fixtures page)
router.get("/:tournamentId/teams", organizerAuthMidlleware, getTeams);

// GET all fixtures for a tournament
router.get("/:tournamentId", organizerAuthMidlleware, getFixtures);

// GET single fixture by ID (optional - for detailed fixture info)
router.get("/fixture/:fixtureId", organizerAuthMidlleware, async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const getFixtureModel = async () => {
      const module = await import("../../Models/Fixture/FixtureModel.js");
      return module.default;
    };
    
    const Fixture = await getFixtureModel();
    const fixture = await Fixture.findById(fixtureId).populate('teamA teamB winner');
    
    if (!fixture) {
      return res.json({ success: false, message: "Fixture not found" });
    }
    
    return res.json({ success: true, fixture });
  } catch (error) {
    console.log("Error fetching single fixture:", error);
    return res.json({ success: false, message: "Error fetching fixture" });
  }
});

// POST generate fixtures (supports both round-robin and knockout)
router.post(
  "/:tournamentId/generate",
  organizerAuthMidlleware,
  generateFixtures
);

// POST generate knockout stage after RR (for hybrid tournaments)
// DELETE knockout fixtures for a tournament/event
router.delete(
  "/:tournamentId/knockout",
  organizerAuthMidlleware,
  deleteKnockoutFixtures
);

// Generate knockout after standings
router.post(
  "/:tournamentId/generate-knockout",
  organizerAuthMidlleware,
  generateKnockoutFromStandings
);

// GET standings (round-robin) 
router.get("/:tournamentId/standings", organizerAuthMidlleware, getStandings);

// PUT update a particular fixture (SUPPORTS SETS DATA - key for match details modal)
router.put("/fixture/:fixtureId", organizerAuthMidlleware, updateFixture);

// POST create a new fixture for a tournament
router.post("/:tournamentId/create", organizerAuthMidlleware, createFixture);

export default router;
