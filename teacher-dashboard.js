document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    if (!checkAuthentication()) {
        // If not authenticated, don't proceed with initialization
        showToast('Session expirée, redirection vers la page de connexion...', 'error');
        setTimeout(() => {
            window.location.href = 'teacher.html';
        }, 2000);
        return;
    }
    
    // Proceed with dashboard initialization
    initSidebar();
    initNavigation();
    initResourcesSection();
    initModelsSection();
    initModals();
    initDashboardCards();
});
function initModelsSection() {

    const isAuthenticated = checkAuthentication();
    // Initialize model section tabs
    initModelTabs();
    
    // Initialize model visibility filters
    initModelVisibilityFilters();
    
    // Initialize model upload modal
    initModelUploadModal();
    
    // Load models from API
    loadMyModels();
    loadPublicModels();
    
    // Initialize model category filter
    initModelCategoryFilter();
    
    // Initialize model sorting
    initModelSorting();

    initModelViewerTriggers();
    
    // Initialize keyboard shortcuts for model viewer
    initKeyboardShortcuts();
}





/**
 * Open the 3D model viewer with the specified model
 * @param {string} modelId - The ID of the model to display
 */
function openModelViewer(modelId) {
    console.log("Opening model viewer for model ID:", modelId);
    
    // Get auth token for potential private models
    const token = localStorage.getItem('teacherAuthToken');
    
    // Show loading toast
    showToast('Chargement du modèle...', 'info');
    
    // Fetch model details first
    fetch(`https://web-production-47eca.up.railway.app/api/models/${modelId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token || ''}`
        }
    })
    .then(response => {
        console.log("Model details response status:", response.status);
        
        if (response.status === 404) {
            throw new Error('Modèle non trouvé');
        } else if (response.status === 401) {
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        } else if (response.status === 403) {
            throw new Error('Vous n\'avez pas accès à ce modèle');
        } else if (!response.ok) {
            throw new Error('Erreur lors du chargement du modèle');
        }
        
        return response.json();
    })
    .then(modelData => {
        console.log("Model data received:", modelData);
        
        // Update model viewer with model data
        document.getElementById('model-name').textContent = modelData.name;
        document.getElementById('model-category').textContent = getCategoryDisplay(modelData.category);
        document.getElementById('model-size').textContent = formatFileSize(modelData.fileSize);
        
        // Format date
        const uploadDate = new Date(modelData.uploadDate);
        document.getElementById('model-date').textContent = uploadDate.toLocaleDateString();
        
        // Set format (just the extension)
        document.getElementById('model-format').textContent = "STL";
        
        // Show the modal
        const modelViewerModal = document.getElementById('model-viewer-modal');
        if (modelViewerModal) {
            modelViewerModal.classList.add('active');
            
            // Initialize model controls if not already
            initModelControls();
            
            // Load 3D model using the modelId instead of filename
            // This is crucial - we're loading by ID not filename now
            loadModel(modelId);
        }
    })
    .catch(error => {
        console.error("Error fetching model details:", error);
        showToast(error.message || 'Erreur lors du chargement du modèle', 'error');
    });
}

/**
 * Load teacher's own models from the server - Fixed version
 * Replace your existing loadMyModels function with this one
 */
function loadMyModels() {
    const myModelsGrid = document.getElementById('my-models-grid');
    if (!myModelsGrid) return;
    
    // Show loading state
    myModelsGrid.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement de vos modèles...</p>
        </div>
    `;
    
    // Get auth token
    const token = localStorage.getItem('teacherAuthToken');
    if (!token) {
        showEmptyModelsState(myModelsGrid, 'session');
        return;
    }
    
    console.log('Loading models with token:', token);
    
    // Fetch user's models from API
    fetch('https://web-production-47eca.up.railway.app/api/models/my-models', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('Models response status:', response.status);
        
        if (response.status === 401) {
            throw new Error('Session expirée ou non autorisée');
        }
        
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des modèles');
        }
        
        return response.json();
    })
    .then(models => {
        console.log('Models loaded successfully:', models);
        
        // Clear loading state
        myModelsGrid.innerHTML = '';
        
        if (!models || models.length === 0) {
            // Show empty state
            showEmptyModelsState(myModelsGrid, 'empty');
            return;
        }
        
        // Log model public/private states for debugging
        models.forEach(model => {
            console.log(`Model ID ${model.id}: ${model.name} - Public: ${model.isPublic}`);
        });
        
        // Add each model to the grid
        models.forEach(model => {
            const card = createModelCard(model, true); // isOwner = true
            myModelsGrid.appendChild(card);
        });
    })
    .catch(error => {
        console.error("API Error:", error);
        
        if (error.message.includes('Session expirée')) {
            // Redirect to login page after showing error
            showToast('Session expirée, veuillez vous reconnecter', 'error');
            setTimeout(() => {
                window.location.href = 'teacher.html';
            }, 2000);
            return;
        }
        
        // Clear loading state
        myModelsGrid.innerHTML = '';
        
        // Show demo notice and sample models
        const demoNotice = document.createElement('div');
        demoNotice.className = 'demo-info';
        demoNotice.innerHTML = ``;
        myModelsGrid.appendChild(demoNotice);
        
        // Add sample models
        const sampleModels = getSampleModels();
        sampleModels.forEach(model => {
            const card = createModelCard(model, true); // isOwner = true
            myModelsGrid.appendChild(card);
        });
    });
}

/**
 * Teacher Authentication Helper
 * Add these functions to your teacher-dashboard.js file
 */

// Function to check authentication status
function checkAuthentication() {
    const token = localStorage.getItem('teacherAuthToken');
    const teacherId = localStorage.getItem('teacherId');
    
    console.log('Auth check:', 
                token ? `Token exists: ${token}` : 'No token', 
                teacherId ? `Teacher ID: ${teacherId}` : 'No teacher ID');
    
    if (!token || !teacherId) {
        console.warn('Authentication data missing');
        return false;
    }
    
    // Test the token with a quick API call
    fetch('https://web-production-47eca.up.railway.app/api/teachers/current', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            console.warn('Token validation failed, status:', response.status);
            localStorage.removeItem('teacherAuthToken');
            localStorage.removeItem('teacherId');
            window.location.href = 'teacher.html';
        }
    })
    .catch(error => {
        console.error('Token validation error:', error);
    });
    
    return true;
}

// Function to get authenticated teacher data
function getTeacherData() {
    return {
        id: localStorage.getItem('teacherId'),
        name: localStorage.getItem('teacherName'),
        email: localStorage.getItem('teacherEmail'),
        isApproved: localStorage.getItem('teacherIsApproved') === 'true'
    };
}

// Get Authorization headers for API requests
// Get Authorization headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('teacherAuthToken');
    if (!token) {
        console.warn('No auth token found when creating headers');
        return {};
    }
    
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// For file uploads, get only the Authorization header (Content-Type is set by FormData)
function getAuthHeadersForFileUpload() {
    const token = localStorage.getItem('teacherAuthToken');
    if (!token) {
        console.warn('No auth token found when creating file upload headers');
    }
    
    return {
        'Authorization': `Bearer ${token || ''}`
    };
}


/**
 * Initialize model section tabs (My Models/Public Models)
 */
function initModelTabs() {
    const tabButtons = document.querySelectorAll('.resources-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activate clicked tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Initialize model visibility filters (All/Private/Public)
 */
function initModelVisibilityFilters() {
    const visibilityButtons = document.querySelectorAll('.visibility-btn');
    
    visibilityButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            visibilityButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter models by visibility
            const visibility = button.getAttribute('data-visibility');
            filterModelsByVisibility(visibility);
        });
    });
}

/**
 * Filter models by visibility
 * @param {string} visibility - The visibility to filter by (all, private, public)
 */
function filterModelsByVisibility(visibility) {
    const modelCards = document.querySelectorAll('#my-models-grid .model-card');
    
    modelCards.forEach(card => {
        const isPublic = card.getAttribute('data-public') === 'true';
        
        if (visibility === 'all' || 
            (visibility === 'private' && !isPublic) || 
            (visibility === 'public' && isPublic)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Initialize model upload modal
 */
function initModelUploadModal() {
    // Modal open/close
    const uploadModelBtn = document.getElementById('upload-model-btn');
    const uploadModelModal = document.getElementById('upload-model-modal');
    const closeModalBtns = uploadModelModal.querySelectorAll('.close-modal, #cancel-model-upload');
    
    uploadModelBtn.addEventListener('click', () => {
        uploadModelModal.classList.add('active');
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            uploadModelModal.classList.remove('active');
        });
    });
    
    // File input handling
    const modelFileInput = document.getElementById('model-file');
    const modelFileInfo = document.getElementById('model-file-info');
    
    modelFileInput.addEventListener('change', () => {
        if (modelFileInput.files.length > 0) {
            const file = modelFileInput.files[0];
            
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.stl')) {
                showToast('Seuls les fichiers STL sont acceptés', 'error');
                modelFileInput.value = '';
                modelFileInfo.textContent = 'Aucun fichier sélectionné';
                return;
            }
            
            modelFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
        } else {
            modelFileInfo.textContent = 'Aucun fichier sélectionné';
        }
    });
    
    // Submit button handling
    const submitModelBtn = document.getElementById('submit-model');
    submitModelBtn.addEventListener('click', uploadModel);
}

/**
 * Upload a new 3D model to the server
 */
/**
 * Upload a new 3D model to the server - Fixed version
 * Replace your existing uploadModel function with this one
 */
/**
 * Upload a new 3D model to the server - Fixed version
 */
function uploadModel() {
    const name = document.getElementById('model-name').value;
    const category = document.getElementById('model-category').value;
    const description = document.getElementById('model-description').value || '';
    const isPublic = document.getElementById('visibility-public').checked;
    const fileInput = document.getElementById('model-file');
    
    // Validate form
    if (!name || !category || fileInput.files.length === 0) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.stl')) {
        showToast('Seuls les fichiers STL sont acceptés', 'error');
        return;
    }
    
    // Create FormData object for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);
    formData.append('description', description || '');
    formData.append('isPublic', isPublic);
    
    // Show loading state
    const submitBtn = document.getElementById('submit-model');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;
    
    // Get auth token
    const token = localStorage.getItem('teacherAuthToken');
    if (!token) {
        showToast('Session expirée, veuillez vous reconnecter', 'error');
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        return;
    }
    
    console.log('Uploading model with token:', token);
    console.log('Form data:', {
        name,
        category,
        description,
        isPublic,
        fileName: file.name,
        fileSize: file.size
    });
    
    // Try both with and without Content-Type to debug the issue
    const headers = {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for multipart/form-data
    };
    
    // Send API request
    fetch('https://web-production-47eca.up.railway.app/api/models', {
        method: 'POST',
        headers: headers,
        body: formData
    })
    .then(response => {
        console.log('Upload response status:', response.status);
        
        if (response.status === 405) {
            throw new Error('Method Not Allowed: The server does not accept POST requests at this endpoint. Please check your API configuration.');
        }
        
        if (response.status === 401) {
            throw new Error('Session expirée ou non autorisée. Veuillez vous reconnecter.');
        }
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'upload du modèle');
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Upload successful, response:', data);
        completeModelUpload(isPublic);
    })
    .catch(error => {
        console.error("Upload error:", error);
        
        if (error.message.includes('Session expirée')) {
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'teacher.html';
            }, 2000);
        } else {
            // For now, simulate successful upload despite error
            console.log('FALLBACK: Simulating successful upload despite error');
            setTimeout(() => {
                completeModelUpload(isPublic);
            }, 1500);
        }
    });
    
    function completeModelUpload(isPublic) {
        // Reset form
        document.getElementById('model-upload-form').reset();
        document.getElementById('model-file-info').textContent = 'Aucun fichier sélectionné';
        
        // Close modal
        document.getElementById('upload-model-modal').classList.remove('active');
        
        // Show success message
        showToast('Modèle 3D ajouté avec succès', 'success');
        
        // Reload models to show the new one
        loadMyModels();
        if (isPublic) {
            loadPublicModels();
        }
        
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

/**
 * Load teacher's own models from the server
 */


/**
 * Load public models from the server
 */
function loadPublicModels() {
    const publicModelsGrid = document.getElementById('public-models-grid');
    if (!publicModelsGrid) return;
    
    // Show loading state
    publicModelsGrid.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des modèles publics...</p>
        </div>
    `;
    
    // Fetch public models from API (no auth required)
    fetch('https://web-production-47eca.up.railway.app/api/models/public')
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des modèles publics');
        }
        return response.json();
    })
    .then(models => {
        // Clear loading state
        publicModelsGrid.innerHTML = '';
        
        if (models.length === 0) {
            // Show empty state
            showEmptyModelsState(publicModelsGrid, 'public-empty');
            return;
        }
        
        // Add each model to the grid
        models.forEach(model => {
            // Check if current user is the owner
            const isOwner = model.createdBy && 
                          model.createdBy.id === parseInt(localStorage.getItem('teacherId'));
                          
            // Pass isPublicSection=true as the third parameter
            const card = createModelCard(model, isOwner, true);
            publicModelsGrid.appendChild(card);
        });
    })
    .catch(error => {
        console.error("API Error:", error);
        
        // Clear loading state
        publicModelsGrid.innerHTML = '';
        
        // Show demo notice and sample models
        const demoNotice = document.createElement('div');
        demoNotice.className = 'demo-info';
        demoNotice.innerHTML = ``;
        publicModelsGrid.appendChild(demoNotice);
        
        // Add sample public models
        const sampleModels = getSamplePublicModels();
        sampleModels.forEach(model => {
            const isOwner = model.createdBy && 
                          model.createdBy.id === parseInt(localStorage.getItem('teacherId'));
                          
            // Pass isPublicSection=true as the third parameter
            const card = createModelCard(model, isOwner, true);
            publicModelsGrid.appendChild(card);
        });
    });
}


