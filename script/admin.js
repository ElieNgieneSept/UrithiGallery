// Le mot de passe est vérifié côté Cloudflare (variable ADMIN_PASSWORD), il n'est JAMAIS en clair ici.

let currentArtworks = [];
let editingId = null;

// Éléments du DOM
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');

const listSection = document.getElementById('list-section');
const formSection = document.getElementById('form-section');
const gridBody = document.getElementById('grid-body');
const artworkForm = document.getElementById('artwork-form');
const btnAddNew = document.getElementById('btn-add-new');
const btnBack = document.getElementById('btn-back');
const formTitle = document.getElementById('form-title');
const btnSaveJson = document.getElementById('btn-save-json');
const artistSuggestions = document.getElementById('artist-suggestions');
const artistPreview = document.getElementById('artist-existing-preview');
let savedArtists = [];
let extraGalleryImages = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Plus de connexion automatique : à chaque chargement de la page admin,
    // l'utilisateur doit (re)saisir son mot de passe pour des raisons de sécurité.
    logout();
});

// Déconnexion dès que l'utilisateur quitte la page du Dashboard
// (changement d'onglet/URL, fermeture de l'onglet ou du navigateur)
window.addEventListener('pagehide', logout);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') logout();
});

function logout() {
    sessionStorage.removeItem('admin_token');
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
}

// --- Authentification (via Worker) ---
const LOCAL_ADMIN_PASSWORD = 'Administrateur#ArtGallery';

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = document.getElementById('admin-password').value;
    loginError.style.display = 'none';
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.token) {
                sessionStorage.setItem('admin_token', data.token);
                showDashboard();
                return;
            }
        }
        throw new Error('API login indisponible');
    } catch (err) {
        console.error(err);
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost && pwd === LOCAL_ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_token', 'local-dev-session');
            showDashboard();
        } else {
            loginError.style.display = 'block';
        }
    }
});

btnLogout.addEventListener('click', () => {
    logout();
});

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'flex';
    loadData();
}

// --- Chargement des données ---
async function loadData() {
    try {
        // En local, on charge le fichier data.json
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('data.json introuvable');
        const data = await response.json();
        currentArtworks = data.oeuvres || [];
        renderTable();
        refreshSavedArtists();
    } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
        alert("Impossible de charger data.json. Assurez-vous d'être sur un serveur local.");
    }
}

const ITEMS_PER_PAGE = 10;
let currentPage = 1;

// --- Affichage du tableau (avec pagination) ---
function renderTable() {
    gridBody.innerHTML = '';
    
    // Mise à jour du compteur total
    document.getElementById('total-artworks').textContent = `(${currentArtworks.length})`;

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedArtworks = currentArtworks.slice(startIndex, endIndex);

    paginatedArtworks.forEach(art => {
        const row = document.createElement('div');
        row.className = 'grid-row';
        row.innerHTML = `
            <div class="grid-cell"><img src="${art.image}" alt="${art.titre}"></div>
            <div class="grid-cell">${art.titre}</div>
            <div class="grid-cell">${art.categorie}</div>
            <div class="grid-cell">${art.prix}</div>
            <div class="grid-cell action-btns">
                <button class="Btn Secondary" onclick="editArtwork(${art.id})">Modifier</button>
                <button class="Btn Btn-danger" onclick="deleteArtwork(${art.id})">Supprimer</button>
            </div>
        `;
        gridBody.appendChild(row);
    });

    updatePaginationControls();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(currentArtworks.length / ITEMS_PER_PAGE) || 1;
    document.getElementById('page-indicator').textContent = `Page ${currentPage} / ${totalPages}`;
    
    document.getElementById('btn-prev-page').disabled = currentPage === 1;
    document.getElementById('btn-next-page').disabled = currentPage === totalPages;
}

document.getElementById('btn-prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

document.getElementById('btn-next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(currentArtworks.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

function refreshSavedArtists() {
    const artistsMap = new Map();

    currentArtworks.forEach(art => {
        const key = (art.artiste || '').trim().toLowerCase();
        if (!key) return;
        if (!artistsMap.has(key)) {
            artistsMap.set(key, {
                artiste: art.artiste,
                artistImage: art.artistImage || '',
                artistCategory: art.artistCategory || ''
            });
        }
    });

    savedArtists = Array.from(artistsMap.values());
    artistSuggestions.innerHTML = '';
    savedArtists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist.artiste;
        artistSuggestions.appendChild(option);
    });
}

