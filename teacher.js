// Auto-redirect if already logged in
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('teacherAuthToken');
    const teacherId = localStorage.getItem('teacherId');
    const currentPage = window.location.pathname;
    if (token && teacherId && currentPage.includes('teacher.html')) {
        window.location.href = 'teacher-dashboard.html';
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs for login/signup
    initTabs();
    
    // Initialize password toggles
    initPasswordToggles();
    
    // Initialize form handlers
    initFormHandlers();
    
    // Initialize 3D model viewer
    initModelViewer();
    
    // Add smooth scroll for anchor links
    initSmoothScroll();
});

// Tabs functionality for login/signup
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
}

// Password toggle functionality
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

// Form submission handlers
function initFormHandlers() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
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
    showNotification('Connexion en cours...', 'info');
    
    // API endpoint for teacher login
    const apiUrl = `${getAPIBaseUrl()}/api/teachers/login`;
    
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
        // Check if user account is pending approval
        if (response.status === 403) {
            throw new Error('Votre compte n\'a pas encore été approuvé par un administrateur');
        }
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Email ou mot de passe incorrect');
            }
            throw new Error('Erreur de connexion');
        }
        return response.json();
    })
    .then(data => {
        // Store auth token and user info
        setAuthToken(data.token || 'demo-token');
        localStorage.setItem('teacherName', `${data.firstname} ${data.lastname}`);
        localStorage.setItem('teacherEmail', data.email);
        localStorage.setItem('teacherId', data.id);
        
        showNotification('Connexion réussie! Redirection...', 'success');
        
        // Redirect to teacher dashboard
        setTimeout(() => {
            window.location.href = `${getAppBaseUrl()}/teacher-dashboard.html`;
        }, 1500);
    })
    .catch(error => {
        console.error('Erreur de connexion:', error);
        showNotification(error.message || 'Erreur de connexion. Veuillez réessayer.', 'error');
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    });
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();
    
    const firstname = document.getElementById('signup-firstname').value;
    const lastname = document.getElementById('signup-lastname').value;
    const email = document.getElementById('signup-email').value;
    const institution = document.getElementById('signup-institution').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const termsAccepted = document.getElementById('terms-checkbox').checked;
    
    // Validate form
    if (!firstname || !lastname || !email || !institution || !password) {
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
    
    // Animation for loading state
    const submitButton = event.target.querySelector('[type="submit"]');
    const originalContent = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Création du compte...';
    submitButton.disabled = true;
    
    // Show loading notification
    showNotification('Création du compte en cours...', 'info');
    
    // API endpoint for teacher registration
    const apiUrl = `${getAPIBaseUrl()}/api/teachers`;
    
    // Send data to backend
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstname: firstname,
            lastname: lastname,
            email: email,
            institution: institution,
            password: password,
            isApproved: false // default to not approved
        })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Cette adresse email est déjà utilisée ou les données sont invalides');
                });
            }
            throw new Error('Erreur lors de la création du compte');
        }
        return response.json();
    })
    .then(data => {
        showNotification('Compte créé avec succès! Votre compte sera examiné par un administrateur. Vous recevrez un email quand votre compte sera approuvé.', 'success');
        
        // Reset form
        document.getElementById('signup-form').reset();
        
        // Switch to login tab
        document.querySelector('.tab-btn[data-tab="login"]').click();
        
        // Restore button
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    })
    .catch(error => {
        showNotification(error.message || 'Erreur lors de la création du compte. Veuillez réessayer.', 'error');
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    });
}

