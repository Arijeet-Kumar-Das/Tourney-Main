import express from "express";
import adminController from "../../Controllers/Admin/AdminController.js";
import {
  verifyAdminToken,
  logAdminActivity,
} from "../../Middlewares/authMiddleware.js";
import analyticsRouter from "./Analytics/AnalyticsRoutes.js";
import sliderController from "../../Controllers/Admin/SliderController.js";
import upload from "../../Middlewares/uploadMiddleware.js";

const router = express.Router();

// Public slider images route (no auth)
router.get("/slider", sliderController.getImages);

// Keep analytics open (no auth) but secure all other admin routes
router.use("/analytics", analyticsRouter);


router.post("/organizers/:id/impersonate", adminController.impersonateOrganizer);

// Authentication middleware for remaining admin routes
router.use(verifyAdminToken);
router.use(logAdminActivity);

// ==================== DASHBOARD ROUTES ====================
router.get("/dashboard", adminController.getDashboardOverview);

// ==================== TOTAL COUNTS ROUTES ====================
router.get("/total-organizations", adminController.getTotalOrganizations);
router.get("/total-tournaments", adminController.getTotalTournaments);
router.get("/total-events", adminController.getTotalEvents);
router.get("/total-players", adminController.getTotalPlayers);

// ==================== ORGANIZER ROUTES ====================
router.post("/organizers", adminController.createOrganizer);
router.get("/organizers", adminController.getAllOrganizers);

// ⚠️ IMPORTANT: Put specific routes BEFORE parameterized routes
router.get(
  "/organizers/pending-approvals",
  adminController.getPendingAdminApprovals
);

router.get("/organizers/:id", adminController.getOrganizerById);
router.put("/organizers/:id", adminController.updateOrganizer);
router.delete("/organizers/:id", adminController.deleteOrganizer);

// Email verification route
router.post("/organizers/:id/verify", adminController.verifyOrganizerAccount);

// NEW: Admin approval routes
router.post("/organizers/:id/approve", adminController.approveOrganizerByAdmin);
router.post(
  "/organizers/:id/revoke-approval",
  adminController.revokeAdminApproval
);

// Impersonation route

// ==================== PLAYER ROUTES ====================
router.post("/players", adminController.createPlayer);
router.get("/players", adminController.getAllPlayers);

// ⚠️ IMPORTANT: Put stats route BEFORE parameterized routes
router.get("/players/stats", adminController.getPlayerStats);
router.post("/players/:id/approve", adminController.approvePlayerByAdmin);
router.post("/players/:id/revoke", adminController.revokePlayerApproval);

router.get("/players/:id", adminController.getPlayerById);
router.put("/players/:id", adminController.updatePlayer);
router.delete("/players/:id", adminController.deletePlayer);

// ==================== TOURNAMENT ROUTES ====================
router.get("/tournaments", adminController.getAllTournaments);
router.get("/tournaments/:id", adminController.getTournamentById);
router.post("/tournaments/:id/approve", adminController.approveTournament);
router.post("/tournaments/:id/reject", adminController.rejectTournament);
router.post("/tournaments/:id/feature", adminController.toggleFeaturedTournament);
router.delete("/tournaments/:id", adminController.deleteTournament);

// ==================== SLIDER ROUTES ====================
router.post("/slider/upload", upload.single("image"), sliderController.uploadImage);
// duplicate removed
router.delete("/slider/:id", sliderController.deleteImage);
router.post("/slider/:id/toggle", sliderController.toggleActive);

export default router;
