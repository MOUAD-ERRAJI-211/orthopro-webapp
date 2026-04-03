document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard components
    initDashboard();
    initUserInfo();
    initTabs(); // Updated to make passions tab active by default
    setupSearchAndFilters();
    setupPagination();
    setupModalHandlers();
    loadTeachersData();
    
    // Initialize appointments management
    setTimeout(() => {
        initAppointmentsTab();
    }, 500);
});

// Global variables for teachers data and pagination
let allTeachers = [];
let filteredTeachers = [];
let currentPage = 1;
let pageSize = 6;
let currentSort = 'date-desc';
let currentFilter = 'all';
let searchTerm = '';

// Modal callback function - will be set when modal is opened
let modalConfirmCallback = null;

// Initialize dashboard with current time
function initDashboard() {
    // Update last update time
    const now = new Date();
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    document.getElementById('last-update-time').textContent = now.toLocaleString('fr-FR', options);
    
    // Setup refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadTeachersData();
        showNotification('Données actualisées', 'info');
    });
    
    // Setup export CSV button
    document.getElementById('export-csv').addEventListener('click', exportTeachersToCSV);
}

// Load logged in admin info
function initUserInfo() {
    const adminName = localStorage.getItem('adminName') || 'Admin';
    const adminEmail = localStorage.getItem('adminEmail') || '';
    
    // Set admin name in header
    document.getElementById('admin-name').textContent = adminName.split(' ')[0];
    
    // Generate initials for avatar
    let initials = 'AD';
    if (adminName && adminName.includes(' ')) {
        const names = adminName.split(' ');
        initials = names[0].charAt(0) + names[1].charAt(0);
    } else if (adminName) {
        initials = adminName.charAt(0) + (adminName.length > 1 ? adminName.charAt(1) : '');
    }
    
    document.getElementById('admin-avatar').textContent = initials.toUpperCase();
    
    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        
        // Clear auth data
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminId');
        
        // Redirect to login page
        window.location.href = 'admin.html';
    });
}

// Initialize tab navigation
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Make the passions tab active by default
    document.querySelector('.tab-btn[data-tab="passions"]').classList.add('active');
    document.querySelector('.tab-btn[data-tab="enseignants"]').classList.remove('active');
    
    document.getElementById('passions-content').classList.add('active');
    document.getElementById('enseignants-content').classList.remove('active');
    
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

// Setup search and filter functionality
function setupSearchAndFilters() {
    const searchInput = document.getElementById('teacher-search');
    const statusFilter = document.getElementById('status-filter');
    const sortBy = document.getElementById('sort-by');
    
    // Search input event
    searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value.toLowerCase();
        filterAndDisplayTeachers();
    });
    
    // Status filter change event
    statusFilter.addEventListener('change', () => {
        currentFilter = statusFilter.value;
        filterAndDisplayTeachers();
    });
    
    // Sort change event
    sortBy.addEventListener('change', () => {
        currentSort = sortBy.value;
        filterAndDisplayTeachers();
    });
}

// Setup pagination controls
function setupPagination() {
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTeachers();
            updatePaginationControls();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredTeachers.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            displayTeachers();
            updatePaginationControls();
        }
    });
}

