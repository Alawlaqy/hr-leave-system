/* ================================
   Auth Module - User & Role Management
   ================================ */

const AuthModule = (function () {
    let currentUser = null;
    let onRoleChangeCallback = null;

    // Permissions by role
    const permissions = {
        'employee': {
            canSubmitRequests: true,
            canEditOwnDraft: true,
            canCancelOwnPending: true,
            canViewOwnRequests: true,
            canApproveDeptRequests: false,
            canApproveAllRequests: false,
            canViewDeptRequests: false,
            canViewAllRequests: false
        },
        'dept-manager': {
            canSubmitRequests: true,
            canEditOwnDraft: true,
            canCancelOwnPending: true,
            canViewOwnRequests: true,
            canApproveDeptRequests: true,
            canApproveAllRequests: false,
            canViewDeptRequests: true,
            canViewAllRequests: false
        },
        'general-manager': {
            canSubmitRequests: true,
            canEditOwnDraft: true,
            canCancelOwnPending: true,
            canViewOwnRequests: true,
            canApproveDeptRequests: true,
            canApproveAllRequests: true,
            canViewDeptRequests: true,
            canViewAllRequests: true
        },
        'hr': {
            canSubmitRequests: true,
            canEditOwnDraft: true,
            canCancelOwnPending: true,
            canViewOwnRequests: true,
            canApproveDeptRequests: false,
            canApproveAllRequests: true, // Specific to HR step
            canViewDeptRequests: false,
            canViewAllRequests: true
        },
        'finance': {
            canSubmitRequests: true,
            canEditOwnDraft: true,
            canCancelOwnPending: true,
            canViewOwnRequests: true,
            canApproveDeptRequests: false,
            canApproveAllRequests: true, // Specific to Finance step
            canViewDeptRequests: false,
            canViewAllRequests: true
        },
        'admin': {
            canSubmitRequests: true,
            canEditOwnDraft: true,
            canCancelOwnPending: true,
            canViewOwnRequests: true,
            canApproveDeptRequests: false,
            canApproveAllRequests: false,
            canViewDeptRequests: false,
            canViewAllRequests: true,
            canManageUsers: true
        }
    };

    // Initialize
    function init() {
        console.log('AuthModule initializing...');
        currentUser = DataModule.getCurrentUser();
        if (currentUser) {
            updateUIForRole();
        }
        console.log('AuthModule initialized. Current User:', currentUser);
    }

    // Get current user
    function getCurrentUser() {
        return currentUser;
    }

    // Get current role
    function getCurrentRole() {
        return currentUser ? currentUser.role : 'employee';
    }

    // Check permission
    function hasPermission(permission) {
        const role = getCurrentRole();
        return permissions[role] && permissions[role][permission];
    }

    // Login handling
    function login(email, password) {
        const employees = DataModule.getEmployees();
        const user = employees.find(e => e.email === email && e.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        if (user.accountStatus !== 'approved') {
            throw new Error('Account pending approval by Admin');
        }
        
        currentUser = user;
        localStorage.setItem('hr_current_user', JSON.stringify(currentUser));
        updateUIForRole();
        
        if (onRoleChangeCallback) {
            onRoleChangeCallback(currentUser);
        }
        return currentUser;
    }

    // Logout handling
    function logout() {
        localStorage.removeItem('hr_current_user');
        currentUser = null;
        window.location.reload();
    }

    // Set role change callback
    function onRoleChange(callback) {
        onRoleChangeCallback = callback;
    }

    // Update UI based on role
    function updateUIForRole() {
        if (!currentUser) return;

        // Update body class
        document.body.classList.remove('role-employee', 'role-dept-manager', 'role-general-manager');
        document.body.classList.add('role-' + currentUser.role);

        // Update user info in sidebar
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');
        const userAvatarEl = document.getElementById('user-avatar');
        const roleSelectEl = document.getElementById('role-select');

        if (userNameEl) userNameEl.textContent = currentUser.name;
        if (userRoleEl) userRoleEl.textContent = formatRole(currentUser.role);
        if (userAvatarEl) userAvatarEl.textContent = currentUser.avatar;
        if (roleSelectEl) roleSelectEl.value = currentUser.role;
    }

    // Format role for display
    function formatRole(role) {
        const roleNames = {
            'employee': 'Employee',
            'dept-manager': 'Dept. Manager',
            'general-manager': 'General Manager',
            'hr': 'HR Specialist',
            'finance': 'Finance Officer',
            'admin': 'System Admin'
        };
        return roleNames[role] || role;
    }

    // (Role switch removed)

    // Check if user can approve a specific request
    function canApproveRequest(request) {
        if (!currentUser) return false;

        // Can't approve own requests
        if (request.employeeId === currentUser.id) return false;

        const role = getCurrentRole();

        // Dept Manager can approve pending-dept requests (not their own)
        if (role === 'dept-manager' && request.status === 'pending-dept') {
            return request.department === currentUser.department;
        }

        // General Manager can approve pending-gm requests
        // Also handles dept manager's own requests (which go directly to GM)
        if (role === 'general-manager' &&
            (request.status === 'pending-gm' || request.status === 'pending-dept')) {
            return true;
        }

        // HR can approve pending-hr requests
        if (role === 'hr' && request.status === 'pending-hr') {
            return true;
        }

        // Finance can approve pending-finance requests
        if (role === 'finance' && request.status === 'pending-finance') {
            return true;
        }

        return false;
    }

    // Check if user can edit a request
    function canEditRequest(request) {
        if (!currentUser) return false;

        // Only own requests
        if (request.employeeId !== currentUser.id) return false;

        // Only drafts can be edited
        return request.status === 'draft';
    }

    // Check if user can cancel a request
    function canCancelRequest(request) {
        if (!currentUser) return false;

        // Only own requests
        if (request.employeeId !== currentUser.id) return false;

        // Can cancel drafts or pending requests
        return ['draft', 'pending-dept', 'pending-gm'].includes(request.status);
    }

    return {
        init,
        getCurrentUser,
        getCurrentRole,
        hasPermission,
        login,
        logout,
        onRoleChange,
        formatRole,
        canApproveRequest,
        canEditRequest,
        canCancelRequest
    };
})();
