export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API : sauvegarde de data.json sur GitHub
    if (url.pathname === "/api/save-data" && request.method === "POST") {
      const secret = request.headers.get("X-ADMIN-SECRET");
      if (secret !== env.ADMIN_SECRET) {
        return new Response(JSON.stringify({ error: "Non autorisé" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const body = await request.json();
        const content = body.content; // chaîne JSON déjà encodée
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
