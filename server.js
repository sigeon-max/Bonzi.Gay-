import express from "express";
import { createRequire } from "node:module";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import socketIo from "socket.io";

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = Number(process.env.PORT) || 3000;
const fishKey = process.env.FISH_KEY?.trim();
const root = path.dirname(fileURLToPath(import.meta.url));
const rooms = new Map();
const normalColors = [
	"purple", "blue", "green", "yellow", "red", "pink", "brown", "black",
	"cyan", "white", "chartreuse", "jew", "patrick", "lightbulb", "martian",
	"grinnyboi", "yume", "k1o", "izhan", "greenincredible", "hurtpurple", "thxrobot",
];
const specialColors = ["blessed", "glow", "noob", "gold", "lavenderribbon", "spongebob", "facty", "peedy", "genie", "merlin", "robby", "clippit"];

app.use(express.static(root));
app.use(express.json({ limit: "16kb" }));

if (!fishKey) {
	console.warn("FISH_KEY is not configured; Fish Audio voices will be unavailable.");
}

const spanishVoices = new Set([
	"f53102becdf94a51af6d64010bc658f2",
	"73d6070a1b8941a6b580550c9e016069",
	"acd7a95d3bae4fe3a5f32d978bcb2b38",
	"cceb4a19d86448d6afd30833c88f5236",
]);
const fishVoiceIds = new Set([
	"8d21b053e2804e2a890e1cf62f267b6f",
	"1cce3befe11b403dae82415887667998",
	"f53102becdf94a51af6d64010bc658f2",
	"a3b3f0a9c49340bd8fa722d83c81cb08",
	"98655a12fa944e26b274c535e5e03842",
	"d75c270eaee14c8aa1e9e980cc37cf1b",
	"f5c358ec0728497c90fcf33b89b4f219",
	"8fb497dbf39d4da2baed6917deb88a24",
	"73d6070a1b8941a6b580550c9e016069",
	"acd7a95d3bae4fe3a5f32d978bcb2b38",
	"95603085b57f41868ae9c4175e1da3f7",
	"272d4b85659649a0b048c3ba650cf17a",
	"cceb4a19d86448d6afd30833c88f5236",
	"a2346273eb314b6cb82ba83dbc9d9fee",
	"53bd5738d58841d1b9a644da306c45a2",
	"0bfd5ff13ebc4a548c7f9b902965dd2b",
	"0852d11c7a644b5fb94d7e0e36aaa54a",
	"c21c125b6955478287b73632ea708d8f",
	"73a1ed580bd4488086c92aa314c9b5d8",
]);

function espeakVoice(voiceId) {
	if (spanishVoices.has(voiceId)) return "es";
	return "en/en-us";
}

// Pure-JS espeak (meSpeak) — no external binary or native build needed.
const require = createRequire(import.meta.url);
const mespeak = require("mespeak");
mespeak.loadConfig(require("mespeak/src/mespeak_config.json"));
mespeak.loadVoice(require("mespeak/voices/en/en-us.json"));
mespeak.loadVoice(require("mespeak/voices/es.json"));

function speakWithMespeak(text, voiceId, res) {
	try {
		const options = {
			rawdata: "buffer",
			voice: espeakVoice(voiceId),
			speed: 175,
			pitch: 50,
		};
		if (voiceId === "teto" || voiceId === "98655a12fa944e26b274c535e5e03842") options.variant = "f3";
		else if (voiceId === "f5c358ec0728497c90fcf33b89b4f219") options.variant = "f2";
		const wav = mespeak.speak(text, options);
		if (!wav || !wav.length) throw new Error("synthesis produced no audio");
		res.type("wav").send(wav);
	} catch (error) {
		console.error(`mespeak: ${error.message}`);
		if (!res.headersSent) res.status(500).json({ error: "TTS synthesis failed" });
	}
}

