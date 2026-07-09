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

// Gestion de la sélection des boutons de filtre
document.querySelectorAll('.Btn-Filter').forEach(btn => {
    const activerFiltre = (e) => {
        // Retirer la classe 'active' de tous les boutons de filtre
        document.querySelectorAll('.Btn-Filter').forEach(b => b.classList.remove('active'));
        // Ajouter la classe 'active' au bouton cliqué
        btn.classList.add('active');
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