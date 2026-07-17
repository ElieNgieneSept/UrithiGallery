document.addEventListener('DOMContentLoaded', () => {
    // 1. Récupération de l'ID de l'œuvre depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const œuvreId = parseInt(urlParams.get('id'));

    if (isNaN(œuvreId)) {
        alert("Aucune œuvre sélectionnée.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Chargement des données depuis data.json
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const œuvre = data.oeuvres.find(o => o.id === œuvreId);
            if (!œuvre) {
                alert("Œuvre non trouvée.");
        window.location.href = 'index.html';
                return;
            }
            renderDetails(œuvre);
        })
        .catch(error => {
            console.error("Erreur lors du chargement des données :", error);
        });

    function renderDetails(œuvre) {
        // Remplissage des informations de base
        document.getElementById('detail-image').src = œuvre.image;
        document.getElementById('detail-title').textContent = œuvre.titre;
        document.getElementById('info-category').textContent = œuvre.categorie;
        document.getElementById('info-artist').textContent = œuvre.artiste;
        const artistBasicEl = document.getElementById('info-artist-basic');
        if (artistBasicEl) artistBasicEl.textContent = œuvre.artiste;
        document.getElementById('artist-image').src = œuvre.artistImage;
        document.getElementById('category-artist').textContent = œuvre.artistCategory;
        document.getElementById('info-type').textContent = œuvre.type;
        document.getElementById('info-size').textContent = œuvre.taille;
        document.getElementById('info-price').textContent = œuvre.prix;
        document.getElementById('info-state').textContent = œuvre.etat;
        document.getElementById('info-frame').textContent = œuvre.encadrement;
        function parseMarkdown(text) {
            if (!text) return "";
            let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\n/g, '<br>');
            return html;
        }

        document.getElementById('info-description').innerHTML = parseMarkdown(œuvre.description);
        // Initialisation des licences
        const licenseRadios = document.querySelectorAll('input[name="license-type"]');
        const licensePrice = document.getElementById('license-price');
        const usageTitle = document.getElementById('usage-title');
        const usageList = document.getElementById('usage-details-list');

        function updateLicenseInfo(type) {
            const lic = œuvre.licences[type];
            if (lic) {
                licensePrice.textContent = lic.prix;
                usageTitle.textContent = lic.usage;
                
                const infoUsage = document.getElementById('info-usage');
                if (infoUsage && lic.info_usage) {
                    infoUsage.textContent = lic.info_usage;
                }
                
                if (lic.details) {
                    const sizeEl = document.getElementById('size');
                    if (sizeEl) sizeEl.textContent = lic.details.size || '-';
                    
                    const mondEl = document.getElementById('utilisation-mondiale');
                    if (mondEl) mondEl.textContent = lic.details.utilisation_mondiale || '-';
                    
                    const multiEl = document.getElementById('utilisation-multisupport');
                    if (multiEl) multiEl.textContent = lic.details.utilisation_multisupport || '-';
                    
                    const toutMediaEl = document.getElementById('utilisation-toutmedia');
                    if (toutMediaEl) toutMediaEl.textContent = lic.details.utilisation_toutmedia || '-';
                    
                    const reventeEl = document.getElementById('droit-de-revente');
                    if (reventeEl) reventeEl.textContent = lic.details.droit_de_revente || '-';
                    
                    const prodEl = document.getElementById('produits-destines-a-la-vente');
                    if (prodEl) prodEl.textContent = lic.details.produits_destines_a_la_vente || '-';
                }
            }
        }

        // Event listeners pour les boutons radio de licence
        licenseRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateLicenseInfo(e.target.value);
            });
        });

        // Affichage initial de la licence par défaut (celle qui est checked)
        const defaultLicense = document.querySelector('input[name="license-type"]:checked')?.value || 'web';
        updateLicenseInfo(defaultLicense);
    }

    // 3. Gestion des Onglets Principaux (Original vs Licences)
    const mainTabs = document.querySelectorAll('.Tab-Btn');
    const mainContents = document.querySelectorAll('.Tab-Content');

    mainTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Masquage complet de tous les contenus et désactivation des boutons
            mainTabs.forEach(b => b.classList.remove('active'));
            mainContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            // Activation du bouton cliqué et affichage du contenu correspondant
            btn.classList.add('active');
            const activeContent = document.getElementById(`tab-${tabId}`);
            activeContent.classList.add('active');
            activeContent.style.display = 'flex';
        });
    });

    // 4. Gestion des Sous-Onglets (Livraison, Garantie, Paiement)
    const subTabs = document.querySelectorAll('.Sub-Tab-Btn');
    const subContents = document.querySelectorAll('.Sub-Tab-Pane');

    subTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const subTabId = btn.getAttribute('data-subtab');
            
            subTabs.forEach(b => b.classList.remove('active'));
            subContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`subtab-${subTabId}`).classList.add('active');
        });
    });
});
