import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.js";
import voteRoutes from "./routes/vote.js";
import electionRoutes from "./routes/election.js";
import adminRoutes from "./routes/admin.js";
import faceRoutes from "./routes/face.js";
import candidateRoutes from "./routes/candidates.js"

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/face", faceRoutes);
app.use("/api/candidates", candidateRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server alive" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));