// Setup modal handlers
function setupModalHandlers() {
    const modal = document.getElementById('confirmation-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    
    // Close modal on X button click
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // Close modal on cancel button click
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // Confirm action
    confirmBtn.addEventListener('click', () => {
        if (modalConfirmCallback) {
            const comments = document.getElementById('rejection-comments').value;
            modalConfirmCallback(comments);
        }
        modal.classList.remove('show');
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Show confirmation modal
function showConfirmationModal(message, callback, showComments = false) {
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const commentsGroup = document.getElementById('comments-group');
    const commentsInput = document.getElementById('rejection-comments');
    
    modalMessage.textContent = message;
    modalConfirmCallback = callback;
    
    // Show/hide comments field
    commentsGroup.style.display = showComments ? 'block' : 'none';
    commentsInput.value = '';
    
    modal.classList.add('show');
}

// Load teachers data from API
function loadTeachersData() {
    const teachersGrid = document.getElementById('teachers-grid');
    teachersGrid.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Chargement des données...</p>
        </div>
    `;
    
    // Get auth token
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'admin.html';
        return;
    }
    
    // API endpoint
    const apiUrl = `${getAPIBaseUrl()}/api/teachers`;
    
    // Fetch teachers data
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }
        return response.json();
    })
    .then(data => {
        allTeachers = data;
        updateStatistics();
        filterAndDisplayTeachers();
    })
    .catch(error => {
        console.error('Erreur:', error);
        teachersGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur lors du chargement des données. Veuillez réessayer.</p>
            </div>
        `;
        showNotification('Erreur de chargement des données', 'error');
    });
}

// Update statistics cards
function updateStatistics() {
    const totalTeachers = allTeachers.length;
    const approvedTeachers = allTeachers.filter(teacher => teacher.approved).length;
    const pendingTeachers = totalTeachers - approvedTeachers;
    
    document.getElementById('total-teachers').textContent = totalTeachers;
    document.getElementById('approved-teachers').textContent = approvedTeachers;
    document.getElementById('pending-teachers').textContent = pendingTeachers;
}

// Filter and sort teachers based on current criteria
function filterAndDisplayTeachers() {
    // Apply filters
    filteredTeachers = allTeachers.filter(teacher => {
        // Status filter
        if (currentFilter === 'approved' && !teacher.approved) return false;
        if (currentFilter === 'pending' && teacher.approved) return false;
        
        // Search term
        if (searchTerm) {
            const fullName = `${teacher.firstname} ${teacher.lastname}`.toLowerCase();
            const email = teacher.email.toLowerCase();
            const institution = teacher.institution?.toLowerCase() || '';
            
            return fullName.includes(searchTerm) || 
                   email.includes(searchTerm) || 
                   institution.includes(searchTerm);
        }
        
        return true;
    });
    
    // Apply sorting
    filteredTeachers.sort((a, b) => {
        switch (currentSort) {
            case 'date-desc':
                return new Date(b.dateInscription) - new Date(a.dateInscription);
            case 'date-asc':
                return new Date(a.dateInscription) - new Date(b.dateInscription);
            case 'name-asc':
                return `${a.lastname} ${a.firstname}`.localeCompare(`${b.lastname} ${b.firstname}`);
            case 'name-desc':
                return `${b.lastname} ${b.firstname}`.localeCompare(`${a.lastname} ${a.firstname}`);
            default:
                return 0;
        }
    });
    
    // Reset to first page and display
    currentPage = 1;
    displayTeachers();
    updatePaginationControls();
}

// Display teachers for current page
function displayTeachers() {
    const teachersGrid = document.getElementById('teachers-grid');
    teachersGrid.innerHTML = '';
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredTeachers.length);
    const currentPageTeachers = filteredTeachers.slice(startIndex, endIndex);
    
    if (currentPageTeachers.length === 0) {
        teachersGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Aucun enseignant ne correspond à votre recherche</p>
            </div>
        `;
        return;
    }
    
    currentPageTeachers.forEach(teacher => {
        const cardElement = createTeacherCard(teacher);
        teachersGrid.appendChild(cardElement);
    });
}

// Update pagination controls
function updatePaginationControls() {
    const totalPages = Math.ceil(filteredTeachers.length / pageSize);
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Create teacher card element
function createTeacherCard(teacher) {
    // Clone template
    const template = document.getElementById('teacher-card-template');
    const cardElement = template.content.cloneNode(true).querySelector('.teacher-card');
    
    // Set card data
    cardElement.setAttribute('data-teacher-id', teacher.id);
    
    // Status class
    if (teacher.approved) {
        cardElement.classList.add('approved');
    } else {
        cardElement.classList.add('pending');
    }
    
    // Set avatar
    const avatar = cardElement.querySelector('.teacher-avatar');
    avatar.textContent = getInitials(teacher.firstname, teacher.lastname);
    
    // Set status badge
    const statusBadge = cardElement.querySelector('.status-badge');
    if (teacher.approved) {
        statusBadge.textContent = 'Approuvé';
        statusBadge.classList.remove('pending');
        statusBadge.classList.add('approved');
    } else {
        statusBadge.textContent = 'En attente';
    }
    
    // Set teacher info
    cardElement.querySelector('.teacher-name').textContent = `${teacher.firstname} ${teacher.lastname}`;
    cardElement.querySelector('.teacher-institution').textContent = teacher.institution || 'Non spécifié';
    cardElement.querySelector('.teacher-email').textContent = teacher.email;
    
    // Format registration date
    const regDate = new Date(teacher.dateInscription);
    const formattedDate = regDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    cardElement.querySelector('.registration-date').textContent = `Inscrit le ${formattedDate}`;
    
    // Set toggle state
    const approvalToggle = cardElement.querySelector('.approval-checkbox');
    approvalToggle.checked = teacher.approved;
    
    // Set details info
    cardElement.querySelector('.teacher-id').textContent = teacher.id;
    
    // Format last login date if available
    const lastLoginElement = cardElement.querySelector('.last-login');
    if (teacher.lastLogin) {
        const loginDate = new Date(teacher.lastLogin);
        lastLoginElement.textContent = loginDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        lastLoginElement.textContent = 'Jamais connecté';
    }
    
    // Setup toggle functionality
    approvalToggle.addEventListener('change', (e) => {
        const isApproved = e.target.checked;
        
        if (isApproved) {
            approveTeacher(teacher.id);
        } else {
            // Show confirmation before removing approval
            showConfirmationModal(
                `Êtes-vous sûr de vouloir retirer l'approbation de ${teacher.firstname} ${teacher.lastname} ?`,
                () => {
                    disapproveTeacher(teacher.id);
                }
            );
            // Revert toggle state until confirmed
            e.target.checked = true;
        }
    });
    
    // Setup details toggle
    const detailsBtn = cardElement.querySelector('.btn-details');
    const detailsSection = cardElement.querySelector('.card-details');
    
    detailsBtn.addEventListener('click', () => {
        const isExpanded = detailsBtn.classList.contains('expanded');
        
        if (isExpanded) {
            detailsBtn.classList.remove('expanded');
            detailsSection.classList.remove('expanded');
            detailsBtn.querySelector('span').textContent = 'Détails';
        } else {
            detailsBtn.classList.add('expanded');
            detailsSection.classList.add('expanded');
            detailsBtn.querySelector('span').textContent = 'Masquer';
        }
    });
    
    // Reject button functionality
    const rejectBtn = cardElement.querySelector('.btn-reject');
    rejectBtn.addEventListener('click', () => {
        showConfirmationModal(
            `Voulez-vous vraiment rejeter le compte de ${teacher.firstname} ${teacher.lastname} ?`,
            (comments) => {
                rejectTeacher(teacher.id, comments);
            },
            true
        );
    });
    
    // Edit button functionality
    const editBtn = cardElement.querySelector('.btn-edit');
    editBtn.addEventListener('click', () => {
        // For now, just show a notification that this feature is coming soon
        showNotification('La fonction d\'édition sera disponible prochainement', 'info');
    });
    
    return cardElement;
}