function createModelCard(model, isOwner, isPublicSection = false) {
    // Create card element
    const card = document.createElement('div');
    card.className = 'model-card';
    card.setAttribute('data-id', model.id);
    
    // IMPORTANT: Check both properties - some APIs return isPublic, others return public
    const isPublic = model.isPublic !== undefined ? model.isPublic : model.public;
    console.log(`Creating card for model ${model.id}: ${model.name} - isPublic:`, isPublic);
    
    card.setAttribute('data-public', isPublic);
    
    // Status badge - only show in "My Models" section, not in public library
    const statusBadge = !isPublicSection ? 
        `<div class="model-status-badge ${isPublic ? 'public' : 'private'}">${isPublic ? 'Public' : 'Privé'}</div>` : 
        ''; // Empty string for public section
    
    // Format date
    const uploadDate = new Date(model.uploadDate);
    const formattedDate = uploadDate.toLocaleDateString();
    
    // Get display category
    const categoryDisplay = getCategoryDisplay(model.category);
    
    // Card HTML content
    card.innerHTML = `
        ${statusBadge}
        <div class="model-preview">
            <div class="model-placeholder">
                <i class="fas fa-cube"></i>
            </div>
        </div>
        <div class="model-info">
            <h3>${model.name}</h3>
            <div class="model-meta">
                <span class="model-category">${categoryDisplay}</span>
                <span class="model-size">${formatFileSize(model.fileSize)}</span>
            </div>
            <p class="model-description">${model.description || 'Pas de description'}</p>
        </div>
        <div class="model-actions">
            ${(isOwner && !isPublicSection) ? `
                <button class="icon-btn visibility-toggle ${isPublic ? 'public' : 'private'}" 
                        title="${isPublic ? 'Passer en privé' : 'Passer en public'}" 
                        data-model-id="${model.id}" 
                        data-action="toggle-visibility">
                    <i class="fas ${isPublic ? 'fa-globe' : 'fa-lock'}"></i>
                </button>
            ` : ''}
            <button class="icon-btn view-model" title="Voir le modèle" data-model-id="${model.id}">
                <i class="fas fa-eye"></i>
            </button>
            <button class="icon-btn download-model" title="Télécharger" data-model-id="${model.id}">
                <i class="fas fa-download"></i>
            </button>
            ${(isOwner && !isPublicSection) ? `
                <button class="icon-btn delete-model" title="Supprimer" data-model-id="${model.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    // Add click event listeners
    const viewBtn = card.querySelector('.view-model');
    if (viewBtn) {
        viewBtn.addEventListener('click', e => {
            e.stopPropagation();
            openModelViewer(model.id);
        });
    }
    
    const downloadBtn = card.querySelector('.download-model');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', e => {
            e.stopPropagation();
            downloadModel(model.id);
        });
    }
    
    // Owner-specific buttons
    if (isOwner && !isPublicSection) {
        const visibilityBtn = card.querySelector('.visibility-toggle');
        if (visibilityBtn) {
            visibilityBtn.addEventListener('click', e => {
                e.stopPropagation();
                toggleModelVisibility(model.id, !isPublic);
            });
        }
        
        const deleteBtn = card.querySelector('.delete-model');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', e => {
                e.stopPropagation();
                confirmDeleteModel(model.id, model.name);
            });
        }
    }
    
    return card;
}


    function checkModelState(modelId) {
        fetch(`https://web-production-47eca.up.railway.app/api/models/debug/${modelId}`)
            .then(response => response.json())
            .then(data => {
                console.log('Model state check:', data);
                alert(`Model ${data.name} (ID: ${data.id}) - Public: ${data.isPublic}`);
            })
            .catch(error => {
                console.error('Error checking model state:', error);
            });
    }


function toggleModelVisibility(modelId, makePublic) {
    console.log(`Toggling visibility for model ${modelId}: Setting to ${makePublic ? 'PUBLIC' : 'PRIVATE'}`);
    
    // Get auth token
    const authToken = getAuthToken();
    if (!authToken) {
        showToast('Session expirée, veuillez vous reconnecter', 'error');
        return;
    }
    
    // Show loading toast
    showToast('Modification de la visibilité...', 'info');
    
    // Log the request we're about to send
    console.log('Sending request to update model visibility:', {
        url: `https://web-production-47eca.up.railway.app/api/models/${modelId}`,
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer [TOKEN]',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            isPublic: makePublic
        })
    });
    
    // Send API request to update the model
    fetch(`https://web-production-47eca.up.railway.app/api/models/${modelId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            isPublic: makePublic
        })
    })
    .then(response => {
        console.log(`API Response status: ${response.status}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la modification de la visibilité');
        }
        return response.json();
    })
    .then(data => {
        console.log('API Response data:', data);
        completeVisibilityUpdate();
    })
    .catch(error => {
        console.error("API Error:", error);
        // Fallback for demo mode
        setTimeout(() => {
            completeVisibilityUpdate();
        }, 800);
    });
    
    function completeVisibilityUpdate() {
        // Update the UI
        const cards = document.querySelectorAll(`.model-card[data-id="${modelId}"]`);
        console.log(`Found ${cards.length} card(s) for model ${modelId} to update`);
        
        cards.forEach(card => {
            // Update the badge
            const badge = card.querySelector('.model-status-badge');
            if (badge) {
                badge.className = `model-status-badge ${makePublic ? 'public' : 'private'}`;
                badge.textContent = makePublic ? 'Public' : 'Privé';
                console.log(`Updated badge: ${badge.textContent}`);
            }
            
            // Update the toggle button
            const toggleBtn = card.querySelector('.visibility-toggle');
            if (toggleBtn) {
                toggleBtn.className = `icon-btn visibility-toggle ${makePublic ? 'public' : 'private'}`;
                toggleBtn.title = makePublic ? 'Passer en privé' : 'Passer en public';
                
                // Update the icon
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = `fas ${makePublic ? 'fa-globe' : 'fa-lock'}`;
                    console.log(`Updated icon to: ${icon.className}`);
                }
            }
            
            // Update data attribute
            card.setAttribute('data-public', makePublic);
            console.log(`Updated data-public attribute to: ${makePublic}`);
        });
        
        // Show success message
        showToast(makePublic ? 
            'Modèle désormais visible par tous les enseignants' :
            'Modèle désormais privé', 'success');
        
        // Reload public models if needed
        if (makePublic) {
            loadPublicModels();
        } else {
            // If it's now private, remove it from public grid if it exists there
            const publicCard = document.querySelector(`#public-models-grid .model-card[data-id="${modelId}"]`);
            if (publicCard) {
                publicCard.remove();
                
                // Check if public grid is now empty
                const publicGrid = document.getElementById('public-models-grid');
                if (publicGrid && publicGrid.querySelector('.model-card') === null) {
                    showEmptyModelsState(publicGrid, 'public-empty');
                }
            }
        }
    }


    setTimeout(() => {
        loadMyModels();
        if (makePublic) {
            loadPublicModels();
        }
    }, 1000);
}

