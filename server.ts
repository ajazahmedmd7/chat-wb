import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { createServer as createViteServer } from "vite";

const __dirname = process.cwd();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Ensure uploads and data directories exist
const uploadDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.use("/uploads", express.static(uploadDir));

// Multer storage for secure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Database JSON setup
const dbFile = path.join(dataDir, "messenger_db.json");

interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'document' | 'audio';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: { id: string; content: string; sender: string };
  editedAt?: string;
  deletedAt?: string;
  reactions: Record<string, string[]>; // emoji -> userIds
  readBy: string[];
  pinned?: boolean;
  isGhost?: boolean;
  timestamp: string;
}

interface DB {
  messages: Message[];
  status: {
    virat: { online: boolean; lastSeen: string };
    hardhik: { online: boolean; lastSeen: string };
  };
}

function getDB(): DB {
  let db: DB = {
    messages: [],
    status: {
      virat: { online: false, lastSeen: new Date().toISOString() },
      hardhik: { online: false, lastSeen: new Date().toISOString() }
    }
  };
  if (fs.existsSync(dbFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(dbFile, "utf-8"));
      if (parsed) {
        if (Array.isArray(parsed.messages)) db.messages = parsed.messages;
        if (parsed.status) {
          if (parsed.status.virat) db.status.virat = parsed.status.virat;
          if (parsed.status.hardhik) db.status.hardhik = parsed.status.hardhik;
        }
      }
    } catch (e) {
      console.error("Error reading db file, using default", e);
    }
  }
  return db;
}

function saveDB(data: DB) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// Users definition (ONLY TWO USERS: Virat 0310 and Hardhik 0303)
const USERS: Record<string, { id: string; name: string; code: string; avatar: string }> = {
  "0310": {
    id: "virat",
    name: "Virat",
    code: "0310",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  "0303": {
    id: "hardhik",
    name: "Hardhik",
    code: "0303",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  }
};

// API: Login verification (without exposing code in response)
app.post("/api/login", (req, res) => {
  const { code } = req.body;
  if (!code || !USERS[code]) {
    return res.status(401).json({ error: "Access Denied. Invalid security code." });
  }
  const u = USERS[code];
  const user = { id: u.id, name: u.name, avatar: u.avatar };
  res.json({ success: true, user });
});

// API: File Upload
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype
  });
});

// API: Get messages & initial status
app.get("/api/data", (req, res) => {
  const db = getDB();
  res.json(db);
});