// 3D Model viewer functionality
function initModelViewer() {
    const modelThumbs = document.querySelectorAll('.model-thumb');
    const currentPreview = document.getElementById('current-model-preview');
    const currentName = document.getElementById('current-model-name');
    const currentDesc = document.getElementById('current-model-desc');
    const currentCategory = document.getElementById('current-model-category');
    const currentComplexity = document.getElementById('current-model-complexity');
    
    // Model data (in a real application, this would come from an API)
    const modelData = {
        "1": {
            name: "Orthèse de genou personnalisable",
            description: "Modèle paramétrique d'orthèse de genou avec supports ajustables et articulation personnalisable.",
            category: "Orthèses",
            complexity: "Intermédiaire",
            imageSrc: "/api/placeholder/500/400"
        },
        "2": {
            name: "Prothèse de main articulée",
            description: "Prothèse de main avec doigts articulés et mécanisme de préhension ajustable pour différentes tailles.",
            category: "Prothèses",
            complexity: "Avancé",
            imageSrc: "/api/placeholder/500/400"
        },
        "3": {
            name: "Support plantaire sur mesure",
            description: "Support orthopédique pour le pied avec zones de soutien personnalisables selon la morphologie du patient.",
            category: "Supports",
            complexity: "Débutant",
            imageSrc: "/api/placeholder/500/400"
        },
        "4": {
            name: "Exosquelette de réhabilitation",
            description: "Modèle d'exosquelette léger pour la réhabilitation des membres supérieurs avec systèmes d'attache.",
            category: "Exosquelettes",
            complexity: "Expert",
            imageSrc: "/api/placeholder/500/400"
        }
    };
    
    // Update model viewer with selected model data
    function updateModelViewer(modelId) {
        const model = modelData[modelId];
        if (model) {
            currentName.textContent = model.name;
            currentDesc.textContent = model.description;
            currentCategory.textContent = model.category;
            currentComplexity.textContent = model.complexity;
            
            // Simulate loading a new 3D model with a fade effect
            currentPreview.style.opacity = 0;
            setTimeout(() => {
                currentPreview.src = model.imageSrc;
                currentPreview.style.opacity = 1;
            }, 300);
            
            // Update active thumbnail
            modelThumbs.forEach(thumb => {
                thumb.classList.toggle('active', thumb.dataset.modelId === modelId);
            });
        }
    }
    
    // Add click event to thumbnails
    modelThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const modelId = thumb.dataset.modelId;
            updateModelViewer(modelId);
        });
    });
    
    // Initialize with first model
    updateModelViewer("1");
    
    // Add model control functionality
    document.getElementById('rotate-left').addEventListener('click', () => {
        currentPreview.style.transform = 'rotate(-90deg)';
    });
    
    document.getElementById('rotate-right').addEventListener('click', () => {
        currentPreview.style.transform = 'rotate(90deg)';
    });
    
    document.getElementById('zoom-in').addEventListener('click', () => {
        currentPreview.style.transform = 'scale(1.2)';
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        currentPreview.style.transform = 'scale(0.8)';
    });
    
    // Reset transform when changing models
    modelThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            currentPreview.style.transform = 'none';
        });
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
    localStorage.setItem('teacherAuthToken', token);
}

function getAuthToken() {
    return localStorage.getItem('teacherAuthToken');
}

function removeAuthToken() {
    localStorage.removeItem('teacherAuthToken');
    localStorage.removeItem('teacherName');
    localStorage.removeItem('teacherEmail');
    localStorage.removeItem('teacherId');
}




// Add these functions to the existing teacher.js file

// Handle library access button
function initLibraryAccess() {
    const libraryAccessButton = document.querySelector('.unlock-access .btn-primary');
    
    if (libraryAccessButton) {
        libraryAccessButton.addEventListener('click', (event) => {
            event.preventDefault();
            checkLibraryAccess();
        });
    }
}

// Check if user can access the library
function checkLibraryAccess() {
    const authToken = getAuthToken();
    
    if (!authToken) {
        // User is not logged in, scroll to login section
        document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' });
        showNotification('Veuillez vous connecter pour accéder à la bibliothèque de modèles', 'info');
        return;
    }
    
    // Check if account is approved
    const apiUrl = `${getAPIBaseUrl()}/api/teachers/status`;
    
    // Show loading notification
    showNotification('Vérification de votre accès...', 'info');
    
    // In a real application, we would make an API call
    // For demo purposes, simulate API response
    setTimeout(() => {
        // For demo: assume the user is approved if they have a token
        const isApproved = true;
        
        if (isApproved) {
            showNotification('Accès autorisé. Redirection vers la bibliothèque...', 'success');
            
            // Redirect to library page
            setTimeout(() => {
                window.location.href = 'bibliotheque.html';
            }, 1500);
        } else {
            showNotification('Votre compte n\'a pas encore été approuvé par un administrateur', 'warning');
        }
    }, 1000);
}

// Update the DOMContentLoaded event listener to include the new initialization
document.addEventListener('DOMContentLoaded', () => {
    // Existing initializations
    initTabs();
    initPasswordToggles();
    initFormHandlers();
    initModelViewer();
    initSmoothScroll();
    
    // Add new initialization for library access
    initLibraryAccess();
});