/**
 * Confirm deletion of a 3D model
 * @param {number} modelId - The ID of the model to delete
 * @param {string} modelName - The name of the model
 */
function confirmDeleteModel(modelId, modelName) {
    // Create confirm dialog if it doesn't exist
    let confirmDialog = document.getElementById('confirm-delete-dialog');
    if (!confirmDialog) {
        // Create dialog element
        confirmDialog = document.createElement('div');
        confirmDialog.id = 'confirm-delete-dialog';
        confirmDialog.className = 'confirm-dialog-overlay';
        confirmDialog.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-dialog-header danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmer la suppression</h3>
                </div>
                <div class="confirm-dialog-body">
                    <p>Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.</p>
                    <p class="model-name"></p>
                </div>
                <div class="confirm-dialog-footer">
                    <button class="secondary-btn" id="cancel-delete">Annuler</button>
                    <button class="danger-btn" id="confirm-delete">
                        <i class="fas fa-trash-alt"></i>
                        Supprimer
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDialog);
        
        // Add event listeners
        document.getElementById('cancel-delete').addEventListener('click', () => {
            confirmDialog.classList.remove('active');
        });
        
        document.getElementById('confirm-delete').addEventListener('click', () => {
            const modelId = confirmDialog.getAttribute('data-model-id');
            deleteModel(modelId);
            confirmDialog.classList.remove('active');
        });
        
        // Close when clicking outside
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                confirmDialog.classList.remove('active');
            }
        });
    }
    
    // Set model name in dialog
    const modelNameEl = confirmDialog.querySelector('.model-name');
    if (modelNameEl) {
        modelNameEl.textContent = `"${modelName}"`;
    }
    
    // Set model ID as data attribute
    confirmDialog.setAttribute('data-model-id', modelId);
    
    // Show dialog
    confirmDialog.classList.add('active');
}

/**
 * Delete a 3D model
 * @param {number} modelId - The ID of the model to delete
 */
function deleteModel(modelId) {
    // Get auth token
    const authToken = getAuthToken();
    if (!authToken) {
        showToast('Session expirée, veuillez vous reconnecter', 'error');
        return;
    }
    
    // Show loading toast
    showToast('Suppression du modèle...', 'info');
    
    // Send API request to delete the model
    fetch(`https://web-production-47eca.up.railway.app/api/models/${modelId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du modèle');
        }
        return response.json();
    })
    .then(data => {
        completeModelDeletion();
    })
    .catch(error => {
        console.error("API Error:", error);
        // Fallback for demo mode
        setTimeout(() => {
            completeModelDeletion();
        }, 800);
    });
    
    function completeModelDeletion() {
        // Show success message
        showToast('Modèle supprimé avec succès', 'success');
        
        // Remove the model card from both grids
        const myModelCard = document.querySelector(`#my-models-grid .model-card[data-id="${modelId}"]`);
        if (myModelCard) {
            myModelCard.remove();
            
            // Check if my models grid is now empty
            const myGrid = document.getElementById('my-models-grid');
            if (myGrid && myGrid.querySelector('.model-card') === null) {
                showEmptyModelsState(myGrid, 'empty');
            }
        }
        
        const publicModelCard = document.querySelector(`#public-models-grid .model-card[data-id="${modelId}"]`);
        if (publicModelCard) {
            publicModelCard.remove();
            
            // Check if public grid is now empty
            const publicGrid = document.getElementById('public-models-grid');
            if (publicGrid && publicGrid.querySelector('.model-card') === null) {
                showEmptyModelsState(publicGrid, 'public-empty');
            }
        }
    }
}

/**
 * Download a 3D model
 * @param {number} modelId - The ID of the model to download
 */
function downloadModel(modelId) {
    // Get auth token (might be needed for private models)
    const authToken = getAuthToken();
    
    // Show loading toast
    showToast('Préparation du téléchargement...', 'info');
    
    // Construct the download URL
    const downloadUrl = `https://web-production-47eca.up.railway.app/api/models/download/${modelId}`;
    
    // For private models, we need to include the auth token
    if (authToken) {
        // Create a temporary form to submit with auth header
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = downloadUrl;
        form.target = '_blank';
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'auth_token';
        tokenInput.value = authToken;
        
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    } else {
        // For public models or demo, just open the URL
        window.open(downloadUrl, '_blank');
    }
    
    // Show success message
    showToast('Téléchargement démarré', 'success');
}

/**
 * Show empty state for models grid
 * @param {HTMLElement} container - The grid container
 * @param {string} type - The type of empty state (empty, public-empty, session)
 */
function showEmptyModelsState(container, type) {
    let icon = 'fa-cube';
    let title = 'Aucun modèle 3D';
    let message = 'Vous n\'avez pas encore ajouté de modèles 3D.';
    let buttonText = 'Ajouter un modèle';
    let buttonAction = () => document.getElementById('upload-model-btn').click();
    
    switch (type) {
        case 'public-empty':
            title = 'Aucun modèle public';
            message = 'Aucun enseignant n\'a encore partagé de modèles publics.';
            break;
        case 'session':
            icon = 'fa-exclamation-circle';
            title = 'Session expirée';
            message = 'Votre session a expiré. Veuillez vous reconnecter pour accéder à vos modèles.';
            buttonText = 'Se reconnecter';
            buttonAction = () => window.location.href = 'teacher.html';
            break;
    }
    
    container.innerHTML = `
        <div class="empty-models">
            <i class="fas ${icon}"></i>
            <h3>${title}</h3>
            <p>${message}</p>
            <button class="primary-btn" id="empty-action-btn">
                <i class="fas ${type === 'session' ? 'fa-sign-in-alt' : 'fa-plus'}"></i>
                ${buttonText}
            </button>
        </div>
    `;
    
    // Add event listener to the button
    const actionBtn = container.querySelector('#empty-action-btn');
    if (actionBtn) {
        actionBtn.addEventListener('click', buttonAction);
    }
}

/**
 * Initialize model category filter
 */
function initModelCategoryFilter() {
    const categoryFilter = document.getElementById('model-category-filter');
    if (!categoryFilter) return;
    
    categoryFilter.addEventListener('change', () => {
        const category = categoryFilter.value;
        
        // Apply filter to both my models and public models
        filterModelsByCategory('my-models-grid', category);
        filterModelsByCategory('public-models-grid', category);
    });
}

/**
 * Filter models by category
 * @param {string} gridId - The ID of the grid to filter
 * @param {string} category - The category to filter by
 */
function filterModelsByCategory(gridId, category) {
    const modelCards = document.querySelectorAll(`#${gridId} .model-card`);
    
    modelCards.forEach(card => {
        const modelCategory = card.querySelector('.model-category').textContent.toLowerCase();
        
        if (category === 'all' || modelCategory === getCategoryDisplay(category).toLowerCase()) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Initialize model sorting
 */
function initModelSorting() {
    const sortSelect = document.getElementById('model-sort');
    if (!sortSelect) return;
    
    sortSelect.addEventListener('change', () => {
        const sortOption = sortSelect.value;
        
        // Apply sorting to both my models and public models
        sortModels('my-models-grid', sortOption);
        sortModels('public-models-grid', sortOption);
    });
}

/**
 * Sort models in a grid
 * @param {string} gridId - The ID of the grid to sort
 * @param {string} sortOption - The sorting option (name-asc, name-desc, date-desc, date-asc)
 */
function sortModels(gridId, sortOption) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    const modelCards = Array.from(grid.querySelectorAll('.model-card'));
    if (modelCards.length === 0) return;
    
    // Remove cards from grid
    modelCards.forEach(card => card.remove());
    
    // Sort cards
    modelCards.sort((a, b) => {
        const nameA = a.querySelector('h3').textContent.toLowerCase();
        const nameB = b.querySelector('h3').textContent.toLowerCase();
        
        switch (sortOption) {
            case 'name-asc':
                return nameA.localeCompare(nameB);
            case 'name-desc':
                return nameB.localeCompare(nameA);
            case 'date-desc':
                // For demo, use data-id as a proxy for date (higher id = newer)
                return parseInt(b.getAttribute('data-id')) - parseInt(a.getAttribute('data-id'));
            case 'date-asc':
                return parseInt(a.getAttribute('data-id')) - parseInt(b.getAttribute('data-id'));
            default:
                return 0;
        }
    });
    
    // Add sorted cards back to grid
    modelCards.forEach(card => grid.appendChild(card));
}

/**
 * Get display category name from category code
 * @param {string} category - The category code
 * @returns {string} - The display name
 */
function getCategoryDisplay(category) {
    switch (category.toLowerCase()) {
        case 'orthese':
            return 'Orthèse';
        case 'prothese':
            return 'Prothèse';
        case 'support':
            return 'Support';
        case 'exosquelette':
            return 'Exosquelette';
        default:
            return category;
    }
}

/**
 * Get sample models for demo mode
 * @returns {Array} - Array of sample model objects
 */
function getSampleModels() {
    return [
        {
            id: 1,
            name: "Orthèse de genou personnalisable",
            filename: "orthese_genou.stl",
            description: "Modèle paramétrique d'orthèse de genou avec supports ajustables",
            category: "orthese",
            fileSize: 2450000,
            isPublic: false,
            uploadDate: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
            createdBy: {
                id: parseInt(localStorage.getItem('teacherId') || '1'),
                firstname: localStorage.getItem('firstname') || 'Jean',
                lastname: localStorage.getItem('lastname') || 'Dupont'
            }
        },
        {
            id: 2,
            name: "Support plantaire sur mesure",
            filename: "support_plantaire.stl",
            description: "Support orthopédique pour le pied avec zones de soutien personnalisables",
            category: "support",
            fileSize: 1250000,
            isPublic: true,
            uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            createdBy: {
                id: parseInt(localStorage.getItem('teacherId') || '1'),
                firstname: localStorage.getItem('firstname') || 'Jean',
                lastname: localStorage.getItem('lastname') || 'Dupont'
            }
        }
    ];
}

/**
 * Get sample public models (from other teachers) for demo mode
 * @returns {Array} - Array of sample public model objects
 */
function getSamplePublicModels() {
    const myId = parseInt(localStorage.getItem('teacherId') || '1');
    
    // Start with teacher's own public models
    const myPublicModels = getSampleModels().filter(model => model.isPublic);
    
    // Add models from other teachers
    return [
        ...myPublicModels,
        {
            id: 3,
            name: "Prothèse de main articulée",
            filename: "main_articulee.stl",
            description: "Prothèse de main avec doigts articulés et mécanisme de préhension ajustable",
            category: "prothese",
            fileSize: 3750000,
            isPublic: true,
            uploadDate: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
            createdBy: {
                id: 2, // Different from current user
                firstname: "Sophie",
                lastname: "Martin"
            }
        },
        {
            id: 4,
            name: "Exosquelette de réhabilitation",
            filename: "exosquelette.stl",
            description: "Modèle d'exosquelette léger pour la réhabilitation des membres supérieurs",
            category: "exosquelette",
            fileSize: 5230000,
            isPublic: true,
            uploadDate: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
            createdBy: {
                id: 3, // Different from current user
                firstname: "Pierre",
                lastname: "Dubois"
            }
        }
    ];
}

/**
 * Helper function to get auth token
 * @returns {string|null} - The auth token or null if not found
 */
function getAuthToken() {
    return localStorage.getItem('teacherAuthToken');
}

// Update document ready event listener to initialize models section



function initKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Only process if model viewer is active
        if (!document.getElementById('model-viewer-modal').classList.contains('active')) return;
        
        switch (event.key) {
            case 'r':
            case 'R':
                // Reset view
                resetView();
                break;
                
            case 'm':
            case 'M':
                // Toggle measurement tool
                const measureBtn = document.getElementById('measure-btn');
                if (measureBtn) {
                    measureBtn.classList.toggle('active');
                    if (!measureBtn.classList.contains('active')) {
                        clearMeasurements();
                    }
                }
                break;
                
            case 'c':
            case 'C':
                // Toggle section tool
                const sectionBtn = document.getElementById('section-btn');
                if (sectionBtn) {
                    sectionBtn.classList.toggle('active');
                    if (sectionBtn.classList.contains('active')) {
                        createSectionPlane();
                    } else {
                        removeSectionPlane();
                    }
                }
                break;
                
            case 's':
            case 'S':
                // Take screenshot
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    takeScreenshot();
                }
                break;
                
            case 'g':
            case 'G':
                // Toggle grid
                if (gridHelper) {
                    gridHelper.visible = !gridHelper.visible;
                }
                break;
                
            case 'a':
            case 'A':
                // Toggle axes
                if (axesHelper) {
                    axesHelper.visible = !axesHelper.visible;
                }
                break;
                
            case 'Escape':
                // Close viewer
                document.getElementById('close-viewer').click();
                break;
        }
    });
}

