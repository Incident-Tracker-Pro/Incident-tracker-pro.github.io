document.addEventListener('DOMContentLoaded', function () {
    const newIncidentForm = document.querySelector('.new-incident');
    const addIncidentBtn = document.getElementById('add-incident-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const searchBtn = document.getElementById('search-btn');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const incidentList = document.getElementById('incident-list');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const fileInput = document.getElementById('file-input');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    let incidents = JSON.parse(localStorage.getItem('incidents')) || [];
    let currentPage = 1;
    const itemsPerPage = 6;

    const clearFilterBtn = document.createElement('button');
    clearFilterBtn.textContent = 'Clear Date Filter';
    clearFilterBtn.id = 'clear-filter-btn';
    document.querySelector('.date-filter').appendChild(clearFilterBtn);

    renderIncidents();
    updateStatistics();

    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-date-type').value = 'range';
    document.getElementById('filter-start-date').value = today;
    document.getElementById('filter-end-date').value = today;
    toggleDateFilterFields();

    newIncidentForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addIncident();
    });

    clearFormBtn.addEventListener('click', function () {
        clearForm();
    });

    searchBtn.addEventListener('click', function () {
        renderIncidents();
        updateStatistics();
    });

    clearSearchBtn.addEventListener('click', function () {
        document.getElementById('search-inc-number').value = '';
        document.getElementById('search-caller-number').value = '';
        document.getElementById('search-status').value = '';
        document.getElementById('search-date').value = '';
        renderIncidents();
        updateStatistics();
    });

    prevPageBtn.addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            renderIncidents();
        }
    });

    nextPageBtn.addEventListener('click', function () {
        if ((currentPage * itemsPerPage) < incidents.length) {
            currentPage++;
            renderIncidents();
        }
    });

    exportBtn.addEventListener('click', function () {
        exportToCSV();
    });

    importBtn.addEventListener('click', function () {
        importFromCSV();
    });

    deleteAllBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to delete all data?')) {
            deleteAllData();
        }
    });

    applyFilterBtn.addEventListener('click', function () {
        applyDateFilter();
    });

    clearFilterBtn.addEventListener('click', function () {
        clearDateFilter();
    });

    document.getElementById('filter-date-type').addEventListener('change', function () {
        toggleDateFilterFields();
    });

    document.getElementById('status').addEventListener('change', function () {
        const status = this.value;
        const summaryInput = document.getElementById('summary');

        switch (status) {
            case 'Active':
                summaryInput.value = 'The issue is currently being addressed.';
                break;
            case 'Resolved':
                summaryInput.value = 'User confirmed that the issue has been resolved.';
                break;
            case 'Awaiting User Info':
                summaryInput.value = 'Waiting for additional information from the user.';
                break;
            case 'POS Depot':
                summaryInput.value = 'POS system sent to depot for further investigation.';
                break;
            case 'Escalation':
                summaryInput.value = 'Incident escalated to a higher support tier.';
                break;
            default:
                summaryInput.value = '';
                break;
        }
    });

    function addIncident() {
        const incNumber = document.getElementById('inc-number').value.trim();
        const callerNumber = document.getElementById('caller-number').value.trim();
        const status = document.getElementById('status').value.trim();
        const date = document.getElementById('date').value.trim();
        const summary = document.getElementById('summary').value.trim();

        if (incNumber && callerNumber && status && date && summary) {
            incidents.push({
                incNumber,
                callerNumber,
                status,
                date,
                summary
            });
            localStorage.setItem('incidents', JSON.stringify(incidents));
            renderIncidents();
            updateStatistics();
            clearForm();
        }
    }

    function clearForm() {
        document.getElementById('inc-number').value = '';
        document.getElementById('caller-number').value = '';
        document.getElementById('status').value = '';
        document.getElementById('date').value = '';
        document.getElementById('summary').value = '';
    }

    function renderIncidents() {
        const filteredIncidents = getFilteredIncidents();

        incidentList.innerHTML = '';
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredIncidents.length);
        for (let i = startIndex; i < endIndex; i++) {
            const incident = filteredIncidents[i];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${incident.incNumber}</td>
                <td>${incident.callerNumber}</td>
                <td>${incident.status}</td>
                <td>${incident.date}</td>
                <td>${incident.summary}</td>
                <td><button class="delete-row-btn" data-index="${i}">Del</button></td>
            `;
            incidentList.appendChild(row);
        }
        pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredIncidents.length / itemsPerPage)}`;

        document.querySelectorAll('.delete-row-btn').forEach(button => {
            button.addEventListener('click', function () {
                const index = this.getAttribute('data-index');
                deleteRow(index);
            });
        });
    }

    function getFilteredIncidents() {
        const incNumber = document.getElementById('search-inc-number').value.trim();
        const callerNumber = document.getElementById('search-caller-number').value.trim();
        const status = document.getElementById('search-status').value.trim();
        const date = document.getElementById('search-date').value.trim();

        let filteredIncidents = incidents.filter(incident => {
            return (incident.incNumber.includes(incNumber) &&
                incident.callerNumber.includes(callerNumber) &&
                (!status || incident.status === status) &&
                (!date || incident.date === date));
        });

        const filterType = document.getElementById('filter-date-type').value;
        const filterMonth = document.getElementById('filter-month').value;
        const filterStartDate = document.getElementById('filter-start-date').value;
        const filterEndDate = document.getElementById('filter-end-date').value;

        if (filterType === 'month' && filterMonth) {
            filteredIncidents = filteredIncidents.filter(incident => {
                const incidentMonth = incident.date.substring(0, 7);
                return incidentMonth === filterMonth;
            });
        } else if (filterType === 'range' && filterStartDate && filterEndDate) {
            filteredIncidents = filteredIncidents.filter(incident => {
                const incidentDate = new Date(incident.date);
                return incidentDate >= new Date(filterStartDate) && incidentDate <= new Date(filterEndDate);
            });
        }

        return filteredIncidents;
    }

    function updateStatistics() {
        const filteredIncidents = getFilteredIncidents();
        const totalIncidents = filteredIncidents.length;
        const activeIncidents = filteredIncidents.filter(incident => incident.status === 'Active').length;
        const resolvedIncidents = filteredIncidents.filter(incident => incident.status === 'Resolved').length;
        const resolutionRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents * 100).toFixed(2) : 0;

        document.getElementById('total-incidents').textContent = totalIncidents;
        document.getElementById('active-incidents').textContent = activeIncidents;
        document.getElementById('resolved-incidents').textContent = resolvedIncidents;
        document.getElementById('resolution-rate').textContent = resolutionRate + '%';
    }

    function exportToCSV() {
        const filteredIncidents = getFilteredIncidents();
        const agentName = document.getElementById('agent-name').value.trim();

        if (!agentName) {
            alert('Please enter an agent name before exporting.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,"
            + "Agent Name,INC Number,Caller Number,Status,Date,Summary\n"
            + filteredIncidents.map(incident =>
                `${agentName},${incident.incNumber},${incident.callerNumber},${incident.status},${incident.date},${incident.summary}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);

        let fileName = `incidents_${agentName}_`;
        const filterType = document.getElementById('filter-date-type').value;
        if (filterType === 'month') {
            fileName += document.getElementById('filter-month').value;
        } else if (filterType === 'range') {
            const startDate = document.getElementById('filter-start-date').value;
            const endDate = document.getElementById('filter-end-date').value;
            if (startDate === endDate) {
                fileName += startDate;
            } else {
                fileName += `${startDate}_to_${endDate}`;
            }
        } else {
            fileName += new Date().toISOString().split('T')[0];
        }
        fileName += '.csv';

        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function importFromCSV() {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const newIncidents = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        const [incNumber, callerNumber, status, date, summary] = line.split(',');
                        newIncidents.push({ incNumber, callerNumber, status, date, summary });
                    }
                }
                incidents = incidents.concat(newIncidents);
                localStorage.setItem('incidents', JSON.stringify(incidents));
                renderIncidents();
                updateStatistics();
            };
            reader.readAsText(file);
        }
    }

    function deleteAllData() {
        incidents = [];
        localStorage.setItem('incidents', JSON.stringify(incidents));
        renderIncidents();
        updateStatistics();
    }

    function deleteRow(index) {
        incidents.splice(index, 1);
        localStorage.setItem('incidents', JSON.stringify(incidents));
        renderIncidents();
        updateStatistics();
    }

    function applyDateFilter() {
        renderIncidents();
        updateStatistics();
    }

    function clearDateFilter() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filter-date-type').value = 'range';
        document.getElementById('filter-start-date').value = today;
        document.getElementById('filter-end-date').value = today;
        document.getElementById('filter-month').value = '';
        toggleDateFilterFields();
        renderIncidents();
        updateStatistics();
    }

    function toggleDateFilterFields() {
        const filterType = document.getElementById('filter-date-type').value;
        document.getElementById('month-filter').style.display = filterType === 'month' ? 'block' : 'none';
        document.getElementById('date-range-filter').style.display = filterType === 'range' ? 'block' : 'none';
    }
});
