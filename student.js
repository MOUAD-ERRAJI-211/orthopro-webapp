document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les fonctionnalités de la page
    initResourcesAndTests();
    initPopup();
});

/**
 * Initialise le chargement des ressources et tests
 */
function initResourcesAndTests() {
    // Charger les ressources depuis l'API
    try {
        loadResources();
    } catch (error) {
        console.error("Erreur lors du chargement des ressources:", error);
        showErrorMessage('resource-grid', "Impossible de charger les ressources. Vérifiez que le serveur est en cours d'exécution.");
    }
    
    // Charger les tests depuis l'API
    try {
        loadTests();
    } catch (error) {
        console.error("Erreur lors du chargement des tests:", error);
        showErrorMessage('test-grid', "Impossible de charger les tests. Vérifiez que le serveur est en cours d'exécution.");
    }
    
    // Initialiser les filtres
    initResourceFilter();
    initTestFilter();
}

/**
 * Affiche un message d'erreur dans un conteneur
 * @param {string} containerId - ID du conteneur
 * @param {string} message - Message d'erreur
 */
function showErrorMessage(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Charge les ressources depuis l'API avec gestion des erreurs améliorée
 */
function loadResources() {
    const resourceGrid = document.getElementById('resource-grid');
    if (!resourceGrid) {
        console.error("Élément 'resource-grid' non trouvé");
        return;
    }
    
    resourceGrid.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i><p>Chargement des ressources...</p></div>';
    
    // URL du serveur
    const baseUrl = getApiBaseUrl();
    
    // Appel à l'API pour récupérer les documents
    fetch(`${baseUrl}/api/documents/list-files`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(resources => {
            // Effacer le message de chargement
            resourceGrid.innerHTML = '';
            
            if (!resources || resources.length === 0) {
                resourceGrid.innerHTML = '<div class="empty-message">Aucune ressource disponible.</div>';
                return;
            }
            
            // Ajouter les ressources au grid
            resources.forEach(resource => {
                const card = createResourceCard(resource);
                resourceGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des ressources:', error);
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                resourceGrid.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Impossible de se connecter au serveur. Vérifiez qu'il est en cours d'exécution sur ${baseUrl}</p>
                    </div>
                `;
            } else {
                resourceGrid.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erreur lors du chargement des ressources: ${error.message}</p>
                    </div>
                `;
            }
        });
}

/**
 * Charge les tests depuis l'API avec gestion des erreurs améliorée
 */
function loadTests() {
    const testGrid = document.getElementById('test-grid');
    if (!testGrid) {
        console.error("Élément 'test-grid' non trouvé");
        return;
    }
    
    testGrid.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i><p>Chargement des tests...</p></div>';
    
    // URL du serveur
    const baseUrl = getApiBaseUrl();
    
    // Appel à l'API pour récupérer les tests
    fetch(`${baseUrl}/api/tests/list-files`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(tests => {
            // Effacer le message de chargement
            testGrid.innerHTML = '';
            
            if (!tests || tests.length === 0) {
                testGrid.innerHTML = '<div class="empty-message">Aucun test disponible.</div>';
                return;
            }
            
            // Ajouter les tests au grid
            tests.forEach(test => {
                const card = createTestCard(test);
                testGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des tests:', error);
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                testGrid.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Impossible de se connecter au serveur. Vérifiez qu'il est en cours d'exécution sur ${baseUrl}</p>
                    </div>
                `;
            } else {
                testGrid.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erreur lors du chargement des tests: ${error.message}</p>
                    </div>
                `;
            }
        });
}

/**
 * Retourne l'URL de base de l'API
 * @returns {string} URL de base
 */
function getApiBaseUrl() {
    // En développement, utilisez le port 8081 (port Spring Boot)
    return 'http://localhost:8081';
}

/**
 * Crée une carte pour une ressource éducative
 * @param {Object} resource - Informations sur la ressource
 * @returns {HTMLElement} - Élément DOM de la carte
 */
function createResourceCard(resource) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.dataset.type = resource.type;
    
    // Déterminer l'icône en fonction du type de fichier
    let typeIcon = '';
    let fileType = resource.type.toLowerCase();
    
    if (fileType === 'pdf') {
        typeIcon = '<i class="far fa-file-pdf"></i>';
    } else if (fileType === 'doc' || fileType === 'docx') {
        typeIcon = '<i class="far fa-file-word"></i>';
        fileType = 'doc'; // Normaliser pour l'affichage
    } else if (fileType === 'ppt' || fileType === 'pptx') {
        typeIcon = '<i class="far fa-file-powerpoint"></i>';
        fileType = 'ppt'; // Normaliser pour l'affichage
    } else {
        typeIcon = '<i class="far fa-file"></i>';
    }
    
    // Extraire le type pour l'affichage
    let displayType = fileType.toUpperCase();
    
    // Formater la date si disponible
    let dateDisplay = '';
    if (resource.lastModified) {
        const date = new Date(resource.lastModified);
        dateDisplay = date.toLocaleDateString();
    }
    
    card.innerHTML = `
        <div class="resource-card-image">
            <img src="/api/placeholder/300/200?text=${displayType}" alt="${resource.title}">
            <div class="resource-card-badge ${fileType}">${displayType}</div>
        </div>
        <div class="resource-card-content">
            <h3>${resource.title}</h3>
            <p>${resource.description || `Document ${displayType}`}</p>
            <div class="resource-meta">
                <span>${typeIcon} ${resource.size}</span>
                <span><i class="far fa-calendar-alt"></i> ${dateDisplay}</span>
            </div>
        </div>
    `;
    
    // Ajouter un événement de clic pour ouvrir le popup
    card.addEventListener('click', () => {
        openDocumentPopup({
            title: resource.title,
            type: fileType,
            description: resource.description || `Document ${displayType}`,
            fileSize: resource.size,
            path: resource.relativePath,
            date: dateDisplay,
            isResource: true
        });
    });
    
    return card;
}

/**
 * Crée une carte pour un test d'évaluation
 * @param {Object} test - Informations sur le test
 * @returns {HTMLElement} - Élément DOM de la carte
 */
function createTestCard(test) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.dataset.level = test.level || 'beginner';
    
    let levelText = '';
    switch (test.level) {
        case 'beginner':
            levelText = 'Débutant';
            break;
        case 'intermediate':
            levelText = 'Intermédiaire';
            break;
        case 'advanced':
            levelText = 'Avancé';
            break;
        default:
            levelText = 'Débutant';
    }
    
    // Formater la date si disponible
    let dateDisplay = '';
    if (test.lastModified) {
        const date = new Date(test.lastModified);
        dateDisplay = date.toLocaleDateString();
    }
    
    card.innerHTML = `
        <div class="resource-card-image">
            <img src="/api/placeholder/300/200?text=Test" alt="${test.title}">
            <div class="resource-card-badge ${test.level}">${levelText}</div>
        </div>
        <div class="resource-card-content">
            <h3>${test.title}</h3>
            <p>${test.description || `Test d'évaluation - Niveau ${levelText}`}</p>
            <div class="resource-meta">
                <span><i class="far fa-clock"></i> ${test.duration || '30 min'}</span>
                <span><i class="far fa-question-circle"></i> ${test.questions || '15'} questions</span>
            </div>
        </div>
    `;
    
    // Ajouter un événement de clic pour ouvrir le popup
    card.addEventListener('click', () => {
        openDocumentPopup({
            title: test.title,
            level: test.level,
            levelText: levelText,
            description: test.description || `Test d'évaluation - Niveau ${levelText}`,
            duration: test.duration || '30 min',
            questions: test.questions || '15',
            path: test.relativePath,
            date: dateDisplay,
            isResource: false
        });
    });
    
    return card;
}