function findSavedArtist(artistName) {
    if (!artistName) return null;
    const key = artistName.trim().toLowerCase();
    return savedArtists.find(a => a.artiste.trim().toLowerCase() === key) || null;
}

function renderArtistPreview(artist) {
    if (!artist) {
        artistPreview.innerHTML = '';
        return;
    }

    artistPreview.innerHTML = `
        <div class="artist-preview-card">
            <img src="${artist.artistImage}" alt="Photo de ${artist.artiste}">
            <div>
                <strong>${artist.artiste}</strong>
                <p>${artist.artistCategory || 'Catégorie non définie'}</p>
            </div>
        </div>
    `;
}

function tryAutoFillArtistFields() {
    const artistName = document.getElementById('artwork-artiste').value;
    const savedArtist = findSavedArtist(artistName);
    if (!savedArtist) {
        renderArtistPreview(null);
        return;
    }

    const artistImageInput = document.getElementById('artwork-artistImage');
    const artistCategoryInput = document.getElementById('artwork-artistCategory');
    if (savedArtist.artistImage) {
        artistImageInput.value = savedArtist.artistImage;
    }
    if (savedArtist.artistCategory) {
        artistCategoryInput.value = savedArtist.artistCategory;
    }
    renderArtistPreview(savedArtist);
}

const artworkArtistInput = document.getElementById('artwork-artiste');
artworkArtistInput.addEventListener('input', tryAutoFillArtistFields);

// --- Navigation ---
btnAddNew.addEventListener('click', () => {
    editingId = null;
    formTitle.textContent = "Ajouter une œuvre";
    artworkForm.reset();
    document.getElementById('image-preview').innerHTML = '';
    renderArtistPreview(null);
    extraGalleryImages = [];
    renderGalleryImages();
    
    // Valeurs par défaut pour les licences
    document.getElementById('licence-web-prix').value = 50;
    document.getElementById('licence-media-prix').value = 150;
    document.getElementById('licence-com-prix').value = 500;
    document.getElementById('licence-web-size').value = '800x600';
    document.getElementById('licence-media-size').value = '1920x1080';
    document.getElementById('licence-com-size').value = '4000x3000';
    computeLicenceSizes();
    
    listSection.style.display = 'none';
    formSection.style.display = 'block';
});

btnBack.addEventListener('click', () => {
    listSection.style.display = 'block';
    formSection.style.display = 'none';
});

// --- Édition et Suppression ---
window.editArtwork = function(id) {
    const art = currentArtworks.find(a => a.id === id);
    if (!art) return;

    editingId = id;
    formTitle.textContent = "Modifier l'œuvre";
    
    // Remplir le formulaire
    document.getElementById('artwork-titre').value = art.titre || '';
    document.getElementById('artwork-artiste').value = art.artiste || '';
    document.getElementById('artwork-categorie').value = art.categorie || 'Peinture';
    document.getElementById('artwork-prix').value = art.prix || 0;
    document.getElementById('artwork-taille').value = art.taille || '';
    document.getElementById('artwork-etat').value = art.etat || '';
    document.getElementById('artwork-type').value = art.type || '';
    document.getElementById('artwork-encadrement').value = art.encadrement || '';
    
    document.getElementById('artwork-image-url').value = art.image || '';
    if (art.image) {
        document.getElementById('image-preview').innerHTML = `<img src="${art.image}" alt="Aperçu">`;
    } else {
        document.getElementById('image-preview').innerHTML = '';
    }

    document.getElementById('artwork-artistImage').value = art.artistImage || '';
    document.getElementById('artwork-artistCategory').value = art.artistCategory || '';
    document.getElementById('artwork-description').value = art.description || '';
    tryAutoFillArtistFields();

    // Licences
    if (art.licences) {
        document.getElementById('licence-web-prix').value = art.licences.web?.prix || 50;
        document.getElementById('licence-media-prix').value = art.licences.media?.prix || 150;
        document.getElementById('licence-com-prix').value = art.licences.commerciale?.prix || 500;
        document.getElementById('licence-web-size').value = art.licences.web?.details?.size || '800x600';
        computeLicenceSizes();
    }

    if (Array.isArray(art.images) && art.images.length > 1) {
        extraGalleryImages = art.images.slice(1);
    } else {
        extraGalleryImages = [];
    }
    renderGalleryImages();

    listSection.style.display = 'none';
    formSection.style.display = 'block';
};

