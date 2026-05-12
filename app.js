/* ============================================
   SISTEMA DE INGRESO DE DATOS - JAVASCRIPT
   ============================================ */

// ============================================
// DATOS INICIALES (CARGAR DESDE localStorage)
// ============================================

let registros = cargarDatos();

// Referencias a graficos
let charts = {};

// ============================================
// localStorage - GUARDAR Y CARGAR
// ============================================

function guardarDatos() {
    localStorage.setItem('ingreso_datos_registros', JSON.stringify(registros));
}

function cargarDatos() {
    const datos = localStorage.getItem('ingreso_datos_registros');
    return datos ? JSON.parse(datos) : [];
}

// ============================================
// INICIALIZACION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initForm();
    renderTabla();
    actualizarDashboard();
    actualizarFiltros();
    renderGraficos();
});

// ============================================
// NAVEGACION
// ============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;

            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');

            const titulos = {
                'dashboard': 'Dashboard',
                'ingreso': 'Ingreso de Datos',
                'consultas': 'Consultas',
                'graficos': 'Graficos'
            };
            document.getElementById('page-title').textContent = titulos[section];

            if (section === 'graficos') {
                setTimeout(renderGraficosFull, 100);
            }
        });
    });
}

// ============================================
// FORMULARIO DE INGRESO
// ============================================

function initForm() {
    const form = document.getElementById('form-ingreso');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const nuevoRegistro = {
            altaReparticion: document.getElementById('input-alta-rep').value.trim() || '',
            reparticion: document.getElementById('input-rep').value.trim() || '',
            unidad: document.getElementById('input-unidad').value.trim() || '',
            destacamento: document.getElementById('input-dest').value.trim() || '',
            patrulla: document.getElementById('input-patrulla').value.trim() || '',
            alta: parseInt(document.getElementById('input-alta').value) || 0,
            media: parseInt(document.getElementById('input-media').value) || 0,
            baja: parseInt(document.getElementById('input-baja').value) || 0
        };

        registros.push(nuevoRegistro);

        // GUARDAR EN LOCALSTORAGE
        guardarDatos();

        form.reset();

        renderTabla();
        actualizarDashboard();
        actualizarFiltros();
        renderGraficos();

        alert('Registro guardado exitosamente!');
    });
}

// ============================================
// RENDERIZAR TABLA
// ============================================