/**
 * Initialise la fonctionnalité de filtre pour les ressources
 */
function initResourceFilter() {
    const categoryFilter = document.getElementById('resource-category-filter');
    const searchInput = document.getElementById('resource-search');
    const searchBtn = document.getElementById('resource-search-btn');
    
    if (!categoryFilter || !searchInput || !searchBtn) {
        console.log("Éléments de filtrage des ressources non trouvés");
        return;
    }
    
    // Fonction de filtrage
    function filterResources() {
        const typeValue = categoryFilter.value;
        const searchValue = searchInput.value.toLowerCase().trim();
        const resourceCards = document.querySelectorAll('#resource-grid .resource-card');
        
        resourceCards.forEach(card => {
            const cardType = card.dataset.type;
            const typeMatch = typeValue === 'all' || 
                (typeValue === 'pdf' && cardType === 'pdf') ||
                (typeValue === 'doc' && (cardType === 'doc' || cardType === 'docx')) ||
                (typeValue === 'ppt' && (cardType === 'ppt' || cardType === 'pptx'));
            
            const cardTitle = card.querySelector('h3').textContent.toLowerCase();
            const cardDescription = card.querySelector('p').textContent.toLowerCase();
            const searchMatch = searchValue === '' || 
                cardTitle.includes(searchValue) || 
                cardDescription.includes(searchValue);
            
            if (typeMatch && searchMatch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Ajouter les écouteurs d'événements
    categoryFilter.addEventListener('change', filterResources);
    searchBtn.addEventListener('click', filterResources);
    
    // Activer la recherche avec la touche Entrée
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterResources();
        }
    });
}

/**
 * Initialise la fonctionnalité de filtre pour les tests
 */
function initTestFilter() {
    const categoryFilter = document.getElementById('test-category-filter');
    const searchInput = document.getElementById('test-search');
    const searchBtn = document.getElementById('test-search-btn');
    
    if (!categoryFilter || !searchInput || !searchBtn) {
        console.log("Éléments de filtrage des tests non trouvés");
        return;
    }
    
    // Fonction de filtrage
    function filterTests() {
        const levelValue = categoryFilter.value;
        const searchValue = searchInput.value.toLowerCase().trim();
        const testCards = document.querySelectorAll('#test-grid .resource-card');
        
        testCards.forEach(card => {
            const levelMatch = levelValue === 'all' || card.dataset.level === levelValue;
            
            const cardTitle = card.querySelector('h3').textContent.toLowerCase();
            const cardDescription = card.querySelector('p').textContent.toLowerCase();
            const searchMatch = searchValue === '' || 
                cardTitle.includes(searchValue) || 
                cardDescription.includes(searchValue);
            
            if (levelMatch && searchMatch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Ajouter les écouteurs d'événements
    categoryFilter.addEventListener('change', filterTests);
    searchBtn.addEventListener('click', filterTests);
    
    // Activer la recherche avec la touche Entrée
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterTests();
        }
    });
}

/**
 * Initialise la fonctionnalité de popup pour les documents et tests
 */
function initPopup() {
    const popup = document.getElementById('document-popup');
    const closeBtn = document.getElementById('close-popup');
    
    if (!popup || !closeBtn) {
        console.log("Éléments de popup non trouvés");
        return;
    }
    
    // Fermer le popup au clic sur le bouton de fermeture
    closeBtn.addEventListener('click', () => {
        popup.classList.remove('show');
    });
    
    // Fermer le popup au clic en dehors du contenu
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('show');
        }
    });
    
    // Fermer le popup avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popup.classList.contains('show')) {
            popup.classList.remove('show');
        }
    });
}

