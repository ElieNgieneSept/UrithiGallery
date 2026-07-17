const ADMIN_PASSWORD = "admin"; // Mot de passe de test en local

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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si déjà connecté (sessionStorage)
    if (sessionStorage.getItem('admin_auth') === 'true') {
        showDashboard();
    }
});

// --- Authentification ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = document.getElementById('admin-password').value;
    if (pwd === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_auth', 'true');
        loginError.style.display = 'none';
        showDashboard();
    } else {
        loginError.style.display = 'block';
    }
});

btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('admin_auth');
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
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

// --- Navigation ---
btnAddNew.addEventListener('click', () => {
    editingId = null;
    formTitle.textContent = "Ajouter une œuvre";
    artworkForm.reset();
    document.getElementById('image-preview').innerHTML = '';
    
    // Valeurs par défaut pour les licences
    document.getElementById('licence-web-prix').value = 50;
    document.getElementById('licence-media-prix').value = 150;
    document.getElementById('licence-com-prix').value = 500;
    document.getElementById('licence-web-size').value = '800x600';
    document.getElementById('licence-media-size').value = '1920x1080';
    document.getElementById('licence-com-size').value = '4000x3000';
    
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

    // Licences
    if (art.licences) {
        document.getElementById('licence-web-prix').value = art.licences.web?.prix || 50;
        document.getElementById('licence-media-prix').value = art.licences.media?.prix || 150;
        document.getElementById('licence-com-prix').value = art.licences.commerciale?.prix || 500;
        document.getElementById('licence-web-size').value = art.licences.web?.details?.size || '800x600';
        document.getElementById('licence-media-size').value = art.licences.media?.details?.size || '1920x1080';
        document.getElementById('licence-com-size').value = art.licences.commerciale?.details?.size || '4000x3000';
    }

    listSection.style.display = 'none';
    formSection.style.display = 'block';
};

window.deleteArtwork = function(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette œuvre ?")) {
        currentArtworks = currentArtworks.filter(a => a.id !== id);
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
// Doit être identique à la variable ADMIN_SECRET définie dans Cloudflare
const ADMIN_SECRET = 'SecureArtGallery2026!';

async function saveToGitHub() {
    const btn = document.getElementById('btn-publish');
    if (!btn) return;
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
            headers: { 'Content-Type': 'application/json', 'X-ADMIN-SECRET': ADMIN_SECRET },
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

document.getElementById('artwork-image-file').addEventListener('change', handleImageUpload);
document.getElementById('artist-image-file').addEventListener('change', (e) => {
    handleImageUpload(e, 'artwork-artistImage', null);
});

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
