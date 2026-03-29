/* ================================
   Main Application Controller
   ================================ */

const App = (function () {
    // Current view
    let currentView = 'dashboard';
    let currentEditingRequest = null;

    // Initialize application
    function init() {
        try {
            console.log('App initialization started...');
            // Initialize modules
            DataModule.init();
            AuthModule.init();

            const currentUser = AuthModule.getCurrentUser();
            const authContainer = document.getElementById('auth-container');
            const mainApp = document.getElementById('main-app');

            if (!currentUser) {
                // Show Login Screen
                if (authContainer) authContainer.style.display = 'flex';
                if (mainApp) mainApp.style.display = 'none';
                setupAuthForms();
                return; // Stop further init
            }

            // Hide auth, show main app
            if (authContainer) authContainer.style.display = 'none';
            if (mainApp) mainApp.style.display = 'flex';

            // Setup event listeners
            setupNavigation();
            setupModals();
            setupForms();
            setupFilters();

            // Listen for role changes
            AuthModule.onRoleChange(() => {
                console.log('Role changed, refreshing UI...');
                updateNavVisibility();
                refreshCurrentView();
                updatePendingBadge();
            });

            // Initial render
            updateNavVisibility();
            refreshCurrentView();
            updatePendingBadge();

            console.log('HR Leave Management System initialized successfully');
        } catch (error) {
            console.error('CRITICAL: Failed to initialize application:', error);
            // Show error to user
            const app = document.querySelector('.app-container') || document.body;
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#ef4444;color:white;padding:20px;z-index:9999;text-align:center;';
            errorMsg.innerHTML = `
                <p><strong>System Error</strong>: Failed to load application data.</p>
                <p style="font-size:0.9em">${error.message}</p>
                <button onclick="localStorage.clear(); location.reload();" style="margin-top:10px;padding:5px 15px;background:white;color:#ef4444;border:none;border-radius:4px;cursor:pointer;">Reset System Data</button>
            `;
            app.prepend(errorMsg);
        }
    }

    // Auth Forms Setup
    function setupAuthForms() {
        const linkRegister = document.getElementById('link-register');
        const linkLogin = document.getElementById('link-login');
        if (linkRegister) {
            linkRegister.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-view').style.display = 'none';
                document.getElementById('register-view').style.display = 'block';
            });
        }
        if (linkLogin) {
            linkLogin.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('register-view').style.display = 'none';
                document.getElementById('login-view').style.display = 'block';
            });
        }

        const formLogin = document.getElementById('form-login');
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const errorEl = document.getElementById('login-error');
                try {
                    AuthModule.login(email, password);
                    window.location.reload();
                } catch (err) {
                    errorEl.textContent = err.message;
                    errorEl.style.display = 'block';
                }
            });
        }

        const formRegister = document.getElementById('form-register');
        if (formRegister) {
            formRegister.addEventListener('submit', (e) => {
                e.preventDefault();
                const data = {
                    name: document.getElementById('reg-name').value,
                    email: document.getElementById('reg-email').value,
                    department: document.getElementById('reg-dept').value,
                    password: document.getElementById('reg-password').value
                };
                const errorEl = document.getElementById('register-error');
                const successEl = document.getElementById('register-success');
                try {
                    DataModule.registerUser(data);
                    errorEl.style.display = 'none';
                    successEl.textContent = 'Registration successful! Pending Admin approval.';
                    successEl.style.display = 'block';
                    formRegister.reset();
                } catch (err) {
                    successEl.style.display = 'none';
                    errorEl.textContent = err.message;
                    errorEl.style.display = 'block';
                }
            });
        }
    }

    // Navigation
    function setupNavigation() {
        // Nav items
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                switchView(item.dataset.view);
            });
        });

        // View all links
        document.querySelectorAll('.view-all[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchView(link.dataset.view);
            });
        });

        // New request button
        document.getElementById('new-request-btn').addEventListener('click', () => {
            openModal('modal-request-type');
        });

        // Create first request button
        const createFirstBtn = document.getElementById('create-first-request');
        if (createFirstBtn) {
            createFirstBtn.addEventListener('click', () => {
                openModal('modal-request-type');
            });
        }

        // Quick action buttons
        document.querySelectorAll('.action-btn[data-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                openRequestForm(btn.dataset.type);
            });
        });

        // Request type selection
        document.querySelectorAll('.request-type-btn[data-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal('modal-request-type');
                openRequestForm(btn.dataset.type);
            });
        });

        // Logout button
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                AuthModule.logout();
            });
        }

        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    }

    // Switch view
    function switchView(viewName) {
        currentView = viewName;

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Show correct view
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === 'view-' + viewName);
        });

        // Update header
        updateHeader(viewName);

        // Refresh view content
        refreshCurrentView();

        // Close mobile menu
        document.getElementById('sidebar').classList.remove('open');
    }

    // Update header based on view
    function updateHeader(viewName) {
        const titles = {
            'dashboard': { title: 'Dashboard', subtitle: 'Overview of your leave requests' },
            'my-requests': { title: 'My Requests', subtitle: 'View and manage your requests' },
            'pending-approvals': { title: 'Pending Approvals', subtitle: 'Requests waiting for your approval' },
            'all-requests': { title: 'All Requests', subtitle: 'View all employee requests' },
            'profile': { title: 'My Profile', subtitle: 'View and manage your personal information' },
            'user-management': { title: 'User Management', subtitle: 'Manage employee roles and permissions' },
            'analytics': { title: 'Analytics & Insights', subtitle: 'Visual reporting and team availability' }
        };

        const info = titles[viewName] || { title: viewName, subtitle: '' };
        document.getElementById('page-title').textContent = info.title;
        document.getElementById('page-subtitle').textContent = info.subtitle;
    }

    // Refresh current view
    function refreshCurrentView() {
        switch (currentView) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'my-requests':
                renderMyRequests();
                break;
            case 'pending-approvals':
                renderPendingApprovals();
                break;
            case 'all-requests':
                renderAllRequests();
                break;
            case 'user-management':
                renderUserManagement();
                break;
            case 'profile':
                renderProfile();
                break;
            case 'analytics':
                renderAnalytics();
                break;
        }
    }

    // Render dashboard
    function renderDashboard() {
        const currentUser = AuthModule.getCurrentUser();
        const counts = WorkflowModule.getRequestCounts(currentUser.id);

        // Update stats
        document.getElementById('stat-pending').textContent = counts.pending;
        document.getElementById('stat-approved').textContent = counts.approved;
        document.getElementById('stat-rejected').textContent = counts.rejected;
        document.getElementById('stat-balance').textContent = currentUser.annualLeaveBalance || 21;

        // Render recent requests
        const requests = RequestsModule.getMyRequests().slice(0, 5);
        const container = document.getElementById('recent-requests-list');

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>No requests yet</p>
                    <button class="btn btn-outline" onclick="App.openModal('modal-request-type')">Create your first request</button>
                </div>
            `;
        } else {
            container.innerHTML = requests.map(r => RequestsModule.renderRequestCard(r)).join('');
        }

        // Role-specific views (Availability)
        const availabilityCard = document.getElementById('team-availability-card');
        if (availabilityCard) {
            const user = AuthModule.getCurrentUser();
            if (user.role === 'gm' || user.role === 'hr') {
                availabilityCard.style.display = 'block';
                renderAvailabilityList();
            } else {
                availabilityCard.style.display = 'none';
            }
        }
    }

    async function renderAvailabilityList() {
        const listContainer = document.getElementById('availability-list');
        if (!listContainer) return;

        listContainer.innerHTML = '<div class="loading-state">Loading availability...</div>';

        try {
            const availability = await APIService.getTeamAvailability();

            if (availability.length === 0) {
                listContainer.innerHTML = '<div class="empty-state">No employee data found</div>';
                return;
            }

            listContainer.innerHTML = availability.map(item => `
                <div class="availability-item ${item.status}">
                    <div class="availability-info">
                        <div class="employee-name">${item.name}</div>
                        <div class="employee-dept">${item.department} Department</div>
                    </div>
                    <div class="availability-status">
                        <span class="status-badge status-${item.status}">
                            ${item.status === 'on-leave' ? (item.leaveType || 'On Leave') : 'Available'}
                        </span>
                        ${item.returnDate ? `<div class="return-date">Back on ${formatDate(item.returnDate)}</div>` : ''}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error fetching availability:', error);
            listContainer.innerHTML = '<div class="error-state">Failed to load availability</div>';
        }
    }

    // Render my requests
    function renderMyRequests() {
        try {
            const container = document.getElementById('my-requests-list');
            if (!container) return;

            const typeFilter = document.getElementById('filter-type');
            const statusFilter = document.getElementById('filter-status');
            const searchQuery = document.getElementById('search-requests');

            const requests = RequestsModule.getMyRequests({
                type: typeFilter ? typeFilter.value : '',
                status: statusFilter ? statusFilter.value : '',
                search: searchQuery ? searchQuery.value : ''
            });

            if (requests.length === 0) {
                container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>No requests found</p>
                </div>`;
            } else {
                container.innerHTML = requests.map(r => RequestsModule.renderRequestCard(r)).join('');
            }
        } catch (error) {
            console.error('Error in renderMyRequests:', error);
            const container = document.getElementById('my-requests-list');
            if (container) {
                container.innerHTML = `<div class="error-msg">Error loading requests: ${error.message}</div>`;
            }
        }
    }

    // Render pending approvals
    function renderPendingApprovals() {
        try {
            const container = document.getElementById('pending-approvals-list');
            if (!container) return;

            const typeFilter = document.getElementById('approval-filter-type');
            let requests = WorkflowModule.getPendingApprovals();

            if (typeFilter && typeFilter.value) {
                requests = requests.filter(r => r.type === typeFilter.value);
            }

            if (requests.length === 0) {
                container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
+                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <p>No pending approvals</p>
                </div>`;
            } else {
                container.innerHTML = requests.map(r => RequestsModule.renderRequestCard(r, true)).join('');
            }
        } catch (error) {
            console.error('Error in renderPendingApprovals:', error);
            const container = document.getElementById('pending-approvals-list');
            if (container) {
                container.innerHTML = `<div class="error-msg">Error loading approvals: ${error.message}</div>`;
            }
        }
    }

    // Render all requests
    function renderAllRequests() {
        try {
            const container = document.getElementById('all-requests-list');
            if (!container) return;

            const typeFilter = document.getElementById('all-filter-type');
            const statusFilter = document.getElementById('all-filter-status');
            const employeeFilter = document.getElementById('all-filter-employee');

            // Populate employee filter if empty
            if (employeeFilter && employeeFilter.options.length <= 1) {
                const employees = DataModule.getEmployees();
                employees.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = emp.id;
                    option.textContent = emp.name;
                    employeeFilter.appendChild(option);
                });
            }

            const requests = RequestsModule.getAllRequests({
                type: typeFilter ? typeFilter.value : '',
                status: statusFilter ? statusFilter.value : '',
                employeeId: employeeFilter ? employeeFilter.value : ''
            });

            if (requests.length === 0) {
                container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>No requests found</p>
                </div>`;
            } else {
                container.innerHTML = requests.map(r => RequestsModule.renderRequestCard(r, true)).join('');
            }
        } catch (error) {
            console.error('Error in renderAllRequests:', error);
            const container = document.getElementById('all-requests-list');
            if (container) {
                container.innerHTML = `<div class="error-msg">Error loading requests: ${error.message}</div>`;
            }
        }
    }

    // Update pending badge
    function updatePendingBadge() {
        const pending = WorkflowModule.getPendingApprovals();
        const badge = document.getElementById('pending-badge');
        if (badge) {
            badge.textContent = pending.length || '';
        }
    }

    // Setup filters
    function setupFilters() {
        // My requests filters
        const filterType = document.getElementById('filter-type');
        if (filterType) filterType.addEventListener('change', renderMyRequests);

        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) filterStatus.addEventListener('change', renderMyRequests);

        const searchRequests = document.getElementById('search-requests');
        if (searchRequests) searchRequests.addEventListener('input', debounce(renderMyRequests, 300));

        // Pending approvals filter
        const approvalFilter = document.getElementById('approval-filter-type');
        if (approvalFilter) approvalFilter.addEventListener('change', renderPendingApprovals);

        // All requests filters
        const allFilterType = document.getElementById('all-filter-type');
        if (allFilterType) allFilterType.addEventListener('change', renderAllRequests);

        const allFilterStatus = document.getElementById('all-filter-status');
        if (allFilterStatus) allFilterStatus.addEventListener('change', renderAllRequests);

        const allFilterEmployee = document.getElementById('all-filter-employee');
        if (allFilterEmployee) allFilterEmployee.addEventListener('change', renderAllRequests);
    }

    // Modal management
    function setupModals() {
        // Close buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Overlay click to close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                const modal = overlay.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            // Reset form if exists
            const form = modal.querySelector('form');
            if (form) form.reset();
            currentEditingRequest = null;
        }
    }

    // Open request form
    function openRequestForm(type) {
        const modalId = 'modal-' + type;
        openModal(modalId);
        currentEditingRequest = null;

        // Reset form
        const form = document.getElementById('form-' + type);
        if (form) form.reset();

        // Clear hidden id field
        const idField = document.querySelector(`#${modalId} [name="id"]`);
        if (idField) idField.value = '';
    }

    // Setup forms
    function setupForms() {
        setupVacationForm();
        setupAbsenceForm();
        setupLateForm();
        setupBusinessTripForm();
        setupApprovalForm();
        setupProfileForm();
    }

    // Vacation form
    function setupVacationForm() {
        const startDate = document.getElementById('vacation-start-date');
        const joiningDate = document.getElementById('vacation-joining-date');
        const daysField = document.getElementById('vacation-days');

        // Auto-calculate days
        function calcDays() {
            if (startDate.value && joiningDate.value) {
                const days = RequestsModule.calculateDays(startDate.value, joiningDate.value);
                daysField.value = days;
            }
        }

        startDate.addEventListener('change', calcDays);
        joiningDate.addEventListener('change', calcDays);

        // Submit button
        document.getElementById('vacation-submit').addEventListener('click', () => {
            submitVacationForm(false);
        });

        // Save draft button
        document.getElementById('vacation-save-draft').addEventListener('click', () => {
            submitVacationForm(true);
        });
    }

    function submitVacationForm(saveAsDraft) {
        const form = document.getElementById('form-vacation');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = {
            vacationType: document.getElementById('vacation-type').value,
            travelDate: document.getElementById('vacation-travel-date').value,
            startDate: document.getElementById('vacation-start-date').value,
            joiningDate: document.getElementById('vacation-joining-date').value,
            days: parseInt(document.getElementById('vacation-days').value) || 0,
            ticketEncashment: document.getElementById('vacation-encashment').checked,
            exitReentry: document.getElementById('vacation-exit-reentry').checked,
            notes: document.getElementById('vacation-notes').value
        };

        const existingId = document.getElementById('vacation-id').value;

        if (existingId) {
            RequestsModule.updateRequest(existingId, data);
            if (!saveAsDraft) {
                const request = DataModule.getRequest(existingId);
                if (request.status === 'draft') {
                    WorkflowModule.submitRequest(request);
                }
            }
            showToast('Request updated successfully', 'success');
        } else {
            RequestsModule.createRequest('vacation', data, saveAsDraft);
            showToast(saveAsDraft ? 'Draft saved' : 'Request submitted successfully', 'success');
        }

        closeModal('modal-vacation');
        refreshCurrentView();
        updatePendingBadge();
    }

    // Absence form
    function setupAbsenceForm() {
        const dateTypeRadios = document.querySelectorAll('input[name="dateType"]');
        const singleDateGroup = document.getElementById('absence-single-date-group');
        const startDateGroup = document.getElementById('absence-start-date-group');
        const endDateGroup = document.getElementById('absence-end-date-group');

        dateTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const isRange = radio.value === 'range' && radio.checked;
                singleDateGroup.classList.toggle('hidden', isRange);
                startDateGroup.classList.toggle('hidden', !isRange);
                endDateGroup.classList.toggle('hidden', !isRange);
            });
        });

        // File upload
        const fileInput = document.getElementById('absence-attachment');
        const fileName = document.getElementById('absence-file-name');
        fileInput.addEventListener('change', () => {
            fileName.textContent = fileInput.files[0]?.name || '';
        });

        // Submit
        document.getElementById('absence-submit').addEventListener('click', () => {
            submitAbsenceForm(false);
        });

        document.getElementById('absence-save-draft').addEventListener('click', () => {
            submitAbsenceForm(true);
        });
    }

    function submitAbsenceForm(saveAsDraft) {
        const dateType = document.querySelector('input[name="dateType"]:checked').value;

        const data = {
            absenceType: document.getElementById('absence-type').value,
            dateType: dateType,
            absenceDate: dateType === 'single' ? document.getElementById('absence-date').value : null,
            startDate: dateType === 'range' ? document.getElementById('absence-start-date').value : null,
            endDate: dateType === 'range' ? document.getElementById('absence-end-date').value : null,
            reason: document.getElementById('absence-reason').value,
            attachment: document.getElementById('absence-attachment').files[0]?.name || null
        };

        const existingId = document.getElementById('absence-id').value;

        if (existingId) {
            RequestsModule.updateRequest(existingId, data);
            if (!saveAsDraft) {
                const request = DataModule.getRequest(existingId);
                if (request.status === 'draft') {
                    WorkflowModule.submitRequest(request);
                }
            }
            showToast('Request updated successfully', 'success');
        } else {
            RequestsModule.createRequest('absence', data, saveAsDraft);
            showToast(saveAsDraft ? 'Draft saved' : 'Request submitted successfully', 'success');
        }

        closeModal('modal-absence');
        refreshCurrentView();
        updatePendingBadge();
    }

    // Late form
    function setupLateForm() {
        const fileInput = document.getElementById('late-attachment');
        const fileName = document.getElementById('late-file-name');
        fileInput.addEventListener('change', () => {
            fileName.textContent = fileInput.files[0]?.name || '';
        });

        document.getElementById('late-submit').addEventListener('click', () => {
            submitLateForm(false);
        });

        document.getElementById('late-save-draft').addEventListener('click', () => {
            submitLateForm(true);
        });
    }

    function submitLateForm(saveAsDraft) {
        const form = document.getElementById('form-late');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = {
            lateDate: document.getElementById('late-date').value,
            arrivalTime: document.getElementById('late-time').value,
            reason: document.getElementById('late-reason').value,
            attachment: document.getElementById('late-attachment').files[0]?.name || null
        };

        const existingId = document.getElementById('late-id').value;

        if (existingId) {
            RequestsModule.updateRequest(existingId, data);
            if (!saveAsDraft) {
                const request = DataModule.getRequest(existingId);
                if (request.status === 'draft') {
                    WorkflowModule.submitRequest(request);
                }
            }
            showToast('Request updated successfully', 'success');
        } else {
            RequestsModule.createRequest('late', data, saveAsDraft);
            showToast(saveAsDraft ? 'Draft saved' : 'Request submitted successfully', 'success');
        }

        closeModal('modal-late');
        refreshCurrentView();
        updatePendingBadge();
    }

    // Business trip form
    function setupBusinessTripForm() {
        document.getElementById('trip-submit').addEventListener('click', () => {
            submitBusinessTripForm(false);
        });

        document.getElementById('trip-save-draft').addEventListener('click', () => {
            submitBusinessTripForm(true);
        });
    }

    function submitBusinessTripForm(saveAsDraft) {
        const form = document.getElementById('form-business-trip');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = {
            destination: document.getElementById('trip-destination').value,
            purpose: document.getElementById('trip-purpose').value,
            departureDate: document.getElementById('trip-departure').value,
            returnDate: document.getElementById('trip-return').value,
            transportation: document.getElementById('trip-transportation').value,
            accommodation: document.getElementById('trip-accommodation').checked,
            perDiem: document.getElementById('trip-perdiem').checked,
            notes: document.getElementById('trip-notes').value
        };

        const existingId = document.getElementById('trip-id').value;

        if (existingId) {
            RequestsModule.updateRequest(existingId, data);
            if (!saveAsDraft) {
                const request = DataModule.getRequest(existingId);
                if (request.status === 'draft') {
                    WorkflowModule.submitRequest(request);
                }
            }
            showToast('Request updated successfully', 'success');
        } else {
            RequestsModule.createRequest('business-trip', data, saveAsDraft);
            showToast(saveAsDraft ? 'Draft saved' : 'Request submitted successfully', 'success');
        }

        closeModal('modal-business-trip');
        refreshCurrentView();
        updatePendingBadge();
    }

    // Approval form
    function setupApprovalForm() {
        document.getElementById('approval-confirm').addEventListener('click', () => {
            const requestId = document.getElementById('approval-request-id').value;
            const action = document.getElementById('approval-action').value;
            const comments = document.getElementById('approval-comments').value;

            if (action === 'approve') {
                WorkflowModule.approveRequest(requestId, comments);
                showToast('Request approved', 'success');
            } else {
                WorkflowModule.rejectRequest(requestId, comments);
                showToast('Request rejected', 'info');
            }

            closeModal('modal-approval');
            closeModal('modal-view-request');
            refreshCurrentView();
            updatePendingBadge();
        });
    }

    // View request details
    function viewRequest(requestId) {
        const request = DataModule.getRequest(requestId);
        if (!request) return;

        const typeInfo = RequestsModule.getTypeInfo(request.type);
        document.getElementById('view-request-title').textContent = typeInfo.name + ' Request';
        document.getElementById('view-request-details').innerHTML = RequestsModule.renderRequestDetails(request);
        document.getElementById('view-request-timeline').innerHTML = WorkflowModule.renderTimeline(request.workflow);

        // Action buttons
        const actionsContainer = document.getElementById('view-request-actions');
        let actionsHtml = '<button type="button" class="btn btn-ghost modal-cancel">Close</button>';

        const canApprove = AuthModule.canApproveRequest(request);
        const canEdit = AuthModule.canEditRequest(request);
        const canCancel = AuthModule.canCancelRequest(request);

        // Add PDF Export and Calendar buttons for approved requests
        if (request.status === 'approved') {
            const currentUser = AuthModule.getCurrentUser();
            const employee = DataModule.getEmployee(request.employeeId);

            actionsHtml += `
                <button class="btn btn-secondary" onclick="PDFService.generateLeaveApprovalPDF(${JSON.stringify(request).replace(/"/g, '&quot;')}, ${JSON.stringify(employee).replace(/"/g, '&quot;')})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Export PDF
                </button>
                <button class="btn btn-secondary" onclick="CalendarService.downloadICS(${JSON.stringify(request).replace(/"/g, '&quot;')}, ${JSON.stringify(employee).replace(/"/g, '&quot;')})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Add to Calendar
                </button>
            `;
        }

        if (canApprove) {
            actionsHtml += `
                <button class="btn btn-danger" onclick="App.rejectRequest('${request.id}')">Reject</button>
                <button class="btn btn-success" onclick="App.approveRequest('${request.id}')">Approve</button>
            `;
        }

        if (canEdit) {
            actionsHtml += `<button class="btn btn-secondary" onclick="App.editRequest('${request.id}')">Edit</button>`;
        }

        if (canCancel && !canApprove) {
            actionsHtml += `<button class="btn btn-outline" style="color: var(--error-400); border-color: var(--error-400);" onclick="App.cancelRequest('${request.id}')">Cancel Request</button>`;
        }

        actionsContainer.innerHTML = actionsHtml;

        // Re-bind close button
        actionsContainer.querySelector('.modal-cancel')?.addEventListener('click', () => {
            closeModal('modal-view-request');
        });

        openModal('modal-view-request');
    }

    // Edit request
    function editRequest(requestId) {
        const request = DataModule.getRequest(requestId);
        if (!request || !AuthModule.canEditRequest(request)) return;

        closeModal('modal-view-request');
        currentEditingRequest = request;

        // Open appropriate form and populate
        switch (request.type) {
            case 'vacation':
                openModal('modal-vacation');
                document.getElementById('vacation-id').value = request.id;
                document.getElementById('vacation-type').value = request.data.vacationType;
                document.getElementById('vacation-travel-date').value = request.data.travelDate || '';
                document.getElementById('vacation-start-date').value = request.data.startDate;
                document.getElementById('vacation-joining-date').value = request.data.joiningDate;
                document.getElementById('vacation-days').value = request.data.days || '';
                document.getElementById('vacation-encashment').checked = request.data.ticketEncashment;
                document.getElementById('vacation-exit-reentry').checked = request.data.exitReentry;
                document.getElementById('vacation-notes').value = request.data.notes || '';
                break;
            case 'absence':
                openModal('modal-absence');
                document.getElementById('absence-id').value = request.id;
                document.getElementById('absence-type').value = request.data.absenceType;
                if (request.data.dateType === 'range') {
                    document.querySelector('input[name="dateType"][value="range"]').checked = true;
                    document.getElementById('absence-single-date-group').classList.add('hidden');
                    document.getElementById('absence-start-date-group').classList.remove('hidden');
                    document.getElementById('absence-end-date-group').classList.remove('hidden');
                    document.getElementById('absence-start-date').value = request.data.startDate;
                    document.getElementById('absence-end-date').value = request.data.endDate;
                } else {
                    document.querySelector('input[name="dateType"][value="single"]').checked = true;
                    document.getElementById('absence-date').value = request.data.absenceDate;
                }
                document.getElementById('absence-reason').value = request.data.reason || '';
                break;
            case 'late':
                openModal('modal-late');
                document.getElementById('late-id').value = request.id;
                document.getElementById('late-date').value = request.data.lateDate;
                document.getElementById('late-time').value = request.data.arrivalTime;
                document.getElementById('late-reason').value = request.data.reason;
                break;
            case 'business-trip':
                openModal('modal-business-trip');
                document.getElementById('trip-id').value = request.id;
                document.getElementById('trip-destination').value = request.data.destination;
                document.getElementById('trip-purpose').value = request.data.purpose;
                document.getElementById('trip-departure').value = request.data.departureDate;
                document.getElementById('trip-return').value = request.data.returnDate;
                document.getElementById('trip-transportation').value = request.data.transportation;
                document.getElementById('trip-accommodation').checked = request.data.accommodation;
                document.getElementById('trip-perdiem').checked = request.data.perDiem;
                document.getElementById('trip-notes').value = request.data.notes || '';
                break;
        }
    }

    // Approve request
    function approveRequest(requestId) {
        document.getElementById('approval-request-id').value = requestId;
        document.getElementById('approval-action').value = 'approve';
        document.getElementById('approval-title').textContent = 'Approve Request';
        document.getElementById('approval-confirm').textContent = 'Approve';
        document.getElementById('approval-confirm').className = 'btn btn-success';
        document.getElementById('approval-comments').value = '';
        openModal('modal-approval');
    }

    // Reject request
    function rejectRequest(requestId) {
        document.getElementById('approval-request-id').value = requestId;
        document.getElementById('approval-action').value = 'reject';
        document.getElementById('approval-title').textContent = 'Reject Request';
        document.getElementById('approval-confirm').textContent = 'Reject';
        document.getElementById('approval-confirm').className = 'btn btn-danger';
        document.getElementById('approval-comments').value = '';
        openModal('modal-approval');
    }

    // Cancel request
    function cancelRequest(requestId) {
        if (confirm('Are you sure you want to cancel this request?')) {
            WorkflowModule.cancelRequest(requestId);
            showToast('Request cancelled', 'info');
            closeModal('modal-view-request');
            refreshCurrentView();
            updatePendingBadge();
        }
    }

    // Toast notifications
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Update Nav Visibility
    function updateNavVisibility() {
        const currentUser = AuthModule.getCurrentUser();
        const navUserManagement = document.getElementById('nav-user-management');

        if (navUserManagement) {
            if (currentUser && currentUser.role === 'admin') {
                navUserManagement.style.display = 'flex';
            } else {
                navUserManagement.style.display = 'none';
            }
        }
    }

    // Render User Management
    function renderUserManagement() {
        const currentUser = AuthModule.getCurrentUser();
        if (currentUser.role !== 'admin') {
            switchView('dashboard');
            return;
        }

        const employees = DataModule.getEmployees();
        const pendingContainer = document.getElementById('pending-list-body');
        const pendingCard = document.getElementById('pending-users-card');
        const container = document.getElementById('user-list-body');

        const pendingEmployees = employees.filter(e => e.accountStatus === 'pending');
        const activeEmployees = employees.filter(e => e.accountStatus === 'approved');

        if (pendingEmployees.length > 0) {
            pendingCard.style.display = 'block';
            pendingContainer.innerHTML = pendingEmployees.map(emp => `
                <tr>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar-sm" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-500); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">${emp.avatar}</div>
                            <span style="margin-left: 10px; font-weight: 500;">${emp.name}</span>
                        </div>
                    </td>
                    <td>${emp.email}</td>
                    <td>${emp.department}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="App.approveRegistration('${emp.id}')" style="margin-right: 5px; padding: 4px 12px; font-size: 12px; height: auto;">Approve</button>
                        <button class="btn btn-sm btn-outline" style="color: var(--error-500); border-color: var(--error-500); padding: 4px 12px; font-size: 12px; height: auto;" onclick="App.rejectRegistration('${emp.id}')">Reject</button>
                    </td>
                </tr>
            `).join('');
        } else {
            pendingCard.style.display = 'none';
        }

        container.innerHTML = activeEmployees.map(emp => {
            const empId = emp.profile?.employeeId || emp.id || '-';
            return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-sm">${emp.avatar}</div>
                        <input type="text" style="padding: 0.25rem 0.5rem; width: 150px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-color); color: var(--text-main);" value="${emp.name}" onchange="App.updateUserName('${emp.id}', this.value)" />
                    </div>
                </td>
                <td>${empId}</td>
                <td>${emp.email}</td>
                <td>
                    <select class="role-select-input" onchange="App.updateUserDepartment('${emp.id}', this.value)">
                        <option value="Engineering" ${emp.department === 'Engineering' ? 'selected' : ''}>Engineering</option>
                        <option value="Sales" ${emp.department === 'Sales' ? 'selected' : ''}>Sales</option>
                        <option value="Marketing" ${emp.department === 'Marketing' ? 'selected' : ''}>Marketing</option>
                        <option value="Finance" ${emp.department === 'Finance' ? 'selected' : ''}>Finance</option>
                        <option value="HR" ${emp.department === 'HR' ? 'selected' : ''}>HR</option>
                        <option value="Operations" ${emp.department === 'Operations' ? 'selected' : ''}>Operations</option>
                        <option value="IT" ${emp.department === 'IT' ? 'selected' : ''}>IT</option>
                        <option value="Executive" ${emp.department === 'Executive' ? 'selected' : ''}>Executive</option>
                    </select>
                </td>
                <td>
                    <span class="role-badge role-${emp.role}">${AuthModule.formatRole(emp.role)}</span>
                </td>
                <td>
                    <select class="role-select-input" onchange="App.updateUserRole('${emp.id}', this.value)">
                        <option value="employee" ${emp.role === 'employee' ? 'selected' : ''}>Employee</option>
                        <option value="dept-manager" ${emp.role === 'dept-manager' ? 'selected' : ''}>Dept. Manager</option>
                        <option value="general-manager" ${emp.role === 'general-manager' ? 'selected' : ''}>General Manager</option>
                        <option value="hr" ${emp.role === 'hr' ? 'selected' : ''}>HR</option>
                        <option value="finance" ${emp.role === 'finance' ? 'selected' : ''}>Finance</option>
                        <option value="admin" ${emp.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-sm btn-outline" style="color: var(--warning-500); border-color: var(--warning-500); padding: 4px 8px; font-size: 11px;" onclick="App.promptResetPassword('${emp.id}')" title="Reset Password">
                            Reset Pass
                        </button>
                        ${emp.role !== 'admin' ? `
                        <button class="btn btn-sm btn-outline" style="color: var(--error-500); border-color: var(--error-500); padding: 4px 8px; font-size: 11px;" onclick="App.promptDeleteUser('${emp.id}')" title="Delete User">
                            Delete
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    // Render Profile
    function renderProfile() {
        const currentUser = AuthModule.getCurrentUser();
        const profile = currentUser.profile || {};

        // Header Info
        document.getElementById('profile-display-name').textContent = currentUser.name;
        document.getElementById('profile-display-position').textContent = profile.position || 'Position not set';
        document.getElementById('profile-display-dept').textContent = currentUser.department + ' Department';

        // Avatar/Picture
        const pictureContainer = document.getElementById('profile-picture-display');
        if (profile.profilePicture) {
            pictureContainer.innerHTML = `<img src="${profile.profilePicture}" alt="${currentUser.name}">`;
        } else {
            pictureContainer.innerHTML = `<div class="profile-avatar-large">${currentUser.avatar}</div>`;
        }

        // Details Content
        const content = document.getElementById('profile-details-content');
        content.innerHTML = `
            <div class="profile-section">
                <h3 class="profile-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Employment Information
                </h3>
                <div class="profile-fields-list">
                    <div class="profile-field">
                        <span class="profile-field-label">Employee Name</span>
                        <span class="profile-field-value">${currentUser.name || '-'}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-field-label">Employee ID</span>
                        <span class="profile-field-value">${profile.employeeId || '-'}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-field-label">Position</span>
                        <span class="profile-field-value">${profile.position || '-'}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-field-label">Annual Leave Balance</span>
                        <span class="profile-field-value highlight">${currentUser.annualLeaveBalance || 0} days</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-field-label">Joining Date</span>
                        <span class="profile-field-value">${profile.joiningDate ? formatDate(profile.joiningDate) : '-'}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-field-label">Email</span>
                        <span class="profile-field-value">${profile.email || currentUser.email || '-'}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-field-label">Mobile Number</span>
                        <span class="profile-field-value">${profile.mobileNumber || '-'}</span>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h3 class="profile-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Identity Information
                </h3>
                <div class="profile-fields-list">
                    <div class="profile-field">
                        <span class="profile-field-label">Nationality</span>
                        <span class="profile-field-value">${profile.nationality || '-'}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-field-label">ID / Iqama No.</span>
                        <span class="profile-field-value">${profile.idIqamaNumber || '-'}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-field-label">Expiry Date</span>
                        <span class="profile-field-value ${isExpiringSoon(profile.idIqamaExpiry) ? 'warning' : ''}">${profile.idIqamaExpiry ? formatDate(profile.idIqamaExpiry) : '-'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup Profile Form
    function setupProfileForm() {
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                populateProfileForm();
                openModal('modal-edit-profile');
            });
        }

        const saveBtn = document.getElementById('btn-save-profile');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveProfileChanges);
        }

        // Profile Picture Upload
        const uploadBtn = document.getElementById('btn-upload-pic');
        const fileInput = document.getElementById('profile-upload-input');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', handleProfilePicChange);
        }

        const removeBtn = document.getElementById('btn-remove-pic');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const preview = document.getElementById('profile-preview-container');
                const currentUser = AuthModule.getCurrentUser();
                preview.innerHTML = `<div class="profile-avatar-large">${currentUser.avatar}</div>`;
                fileInput.value = '';
                // Mark for deletion in data
                preview.dataset.removed = 'true';
            });
        }
    }

    function populateProfileForm() {
        const currentUser = AuthModule.getCurrentUser();
        const profile = currentUser.profile || {};

        document.getElementById('prof-name').value = currentUser.name || '';
        document.getElementById('prof-emp-id').value = profile.employeeId || '';
        document.getElementById('prof-nationality').value = profile.nationality || '';
        document.getElementById('prof-email').value = profile.email || currentUser.email || '';
        document.getElementById('prof-mobile').value = profile.mobileNumber || '';
        document.getElementById('prof-position').value = profile.position || '';
        document.getElementById('prof-id-iqama').value = profile.idIqamaNumber || '';
        document.getElementById('prof-id-expiry').value = profile.idIqamaExpiry || '';
        document.getElementById('prof-joining-date').value = profile.joiningDate || '';

        // Preview
        const preview = document.getElementById('profile-preview-container');
        if (profile.profilePicture) {
            preview.innerHTML = `<img src="${profile.profilePicture}" alt="Preview">`;
        } else {
            preview.innerHTML = `<div class="profile-avatar-large">${currentUser.avatar}</div>`;
        }
        preview.dataset.removed = 'false';
    }

    function handleProfilePicChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('Image size must be less than 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const preview = document.getElementById('profile-preview-container');
            preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            preview.dataset.src = event.target.result;
            preview.dataset.removed = 'false';
        };
        reader.readAsDataURL(file);
    }

    function saveProfileChanges() {
        const form = document.getElementById('form-edit-profile');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const preview = document.getElementById('profile-preview-container');
        const currentUser = AuthModule.getCurrentUser();

        const profileData = {
            name: document.getElementById('prof-name').value,
            employeeId: document.getElementById('prof-emp-id').value,
            nationality: document.getElementById('prof-nationality').value,
            email: document.getElementById('prof-email').value,
            mobileNumber: document.getElementById('prof-mobile').value,
            position: document.getElementById('prof-position').value,
            idIqamaNumber: document.getElementById('prof-id-iqama').value,
            idIqamaExpiry: document.getElementById('prof-id-expiry').value,
            joiningDate: document.getElementById('prof-joining-date').value
        };

        const passwordField = document.getElementById('prof-password');
        if (passwordField && passwordField.value && passwordField.value.trim().length > 0) {
            profileData.password = passwordField.value.trim();
        }

        // Handle picture
        if (preview.dataset.removed === 'true') {
            profileData.profilePicture = null;
        } else if (preview.dataset.src) {
            profileData.profilePicture = preview.dataset.src;
        }

        DataModule.updateEmployeeProfile(currentUser.id, profileData);
        closeModal('modal-edit-profile');
        renderProfile();
        showToast('Profile updated successfully', 'success');

        // Update sidebar info too
        const sidebarAvatar = document.querySelector('.user-avatar');
        if (sidebarAvatar) {
            if (profileData.profilePicture) {
                sidebarAvatar.innerHTML = `<img src="${profileData.profilePicture}" style="width:100%; height:100%; border-radius:inherit; object-fit:cover;">`;
            } else {
                sidebarAvatar.textContent = currentUser.avatar;
            }
        }
    }

    // Date Helper
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function isExpiringSoon(dateStr) {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays < 30; // Within 30 days
    }

    // Update User Role
    function updateUserRole(userId, newRole) {
        const employees = DataModule.getEmployees();
        const employee = employees.find(e => e.id === userId);

        if (employee) {
            employee.role = newRole;
            localStorage.setItem('hr_employees', JSON.stringify(employees));

            // If updating self, update current user session
            const currentUser = AuthModule.getCurrentUser();
            if (currentUser.id === userId) {
                localStorage.setItem('hr_current_user', JSON.stringify(employee));
                // Reload page to apply full changes safely
                window.location.reload();
            } else {
                renderUserManagement();
                showToast(`Role updated for ${employee.name}`, 'success');
            }
        }
    }

    // Update User Department
    function updateUserDepartment(userId, newDept) {
        const employees = DataModule.getEmployees();
        const employee = employees.find(e => e.id === userId);

        if (employee) {
            employee.department = newDept;
            localStorage.setItem('hr_employees', JSON.stringify(employees));

            const currentUser = AuthModule.getCurrentUser();
            if (currentUser.id === userId) {
                localStorage.setItem('hr_current_user', JSON.stringify(employee));
            }
            renderUserManagement();
            showToast(`Department updated for ${employee.name}`, 'success');
        }
    }

    // Update User Name
    function updateUserName(userId, newName) {
        const employees = DataModule.getEmployees();
        const employee = employees.find(e => e.id === userId);

        if (employee && newName.trim()) {
            employee.name = newName.trim();
            localStorage.setItem('hr_employees', JSON.stringify(employees));

            const currentUser = AuthModule.getCurrentUser();
            if (currentUser.id === userId) {
                localStorage.setItem('hr_current_user', JSON.stringify(employee));
            }
            renderUserManagement();
            showToast(`Name updated successfully`, 'success');
        }
    }

    // Admin Approval Functions
    function approveRegistration(userId) {
        if (DataModule.approveUser(userId)) {
            renderUserManagement();
            showToast('Registration approved successfully.', 'success');
        }
    }

    function rejectRegistration(userId) {
        if (confirm('Are you sure you want to reject and delete this registration?')) {
            DataModule.rejectUser(userId);
            renderUserManagement();
            showToast('Registration rejected.', 'info');
        }
    }

    function promptResetPassword(userId) {
        const newPassword = prompt("Enter the new password for this user:");
        if (newPassword && newPassword.trim().length > 0) {
            try {
                DataModule.updateUserAuth(userId, { password: newPassword.trim() });
                showToast('Password reset successfully.', 'success');
            } catch (err) {
                showToast('Error resetting password: ' + err.message, 'error');
            }
        }
    }

    function promptDeleteUser(userId) {
        if (confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            DataModule.deleteEmployee(userId);
            renderUserManagement();
            showToast('User deleted successfully.', 'info');
        }
    }

    // ============================================
    // ANALYTICS VIEW
    // ============================================

    async function renderAnalytics() {
        // Initialize analytics module if not already done
        if (typeof AnalyticsModule !== 'undefined') {
            await AnalyticsModule.init();
            await AnalyticsModule.renderAllCharts();
            await AnalyticsModule.renderTeamAvailability();
        } else {
            console.error('Analytics module not loaded');
        }
    }

    // Utility: Debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Expose public methods
    return {
        init,
        switchView,
        refreshCurrentView,
        renderDashboard,
        renderMyRequests,
        renderPendingApprovals,
        renderAllRequests,
        renderProfile,
        renderAnalytics,
        openModal,
        closeModal,
        openRequestForm,
        viewRequest,
        rejectRequest,
        approveRequest,
        editRequest,
        cancelRequest,
        updateUserRole,
        updateUserDepartment,
        updateUserName,
        approveRegistration,
        rejectRegistration,
        promptResetPassword,
        promptDeleteUser,
        showToast,
        navigateTo: switchView // Alias for HTML compatibility
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
