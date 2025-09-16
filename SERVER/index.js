// import playerRoutes from './Routes/Player/playerRoutes.js';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectMongoDB } from './Config/Connection.js';

import bookingRoutes from './Routes/Player/bookingRoutes.js';
import OrganizerRoute from './Routes/Organizer/OrganizerRoute.js';
import PlayerRoute from './Routes/Player/PlayerRoute.js';
import adminRoutes from './Routes/Admin/AdminRoutes.js';
import paymentRoutes from './Routes/Player/paymentRoute.js';

const app = express();

// ---- HTTP & Socket.IO setup for live visitors ----
const server = http.createServer(app);
let io; // will be initialised after CORS options
// Global counter accessible across controllers
global.activeConnections = 0;
const PORT = process.env.PORT || 8000;

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: [
    process.env.FRONT_END_URL,
  ],
  methods: "GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS",
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

app.use(cors(corsOptions));

// Now that corsOptions is defined we can attach Socket.IO
io = new SocketIOServer(server, { cors: corsOptions });

io.on("connection", (socket) => {
  global.activeConnections += 1;
  socket.on("disconnect", () => {
    global.activeConnections = Math.max(0, global.activeConnections - 1);
  });
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

connectMongoDB(process.env.MONGODB_URI)
  .then(() => {
    console.log(`✅ MongoDB Connected`);
  })
  .catch((error) => {
    console.log(`❌ DB Connection Error: ${error}`);
  });

// API routes
app.use("/api/player/bookings", bookingRoutes);
app.use("/api/organizer", OrganizerRoute);
app.use("/api/player", PlayerRoute);
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../CLIENT", "dist");
  app.use(express.static(clientPath));

  // Fallback for SPA routing
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(clientPath, "index.html"));
  });
} else {
  // Dev health check route
  app.get("/", (req, res) => {
    res.send("<h1>Backend Running in Development Mode 🚀</h1>");
  });
}

server.listen(PORT, () => {
  console.log(
    `🚀 Server started on PORT ${PORT} (${process.env.NODE_ENV}) → http://localhost:${PORT}`
  );
});