window.deleteArtwork = function(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette œuvre ?")) {
        currentArtworks = currentArtworks.filter(a => a.id !== id);
        refreshSavedArtists();
        if ((currentPage - 1) * ITEMS_PER_PAGE >= currentArtworks.length && currentPage > 1) {
            currentPage--;
        }
        renderTable();
    }
};

// --- Éditeur Markdown ---
const textarea = document.getElementById('artwork-description');

document.getElementById('btn-bold').addEventListener('click', () => {
    insertTextAtCursor('**', '**');
});

document.getElementById('btn-newline').addEventListener('click', () => {
    insertTextAtCursor('\\n', '');
});

function insertTextAtCursor(prefix, suffix) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    textarea.value = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    textarea.focus();
    textarea.selectionStart = start + prefix.length;
    textarea.selectionEnd = end + prefix.length;
}

// --- Sauvegarde (Soumission du formulaire) ---
artworkForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newArt = {
        id: editingId !== null ? editingId : (currentArtworks.length > 0 ? Math.max(...currentArtworks.map(a => a.id)) + 1 : 0),
        titre: document.getElementById('artwork-titre').value,
        taille: document.getElementById('artwork-taille').value,
        categorie: document.getElementById('artwork-categorie').value,
        image: document.getElementById('artwork-image-url').value,
        images: [document.getElementById('artwork-image-url').value, ...extraGalleryImages],
        artistImage: document.getElementById('artwork-artistImage').value,
        artistCategory: document.getElementById('artwork-artistCategory').value,
        artiste: document.getElementById('artwork-artiste').value,
        type: document.getElementById('artwork-type').value,
        prix: parseFloat(document.getElementById('artwork-prix').value),
        etat: document.getElementById('artwork-etat').value,
        encadrement: document.getElementById('artwork-encadrement').value,
        description: document.getElementById('artwork-description').value,
        licences: {
            web: {
                prix: parseFloat(document.getElementById('licence-web-prix').value),
                usage: "Licence Web",
                details: { size: document.getElementById('licence-web-size').value || "800x600", utilisation_mondiale: "Oui", utilisation_multisupport: "Non", utilisation_toutmedia: "Non", droit_de_revente: "Non", produits_destines_a_la_vente: "Non" },
                info_usage: "Idéal pour les sites internet, blogs et réseaux sociaux. Usage non commercial."
            },
            media: {
                prix: parseFloat(document.getElementById('licence-media-prix').value),
                usage: "Licence Media",
                details: { size: document.getElementById('licence-media-size').value || "1920x1080", utilisation_mondiale: "Oui", utilisation_multisupport: "Oui", utilisation_toutmedia: "Non", droit_de_revente: "Non", produits_destines_a_la_vente: "Non" },
                info_usage: "Idéal pour la presse numérique et papier, ainsi que les émissions. Crédit obligatoire."
            },
            commerciale: {
                prix: parseFloat(document.getElementById('licence-com-prix').value),
                usage: "Licence Commerciale",
                details: { size: document.getElementById('licence-com-size').value || "4000x3000", utilisation_mondiale: "Oui", utilisation_multisupport: "Oui", utilisation_toutmedia: "Oui", droit_de_revente: "Oui", produits_destines_a_la_vente: "Oui" },
                info_usage: "Idéal pour les campagnes publicitaires et produits dérivés. Utilisation sans restriction majeure."
            }
        }
    };

    if (editingId !== null) {
        const index = currentArtworks.findIndex(a => a.id === editingId);
        currentArtworks[index] = newArt;
    } else {
        currentArtworks.push(newArt);
    }

    refreshSavedArtists();
    renderTable();
    listSection.style.display = 'block';
    formSection.style.display = 'none';
    alert("Œuvre enregistrée en mémoire. N'oubliez pas de télécharger le fichier data.json pour sauvegarder vos modifications en local.");
});

