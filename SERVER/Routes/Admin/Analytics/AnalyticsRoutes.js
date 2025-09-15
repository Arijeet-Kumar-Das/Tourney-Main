import express from "express";
import analyticsController from "../../../Controllers/Admin/AnalyticsController.js";

const router = express.Router();

// ---- Analytics Endpoints ----
router.get("/live-visitors", analyticsController.getLiveVisitors);
router.get("/ticket-sales", analyticsController.getTicketSales);
router.get("/revenue", analyticsController.getRevenue);
router.get("/ticket-sales-list", analyticsController.getTicketSalesList);
router.get("/verification-stats", analyticsController.getVerificationStats);

export default router;
