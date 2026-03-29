/* ================================
   PDF Generation Service
   Using jsPDF for document generation
   ================================ */

const PDFService = (function () {

    // Check if jsPDF is loaded
    function checkJsPDF() {
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF library not loaded');
            return false;
        }
        return true;
    }

    // Generate Leave Approval Letter
    function generateLeaveApprovalPDF(request, employee) {
        if (!checkJsPDF()) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Company Header
        doc.setFillColor(99, 102, 241); // Primary color
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('HR LEAVE SYSTEM', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Leave Approval Certificate', 105, 30, { align: 'center' });

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Document Info
        doc.setFontSize(10);
        doc.text(`Document ID: ${request.id}`, 20, 55);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 55);

        // Title
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('LEAVE APPROVAL CERTIFICATE', 105, 75, { align: 'center' });

        // Body
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        let yPos = 95;

        doc.text('To Whom It May Concern,', 20, yPos);
        yPos += 15;

        const bodyText = `This is to certify that ${employee.name}, Employee ID: ${employee.profile?.employeeId || 'N/A'}, ` +
            `working in the ${employee.department} Department as ${employee.profile?.position || 'Employee'}, ` +
            `has been granted ${formatRequestType(request.type)}.`;

        const splitText = doc.splitTextToSize(bodyText, 170);
        doc.text(splitText, 20, yPos);
        yPos += splitText.length * 7 + 10;

        // Leave Details Box
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(20, yPos, 170, 60, 3, 3, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(20, yPos, 170, 60, 3, 3, 'S');

        yPos += 10;
        doc.setFont(undefined, 'bold');
        doc.text('Leave Details:', 25, yPos);
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.text(`Type: ${formatRequestType(request.type)}`, 25, yPos);
        yPos += 7;

        if (request.data.startDate) {
            doc.text(`Start Date: ${formatDate(request.data.startDate)}`, 25, yPos);
            yPos += 7;
        }

        if (request.data.joiningDate) {
            doc.text(`Return Date: ${formatDate(request.data.joiningDate)}`, 25, yPos);
            yPos += 7;
        }

        if (request.data.days) {
            doc.text(`Duration: ${request.data.days} days`, 25, yPos);
            yPos += 7;
        }

        doc.text(`Status: ${request.status.toUpperCase()}`, 25, yPos);
        yPos += 20;

        // Approval Section
        if (request.workflow && request.workflow.length > 0) {
            yPos += 10;
            doc.setFont(undefined, 'bold');
            doc.text('Approval Chain:', 20, yPos);
            yPos += 8;

            doc.setFont(undefined, 'normal');
            request.workflow.forEach(step => {
                if (step.status === 'approved' && step.actor) {
                    doc.text(`✓ Approved by: ${step.actor}`, 25, yPos);
                    yPos += 6;
                    if (step.date) {
                        doc.setFontSize(9);
                        doc.setTextColor(100, 100, 100);
                        doc.text(`   Date: ${formatDate(step.date)}`, 25, yPos);
                        doc.setFontSize(11);
                        doc.setTextColor(0, 0, 0);
                        yPos += 8;
                    }
                }
            });
        }

        // Footer
        yPos = 260;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('This is a computer-generated document and does not require a signature.', 105, yPos, { align: 'center' });
        yPos += 5;
        doc.text('HR Leave Management System | Generated on ' + new Date().toLocaleString(), 105, yPos, { align: 'center' });

        // Watermark
        doc.setFontSize(50);
        doc.setTextColor(200, 200, 200);
        doc.text('APPROVED', 105, 150, { align: 'center', angle: 45 });

        // Save
        doc.save(`Leave_Approval_${request.id}.pdf`);
    }

    // Generate Business Trip Authorization
    function generateBusinessTripPDF(request, employee) {
        if (!checkJsPDF()) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('BUSINESS TRIP', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Authorization Letter', 105, 30, { align: 'center' });

        doc.setTextColor(0, 0, 0);

        // Content
        let yPos = 60;
        doc.setFontSize(11);

        doc.text(`Employee: ${employee.name}`, 20, yPos);
        yPos += 7;
        doc.text(`Department: ${employee.department}`, 20, yPos);
        yPos += 7;
        doc.text(`Position: ${employee.profile?.position || 'N/A'}`, 20, yPos);
        yPos += 15;

        if (request.data.destination) {
            doc.setFont(undefined, 'bold');
            doc.text(`Destination: ${request.data.destination}`, 20, yPos);
            doc.setFont(undefined, 'normal');
            yPos += 10;
        }

        if (request.data.purpose) {
            doc.text(`Purpose: ${request.data.purpose}`, 20, yPos);
            yPos += 10;
        }

        if (request.data.departureDate) {
            doc.text(`Departure: ${formatDate(request.data.departureDate)}`, 20, yPos);
            yPos += 7;
        }

        if (request.data.returnDate) {
            doc.text(`Return: ${formatDate(request.data.returnDate)}`, 20, yPos);
        }

        doc.save(`Business_Trip_${request.id}.pdf`);
    }

    // Utility functions
    function formatRequestType(type) {
        const types = {
            'vacation': 'Vacation Leave',
            'absence': 'Absence',
            'late': 'Late Arrival',
            'business-trip': 'Business Trip'
        };
        return types[type] || type;
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return {
        generateLeaveApprovalPDF,
        generateBusinessTripPDF
    };
})();
