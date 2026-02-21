// ═══════════════════════════════════════════════════════
// juego.js — BioVilla: La Célula Viva
// Motor del juego: navegación, diálogos, quiz, boss, mapa
// ═══════════════════════════════════════════════════════

// ── ESTADO GLOBAL ──
const estado = {
  pantalla: 'inicio',
  introIndex: 0,
  dialogoIndex: 0,
  dialogoActual: [],
  zonaActual: null,
  cinthiaIndex: 0,
  atp: 0,
  atpMax: 100,
  zonasCompletadas: new Set(),
  bossHP: 3,
  bossFase: 0,
  quizPendiente: null,
  quizResuelta: false
};

// ── UTILIDADES ──
function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  const pantalla = document.getElementById('pantalla-' + id);
  if (pantalla) {
    pantalla.classList.add('activa');
    estado.pantalla = id;
  }
}

function actualizarHUD() {
  const pct = Math.min((estado.atp / estado.atpMax) * 100, 100);
  document.getElementById('barra-atp').style.width = pct + '%';
  document.getElementById('atp-val').textContent = estado.atp;
}

function sumarATP(cantidad) {
  estado.atp = Math.min(estado.atp + cantidad, estado.atpMax);
  actualizarHUD();
  // efecto visual rápido
  const barra = document.getElementById('barra-atp');
  barra.style.boxShadow = '0 0 20px #39ff14';
  setTimeout(() => barra.style.boxShadow = '0 0 8px #39ff14', 600);
}

function escribirTexto(elementId, texto, velocidad = 20) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '';
  let i = 0;
  const intervalo = setInterval(() => {
    el.textContent += texto[i];
    i++;
    if (i >= texto.length) clearInterval(intervalo);
  }, velocidad);
}

