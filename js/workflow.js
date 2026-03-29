/* ================================
   Workflow Module - Approval Logic
   ================================ */

const WorkflowModule = (function () {

    // Status display names
    const statusNames = {
        'draft': 'Draft',
        'pending-dept': 'Pending Dept. Approval',
        'pending-gm': 'Pending GM Approval',
        'pending-hr': 'Pending HR Approval',
        'pending-finance': 'Pending Finance Approval',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'cancelled': 'Cancelled'
    };

    // Get initial workflow for a new request
    function createInitialWorkflow(employeeName, type, data) {
        const workflow = [
            {
                step: 'submitted',
                actor: employeeName,
                date: new Date().toISOString(),
                status: 'completed'
            },
            {
                step: 'dept-approval',
                actor: null,
                date: null,
                status: 'pending'
            },
            {
                step: 'gm-approval',
                actor: null,
                date: null,
                status: 'pending'
            },
            {
                step: 'hr-approval',
                actor: null,
                date: null,
                status: 'pending'
            }
        ];

        // Add Finance step for Vacation (Annual only) and Business Trip
        let needsFinance = false;
        if (type === 'business-trip') {
            needsFinance = true;
        } else if (type === 'vacation' && data && data.vacationType === 'annual') {
            needsFinance = true;
        }

        if (needsFinance) {
            workflow.push({
                step: 'finance-approval',
                actor: null,
                date: null,
                status: 'pending'
            });
        }

        return workflow;
    }

    // Get workflow for manager self-request (skips dept approval)
    function createManagerWorkflow(employeeName, type, data) {
        const workflow = [
            {
                step: 'submitted',
                actor: employeeName,
                date: new Date().toISOString(),
                status: 'completed'
            },
            {
                step: 'dept-approval',
                actor: employeeName,
                date: new Date().toISOString(),
                status: 'skipped',
                comment: 'Auto-skipped for Department Manager'
            },
            {
                step: 'gm-approval',
                actor: null,
                date: null,
                status: 'pending'
            },
            {
                step: 'hr-approval',
                actor: null,
                date: null,
                status: 'pending'
            }
        ];

        // Add Finance step for Vacation (Annual only) and Business Trip
        let needsFinance = false;
        if (type === 'business-trip') {
            needsFinance = true;
        } else if (type === 'vacation' && data && data.vacationType === 'annual') {
            needsFinance = true;
        }

        if (needsFinance) {
            workflow.push({
                step: 'finance-approval',
                actor: null,
                date: null,
                status: 'pending'
            });
        }

        return workflow;
    }

    // Submit a request (move from draft to pending)
    function submitRequest(request) {
        const currentUser = AuthModule.getCurrentUser();

        // If dept manager submitting own request, skip dept approval
        if (currentUser.role === 'dept-manager') {
            request.status = 'pending-gm';
            request.workflow = createManagerWorkflow(currentUser.name, request.type, request.data);
        } else {
            request.status = 'pending-dept';
            request.workflow = createInitialWorkflow(currentUser.name, request.type, request.data);
        }

        return DataModule.saveRequest(request);
    }

    // Approve a request
    function approveRequest(requestId, comment = '') {
        const request = DataModule.getRequest(requestId);
        if (!request) return null;

        const currentUser = AuthModule.getCurrentUser();
        const now = new Date().toISOString();

        if (request.status === 'pending-dept') {
            // Dept manager approval - move to GM
            const deptStep = request.workflow.find(w => w.step === 'dept-approval');
            if (deptStep) {
                deptStep.actor = currentUser.name;
                deptStep.date = now;
                deptStep.status = 'approved';
                deptStep.comment = comment;
            }
            request.status = 'pending-gm';
        } else if (request.status === 'pending-gm') {
            // GM approval - move to HR
            const gmStep = request.workflow.find(w => w.step === 'gm-approval');
            if (gmStep) {
                gmStep.actor = currentUser.name;
                gmStep.date = now;
                gmStep.status = 'approved';
                gmStep.comment = comment;
            }
            request.status = 'pending-hr';
        } else if (request.status === 'pending-hr') {
            // HR approval - move to Finance OR Approved
            const hrStep = request.workflow.find(w => w.step === 'hr-approval');
            if (hrStep) {
                hrStep.actor = currentUser.name;
                hrStep.date = now;
                hrStep.status = 'approved';
                hrStep.comment = comment;
            }

            // Check if Finance step exists
            const hasFinanceStep = request.workflow.some(w => w.step === 'finance-approval');
            if (hasFinanceStep) {
                request.status = 'pending-finance';
            } else {
                request.status = 'approved';
            }
        } else if (request.status === 'pending-finance') {
            // Finance approval - Final
            const finStep = request.workflow.find(w => w.step === 'finance-approval');
            if (finStep) {
                finStep.actor = currentUser.name;
                finStep.date = now;
                finStep.status = 'approved';
                finStep.comment = comment;
            }
            request.status = 'approved';
        }

        return DataModule.saveRequest(request);
    }

    // Reject a request
    function rejectRequest(requestId, comment = '') {
        const request = DataModule.getRequest(requestId);
        if (!request) return null;

        const currentUser = AuthModule.getCurrentUser();
        const now = new Date().toISOString();

        if (request.status === 'pending-dept') {
            const deptStep = request.workflow.find(w => w.step === 'dept-approval');
            if (deptStep) {
                deptStep.actor = currentUser.name;
                deptStep.date = now;
                deptStep.status = 'rejected';
                deptStep.comment = comment;
            }
        } else if (request.status === 'pending-gm') {
            const gmStep = request.workflow.find(w => w.step === 'gm-approval');
            if (gmStep) {
                gmStep.actor = currentUser.name;
                gmStep.date = now;
                gmStep.status = 'rejected';
                gmStep.comment = comment;
            }
        } else if (request.status === 'pending-hr') {
            const hrStep = request.workflow.find(w => w.step === 'hr-approval');
            if (hrStep) {
                hrStep.actor = currentUser.name;
                hrStep.date = now;
                hrStep.status = 'rejected';
                hrStep.comment = comment;
            }
        } else if (request.status === 'pending-finance') {
            const finStep = request.workflow.find(w => w.step === 'finance-approval');
            if (finStep) {
                finStep.actor = currentUser.name;
                finStep.date = now;
                finStep.status = 'rejected';
                finStep.comment = comment;
            }
        }

        request.status = 'rejected';
        return DataModule.saveRequest(request);
    }

    // Cancel a request
    function cancelRequest(requestId) {
        const request = DataModule.getRequest(requestId);
        if (!request) return null;

        request.status = 'cancelled';
        return DataModule.saveRequest(request);
    }

    // Get status display name
    function getStatusName(status) {
        return statusNames[status] || status;
    }

    // Get requests pending approval for current user
    function getPendingApprovals() {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) return [];

        const requests = DataModule.getRequests();

        return requests.filter(request => {
            return AuthModule.canApproveRequest(request);
        });
    }

    // Get counts for dashboard
    function getRequestCounts(employeeId = null) {
        const requests = DataModule.getRequests();
        const filtered = employeeId
            ? requests.filter(r => r.employeeId === employeeId)
            : requests;

        return {
            pending: filtered.filter(r => ['pending-dept', 'pending-gm', 'pending-hr', 'pending-finance'].includes(r.status)).length,
            approved: filtered.filter(r => r.status === 'approved').length,
            rejected: filtered.filter(r => r.status === 'rejected').length,
            draft: filtered.filter(r => r.status === 'draft').length
        };
    }

    // Render workflow timeline HTML
    function renderTimeline(workflow) {
        if (!workflow || !workflow.length) return '';

        const stepIcons = {
            'submitted': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            'dept-approval': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            'gm-approval': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
            'hr-approval': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            'finance-approval': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
        };

        const stepNames = {
            'submitted': 'Request Submitted',
            'dept-approval': 'Department Manager',
            'gm-approval': 'General Manager',
            'hr-approval': 'HR Department',
            'finance-approval': 'Finance Department'
        };

        let html = '<h4 class="timeline-title">Approval Workflow</h4><div class="timeline-steps">';

        workflow.forEach(step => {
            let stepClass = '';
            if (step.status === 'completed' || step.status === 'approved' || step.status === 'skipped') {
                stepClass = 'completed';
            } else if (step.status === 'pending') {
                stepClass = 'current';
            } else if (step.status === 'rejected') {
                stepClass = 'rejected';
            }

            const statusText = step.status === 'skipped' ? 'Skipped' :
                step.status === 'approved' ? 'Approved' :
                    step.status === 'rejected' ? 'Rejected' :
                        step.status === 'completed' ? 'Completed' : 'Pending';

            html += `
                <div class="timeline-step ${stepClass}">
                    <div class="step-icon">${stepIcons[step.step] || ''}</div>
                    <div class="step-content">
                        <div class="step-title">${stepNames[step.step] || step.step}</div>
                        <div class="step-meta">
                            ${step.actor ? step.actor : 'Waiting...'} 
                            ${step.date ? '• ' + formatDate(step.date) : ''}
                            • <strong>${statusText}</strong>
                        </div>
                        ${step.comment ? `<div class="step-comment">"${step.comment}"</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    // Format date for display
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return {
        createInitialWorkflow,
        createManagerWorkflow,
        submitRequest,
        approveRequest,
        rejectRequest,
        cancelRequest,
        getStatusName,
        getPendingApprovals,
        getRequestCounts,
        renderTimeline,
        formatDate
    };
})();