// Get initials from name
function getInitials(firstname, lastname) {
    let initials = '';
    if (firstname) initials += firstname.charAt(0);
    if (lastname) initials += lastname.charAt(0);
    return initials.toUpperCase();
}

// Approve teacher
function approveTeacher(teacherId) {
    const token = getAuthToken();
    // Utilisons la même méthode que pour disapproveTeacher qui fonctionne déjà
    const apiUrl = `${getAPIBaseUrl()}/api/teachers/${teacherId}`;
    
    // Show loading state
    showNotification('Approbation en cours...', 'info');
    
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            isApproved: true
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'approbation');
        }
        return response.json();
    })
    .then(data => {
        // Update local data
        const teacherIndex = allTeachers.findIndex(t => t.id === teacherId);
        if (teacherIndex !== -1) {
            allTeachers[teacherIndex].approved = true;
            updateStatistics();
            filterAndDisplayTeachers();
        }
        
        showNotification('Enseignant approuvé avec succès', 'success');
    })
    .catch(error => {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'approbation', 'error');
        
        // Revert UI change since operation failed
        const teacherCard = document.querySelector(`.teacher-card[data-teacher-id="${teacherId}"]`);
        if (teacherCard) {
            const toggle = teacherCard.querySelector('.approval-checkbox');
            toggle.checked = false;
        }
    });
}

// Disapprove teacher
function disapproveTeacher(teacherId) {
    const token = getAuthToken();
    const apiUrl = `${getAPIBaseUrl()}/api/teachers/${teacherId}`;
    const adminId = localStorage.getItem('adminId');
    
    // Show loading state
    showNotification('Mise à jour du statut...', 'info');
    
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            isApproved: false
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour');
        }
        return response.json();
    })
    .then(data => {
        // Update local data
        const teacherIndex = allTeachers.findIndex(t => t.id === teacherId);
        if (teacherIndex !== -1) {
            allTeachers[teacherIndex].approved = false;
            updateStatistics();
            filterAndDisplayTeachers();
        }
        
        showNotification('Statut mis à jour avec succès', 'success');
    })
    .catch(error => {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour du statut', 'error');
        
        // Revert UI change since operation failed
        const teacherCard = document.querySelector(`.teacher-card[data-teacher-id="${teacherId}"]`);
        if (teacherCard) {
            const toggle = teacherCard.querySelector('.approval-checkbox');
            toggle.checked = true;
        }
    });
}

// Reject teacher
function rejectTeacher(teacherId, comments) {
    const token = getAuthToken();
    const apiUrl = `${getAPIBaseUrl()}/api/admins/reject-teacher/${teacherId}`;
    const adminId = localStorage.getItem('adminId');
    
    // Show loading state
    showNotification('Rejet en cours...', 'info');
    
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            adminId: adminId,
            comments: comments || 'Rejeté via le tableau de bord administrateur'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors du rejet');
        }
        return response.json();
    })
    .then(data => {
        // Update local data
        const teacherIndex = allTeachers.findIndex(t => t.id === teacherId);
        if (teacherIndex !== -1) {
            allTeachers[teacherIndex].approved = false;
            updateStatistics();
            filterAndDisplayTeachers();
        }
        
        showNotification('Enseignant rejeté avec succès', 'success');
    })
    .catch(error => {
        console.error('Erreur:', error);
        showNotification('Erreur lors du rejet', 'error');
    });
}