// ── ESTRELLAS FONDO ──
function generarEstrellas() {
  const contenedor = document.getElementById('estrellas');
  if (!contenedor) return;
  for (let i = 0; i < 120; i++) {
    const star = document.createElement('div');
    const size = Math.random() < 0.2 ? 3 : (Math.random() < 0.5 ? 2 : 1);
    star.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      background: #fff;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      opacity: ${Math.random() * 0.7 + 0.2};
      animation: parpadeo ${(Math.random() * 3 + 1).toFixed(1)}s ${(Math.random() * 2).toFixed(1)}s step-end infinite;
    `;
    contenedor.appendChild(star);
  }
}

// ── MAPA CANVAS ──
function dibujarMapa() {
  const canvas = document.getElementById('mapa-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width  = canvas.offsetWidth  || window.innerWidth;
  canvas.height = canvas.offsetHeight || (window.innerHeight - 48);

  const W = canvas.width;
  const H = canvas.height;

  // ─ Fondo base ─
  const fondoGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
  fondoGrad.addColorStop(0, '#0d1525');
  fondoGrad.addColorStop(1, '#050810');
  ctx.fillStyle = fondoGrad;
  ctx.fillRect(0, 0, W, H);

  // ─ Grid de tierra pixelado ─
  ctx.strokeStyle = 'rgba(30,50,80,0.4)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ─ Caminos ─
  function dibujarCamino(x1, y1, x2, y2) {
    ctx.strokeStyle = 'rgba(100,130,180,0.3)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'square';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,180,220,0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
  }

  const cx = W * 0.49, cy = H * 0.46;

  // caminos desde el centro
  dibujarCamino(cx, cy, W * 0.69, H * 0.35); // → mitocondria
  dibujarCamino(cx, cy, W * 0.26, H * 0.49); // ← cinthia
  dibujarCamino(cx, cy, W * 0.72, H * 0.62); // → redox
  dibujarCamino(cx, cy, W * 0.18, H * 0.18); // ↗ danger

  // ─ Zona central / núcleo ─
  function hexagono(x, y, r, color1, color2) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + r * Math.cos(ang);
      const py = y + r * Math.sin(ang);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color1;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Núcleo central
  hexagono(cx, cy, Math.min(W, H) * 0.09, 'rgba(0,212,255,0.6)', 'rgba(0,80,120,0.1)');
  // anillos decorativos
  for (let ring = 1; ring <= 3; ring++) {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(W,H) * 0.09 + ring * 18, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,212,255,${0.12 - ring*0.03})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ─ Casas / orgánulos pixel ─
  function casaPixel(x, y, w, h, colorTecho, colorMuro) {
    // muro
    ctx.fillStyle = colorMuro;
    ctx.fillRect(x - w/2, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - w/2, y, w, h);
    // techo
    ctx.fillStyle = colorTecho;
    ctx.beginPath();
    ctx.moveTo(x - w/2 - 4, y);
    ctx.lineTo(x, y - h * 0.6);
    ctx.lineTo(x + w/2 + 4, y);
    ctx.closePath();
    ctx.fill();
    // ventana
    ctx.fillStyle = 'rgba(255,220,80,0.5)';
    ctx.fillRect(x - 5, y + h * 0.2, 10, 10);
  }

  // Casas alrededor del núcleo
  const casas = [
    { x: cx - W*0.12, y: cy - H*0.05, colorT: '#1a3a5c', colorM: '#0d2035' },
    { x: cx + W*0.10, y: cy - H*0.12, colorT: '#1a4a2a', colorM: '#0d2015' },
    { x: cx + W*0.13, y: cy + H*0.10, colorT: '#3a2a1a', colorM: '#201510' },
    { x: cx - W*0.14, y: cy + H*0.08, colorT: '#2a1a3a', colorM: '#150d20' },
    { x: cx + W*0.00, y: cy + H*0.18, colorT: '#1a3a3a', colorM: '#0d2020' },
  ];
  casas.forEach(c => casaPixel(c.x, c.y, 36, 28, c.colorT, c.colorM));

  // ─ Molinos de viento (energía) ─
  function molino(x, y, color) {
    // torre
    ctx.fillStyle = '#1a2a40';
    ctx.fillRect(x - 4, y - 30, 8, 30);
    // aspas
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const t = Date.now() / 1000;
    for (let i = 0; i < 3; i++) {
      const ang = (Math.PI * 2 / 3) * i + t * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y - 30);
      ctx.lineTo(x + Math.cos(ang) * 22, y - 30 + Math.sin(ang) * 22);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 30, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  molino(W * 0.30, H * 0.25, '#39ff14');
  molino(W * 0.36, H * 0.22, '#00d4ff');
  molino(W * 0.70, H * 0.72, '#ffd700');

  // ─ Árboles pixel ─
  function arbol(x, y, color) {
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(x - 3, y, 6, 14);
    ctx.fillStyle = color;
    ctx.fillRect(x - 10, y - 16, 20, 18);
    ctx.fillRect(x - 7, y - 28, 14, 14);
    ctx.fillRect(x - 4, y - 36, 8, 10);
  }
  const arbolesPos = [
    { x: W*0.08, y: H*0.40, c: '#1a4a1a' },
    { x: W*0.12, y: H*0.50, c: '#1a4a1a' },
    { x: W*0.85, y: H*0.35, c: '#2a4a2a' },
    { x: W*0.88, y: H*0.50, c: '#1a4a1a' },
    { x: W*0.50, y: H*0.75, c: '#1a4a1a' },
    { x: W*0.55, y: H*0.80, c: '#2a4a2a' },
  ];
  arbolesPos.forEach(a => arbol(a.x, a.y, a.c));

  // ─ Zona Danger: niebla roja ─
  const dangerGrad = ctx.createRadialGradient(W*0.17, H*0.17, 0, W*0.17, H*0.17, W*0.12);
  dangerGrad.addColorStop(0, 'rgba(150,0,0,0.35)');
  dangerGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = dangerGrad;
  ctx.fillRect(0, 0, W, H);

  // ─ Paneles solares zona REDOX ─
  function panel(x, y) {
    ctx.fillStyle = '#1a1060';
    ctx.fillRect(x, y, 30, 20);
    ctx.strokeStyle = '#3030a0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 30, 20);
    ctx.strokeRect(x + 10, y, 0, 20);
    ctx.strokeRect(x, y + 10, 30, 0);
    // brillo
    ctx.fillStyle = 'rgba(100,100,255,0.2)';
    ctx.fillRect(x + 2, y + 2, 6, 6);
  }
  panel(W*0.68, H*0.68);
  panel(W*0.72, H*0.65);
  panel(W*0.65, H*0.65);

  // ─ Texto decorativo zonas ─
  ctx.font = `bold ${Math.max(9, W * 0.009)}px 'Press Start 2P', monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,212,255,0.4)';
  ctx.fillText('BIOVILLA', cx, H * 0.90);

  // Loop para animación de molinos
  requestAnimationFrame(dibujarMapa);
}

