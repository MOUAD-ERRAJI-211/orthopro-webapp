document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des éléments interactifs
    initTabs();
    initPasswordToggles();
    initFormHandlers();
    checkAuthentication();
    
    // Gestionnaire pour le bouton Google
    document.getElementById('google-login').addEventListener('click', handleGoogleLogin);
    
    // Animations des éléments au scroll
    initScrollAnimations();
    
    // Gestion des témoignages
    initTestimonialCarousel();
    
    // Smooth scroll pour les liens internes
    initSmoothScroll();
});

// Gestion des onglets
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons et contenus
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');
            
            // Afficher le contenu correspondant
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
}

// Gestion des affichages de mot de passe
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}


// Modifiez initFormHandlers dans welcome.js pour vérifier si l'élément existe
function initFormHandlers() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

// Animations au scroll
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.section-title, .feature-card, .testimonial-card');
    
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
                    top: targetElement.offsetTop - 80, // Ajouter un décalage pour l'en-tête fixe
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Gestion du carousel de témoignages
function initTestimonialCarousel() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    const indicators = document.querySelectorAll('.testimonial-indicator .indicator');
    let currentIndex = 0;
    
    // Afficher seulement le premier témoignage au départ
    testimonials.forEach((card, index) => {
        if (index !== 0) {
            card.style.display = 'none';
        }
    });
    
    // Fonction pour passer au témoignage suivant
    function showTestimonial(index) {
        testimonials.forEach((card, i) => {
            card.style.display = i === index ? 'block' : 'none';
        });
        
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
        
        currentIndex = index;
    }
    
    // Ajouter des écouteurs sur les indicateurs
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showTestimonial(index);
        });
    });
    
    // Rotation automatique des témoignages
    setInterval(() => {
        let nextIndex = (currentIndex + 1) % testimonials.length;
        showTestimonial(nextIndex);
    }, 6000);
}

// Gestion de la connexion
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;
    
    // Validation basique côté client
    if (!email || !password || !role) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Animation du bouton pour indiquer le chargement
    const submitButton = event.target.querySelector('[type="submit"]');
    const originalContent = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connexion...';
    submitButton.disabled = true;
    
    // Afficher une notification de chargement
    showNotification('Connexion en cours...', 'info');
    
    // URL complète avec le port pour l'API
    const apiUrl = `${getAPIBaseUrl()}/api/utilisateurs/login`;
    
    // Envoi des données au backend
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => {
        console.log('Statut de la réponse:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Email ou mot de passe incorrect');
            }
            throw new Error('Erreur de connexion');
        }
        return response.json();
    })
    .then(data => {
        console.log('Données de réponse:', data);
        // Vérifier si le rôle correspond
        if (data.role !== role) {
            showNotification('Le rôle sélectionné ne correspond pas à votre compte', 'error');
            submitButton.innerHTML = originalContent;
            submitButton.disabled = false;
            return;
        }
        
        // Générer un JWT token (normalement fait côté serveur, ici simulation)
        const token = data.token || generateFakeToken(data);
        
        // Stocker les informations de connexion
        setAuthToken(token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', `${data.firstname} ${data.lastname}`);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userId', data.id);
        
        showNotification('Connexion réussie! Redirection...', 'success');
        
        // Rediriger vers le tableau de bord approprié
        setTimeout(() => {
            redirectToDashboard(data.role);
        }, 1500);
    })
    .catch(error => {
        console.error('Erreur de connexion:', error);
        showNotification(error.message || 'Erreur de connexion. Veuillez réessayer.', 'error');
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    });
}