// Export teachers to CSV
function exportTeachersToCSV() {
    // Get data for export (use filtered data)
    const data = filteredTeachers.map(teacher => ({
        'ID': teacher.id,
        'Prénom': teacher.firstname,
        'Nom': teacher.lastname,
        'Email': teacher.email,
        'Institution': teacher.institution || '',
        'Statut': teacher.approved ? 'Approuvé' : 'En attente',
        'Date Inscription': formatDateForCSV(teacher.dateInscription),
        'Dernière Connexion': teacher.lastLogin ? formatDateForCSV(teacher.lastLogin) : ''
    }));
    
    if (data.length === 0) {
        showNotification('Aucune donnée à exporter', 'warning');
        return;
    }
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes
            const escaped = value.toString().replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `enseignants_${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Export CSV réussi', 'success');
}

// Format date for CSV
function formatDateForCSV(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date for filename
function formatDateForFilename(date) {
    return date.toISOString().split('T')[0];
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('adminAuthToken');
}

// Get API base URL
function getAPIBaseUrl() {
    // Backend server address, adjust based on environment
    return 'https://web-production-47eca.up.railway.app';
}

// Show notification to user
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
    
    // Close automatically after 5 seconds
    let timeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
    
    // Manual close
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        clearTimeout(timeout);
    }, { once: true });
}



// Global variables for appointments data and pagination
let allAppointments = [];
let filteredAppointments = [];
let appointmentCurrentPage = 1;
let appointmentPageSize = 6;
let appointmentCurrentSort = 'date-desc';
let appointmentCurrentFilter = 'all';
let appointmentDepartmentFilter = 'all';
let appointmentSearchTerm = '';

// Initialize appointment-related components when tab is activated
function initAppointmentsTab() {
    setupAppointmentsSearchAndFilters();
    setupAppointmentsPagination();
    loadAppointmentsData();
    initNewAppointment();
    initEditAppointment(); // Add this line to initialize edit functionality
    
    // Reset modal to create mode when cancelled to avoid issues with editing
    document.getElementById('modal-cancel-appointment').addEventListener('click', resetModalToCreateMode);
    document.getElementById('new-appointment-modal').querySelector('.modal-close').addEventListener('click', resetModalToCreateMode);
    
    // Refresh button
    document.getElementById('refresh-appointments-btn').addEventListener('click', () => {
        loadAppointmentsData();
        showNotification('Rendez-vous actualisés', 'info');
    });
    
    // Export button
    document.getElementById('export-appointments').addEventListener('click', exportAppointmentsToCSV);
}

// Setup search and filter functionality for appointments
function setupAppointmentsSearchAndFilters() {
    const searchInput = document.getElementById('appointment-search');
    const statusFilter = document.getElementById('appointment-status-filter');
    const departmentFilter = document.getElementById('department-filter');
    const sortBy = document.getElementById('appointment-sort');
    
    // Search input event
    searchInput.addEventListener('input', () => {
        appointmentSearchTerm = searchInput.value.toLowerCase();
        filterAndDisplayAppointments();
    });
    
    // Status filter change event
    statusFilter.addEventListener('change', () => {
        appointmentCurrentFilter = statusFilter.value;
        filterAndDisplayAppointments();
    });
    
    // Department filter change event
    departmentFilter.addEventListener('change', () => {
        appointmentDepartmentFilter = departmentFilter.value;
        filterAndDisplayAppointments();
    });
    
    // Sort change event
    sortBy.addEventListener('change', () => {
        appointmentCurrentSort = sortBy.value;
        filterAndDisplayAppointments();
    });
}

// Setup pagination controls for appointments
function setupAppointmentsPagination() {
    const prevPageBtn = document.getElementById('appointments-prev-page');
    const nextPageBtn = document.getElementById('appointments-next-page');
    
    prevPageBtn.addEventListener('click', () => {
        if (appointmentCurrentPage > 1) {
            appointmentCurrentPage--;
            displayAppointments();
            updateAppointmentsPaginationControls();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredAppointments.length / appointmentPageSize);
        if (appointmentCurrentPage < totalPages) {
            appointmentCurrentPage++;
            displayAppointments();
            updateAppointmentsPaginationControls();
        }
    });
}

// Load appointments data from API
function loadAppointmentsData() {
    const appointmentsGrid = document.getElementById('appointments-grid');
    appointmentsGrid.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Chargement des rendez-vous...</p>
        </div>
    `;
    
    // Get auth token
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'admin.html';
        return;
    }
    
    // API endpoint
    const apiUrl = `${getAPIBaseUrl()}/api/appointments`;
    
    // Fetch appointments data
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }
        return response.json();
    })
    .then(data => {
        allAppointments = data;
        updateAppointmentsStatistics();
        filterAndDisplayAppointments();
    })
    .catch(error => {
        console.error('Erreur:', error);
        appointmentsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur lors du chargement des rendez-vous. Veuillez réessayer.</p>
            </div>
        `;
        showNotification('Erreur de chargement des rendez-vous', 'error');
    });
}


// Initialize edit appointment functionality
function initEditAppointment() {
    // Edit buttons will be added dynamically to each appointment card
    // Event delegation to handle edit button clicks
    document.getElementById('appointments-grid').addEventListener('click', (e) => {
        // Find the edit button
        if (e.target.closest('.edit-appointment')) {
            const appointmentCard = e.target.closest('.appointment-card');
            const appointmentId = appointmentCard.getAttribute('data-appointment-id');
            openEditAppointmentModal(appointmentId);
        }
    });
}

// Open edit appointment modal with pre-filled data
function openEditAppointmentModal(appointmentId) {
    const appointment = allAppointments.find(a => a.id == appointmentId);
    if (!appointment) {
        showNotification('Erreur: Rendez-vous introuvable', 'error');
        return;
    }
    
    // Get form elements
    const modal = document.getElementById('new-appointment-modal');
    const patientNameInput = document.getElementById('patient-name');
    const patientPhoneInput = document.getElementById('patient-phone');
    const patientEmailInput = document.getElementById('patient-email');
    const appointmentDateInput = document.getElementById('appointment-date');
    const appointmentTimeInput = document.getElementById('appointment-time');
    const departmentSelect = document.getElementById('department-select');
    const reasonInput = document.getElementById('appointment-reason');
    const notesInput = document.getElementById('appointment-notes');
    
    // Set modal title to indicate editing
    modal.querySelector('.modal-header h3').textContent = 'Modifier Rendez-vous';
    
    // Prefill form with appointment data
    patientNameInput.value = appointment.patientName;
    patientPhoneInput.value = appointment.patientPhone;
    patientEmailInput.value = appointment.patientEmail || '';
    
    // Format date for input (YYYY-MM-DD)
    const dateParts = appointment.appointmentDate.split('-');
    if (dateParts.length === 3) {
        appointmentDateInput.value = appointment.appointmentDate;
    }
    
    // Format time for input (HH:MM)
    const timeParts = appointment.appointmentTime.split(':');
    if (timeParts.length >= 2) {
        appointmentTimeInput.value = `${timeParts[0]}:${timeParts[1]}`;
    }
    
    departmentSelect.value = appointment.department;
    reasonInput.value = appointment.reason;
    notesInput.value = appointment.notes || '';
    
    // Store appointment ID for update operation
    modal.setAttribute('data-edit-id', appointmentId);
    
    // Change save button text to indicate update
    const saveBtn = document.getElementById('modal-save-appointment');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Mettre à jour';
    
    // Show modal
    modal.classList.add('show');
    
    // Switch save button functionality
    saveBtn.onclick = () => {
        if (validateAppointmentForm()) {
            updateAppointment(appointmentId);
        }
    };
}

// Update existing appointment
function updateAppointment(appointmentId) {
    const token = getAuthToken();
    const apiUrl = `${getAPIBaseUrl()}/api/appointments/${appointmentId}`;
    
    // Get form values
    const patientName = document.getElementById('patient-name').value;
    const patientPhone = document.getElementById('patient-phone').value;
    const patientEmail = document.getElementById('patient-email').value;
    const appointmentDate = document.getElementById('appointment-date').value;
    const appointmentTime = document.getElementById('appointment-time').value;
    const department = document.getElementById('department-select').value;
    const reason = document.getElementById('appointment-reason').value;
    const notes = document.getElementById('appointment-notes').value;
    
    // Find the original appointment to preserve its status
    const originalAppointment = allAppointments.find(a => a.id == appointmentId);
    if (!originalAppointment) {
        showNotification('Erreur: Rendez-vous introuvable', 'error');
        return;
    }
    
    // Create updated appointment object
    const updatedAppointment = {
        id: appointmentId,
        patientName: patientName,
        patientPhone: patientPhone,
        patientEmail: patientEmail || null, // Send null if email is empty
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime + ':00', // Add seconds for proper time format
        department: department,
        reason: reason,
        status: originalAppointment.status, // Preserve existing status
        notes: notes || null // Send null if notes are empty
    };
    
    // Show loading state
    const saveBtn = document.getElementById('modal-save-appointment');
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mise à jour...';
    saveBtn.disabled = true;
    
    // Send API request
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedAppointment)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du rendez-vous');
        }
        return response.json();
    })
    .then(data => {
        // Update local data
        const index = allAppointments.findIndex(a => a.id == appointmentId);
        if (index !== -1) {
            allAppointments[index] = data;
        }
        
        filterAndDisplayAppointments();
        
        // Show success message
        showNotification('Rendez-vous mis à jour avec succès', 'success');
        
        // Close modal
        document.getElementById('new-appointment-modal').classList.remove('show');
        
        // Reset modal to create mode
        resetModalToCreateMode();
    })
    .catch(error => {
        console.error('Erreur:', error);
        
        // Show error message
        const formMessage = document.getElementById('form-message');
        formMessage.textContent = 'Erreur lors de la mise à jour du rendez-vous. Veuillez réessayer.';
        formMessage.className = 'form-message error';
        formMessage.style.display = 'block';
    })
    .finally(() => {
        // Reset button state
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Mettre à jour';
    });
}

// Reset modal to create mode
function resetModalToCreateMode() {
    const modal = document.getElementById('new-appointment-modal');
    const saveBtn = document.getElementById('modal-save-appointment');
    
    // Reset title
    modal.querySelector('.modal-header h3').textContent = 'Nouveau Rendez-vous';
    
    // Remove edit ID
    modal.removeAttribute('data-edit-id');
    
    // Reset save button text and handler
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    
    // Reset form
    resetAppointmentForm();
    
    // Restore original save button functionality
    saveBtn.onclick = () => {
        if (validateAppointmentForm()) {
            saveNewAppointment();
        }
    };
}

// Update statistics cards for appointments
function updateAppointmentsStatistics() {
    const totalAppointments = allAppointments.length;
    const completedAppointments = allAppointments.filter(appointment => 
        appointment.status === 'COMPLETED').length;
    const scheduledAppointments = allAppointments.filter(appointment => 
        appointment.status === 'SCHEDULED').length;
    
    document.getElementById('total-appointments').textContent = totalAppointments;
    document.getElementById('completed-appointments').textContent = completedAppointments;
    document.getElementById('scheduled-appointments').textContent = scheduledAppointments;
}

// Filter and sort appointments based on current criteria
function filterAndDisplayAppointments() {
    // Apply filters
    filteredAppointments = allAppointments.filter(appointment => {
        // Status filter
        if (appointmentCurrentFilter !== 'all' && appointment.status !== appointmentCurrentFilter) return false;
        
        // Department filter
        if (appointmentDepartmentFilter !== 'all' && appointment.department !== appointmentDepartmentFilter) return false;
        
        // Search term
        if (appointmentSearchTerm) {
            const patientName = appointment.patientName.toLowerCase();
            const patientPhone = appointment.patientPhone.toLowerCase();
            const patientEmail = appointment.patientEmail ? appointment.patientEmail.toLowerCase() : '';
            
            return patientName.includes(appointmentSearchTerm) || 
                   patientPhone.includes(appointmentSearchTerm) || 
                   patientEmail.includes(appointmentSearchTerm);
        }
        
        return true;
    });
    
    // Apply sorting
    filteredAppointments.sort((a, b) => {
        switch (appointmentCurrentSort) {
            case 'date-desc':
                return new Date(`${b.appointmentDate}T${b.appointmentTime}`) - 
                       new Date(`${a.appointmentDate}T${a.appointmentTime}`);
            case 'date-asc':
                return new Date(`${a.appointmentDate}T${a.appointmentTime}`) - 
                       new Date(`${b.appointmentDate}T${b.appointmentTime}`);
            case 'name-asc':
                return a.patientName.localeCompare(b.patientName);
            case 'name-desc':
                return b.patientName.localeCompare(a.patientName);
            default:
                return 0;
        }
    });
    
    // Reset to first page and display
    appointmentCurrentPage = 1;
    displayAppointments();
    updateAppointmentsPaginationControls();
}

// Display appointments for current page
function displayAppointments() {
    const appointmentsGrid = document.getElementById('appointments-grid');
    appointmentsGrid.innerHTML = '';
    
    const startIndex = (appointmentCurrentPage - 1) * appointmentPageSize;
    const endIndex = Math.min(startIndex + appointmentPageSize, filteredAppointments.length);
    const currentPageAppointments = filteredAppointments.slice(startIndex, endIndex);
    
    if (currentPageAppointments.length === 0) {
        appointmentsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Aucun rendez-vous ne correspond à votre recherche</p>
            </div>
        `;
        return;
    }
    
    currentPageAppointments.forEach(appointment => {
        const cardElement = createAppointmentCard(appointment);
        appointmentsGrid.appendChild(cardElement);
    });
}