// ── INICIO DEL JUEGO ──
function iniciarJuego() {
  estado.introIndex = 0;
  mostrarPantalla('intro');
  mostrarIntroFrame();
}

function mostrarIntroFrame() {
  const frame = INTRO_SECUENCIAS[estado.introIndex];
  if (!frame) {
    // Ir al mapa
    mostrarPantalla('mapa');
    dibujarMapa();
    return;
  }
  document.getElementById('retrato-intro').textContent = frame.retrato;
  document.getElementById('nombre-npc').textContent = frame.nombre;
  escribirTexto('texto-intro', frame.texto);
}

function siguienteIntro() {
  estado.introIndex++;
  if (estado.introIndex >= INTRO_SECUENCIAS.length) {
    mostrarPantalla('mapa');
    dibujarMapa();
  } else {
    mostrarIntroFrame();
  }
}

// ── MAPA ──
function entrarZona(zonaId) {
  const zona = ZONAS[zonaId];
  if (!zona) return;
  estado.zonaActual = zonaId;
  estado.dialogoIndex = 0;
  estado.dialogoActual = zona.dialogos;
  estado.quizResuelta = estado.zonasCompletadas.has(zonaId);

  // Zona boss requiere haber completado al menos 2 zonas
  if (zonaId === 'boss') {
    if (estado.zonasCompletadas.size < 2) {
      mostrarMensajeTemporal("⚠ Necesitas completar más zonas antes de enfrentar al Boss.");
      return;
    }
    iniciarBoss();
    return;
  }

  document.getElementById('escena-fondo').style.background = zona.fondo;
  document.getElementById('opciones-dialogo').innerHTML = '';
  document.getElementById('btn-dialogo-sig').style.display = 'block';
  document.getElementById('hud-zona').textContent = '📍 ' + (zonaId === 'nucleo' ? 'Núcleo Central' : zonaId === 'mitocondria' ? 'Mitocondria' : 'REDOX Lab');

  mostrarPantalla('dialogo');
  mostrarDialogoActual();
}

function hablarConCinthia() {
  estado.dialogoActual = DIALOGOS_CINTHIA;
  estado.dialogoIndex = estado.cinthiaIndex % DIALOGOS_CINTHIA.length;
  estado.zonaActual = null;
  document.getElementById('escena-fondo').style.background = 'linear-gradient(135deg, #1a1400 0%, #2a2000 100%)';
  document.getElementById('opciones-dialogo').innerHTML = '';
  document.getElementById('btn-dialogo-sig').style.display = 'block';
  document.getElementById('hud-zona').textContent = '📍 Miss Cinthia';
  mostrarPantalla('dialogo');
  mostrarDialogoActual();
  estado.cinthiaIndex++;
}

function mostrarDialogoActual() {
  const frame = estado.dialogoActual[estado.dialogoIndex];
  if (!frame) {
    finDialogo();
    return;
  }
  document.getElementById('retrato-npc').textContent = frame.retrato;
  document.getElementById('nombre-npc').textContent = frame.nombre;
  escribirTexto('texto-dialogo', frame.texto, 18);
}

function siguienteDialogo() {
  estado.dialogoIndex++;
  if (estado.dialogoIndex >= estado.dialogoActual.length) {
    finDialogo();
  } else {
    mostrarDialogoActual();
  }
}

function finDialogo() {
  if (estado.zonaActual && !estado.quizResuelta) {
    // Mostrar quiz
    const zona = ZONAS[estado.zonaActual];
    lanzarQuiz(zona.quiz, () => {
      estado.zonasCompletadas.add(estado.zonaActual);
      // Marcar zona visualmente
      const hotspot = document.getElementById('zona-' + estado.zonaActual);
      if (hotspot) hotspot.classList.add('completada');
      volverAlMapa();
    });
  } else {
    volverAlMapa();
  }
}

