const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const cors = require("cors");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== Routes =====

// Backend Status
app.get("/status", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Register
app.post("/register", async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Profil erstellen
    await supabase.from("profiles").insert([{ id: data.user.id, username }]);
    res.json({ success: true, user: data.user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    res.json({ success: true, user: data.user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Chat (Socket.io)
let onlineUsers = {};
io.on("connection", (socket) => {
  console.log("Ein Benutzer ist verbunden!");

  socket.on("join", (username) => {
    onlineUsers[socket.id] = username;
    io.emit("updateUsers", Object.values(onlineUsers));
  });

  socket.on("chat", (msg) => {
    io.emit("chat", msg);
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("updateUsers", Object.values(onlineUsers));
    console.log("Benutzer hat getrennt.");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server läuft auf Port ${PORT}`));
