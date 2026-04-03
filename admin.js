document.addEventListener('DOMContentLoaded', () => {
    // Initialize password toggle
    initPasswordToggle();
    
    // Initialize login form handler
    initLoginForm();
    
    // Initialize smooth scroll for anchor links
    initSmoothScroll();
});

// Password toggle functionality
function initPasswordToggle() {
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

// Admin login form handler
function initLoginForm() {
    const loginForm = document.getElementById('admin-login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
}

// Handle admin login form submission
function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    // Validate form
    if (!email || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Animation for loading state
    const submitButton = event.target.querySelector('[type="submit"]');
    const originalContent = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connexion...';
    submitButton.disabled = true;
    
    // Show loading notification
    showNotification('Vérification des identifiants...', 'info');
    
    // API endpoint for admin login
    const apiUrl = `${getAPIBaseUrl()}/api/admins/login`;
    
    // Send data to backend
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
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Email ou mot de passe incorrect');
            }
            throw new Error('Erreur de connexion');
        }
        return response.json();
    })
    .then(data => {
        // Store auth token and admin info
        setAuthToken(data.token || 'demo-token');
        localStorage.setItem('adminName', `${data.firstname} ${data.lastname}`);
        localStorage.setItem('adminEmail', data.email);
        localStorage.setItem('adminId', data.id);
        
        showNotification('Connexion réussie! Redirection...', 'success');
        
        // Redirect to admin dashboard
        setTimeout(() => {
            window.location.href = `${getAppBaseUrl()}/admin-dashboard.html`;
        }, 1500);
    })
    .catch(error => {
        console.error('Erreur de connexion:', error);
        showNotification(error.message || 'Erreur de connexion. Veuillez réessayer.', 'error');
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for fixed header
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationIcon = notification.querySelector('.notification-icon i');
    const notificationMessage = notification.querySelector('.notification-message');
    const closeButton = notification.querySelector('.notification-close');
    
    // Reset classes
    notification.className = 'notification';
    notification.classList.add(type);
    
    // Set icon based on type
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
    
    // Set message
    notificationMessage.textContent = message;
    
    // Show notification
    notification.classList.add('show');
    
    // Auto-close after 5 seconds
    let timeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
    
    // Manual close
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        clearTimeout(timeout);
    }, { once: true });
}

// Get API base URL
function getAPIBaseUrl() {
    // Backend server address, adjust based on environment
    return 'https://web-production-47eca.up.railway.app';
}

// Get app base URL
function getAppBaseUrl() {
    // Default to current domain
    return window.location.origin;
}

// Auth token functions
function setAuthToken(token) {
    localStorage.setItem('adminAuthToken', token);
}

function getAuthToken() {
    return localStorage.getItem('adminAuthToken');
}

function removeAuthToken() {
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminId');
}
