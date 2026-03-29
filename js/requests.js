/* ================================
   Requests Module - Request Management
   ================================ */

const RequestsModule = (function () {

    // Request type configurations
    const requestTypes = {
        'vacation': {
            name: 'Vacation',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
            subTypes: {
                'annual': 'Annual Vacation',
                'lwop': 'LWOP (Leave Without Payment)',
                'family': 'Family Vacation'
            }
        },
        'absence': {
            name: 'Absence',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
            subTypes: {
                'regular': 'Regular Absence',
                'excuse': 'Absence with Excuse (Sick Leave)'
            }
        },
        'late': {
            name: 'Late Arrival',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
            subTypes: null
        },
        'business-trip': {
            name: 'Business Trip',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
            subTypes: null
        }
    };

    // Create new request
    function createRequest(type, data, saveAsDraft = false) {
        const currentUser = AuthModule.getCurrentUser();

        const request = {
            id: DataModule.generateId(),
            type: type,
            subType: data.vacationType || data.absenceType || null,
            employeeId: currentUser.id,
            employeeName: currentUser.name,
            department: currentUser.department,
            status: saveAsDraft ? 'draft' : 'pending-dept',
            createdAt: new Date().toISOString(),
            data: data,
            workflow: saveAsDraft ? [] : WorkflowModule.createInitialWorkflow(currentUser.name, type, data)
        };

        // Handle dept manager submitting own request
        if (!saveAsDraft && currentUser.role === 'dept-manager') {
            request.status = 'pending-gm';
            request.workflow = WorkflowModule.createManagerWorkflow(currentUser.name, type, data);
        }

        return DataModule.saveRequest(request);
    }

    // Update existing request
    function updateRequest(id, data) {
        const request = DataModule.getRequest(id);
        if (!request) return null;

        request.data = { ...request.data, ...data };
        request.subType = data.vacationType || data.absenceType || request.subType;

        return DataModule.saveRequest(request);
    }

    // Get user's requests
    function getMyRequests(filters = {}) {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) return [];

        let requests = DataModule.getRequests().filter(r => r.employeeId === currentUser.id);

        // Apply filters
        if (filters.type) {
            requests = requests.filter(r => r.type === filters.type);
        }
        if (filters.status) {
            requests = requests.filter(r => r.status === filters.status);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            requests = requests.filter(r =>
                r.type.toLowerCase().includes(search) ||
                (r.subType && r.subType.toLowerCase().includes(search)) ||
                JSON.stringify(r.data).toLowerCase().includes(search)
            );
        }

        // Sort by date, newest first
        return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Get all requests (for GM)
    function getAllRequests(filters = {}) {
        let requests = DataModule.getRequests();

        // Apply filters
        if (filters.type) {
            requests = requests.filter(r => r.type === filters.type);
        }
        if (filters.status) {
            requests = requests.filter(r => r.status === filters.status);
        }
        if (filters.employeeId) {
            requests = requests.filter(r => r.employeeId === filters.employeeId);
        }

        // Sort by date, newest first
        return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Get request type info
    function getTypeInfo(type) {
        return requestTypes[type] || { name: type, icon: '', subTypes: null };
    }

    // Get subtype name
    function getSubTypeName(type, subType) {
        const typeInfo = requestTypes[type];
        if (typeInfo && typeInfo.subTypes && subType) {
            return typeInfo.subTypes[subType] || subType;
        }
        return '';
    }

    // Render request card HTML
    function renderRequestCard(request, showEmployee = false) {
        try {
            const typeInfo = getTypeInfo(request.type);
            const subTypeName = getSubTypeName(request.type, request.subType);
            const canEdit = AuthModule.canEditRequest(request);
            const canCancel = AuthModule.canCancelRequest(request);
            const canApprove = AuthModule.canApproveRequest(request);

            let detailsHtml = '';

            // Type-specific details + Notes/Reason
            switch (request.type) {
                case 'vacation':
                    detailsHtml = `
                    <span class="detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${formatDateShort(request.data.startDate)} - ${formatDateShort(request.data.joiningDate)}
                    </span>
                    <span class="detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${request.data.days || '?'} days
                    </span>
                `;
                    break;
                case 'absence':
                    const dateText = request.data.dateType === 'range'
                        ? `${formatDateShort(request.data.startDate)} - ${formatDateShort(request.data.endDate)}`
                        : formatDateShort(request.data.absenceDate);
                    detailsHtml = `
                    <span class="detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${dateText}
                    </span>
                    ${request.data.reason ? `
                    <span class="detail full-width" style="margin-top: 5px; color: var(--text-tertiary);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
                        ${request.data.reason.length > 50 ? request.data.reason.substring(0, 50) + '...' : request.data.reason}
                    </span>
                    ` : ''}
                `;
                    break;
                case 'late':
                    detailsHtml = `
                    <span class="detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${formatDateShort(request.data.lateDate)}
                    </span>
                    <span class="detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Arrived ${request.data.arrivalTime}
                    </span>
                    ${request.data.reason ? `
                    <span class="detail full-width" style="margin-top: 5px; color: var(--text-tertiary);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
                        ${request.data.reason.length > 50 ? request.data.reason.substring(0, 50) + '...' : request.data.reason}
                    </span>
                    ` : ''}
                `;
                    break;
                case 'business-trip':
                    detailsHtml = `
                    <span class="detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${request.data.destination}
                    </span>
                    <span class="detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${formatDateShort(request.data.departureDate)} - ${formatDateShort(request.data.returnDate)}
                    </span>
                    ${request.data.purpose ? `
                    <span class="detail full-width" style="margin-top: 5px; color: var(--text-tertiary);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        ${request.data.purpose.length > 50 ? request.data.purpose.substring(0, 50) + '...' : request.data.purpose}
                    </span>
                    ` : ''}
                `;
                    break;
            }

            let actionsHtml = '';
            if (canApprove) {
                actionsHtml = `
                <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); App.approveRequest('${request.id}')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); App.rejectRequest('${request.id}')">Reject</button>
            `;
            } else if (canEdit || canCancel) {
                if (canEdit) {
                    actionsHtml += `<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); App.editRequest('${request.id}')">Edit</button>`;
                }
                if (canCancel) {
                    actionsHtml += `<button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); App.cancelRequest('${request.id}')" style="color: var(--error-400)">Cancel</button>`;
                }
            }

            const employeeHtml = showEmployee ? `
            <div class="employee-info">
                <div class="employee-avatar">${request.employeeName.split(' ').map(n => n[0]).join('')}</div>
                <span class="employee-name">${request.employeeName}</span>
            </div>
        ` : '';

            return `
            <div class="request-card" onclick="App.viewRequest('${request.id}')">
                <div class="request-card-header">
                    <div class="request-card-type">
                        <div class="request-type-icon ${request.type}">${typeInfo.icon}</div>
                        <div class="request-type-info">
                            <h4>${typeInfo.name}</h4>
                            <span>${subTypeName || 'Request'}</span>
                        </div>
                    </div>
                    <span class="status-badge ${request.status}">${WorkflowModule.getStatusName(request.status)}</span>
                </div>
                <div class="request-card-body">
                    ${detailsHtml}
                </div>
                <div class="request-card-footer">
                    ${employeeHtml}
                    <span class="created-date" style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
                        Created ${formatDateShort(request.createdAt)}
                    </span>
                    <div class="request-card-actions">
                        ${actionsHtml}
                    </div>
                </div>
            </div>
        `;
        } catch (error) {
            console.error('Error rendering individual request card:', error);
            return `<div class="request-card error-card">
                   <div style="padding: 10px; color: var(--error-600);">Error displaying request</div>
                </div>`;
        }
    }

    // Render request details
    function renderRequestDetails(request) {
        const typeInfo = getTypeInfo(request.type);
        const subTypeName = getSubTypeName(request.type, request.subType);

        let detailsHtml = `
            <div class="detail-item">
                <span class="detail-label">Request Type</span>
                <span class="detail-value">${typeInfo.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value"><span class="status-badge ${request.status}">${WorkflowModule.getStatusName(request.status)}</span></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Employee</span>
                <span class="detail-value">${request.employeeName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Department</span>
                <span class="detail-value">${request.department}</span>
            </div>
        `;

        // Type-specific details
        switch (request.type) {
            case 'vacation':
                detailsHtml += `
                    <div class="detail-item">
                        <span class="detail-label">Vacation Type</span>
                        <span class="detail-value">${subTypeName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Travel Date</span>
                        <span class="detail-value">${request.data.travelDate ? formatDateLong(request.data.travelDate) : 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Start Date</span>
                        <span class="detail-value highlight">${formatDateLong(request.data.startDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Joining Date</span>
                        <span class="detail-value highlight">${formatDateLong(request.data.joiningDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Number of Days</span>
                        <span class="detail-value">${request.data.days || '?'} days</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ticket Encashment</span>
                        <span class="detail-value">${request.data.ticketEncashment ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Exit-Re-entry</span>
                        <span class="detail-value">${request.data.exitReentry ? 'Yes' : 'No'}</span>
                    </div>
                    ${request.data.notes ? `
                        <div class="detail-item full-width">
                            <span class="detail-label">Notes</span>
                            <span class="detail-value">${request.data.notes}</span>
                        </div>
                    ` : ''}
                `;
                break;
            case 'absence':
                detailsHtml += `
                    <div class="detail-item">
                        <span class="detail-label">Absence Type</span>
                        <span class="detail-value">${subTypeName}</span>
                    </div>
                    ${request.data.dateType === 'range' ? `
                        <div class="detail-item">
                            <span class="detail-label">Start Date</span>
                            <span class="detail-value highlight">${formatDateLong(request.data.startDate)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">End Date</span>
                            <span class="detail-value highlight">${formatDateLong(request.data.endDate)}</span>
                        </div>
                    ` : `
                        <div class="detail-item">
                            <span class="detail-label">Date</span>
                            <span class="detail-value highlight">${formatDateLong(request.data.absenceDate)}</span>
                        </div>
                    `}
                    ${request.data.reason ? `
                        <div class="detail-item full-width">
                            <span class="detail-label">Reason</span>
                            <span class="detail-value">${request.data.reason}</span>
                        </div>
                    ` : ''}
                `;
                break;
            case 'late':
                detailsHtml += `
                    <div class="detail-item">
                        <span class="detail-label">Date</span>
                        <span class="detail-value highlight">${formatDateLong(request.data.lateDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Arrival Time</span>
                        <span class="detail-value highlight">${request.data.arrivalTime}</span>
                    </div>
                    <div class="detail-item full-width">
                        <span class="detail-label">Reason</span>
                        <span class="detail-value">${request.data.reason}</span>
                    </div>
                `;
                break;
            case 'business-trip':
                detailsHtml += `
                    <div class="detail-item full-width">
                        <span class="detail-label">Destination</span>
                        <span class="detail-value highlight">${request.data.destination}</span>
                    </div>
                    <div class="detail-item full-width">
                        <span class="detail-label">Purpose</span>
                        <span class="detail-value">${request.data.purpose}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Departure</span>
                        <span class="detail-value">${formatDateLong(request.data.departureDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Return</span>
                        <span class="detail-value">${formatDateLong(request.data.returnDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Transportation</span>
                        <span class="detail-value">${capitalizeFirst(request.data.transportation)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Accommodation</span>
                        <span class="detail-value">${request.data.accommodation ? 'Required' : 'Not Required'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Per Diem</span>
                        <span class="detail-value">${request.data.perDiem ? 'Required' : 'Not Required'}</span>
                    </div>
                    ${request.data.notes ? `
                        <div class="detail-item full-width">
                            <span class="detail-label">Notes</span>
                            <span class="detail-value">${request.data.notes}</span>
                        </div>
                    ` : ''}
                `;
                break;
        }

        return detailsHtml;
    }

    // Helper functions
    function formatDateShort(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function formatDateLong(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    function capitalizeFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    // Calculate vacation days
    function calculateDays(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    return {
        requestTypes,
        createRequest,
        updateRequest,
        getMyRequests,
        getAllRequests,
        getTypeInfo,
        getSubTypeName,
        renderRequestCard,
        renderRequestDetails,
        calculateDays,
        formatDateShort,
        formatDateLong
    };
})();