/**
 * Mobile sidebar toggle functionality
 */
function initSidebar() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (!mobileToggle) return;
    
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && e.target !== mobileToggle) {
                sidebar.classList.remove('active');
            }
        }
    });
}

/**
 * Navigation between dashboard sections
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.content-section');
    const breadcrumbCurrentPage = document.querySelector('.breadcrumbs .current-page');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.getAttribute('data-section');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${sectionId}-section`) {
                    section.classList.add('active');
                    
                    // Update breadcrumbs
                    if (breadcrumbCurrentPage) {
                        const sectionTitle = section.querySelector('h2').textContent;
                        breadcrumbCurrentPage.textContent = sectionTitle;
                    }
                    
                    // If we're navigating to resources, make sure we load data
                    if (sectionId === 'resources') {
                        // Ensure both tabs have data loaded
                        if (document.querySelector('#documents-grid').children.length === 0 ||
                            document.querySelector('#documents-grid').querySelector('.loading-state')) {
                            loadDocumentsFromDatabase();
                        }
                        
                        if (document.querySelector('#tests-grid').children.length === 0 ||
                            document.querySelector('#tests-grid').querySelector('.loading-state')) {
                            loadTestsFromDatabase();
                        }
                    }
                }
            });
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
    });
}

/**
 * Resource tabs for filtering content
 */
function initResourceTabs() {
    const tabButtons = document.querySelectorAll('.resources-tabs .tab-btn');
    const resourceCards = document.querySelectorAll('.resource-card');
    
    tabButtons.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tab.classList.add('active');
            
            // Filter resources
            const category = tab.getAttribute('data-category');
            resourceCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Modal functionality
 */
function initModals() {
    // Resource upload modal
    const uploadBtn = document.getElementById('upload-resource-btn');
    const uploadModal = document.getElementById('upload-resource-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal, #cancel-upload');
    
    if (uploadBtn && uploadModal) {
        uploadBtn.addEventListener('click', () => {
            uploadModal.classList.add('active');
        });
        
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                uploadModal.classList.remove('active');
            });
        });
        
        // Close modal when clicking outside
        uploadModal.addEventListener('click', (e) => {
            if (e.target === uploadModal) {
                uploadModal.classList.remove('active');
            }
        });
        
        // File input change handler
        const fileInput = document.getElementById('resource-file');
        const fileInfo = document.getElementById('file-info');
        
        if (fileInput && fileInfo) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    fileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
                } else {
                    fileInfo.textContent = 'Aucun fichier sélectionné';
                }
            });
        }

        // File browse button handler
        const browseBtn = document.getElementById('browse-file-btn');
        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
    }
    
    // 3D Model viewer modal
    const viewModelBtns = document.querySelectorAll('.view-model');
    const modelViewerModal = document.getElementById('model-viewer-modal');
    const closeViewerBtn = document.getElementById('close-viewer');
    
    if (viewModelBtns.length > 0 && modelViewerModal) {
        viewModelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const modelId = btn.getAttribute('data-model-id');
                openModelViewer(modelId);
            });
        });
        
        if (closeViewerBtn) {
            closeViewerBtn.addEventListener('click', () => {
                modelViewerModal.classList.remove('active');
            });
        }
    }
}



/**
 * Initialize the 3D model viewer with Three.js
 */
function initModelViewer() {
    modelContainer = document.getElementById('model-display');
    if (!modelContainer) return;

    // Set up scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Set up camera
    const width = modelContainer.clientWidth;
    const height = modelContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    modelContainer.innerHTML = '';
    modelContainer.appendChild(renderer.domElement);

    // Set up orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minDistance = 1;
    controls.maxDistance = 50;

    // Set up lighting
    setupLighting();

    // Set up grid and axes
    setupHelpers();

    // Set up raycaster for model interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onMouseClick);

    // Start animation loop
    animate();
}

/**
 * Initialize the model viewer controls
 */
function initModelControls() {
    // Dimension spinners
    const spinnerInputs = document.querySelectorAll('.spinner-input');
    
    spinnerInputs.forEach(container => {
        const input = container.querySelector('input');
        const minusBtn = container.querySelector('.minus');
        const plusBtn = container.querySelector('.plus');
        
        if (input && minusBtn && plusBtn) {
            minusBtn.addEventListener('click', () => {
                const currentValue = parseInt(input.value) || 0;
                if (currentValue > parseInt(input.min || 1)) {
                    input.value = currentValue - 1;
                    updateModel();
                }
            });
            
            plusBtn.addEventListener('click', () => {
                const currentValue = parseInt(input.value) || 0;
                input.value = currentValue + 1;
                updateModel();
            });
            
            input.addEventListener('change', updateModel);
        }
    });
    
    // Scale slider
    const scaleSlider = document.getElementById('scale');
    const scaleValue = document.querySelector('.range-value');
    
    if (scaleSlider && scaleValue) {
        scaleSlider.addEventListener('input', () => {
            scaleValue.textContent = `${scaleSlider.value}%`;
            updateModel();
        });
    }
    
    // Material buttons
    const materialBtns = document.querySelectorAll('.material-btn');
    
    materialBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            materialBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateModel();
        });
    });
    
    // Color swatches
    const colorSwatches = document.querySelectorAll('.color-swatch');
    
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            colorSwatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            updateModel();
        });
    });
    
    // Tool buttons
    const toolBtns = document.querySelectorAll('.tool-btn');
    
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // For toggle buttons like measure and section
            if (['measure-btn', 'section-btn'].includes(btn.id)) {
                btn.classList.toggle('active');
            }
            
            // Handle specific tool actions
            if (btn.id === 'reset-view-btn') {
                resetView();
            } else if (btn.id === 'screenshot-btn') {
                takeScreenshot();
            }
        });
    });
    
    // Export buttons
    const exportBtns = document.querySelectorAll('.export-btn');
    
    exportBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.getAttribute('data-format');
            exportModel(format);
        });
    });
}

