/* ================================
   API Service Layer
   Centralized data operations with async/await pattern
   Ready for backend integration (Supabase/Firebase)
   ================================ */

const APIService = (function () {
    // Configuration
    const CONFIG = {
        USE_MOCK_DELAY: true, // Simulate network latency
        MOCK_DELAY_MS: 300,
        STORAGE_KEYS: {
            REQUESTS: 'hr_requests',
            CURRENT_USER: 'hr_current_user',
            EMPLOYEES: 'hr_employees',
            NOTIFICATIONS: 'hr_notifications'
        }
    };

    // Simulate network delay for realistic UX
    function simulateDelay() {
        if (!CONFIG.USE_MOCK_DELAY) return Promise.resolve();
        return new Promise(resolve => setTimeout(resolve, CONFIG.MOCK_DELAY_MS));
    }

    // ============================================
    // EMPLOYEE OPERATIONS
    // ============================================

    async function getEmployees() {
        await simulateDelay();
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.EMPLOYEES);
        return JSON.parse(data || '[]');
    }

    async function getEmployee(id) {
        await simulateDelay();
        const employees = await getEmployees();
        return employees.find(e => e.id === id) || null;
    }

    async function getCurrentUser() {
        await simulateDelay();
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
        return JSON.parse(data);
    }

    async function updateEmployeeProfile(employeeId, profileData) {
        await simulateDelay();
        const employees = await getEmployees();
        const index = employees.findIndex(e => e.id === employeeId);

        if (index >= 0) {
            employees[index].profile = {
                ...(employees[index].profile || {}),
                ...profileData
            };

            if (profileData.name) employees[index].name = profileData.name;

            localStorage.setItem(CONFIG.STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));

            // Update current user if it's the same person
            const currentUser = await getCurrentUser();
            if (currentUser && currentUser.id === employeeId) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(employees[index]));
            }

            return employees[index];
        }
        throw new Error('Employee not found');
    }

    async function setCurrentUserByRole(role) {
        await simulateDelay();
        const employees = await getEmployees();
        const user = employees.find(e => e.role === role);
        if (user) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            return user;
        }
        throw new Error('User with role not found');
    }

    // ============================================
    // REQUEST OPERATIONS
    // ============================================

    async function getRequests() {
        await simulateDelay();
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.REQUESTS);
        return JSON.parse(data || '[]');
    }

    async function getRequest(id) {
        await simulateDelay();
        const requests = await getRequests();
        return requests.find(r => r.id === id) || null;
    }

    async function saveRequest(request) {
        await simulateDelay();
        const requests = await getRequests();
        const existingIndex = requests.findIndex(r => r.id === request.id);

        if (existingIndex >= 0) {
            requests[existingIndex] = request;
        } else {
            requests.push(request);
        }

        localStorage.setItem(CONFIG.STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

        // Trigger notification
        await createNotification({
            type: 'request_created',
            requestId: request.id,
            userId: request.employeeId,
            message: `New ${request.type} request submitted`
        });

        return request;
    }

    async function deleteRequest(id) {
        await simulateDelay();
        const requests = await getRequests();
        const filtered = requests.filter(r => r.id !== id);
        localStorage.setItem(CONFIG.STORAGE_KEYS.REQUESTS, JSON.stringify(filtered));
    }

    async function updateRequestStatus(requestId, status, comment, actorName) {
        await simulateDelay();
        const request = await getRequest(requestId);
        if (!request) throw new Error('Request not found');

        request.status = status;

        // Update workflow
        if (request.workflow) {
            const currentStep = request.workflow.find(s => s.status === 'pending');
            if (currentStep) {
                currentStep.status = status === 'approved' || status.includes('pending') ? 'approved' : 'rejected';
                currentStep.actor = actorName;
                currentStep.date = new Date().toISOString();
                currentStep.comment = comment;
            }
        }

        await saveRequest(request);

        // Create notification
        await createNotification({
            type: status === 'approved' ? 'request_approved' : 'request_rejected',
            requestId: request.id,
            userId: request.employeeId,
            message: `Your ${request.type} request has been ${status}`
        });

        return request;
    }

    // ============================================
    // NOTIFICATION OPERATIONS
    // ============================================

    async function getNotifications(userId) {
        await simulateDelay();
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS);
        const allNotifications = JSON.parse(data || '[]');
        return userId ? allNotifications.filter(n => n.userId === userId) : allNotifications;
    }

    async function createNotification(notification) {
        const notifications = await getNotifications();
        const newNotification = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        notifications.push(newNotification);
        localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        return newNotification;
    }

    async function markNotificationAsRead(notificationId) {
        await simulateDelay();
        const notifications = await getNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        }
    }

    // ============================================
    // ANALYTICS OPERATIONS
    // ============================================

    async function getLeaveAnalytics(startDate, endDate) {
        await simulateDelay();
        const requests = await getRequests();
        const employees = await getEmployees();

        // Filter by date range if provided
        let filteredRequests = requests;
        if (startDate && endDate) {
            filteredRequests = requests.filter(r => {
                const createdDate = new Date(r.createdAt);
                return createdDate >= new Date(startDate) && createdDate <= new Date(endDate);
            });
        }

        // Monthly trends
        const monthlyData = {};
        filteredRequests.forEach(req => {
            const month = new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        // Leave type distribution
        const typeDistribution = {};
        filteredRequests.forEach(req => {
            typeDistribution[req.type] = (typeDistribution[req.type] || 0) + 1;
        });

        // Department comparison
        const departmentData = {};
        filteredRequests.forEach(req => {
            departmentData[req.department] = (departmentData[req.department] || 0) + 1;
        });

        // Status breakdown
        const statusData = {};
        filteredRequests.forEach(req => {
            statusData[req.status] = (statusData[req.status] || 0) + 1;
        });

        return {
            monthlyTrends: monthlyData,
            typeDistribution,
            departmentComparison: departmentData,
            statusBreakdown: statusData,
            totalRequests: filteredRequests.length,
            totalEmployees: employees.length
        };
    }

    async function getTeamAvailability(departmentFilter = null) {
        await simulateDelay();
        const requests = await getRequests();
        const employees = await getEmployees();

        const today = new Date();
        const activeLeaves = requests.filter(r => {
            if (r.status !== 'approved') return false;
            if (!r.data.startDate || !r.data.joiningDate) return false;

            const start = new Date(r.data.startDate);
            const end = new Date(r.data.joiningDate);
            return start <= today && end >= today;
        });

        const availability = employees.map(emp => {
            const onLeave = activeLeaves.find(l => l.employeeId === emp.id);
            return {
                id: emp.id,
                name: emp.name,
                department: emp.department,
                status: onLeave ? 'on-leave' : 'available',
                leaveType: onLeave ? onLeave.type : null,
                returnDate: onLeave ? onLeave.data.joiningDate : null
            };
        });

        return departmentFilter
            ? availability.filter(a => a.department === departmentFilter)
            : availability;
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    function generateId() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    async function clearAll() {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        location.reload();
    }

    // ============================================
    // PUBLIC API
    // ============================================

    return {
        // Employee operations
        getEmployees,
        getEmployee,
        getCurrentUser,
        updateEmployeeProfile,
        setCurrentUserByRole,

        // Request operations
        getRequests,
        getRequest,
        saveRequest,
        deleteRequest,
        updateRequestStatus,

        // Notification operations
        getNotifications,
        createNotification,
        markNotificationAsRead,

        // Analytics operations
        getLeaveAnalytics,
        getTeamAvailability,

        // Utilities
        generateId,
        clearAll,

        // Config
        setMockDelay: (enabled) => { CONFIG.USE_MOCK_DELAY = enabled; }
    };
})();
