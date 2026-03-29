/* ================================
   Analytics Module
   Visual reporting and insights
   ================================ */

const AnalyticsModule = (function () {

    let charts = {};

    // Initialize all charts
    async function init() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            const containers = document.querySelectorAll('.chart-card');
            containers.forEach(container => {
                container.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-tertiary); text-align:center; padding:20px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px; height:32px; margin-bottom:10px; opacity:0.5;">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                            <line x1="12" y1="2" x2="12" y2="12"></line>
                        </svg>
                        <p style="font-size:0.875rem;">Analytics unavailable (Chart library not loaded)</p>
                        <p style="font-size:0.75rem; margin-top:5px;">Please check your internet connection</p>
                    </div>
                `;
            });
            return;
        }

        // Set Chart.js defaults
        Chart.defaults.color = '#9ca3af';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        Chart.defaults.font.family = "'Inter', sans-serif";
    }

    // Render Monthly Trends Chart
    async function renderMonthlyTrends() {
        const analytics = await APIService.getLeaveAnalytics();
        const ctx = document.getElementById('chart-monthly-trends');
        if (!ctx) return;

        // Destroy existing chart
        if (charts.monthlyTrends) {
            charts.monthlyTrends.destroy();
        }

        const labels = Object.keys(analytics.monthlyTrends);
        const data = Object.values(analytics.monthlyTrends);

        charts.monthlyTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Leave Requests',
                    data: data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Monthly Leave Trends',
                        color: '#f3f4f6',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Render Leave Type Distribution
    async function renderTypeDistribution() {
        const analytics = await APIService.getLeaveAnalytics();
        const ctx = document.getElementById('chart-type-distribution');
        if (!ctx) return;

        if (charts.typeDistribution) {
            charts.typeDistribution.destroy();
        }

        const labels = Object.keys(analytics.typeDistribution).map(type => {
            const types = {
                'vacation': 'Vacation',
                'absence': 'Absence',
                'late': 'Late',
                'business-trip': 'Business Trip'
            };
            return types[type] || type;
        });
        const data = Object.values(analytics.typeDistribution);

        charts.typeDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#6366f1',
                        '#8b5cf6',
                        '#ec4899',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            color: '#f3f4f6'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Leave Type Distribution',
                        color: '#f3f4f6',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }

    // Render Department Comparison
    async function renderDepartmentComparison() {
        const analytics = await APIService.getLeaveAnalytics();
        const ctx = document.getElementById('chart-department-comparison');
        if (!ctx) return;

        if (charts.departmentComparison) {
            charts.departmentComparison.destroy();
        }

        const labels = Object.keys(analytics.departmentComparison);
        const data = Object.values(analytics.departmentComparison);

        charts.departmentComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Requests',
                    data: data,
                    backgroundColor: '#6366f1',
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Requests by Department',
                        color: '#f3f4f6',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Render Status Breakdown
    async function renderStatusBreakdown() {
        const analytics = await APIService.getLeaveAnalytics();
        const ctx = document.getElementById('chart-status-breakdown');
        if (!ctx) return;

        if (charts.statusBreakdown) {
            charts.statusBreakdown.destroy();
        }

        const statusColors = {
            'approved': '#10b981',
            'rejected': '#ef4444',
            'pending-dept': '#f59e0b',
            'pending-gm': '#f59e0b',
            'draft': '#6b7280'
        };

        const labels = Object.keys(analytics.statusBreakdown);
        const data = Object.values(analytics.statusBreakdown);
        const colors = labels.map(status => statusColors[status] || '#6366f1');

        charts.statusBreakdown = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels.map(s => s.replace('-', ' ').toUpperCase()),
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            color: '#f3f4f6'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Request Status Breakdown',
                        color: '#f3f4f6',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }

    // Render all analytics
    async function renderAllCharts() {
        await renderMonthlyTrends();
        await renderTypeDistribution();
        await renderDepartmentComparison();
        await renderStatusBreakdown();
    }

    // Render Team Availability
    async function renderTeamAvailability() {
        const availability = await APIService.getTeamAvailability();
        const container = document.getElementById('team-availability-list');
        if (!container) return;

        const available = availability.filter(a => a.status === 'available');
        const onLeave = availability.filter(a => a.status === 'on-leave');

        container.innerHTML = `
            <div class="availability-summary">
                <div class="availability-stat">
                    <div class="stat-value">${available.length}</div>
                    <div class="stat-label">Available</div>
                </div>
                <div class="availability-stat">
                    <div class="stat-value">${onLeave.length}</div>
                    <div class="stat-label">On Leave</div>
                </div>
            </div>
            
            ${onLeave.length > 0 ? `
                <div class="on-leave-list">
                    <h4>Currently on Leave</h4>
                    ${onLeave.map(emp => `
                        <div class="availability-item">
                            <div class="emp-info">
                                <div class="emp-name">${emp.name}</div>
                                <div class="emp-dept">${emp.department}</div>
                            </div>
                            <div class="leave-info">
                                <span class="leave-badge">${emp.leaveType}</span>
                                <span class="return-date">Returns: ${new Date(emp.returnDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="no-data">All team members are available</p>'}
        `;
    }

    return {
        init,
        renderAllCharts,
        renderMonthlyTrends,
        renderTypeDistribution,
        renderDepartmentComparison,
        renderStatusBreakdown,
        renderTeamAvailability
    };
})();
