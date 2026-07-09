// Détecte si l'appareil est tactile
const estTactile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

/**
 * Configure le comportement d'un bouton pour les appareils tactiles.
 * @param {string} buttonSelector Le sélecteur CSS des boutons (par ex., ".Button01").
 * @param {string} tapeClass La classe CSS de l'effet de tap (par ex., "tape01").
 * @param {number} duration La durée en millisecondes avant de retirer la classe.
 */
function setupButtonInteraction(buttonSelector, tapeClass, duration) {
  // Sélectionne TOUS les boutons qui correspondent au sélecteur
  const boutons = document.querySelectorAll(buttonSelector);

  // S'il n'y a pas de boutons, on arrête la fonction.
  if (boutons.length === 0) {
    console.error(`Aucun bouton trouvé avec le sélecteur : ${buttonSelector}`);
    return;
  }

  if (estTactile) {
    // Si l'appareil est tactile, on ajoute une classe au corps de la page
    document.body.classList.add("is-touch-device");

    // Parcourt chaque bouton de la liste pour y ajouter les événements
    boutons.forEach(bouton => {
      // Événement pour le début du toucher
      bouton.addEventListener("touchstart", (e) => {
        // Empêche le comportement par défaut du navigateur
        e.preventDefault();
        // Ajoute la classe pour déclencher l'animation
        bouton.classList.add(tapeClass);
      });

      // Événement pour la fin du toucher
      bouton.addEventListener("touchend", () => {
        // Retire la classe après un court délai
        setTimeout(() => {
          bouton.classList.remove(tapeClass);
          // Retire le focus pour éviter le comportement de survol
          bouton.blur();
        }, duration);
      });
    });
  }
}

// ----------------------------------------------------
// Appels de la fonction pour chaque groupe de boutons
// ----------------------------------------------------

// Boutons .Button01 ...
setupButtonInteraction(".Button01", "tape01", 300);
// Boutons .Button02 ...
setupButtonInteraction(".Button02", "tape02", 900);