/**
 * Ouvre le popup pour afficher un document ou un test
 * @param {Object} item - Informations sur l'élément à afficher
 */
function openDocumentPopup(item) {
    const popup = document.getElementById('document-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupBody = document.getElementById('popup-body');
    const downloadLink = document.getElementById('download-link');
    
    if (!popup || !popupTitle || !popupBody || !downloadLink) {
        console.error("Éléments de popup non trouvés");
        return;
    }
    
    // Définir le titre
    popupTitle.textContent = item.title;
    
    // URL du serveur
    const baseUrl = getApiBaseUrl();
    
    // Préparer le contenu du popup
    let popupContent = '';
    
    if (item.isResource) {
        // Contenu pour les ressources
        let previewContent = '';
        
        switch (item.type) {
            case 'pdf':
                previewContent = `
                    <iframe src="${baseUrl}${item.path}" title="Aperçu du PDF"></iframe>
                    <p class="preview-note">Aperçu du document PDF.</p>
                `;
                break;
            case 'doc':
            case 'docx':
            case 'ppt':
            case 'pptx':
                previewContent = `
                    <div class="preview-placeholder">
                        <i class="${item.type.includes('doc') ? 'far fa-file-word fa-4x' : 'far fa-file-powerpoint fa-4x'}"></i>
                        <p>Aperçu non disponible pour ce type de fichier.</p>
                        <p>Cliquez sur Télécharger pour ouvrir le fichier.</p>
                    </div>
                `;
                break;
            default:
                previewContent = `
                    <div class="preview-placeholder">
                        <i class="far fa-file fa-4x"></i>
                        <p>Aperçu non disponible.</p>
                    </div>
                `;
        }
        
        popupContent = `
            <div class="document-details">
                <p><strong>Description:</strong> ${item.description}</p>
                <p><strong>Type:</strong> ${item.type.toUpperCase()}</p>
                <p><strong>Taille:</strong> ${item.fileSize}</p>
                ${item.date ? `<p><strong>Date:</strong> ${item.date}</p>` : ''}
            </div>
            <div class="document-preview">
                ${previewContent}
            </div>
        `;
        
        // Configurer le lien de téléchargement
        downloadLink.href = `${baseUrl}${item.path}`;
        downloadLink.setAttribute('download', '');
        downloadLink.innerHTML = `<i class="fas fa-download"></i> Télécharger ${item.type.toUpperCase()}`;
    } else {
        // Contenu pour les tests
        popupContent = `
            <div class="test-details">
                <p><strong>Description:</strong> ${item.description}</p>
                <p><strong>Niveau:</strong> ${item.levelText}</p>
                <p><strong>Durée:</strong> ${item.duration}</p>
                <p><strong>Questions:</strong> ${item.questions}</p>
                ${item.date ? `<p><strong>Date:</strong> ${item.date}</p>` : ''}
            </div>
            <div class="test-preview">
                <div class="preview-placeholder">
                    <i class="fas fa-clipboard-list fa-4x"></i>
                    <p>Cliquez sur Commencer pour lancer le test complet.</p>
                </div>
            </div>
        `;
        
        // Configurer le lien pour démarrer le test
        downloadLink.href = `${baseUrl}${item.path}`;
        downloadLink.removeAttribute('download');
        downloadLink.innerHTML = `<i class="fas fa-play"></i> Commencer le test`;
    }
    
    // Mettre à jour le contenu du popup
    popupBody.innerHTML = popupContent;
    
    // Afficher le popup
    popup.classList.add('show');
}