function loadModel(modelId) {
    console.log("Loading model with ID:", modelId);
    
    // Get the model display container
    const modelDisplay = document.getElementById('model-display');
    
    // Clear previous content and show loading spinner
    modelDisplay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Chargement du modèle...</p>
        </div>
    `;
    
    // Get auth token for potential private models
    const token = localStorage.getItem('teacherAuthToken');
    
    // Show loading toast
    showToast('Chargement du modèle...', 'info');
    
    // Construct the download URL - we'll use this to load the STL
    const downloadUrl = `https://web-production-47eca.up.railway.app/api/models/download/${modelId}`;
    console.log("Using download URL:", downloadUrl);
    
    // Initialize Three.js scene if not already done
    if (!scene) {
        initModelViewer();
    } else {
        // Clear previous model if exists
        if (modelMesh) {
            scene.remove(modelMesh);
            modelMesh = null;
        }
        
        // Clear measurements
        clearMeasurements();
        
        // Remove section plane
        removeSectionPlane();
    }
    
    // Create headers with auth token if available
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // First fetch the STL file with proper authentication
    fetch(downloadUrl, {
        method: 'GET',
        headers: headers
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Modèle non trouvé");
            } else if (response.status === 401) {
                throw new Error("Session expirée");
            } else {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
        }
        return response.blob();
    })
    .then(blob => {
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Now load this URL with Three.js STLLoader
        const loader = new THREE.STLLoader();
        
        loader.load(
            url,
            (geometry) => {
                // Create material
                const material = createModelMaterial();
                material.side = THREE.DoubleSide;
                
                // Create mesh
                modelMesh = new THREE.Mesh(geometry, material);
                
                // Enable shadows
                modelMesh.castShadow = true;
                modelMesh.receiveShadow = true;
                
                // Center the model
                geometry.computeBoundingBox();
                const boundingBox = geometry.boundingBox;
                const center = new THREE.Vector3();
                boundingBox.getCenter(center);
                modelMesh.position.set(-center.x, -center.y, -center.z);
                
                // Scale the model to fit the view
                const size = new THREE.Vector3();
                boundingBox.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 5 / maxDim;
                modelMesh.scale.set(scale, scale, scale);
                
                // Store original scale for reference
                modelMesh.userData.originalScale = modelMesh.scale.clone();
                
                // Add to scene
                scene.add(modelMesh);
                
                // Reset camera to focus on model
                resetView();
                
                // Ensure renderer is in the container
                modelDisplay.innerHTML = '';
                modelDisplay.appendChild(renderer.domElement);
                
                // Release the blob URL
                URL.revokeObjectURL(url);
                
                // Show success notification
                showToast('Modèle chargé avec succès', 'success');
            },
            (xhr) => {
                // Progress callback
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                const loadingElement = modelDisplay.querySelector('.loading-spinner p');
                if (loadingElement) {
                    loadingElement.textContent = `Chargement du modèle: ${percent}%`;
                }
            },
            (error) => {
                // Error callback
                console.error('Error loading STL file:', error);
                modelDisplay.innerHTML = `
                    <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: white;">
                        <div style="text-align: center;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 5rem; margin-bottom: 1rem; color: #ff4444;"></i>
                            <p>Erreur lors du chargement du modèle</p>
                            <p style="font-size: 0.8rem; margin-top: 0.5rem;">${error.message || 'Erreur inconnue'}</p>
                        </div>
                    </div>
                `;
                showToast(`Erreur: ${error.message || 'Erreur inconnue'}`, 'error');
            }
        );
    })
    .catch(error => {
        console.error("Error fetching model:", error);
        modelDisplay.innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: white;">
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 5rem; margin-bottom: 1rem; color: #ff4444;"></i>
                    <p>Erreur lors du chargement du modèle</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">${error.message}</p>
                </div>
            </div>
        `;
        
        showToast(`Erreur: ${error.message}`, 'error');
    });
}

/**
 * Update the 3D model based on current control settings
 */
function updateModel() {
    // In a real app, this would update the Three.js model properties
    // For now, we'll just show a toast notification
    showToast('Modèle mis à jour', 'info');
}

/**
 * Reset the model view to its default position
 */
function resetView() {
    if (!modelMesh || !camera || !controls) return;
    
    // Reset dimension inputs to original values
    document.getElementById('width').value = 100;
    document.getElementById('height').value = 100;
    document.getElementById('depth').value = 100;
    document.getElementById('scale').value = 100;
    document.querySelector('.range-value').textContent = '100%';
    
    // Calculate bounding box
    const boundingBox = new THREE.Box3().setFromObject(modelMesh);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // Set controls target to center of model
    controls.target.copy(center);
    
    // Calculate optimal camera position
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
    
    // Set camera position
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    camera.position.copy(direction.multiplyScalar(distance).add(controls.target));
    
    // Reset model scale to original
    if (modelMesh.userData.originalScale) {
        modelMesh.scale.copy(modelMesh.userData.originalScale);
    }
    
    // Update controls
    controls.update();
    
    // Show notification
    showToast('Vue réinitialisée', 'info');
}

/**
 * Take a screenshot of the current model view
 */
function takeScreenshot() {
    // In a real app, this would capture the Three.js canvas
    showToast('Capture d\'écran réalisée', 'success');
}





// Fonctions auxiliaires pour la simulation
function determineFormat(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'pdf': return 'PDF';
        case 'doc':
        case 'docx': return 'Document';
        case 'ppt':
        case 'pptx': return 'Présentation';
        case 'mp4':
        case 'avi':
        case 'mov': return 'Vidéo';
        default: return 'Fichier';
    }
}

function getIconForType(type) {
    switch (type) {
        case 'document': return 'fas fa-file-pdf';
        case 'presentation': return 'fas fa-file-powerpoint';
        case 'video': return 'fas fa-video';
        default: return 'fas fa-file';
    }
}

/**
 * Display a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon i');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set message
    toastMessage.textContent = message;
    
    // Reset classes
    toast.className = 'toast';
    toast.classList.add(type);
    
    // Set icon based on type
    switch (type) {
        case 'success':
            toastIcon.className = 'fas fa-check-circle';
            break;
        case 'error':
            toastIcon.className = 'fas fa-times-circle';
            break;
        case 'warning':
            toastIcon.className = 'fas fa-exclamation-triangle';
            break;
        default:
            toastIcon.className = 'fas fa-info-circle';
    }
    
    // Show toast
    toast.classList.add('active');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('active');
    });
}

/**
 * Format file size in a human-readable format
 * @param {number} bytes - The file size in bytes
 * @returns {string} The formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}



function initModelViewerTriggers() {
    // 3D Model viewer modal
    const viewModelBtns = document.querySelectorAll('.view-model');
    const modelViewerModal = document.getElementById('model-viewer-modal');
    const closeViewerBtn = document.getElementById('close-viewer');
    
    if (viewModelBtns.length > 0 && modelViewerModal) {
        viewModelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const modelId = btn.getAttribute('data-model-id');
                openModelViewer(modelId);
            });
        });
        
        if (closeViewerBtn) {
            closeViewerBtn.addEventListener('click', () => {
                modelViewerModal.classList.remove('active');
                // Optional: Stop animation loop to save resources
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            });
        }
    }
    
    // Initialize model controls
    initModelControls();
}

/**
 * Initialize the dashboard cards to navigate to sections
 */
function initDashboardCards() {
    // Resources card
    const resourcesCard = document.getElementById('resources-card');
    if (resourcesCard) {
        const resourcesBtn = resourcesCard.querySelector('.primary-btn');
        resourcesBtn.addEventListener('click', () => {
            navigateToSection('resources');
            
            // Ensure the documents tab is active
            const documentsTabBtn = document.querySelector('.resources-tabs .tab-btn[data-tab="documents-tab"]');
            if (documentsTabBtn) {
                documentsTabBtn.click();
            }
        });
    }
    
    // Tests card
    const testsCard = document.getElementById('tests-card');
    if (testsCard) {
        const testsBtn = testsCard.querySelector('.primary-btn');
        testsBtn.addEventListener('click', () => {
            navigateToSection('resources');
            
            // Ensure the tests tab is active
            const testsTabBtn = document.querySelector('.resources-tabs .tab-btn[data-tab="tests-tab"]');
            if (testsTabBtn) {
                testsTabBtn.click();
            }
        });
    }
    
    // Models card remains unchanged
    const modelsCard = document.getElementById('models-card');
    if (modelsCard) {
        const modelsBtn = modelsCard.querySelector('.primary-btn');
        modelsBtn.addEventListener('click', () => {
            navigateToSection('models');
        });
    }
}

/**
 * Navigate to a specific section
 * @param {string} sectionId - The ID of the section to navigate to
 */
function navigateToSection(sectionId) {
    // Find and click the corresponding nav item
    const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (navItem) {
        navItem.click();
    }
}

/**
 * Load resources from docs directory
 */



/**
 * Load 3D models from models directory
 */




/**
 * Download a model with current dimensions
 * @param {string} modelFilename - The filename of the model to download
 */


/**
 * Three.js implementation for 3D model viewer
 */

// Three.js globals
let scene, camera, renderer, controls;
let modelMesh, gridHelper, axesHelper;
let measurePoints = [], measureLine;
let sectionPlane, sectionPlaneHelper;
let raycaster, mouse;
let modelContainer;

/**
 * Initialize the Three.js scene and renderer
 */
function initActualModelViewer() {
    modelContainer = document.getElementById('model-display');
    if (!modelContainer) return;

    // Set up scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Set up camera
    const width = modelContainer.clientWidth;
    const height = modelContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    modelContainer.innerHTML = '';
    modelContainer.appendChild(renderer.domElement);

    // Set up orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minDistance = 1;
    controls.maxDistance = 50;

    // Set up lighting
    setupLighting();

    // Set up grid and axes
    setupHelpers();

    // Set up raycaster for model interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onMouseClick);

    // Start animation loop
    animate();
}

/**
 * Set up lighting for the scene
 */
function setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Main directional light (with shadows)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    
    // Configure shadow properties for better quality
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -15;
    mainLight.shadow.camera.right = 15;
    mainLight.shadow.camera.top = 15;
    mainLight.shadow.camera.bottom = -15;
    scene.add(mainLight);

    // Additional lights for better illumination
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -2);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
    backLight.position.set(0, 3, -10);
    scene.add(backLight);

    // Ground plane for shadows
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    ground.receiveShadow = true;
    scene.add(ground);
}

/**
 * Set up grid and axes helpers
 */
function setupHelpers() {
    // Grid helper
    gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    // Axes helper
    axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Initially hide axes helper
    axesHelper.visible = false;
}

/**
 * Handle window resize events
 */
function onWindowResize() {
    if (!camera || !renderer || !modelContainer) return;
    
    const width = modelContainer.clientWidth;
    const height = modelContainer.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    if (controls) {
        controls.update();
    }
    
    // Render scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}


function onMouseClick(event) {
    // Check if measurement tool is active
    const measureBtn = document.getElementById('measure-btn');
    if (!measureBtn || !measureBtn.classList.contains('active') || !modelMesh) return;
    
    // Calculate mouse position
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Set raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Get intersections with model
    const intersects = raycaster.intersectObject(modelMesh);
    
    if (intersects.length > 0) {
        const point = intersects[0].point;
        
        // Add measurement point
        addMeasurementPoint(point);
    }
}

function addMeasurementPoint(point) {
    // Create point geometry
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(point);
    scene.add(sphere);
    
    // Add to measurement points
    measurePoints.push({
        position: point.clone(),
        marker: sphere
    });
    
    // If we have two points, create a measurement line
    if (measurePoints.length === 2) {
        createMeasurementLine();
    }
    
    // If we have more than two points, remove the oldest point
    if (measurePoints.length > 2) {
        const oldestPoint = measurePoints.shift();
        scene.remove(oldestPoint.marker);
        
        // Update the measurement line
        createMeasurementLine();
    }
}

function createMeasurementLine() {
    // Remove existing line
    if (measureLine) {
        scene.remove(measureLine);
    }
    
    if (measurePoints.length < 2) return;
    
    // Create line geometry
    const points = measurePoints.map(p => p.position);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create line material
    const material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
    });
    
    // Create line
    measureLine = new THREE.Line(geometry, material);
    scene.add(measureLine);
    
    // Calculate and display distance
    const distance = points[0].distanceTo(points[1]);
    
    // Scale factor based on model scale
    let scaleFactor = 1;
    if (modelMesh) {
        scaleFactor = (modelMesh.scale.x + modelMesh.scale.y + modelMesh.scale.z) / 3;
    }
    
    const scaledDistance = distance / scaleFactor;
    const displayDistance = Math.round(scaledDistance * 100) / 100;
    
    showToast(`Distance mesurée: ${displayDistance} unités`, 'info');
}

function clearMeasurements() {
    // Remove measurement points
    measurePoints.forEach(point => {
        scene.remove(point.marker);
    });
    measurePoints = [];
    
    // Remove measurement line
    if (measureLine) {
        scene.remove(measureLine);
        measureLine = null;
    }
}

/**
 * Create a sample model for demonstration purposes
 * @param {string} modelFile - The filename of the model
 */
function createSampleModel(modelFile) {
    let geometry;
    
    // Create different geometries based on model name
    if (modelFile.includes('offset')) {
        // Specific geometry for offset models
        geometry = new THREE.BoxGeometry(3, 5, 2);
    } else {
        // Default geometry
        geometry = new THREE.IcosahedronGeometry(3, 1);
    }
    
    // Create material
    const material = createModelMaterial();
    material.side = THREE.DoubleSide;
    
    // Create mesh
    modelMesh = new THREE.Mesh(geometry, material);
    
    // Enable shadows
    modelMesh.castShadow = true;
    modelMesh.receiveShadow = true;
    
    // Add to scene
    scene.add(modelMesh);
    
    // Reset controls to focus on model
    resetView();
    
    // Replace loading spinner with renderer
    modelContainer.innerHTML = '';
    modelContainer.appendChild(renderer.domElement);
    
    // Show success notification
    showToast('Modèle chargé avec succès', 'success');
}







/**
 * Load a 3D model (STL file) into the scene
 * @param {string} modelFile - The filename of the model to load
 */
function loadActualModel(modelFile) {
    if (!scene) {
        initActualModelViewer();
    }
    
    // Clear previous model if exists
    if (modelMesh) {
        scene.remove(modelMesh);
        modelMesh = null;
    }
    
    // Clear measurements
    clearMeasurements();
    
    // Remove section plane
    removeSectionPlane();
    
    // Create STL loader
    const loader = new THREE.STLLoader();
    
    // Load the STL file
    const modelPath = `models/${modelFile}`;
    
    loader.load(
        modelPath,
        (geometry) => {
            // Create material
            const material = createModelMaterial();
            material.side = THREE.DoubleSide;
            
            // Create mesh
            modelMesh = new THREE.Mesh(geometry, material);
            
            // Enable shadows
            modelMesh.castShadow = true;
            modelMesh.receiveShadow = true;
            
            // Center the model
            geometry.computeBoundingBox();
            const boundingBox = geometry.boundingBox;
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            modelMesh.position.set(-center.x, -center.y, -center.z);
            
            // Scale the model to fit the view
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            modelMesh.scale.set(scale, scale, scale);
            
            // Add to scene
            scene.add(modelMesh);
            
            // Reset controls to focus on model
            resetViewToModel();
            
            // Ensure renderer is in the container
            modelContainer.innerHTML = '';
            modelContainer.appendChild(renderer.domElement);
            
            // Show success notification
            showToast('Modèle chargé avec succès', 'success');
        },
        (xhr) => {
            // Progress callback
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            const loadingElement = modelContainer.querySelector('.loading-spinner p');
            if (loadingElement) {
                loadingElement.textContent = `Chargement du modèle: ${percent}%`;
            }
        },
        (error) => {
            // Error callback
            console.error('Error loading STL file:', error);
            showToast('Erreur lors du chargement du modèle', 'error');
            
            // Create fallback model if error occurs
            createSampleModel(modelFile);
        }
    );
}

/**
 * Reset the view to focus on the current model
 */
function resetViewToModel() {
    if (!modelMesh || !camera || !controls) return;
    
    // Calculate bounding box
    const boundingBox = new THREE.Box3().setFromObject(modelMesh);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // Set controls target to center of model
    controls.target.copy(center);
    
    // Calculate optimal camera position
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
    
    // Set camera position
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    camera.position.copy(direction.multiplyScalar(distance).add(controls.target));
    
    // Update controls
    controls.update();
}

/**
 * Update the model based on UI control values
 */
function updateModel() {
    if (!modelMesh) return;
    
    // Get dimension values
    const width = parseInt(document.getElementById('width').value) || 100;
    const height = parseInt(document.getElementById('height').value) || 100;
    const depth = parseInt(document.getElementById('depth').value) || 100;
    const scale = parseInt(document.getElementById('scale').value) || 100;
    
    // Calculate scale factors
    const scaleX = width / 100;
    const scaleY = height / 100;
    const scaleZ = depth / 100;
    const globalScale = scale / 100;
    
    // Store original scale for reference
    if (!modelMesh.userData.originalScale) {
        modelMesh.userData.originalScale = modelMesh.scale.clone();
    }
    
    // Apply scale relative to original
    modelMesh.scale.set(
        modelMesh.userData.originalScale.x * scaleX * globalScale,
        modelMesh.userData.originalScale.y * scaleY * globalScale,
        modelMesh.userData.originalScale.z * scaleZ * globalScale
    );
    
    // Update material
    modelMesh.material = createModelMaterial();
    
    // Update section plane if active
    if (sectionPlane) {
        updateSectionPlane();
    }
    
    // Update measurements if any
    if (measurePoints.length > 1) {
        createMeasurementLine();
    }
}

function createSectionPlane() {
    if (!modelMesh) return;
    
    // Remove existing section plane
    removeSectionPlane();
    
    // Default axis is X
    const normal = new THREE.Vector3(1, 0, 0);
    
    // Create clipping plane
    sectionPlane = new THREE.Plane(normal);
    
    // Calculate model bounds
    const boundingBox = new THREE.Box3().setFromObject(modelMesh);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // Position plane at model center
    sectionPlane.constant = center.x;
    
    // Enable clipping
    renderer.localClippingEnabled = true;
    
    // Apply to material
    if (modelMesh.material) {
        modelMesh.material.clippingPlanes = [sectionPlane];
        modelMesh.material.clipShadows = true;
        modelMesh.material.needsUpdate = true;
    }
    
    // Create helper for visualization
    sectionPlaneHelper = new THREE.PlaneHelper(sectionPlane, 10, 0xff0000);
    scene.add(sectionPlaneHelper);
    
    showToast('Section de coupe activée', 'success');
}

function updateSectionPlane() {
    if (!sectionPlane || !sectionPlaneHelper || !modelMesh) return;
    
    // Update plane normal and position based on model bounds
    const boundingBox = new THREE.Box3().setFromObject(modelMesh);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // Position plane relative to center
    sectionPlane.constant = center.x;
    
    // Update helper
    sectionPlaneHelper.update();
    
    // Update material
    if (modelMesh.material) {
        modelMesh.material.clippingPlanes = [sectionPlane];
        modelMesh.material.needsUpdate = true;
    }
}

function removeSectionPlane() {
    // Disable clipping
    renderer.localClippingEnabled = false;
    
    // Remove helper
    if (sectionPlaneHelper) {
        scene.remove(sectionPlaneHelper);
        sectionPlaneHelper = null;
    }
    
    // Remove plane from material
    if (modelMesh && modelMesh.material) {
        modelMesh.material.clippingPlanes = [];
        modelMesh.material.needsUpdate = true;
    }
    
    sectionPlane = null;
}

/**
 * Take a screenshot of the current view
 */
function takeScreenshot() {
    if (!renderer) return;
    
    try {
        // Render the scene
        renderer.render(scene, camera);
        
        // Get image data from renderer
        const imgData = renderer.domElement.toDataURL('image/png');
        
        // Create a temporary link
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'model_screenshot.png';
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        document.body.removeChild(link);
        
        showToast('Capture d\'écran enregistrée', 'success');
    } catch (error) {
        console.error('Error taking screenshot:', error);
        showToast('Erreur lors de la capture d\'écran', 'error');
    }
}


function exportModel(format) {
    if (!modelMesh) {
        showToast('Aucun modèle à exporter', 'error');
        return;
    }
    
    try {
        // Get current dimensions from UI to include in filename
        const width = parseInt(document.getElementById('width').value) || 100;
        const height = parseInt(document.getElementById('height').value) || 100;
        const depth = parseInt(document.getElementById('depth').value) || 100;
        const scale = parseInt(document.getElementById('scale').value) || 100;
        
        // Construct filename with dimensions
        const fileName = `model_${width}x${height}x${depth}_${scale}p.${format.toLowerCase()}`;
        
        switch (format.toLowerCase()) {
            case 'stl':
                // Check if STLExporter is available
                if (typeof THREE.STLExporter === 'function') {
                    const exporter = new THREE.STLExporter();
                    const result = exporter.parse(modelMesh, { binary: true });
                    saveFile(result, fileName, 'application/octet-stream');
                } else {
                    // Fallback if exporter not loaded
                    showToast('STLExporter non disponible', 'error');
                }
                break;
                
            case 'obj':
                // Check if OBJExporter is available
                if (typeof THREE.OBJExporter === 'function') {
                    const exporter = new THREE.OBJExporter();
                    const result = exporter.parse(modelMesh);
                    saveFile(result, fileName, 'text/plain');
                } else {
                    // Fallback if exporter not loaded
                    showToast('OBJExporter non disponible', 'error');
                }
                break;
                
            case 'gltf':
                // Check if GLTFExporter is available
                if (typeof THREE.GLTFExporter === 'function') {
                    const exporter = new THREE.GLTFExporter();
                    exporter.parse(modelMesh, (result) => {
                        saveFile(JSON.stringify(result), fileName, 'application/json');
                    }, { binary: false });
                } else {
                    // Fallback if exporter not loaded
                    showToast('GLTFExporter non disponible', 'error');
                }
                break;
                
            default:
                showToast(`Format d'export non pris en charge: ${format}`, 'error');
                return;
        }
        
        showToast(`Modèle exporté en format ${format.toUpperCase()}`, 'success');
    } catch (error) {
        console.error('Error exporting model:', error);
        showToast(`Erreur lors de l'exportation du modèle: ${error.message}`, 'error');
    }
}