function renderTabla(data = registros) {
    const tbody = document.getElementById('tbody-registros');
    tbody.innerHTML = '';

    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="10" style="text-align:center; padding: 30px; color: #999; font-style: italic;">No hay registros. Use el formulario para agregar datos.</td>`;
        tbody.appendChild(tr);
        return;
    }

    data.forEach((reg, index) => {
        const total = reg.alta + reg.media + reg.baja;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${reg.altaReparticion}</td>
            <td>${reg.reparticion}</td>
            <td>${reg.unidad}</td>
            <td>${reg.destacamento}</td>
            <td class="td-alta">${reg.alta}</td>
            <td class="td-media">${reg.media}</td>
            <td class="td-baja">${reg.baja}</td>
            <td class="td-total">${total}</td>
            <td><button class="btn btn-edit" onclick="abrirModalEditar(${index})">✏️ Editar</button></td>
            <td><button class="btn btn-delete" onclick="eliminarRegistro(${index})">🗑️ Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarRegistro(index) {
    if (confirm('Estas seguro de eliminar este registro?')) {
        registros.splice(index, 1);
        guardarDatos(); // GUARDAR EN LOCALSTORAGE
        renderTabla();
        actualizarDashboard();
        actualizarFiltros();
        renderGraficos();
    }
}

// ============================================
// DASHBOARD - ESTADISTICAS
// ============================================

function actualizarDashboard() {
    const totalAlta = registros.reduce((sum, r) => sum + r.alta, 0);
    const totalMedia = registros.reduce((sum, r) => sum + r.media, 0);
    const totalBaja = registros.reduce((sum, r) => sum + r.baja, 0);

    document.getElementById('total-alta').textContent = totalAlta;
    document.getElementById('total-media').textContent = totalMedia;
    document.getElementById('total-baja').textContent = totalBaja;
    document.getElementById('total-registros').textContent = registros.length;

    renderGraficosDashboard();
}

// ============================================
// GRAFICOS DEL DASHBOARD - TODOS COLUMNAS
// ============================================

function renderGraficosDashboard() {
    const totalAlta = registros.reduce((sum, r) => sum + r.alta, 0);
    const totalMedia = registros.reduce((sum, r) => sum + r.media, 0);
    const totalBaja = registros.reduce((sum, r) => sum + r.baja, 0);

    if (charts.col1) charts.col1.destroy();
    if (charts.col2) charts.col2.destroy();

    // GRAFICO 1: Columnas - Distribucion Total por Nivel de Confianza
    const ctx1 = document.getElementById('chart-torta').getContext('2d');
    charts.col1 = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Alta Confianza', 'Media Confianza', 'Baja Confianza'],
            datasets: [{
                label: 'Total',
                data: [totalAlta, totalMedia, totalBaja],
                backgroundColor: ['#06A77D', '#F4A261', '#E63946'],
                borderWidth: 0,
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });

    // GRAFICO 2: Columnas agrupadas - Por Alta Reparticion
    const agrupado = agruparPorAltaReparticion();
    const ctx2 = document.getElementById('chart-barras').getContext('2d');
    charts.col2 = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: agrupado.labels.length > 0 ? agrupado.labels : ['Sin datos'],
            datasets: [
                { label: 'Alta', data: agrupado.labels.length > 0 ? agrupado.alta : [0], backgroundColor: '#06A77D', borderRadius: 4 },
                { label: 'Media', data: agrupado.labels.length > 0 ? agrupado.media : [0], backgroundColor: '#F4A261', borderRadius: 4 },
                { label: 'Baja', data: agrupado.labels.length > 0 ? agrupado.baja : [0], backgroundColor: '#E63946', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================
// GRAFICOS COMPLETOS - TORTA + PORCENTAJE
// ============================================

function renderGraficosFull() {
    const totalAlta = registros.reduce((sum, r) => sum + r.alta, 0);
    const totalMedia = registros.reduce((sum, r) => sum + r.media, 0);
    const totalBaja = registros.reduce((sum, r) => sum + r.baja, 0);
    const totalGeneral = totalAlta + totalMedia + totalBaja;

    // Calcular porcentajes
    const pctAlta = totalGeneral > 0 ? ((totalAlta / totalGeneral) * 100).toFixed(1) : 0;
    const pctMedia = totalGeneral > 0 ? ((totalMedia / totalGeneral) * 100).toFixed(1) : 0;
    const pctBaja = totalGeneral > 0 ? ((totalBaja / totalGeneral) * 100).toFixed(1) : 0;

    // TORTA - Distribucion Total
    if (charts.tortaFull) charts.tortaFull.destroy();
    charts.tortaFull = new Chart(document.getElementById('chart-torta-full'), {
        type: 'pie',
        data: {
            labels: ['Alta Confianza', 'Media Confianza', 'Baja Confianza'],
            datasets: [{
                data: [totalAlta, totalMedia, totalBaja],
                backgroundColor: ['#06A77D', '#F4A261', '#E63946'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const pct = totalGeneral > 0 ? ((value / totalGeneral) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${value} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // PORCENTAJE - Barras horizontales con porcentajes
    if (charts.porcentajeFull) charts.porcentajeFull.destroy();
    charts.porcentajeFull = new Chart(document.getElementById('chart-porcentaje-full'), {
        type: 'bar',
        data: {
            labels: ['Alta Confianza', 'Media Confianza', 'Baja Confianza'],
            datasets: [{
                label: 'Porcentaje (%)',
                data: [pctAlta, pctMedia, pctBaja],
                backgroundColor: ['#06A77D', '#F4A261', '#E63946'],
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: function(value) { return value + '%'; } }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

function renderGraficos() {
    renderGraficosDashboard();
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function agruparPorAltaReparticion() {
    const grupos = {};
    registros.forEach(r => {
        if (!grupos[r.altaReparticion]) {
            grupos[r.altaReparticion] = { alta: 0, media: 0, baja: 0 };
        }
        grupos[r.altaReparticion].alta += r.alta;
        grupos[r.altaReparticion].media += r.media;
        grupos[r.altaReparticion].baja += r.baja;
    });

    return {
        labels: Object.keys(grupos),
        alta: Object.values(grupos).map(g => g.alta),
        media: Object.values(grupos).map(g => g.media),
        baja: Object.values(grupos).map(g => g.baja)
    };
}

// ============================================
// FILTROS / CONSULTAS
// ============================================

function actualizarFiltros() {
    const altaReps = [...new Set(registros.map(r => r.altaReparticion))].filter(r => r !== '');
    const reps = [...new Set(registros.map(r => r.reparticion))].filter(r => r !== '');
    const dests = [...new Set(registros.map(r => r.destacamento))].filter(r => r !== '');

    llenarSelect('filtro-alta-rep', altaReps);
    llenarSelect('filtro-rep', reps);
    llenarSelect('filtro-dest', dests);

    aplicarFiltros();
}

function llenarSelect(id, opciones) {
    const select = document.getElementById(id);
    const valorActual = select.value;
    select.innerHTML = '<option value="">Todas</option>';
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.textContent = op;
        select.appendChild(option);
    });
    select.value = valorActual;
}

function aplicarFiltros() {
    const filtroAlta = document.getElementById('filtro-alta-rep').value;
    const filtroRep = document.getElementById('filtro-rep').value;
    const filtroDest = document.getElementById('filtro-dest').value;
    const filtroConf = document.getElementById('filtro-confianza').value;

    let filtrados = registros.filter(r => {
        if (filtroAlta && r.altaReparticion !== filtroAlta) return false;
        if (filtroRep && r.reparticion !== filtroRep) return false;
        if (filtroDest && r.destacamento !== filtroDest) return false;
        if (filtroConf === 'alta' && r.alta === 0) return false;
        if (filtroConf === 'media' && r.media === 0) return false;
        if (filtroConf === 'baja' && r.baja === 0) return false;
        return true;
    });

    renderTablaConsultas(filtrados);
}

function limpiarFiltros() {
    document.getElementById('filtro-alta-rep').value = '';
    document.getElementById('filtro-rep').value = '';
    document.getElementById('filtro-dest').value = '';
    document.getElementById('filtro-confianza').value = '';
    aplicarFiltros();
}

function renderTablaConsultas(data) {
    const tbody = document.getElementById('tbody-consultas');
    tbody.innerHTML = '';

    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" style="text-align:center; padding: 30px; color: #999; font-style: italic;">No hay registros que coincidan con los filtros.</td>`;
        tbody.appendChild(tr);
        document.getElementById('resultado-contador').textContent = 'Se encontraron 0 registro(s)';
        return;
    }

    data.forEach(reg => {
        const total = reg.alta + reg.media + reg.baja;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${reg.altaReparticion}</td>
            <td>${reg.reparticion}</td>
            <td>${reg.unidad}</td>
            <td>${reg.destacamento}</td>
            <td class="td-alta">${reg.alta}</td>
            <td class="td-media">${reg.media}</td>
            <td class="td-baja">${reg.baja}</td>
            <td class="td-total">${total}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('resultado-contador').textContent = 
        `Se encontraron ${data.length} registro(s)`;
}

// ============================================
// EXPORTAR A EXCEL (XLS)
// ============================================

function exportarExcel() {
    if (registros.length === 0) {
        alert('No hay registros para exportar.');
        return;
    }

    // Crear tabla HTML para exportar
    let tablaHTML = '<table border="1">';
    tablaHTML += '<thead><tr>';
    tablaHTML += '<th>Alta Reparticion</th>';
    tablaHTML += '<th>Reparticion</th>';
    tablaHTML += '<th>Unidad</th>';
    tablaHTML += '<th>Destacamento</th>';
    tablaHTML += '<th>Patrulla</th>';
    tablaHTML += '<th>Alta Confianza</th>';
    tablaHTML += '<th>Media Confianza</th>';
    tablaHTML += '<th>Baja Confianza</th>';
    tablaHTML += '<th>Total</th>';
    tablaHTML += '</tr></thead><tbody>';

    registros.forEach(r => {
        const total = r.alta + r.media + r.baja;
        tablaHTML += '<tr>';
        tablaHTML += `<td>${r.altaReparticion}</td>`;
        tablaHTML += `<td>${r.reparticion}</td>`;
        tablaHTML += `<td>${r.unidad}</td>`;
        tablaHTML += `<td>${r.destacamento}</td>`;
        tablaHTML += `<td>${r.alta}</td>`;
        tablaHTML += `<td>${r.media}</td>`;
        tablaHTML += `<td>${r.baja}</td>`;
        tablaHTML += `<td>${total}</td>`;
        tablaHTML += '</tr>';
    });

    tablaHTML += '</tbody></table>';

    // Crear plantilla Excel con la tabla
    const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <style>
                table { border-collapse: collapse; }
                th { background-color: #2A9D8F; color: white; font-weight: bold; padding: 8px; border: 1px solid #000; }
                td { padding: 6px; border: 1px solid #ccc; }
                tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            ${tablaHTML}
        </body>
        </html>
    `;

    // Crear blob y descargar como XLS
    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'INGRESO_DE_DATOS_' + new Date().toISOString().slice(0,10) + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('Archivo Excel (.xls) descargado!');
}

// ============================================
// FUNCIONES EDITAR REGISTRO
// ============================================

function abrirModalEditar(index) {
    const reg = registros[index];

    document.getElementById('edit-index').value = index;
    document.getElementById('edit-alta-rep').value = reg.altaReparticion;
    document.getElementById('edit-rep').value = reg.reparticion;
    document.getElementById('edit-unidad').value = reg.unidad;
    document.getElementById('edit-dest').value = reg.destacamento;
    document.getElementById('edit-patrulla').value = reg.patrulla || '';
    document.getElementById('edit-alta').value = reg.alta;
    document.getElementById('edit-media').value = reg.media;
    document.getElementById('edit-baja').value = reg.baja;

    document.getElementById('modal-editar').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal-editar').classList.remove('active');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-editar');
    if (e.target === modal) {
        cerrarModal();
    }
});

// Manejar envio del formulario de edicion
document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('form-editar');
    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();

            const index = parseInt(document.getElementById('edit-index').value);

            registros[index] = {
                altaReparticion: document.getElementById('edit-alta-rep').value.trim() || '',
                reparticion: document.getElementById('edit-rep').value.trim() || '',
                unidad: document.getElementById('edit-unidad').value.trim() || '',
                destacamento: document.getElementById('edit-dest').value.trim() || '',
                patrulla: document.getElementById('edit-patrulla').value.trim() || '',
                alta: parseInt(document.getElementById('edit-alta').value) || 0,
                media: parseInt(document.getElementById('edit-media').value) || 0,
                baja: parseInt(document.getElementById('edit-baja').value) || 0
            };

            // Guardar en localStorage
            guardarDatos();

            cerrarModal();

            // Actualizar todo
            renderTabla();
            actualizarDashboard();
            actualizarFiltros();
            renderGraficos();

            alert('Registro actualizado exitosamente!');
        });
    }
});