function volverAlMapa() {
  mostrarPantalla('mapa');
  document.getElementById('hud-zona').textContent = '📍 BioVilla';
}

// ── QUIZ ──
function lanzarQuiz(quizData, callbackOk) {
  estado.quizPendiente = { data: quizData, callback: callbackOk };
  estado.quizResuelta = false;

  document.getElementById('quiz-icono').textContent = quizData.icono;
  document.getElementById('quiz-titulo').textContent = quizData.titulo;
  document.getElementById('quiz-pregunta').textContent = quizData.pregunta;

  const opcionesEl = document.getElementById('quiz-opciones');
  opcionesEl.innerHTML = '';
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-feedback').className = 'quiz-feedback';

  // Mezclar opciones
  const opciones = [...quizData.opciones].sort(() => Math.random() - 0.5);
  opciones.forEach(op => {
    const btn = document.createElement('button');
    btn.className = 'btn-quiz-op';
    btn.textContent = op.texto;
    btn.onclick = () => responderQuiz(op, quizData, callbackOk, opcionesEl);
    opcionesEl.appendChild(btn);
  });

  mostrarPantalla('quiz');
}

function responderQuiz(opcion, quizData, callbackOk, opcionesEl) {
  if (estado.quizResuelta) return;
  estado.quizResuelta = true;

  // Deshabilitar botones
  opcionesEl.querySelectorAll('.btn-quiz-op').forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === opcion.texto) {
      btn.classList.add(opcion.correcto ? 'correcto' : 'incorrecto');
    }
    // Mostrar la correcta
    if (!opcion.correcto) {
      const opCorrecta = quizData.opciones.find(o => o.correcto);
      if (btn.textContent === opCorrecta.texto) btn.classList.add('correcto');
    }
  });

  const feedback = document.getElementById('quiz-feedback');
  if (opcion.correcto) {
    feedback.textContent = quizData.feedbackOk;
    feedback.className = 'quiz-feedback ok';
    sumarATP(quizData.atpRecompensa || 20);
    setTimeout(() => {
      if (callbackOk) callbackOk();
    }, 2500);
  } else {
    feedback.textContent = quizData.feedbackFail;
    feedback.className = 'quiz-feedback fail';
    setTimeout(() => {
      // Permitir reintentar
      estado.quizResuelta = false;
      feedback.textContent = '';
      feedback.className = 'quiz-feedback';
      opcionesEl.querySelectorAll('.btn-quiz-op').forEach(btn => {
        btn.disabled = false;
        btn.className = 'btn-quiz-op';
      });
    }, 3000);
  }
}

// ── BOSS ──
function iniciarBoss() {
  estado.bossHP = BOSS_DATA.hpTotal;
  estado.bossFase = 0;
  actualizarBarraBoss();
  mostrarPantalla('boss');
  mostrarIntroduccionBoss(0);
}

function mostrarIntroduccionBoss(idx) {
  const intro = BOSS_DATA.introduccion[idx];
  if (!intro) {
    // Empezar preguntas
    setTimeout(() => lanzarPreguntaBoss(0), 500);
    return;
  }
  document.getElementById('boss-texto').textContent = '';
  document.getElementById('boss-opciones').innerHTML = '';
  escribirTexto('boss-texto', intro.texto, 25);
  setTimeout(() => mostrarIntroduccionBoss(idx + 1), intro.texto.length * 25 + 1500);
}