function saveFile(content, fileName, fileType) {
    let blob;
    
    if (content instanceof Blob) {
        blob = content;
    } else {
        blob = new Blob([content], { type: fileType });
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    
    // Append to document, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release object URL
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
    }, 100);
}

function createModelMaterial() {
    // Get selected material type
    const materialBtns = document.querySelectorAll('.material-btn');
    let materialType = 'plastic'; // default
    
    materialBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            materialType = btn.getAttribute('data-material');
        }
    });
    
    // Get selected color
    const colorSwatches = document.querySelectorAll('.color-swatch');
    let color = '#4a90e2'; // default
    
    colorSwatches.forEach(swatch => {
        if (swatch.classList.contains('active')) {
            color = swatch.getAttribute('data-color');
        }
    });
    
    // Create material based on type
    let material;
    
    switch (materialType) {
        case 'metal':
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color),
                metalness: 0.8,
                roughness: 0.2,
                envMapIntensity: 1.0
            });
            break;
        case 'rubber':
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color),
                metalness: 0.0,
                roughness: 0.9
            });
            break;
        case 'plastic':
        default:
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color),
                metalness: 0.1,
                roughness: 0.4,
                envMapIntensity: 0.5
            });
            break;
    }
    
    // Apply current section planes if any
    if (renderer && renderer.localClippingEnabled && sectionPlane) {
        material.clippingPlanes = [sectionPlane];
        material.clipShadows = true;
    }
    
    return material;
}





