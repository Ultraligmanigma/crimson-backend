const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const cors = require("cors");

// Supabase einrichten
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Route zum Testen von Supabase
app.get("/test", async (req, res) => {
  try {
    const { data, error } = await supabase.from("test_table").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route zum Prüfen, ob Backend läuft
app.get("/status", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

io.on("connection", (socket) => {
  console.log("Ein Benutzer ist verbunden!");
  socket.on("chat", (msg) => io.emit("chat", msg));
  socket.on("disconnect", () => console.log("Benutzer hat getrennt."));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server läuft auf Port ${PORT}`));
