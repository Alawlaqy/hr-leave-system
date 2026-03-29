/* ================================
   Data Module - Mock Data & Storage
   ================================ */

const DataModule = (function () {
    // Storage keys
    const STORAGE_KEYS = {
        REQUESTS: 'hr_requests',
        CURRENT_USER: 'hr_current_user',
        EMPLOYEES: 'hr_employees'
    };

    // Sample employees (Base demo users + Generated)
    const baseEmployees = [
        {
            id: 'emp-001', name: 'John Doe', email: 'john.doe@company.com', department: 'Engineering', role: 'employee', avatar: 'JD', annualLeaveBalance: 21,
            profile: {
                employeeId: 'EMP-2024-001',
                idIqamaNumber: '1234567890',
                idIqamaExpiry: '2026-12-31',
                joiningDate: '2020-01-15',
                position: 'Senior Software Engineer',
                mobileNumber: '+966501234567',
                nationality: 'Saudi Arabia',
                emergencyContactName: 'Jane Doe',
                emergencyContactNumber: '+966509876543',
                contractType: 'permanent',
                country: 'Saudi Arabia',
                profilePicture: null
            }
        },
        {
            id: 'emp-002', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', department: 'Engineering', role: 'employee', avatar: 'SW', annualLeaveBalance: 18,
            profile: {
                employeeId: 'EMP-2024-002',
                idIqamaNumber: '1098765432',
                idIqamaExpiry: '2025-10-15',
                joiningDate: '2021-03-10',
                position: 'UI/UX Designer',
                mobileNumber: '+966507654321',
                nationality: 'Lebanon',
                emergencyContactName: 'David Wilson',
                emergencyContactNumber: '+966501122334',
                contractType: 'permanent',
                country: 'Saudi Arabia',
                profilePicture: null
            }
        },
        {
            id: 'mgr-001', name: 'Michael Chen', email: 'michael.chen@company.com', department: 'Engineering', role: 'dept-manager', avatar: 'MC', annualLeaveBalance: 25,
            profile: {
                employeeId: 'MGR-2024-001',
                idIqamaNumber: '1122334455',
                idIqamaExpiry: '2027-05-20',
                joiningDate: '2019-06-01',
                position: 'Engineering Manager',
                mobileNumber: '+966505556667',
                nationality: 'Chinese',
                emergencyContactName: 'Li Chen',
                emergencyContactNumber: '+966503332221',
                contractType: 'permanent',
                country: 'Saudi Arabia',
                profilePicture: null
            }
        },
        { id: 'gm-001', name: 'Emily Roberts', email: 'emily.roberts@company.com', department: 'Executive', role: 'general-manager', avatar: 'ER', annualLeaveBalance: 30 },
        { id: 'hr-001', name: 'Sarah Connor', email: 'sarah.connor@company.com', department: 'HR', role: 'hr', avatar: 'SC', annualLeaveBalance: 25 },
        { id: 'fin-001', name: 'James Bond', email: 'james.bond@company.com', department: 'Finance', role: 'finance', avatar: 'JB', annualLeaveBalance: 25 },
        {
            id: 'adm-001', name: 'Admin User', email: 'admin@company.com', department: 'IT', role: 'admin', avatar: 'AD', annualLeaveBalance: 30,
            profile: {
                employeeId: 'ADM-001',
                idIqamaNumber: '9999999999',
                idIqamaExpiry: '2030-12-31',
                joiningDate: '2018-01-01',
                position: 'System Administrator',
                mobileNumber: '+966500000000',
                nationality: 'Saudi Arabia',
                emergencyContactName: 'Admin Support',
                emergencyContactNumber: '+966500000000',
                contractType: 'permanent',
                country: 'Saudi Arabia',
                profilePicture: null
            }
        }
    ];

    // Helper to generate more users
    function generateMockUsers() {
        const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'IT'];
        const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris'];

        const generated = [...baseEmployees];
        let idCounter = 100;

        // Ensure we have ~50 users
        const targetCount = 50;

        // Add specific role counts
        const rolesToAdd = [
            { role: 'dept-manager', count: 4, dept: 'Sales' }, // We already have Engeering mgr
            { role: 'general-manager', count: 1, dept: 'Executive' }, // Second GM
            { role: 'hr', count: 2, dept: 'HR' },
            { role: 'finance', count: 2, dept: 'Finance' },
            { role: 'admin', count: 1, dept: 'IT' }
        ];

        // Add specific roles
        rolesToAdd.forEach(cfg => {
            for (let i = 0; i < cfg.count; i++) {
                const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
                const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
                const dept = cfg.dept === 'Sales' ? departments[i % departments.length] : cfg.dept; // Distribute managers

                generated.push({
                    id: `gen-${idCounter++}`,
                    name: `${fn} ${ln}`,
                    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@company.com`,
                    department: dept,
                    role: cfg.role,
                    avatar: `${fn[0]}${ln[0]}`,
                    annualLeaveBalance: 25 + Math.floor(Math.random() * 10)
                });
            }
        });

        // Fill rest with employees
        while (generated.length < targetCount) {
            const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
            const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
            const dept = departments[Math.floor(Math.random() * departments.length)];

            generated.push({
                id: `gen-${idCounter++}`,
                name: `${fn} ${ln}`,
                email: `${fn.toLowerCase()}.${ln.toLowerCase()}@company.com`,
                department: dept,
                role: 'employee',
                avatar: `${fn[0]}${ln[0]}`,
                annualLeaveBalance: 15 + Math.floor(Math.random() * 15)
            });
        }

        return generated;
    }

    const defaultEmployees = generateMockUsers().map(e => ({...e, password: '123456', accountStatus: 'approved'}));

    // Sample requests for demo
    const defaultRequests = [
        {
            id: 'req-001',
            type: 'vacation',
            subType: 'annual',
            employeeId: 'emp-001',
            employeeName: 'John Doe',
            department: 'Engineering',
            status: 'approved',
            createdAt: '2024-12-15T10:00:00',
            data: {
                vacationType: 'annual',
                travelDate: '2024-12-20',
                startDate: '2024-12-22',
                joiningDate: '2024-12-30',
                days: 7,
                ticketEncashment: true,
                exitReentry: true,
                notes: 'Family vacation to Dubai'
            },
            workflow: [
                { step: 'submitted', actor: 'John Doe', date: '2024-12-15T10:00:00', status: 'completed' },
                { step: 'dept-approval', actor: 'Michael Chen', date: '2024-12-15T14:30:00', status: 'approved', comment: 'Approved. Enjoy your vacation!' },
                { step: 'gm-approval', actor: 'Emily Roberts', date: '2024-12-16T09:00:00', status: 'approved', comment: 'Final approval granted.' }
            ]
        },
        {
            id: 'req-002',
            type: 'absence',
            subType: 'excuse',
            employeeId: 'emp-002',
            employeeName: 'Sarah Wilson',
            department: 'Engineering',
            status: 'pending-gm',
            createdAt: '2024-12-27T08:30:00',
            data: {
                absenceType: 'excuse',
                dateType: 'single',
                absenceDate: '2024-12-26',
                reason: 'Doctor appointment - annual checkup',
                attachment: null
            },
            workflow: [
                { step: 'submitted', actor: 'Sarah Wilson', date: '2024-12-27T08:30:00', status: 'completed' },
                { step: 'dept-approval', actor: 'Michael Chen', date: '2024-12-27T10:00:00', status: 'approved', comment: 'Approved' },
                { step: 'gm-approval', actor: null, date: null, status: 'pending' }
            ]
        },
        {
            id: 'req-003',
            type: 'late',
            employeeId: 'emp-001',
            employeeName: 'John Doe',
            department: 'Engineering',
            status: 'pending-dept',
            createdAt: '2024-12-28T09:30:00',
            data: {
                lateDate: '2024-12-28',
                arrivalTime: '09:30',
                reason: 'Traffic accident on main highway caused major delays',
                attachment: null
            },
            workflow: [
                { step: 'submitted', actor: 'John Doe', date: '2024-12-28T09:30:00', status: 'completed' },
                { step: 'dept-approval', actor: null, date: null, status: 'pending' },
                { step: 'gm-approval', actor: null, date: null, status: 'pending' }
            ]
        }
    ];

    // Initialize data
    function init() {
        // Ensure employees exist and merge new mock data
        let storedEmployees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');

        // If empty or missing, just set defaults
        if (storedEmployees.length === 0) {
            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(defaultEmployees));
        } else {
            // Check for missing mock users and add them
            let hasChanges = false;
            defaultEmployees.forEach(defaultEmp => {
                const exists = storedEmployees.find(e => e.id === defaultEmp.id);
                if (!exists) {
                    storedEmployees.push(defaultEmp);
                    hasChanges = true;
                } else {
                    // Update role if changed
                    if (exists.role !== defaultEmp.role) {
                        exists.role = defaultEmp.role;
                        hasChanges = true;
                    }
                    // Update profile if missing or incomplete (specifically for Admin)
                    if (defaultEmp.profile && (!exists.profile || !exists.profile.employeeId)) {
                        exists.profile = { ...defaultEmp.profile, ...(exists.profile || {}) };
                        hasChanges = true;
                    }
                }
            });

            // Ensure existing users get the new auth fields
            storedEmployees.forEach(emp => {
                if (!emp.password) {
                    emp.password = '123456';
                    emp.accountStatus = 'approved';
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(storedEmployees));
            }
        }

        if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
            localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(defaultRequests));
        }

        // No auto-login in production
    }

    // Get all employees
    function getEmployees() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    }

    // Get employee by ID
    function getEmployee(id) {
        const employees = getEmployees();
        return employees.find(e => e.id === id);
    }

    // Get current user
    function getCurrentUser() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    }

    // Set current user by role
    function setCurrentUserByRole(role) {
        const employees = getEmployees();
        const user = employees.find(e => e.role === role);
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
        return user;
    }

    // Get all requests
    function getRequests() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
    }

    // Get request by ID
    function getRequest(id) {
        const requests = getRequests();
        return requests.find(r => r.id === id);
    }

    // Save request
    function saveRequest(request) {
        const requests = getRequests();
        const existingIndex = requests.findIndex(r => r.id === request.id);

        if (existingIndex >= 0) {
            requests[existingIndex] = request;
        } else {
            requests.push(request);
        }

        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
        return request;
    }

    // Delete request
    function deleteRequest(id) {
        const requests = getRequests();
        const filtered = requests.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(filtered));
    }

    // Update employee profile
    function updateEmployeeProfile(employeeId, profileData) {
        const employees = getEmployees();
        const index = employees.findIndex(e => e.id === employeeId);

        if (index >= 0) {
            employees[index].profile = {
                ...(employees[index].profile || {}),
                ...profileData
            };

            // Update name/email if they are in the profile
            if (profileData.name) employees[index].name = profileData.name;
            if (profileData.email) employees[index].email = profileData.email;
            
            // Also map password if it somehow comes through here
            if (profileData.password) employees[index].password = profileData.password;

            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));

            // Also update current user if it's the same person
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === employeeId) {
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(employees[index]));
            }

            return employees[index];
        }
        return null;
    }

    // Update user auth specifically
    function updateUserAuth(employeeId, authData) {
        const employees = getEmployees();
        const index = employees.findIndex(e => e.id === employeeId);
        
        if (index >= 0) {
            // If changing email, check for duplicates
            if (authData.email && authData.email !== employees[index].email) {
                if (employees.find(e => e.email === authData.email)) {
                    throw new Error('Email already registered by another user.');
                }
                employees[index].email = authData.email;
            }
            if (authData.password) {
                employees[index].password = authData.password;
            }
            
            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
            
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === employeeId) {
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(employees[index]));
            }
            return employees[index];
        }
        return null;
    }

    // Generate unique ID
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Register new user
    function registerUser(userData) {
        const employees = getEmployees();
        if (employees.find(e => e.email === userData.email)) {
            throw new Error('Email already registered');
        }
        
        const initials = userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        const newUser = {
            id: generateId(),
            name: userData.name,
            email: userData.email,
            department: userData.department,
            role: 'employee',
            avatar: initials,
            annualLeaveBalance: 21,
            password: userData.password,
            accountStatus: 'pending'
        };
        
        employees.push(newUser);
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
        return newUser;
    }

    // Approve user
    function approveUser(id) {
        const employees = getEmployees();
        const user = employees.find(e => e.id === id);
        if (user) {
            user.accountStatus = 'approved';
            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
            return true;
        }
        return false;
    }

    // Reject/Delete user
    function rejectUser(id) {
        const employees = getEmployees();
        const filtered = employees.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered));
        return true;
    }

    // Delete active employee
    function deleteEmployee(userId) {
        const employees = getEmployees();
        const filtered = employees.filter(e => e.id !== userId);
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered));
        return true;
    }
    
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Clear all data (for reset)
    function clearAll() {
        localStorage.removeItem(STORAGE_KEYS.REQUESTS);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
        location.reload();
    }

    return {
        init,
        getEmployees,
        getEmployee,
        getCurrentUser,
        setCurrentUserByRole,
        getRequests,
        getRequest,
        saveRequest,
        deleteRequest,
        updateEmployeeProfile,
        updateUserAuth,
        registerUser,
        approveUser,
        rejectUser,
        deleteEmployee,
        generateId,
        clearAll
    };
})();
