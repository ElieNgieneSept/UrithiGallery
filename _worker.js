// Utilitaire HMAC-SHA256 (Web Crypto API, disponible sur Workers)
async function sign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Crée un token de session signé : payload.signature
async function createSessionToken(secret) {
  const payload = { exp: Date.now() + 1000 * 60 * 60 * 8 }; // 8h
  const signature = await sign(JSON.stringify(payload), secret);
  return btoa(JSON.stringify(payload)) + "." + signature;
}

async function verifySessionToken(token, secret) {
  if (!token || !token.includes(".")) return false;
  const [b64, signature] = token.split(".");
  let payload;
  try {
    payload = JSON.parse(atob(b64));
  } catch {
    return false;
  }
  const expected = await sign(JSON.stringify(payload), secret);
  if (signature !== expected) return false;
  if (payload.exp && Date.now() > payload.exp) return false;
  return true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // === Connexion : vérifie le mot de passe (côté Cloudflare) ===
    if (url.pathname === "/api/login" && request.method === "POST") {
      try {
        const { password } = await request.json();
        if (password !== env.ADMIN_PASSWORD) {
          return new Response(JSON.stringify({ error: "Mot de passe incorrect" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const token = await createSessionToken(env.ADMIN_SECRET);
        return new Response(JSON.stringify({ success: true, token }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // === Sauvegarde data.json : exige un token de session valide ===
    if (url.pathname === "/api/save-data" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!(await verifySessionToken(token, env.ADMIN_SECRET))) {
        return new Response(JSON.stringify({ error: "Non autorisé" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const body = await request.json();
        const content = body.content;
        const sha = body.sha || null;

        const payload = {
          message: body.message || "Mise à jour via Admin Dashboard",
          content: content,
          branch: "main",
        };
        if (sha) payload.sha = sha;

        const ghRes = await fetch(
          "https://api.github.com/repos/ElieNgieneSept/UrithiGallery/contents/data.json",
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${env.GITHUB_TOKEN}`,
              "Content-Type": "application/json",
              "User-Agent": "urithi-admin",
            },
            body: JSON.stringify(payload),
          }
        );

        const ghData = await ghRes.json();
        if (!ghRes.ok) {
          return new Response(
            JSON.stringify({ error: ghData.message || "Erreur GitHub", details: ghData }),
            { status: ghRes.status, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, sha: ghData.content?.sha }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Servir les fichiers statiques
    return env.ASSETS.fetch(request);
  },
};
