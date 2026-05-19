import jwt from "jsonwebtoken";

export const authenticateStudent = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "student") return res.status(403).json({ success: false, message: "Forbidden" });
    req.user = decoded; // NO CHANGE HERE
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });
    req.user = decoded; // NO CHANGE HERE
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};