// Update pagination controls for appointments
function updateAppointmentsPaginationControls() {
    const totalPages = Math.ceil(filteredAppointments.length / appointmentPageSize);
    const prevBtn = document.getElementById('appointments-prev-page');
    const nextBtn = document.getElementById('appointments-next-page');
    
    document.getElementById('appointments-current-page').textContent = appointmentCurrentPage;
    document.getElementById('appointments-total-pages').textContent = totalPages;
    
    prevBtn.disabled = appointmentCurrentPage <= 1;
    nextBtn.disabled = appointmentCurrentPage >= totalPages;
}

// Create appointment card element
function createAppointmentCard(appointment) {
    // Clone template
    const template = document.getElementById('appointment-card-template');
    const cardElement = template.content.cloneNode(true).querySelector('.appointment-card');
    
    // Set card data
    cardElement.setAttribute('data-appointment-id', appointment.id);
    
    // Status class
    if (appointment.status === 'COMPLETED') {
        cardElement.classList.add('approved');
    } else if (appointment.status === 'CANCELLED') {
        cardElement.classList.add('rejected');
    } else {
        cardElement.classList.add('pending');
    }
    
    // Set avatar initials
    const avatar = cardElement.querySelector('.teacher-avatar');
    avatar.textContent = getInitialsFromName(appointment.patientName);
    
    // Set status badge
    const statusBadge = cardElement.querySelector('.status-badge');
    if (appointment.status === 'COMPLETED') {
        statusBadge.textContent = 'Terminé';
        statusBadge.classList.remove('pending');
        statusBadge.classList.add('approved');
    } else if (appointment.status === 'CANCELLED') {
        statusBadge.textContent = 'Annulé';
        statusBadge.classList.remove('pending');
        statusBadge.classList.add('rejected');
    } else {
        statusBadge.textContent = 'Planifié';
    }
    
    // Set appointment info
    cardElement.querySelector('.patient-name').textContent = appointment.patientName;
    cardElement.querySelector('.department').textContent = `Service: ${appointment.department}`;
    cardElement.querySelector('.patient-phone').textContent = appointment.patientPhone;
    
    // Format appointment date
    const appDate = new Date(appointment.appointmentDate);
    const formattedDate = appDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    cardElement.querySelector('.appointment-date').textContent = formattedDate;
    
    // Format appointment time
    cardElement.querySelector('.appointment-time').textContent = appointment.appointmentTime;
    
    // Set toggle state
    const completedToggle = cardElement.querySelector('.appointment-completed-checkbox');
    completedToggle.checked = appointment.status === 'COMPLETED';
    completedToggle.disabled = appointment.status === 'CANCELLED';
    
    // Set details info
    cardElement.querySelector('.appointment-id').textContent = appointment.id;
    cardElement.querySelector('.patient-email').textContent = appointment.patientEmail || 'Non renseigné';
    cardElement.querySelector('.appointment-reason').textContent = appointment.reason;
    cardElement.querySelector('.appointment-notes').textContent = appointment.notes || 'Aucune note';
    
    // Setup toggle functionality
    completedToggle.addEventListener('change', (e) => {
        if (appointment.status === 'CANCELLED') {
            e.preventDefault();
            return;
        }
        
        const isCompleted = e.target.checked;
        
        if (isCompleted) {
            completeAppointment(appointment.id);
        } else {
            // Show confirmation before changing status
            showConfirmationModal(
                `Voulez-vous marquer ce rendez-vous comme non terminé ?`,
                () => {
                    uncompleteAppointment(appointment.id);
                }
            );
            // Revert toggle state until confirmed
            e.target.checked = true;
        }
    });
    
    // Setup details toggle
    const detailsBtn = cardElement.querySelector('.btn-details');
    const detailsSection = cardElement.querySelector('.card-details');
    
    detailsBtn.addEventListener('click', () => {
        const isExpanded = detailsBtn.classList.contains('expanded');
        
        if (isExpanded) {
            detailsBtn.classList.remove('expanded');
            detailsSection.classList.remove('expanded');
            detailsBtn.querySelector('span').textContent = 'Détails';
        } else {
            detailsBtn.classList.add('expanded');
            detailsSection.classList.add('expanded');
            detailsBtn.querySelector('span').textContent = 'Masquer';
        }
    });
    
    // Cancel button functionality
    const cancelBtn = cardElement.querySelector('.cancel-appointment');
    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
        cancelBtn.disabled = true;
        cancelBtn.style.opacity = 0.5;
    }
    
    cancelBtn.addEventListener('click', () => {
        if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
            return;
        }
        
        showConfirmationModal(
            `Voulez-vous vraiment annuler ce rendez-vous ?`,
            (comments) => {
                cancelAppointment(appointment.id, comments);
            },
            true
        );
    });
    
    // Edit button functionality
    const editBtn = cardElement.querySelector('.edit-appointment');
    editBtn.addEventListener('click', () => {
        // For now, just show a notification that this feature is coming soon
        showNotification('La fonction d\'édition sera disponible prochainement', 'info');
    });
    
    return cardElement;
}