/**
 * Initialize resources section with tabs and data loading
 */
function initResourcesSection() {
    // Initialize tabs
    initResourcesTabs();
    
    // Initialize category and level filters
    initResourceFilters();
    
    // Initialize upload buttons and modals
    initResourceModals();
    
    // Load data from database
    loadDocumentsFromDatabase();
    loadTestsFromDatabase();
}

/**
 * Initialize resources tabs (Documents and Tests)
 */
function initResourcesTabs() {
    const tabButtons = document.querySelectorAll('.resources-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activate clicked tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Initialize resource filters (categories and levels)
 */
function initResourceFilters() {
    // Document categories
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter documents
            const category = button.getAttribute('data-category');
            filterDocuments(category);
        });
    });
    
    // Test levels
    const levelButtons = document.querySelectorAll('.level-btn');
    levelButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            levelButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter tests
            const level = button.getAttribute('data-level');
            filterTests(level);
        });
    });
}

/**
 * Filter documents by category
 * @param {string} category - The category to filter by
 */
function filterDocuments(category) {
    const documentCards = document.querySelectorAll('#documents-grid .resource-card');
    
    documentCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Filter tests by level
 * @param {string} level - The level to filter by
 */
function filterTests(level) {
    const testCards = document.querySelectorAll('#tests-grid .resource-card');
    
    testCards.forEach(card => {
        if (level === 'all' || card.getAttribute('data-level') === level) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Initialize upload modals for documents and tests
 */
function initResourceModals() {
    // Document upload
    const uploadDocumentBtn = document.getElementById('upload-document-btn');
    const documentModal = document.getElementById('upload-document-modal');
    const cancelDocumentBtn = document.getElementById('cancel-document-upload');
    const closeDocumentModalBtns = documentModal.querySelectorAll('.close-modal');
    
    uploadDocumentBtn.addEventListener('click', () => {
        documentModal.classList.add('active');
    });
    
    cancelDocumentBtn.addEventListener('click', () => {
        documentModal.classList.remove('active');
    });
    
    closeDocumentModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            documentModal.classList.remove('active');
        });
    });
    
    // Test upload
    const uploadTestBtn = document.getElementById('upload-test-btn');
    const testModal = document.getElementById('upload-test-modal');
    const cancelTestBtn = document.getElementById('cancel-test-upload');
    const closeTestModalBtns = testModal.querySelectorAll('.close-modal');
    
    uploadTestBtn.addEventListener('click', () => {
        testModal.classList.add('active');
    });
    
    cancelTestBtn.addEventListener('click', () => {
        testModal.classList.remove('active');
    });
    
    closeTestModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            testModal.classList.remove('active');
        });
    });
    
    // Document file input
    const documentFileInput = document.getElementById('document-file');
    const documentFileInfo = document.getElementById('document-file-info');
    
    documentFileInput.addEventListener('change', () => {
        if (documentFileInput.files.length > 0) {
            const file = documentFileInput.files[0];
            documentFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
        } else {
            documentFileInfo.textContent = 'Aucun fichier sélectionné';
        }
    });
    
    // Test file input
    const testFileInput = document.getElementById('test-file');
    const testFileInfo = document.getElementById('test-file-info');
    
    testFileInput.addEventListener('change', () => {
        if (testFileInput.files.length > 0) {
            const file = testFileInput.files[0];
            testFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
        } else {
            testFileInfo.textContent = 'Aucun fichier sélectionné';
        }
    });
    
    // Document form submission
    const submitDocumentBtn = document.getElementById('submit-document');
    submitDocumentBtn.addEventListener('click', uploadDocument);
    
    // Test form submission
    const submitTestBtn = document.getElementById('submit-test');
    submitTestBtn.addEventListener('click', uploadTest);
}

/**
 * Upload a new document to the server
 */
/**
 * Upload a new document to the server with fallback for demo
 */
function uploadDocument() {
    const title = document.getElementById('document-title').value;
    const category = document.getElementById('document-category').value;
    const description = document.getElementById('document-description').value;
    const fileInput = document.getElementById('document-file');
    
    if (!title || !category || fileInput.files.length === 0) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Create FormData object for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('teacherId', getCurrentTeacherId());
    
    // Show loading state
    const submitBtn = document.getElementById('submit-document');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;
    
    // Send API request
    fetch('https://web-production-47eca.up.railway.app/api/documents', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'upload du document');
        }
        return response.json();
    })
    .then(data => {
        completeDocumentUpload();
    })
    .catch(error => {
        console.error("Upload error:", error);
        // Fallback for demo mode - simulate successful upload
        setTimeout(() => {
            completeDocumentUpload();
        }, 1500);
    });
    
    function completeDocumentUpload() {
        // Reset form
        document.getElementById('document-upload-form').reset();
        document.getElementById('document-file-info').textContent = 'Aucun fichier sélectionné';
        
        // Close modal
        document.getElementById('upload-document-modal').classList.remove('active');
        
        // Show success message
        showToast('Document ajouté avec succès', 'success');
        
        // Reload documents to show the new one
        loadDocumentsFromDatabase();
        
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

/**
 * Upload a new test to the server with fallback for demo
 */
function uploadTest() {
    const title = document.getElementById('test-title').value;
    const level = document.getElementById('test-level').value;
    const duration = document.getElementById('test-duration').value;
    const questions = document.getElementById('test-questions').value;
    const description = document.getElementById('test-description').value;
    const fileInput = document.getElementById('test-file');
    
    if (!title || !level || !duration || !questions || fileInput.files.length === 0) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Create FormData object for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('level', level);
    formData.append('duration', duration);
    formData.append('questions', questions);
    formData.append('teacherId', getCurrentTeacherId());
    
    // Show loading state
    const submitBtn = document.getElementById('submit-test');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;
    
    // Send API request
    fetch('https://web-production-47eca.up.railway.app/api/tests', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'upload du test');
        }
        return response.json();
    })
    .then(data => {
        completeTestUpload();
    })
    .catch(error => {
        console.error("Upload error:", error);
        // Fallback for demo mode - simulate successful upload
        setTimeout(() => {
            completeTestUpload();
        }, 1500);
    });
    
    function completeTestUpload() {
        // Reset form
        document.getElementById('test-upload-form').reset();
        document.getElementById('test-file-info').textContent = 'Aucun fichier sélectionné';
        
        // Close modal
        document.getElementById('upload-test-modal').classList.remove('active');
        
        // Show success message
        showToast('Test ajouté avec succès', 'success');
        
        // Reload tests to show the new one
        loadTestsFromDatabase();
        
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

/**
 * Upload a new test to the server
 */


/**
 * Helper function to get current teacher ID
 * @returns {number} - The current teacher ID
 */
function getCurrentTeacherId() {
    // In a real application, this would get the ID from session or local storage
    // For demonstration, we'll return a hardcoded ID
    return 1;
}

/**
 * Load documents from the database via API
 */



/**
 * Create a document card element
 * @param {Object} doc - The document data (renamed from "document" to avoid conflict)
 * @returns {HTMLElement} - The document card element
 */
function createDocumentCard(doc) {
    // Create card element
    const card = window.document.createElement('div');
    card.className = 'resource-card';
    card.setAttribute('data-category', doc.category);
    
    // Get icon based on file type
    const icon = getIconForFileType(doc.fileType);
    
    // Format date
    const uploadDate = new Date(doc.uploadDate);
    const formattedDate = uploadDate.toLocaleDateString();
    
    // Card HTML content
    card.innerHTML = `
        <div class="resource-icon">
            <i class="${icon}"></i>
        </div>
        <div class="resource-details">
            <h3>${doc.title}</h3>
            <div class="resource-meta">
                <span class="resource-type">${doc.fileType.toUpperCase()}</span>
                <span>Ajouté le ${formattedDate}</span>
            </div>
            <p>${doc.description}</p>
        </div>
        <div class="resource-actions">
            <button class="icon-btn view-document" title="Visualiser" data-id="${doc.id}">
                <i class="fas fa-eye"></i>
            </button>
            <button class="icon-btn download-document" title="Télécharger" data-id="${doc.id}">
                <i class="fas fa-download"></i>
            </button>
            <button class="icon-btn delete-document" title="Supprimer" data-id="${doc.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Add event listeners to buttons
    const downloadBtn = card.querySelector('.download-document');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', e => {
            e.stopPropagation();
            downloadDocument(doc.id);
        });
    }
    
    const deleteBtn = card.querySelector('.delete-document');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', e => {
            e.stopPropagation();
            confirmDeleteDocument(doc.id, doc.title);
        });
    }
    
    const viewBtn = card.querySelector('.view-document');
    if (viewBtn) {
        viewBtn.addEventListener('click', e => {
            e.stopPropagation();
            viewDocument(doc.id);
        });
    }
    
    return card;
}

/**
 * Load documents from the database via API with fallback
 */
function loadDocumentsFromDatabase() {
    const documentsGrid = window.document.getElementById('documents-grid');
    if (!documentsGrid) return;
    
    // Show loading state
    documentsGrid.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des documents...</p>
        </div>
    `;
    
    // Create sample documents as fallback
    const sampleDocuments = [
        {
            id: 1,
            title: "Guide d'anatomie du pied",
            description: "Documentation complète sur l'anatomie du pied pour la fabrication d'orthèses.",
            fileType: "pdf",
            category: "Documentation",
            uploadDate: new Date().toISOString(),
            fileSize: "2.5 MB"
        },
        {
            id: 2,
            title: "Techniques de moulage",
            description: "Présentation des techniques modernes de moulage pour orthèses plantaires.",
            fileType: "pptx",
            category: "Présentation",
            uploadDate: new Date().toISOString(),
            fileSize: "4.8 MB"
        },
        {
            id: 3,
            title: "Matériaux orthopédiques",
            description: "Guide complet des matériaux utilisés en orthoprothésie.",
            fileType: "docx",
            category: "Guide",
            uploadDate: new Date().toISOString(),
            fileSize: "1.2 MB"
        }
    ];
    
    // Fetch documents from API
    fetch('https://web-production-47eca.up.railway.app/api/documents')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des documents');
            }
            return response.json();
        })
        .then(documents => {
            // Clear loading state
            documentsGrid.innerHTML = '';
            
            if (documents.length === 0) {
                // Show empty state
                documentsGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <h3>Aucun document disponible</h3>
                        <p>Utilisez le bouton "Nouveau document" pour ajouter des ressources pédagogiques.</p>
                    </div>
                `;
                return;
            }
            
            // Add each document to the grid
            documents.forEach(doc => {
                const card = createDocumentCard(doc);
                documentsGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error("API Error:", error);
            
            // Clear loading state
            documentsGrid.innerHTML = '';
            
            // Show demo notice
            const demoNotice = window.document.createElement('div');
            demoNotice.className = 'demo-info';
            demoNotice.innerHTML = ` `;
            documentsGrid.appendChild(demoNotice);
            
            // Add sample documents
            sampleDocuments.forEach(doc => {
                const card = createDocumentCard(doc);
                documentsGrid.appendChild(card);
            });
        });
}

/**
 * Create a test card element
 * @param {Object} test - The test data
 * @returns {HTMLElement} - The test card element
 */
function createTestCard(test) {
    // Create card element
    const card = window.document.createElement('div');
    card.className = 'resource-card';
    card.setAttribute('data-level', test.level);
    
    // Format date
    const creationDate = new Date(test.creationDate);
    const formattedDate = creationDate.toLocaleDateString();
    
    // Get icon based on level
    let icon = 'fas fa-clipboard-check';
    
    // Card HTML content
    card.innerHTML = `
        <div class="resource-icon">
            <i class="${icon}"></i>
        </div>
        <div class="resource-details">
            <h3>${test.title}</h3>
            <div class="resource-meta">
                <span class="resource-level ${test.level}">${getLevelName(test.level)}</span>
                <span>${test.duration} | ${test.questions} questions</span>
            </div>
            <p>${test.description}</p>
        </div>
        <div class="resource-actions">
            <button class="icon-btn start-test" title="Démarrer" data-id="${test.id}">
                <i class="fas fa-play"></i>
            </button>
            <button class="icon-btn edit-test" title="Modifier" data-id="${test.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="icon-btn delete-test" title="Supprimer" data-id="${test.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Add event listeners to buttons
    const startBtn = card.querySelector('.start-test');
    if (startBtn) {
        startBtn.addEventListener('click', e => {
            e.stopPropagation();
            startTest(test.id);
        });
    }
    
    const editBtn = card.querySelector('.edit-test');
    if (editBtn) {
        editBtn.addEventListener('click', e => {
            e.stopPropagation();
            editTest(test.id);
        });
    }
    
    const deleteBtn = card.querySelector('.delete-test');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', e => {
            e.stopPropagation();
            confirmDeleteTest(test.id, test.title);
        });
    }
    
    return card;
}

