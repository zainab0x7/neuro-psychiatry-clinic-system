import http from "node:http";
import app from "../backend/server";

const PORT = 5000;

function testHealthEndpoint() {
  const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("Status Code:", res.statusCode);
      console.log("Response Body:", body);
      try {
        const parsed = JSON.parse(body);
        console.log("Success Check:", parsed.success === true);
        console.log("Message Check:", parsed.message === "Psychiatry EMR Backend is running");
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
      process.exit(0);
    });
  });

  req.on("error", (err) => {
    console.error("HTTP GET Error:", err);
    process.exit(1);
  });
}

// Give server 1 second to start listening
setTimeout(testHealthEndpoint, 1500);