// Get initials from name
function getInitialsFromName(name) {
    if (!name) return '??';
    
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    } else {
        return (nameParts[0].charAt(0) + (nameParts[0].charAt(1) || '')).toUpperCase();
    }
}

// Mark appointment as completed
function completeAppointment(appointmentId) {
    const token = getAuthToken();
    const apiUrl = `${getAPIBaseUrl()}/api/appointments/${appointmentId}`;
    
    // Find the appointment to get all its data
    const appointment = allAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    // Create updated appointment object
    const updatedAppointment = {
        ...appointment,
        status: 'COMPLETED'
    };
    
    // Show loading state
    showNotification('Mise à jour du statut...', 'info');
    
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedAppointment)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour');
        }
        return response.json();
    })
    .then(data => {
        // Update local data
        const appointmentIndex = allAppointments.findIndex(a => a.id === appointmentId);
        if (appointmentIndex !== -1) {
            allAppointments[appointmentIndex].status = 'COMPLETED';
            updateAppointmentsStatistics();
            filterAndDisplayAppointments();
        }
        
        showNotification('Rendez-vous marqué comme terminé', 'success');
    })
    .catch(error => {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour du statut', 'error');
        
        // Revert UI change since operation failed
        const appointmentCard = document.querySelector(`.appointment-card[data-appointment-id="${appointmentId}"]`);
        if (appointmentCard) {
            const toggle = appointmentCard.querySelector('.appointment-completed-checkbox');
            toggle.checked = false;
        }
    });
}