// Gestion de l'inscription
function handleSignup(event) {
    event.preventDefault();
    
    const firstname = document.getElementById('signup-firstname').value;
    const lastname = document.getElementById('signup-lastname').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const role = document.getElementById('signup-role').value;
    const termsAccepted = document.getElementById('terms-checkbox').checked;
    
    // Validation basique côté client
    if (!firstname || !lastname || !email || !password || !role) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (!termsAccepted) {
        showNotification('Veuillez accepter les conditions d\'utilisation', 'error');
        return;
    }
    
    // Animation du bouton pour indiquer le chargement
    const submitButton = event.target.querySelector('[type="submit"]');
    const originalContent = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Création du compte...';
    submitButton.disabled = true;
    
    // Afficher une notification de chargement
    showNotification('Création du compte en cours...', 'info');
    
    // URL complète avec le port pour l'API
    const apiUrl = `${getAPIBaseUrl()}/api/utilisateurs`;
    
    // Envoi des données au backend
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password,
            role: role
        })
    })
    .then(response => {
        console.log('Statut de la réponse:', response.status);
        // Extraire la réponse JSON ou texte
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                if (!response.ok) {
                    throw { status: response.status, data: data };
                }
                return data;
            });
        } else {
            return response.text().then(text => {
                if (!response.ok) {
                    throw { status: response.status, text: text };
                }
                return text;
            });
        }
    })
    .then(data => {
        console.log('Données de réponse:', data);
        showNotification('Compte créé avec succès! Vous pouvez maintenant vous connecter.', 'success');
        
        // Réinitialiser le formulaire
        document.getElementById('signup-form').reset();
        
        // Passer à l'onglet de connexion
        document.querySelector('.tab-btn[data-tab="login"]').click();
        
        // Pré-remplir l'email dans le formulaire de connexion
        document.getElementById('login-email').value = email;
        document.getElementById('login-role').value = role;
        
        // Restaurer le bouton d'origine
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    })
    .catch(error => {
        console.error('Erreur d\'inscription détaillée:', error);
        
        let errorMessage = 'Erreur lors de la création du compte. Veuillez réessayer.';
        
        if (error.status === 400) {
            if (error.data && error.data.message) {
                errorMessage = error.data.message;
            } else if (typeof error.data === 'string') {
                errorMessage = error.data;
            } else if (error.text) {
                errorMessage = error.text;
            } else {
                errorMessage = 'Cette adresse email est déjà utilisée ou les données sont invalides';
            }
        } else if (error.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        }
        
        showNotification(errorMessage, 'error');
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    });
}

// Connexion via Google
function handleGoogleLogin() {
    // Récupérer le rôle sélectionné (si disponible)
    const roleSelect = document.getElementById('login-role');
    let role = '';
    
    if (roleSelect && roleSelect.value) {
        role = roleSelect.value;
    }
    
    // URL complète avec le port et éventuellement le rôle
    let googleAuthUrl = `${getAPIBaseUrl()}/api/auth/google`;
    
    if (role) {
        googleAuthUrl += `?role=${role}`;
    }
    
    // Redirection vers l'endpoint d'authentification Google
    window.location.href = googleAuthUrl;
}

// Fonction utilitaire pour générer un token fake (pour tests)
function generateFakeToken(userData) {
    // Dans un environnement de production, le token JWT serait généré par le serveur
    // Ceci est juste une simulation pour le développement
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        sub: userData.email,
        name: `${userData.firstname} ${userData.lastname}`,
        role: userData.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 heure
    }));
    const signature = btoa('fake_signature');
    
    return `${header}.${payload}.${signature}`;
}

// Afficher des notifications à l'utilisateur
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

// Vérifier si l'utilisateur est déjà connecté
function checkAuthentication() {
    const token = getAuthToken();
    
    if (token) {
        // For development: Skip token validation and redirect based on stored role
        const role = localStorage.getItem('userRole');
        redirectToDashboard(role);
        
        /* Comment out the original code
        // URL complète avec le port
        const apiUrl = `${getAPIBaseUrl()}/api/auth/validate-token`;
        
        // Vérifier la validité du token avec le backend
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Token invalide ou expiré');
            }
            return response.json();
        })
        .then(data => {
            // Rediriger vers le dashboard correspondant au rôle
            redirectToDashboard(data.role || localStorage.getItem('userRole'));
        })
        .catch(error => {
            console.error('Erreur de validation du token:', error);
            // Supprimer le token invalide
            removeAuthToken();
        });
        */
    }
}

// Obtenir le token d'authentification du localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Définir le token d'authentification dans localStorage
function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

// Supprimer le token d'authentification
function removeAuthToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
}

// Rediriger vers le tableau de bord correspondant au rôle
function redirectToDashboard(role) {
    switch(role) {
        case 'ETUDIANT':
            window.location.href = `${getAppBaseUrl()}/etudiant/dashboard`;
            break;
        case 'ENSEIGNANT':
            window.location.href = `${getAppBaseUrl()}/enseignant/dashboard`;
            break;
        case 'RESPONSABLE':
            window.location.href = `${getAppBaseUrl()}/responsable/dashboard`;
            break;
        case 'PATIENT':
            window.location.href = `${getAppBaseUrl()}/patient/dashboard`;
            break;
        default:
            // En cas de rôle non reconnu, rester sur la page d'accueil
            console.error('Rôle non reconnu:', role);
    }
}

// Obtenir l'URL de base pour l'API backend
function getAPIBaseUrl() {
    // Adresse du serveur backend, à ajuster selon l'environnement
    return 'http://localhost:8081';
}

// Obtenir l'URL de base pour l'application frontend
function getAppBaseUrl() {
    // Si les frontends et backends sont sur des domaines différents
    // Par défaut, on utilise l'URL actuelle
    return window.location.origin;
}