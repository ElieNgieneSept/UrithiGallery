document.querySelectorAll('.BtnBurger').forEach(btn => {
    btn.addEventListener('click', e => {
        btn.classList.toggle('active');
        const menuMobile = document.querySelector('.Menu-Mobile');
        if (btn.classList.contains('active')) {
            menuMobile.style.left = '0';
        } else {
            menuMobile.style.left = '360%';
        }
    });
});

// Gestion de la sélection des boutons de filtre + filtrage dynamique des cartes
const mapCategorie = {
    'Tout': 'tout',
    'Peintures': 'peinture',
    'Sculptures': 'sculpture',
    'Mode': 'mode',
    'Littératures': 'littératures'
};

const filtrerCartes = (categorie) => {
    const cartes = document.querySelectorAll('.Card-Container .Card');
    cartes.forEach(carte => {
        const cat = carte.getAttribute('data-categorie');
        if (categorie === 'tout' || cat === categorie) {
            carte.style.display = '';
        } else {
            carte.style.display = 'none';
        }
    });
};

document.querySelectorAll('.Btn-Filter').forEach(btn => {
    const activerFiltre = (e) => {
        // Retirer la classe 'active' de tous les boutons de filtre
        document.querySelectorAll('.Btn-Filter').forEach(b => b.classList.remove('active'));
        // Ajouter la classe 'active' au bouton cliqué
        btn.classList.add('active');
        // Filtrer les cartes selon la catégorie sélectionnée
        const categorie = mapCategorie[btn.textContent.trim()] || 'tout';
        filtrerCartes(categorie);
    };

    btn.addEventListener('click', activerFiltre);
    btn.addEventListener('touchstart', activerFiltre);
});

// Défilement fluide personnalisé (contrôle de la durée : 1 seconde)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return; // Ignore les liens vides
        
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        e.preventDefault();

        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition;
        const duration = 1000; // 1 seconde (1000 millisecondes)
        let start = null;

        // Fonction d'accélération (easeInOutQuad) pour un mouvement fluide
        const ease = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            
            window.scrollTo(0, run);
            
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    });
});

// Navbar : opacité au scroll
const navbar = document.querySelector('.Navbar');
const onScroll = () => {
    if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
};
window.addEventListener('scroll', onScroll, { passive: true });

// Chargement dynamique des œuvres depuis data.json
const chargerOeuvres = () => {
    const container = document.querySelector('.Card-Container');
    if (!container) return;

    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Fichier data.json introuvable');
            return response.json();
        })
        .then(data => {
            container.innerHTML = ''; // Vide le conteneur (supprime les cartes statiques)
            (data.oeuvres || []).forEach(oeuvre => {
                const carte = document.createElement('div');
                carte.className = 'Card';
                carte.setAttribute('data-categorie', oeuvre.categorie);
                carte.style.cursor = 'pointer';
                carte.innerHTML = `
                    <div class="Img-Container">
                        <img class="Card-Img" src="${oeuvre.image}" alt="${oeuvre.titre}">
                    </div>
                    <div class="Infos">
                        <p class="Title">${oeuvre.titre}</p>
                        <p class="Size">${oeuvre.taille}</p>
                    </div>`;
                
                carte.addEventListener('click', () => {
                    window.location.href = `details.html?id=${oeuvre.id}`;
                });
                
                container.appendChild(carte);
            });
            // Réapplique le filtre actif (par défaut "Tout")
            const btnActif = document.querySelector('.Btn-Filter.active');
            const categorie = mapCategorie[btnActif ? btnActif.textContent.trim() : 'Tout'] || 'tout';
            filtrerCartes(categorie);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des œuvres :', err);
            // En cas d'échec (ex: ouverture en file://), les cartes statiques restent affichées
        });
};

chargerOeuvres();