function lanzarPreguntaBoss(faseIdx) {
  const pregunta = BOSS_DATA.preguntas[faseIdx];
  if (!pregunta) {
    // Boss vencido
    victoria();
    return;
  }
  estado.bossFase = faseIdx;

  document.getElementById('boss-texto').textContent = pregunta.titulo + '\n\n' + pregunta.pregunta;
  const opcionesEl = document.getElementById('boss-opciones');
  opcionesEl.innerHTML = '';

  const opciones = [...pregunta.opciones].sort(() => Math.random() - 0.5);
  opciones.forEach(op => {
    const btn = document.createElement('button');
    btn.className = 'btn-pixel btn-opcion';
    btn.style.cssText = `
      font-family: 'VT323', monospace;
      font-size: clamp(14px, 2vw, 19px);
      padding: 10px 16px;
      color: #e8e8ff;
      background: #12121e;
      border: 2px solid #500;
      cursor: pointer;
      text-align: left;
      width: 100%;
      margin-bottom: 6px;
    `;
    btn.textContent = '◆ ' + op.texto;
    btn.onmouseover = () => { btn.style.borderColor = '#ff1e1e'; btn.style.color = '#ff6b6b'; };
    btn.onmouseout  = () => { btn.style.borderColor = '#500'; btn.style.color = '#e8e8ff'; };
    btn.onclick = () => responderBoss(op, pregunta, faseIdx, opcionesEl);
    opcionesEl.appendChild(btn);
  });
}

function responderBoss(opcion, pregunta, faseIdx, opcionesEl) {
  opcionesEl.querySelectorAll('button').forEach(b => b.disabled = true);

  if (opcion.correcto) {
    estado.bossHP -= pregunta.danoBoss;
    actualizarBarraBoss();
    escribirTexto('boss-texto', '✅ ' + pregunta.feedbackOk, 15);
    document.getElementById('boss-sprite').style.filter = 'drop-shadow(0 0 30px rgba(57,255,20,0.9)) brightness(0.5)';
    sumarATP(30);
    setTimeout(() => {
      document.getElementById('boss-sprite').style.filter = 'drop-shadow(0 0 20px rgba(255,30,30,0.8))';
      if (estado.bossHP <= 0) {
        victoria();
      } else {
        lanzarPreguntaBoss(faseIdx + 1);
      }
    }, 2800);
  } else {
    escribirTexto('boss-texto', '❌ ' + pregunta.feedbackFail, 15);
    document.getElementById('boss-sprite').style.animation = 'boss-shake 0.1s ease-in-out infinite alternate';
    setTimeout(() => {
      document.getElementById('boss-sprite').style.animation = 'boss-shake 0.3s ease-in-out infinite alternate';
      opcionesEl.querySelectorAll('button').forEach(b => { b.disabled = false; });
      lanzarPreguntaBoss(faseIdx); // reintentar misma pregunta
    }, 3000);
  }
}

function actualizarBarraBoss() {
  const pct = (estado.bossHP / BOSS_DATA.hpTotal) * 100;
  document.getElementById('barra-boss').style.width = pct + '%';
}

// ── VICTORIA ──
function victoria() {
  setTimeout(() => {
    escribirTexto('boss-texto', BOSS_DATA.dialogoVictoria, 20);
    setTimeout(() => {
      mostrarPantalla('victoria');
      document.getElementById('victoria-texto').textContent = BOSS_DATA.textoVictoria;
    }, BOSS_DATA.dialogoVictoria.length * 20 + 1000);
  }, 500);
}

function reiniciarJuego() {
  estado.atp = 0;
  estado.introIndex = 0;
  estado.zonasCompletadas.clear();
  estado.cinthiaIndex = 0;
  actualizarHUD();
  mostrarPantalla('inicio');
}

// ── CRÉDITOS ──
function mostrarCreditos() {
  document.getElementById('modal-creditos').classList.remove('oculto');
}
function cerrarCreditos() {
  document.getElementById('modal-creditos').classList.add('oculto');
}

// ── MENSAJE TEMPORAL ──
function mostrarMensajeTemporal(msg) {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
    background: #1a1a2e; border: 3px solid #ff6b00; color: #ff6b00;
    font-family: 'Press Start 2P', monospace; font-size: 10px;
    padding: 16px 28px; z-index: 9999; box-shadow: 0 0 20px rgba(255,107,0,0.4);
    animation: fade-in 0.3s ease;
  `;
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// ── RESIZE ──
window.addEventListener('resize', () => {
  if (estado.pantalla === 'mapa') dibujarMapa();
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  generarEstrellas();
  actualizarHUD();
});