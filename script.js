// Datos globales
let fechaActual = new Date();
let notas = JSON.parse(localStorage.getItem('notasAgendaPersonal')) || {};
let fechaSeleccionada = null;
let notaABorrar = null;

// Funciones de formato
function formatearFechaISO(fecha) {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

function formatearFechaDigital(fecha) {
  const d = fecha.getDate();
  const m = fecha.getMonth() + 1;
  const y = fecha.getFullYear();
  return `${d}-${m}-${y}`;
}

// Inicializar al cargar
window.onload = function() {
  // Asignar eventos
  document.getElementById('btn-mes-anterior').onclick = () => cambiarMes(-1);
  document.getElementById('btn-mes-siguiente').onclick = () => cambiarMes(1);
  document.getElementById('btn-nueva').onclick = () => document.getElementById('texto').focus();
  document.getElementById('btn-agregar').onclick = guardarNota;
  document.getElementById('btn-confirm-yes').onclick = () => confirmarBorrado(true);
  document.getElementById('btn-confirm-no').onclick = () => confirmarBorrado(false);

  actualizarCalendario();
  mostrarNotas();
};

// === CALENDARIO ===
function diasEnMes(mes, año) {
  return new Date(año, mes + 1, 0).getDate();
}

function primerDiaMes(mes, año) {
  return new Date(año, mes, 1).getDay();
}

function actualizarCalendario() {
  const año = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  document.getElementById('mes-actual').textContent = 
    nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  const diasMes = diasEnMes(mes, año);
  const primerDia = primerDiaMes(mes, año);
  const hoy = new Date();
  const hoyISO = formatearFechaISO(hoy);

  let html = '';

  const diasMesAnterior = diasEnMes(mes - 1, año);
  for (let i = 0; i < primerDia; i++) {
    html += `<div class="calendar-day other-month">${diasMesAnterior - primerDia + i + 1}</div>`;
  }

  for (let dia = 1; dia <= diasMes; dia++) {
    const fecha = new Date(año, mes, dia);
    const fechaISO = formatearFechaISO(fecha);
    const esHoy = fechaISO === hoyISO;
    const tieneNotas = notas[fechaISO] && notas[fechaISO].length > 0;
    const esSeleccionado = fechaSeleccionada && formatearFechaISO(fechaSeleccionada) === fechaISO;
    let clases = 'calendar-day';
    if (esHoy) clases += ' today';
    if (tieneNotas) clases += ' has-notes';
    if (esSeleccionado) clases += ' selected';
    html += `<div class="${clases}" onclick="seleccionarFecha(${año}, ${mes}, ${dia})">${dia}</div>`;
  }

  const totalCeldas = 42;
  const celdasLlenas = primerDia + diasMes;
  for (let i = 1; i <= totalCeldas - celdasLlenas; i++) {
    html += `<div class="calendar-day other-month">${i}</div>`;
  }

  document.getElementById('calendario').innerHTML = html;
  actualizarBotonFecha();
}

function cambiarMes(direccion) {
  fechaActual.setMonth(fechaActual.getMonth() + direccion);
  actualizarCalendario();
}

function seleccionarFecha(año, mes, dia) {
  fechaSeleccionada = new Date(año, mes, dia);
  actualizarCalendario();
  actualizarBotonFecha();
}

function actualizarBotonFecha() {
  const btn = document.getElementById('btn-fecha');
  if (fechaSeleccionada) {
    btn.textContent = formatearFechaDigital(fechaSeleccionada);
    btn.disabled = false;
  } else {
    btn.textContent = "Ninguna fecha";
    btn.disabled = true;
  }
}

// === NOTAS ===
function guardarNota() {
  const texto = document.getElementById('texto').value.trim();
  if (!fechaSeleccionada) {
    alert("Selecciona una fecha en el calendario.");
    return;
  }
  if (!texto) {
    alert("Escribe algo en la nota.");
    return;
  }

  const fechaISO = formatearFechaISO(fechaSeleccionada);
  if (!notas[fechaISO]) notas[fechaISO] = [];
  notas[fechaISO].push(texto);
  localStorage.setItem('notasAgendaPersonal', JSON.stringify(notas));

  document.getElementById('texto').value = '';
  mostrarNotas();
}

function mostrarNotas() {
  const contenedor = document.getElementById('lista-notas');
  let todas = [];
  for (const fechaISO in notas) {
    if (Array.isArray(notas[fechaISO])) {
      notas[fechaISO].forEach((texto, idx) => {
        todas.push({ fechaISO, texto, idx });
      });
    }
  }

  todas.sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO));

  if (todas.length === 0) {
    contenedor.innerHTML = '<p style="text-align:center;color:#888;">No hay anotaciones.</p>';
    return;
  }

  let html = '';
  todas.forEach(item => {
    const fechaObj = new Date(item.fechaISO);
    const fechaBonita = fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    html += `
      <div class="nota">
        <div class="nota-header">${fechaBonita}</div>
        <div>${item.texto.replace(/\n/g, '<br>')}</div>
        <div class="acciones">
          <button class="btn-edit" onclick="editarNota('${item.fechaISO}', ${item.idx})">✏️ Editar</button>
          <button class="btn-delete" onclick="mostrarConfirmacion('${item.fechaISO}', ${item.idx})">🗑️ Borrar</button>
        </div>
      </div>
    `;
  });

  contenedor.innerHTML = html;
}

function editarNota(fechaISO, idx) {
  const textoActual = notas[fechaISO][idx];
  const nuevo = prompt("Edita tu nota:", textoActual);
  if (nuevo !== null && nuevo.trim() !== "") {
    notas[fechaISO][idx] = nuevo.trim();
    localStorage.setItem('notasAgendaPersonal', JSON.stringify(notas));
    mostrarNotas();
    actualizarCalendario();
  }
}

function mostrarConfirmacion(fecha, idx) {
  notaABorrar = { fecha, idx };
  document.getElementById('overlayConfirm').style.display = 'flex';
}

function confirmarBorrado(confirmado) {
  document.getElementById('overlayConfirm').style.display = 'none';
  if (!confirmado) return;

  const { fecha, idx } = notaABorrar;
  if (notas[fecha] && notas[fecha][idx] !== undefined) {
    notas[fecha].splice(idx, 1);
    if (notas[fecha].length === 0) delete notas[fecha];
    localStorage.setItem('notasAgendaPersonal', JSON.stringify(notas));
    mostrarNotas();
    actualizarCalendario();
  }
  notaABorrar = null;
}