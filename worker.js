export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/tts") {
      let text = "";
      let voiceId = "8d21b053e2804e2a890e1cf62f267b6f";
      try {
        const body = await request.json();
        text = String(body.text || "").trim();
        if (typeof body.voice_id === "string" && body.voice_id) voiceId = body.voice_id;
      } catch {
        return Response.json({ error: "Bad body" }, { status: 400 });
      }
      if (!text) return Response.json({ error: "No text" }, { status: 400 });

      const FISH_KEY = env.FISH_KEY || "sk-fish-uPVsITUd0Y7iNAgUn7mszTPVfZc9gxGGBCwbtcMCBZ0";

      try {
        let res;
        for (let attempt = 0; attempt < 3; attempt++) {
          res = await fetch("https://api.fish.audio/v1/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${FISH_KEY}`,
              model: "s2.1-pro-free",
            },
            body: JSON.stringify({
              text,
              reference_id: voiceId,
              format: "mp3",
              normalize: true,
            }),
          });
          if (res.status !== 401 || attempt === 2) break;
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }

        if (!res.ok) {
          const errText = await res.text();
          return Response.json(
            { error: `fish.audio ${res.status}: ${errText.slice(0, 200)}` },
            { status: 502 }
          );
        }

        const audio = await res.arrayBuffer();
        return new Response(audio, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      } catch (err) {
        return Response.json(
          { error: `upstream error: ${err.message}` },
          { status: 502 }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
