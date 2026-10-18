import http from "node:http";
import express from "express";
import healthRoutes from "../backend/routes/healthRoutes";
import { notFoundHandler, errorHandler } from "../backend/middleware/errorMiddleware";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", healthRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(5001, () => {
  http.get("http://localhost:5001/api/health", (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("Status Code:", res.statusCode);
      console.log("Response Body:", body);
      const data = JSON.parse(body);
      console.log("Success Flag:", data.success);
      console.log("Message:", data.message);
      server.close(() => process.exit(0));
    });
  });
});
