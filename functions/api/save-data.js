/**
 * Cloudflare Pages Function : /api/save-data
 * 
 * Reçoit le contenu du data.json depuis le Dashboard admin,
 * et le commit directement sur le dépôt GitHub via l'API.
 * 
 * Variables d'environnement requises dans Cloudflare Pages :
 *   - GITHUB_TOKEN : votre Fine-grained Personal Access Token
 *   - ADMIN_SECRET : un mot de passe secret partagé entre cette fonction et admin.js
 */

const GITHUB_OWNER = 'ElieNgieneSept';
const GITHUB_REPO  = 'UrithiGallery';
const FILE_PATH    = 'data.json'; // Chemin du fichier dans le repo

// Headers CORS pour autoriser les appels depuis votre domaine Cloudflare Pages
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { env, request } = context;

    // 1. Vérification du secret admin
    const adminSecret = request.headers.get('X-Admin-Secret');
    if (!env.ADMIN_SECRET || adminSecret !== env.ADMIN_SECRET) {
        return new Response(
            JSON.stringify({ error: 'Non autorisé.' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // 2. Récupération du corps de la requête (le nouveau data.json)
    let newData;
    try {
        newData = await request.json();
    } catch (e) {
        return new Response(
            JSON.stringify({ error: 'Corps de la requête JSON invalide.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    const githubHeaders = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ArtGallery-Admin-Dashboard',
        'Content-Type': 'application/json',
    };

    // 3. Récupérer le SHA actuel du fichier (requis par l'API GitHub pour le mettre à jour)
    const getResponse = await fetch(githubApiUrl, { headers: githubHeaders });

    if (!getResponse.ok) {
        const err = await getResponse.text();
        return new Response(
            JSON.stringify({ error: `Impossible de récupérer le fichier sur GitHub : ${err}` }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const fileData = await getResponse.json();
    const currentSha = fileData.sha;

    // 4. Encoder le nouveau contenu en Base64 (requis par l'API GitHub)
    const jsonString = JSON.stringify(newData, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

    // 5. Envoyer le commit sur GitHub
    const putResponse = await fetch(githubApiUrl, {
        method: 'PUT',
        headers: githubHeaders,
        body: JSON.stringify({
            message: '🎨 Admin: Mise à jour des œuvres via le Dashboard',
            content: base64Content,
            sha: currentSha,
        }),
    });

    if (!putResponse.ok) {
        const err = await putResponse.text();
        return new Response(
            JSON.stringify({ error: `Échec du commit GitHub : ${err}` }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // 6. Succès !
    return new Response(
        JSON.stringify({ success: true, message: 'data.json mis à jour avec succès sur GitHub !' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