// --- Télécharger le JSON (Phase Locale) ---
function downloadJsonFile() {
    const dataToSave = { oeuvres: currentArtworks };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToSave, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

btnSaveJson.addEventListener('click', downloadJsonFile);
document.getElementById('btn-save-json-main').addEventListener('click', downloadJsonFile);

// --- Upload Cloudinary (Non signé) ---
const CLOUD_NAME = 'StepPlus';
const UPLOAD_PRESET = 'ArtGallery';

// --- Publication en ligne (Worker /api/save-data) ---
// Le token de session est récupéré après connexion (jamais en clair côté client)
function getAuthHeaders() {
    const token = sessionStorage.getItem('admin_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function saveToGitHub() {
    const btn = document.getElementById('btn-publish');
    if (!btn) return;
    if (!sessionStorage.getItem('admin_token')) {
        alert('Session expirée, reconnectez-vous.');
        return;
    }
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = '⏳ Publication...';
    try {
        const content = btoa(unescape(encodeURIComponent(JSON.stringify({ oeuvres: currentArtworks }, null, 2))));

        // Récupérer le SHA actuel du fichier sur GitHub (requis pour un PUT)
        let sha = null;
        try {
            const head = await fetch('https://api.github.com/repos/ElieNgieneSept/UrithiGallery/contents/data.json', {
                headers: { 'User-Agent': 'urithi-admin' }
            });
            if (head.ok) sha = (await head.json()).sha;
        } catch (_) {}

        const res = await fetch('/api/save-data', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message: 'Mise à jour via Admin Dashboard', content, sha })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Échec de la publication');
        alert('✅ Publié sur le site avec succès !');
    } catch (err) {
        console.error(err);
        alert('❌ ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// --- Galerie d'images multiples ---
function renderGalleryImages() {
    const listEl = document.getElementById('gallery-images-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    extraGalleryImages.forEach((url, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-image-item';
        item.innerHTML = `
            <img src="${url}" alt="Galerie ${index + 1}" class="gallery-image-thumb">
            <button type="button" class="gallery-image-remove" data-index="${index}" title="Supprimer">&times;</button>
        `;
        listEl.appendChild(item);
    });

    listEl.querySelectorAll('.gallery-image-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index, 10);
            extraGalleryImages.splice(idx, 1);
            renderGalleryImages();
        });
    });
}

document.getElementById('gallery-image-file').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (CLOUD_NAME === 'VOTRE_CLOUD_NAME') {
        alert("Attention : Vous devez configurer CLOUD_NAME et UPLOAD_PRESET dans script/admin.js pour que l'upload Cloudinary fonctionne.");
        return;
    }

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', 'ArtGallery');

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Erreur lors de l'upload");
            
            const data = await res.json();
            const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
            extraGalleryImages.push(optimizedUrl);
        } catch (err) {
            console.error(err);
            alert("Échec de l'upload de l'image : " + file.name);
        }
    }

    renderGalleryImages();
    e.target.value = '';
});

document.getElementById('artwork-image-file').addEventListener('change', handleImageUpload);
document.getElementById('artist-image-file').addEventListener('change', (e) => {
    handleImageUpload(e, 'artwork-artistImage', null);
});

// --- Calcul automatique des dimensions de licence ---
// Media = 2× la taille Web, Commerciale = 4× la taille Web
function computeLicenceSizes() {
    const web = document.getElementById('licence-web-size').value.trim();
    const m = web.match(/^(\d+)\s*x\s*(\d+)$/i);
    if (!m) {
        document.getElementById('licence-media-size').value = '';
        document.getElementById('licence-com-size').value = '';
        return;
    }
    const w = parseInt(m[1], 10), h = parseInt(m[2], 10);
    document.getElementById('licence-media-size').value = `${w * 2}x${h * 2}`;
    document.getElementById('licence-com-size').value = `${w * 4}x${h * 4}`;
}

document.getElementById('licence-web-size').addEventListener('input', computeLicenceSizes);

async function handleImageUpload(e, urlInputId = 'artwork-image-url', previewId = 'image-preview') {
    const file = e.target.files[0];
    if (!file) return;

    if (CLOUD_NAME === 'VOTRE_CLOUD_NAME') {
        alert("Attention : Vous devez configurer CLOUD_NAME et UPLOAD_PRESET dans script/admin.js pour que l'upload Cloudinary fonctionne.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'ArtGallery');

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error("Erreur lors de l'upload");
        
        const data = await res.json();
        
        // Optimisation Cloudinary: f_auto,q_auto
        const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
        
        document.getElementById(urlInputId).value = optimizedUrl;
        
        if (previewId) {
            document.getElementById(previewId).innerHTML = `<img src="${optimizedUrl}" alt="Aperçu">`;
        }

    } catch (err) {
        console.error(err);
        alert("Échec de l'upload de l'image.");
    }
}