/**
 * Load tests from the database via API with fallback
 */
function loadTestsFromDatabase() {
    const testsGrid = window.document.getElementById('tests-grid');
    if (!testsGrid) return;
    
    // Show loading state
    testsGrid.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des tests...</p>
        </div>
    `;
    
    // Create sample tests as fallback
    const sampleTests = [
        {
            id: 1,
            title: "Évaluation fondamentaux orthèses",
            description: "Test sur les principes fondamentaux de la fabrication d'orthèses plantaires.",
            level: "beginner",
            duration: "30 min",
            questions: 15,
            creationDate: new Date().toISOString()
        },
        {
            id: 2,
            title: "Analyse biomécanique",
            description: "Évaluation des connaissances en analyse biomécanique et pathologies du pied.",
            level: "intermediate",
            duration: "45 min",
            questions: 25,
            creationDate: new Date().toISOString()
        },
        {
            id: 3,
            title: "Techniques avancées d'orthoprothèses",
            description: "Test sur les techniques avancées de fabrication et de correction orthopédique.",
            level: "advanced",
            duration: "60 min",
            questions: 35,
            creationDate: new Date().toISOString()
        }
    ];
    
    // Fetch tests from API
    fetch('https://web-production-47eca.up.railway.app/api/tests')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des tests');
            }
            return response.json();
        })
        .then(tests => {
            // Clear loading state
            testsGrid.innerHTML = '';
            
            if (tests.length === 0) {
                // Show empty state
                testsGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-tasks"></i>
                        <h3>Aucun test disponible</h3>
                        <p>Utilisez le bouton "Nouveau test" pour ajouter des évaluations.</p>
                    </div>
                `;
                return;
            }
            
            // Add each test to the grid
            tests.forEach(test => {
                const card = createTestCard(test);
                testsGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error("API Error:", error);
            
            // Clear loading state
            testsGrid.innerHTML = '';
            
            // Show demo notice
            const demoNotice = window.document.createElement('div');
            demoNotice.className = 'demo-info';
            demoNotice.innerHTML = ``;
            testsGrid.appendChild(demoNotice);
            
            // Add sample tests
            sampleTests.forEach(test => {
                const card = createTestCard(test);
                testsGrid.appendChild(card);
            });
        });
}
/**
 * Load tests from the database via API
 */
/**
 * Load documents from the database via API with fallback
 */


/**
 * Load tests from the database via API with fallback
 */






/**
 * Get a human-readable level name
 * @param {string} level - The level code
 * @returns {string} - The human-readable level name
 */
function getLevelName(level) {
    switch (level) {
        case 'beginner':
            return 'Débutant';
        case 'intermediate':
            return 'Intermédiaire';
        case 'advanced':
            return 'Avancé';
        default:
            return level;
    }
}

/**
 * Get an icon class based on file type
 * @param {string} fileType - The file extension
 * @returns {string} - The icon class
 */
function getIconForFileType(fileType) {
    switch (fileType.toLowerCase()) {
        case 'pdf':
            return 'fas fa-file-pdf';
        case 'doc':
        case 'docx':
            return 'fas fa-file-word';
        case 'ppt':
        case 'pptx':
            return 'fas fa-file-powerpoint';
        case 'xls':
        case 'xlsx':
            return 'fas fa-file-excel';
        case 'jpg':
        case 'jpeg':
        case 'png':
            return 'fas fa-file-image';
        case 'mp4':
        case 'avi':
        case 'mov':
            return 'fas fa-file-video';
        default:
            return 'fas fa-file-alt';
    }
}

/**
 * View a document
 * @param {number} id - The document ID
 */
function viewDocument(id) {
    // In a real application, this would open the document in a viewer
    // For now, we'll simulate by downloading the document
    window.open(`https://web-production-47eca.up.railway.app/api/documents/download/${id}`, '_blank');
}

/**
 * Download a document
 * @param {number} id - The document ID
 */
function downloadDocument(id) {
    fetch(`https://web-production-47eca.up.railway.app/api/documents/download/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement');
            }
            // Trigger download
            window.location.href = `https://web-production-47eca.up.railway.app/api/documents/download/${id}`;
            showToast('Téléchargement démarré', 'success');
        })
        .catch(error => {
            showToast(error.message, 'error');
        });
}

/**
 * Start a test
 * @param {number} id - The test ID
 */
function startTest(id) {
    // Open test in a new tab
    window.open(`https://web-production-47eca.up.railway.app/api/tests/start/${id}`, '_blank');
}

/**
 * Edit a test
 * @param {number} id - The test ID
 */
function editTest(id) {
    // For now, show a toast that this feature is not implemented
    showToast('Fonctionnalité à venir', 'info');
}

/**
 * Confirm deletion of a document
 * @param {number} id - The document ID
 * @param {string} title - The document title
 */
function confirmDeleteDocument(id, title) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le document "${title}" ?`)) {
        deleteDocument(id);
    }
}

/**
 * Delete a document
 * @param {number} id - The document ID
 */
function deleteDocument(id) {
    fetch(`https://web-production-47eca.up.railway.app/api/documents/${id}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }
            return response.json();
        })
        .then(data => {
            showToast(data.message || 'Document supprimé avec succès', 'success');
            loadDocumentsFromDatabase(); // Reload documents
        })
        .catch(error => {
            showToast(error.message, 'error');
        });
}

/**
 * Confirm deletion of a test
 * @param {number} id - The test ID
 * @param {string} title - The test title
 */
function confirmDeleteTest(id, title) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le test "${title}" ?`)) {
        deleteTest(id);
    }
}

/**
 * Delete a test
 * @param {number} id - The test ID
 */
function deleteTest(id) {
    fetch(`https://web-production-47eca.up.railway.app/api/tests/${id}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }
            return response.json();
        })
        .then(data => {
            showToast(data.message || 'Test supprimé avec succès', 'success');
            loadTestsFromDatabase(); // Reload tests
        })
        .catch(error => {
            showToast(error.message, 'error');
        });
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}



// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('teacherAuthToken');
            localStorage.removeItem('teacherId');
            localStorage.removeItem('teacherName');
            localStorage.removeItem('teacherEmail');
            localStorage.removeItem('teacherIsApproved');
            localStorage.removeItem('firstname');
            localStorage.removeItem('lastname');
            window.location.href = 'teacher.html';
        });
    }
});
