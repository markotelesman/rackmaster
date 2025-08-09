/**
 * app.js
 * Frontend logika za RackMaster aplikaciju.
 */

const API_URL = 'http://127.0.0.1:5000/api';

const uiManager = {
    showMessage: (message, type = 'success') => {
        const messageBox = document.getElementById('messageBox');
        if (messageBox) {
            const alertType = type === 'danger' ? 'alert-danger' : 'alert-success';
            messageBox.innerHTML = `
                <div class="alert ${alertType} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            setTimeout(() => {
                const alert = bootstrap.Alert.getOrCreateInstance(messageBox.querySelector('.alert'));
                if (alert) {
                    alert.close();
                }
            }, 5000);
        } else {
            console.log(`Poruka (${type}): ${message}`);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.endsWith('/ormari') || path.endsWith('/ormari.html') || path === '/') {
        initOrmariPage();
    } else if (path.endsWith('/hardver') || path.endsWith('/hardver.html')) {
        initHardverPage();
    } else if (path.endsWith('/vizualizacije') || path.endsWith('/vizualizacije.html')) {
        initVizualizacijePage();
    } else if (path.includes('/ormar_detalji')) {
        initOrmarDetaljiPage();
    }
});

function initOrmariPage() {
    fetchAndDisplayOrmari();
    setupOrmariEventListeners();
}

function initHardverPage() {
    fetchAndDisplayHardver();
    populateOrmarSelect();
    setupHardverEventListeners();
}

function initVizualizacijePage() {
    fetchAndDisplayVizualizacije();
}

function initOrmarDetaljiPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const ormarId = urlParams.get('id');
    if (ormarId) {
        fetchAndDisplayOrmarDetails(ormarId);
    } else {
        console.error('Nema ID-a ormara u URL-u.');
        document.getElementById('ormar-ime').textContent = 'Greška: ID ormara nije pronađen.';
    }
}

async function fetchAndDisplayOrmari() {
    const ormariListDiv = document.getElementById('ormariList');
    if (!ormariListDiv) return;
    try {
        const response = await fetch(`${API_URL}/ormari`);
        const ormari = await response.json();
        let tableHtml = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Ime Ormara</th>
                        <th>Lokacija</th>
                        <th>Red</th>
                        <th>Stupac</th>
                        <th>Kapacitet (RU)</th>
                        <th class="text-end">Akcije</th>
                    </tr>
                </thead>
                <tbody>`;
        if (ormari.length > 0) {
            ormari.forEach(ormar => {
                tableHtml += `
                    <tr>
                        <td><a href="/ormar_detalji?id=${ormar.id}">${ormar.ime_ormara}</a></td>
                        <td>${ormar.lokacija}</td>
                        <td>${ormar.pozicija_red}</td>
                        <td>${ormar.pozicija_stupac}</td>
                        <td>${ormar.broj_rack_unita}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-info btn-edit-ormar" data-id="${ormar.id}">Uredi</button>
                            <button class="btn btn-sm btn-danger btn-delete-ormar" data-id="${ormar.id}">Obriši</button>
                        </td>
                    </tr>`;
            });
        } else {
            tableHtml += '<tr><td colspan="6" class="text-center">Nema dostupnih ormara.</td></tr>';
        }
        tableHtml += '</tbody></table>';
        ormariListDiv.innerHTML = tableHtml;
    } catch (error) {
        console.error("Greška pri dohvaćanju ormara:", error);
        ormariListDiv.innerHTML = '<div class="alert alert-danger">Nije moguće dohvatiti ormare.</div>';
    }
}

async function fetchAndDisplayHardver() {
    const hardverListDiv = document.getElementById('hardverList');
    if (!hardverListDiv) return;
    try {
        const response = await fetch(`${API_URL}/hardver`);
        const hardverLista = await response.json();
        let tableHtml = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Tip</th>
                        <th>Proizvođač / Model</th>
                        <th>Ormar</th>
                        <th>Status</th>
                        <th class="text-end">Akcije</th>
                    </tr>
                </thead>
                <tbody>`;
        if (hardverLista.length > 0) {
            hardverLista.forEach(h => {
                tableHtml += `
                    <tr>
                        <td>${h.tip_opreme}</td>
                        <td>${h.proizvodac} ${h.model}</td>
                        <td>${h.id_ormar.ime_ormara}</td>
                        <td>${h.status}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-info btn-edit-hardver" data-id="${h.id}">Uredi</button>
                            <button class="btn btn-sm btn-danger btn-delete-hardver" data-id="${h.id}">Obriši</button>
                        </td>
                    </tr>`;
            });
        } else {
            tableHtml += '<tr><td colspan="5" class="text-center">Nema dostupnog hardvera.</td></tr>';
        }
        tableHtml += '</tbody></table>';
        hardverListDiv.innerHTML = tableHtml;
    } catch (error) {
        console.error("Greška pri dohvaćanju hardvera:", error);
        hardverListDiv.innerHTML = '<div class="alert alert-danger">Nije moguće dohvatiti hardver.</div>';
    }
}

async function fetchAndDisplayOrmarDetails(ormarId) {
    const rackContainer = document.getElementById('rack-visualization');
    const detailsList = document.getElementById('equipment-details-list');
    try {
        const response = await fetch(`${API_URL}/ormar/${ormarId}`);
        if (!response.ok) throw new Error('Ormar nije pronađen.');
        const { ormar, hardver } = await response.json();

        document.getElementById('ormar-ime').textContent = ormar.ime_ormara;
        document.getElementById('rack-height-units').textContent = ormar.broj_rack_unita;

        rackContainer.innerHTML = '';
        detailsList.innerHTML = '';

        const units = {};
        for (let i = 1; i <= ormar.broj_rack_unita; i++) {
            const unitEl = document.createElement('div');
            unitEl.className = 'rack-unit';
            unitEl.textContent = i;
            unitEl.dataset.unit = i;
            units[i] = unitEl;
            rackContainer.appendChild(unitEl);
        }

        hardver.forEach(item => {
            const startUnit = item.pozicija_u_kabinetu;
            const endUnit = startUnit + item.rack_unit_size - 1;
            for (let i = startUnit; i <= endUnit; i++) {
                if (units[i]) {
                    units[i].classList.add('occupied');
                    if (i === endUnit) { 
                        units[i].textContent = `${item.proizvodac} ${item.model}`;
                        units[i].classList.add('equipment-label');
                    } else {
                        units[i].textContent = '';
                    }
                }
            }
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `<strong>${item.tip_opreme}</strong>: ${item.proizvodac} ${item.model} (Pozicija: ${item.pozicija_u_kabinetu}U, Veličina: ${item.rack_unit_size}U)`;
            detailsList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Greška pri dohvaćanju detalja ormara:", error);
        uiManager.showMessage(error.message, 'danger');
    }
}

async function fetchAndDisplayVizualizacije() {
    try {
        const [statusRes, occupancyRes] = await Promise.all([
            fetch(`${API_URL}/vizualizacije/status`),
            fetch(`${API_URL}/vizualizacije/popunjenost`)
        ]);
        const statusData = await statusRes.json();
        const occupancyData = await occupancyRes.json();
        renderStatusChart(statusData);
        renderOccupancyChart(occupancyData);
    } catch (error) {
        console.error("Greška pri dohvaćanju podataka za vizualizaciju:", error);
    }
}

function setupOrmariEventListeners() {
    const ormarModalEl = document.getElementById('ormarModal');
    if (!ormarModalEl) return;

    const ormarModal = new bootstrap.Modal(ormarModalEl);
    const ormarForm = document.getElementById('ormarForm');
    const ormarModalLabel = document.getElementById('ormarModalLabel');
    const ormarIdInput = document.getElementById('ormar-id');

    document.querySelector('button[data-bs-target="#ormarModal"]').addEventListener('click', () => {
        ormarModalLabel.textContent = 'Dodaj novi ormar';
        ormarForm.reset();
        ormarIdInput.value = '';
    });

    ormarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ormarId = ormarIdInput.value;
        const data = {
            ime_ormara: document.getElementById('ime_ormara').value,
            pozicija_red: parseInt(document.getElementById('pozicija_red').value),
            pozicija_stupac: parseInt(document.getElementById('pozicija_stupac').value),
            broj_rack_unita: parseInt(document.getElementById('broj_rack_unita').value),
            lokacija: document.getElementById('lokacija').value
        };
        const method = ormarId ? 'PUT' : 'POST';
        const url = ormarId ? `${API_URL}/ormar/${ormarId}` : `${API_URL}/ormari`;

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) throw new Error(`Greška pri ${ormarId ? 'ažuriranju' : 'spremanju'} ormara.`);
            
            uiManager.showMessage(`Ormar uspješno ${ormarId ? 'ažuriran' : 'spremljen'}.`);
            fetchAndDisplayOrmari();
            ormarModal.hide();
        } catch (error) {
            uiManager.showMessage(error.message, 'danger');
        }
    });

    document.getElementById('ormariList').addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;
        if (target.classList.contains('btn-edit-ormar')) {
            const response = await fetch(`${API_URL}/ormar/${id}`);
            const { ormar } = await response.json();
            ormarModalLabel.textContent = 'Uredi Ormar';
            ormarIdInput.value = ormar.id;
            document.getElementById('ime_ormara').value = ormar.ime_ormara;
            document.getElementById('pozicija_red').value = ormar.pozicija_red;
            document.getElementById('pozicija_stupac').value = ormar.pozicija_stupac;
            document.getElementById('broj_rack_unita').value = ormar.broj_rack_unita;
            document.getElementById('lokacija').value = ormar.lokacija;
            ormarModal.show();
        }
        if (target.classList.contains('btn-delete-ormar')) {
            // *** OVDJE JE KLJUČNA IZMJENA ***
            if (confirm('Želite li obrisati ovaj ormar? Brisanje će uspjeti samo ako je ormar prazan.')) {
                try {
                    const response = await fetch(`${API_URL}/ormar/${id}`, { method: 'DELETE' });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Došlo je do nepoznate greške.');
                    }

                    const successData = await response.json();
                    uiManager.showMessage(successData.message);
                    fetchAndDisplayOrmari();

                } catch (error) {
                    uiManager.showMessage(error.message, 'danger');
                }
            }
        }
    });
}

function setupHardverEventListeners() {
    const hardverModalEl = document.getElementById('hardverModal');
    if (!hardverModalEl) return;

    const hardverModal = new bootstrap.Modal(hardverModalEl);
    const hardverForm = document.getElementById('hardverForm');
    const hardverModalLabel = document.getElementById('hardverModalLabel');
    const hardverIdInput = document.getElementById('hardver-id');
    
    document.querySelector('button[data-bs-target="#hardverModal"]').addEventListener('click', () => {
        hardverModalLabel.textContent = 'Dodaj novi hardver';
        hardverForm.reset();
        hardverIdInput.value = '';
    });

    hardverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hardverId = hardverIdInput.value;
        const data = {
            tip_opreme: document.getElementById('tip_opreme').value,
            proizvodac: document.getElementById('proizvodac').value,
            model: document.getElementById('model').value,
            serijski_broj: parseInt(document.getElementById('serijski_broj').value),
            id_ormar: parseInt(document.getElementById('id_ormar').value),
            status: document.getElementById('status').value,
            datum_servisa: document.getElementById('datum_servisa').value ? new Date(document.getElementById('datum_servisa').value).toISOString() : null,
            pozicija_u_kabinetu: parseInt(document.getElementById('pozicija_u_kabinetu').value),
            rack_unit_size: parseInt(document.getElementById('rack_unit_size').value)
        };
        if (!hardverId) data.datum_instalacije = new Date().toISOString();

        const method = hardverId ? 'PUT' : 'POST';
        const url = hardverId ? `${API_URL}/hardver/${hardverId}` : `${API_URL}/hardver`;
        
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) throw new Error(`Greška pri ${hardverId ? 'ažuriranju' : 'spremanju'} hardvera.`);
            uiManager.showMessage(`Hardver uspješno ${hardverId ? 'ažuriran' : 'spremljen'}.`);
            fetchAndDisplayHardver();
            hardverModal.hide();
        } catch (error) {
            uiManager.showMessage(error.message, 'danger');
        }
    });

    document.getElementById('hardverList').addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;
        if (target.classList.contains('btn-edit-hardver')) {
            const response = await fetch(`${API_URL}/hardver/${id}`);
            const hardver = await response.json();
            hardverModalLabel.textContent = 'Uredi Hardver';
            hardverIdInput.value = hardver.id;
            document.getElementById('tip_opreme').value = hardver.tip_opreme;
            document.getElementById('proizvodac').value = hardver.proizvodac;
            document.getElementById('model').value = hardver.model;
            document.getElementById('serijski_broj').value = hardver.serijski_broj;
            document.getElementById('id_ormar').value = hardver.id_ormar.id;
            document.getElementById('status').value = hardver.status;
            document.getElementById('datum_servisa').value = hardver.datum_servisa ? hardver.datum_servisa.split('T')[0] : '';
            document.getElementById('pozicija_u_kabinetu').value = hardver.pozicija_u_kabinetu;
            document.getElementById('rack_unit_size').value = hardver.rack_unit_size;
            hardverModal.show();
        }
        if (target.classList.contains('btn-delete-hardver')) {
            if (confirm('Jeste li sigurni da želite obrisati ovaj komad hardvera?')) {
                 try {
                    const response = await fetch(`${API_URL}/hardver/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Brisanje nije uspjelo.');
                    uiManager.showMessage('Hardver je uspješno obrisan.');
                    fetchAndDisplayHardver();
                } catch (error) {
                    uiManager.showMessage(error.message, 'danger');
                }
            }
        }
    });
}

async function populateOrmarSelect() {
    const selectEl = document.getElementById('id_ormar');
    try {
        const response = await fetch(`${API_URL}/ormari`);
        const ormari = await response.json();
        selectEl.innerHTML = ormari.map(o => `<option value="${o.id}">${o.ime_ormara}</option>`).join('');
    } catch (error) {
        selectEl.innerHTML = '<option>Nije moguće učitati ormare</option>';
    }
}

function renderStatusChart(data) {
    const ctx = document.getElementById('statusChart')?.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
}

function renderOccupancyChart(data) {
    const ctx = document.getElementById('occupancyChart')?.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.ime_ormara),
            datasets: [{
                label: 'Zauzeto (RU)',
                data: data.map(item => item.zauzeti_rack_unita),
                backgroundColor: 'rgba(220, 53, 69, 0.7)'
            }, {
                label: 'Slobodno (RU)',
                data: data.map(item => item.ukupni_rack_unita - item.zauzeti_rack_unita),
                backgroundColor: 'rgba(40, 167, 69, 0.7)'
            }]
        },
        options: {
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
        }
    });
}
