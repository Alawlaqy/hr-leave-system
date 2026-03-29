/* ================================
   Calendar & Notification Service
   Generate .ics files and email notifications
   ================================ */

const CalendarService = (function () {

    // Generate ICS file for calendar import
    function generateICS(request, employee) {
        const startDate = request.data.startDate || request.data.travelDate;
        const endDate = request.data.joiningDate || request.data.startDate;

        if (!startDate) return null;

        // Format dates for ICS (YYYYMMDD)
        const formatICSDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const summary = `${employee.name} - ${formatRequestType(request.type)}`;
        const description = `Leave Type: ${request.type}\\nStatus: ${request.status}\\nEmployee: ${employee.name}\\nDepartment: ${employee.department}`;

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//HR Leave System//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${request.id}@hrleave.system`,
            `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
            `DTSTART:${formatICSDate(startDate)}`,
            endDate ? `DTEND:${formatICSDate(endDate)}` : '',
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            `STATUS:CONFIRMED`,
            `TRANSP:OPAQUE`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(line => line).join('\r\n');

        return icsContent;
    }

    function downloadICS(request, employee) {
        const icsContent = generateICS(request, employee);
        if (!icsContent) {
            console.error('Cannot generate ICS: missing date information');
            return;
        }

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leave-${request.id}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function formatRequestType(type) {
        const types = {
            'vacation': 'Vacation Leave',
            'absence': 'Absence',
            'late': 'Late Arrival',
            'business-trip': 'Business Trip'
        };
        return types[type] || type;
    }

    return {
        generateICS,
        downloadICS
    };
})();

// ============================================
// NOTIFICATION SERVICE
// ============================================

const NotificationService = (function () {

    // Generate email preview HTML
    function generateEmailHTML(type, data) {
        const templates = {
            request_submitted: (data) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #6366f1; margin-top: 0;">New Leave Request Submitted</h2>
                        <p>Hello ${data.managerName},</p>
                        <p><strong>${data.employeeName}</strong> from ${data.department} has submitted a new ${data.requestType} request.</p>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Request Type:</strong> ${data.requestType}</p>
                            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${data.startDate}</p>
                            <p style="margin: 5px 0;"><strong>End Date:</strong> ${data.endDate}</p>
                            <p style="margin: 5px 0;"><strong>Duration:</strong> ${data.days} days</p>
                        </div>
                        
                        <p style="margin-top: 20px;">
                            <a href="#" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                Review Request
                            </a>
                        </p>
                        
                        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                            This is an automated notification from the HR Leave Management System.
                        </p>
                    </div>
                </div>
            `,

            request_approved: (data) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 30px;">✓</span>
                            </div>
                        </div>
                        
                        <h2 style="color: #10b981; margin-top: 0; text-align: center;">Request Approved!</h2>
                        <p>Hello ${data.employeeName},</p>
                        <p>Great news! Your ${data.requestType} request has been approved by ${data.approverName}.</p>
                        
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p style="margin: 5px 0;"><strong>Request Type:</strong> ${data.requestType}</p>
                            <p style="margin: 5px 0;"><strong>Period:</strong> ${data.startDate} to ${data.endDate}</p>
                            ${data.comment ? `<p style="margin: 5px 0;"><strong>Comment:</strong> ${data.comment}</p>` : ''}
                        </div>
                        
                        <p style="margin-top: 20px;">
                            <a href="#" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                Add to Calendar
                            </a>
                        </p>
                        
                        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                            This is an automated notification from the HR Leave Management System.
                        </p>
                    </div>
                </div>
            `,

            request_rejected: (data) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #ef4444; margin-top: 0;">Request Update</h2>
                        <p>Hello ${data.employeeName},</p>
                        <p>Your ${data.requestType} request has been reviewed by ${data.approverName}.</p>
                        
                        <div style="background: #fef2f2; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ef4444;">
                            <p style="margin: 5px 0;"><strong>Status:</strong> Not Approved</p>
                            ${data.comment ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.comment}</p>` : ''}
                        </div>
                        
                        <p>Please contact your manager if you have any questions.</p>
                        
                        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                            This is an automated notification from the HR Leave Management System.
                        </p>
                    </div>
                </div>
            `
        };

        const template = templates[type];
        return template ? template(data) : '';
    }

    function showEmailPreview(type, data) {
        const html = generateEmailHTML(type, data);

        // Create modal for preview
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>Email Notification Preview</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    ${html}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn btn-primary" onclick="alert('In production, this would send the email'); this.closest('.modal').remove();">
                        Send Email
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on overlay click
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    }

    return {
        generateEmailHTML,
        showEmailPreview
    };
})();