// Update handleLogin function to include isApproved flag
// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    // Find the right email and password inputs, checking multiple possible IDs
    let email, password;
    
    // Try to find email input
    const emailInput = document.getElementById('login-email') || document.getElementById('email');
    if (emailInput) {
        email = emailInput.value;
    } else {
        console.error('Email input not found');
    }
    
    // Try to find password input
    const passwordInput = document.getElementById('login-password') || document.getElementById('password');
    if (passwordInput) {
        password = passwordInput.value;
    } else {
        console.error('Password input not found');
    }
    
    // Validate form
    if (!email || !password) {
        const errorMessage = 'Veuillez remplir tous les champs';
        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        } else if (typeof showError === 'function') {
            showError(errorMessage);
        } else {
            alert(errorMessage);
        }
        return;
    }
    
    // Find submit button
    let submitButton;
    if (event.target && event.target.querySelector) {
        submitButton = event.target.querySelector('[type="submit"]');
    }
    if (!submitButton) {
        submitButton = document.getElementById('login-button');
    }
    
    // Store original content and set loading state if button exists
    let originalContent = '';
    if (submitButton) {
        originalContent = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connexion...';
        submitButton.disabled = true;
    }
    
    // Show loading notification if function exists
    if (typeof showNotification === 'function') {
        showNotification('Connexion en cours...', 'info');
    }
    
    // Determine API URL
    let apiUrl;
    if (typeof getAPIBaseUrl === 'function') {
        apiUrl = `${getAPIBaseUrl()}/api/teachers/login`;
    } else {
        apiUrl = 'https://web-production-47eca.up.railway.app/api/teachers/login';
    }
    
    console.log('Attempting login to:', apiUrl);
    
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
        console.log('Login response status:', response.status);
        
        // Check if user account is pending approval
        if (response.status === 403) {
            throw new Error('Votre compte n\'a pas encore été approuvé par un administrateur');
        }
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Email ou mot de passe incorrect');
            }
            throw new Error('Erreur de connexion');
        }
        return response.json();
    })
    .then(data => {
        console.log('Login successful, received data:', Object.keys(data));
        
        // Store teacher ID directly (ensuring it's a string)
        const teacherId = String(data.id);
        localStorage.setItem('teacherId', teacherId);
        
        // Store teacher information
        if (data.firstname && data.lastname) {
            localStorage.setItem('teacherName', `${data.firstname} ${data.lastname}`);
            localStorage.setItem('firstname', data.firstname);
            localStorage.setItem('lastname', data.lastname);
        }
        
        if (data.email) {
            localStorage.setItem('teacherEmail', data.email);
        }
        
        localStorage.setItem('teacherIsApproved', data.isApproved === true ? 'true' : 'false');
        
        // Store token - ensure we have a valid token
        // If the server doesn't provide a token, use the teacher ID as a fallback
        const token = data.token || teacherId;
        localStorage.setItem('teacherAuthToken', token);
        
        console.log('Stored authentication token:', token);
        console.log('Stored teacher ID:', teacherId);
        
        // Show success notification if function exists
        if (typeof showNotification === 'function') {
            showNotification('Connexion réussie! Redirection...', 'success');
        }
        
        // Redirect to teacher dashboard
        setTimeout(() => {
            window.location.href = 'teacher-dashboard.html';
        }, 1000);
    })
    .catch(error => {
        console.error('Erreur de connexion:', error);
        
        // Show error based on available function
        const errorMessage = error.message || 'Erreur de connexion. Veuillez réessayer.';
        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        } else if (typeof showError === 'function') {
            showError(errorMessage);
        } else {
            alert(errorMessage);
        }
        
        // Restore button if it exists
        if (submitButton) {
            submitButton.innerHTML = originalContent;
            submitButton.disabled = false;
        }
    });
}
// For demo purposes, add mock API function to simulate backend
function mockApiResponse(endpoint, method, data) {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            // Mock responses for different endpoints
            switch (endpoint) {
                case '/api/teachers/login':
                    if (method === 'POST') {
                        // Check credentials (for demo)
                        if (data.email === 'demo@example.com' && data.password === 'password') {
                            resolve({
                                token: 'demo-token',
                                id: '12345',
                                firstname: 'Jean',
                                lastname: 'Dupont',
                                email: 'demo@example.com',
                                isApproved: true
                            });
                        } else {
                            reject(new Error('Email ou mot de passe incorrect'));
                        }
                    }
                    break;
                    
                case '/api/teachers/status':
                    if (method === 'GET') {
                        // Check if token exists (for demo)
                        const token = localStorage.getItem('teacherAuthToken');
                        if (token) {
                            resolve({
                                isApproved: true
                            });
                        } else {
                            reject(new Error('Token invalide'));
                        }
                    }
                    break;
                    
                case '/api/models':
                    if (method === 'GET') {
                        // Return sample models (for demo)
                        resolve({
                            models: getSampleModels()
                        });
                    }
                    break;
                    
                default:
                    reject(new Error('Endpoint non pris en charge'));
            }
        }, 800); // Simulate network delay
    });
}

// Function to get sample models (same as in bibliotheque.js)
function getSampleModels() {
    // Same implementation as in bibliotheque.js
    // This is just a reference to indicate that the same function would be used
    return [];
}