// Track active socket connections by user
const activeSockets: Record<string, string> = {}; // userId -> socketId

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (userId: string) => {
    if (userId !== "virat" && userId !== "hardhik") return;
    activeSockets[userId] = socket.id;
    socket.join("private_room");

    const db = getDB();
    if (!db.status) db.status = { virat: { online: false, lastSeen: new Date().toISOString() }, hardhik: { online: false, lastSeen: new Date().toISOString() } };
    if (!db.status[userId as 'virat' | 'hardhik']) {
      db.status[userId as 'virat' | 'hardhik'] = { online: false, lastSeen: new Date().toISOString() };
    }
    db.status[userId as 'virat' | 'hardhik'].online = true;
    saveDB(db);

    io.to("private_room").emit("status_update", db.status);
    console.log(`${userId} joined room`);
  });

  socket.on("send_message", (msgData: {
    sender: string;
    recipient: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'pdf' | 'document' | 'audio';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyTo?: { id: string; content: string; sender: string };
    isGhost?: boolean;
  }) => {
    const db = getDB();
    const newMessage: Message = {
      id: uuidv4(),
      sender: msgData.sender,
      recipient: msgData.recipient,
      content: msgData.content,
      type: msgData.type || 'text',
      fileUrl: msgData.fileUrl,
      fileName: msgData.fileName,
      fileSize: msgData.fileSize,
      replyTo: msgData.replyTo,
      reactions: {},
      readBy: [msgData.sender],
      isGhost: msgData.isGhost || false,
      timestamp: new Date().toISOString()
    };

    db.messages.push(newMessage);
    saveDB(db);

    io.to("private_room").emit("new_message", newMessage);
  });

  socket.on("exit_ghost_mode", ({ userId }: { userId: string }) => {
    const db = getDB();
    db.messages = db.messages.filter(m => !m.isGhost);
    saveDB(db);
    io.to("private_room").emit("chat_cleared", { messages: db.messages });
  });

  socket.on("edit_message", ({ messageId, newContent, userId }: { messageId: string; newContent: string; userId: string }) => {
    const db = getDB();
    const msg = db.messages.find(m => m.id === messageId);
    if (msg && msg.sender === userId && !msg.deletedAt) {
      msg.content = newContent;
      msg.editedAt = new Date().toISOString();
      saveDB(db);
      io.to("private_room").emit("message_edited", { messageId, newContent, editedAt: msg.editedAt });
    }
  });

  socket.on("delete_message", ({ messageId, userId }: { messageId: string; userId: string }) => {
    const db = getDB();
    const msg = db.messages.find(m => m.id === messageId);
    if (msg && msg.sender === userId) {
      msg.deletedAt = new Date().toISOString();
      msg.content = "This message was deleted";
      saveDB(db);
      io.to("private_room").emit("message_deleted", { messageId, deletedAt: msg.deletedAt });
    }
  });

  socket.on("toggle_reaction", ({ messageId, emoji, userId }: { messageId: string; emoji: string; userId: string }) => {
    const db = getDB();
    const msg = db.messages.find(m => m.id === messageId);
    if (msg) {
      if (!msg.reactions[emoji]) {
        msg.reactions[emoji] = [];
      }
      const idx = msg.reactions[emoji].indexOf(userId);
      if (idx > -1) {
        msg.reactions[emoji].splice(idx, 1);
        if (msg.reactions[emoji].length === 0) {
          delete msg.reactions[emoji];
        }
      } else {
        msg.reactions[emoji].push(userId);
      }
      saveDB(db);
      io.to("private_room").emit("reaction_updated", { messageId, reactions: msg.reactions });
    }
  });

  socket.on("toggle_pin", ({ messageId }: { messageId: string }) => {
    const db = getDB();
    const msg = db.messages.find(m => m.id === messageId);
    if (msg) {
      msg.pinned = !msg.pinned;
      saveDB(db);
      io.to("private_room").emit("message_pinned", { messageId, pinned: msg.pinned });
    }
  });

  socket.on("clear_chat_timed", ({ hours, userId }: { hours: number | 'all'; userId: string }) => {
    const db = getDB();
    const now = new Date().getTime();

    if (hours === 'all') {
      db.messages = [];
    } else {
      const threshold = now - (hours * 60 * 60 * 1000);
      db.messages = db.messages.filter(m => {
        const msgTime = new Date(m.timestamp).getTime();
        return msgTime < threshold;
      });
    }

    saveDB(db);
    io.to("private_room").emit("chat_cleared", { messages: db.messages });
  });

  socket.on("typing", ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
    socket.to("private_room").emit("user_typing", { userId, isTyping });
  });

  socket.on("mark_read", ({ userId }: { userId: string }) => {
    const db = getDB();
    let updated = false;
    db.messages.forEach(m => {
      if (m.recipient === userId && !m.readBy.includes(userId)) {
        m.readBy.push(userId);
        updated = true;
      }
    });
    if (updated) {
      saveDB(db);
      io.to("private_room").emit("messages_read", { userId });
    }
  });

  // WebRTC Signaling
  socket.on("call_user", (data: { caller: string; recipient: string; callType: 'voice' | 'video'; signal: any }) => {
    const targetSocketId = activeSockets[data.recipient];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming_call", {
        caller: data.caller,
        callType: data.callType,
        signal: data.signal
      });
    }
  });

  socket.on("accept_call", (data: { to: string; signal: any }) => {
    const targetSocketId = activeSockets[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_accepted", { signal: data.signal });
    }
  });

  socket.on("reject_call", (data: { to: string }) => {
    const targetSocketId = activeSockets[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_rejected");
    }
  });

  socket.on("end_call", (data: { to: string }) => {
    const targetSocketId = activeSockets[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_ended");
    }
  });

  socket.on("webrtc_ice", (data: { to: string; candidate: any }) => {
    const targetSocketId = activeSockets[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc_ice", { candidate: data.candidate });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    let disconnectedUser: string | null = null;
    for (const [userId, sId] of Object.entries(activeSockets)) {
      if (sId === socket.id) {
        disconnectedUser = userId;
        delete activeSockets[userId];
        break;
      }
    }
    if (disconnectedUser && (disconnectedUser === 'virat' || disconnectedUser === 'hardhik')) {
      const db = getDB();
      if (!db.status) db.status = { virat: { online: false, lastSeen: new Date().toISOString() }, hardhik: { online: false, lastSeen: new Date().toISOString() } };
      if (!db.status[disconnectedUser as 'virat' | 'hardhik']) {
        db.status[disconnectedUser as 'virat' | 'hardhik'] = { online: false, lastSeen: new Date().toISOString() };
      }
      db.status[disconnectedUser as 'virat' | 'hardhik'].online = false;
      db.status[disconnectedUser as 'virat' | 'hardhik'].lastSeen = new Date().toISOString();
      saveDB(db);
      io.to("private_room").emit("status_update", db.status);
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
