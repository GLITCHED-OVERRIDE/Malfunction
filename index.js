import express from "express";
import http from "node:http";
import { createBareServer } from "@tomphttp/bare-server-node";
import cors from "cors";
import path from "path";
import { hostname } from "node:os";

const __dirname = process.cwd();

const server = http.createServer();
const app = express();
const bareServer = createBareServer("/b/");

/* ================= Middleware ================= */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= Bare routing ================= */

server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
    return;
  }
  app(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

/* ================= App routes ================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= Start ================= */

const PORT = 3000;

server.listen(PORT, () => {
  const address = server.address();
  console.log("Listening on:");
  console.log(`  http://localhost:${address.port}`);
  console.log(`  http://${hostname()}:${address.port}`);
});

/* ================= Shutdown ================= */

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("Shutting down server...");
  server.close();
  bareServer.close();
  process.exit(0);
}