// Mark appointment as not completed (scheduled)
function uncompleteAppointment(appointmentId) {
    const token = getAuthToken();
    const apiUrl = `${getAPIBaseUrl()}/api/appointments/${appointmentId}`;
    
    // Find the appointment to get all its data
    const appointment = allAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    // Create updated appointment object
    const updatedAppointment = {
        ...appointment,
        status: 'SCHEDULED'
    };
    
    // Show loading state
    showNotification('Mise à jour du statut...', 'info');
    
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedAppointment)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour');
        }
        return response.json();
    })
    .then(data => {
        // Update local data
        const appointmentIndex = allAppointments.findIndex(a => a.id === appointmentId);
        if (appointmentIndex !== -1) {
            allAppointments[appointmentIndex].status = 'SCHEDULED';
            updateAppointmentsStatistics();
            filterAndDisplayAppointments();
        }
        
        showNotification('Rendez-vous marqué comme planifié', 'success');
    })
    .catch(error => {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour du statut', 'error');
        
        // Revert UI change since operation failed
        const appointmentCard = document.querySelector(`.appointment-card[data-appointment-id="${appointmentId}"]`);
        if (appointmentCard) {
            const toggle = appointmentCard.querySelector('.appointment-completed-checkbox');
            toggle.checked = true;
        }
    });
}

// Cancel an appointment
function cancelAppointment(appointmentId, comments) {
    const token = getAuthToken();
    const apiUrl = `${getAPIBaseUrl()}/api/appointments/${appointmentId}`;
    
    // Find the appointment to get all its data
    const appointment = allAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    // Create updated appointment object
    const updatedAppointment = {
        ...appointment,
        status: 'CANCELLED',
        notes: comments ? (appointment.notes ? `${appointment.notes}\n---\nMotif d'annulation: ${comments}` : `Motif d'annulation: ${comments}`) : appointment.notes
    };
    
    // Show loading state
    showNotification('Annulation en cours...', 'info');
    
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedAppointment)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'annulation');
        }
        return response.json();
    })
    .then(data => {
        // Update local data
        const appointmentIndex = allAppointments.findIndex(a => a.id === appointmentId);
        if (appointmentIndex !== -1) {
            allAppointments[appointmentIndex].status = 'CANCELLED';
            allAppointments[appointmentIndex].notes = updatedAppointment.notes;
            updateAppointmentsStatistics();
            filterAndDisplayAppointments();
        }
        
        showNotification('Rendez-vous annulé avec succès', 'success');
    })
    .catch(error => {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'annulation', 'error');
    });
}

// Export appointments to CSV
function exportAppointmentsToCSV() {
    // Get data for export (use filtered data)
    const data = filteredAppointments.map(appointment => ({
        'ID': appointment.id,
        'Patient': appointment.patientName,
        'Téléphone': appointment.patientPhone,
        'Email': appointment.patientEmail || '',
        'Service': appointment.department,
        'Date': formatDateForCSV(appointment.appointmentDate),
        'Heure': appointment.appointmentTime,
        'Motif': appointment.reason,
        'Statut': getStatusLabel(appointment.status),
        'Notes': appointment.notes || ''
    }));
    
    if (data.length === 0) {
        showNotification('Aucune donnée à exporter', 'warning');
        return;
    }
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes
            const escaped = value.toString().replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rendez-vous_${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Export CSV réussi', 'success');
}

// Format date for CSV
function formatDateForCSV(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format date for filename
function formatDateForFilename(date) {
    return date.toISOString().split('T')[0];
}

// Get human-readable status label
function getStatusLabel(status) {
    switch(status) {
        case 'SCHEDULED': return 'Planifié';
        case 'COMPLETED': return 'Terminé';
        case 'CANCELLED': return 'Annulé';
        default: return status;
    }
}

// Initialize appointments tab when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add tab switching listener to initialize appointments when tab is activated
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            if (tabId === 'passions') {
                // Initialize appointments tab when it's activated
                setTimeout(() => {
                    initAppointmentsTab();
                }, 100);
            }
        });
    });
    
    // If passions tab is active by default, initialize it
    if (document.querySelector('.tab-btn[data-tab="passions"].active')) {
        setTimeout(() => {
            initAppointmentsTab();
        }, 100);
    }
});


