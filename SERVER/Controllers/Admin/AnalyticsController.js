import PlayerModel from "../../Models/Player/PlayerModel.js";
import TeamIndividual from "../../Models/Organizer/TeamIndividual.js";
import TeamGroup from "../../Models/Organizer/TeamGroup.js";

// Helper to compute a JS Date object representing the beginning of range
function getRangeStart(range) {
  const now = new Date();
  switch (range) {
    case "day":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      // beginning of current week (last 7 days)
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

const analyticsController = {
  // ---------------------- LIVE VISITORS ----------------------
  // For MVP we return a placeholder 0. Integrate with socket or third-party later.
  getLiveVisitors: async (req, res) => {
    try {
      const liveVisitors = global.activeConnections || 0;
      res.status(200).json({ success: true, data: { liveVisitors } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ---------------------- TICKET SALES ----------------------
  getTicketSales: async (req, res) => {
    try {
      const { range = "day" } = req.query;
      const start = getRangeStart(range);
      const isoStart = start.toISOString();

      const countIndividual = await TeamIndividual.countDocuments({
        dateAndTime: { $gte: isoStart },
      });
      const countGroup = await TeamGroup.countDocuments({
        dateAndTime: { $gte: isoStart },
      });

      const sold = countIndividual + countGroup;
      res.status(200).json({ success: true, data: { range, sold } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ---------------------- REVENUE ----------------------
  getRevenue: async (req, res) => {
    try {
      const { range = "day" } = req.query;
      const start = getRangeStart(range);
      const isoStart = start.toISOString();

      const pipeline = [
        { $match: { dateAndTime: { $gte: isoStart } } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        { $group: { _id: null, gross: { $sum: "$event.entryFee" } } },
      ];

      const [revInd] = await TeamIndividual.aggregate(pipeline);
      const [revGroup] = await TeamGroup.aggregate(pipeline);

      const gross = (revInd?.gross || 0) + (revGroup?.gross || 0);
      const commissionRate = 0.1;
      const net = gross * (1 - commissionRate);
      res.status(200).json({ success: true, data: { range, gross, net } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ---------------------- VERIFICATION STATS ----------------------
  getVerificationStats: async (req, res) => {
    try {
      const verified = await PlayerModel.countDocuments({ aadhaarImage: { $ne: "" } });
      const total = await PlayerModel.estimatedDocumentCount();
      res.status(200).json({ success: true, data: { verified, unverified: total - verified } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ---------------------- TICKET SALES LIST ----------------------
  getTicketSalesList: async (req, res) => {
    try {
      const { range = "month" } = req.query;
      const start = getRangeStart(range);
      const isoStart = start.toISOString();

      const indPipeline = [
        { $match: { dateAndTime: { $gte: isoStart } } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        {
          $project: {
            _id: 0,
            date: "$dateAndTime",
            eventName: "$event.name",
            entryFee: "$event.entryFee",
            teamName: "$name",
            type: { $literal: "Individual" },
          },
        },
      ];

      const grpPipeline = [
        { $match: { dateAndTime: { $gte: isoStart } } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        {
          $project: {
            _id: 0,
            date: "$dateAndTime",
            eventName: "$event.name",
            entryFee: "$event.entryFee",
            teamName: "$teamName",
            type: { $literal: "Group" },
          },
        },
      ];

      const [indList, grpList] = await Promise.all([
        TeamIndividual.aggregate(indPipeline),
        TeamGroup.aggregate(grpPipeline),
      ]);

      const list = [...indList, ...grpList].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      res.status(200).json({ success: true, data: { range, list } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default analyticsController;
