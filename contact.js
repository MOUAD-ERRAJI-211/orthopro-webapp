document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le formulaire de contact
    initContactForm();
    
    // Initialiser le système FAQ
    initFAQ();
    
    // Animation au scroll
    initScrollAnimations();
    
    // Smooth scroll pour les liens d'ancrage
    initSmoothScroll();
});

// Gestion du formulaire de contact
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }
}

// Traitement de la soumission du formulaire
function handleContactSubmission(event) {
    event.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    const consent = document.getElementById('consent').checked;
    
    // Validation basique côté client
    if (!name || !email || !subject || !message) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (!consent) {
        showNotification('Veuillez accepter la politique de confidentialité', 'error');
        return;
    }
    
    // Animation du bouton pour indiquer le chargement
    const submitButton = event.target.querySelector('[type="submit"]');
    const originalContent = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Envoi en cours...';
    submitButton.disabled = true;
    
    // Afficher une notification de chargement
    showNotification('Envoi de votre message en cours...', 'info');
    
    // Préparer les données pour l'envoi
    const formData = {
        name: name,
        email: email,
        subject: subject,
        message: message,
        // Email destination fixe comme demandé
        to: 'ener9194@gmail.com'
    };
    
    // Simulation d'envoi (dans une application réelle, ceci serait remplacé par un appel API)
    setTimeout(() => {
        // Simuler un succès (pour démonstration)
        const success = Math.random() > 0.1; // 90% de chance de succès pour la démo
        
        if (success) {
            showNotification('Votre message a été envoyé avec succès! Nous vous répondrons dans les plus brefs délais.', 'success');
            
            // Réinitialiser le formulaire
            document.getElementById('contact-form').reset();
        } else {
            showNotification('Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer plus tard.', 'error');
        }
        
        // Restaurer le bouton
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    }, 2000); // Simuler un délai de 2 secondes pour l'envoi
    
    // Dans une implémentation réelle, cette partie serait décommentée pour envoyer les données au backend
    /*
    fetch('/api/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur réseau');
        }
        return response.json();
    })
    .then(data => {
        showNotification('Votre message a été envoyé avec succès!', 'success');
        document.getElementById('contact-form').reset();
    })
    .catch(error => {
        showNotification('Une erreur est survenue: ' + error.message, 'error');
    })
    .finally(() => {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    });
    */
}

// Initialisation du système de FAQ
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const toggleBtn = item.querySelector('.toggle-btn');
        
        question.addEventListener('click', () => {
            // Fermer toutes les autres réponses
            document.querySelectorAll('.faq-answer').forEach(ans => {
                if (ans !== answer) {
                    ans.classList.remove('active');
                }
            });
            
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                if (btn !== toggleBtn) {
                    btn.classList.remove('active');
                }
            });
            
            // Ouvrir/fermer la réponse actuelle
            answer.classList.toggle('active');
            toggleBtn.classList.toggle('active');
        });
    });
}

// Animations au scroll
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.info-item, .social-contact, .contact-form-container, .map-container, .faq-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: '0px'
    });
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// Navigation fluide
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Décalage pour l'en-tête fixe
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Fonction pour afficher des notifications
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationIcon = notification.querySelector('.notification-icon i');
    const notificationMessage = notification.querySelector('.notification-message');
    const closeButton = notification.querySelector('.notification-close');
    
    // Réinitialiser les classes
    notification.className = 'notification';
    notification.classList.add(type);
    
    // Définir l'icône en fonction du type
    switch(type) {
        case 'success':
            notificationIcon.className = 'fas fa-check-circle';
            break;
        case 'error':
            notificationIcon.className = 'fas fa-times-circle';
            break;
        case 'warning':
            notificationIcon.className = 'fas fa-exclamation-triangle';
            break;
        default:
            notificationIcon.className = 'fas fa-info-circle';
    }
    
    // Définir le message
    notificationMessage.textContent = message;
    
    // Afficher la notification
    notification.classList.add('show');
    
    // Fermer automatiquement après 5 secondes
    let timeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
    
    // Fermer manuellement
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        clearTimeout(timeout);
    }, { once: true });
}