async function ttsHandler(req, res) {
	const text = String(req.body?.text || req.query.text || "").trim().slice(0, 1000);
	const voiceId = String(req.body?.voice_id || req.query.voice_id || "default");
	if (!text) return res.status(400).json({ error: "No text" });

	if (fishVoiceIds.has(voiceId)) {
		if (!fishKey) {
			return res.status(503).json({ error: "Fish Audio is not configured. Set FISH_KEY before starting the server." });
		}
		try {
			let fishResponse;
			for (let attempt = 0; attempt < 3; attempt++) {
				fishResponse = await fetch("https://api.fish.audio/v1/tts", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${fishKey}`,
						model: "s2.1-pro-free",
					},
					body: JSON.stringify({
						text,
						reference_id: voiceId,
						format: "mp3",
						normalize: true,
					}),
				});
				if (fishResponse.status !== 401 || attempt === 2) break;
				await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
			}
			if (fishResponse.ok) {
				res.type("audio/mpeg").send(Buffer.from(await fishResponse.arrayBuffer()));
				return;
			}
			const errText = await fishResponse.text();
			return res.status(502).json({ error: `fish.audio ${fishResponse.status}: ${errText.slice(0, 200)}` });
		} catch (error) {
			return res.status(502).json({ error: `upstream error: ${error.message}` });
		}
	}

	// speech.seedy.cc voices (selected via the Voice Pack dropdown) — stream the upstream WAV.
	if (voiceId.startsWith("seedy:")) {
		const seedyVoice = voiceId.slice("seedy:".length);
		if (!seedyVoice) return res.status(400).json({ error: "No seedy voice" });
		try {
			const seedyResponse = await fetch(`https://speech.seedy.cc/synthesize?voice=${encodeURIComponent(seedyVoice)}&text=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(30000) });
			if (seedyResponse.ok) {
				res.type("audio/wav").send(Buffer.from(await seedyResponse.arrayBuffer()));
				return;
			}
			const errText = await seedyResponse.text();
			return res.status(502).json({ error: `speech.seedy.cc ${seedyResponse.status}: ${errText.slice(0, 200)}` });
		} catch (error) {
			return res.status(502).json({ error: `upstream error: ${error.message}` });
		}
	}

	speakWithMespeak(text, voiceId, res);
}

// POST for the API contract; GET so <audio>/new Audio() can stream it directly.
app.post("/api/tts", ttsHandler);
app.get("/api/tts", ttsHandler);

// Proxy the speech.seedy.cc voice list (no CORS on the upstream, so the browser can't fetch it directly).
app.get("/api/seedy/voices", async (req, res) => {
	try {
		const r = await fetch("https://speech.seedy.cc/voices", { signal: AbortSignal.timeout(10000) });
		if (!r.ok) return res.status(502).json({ error: `speech.seedy.cc ${r.status}` });
		res.json(await r.json());
	} catch (error) {
		res.status(502).json({ error: `upstream error: ${error.message}` });
	}
});

function roomUsers(room) {
	return Object.fromEntries(
		[...room].map((client) => [client.id, client.userPublic])
	);
}

function broadcastRoom(room) {
	for (const client of room) {
		client.emit("updateAll", {
			me: client.id,
			usersPublic: roomUsers(room),
		});
	}
}

function findUser(room, value) {
	const query = String(value || "").toLowerCase();
	return [...room].find((client) =>
		client.id === value || client.userPublic.name.toLowerCase() === query
	);
}

function findUserById(room, id) {
	return [...room].find((client) => client.id === id);
}

function broadcastEvent(room, event, data) {
	for (const client of room) client.emit(event, data);
}

function randomColor() {
	return normalColors[Math.floor(Math.random() * normalColors.length)];
}

io.on("connection", (socket) => {
	socket.on("login", ({ name, room: requestedRoom, color, voice } = {}) => {
		const roomId = String(requestedRoom || "main").trim().slice(0, 32) || "main";
		const room = rooms.get(roomId) || new Set();
		const isOwner = room.size === 0;
		const userName = String(name || "Anonymous").trim().slice(0, 25) || "Anonymous";

		socket.join(roomId);
		socket.roomId = roomId;
		socket.isOwner = isOwner;
		socket.userPublic = {
			name: userName,
			color: normalColors.includes(color) || specialColors.includes(color) ? color : randomColor(),
			tag: "",
			speed: 175,
			pitch: 50,
			voice: typeof voice === "string" && voice.trim() ? voice.trim().slice(0, 100) : "en-us",
			typing: false,
		};
		room.add(socket);
		rooms.set(roomId, room);

		socket.emit("room", {
			room: roomId,
			isOwner: room.size === 1,
			isPublic: true,
		});
		broadcastRoom(room);
	});

	socket.on("typing", (typing) => {
		if (!socket.roomId || !socket.userPublic) return;
		socket.userPublic.typing = typing ? "typing..." : false;
		const room = rooms.get(socket.roomId);
		if (room) broadcastRoom(room);
	});

	socket.on("talk", ({ text, quote } = {}) => {
		if (!socket.roomId || !socket.userPublic) return;
		const room = rooms.get(socket.roomId);
		if (!room) return;
		for (const client of room) {
			client.emit("talk", { guid: socket.id, text: String(text || "").slice(0, 500), quote });
		}
	});

	socket.on("command", ({ list = [] } = {}) => {
		if (!socket.roomId || !socket.userPublic || !Array.isArray(list)) return;
		const room = rooms.get(socket.roomId);
		if (!room || list.length === 0) return;
		const [command, ...args] = list.map((item) => String(item || "").slice(0, 500));

		if (command === "name") {
			socket.userPublic.name = args.join(" ").trim().slice(0, 25) || "Anonymous";
			broadcastRoom(room);
			return;
		}
		if (command === "color") {
			const requestedColor = args[0]?.replace(/[^a-z0-9]/gi, "").toLowerCase();
			socket.userPublic.color = normalColors.includes(requestedColor) || specialColors.includes(requestedColor)
				? requestedColor
				: randomColor();
			broadcastRoom(room);
			return;
		}
		const popupColors = {
			angel: "blessed",
			glow: "glow",
			noob: "noob",
			gold: "gold",
		};
		if (popupColors[command]) {
			socket.userPublic.color = popupColors[command];
			broadcastRoom(room);
			return;
		}
		if (command === "voice" && args[0]) {
			socket.userPublic.voice = args[0];
			broadcastRoom(room);
			return;
		}
		if (command === "hat" && args.length > 0) {
			socket.userPublic.color = `${socket.userPublic.color.split(" ")[0]} ${args.join(" ")}`;
			broadcastRoom(room);
			return;
		}
		if (command === "youtube" && args[0]) {
			broadcastEvent(room, "youtube", { guid: socket.id, vid: args[0].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 11) });
			return;
		}

		const reactionEvents = {
			asshole: "asshole",
			bass: "bass",
			owo: "owo",
		};
		if (reactionEvents[command]) {
			let target = findUser(room, args.join(" "));
			if (!target) {
				const others = [...room].filter(c => c !== socket);
				if (others.length > 0) target = others[Math.floor(Math.random() * others.length)];
			}
			if (!target) return;
			broadcastEvent(room, reactionEvents[command], {
				guid: socket.id,
				target: target.userPublic.name,
			});
			return;
		}
		if (["joke", "fact", "triggered", "linux", "pawn"].includes(command)) {
			broadcastEvent(room, command, {
				guid: socket.id,
				rng: `${Date.now()}-${Math.random()}`,
			});
			return;
		}
		if (command === "backflip") {
			broadcastEvent(room, "backflip", { guid: socket.id, swag: args[0] === "swag" });
			return;
		}
		if (command === "french") {
			broadcastEvent(room, "french", { guid: socket.id });
			return;
		}
		if (command === "img" && args[0]) {
			broadcastEvent(room, "image", { guid: socket.id, url: args[0] });
			return;
		}
		if (command === "video" && args[0]) {
			broadcastEvent(room, "video", { guid: socket.id, url: args[0] });
			return;
		}
		if (command === "poll" && args.length > 0) {
			broadcastEvent(room, "poll", {
				guid: socket.id,
				poll: `${Date.now()}-${socket.id}`,
				title: args.join(" ").slice(0, 1000),
			});
			return;
		}
		if (command === "kingword") {
			socket.userPublic.level = "king";
			socket.emit("king");
			return;
		}
		if (command === "adminword") {
			socket.userPublic.level = "admin";
			socket.emit("admin");
			return;
		}
		if (command === "bless") {
			findUserById(room, args[0])?.emit("blessed");
			return;
		}
		const target = findUserById(room, args[0]);
		if (command === "nameedit" && target) {
			target.userPublic.name = args.slice(1).join(" ").trim().slice(0, 25) || "Anonymous";
			broadcastRoom(room);
			return;
		}
		if (command === "tagedit" && target) {
			target.userPublic.tag = args.slice(1).join(" ").trim().slice(0, 40);
			broadcastRoom(room);
			return;
		}
		if (command === "color" && target && args[1]) {
			target.userPublic.color = args[1];
			broadcastRoom(room);
			return;
		}
		if (command === "jewify" && target) {
			target.userPublic.color = "jew";
			target.userPublic.tag = "Jew";
			broadcastRoom(room);
			return;
		}
		if (command === "statlock" && target) {
			target.userPublic.locked = !target.userPublic.locked;
			broadcastRoom(room);
			return;
		}
		if (command === "jannify" && target && (socket.isOwner || ["admin", "king"].includes(socket.userPublic.level))) {
			target.userPublic.broom = !target.userPublic.broom;
			target.emit(target.userPublic.broom ? "janitor" : "janitorRemove", { id: target.id });
			broadcastRoom(room);
			return;
		}
		if (command === "nuke" && target) {
			broadcastEvent(room, "nuke", { guid: target.id });
			return;
		}
		if (command === "kick" && target) {
			target.emit("kick", { reason: "Kicked by a moderator." });
			target.disconnect(true);
			return;
		}
		if (command === "tempban" && target) {
			target.emit("tempban", { reason: "Temporarily banned by a moderator." });
			target.disconnect(true);
			return;
		}
		if (command === "ban" && target) {
			target.emit("ban", { reason: "Banned by a moderator." });
			target.disconnect(true);
			return;
		}
		if (command === "info" && target) {
			socket.emit("dialog", {
				title: "User Info",
				html: `${target.userPublic.name} (${target.id})<br>Color: ${target.userPublic.color}<br>Tag: ${target.userPublic.tag || ""}`,
			});
			return;
		}
	});

	socket.on("vote", (data = {}) => {
		if (!socket.roomId || !socket.userPublic) return;
		const room = rooms.get(socket.roomId);
		if (room) broadcastEvent(room, "vote", { poll: data.poll, guid: socket.id, vote: !!data.vote });
	});

	socket.on("disconnect", () => {
		if (!socket.roomId) return;
		const room = rooms.get(socket.roomId);
		if (!room) return;
		room.delete(socket);
		for (const client of room) client.emit("leave", { guid: socket.id });
		if (room.size === 0) rooms.delete(socket.roomId);
		else broadcastRoom(room);
	});
});

server.listen(port, () => {
	console.log(`BonziWORLD is running at http://localhost:${port}`);
});
