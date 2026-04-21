// ── Estado global ─────────────────────────────────────────────────────────────
let workbook = null;
let datosClientes = [];

// ── Mostrar nombre del archivo seleccionado ───────────────────────────────────
document.getElementById('excelInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  document.getElementById('file-name-label').textContent =
    file ? file.name : 'Ningún archivo seleccionado';
});

// ── procesarExcel ─────────────────────────────────────────────────────────────
function procesarExcel(){
  const fileInput = document.getElementById("excelInput");
  if(!fileInput.files.length){alert("Seleccioná un Excel");return;}

  const reader = new FileReader();
  reader.onload = e=>{
    const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows  = XLSX.utils.sheet_to_json(sheet,{ header:1 });

    // Mapeo directo de columnas
    datosClientes = rows.slice(1).map(r=>({
      "Razon Social": r[0] || "",
      "Usuario": r[1] || "",
      "Mail": r[2] || "",
      "Teléfono": r[3] || "",
      "Mail enviado": r[4] || "",
      "Fecha del envio": r[5] || ""
    }));

    renderPreview(datosClientes);

    // 👉 Descargar deshabilitado al inicio
    document.getElementById("btnDescargar").disabled = true;
    document.getElementById("btnEnviar").disabled = false;
  };
  reader.readAsArrayBuffer(fileInput.files[0]);
}



// ── Renderizar tabla de preview ───────────────────────────────────────────────
function renderPreview(arr){
  const div = document.getElementById("preview");
  if(!arr.length){div.innerHTML="";return;}

  let html = "<table><tr>";
  Object.keys(arr[0]).forEach(c=> html+=`<th>${c}</th>`);
  html+="</tr>";
  arr.slice(0,20).forEach(r=>{
    html+="<tr>";
    Object.keys(r).forEach(c=> html+=`<td>${r[c]}</td>`);
    html+="</tr>";
  });
  html+="</table>";
  if(arr.length>20) html+=`<p class="note">Mostrando 20 de ${arr.length} filas</p>`;
  div.innerHTML = html;
}

// ── descargarExcel ────────────────────────────────────────────────────────────
function descargarExcel(){
  // Me aseguro que la variable siempre sea un array
  if(!Array.isArray(datosClientes) || datosClientes.length === 0){
    alert("No hay datos para descargar");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(datosClientes,{ header:[
    "Razon Social","Usuario","Mail","Teléfono","Mail enviado","Fecha del envio"
  ]});
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb,"clientes_actualizados.xlsx");
}

// ── enviarMails ───────────────────────────────────────────────────────────────
function enviarMails() {
  const seleccionados = datosClientes
  .filter(r => {
    // 1) Descartar si no hay razón social
    //if (!r["Razon Social"] || r["Razon Social"].trim() === "") return false;

    // 2) Descartar si ya se envió un mail hace menos de 10 días
    const mailEnviado = (r["Mail enviado"] || "").toString().trim().toUpperCase();
    if (mailEnviado === "SI" /*&& diffDias(r["Fecha del envio"]) < 1000*/) {
      return false;
    }

    // 3) Caso contrario, mantener
    return true;
  })
  // 4) Solo hasta 50 clientes
  .slice(0, 50);

  if (!seleccionados.length) {
    alert("No hay datos para enviar");
    return;
  }

  mostrarOverlay();

  fetch("/send-emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(seleccionados)
  })
    .then(r => r.json())
    .then(resp => {
      alert(`Mails enviados: ${resp.resultados?.length || 0}`);
      
      aplicarStatus(resp); // ✅ pisa solo los que tengan status ok
      renderPreview(datosClientes);
      document.getElementById("btnDescargar").disabled = false;
    })
    .catch(err => {
      alert("Error al enviar mails");
      console.error(err);
    })
    .finally(() => {
      ocultarOverlay();
    });
}

// ── Overlay ───────────────────────────────────────────────────────────────────
function mostrarOverlay(){ document.getElementById("overlay").style.display = "flex"; }
function ocultarOverlay(){ document.getElementById("overlay").style.display = "none"; }


function animarBarra() {
  const bar = document.getElementById('overlay-bar');
  let w = 0;
  const iv = setInterval(() => {
    w += Math.random() * 3;
    if (w >= 90) { clearInterval(iv); w = 90; }
    bar.style.width = w + '%';
  }, 400);
}

/* --------- 1) Aplicar status devuelto por backend --------- */
function aplicarStatus(resp) {
  if (!Array.isArray(resp.resultados)) return;

  const fecha = resp.fecha_de_envio || new Date().toLocaleDateString("es-AR");

  // mails que salieron OK
  const mailsOk = new Set(
    resp.resultados
      .filter(s => s.status === "ok")
      .map(s => s.mail.trim().toLowerCase())   // 👈 en backend es `mail`, no `Mail`
  );

  // Actualizo array de clientes
  datosClientes = datosClientes.map(c => {
    if (mailsOk.has(c.Mail.trim().toLowerCase())) {
      return {
        ...c,
        "Mail enviado": "SI",
        "Fecha del envio": fecha
      };
    }
    return c;
  });
}


/* --------- Utilidad: diferencia de días --------- */
function diffDias(fechaStr) {
  if (!fechaStr) return Infinity;

  // Si tiene coma, separar fecha y hora
  const soloFecha = fechaStr.split(",")[0].trim(); // "6/9/2025"
  const partes = soloFecha.split("/"); // [6, 9, 2025]

  if (partes.length < 3) return Infinity;

  const [d, m, y] = partes.map(Number);
  const fecha = new Date(y, m - 1, d); // crea bien la fecha

  if (isNaN(fecha.getTime())) return Infinity;

  const hoy = new Date();
  const diff = (hoy - fecha) / (1000 * 60 * 60 * 24);
  return diff;
}

// ── Resultados ────────────────────────────────────────────────────────────────
function mostrarResultados(resultados) {
  const card = document.getElementById('results-card');
  const list = document.getElementById('results-list');

  list.innerHTML = '';
  resultados.forEach(r => {
    const item = document.createElement('div');
    item.className = `result-item ${r.status === 'ok' ? 'ok' : 'error'}`;
    item.innerHTML = `
      <span class="result-mail">${r.mail}</span>
      <span class="result-status">${r.status === 'ok' ? '✓ Enviado' : '✗ ' + (r.error || 'Error')}</span>
    `;
    list.appendChild(item);
  });

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}