// New Appointment Modal Functionality

// Initialize new appointment functionality
function initNewAppointment() {
    const newAppointmentBtn = document.getElementById('new-appointment');
    const newAppointmentModal = document.getElementById('new-appointment-modal');
    const closeBtn = newAppointmentModal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('modal-cancel-appointment');
    const saveBtn = document.getElementById('modal-save-appointment');
    const appointmentForm = document.getElementById('new-appointment-form');
    
    // Set default date and time
    const today = new Date();
    const dateInput = document.getElementById('appointment-date');
    const timeInput = document.getElementById('appointment-time');
    
    // Format date as YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    
    // Format time as HH:MM
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(Math.ceil(today.getMinutes() / 15) * 15).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    dateInput.value = formattedDate;
    timeInput.value = formattedTime;
    
    // Open modal when New button is clicked
    newAppointmentBtn.addEventListener('click', () => {
        resetAppointmentForm();
        newAppointmentModal.classList.add('show');
    });
    
    // Close modal functions
    closeBtn.addEventListener('click', () => {
        newAppointmentModal.classList.remove('show');
    });
    
    cancelBtn.addEventListener('click', () => {
        newAppointmentModal.classList.remove('show');
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === newAppointmentModal) {
            newAppointmentModal.classList.remove('show');
        }
    });
    
    // Save appointment
    saveBtn.addEventListener('click', () => {
        if (validateAppointmentForm()) {
            saveNewAppointment();
        }
    });
}

// Reset the appointment form
function resetAppointmentForm() {
    const form = document.getElementById('new-appointment-form');
    form.reset();
    
    // Set default date and time
    const today = new Date();
    const dateInput = document.getElementById('appointment-date');
    const timeInput = document.getElementById('appointment-time');
    
    // Format date as YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    
    // Format time as HH:MM (rounded to next 15 minutes)
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(Math.ceil(today.getMinutes() / 15) * 15 % 60).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    dateInput.value = formattedDate;
    timeInput.value = formattedTime;
    
    // Clear any error messages
    const formMessage = document.getElementById('form-message');
    formMessage.textContent = '';
    formMessage.className = 'form-message';
    formMessage.style.display = 'none';
}

// Validate the appointment form
function validateAppointmentForm() {
    const form = document.getElementById('new-appointment-form');
    const formMessage = document.getElementById('form-message');
    
    // Check required fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('invalid');
            isValid = false;
        } else {
            field.classList.remove('invalid');
        }
    });
    
    // Check email format if provided
    const emailField = document.getElementById('patient-email');
    if (emailField.value.trim() && !isValidEmail(emailField.value)) {
        emailField.classList.add('invalid');
        isValid = false;
    }
    
    // Check phone format
    const phoneField = document.getElementById('patient-phone');
    if (!isValidPhone(phoneField.value)) {
        phoneField.classList.add('invalid');
        isValid = false;
    }
    
    // Display error message if validation fails
    if (!isValid) {
        formMessage.textContent = 'Veuillez remplir tous les champs obligatoires correctement.';
        formMessage.className = 'form-message error';
        formMessage.style.display = 'block';
    }
    
    return isValid;
}

// Validate email format
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validate phone format
function isValidPhone(phone) {
    // Allow various formats: 0612345678, 06 12 34 56 78, +33612345678, etc.
    const regex = /^(\+\d{1,3}\s?)?(\d\s?){9,}$/;
    return regex.test(phone);
}

// Save new appointment to API
function saveNewAppointment() {
    const token = getAuthToken();
    const apiUrl = `${getAPIBaseUrl()}/api/appointments`;
    
    // Get form values
    const patientName = document.getElementById('patient-name').value;
    const patientPhone = document.getElementById('patient-phone').value;
    const patientEmail = document.getElementById('patient-email').value;
    const appointmentDate = document.getElementById('appointment-date').value;
    const appointmentTime = document.getElementById('appointment-time').value;
    const department = document.getElementById('department-select').value;
    const reason = document.getElementById('appointment-reason').value;
    const notes = document.getElementById('appointment-notes').value;
    
    // Create appointment object
    const appointment = {
        patientName: patientName,
        patientPhone: patientPhone,
        patientEmail: patientEmail || null, // Send null if email is empty
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime + ':00', // Add seconds for proper time format
        department: department,
        reason: reason,
        status: 'SCHEDULED',
        notes: notes || null // Send null if notes are empty
    };
    
    // Show loading state
    const saveBtn = document.getElementById('modal-save-appointment');
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
    saveBtn.disabled = true;
    
    // Send API request
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointment)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la création du rendez-vous');
        }
        return response.json();
    })
    .then(data => {
        // Update local data
        allAppointments.push(data);
        updateAppointmentsStatistics();
        filterAndDisplayAppointments();
        
        // Show success message
        showNotification('Rendez-vous créé avec succès', 'success');
        
        // Close modal
        document.getElementById('new-appointment-modal').classList.remove('show');
    })
    .catch(error => {
        console.error('Erreur:', error);
        
        // Show error message
        const formMessage = document.getElementById('form-message');
        formMessage.textContent = 'Erreur lors de la création du rendez-vous. Veuillez réessayer.';
        formMessage.className = 'form-message error';
        formMessage.style.display = 'block';
    })
    .finally(() => {
        // Reset button state
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
        saveBtn.disabled = false;
    });
}
