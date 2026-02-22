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
  cinthiaCompletada: false,  // ← Miss Cinthia debe verse primero
  bossHP: 3,
  bossFase: 0,
  quizPendiente: null,
  quizResuelta: false
};

// Orden de desbloqueo de zonas
// nucleo → mitocondria → redox → boss (con 100 ATP)
const ORDEN_DESBLOQUEO = ['nucleo', 'mitocondria', 'redox'];

function zonaDesbloqueada(zonaId) {
  if (zonaId === 'boss') {
    // Zona Danger: todas las zonas completadas Y 100 ATP
    return ORDEN_DESBLOQUEO.every(z => estado.zonasCompletadas.has(z)) && estado.atp >= 100;
  }
  if (!estado.cinthiaCompletada) return false;
  const idx = ORDEN_DESBLOQUEO.indexOf(zonaId);
  if (idx === 0) return true; // nucleo se desbloquea tras Cinthia
  // Las demás requieren que la zona anterior esté completada
  return estado.zonasCompletadas.has(ORDEN_DESBLOQUEO[idx - 1]);
}

function actualizarEstadoZonas() {
  // Actualiza visualmente el estado de cada hotspot
  ORDEN_DESBLOQUEO.forEach(zonaId => {
    const el = document.getElementById('zona-' + zonaId);
    if (!el) return;
    if (estado.zonasCompletadas.has(zonaId)) {
      el.classList.remove('bloqueada');
      el.classList.add('completada');
    } else if (zonaDesbloqueada(zonaId)) {
      el.classList.remove('bloqueada', 'completada');
    } else {
      el.classList.add('bloqueada');
      el.classList.remove('completada');
    }
  });

  // Zona Danger
  const boss = document.getElementById('zona-boss');
  if (boss) {
    if (zonaDesbloqueada('boss')) {
      boss.classList.remove('bloqueada');
    } else {
      boss.classList.add('bloqueada');
    }
  }

  // Miss Cinthia: siempre accesible pero marcar si ya fue vista
  const cinthia = document.getElementById('zona-cinthia');
  if (cinthia) {
    if (estado.cinthiaCompletada) cinthia.classList.add('completada');
    else cinthia.classList.remove('completada');
  }
}

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
  const barra = document.getElementById('barra-atp');
  barra.style.boxShadow = '0 0 20px #39ff14';
  setTimeout(() => barra.style.boxShadow = '0 0 8px #39ff14', 600);
}

function escribirTexto(elementId, texto, velocidad = 20, retratoId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '';
  let i = 0;

  // Detectar la imagen del retrato para animar
  const retratoEl = retratoId ? document.getElementById(retratoId) : null;
  const img = retratoEl ? retratoEl.querySelector('img.retrato-img') : null;

  // Animación de "hablando" mientras se escribe
  if (img) {
    img.classList.remove('anim-bounce', 'anim-talking');
    void img.offsetWidth; // reflow para reiniciar
    img.classList.add('anim-talking');
  }

  const intervalo = setInterval(() => {
    el.textContent += texto[i];
    i++;
    if (i >= texto.length) {
      clearInterval(intervalo);
      // Al terminar: volver a idle
      if (img) {
        img.classList.remove('anim-talking');
        // idle se aplica via CSS animation en .retrato-img sin clase extra
      }
    }
  }, velocidad);
}

// ── Disparar animación bounce al cambiar frame ──
function animarRetratoBounce(retratoId) {
  const el = document.getElementById(retratoId);
  if (!el) return;
  const img = el.querySelector('img.retrato-img');
  if (!img) return;
  img.classList.remove('anim-bounce', 'anim-talking');
  void img.offsetWidth; // reflow
  img.classList.add('anim-bounce');
  // Quitar clase después de que termine la animación (0.5s)
  setTimeout(() => {
    img.classList.remove('anim-bounce');
  }, 500);
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
let mapaAnimFrame = null;
let mapaTiempo = 0;
let particulasATP = [];
let particulasDanger = [];

function initParticulas(W, H) {
  particulasATP = Array.from({length: 18}, () => ({
    x: W*0.69 + (Math.random()-0.5)*60,
    y: H*0.35 + (Math.random()-0.5)*40,
    vx: (Math.random()-0.5)*0.6,
    vy: (Math.random()-0.5)*0.6,
    r: Math.random()*3+1,
    alpha: Math.random(),
    color: Math.random()>0.5 ? '#39ff14' : '#00d4ff'
  }));
  particulasDanger = Array.from({length: 22}, () => ({
    x: W*0.71 + (Math.random()-0.5)*W*0.14,
    y: H*0.09 + (Math.random()-0.5)*H*0.12,
    vx: (Math.random()-0.5)*0.5,
    vy: -Math.random()*0.8 - 0.2,
    r: Math.random()*4+1,
    alpha: Math.random()*0.8,
    life: Math.random()
  }));
}

function dibujarMapa() {
  const canvas = document.getElementById('mapa-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const newW = canvas.offsetWidth  || window.innerWidth;
  const newH = canvas.offsetHeight || (window.innerHeight - 48);
  if (canvas.width !== newW || canvas.height !== newH) {
    canvas.width  = newW;
    canvas.height = newH;
    initParticulas(newW, newH);
  }

  const W = canvas.width, H = canvas.height;
  const t = mapaTiempo;
  mapaTiempo += 0.016;

  // Canvas completamente transparente — la imagen de fondo viene del CSS
  ctx.clearRect(0, 0, W, H);

  // ═══════════════════════════════════
  // PARTÍCULAS ATP (energía flotante sobre mitocondria)
  // ═══════════════════════════════════
  particulasATP.forEach(p => {
    p.x += p.vx + Math.sin(t*0.5+p.r)*0.4;
    p.y += p.vy + Math.cos(t*0.5+p.r)*0.3;
    p.alpha += 0.015;
    if (p.alpha > 1) p.alpha = 0;
    if (p.x < W*0.55 || p.x > W*0.85 || p.y < H*0.20 || p.y > H*0.55) {
      p.x = W*0.67 + (Math.random()-0.5)*W*0.08;
      p.y = H*0.33 + (Math.random()-0.5)*H*0.06;
      p.alpha = 0;
    }
    ctx.save();
    ctx.globalAlpha = p.alpha * 0.8;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // ═══════════════════════════════════
  // PARTÍCULAS DANGER (humo rojo zona danger)
  // ═══════════════════════════════════
  const dx = W*0.71, dy = H*0.09;
  particulasDanger.forEach(p => {
    p.x += p.vx + Math.sin(t + p.r)*0.3;
    p.y += p.vy;
    p.life -= 0.008;
    if (p.life <= 0) {
      p.x = dx + (Math.random()-0.5)*W*0.12;
      p.y = dy + (Math.random()-0.5)*H*0.08;
      p.life = 0.8 + Math.random()*0.5;
      p.vy = -Math.random()*0.8 - 0.2;
    }
    ctx.fillStyle = `rgba(200,0,0,${p.life*0.3})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  });

  // ═══════════════════════════════════
  // PULSO SUAVE en cada zona (indica que son clicables)
  // ═══════════════════════════════════
  function pulsoZona(x, y, radio, color, fase) {
    const alpha = 0.12 + 0.08 * Math.sin(t * 1.5 + fase);
    ctx.beginPath();
    ctx.arc(x, y, radio * (1 + 0.08 * Math.sin(t + fase)), 0, Math.PI * 2);
    ctx.strokeStyle = color.replace(')', `,${alpha})`).replace('rgb','rgba');
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  pulsoZona(W*0.50, H*0.50, W*0.07, 'rgb(0,212,255)', 0);      // Núcleo
  pulsoZona(W*0.67, H*0.33, W*0.06, 'rgb(57,255,20)', 1);       // Mitocondria
  pulsoZona(W*0.22, H*0.57, W*0.05, 'rgb(255,215,0)', 2);       // Cinthia
  pulsoZona(W*0.68, H*0.63, W*0.055, 'rgb(255,107,0)', 3);      // REDOX
  pulsoZona(W*0.71, H*0.09, W*0.065, 'rgb(255,30,30)', 4);      // Danger

  // LOOP
  if (mapaAnimFrame) cancelAnimationFrame(mapaAnimFrame);
  mapaAnimFrame = requestAnimationFrame(dibujarMapa);
}

// ── INICIO DEL JUEGO ──
function iniciarJuego() {
  estado.introIndex = 0;
  mostrarPantalla('intro');
  mostrarIntroFrame();
}

// ── CINEMÁTICA INTRO ──
// CORRECCIÓN CLAVE: usa id="nombre-intro" (en pantalla-intro)
// NO usa id="nombre-npc" que pertenece a pantalla-dialogo
function mostrarIntroFrame() {
  const frame = INTRO_SECUENCIAS[estado.introIndex];
  if (!frame) {
    mostrarPantalla('mapa');
    dibujarMapa();
    setTimeout(resetearVista, 80);
    return;
  }
  const retratoEl = document.getElementById('retrato-intro');
  const nombreEl  = document.getElementById('nombre-intro');
  const textoEl   = document.getElementById('texto-intro');

  if (retratoEl) retratoEl.innerHTML = frame.retrato;
  animarRetratoBounce('retrato-intro');
  if (nombreEl)  nombreEl.textContent  = frame.nombre;
  if (textoEl) {
    textoEl.textContent = '';
    let i = 0;
    // Animación talking en el retrato de intro
    const imgIntro = retratoEl ? retratoEl.querySelector('img.retrato-img') : null;
    if (imgIntro) { imgIntro.classList.remove('anim-talking'); void imgIntro.offsetWidth; imgIntro.classList.add('anim-talking'); }
    const intervalo = setInterval(() => {
      textoEl.textContent += frame.texto[i];
      i++;
      if (i >= frame.texto.length) {
        clearInterval(intervalo);
        if (imgIntro) imgIntro.classList.remove('anim-talking');
      }
    }, 22);
  }
}

function siguienteIntro() {
  estado.introIndex++;
  if (estado.introIndex >= INTRO_SECUENCIAS.length) {
    mostrarPantalla('mapa');
    dibujarMapa();
    setTimeout(() => {
      resetearVista();
      initNPCs(); // ← Iniciar NPCs al entrar al mapa por primera vez
      actualizarEstadoZonas(); // ← Aplicar estado inicial de zonas
    }, 80);
  } else {
    mostrarIntroFrame();
  }
}

// ── MAPA ──
function entrarZona(zonaId) {
  const zona = ZONAS[zonaId];

  // ── Zona Danger ──
  if (zonaId === 'boss') {
    if (!zonaDesbloqueada('boss')) {
      const faltanZonas = ORDEN_DESBLOQUEO.filter(z => !estado.zonasCompletadas.has(z));
      if (faltanZonas.length > 0) {
        mostrarMensajeTemporal("⚠ Completa todas las zonas primero.");
      } else {
        mostrarMensajeTemporal("⚡ Necesitas 100 ATP para entrar. ¡Sigue explorando!");
      }
      return;
    }
    iniciarBoss();
    return;
  }

  if (!zona) return;

  // ── Verificar desbloqueo ──
  if (!zonaDesbloqueada(zonaId)) {
    if (!estado.cinthiaCompletada) {
      mostrarMensajeTemporal("💬 Habla primero con Miss Cinthia al oeste.");
    } else {
      const idx = ORDEN_DESBLOQUEO.indexOf(zonaId);
      const zonaPrevia = ORDEN_DESBLOQUEO[idx - 1];
      const nombres = { nucleo: 'Núcleo', mitocondria: 'Mitocondria', redox: 'REDOX Lab' };
      mostrarMensajeTemporal(`🔒 Completa ${nombres[zonaPrevia] || zonaPrevia} primero.`);
    }
    return;
  }

  estado.zonaActual = zonaId;
  estado.dialogoIndex = 0;
  estado.dialogoActual = zona.dialogos;
  estado.quizResuelta = estado.zonasCompletadas.has(zonaId);

  document.getElementById('escena-fondo').style.background = zona.fondo;
  document.getElementById('opciones-dialogo').innerHTML = '';
  document.getElementById('btn-dialogo-sig').style.display = 'block';

  const nombres = { nucleo: 'Núcleo Central', mitocondria: 'Mitocondria', redox: 'REDOX Lab' };
  document.getElementById('hud-zona').textContent = '📍 ' + (nombres[zonaId] || zonaId);

  // Pausar NPCs mientras estamos en otra pantalla
  if (typeof pararNPCs === 'function') pararNPCs();

  mostrarPantalla('dialogo');
  mostrarDialogoActual();
}

function hablarConCinthia() {
  estado.dialogoActual = DIALOGOS_CINTHIA;
  estado.dialogoIndex = 0;
  estado.zonaActual = 'cinthia'; // marca especial para finDialogo
  const _fondo = document.getElementById('escena-fondo');
  _fondo.style.backgroundImage = "url('MissCinthiaFondo.jpeg')";
  _fondo.style.backgroundSize = 'cover';
  _fondo.style.backgroundPosition = 'center center';
  document.getElementById('opciones-dialogo').innerHTML = '';
  document.getElementById('btn-dialogo-sig').style.display = 'block';
  document.getElementById('hud-zona').textContent = '📍 Miss Cinthia';
  // Pausar NPCs mientras estamos en otra pantalla
  if (typeof pararNPCs === 'function') pararNPCs();
  mostrarPantalla('dialogo');
  mostrarDialogoActual();
}

function mostrarDialogoActual() {
  const frame = estado.dialogoActual[estado.dialogoIndex];
  if (!frame) {
    finDialogo();
    return;
  }
  document.getElementById('retrato-npc').innerHTML = frame.retrato;
  document.getElementById('nombre-npc').textContent  = frame.nombre;
  animarRetratoBounce('retrato-npc');
  escribirTexto('texto-dialogo', frame.texto, 18, 'retrato-npc');
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
  // Si era Miss Cinthia → marcar completada y desbloquear Núcleo
  if (estado.zonaActual === 'cinthia') {
    if (!estado.cinthiaCompletada) {
      estado.cinthiaCompletada = true;
      actualizarEstadoZonas();
      volverAlMapa();
      setTimeout(() => mostrarMensajeTemporal("🏛 ¡Núcleo desbloqueado! Visítalo ahora."), 400);
    } else {
      volverAlMapa();
    }
    return;
  }

  if (estado.zonaActual && !estado.quizResuelta) {
    const zona = ZONAS[estado.zonaActual];
    lanzarQuiz(zona.quiz, () => {
      estado.zonasCompletadas.add(estado.zonaActual);
      const hotspot = document.getElementById('zona-' + estado.zonaActual);
      if (hotspot) hotspot.classList.add('completada');
      actualizarEstadoZonas(); // actualiza bloqueos de la siguiente zona
      // Mensaje de desbloqueo de siguiente zona
      const idx = ORDEN_DESBLOQUEO.indexOf(estado.zonaActual);
      const siguiente = ORDEN_DESBLOQUEO[idx + 1];
      const nombres = { nucleo: 'Núcleo', mitocondria: 'Mitocondria', redox: 'REDOX Lab' };
      if (siguiente) {
        setTimeout(() => mostrarMensajeTemporal(`✅ ¡${nombres[siguiente]} desbloqueado!`), 400);
      } else if (estado.atp >= 100) {
        setTimeout(() => mostrarMensajeTemporal("☠ ¡ZONA DANGER desbloqueada! ¡A por el Boss!"), 400);
      } else {
        setTimeout(() => mostrarMensajeTemporal(`⚡ ATP: ${estado.atp}/100. ¡Sigue adelante!`), 400);
      }
      volverAlMapa();
    });
  } else {
    volverAlMapa();
  }
}

function volverAlMapa() {
  const _f = document.getElementById('escena-fondo');
  if (_f) { _f.style.backgroundImage=''; _f.style.backgroundSize=''; _f.style.backgroundPosition=''; }
  mostrarPantalla('mapa');
  document.getElementById('hud-zona').textContent = '📍 BioVilla';
  actualizarEstadoZonas();
  // Reanudar loop de NPCs si fue pausado
  if (typeof tickNPCs === 'function' && !npcAnimLoop) {
    tickNPCs();
  }
}

// ── QUIZ ──
function lanzarQuiz(quizData, callbackOk) {
  estado.quizPendiente = { data: quizData, callback: callbackOk };
  estado.quizResuelta = false;

  document.getElementById('quiz-icono').textContent   = quizData.icono;
  document.getElementById('quiz-titulo').textContent  = quizData.titulo;
  document.getElementById('quiz-pregunta').textContent = quizData.pregunta;

  const opcionesEl = document.getElementById('quiz-opciones');
  opcionesEl.innerHTML = '';
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-feedback').className = 'quiz-feedback';

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

  opcionesEl.querySelectorAll('.btn-quiz-op').forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === opcion.texto) {
      btn.classList.add(opcion.correcto ? 'correcto' : 'incorrecto');
    }
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
    setTimeout(() => { if (callbackOk) callbackOk(); }, 2500);
  } else {
    feedback.textContent = quizData.feedbackFail;
    feedback.className = 'quiz-feedback fail';
    setTimeout(() => {
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
    btn.onmouseout  = () => { btn.style.borderColor = '#500';    btn.style.color = '#e8e8ff'; };
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
      lanzarPreguntaBoss(faseIdx);
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
  estado.cinthiaCompletada = false;
  actualizarHUD();
  if (typeof pararNPCs === 'function') pararNPCs();
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

// ══════════════════════════════════════════════════════
// SISTEMA DRAG + ZOOM — tipo Clash of Clans
// El "mundo" (mapa-mundo) se traslada y escala.
// El HUD y botones de zoom quedan fijos fuera del mundo.
// ══════════════════════════════════════════════════════
const vistaMap = {
  x: 0,          // offset X actual
  y: 0,          // offset Y actual
  zoom: 1.0,     // escala actual
  zoomMin: 0.5,
  zoomMax: 2.5,
  arrastrando: false,
  startX: 0,
  startY: 0,
  startVX: 0,
  startVY: 0,
  // inercia
  velX: 0,
  velY: 0,
  lastX: 0,
  lastY: 0,
  rafInercia: null
};

// Tamaño del mundo en px (debe coincidir con el CSS)
const MUNDO_W = 1400;
const MUNDO_H = 933;

function aplicarTransforma() {
  const mundo = document.getElementById('mapa-mundo');
  if (!mundo) return;
  mundo.style.transform = `translate(${vistaMap.x}px, ${vistaMap.y}px) scale(${vistaMap.zoom})`;
}

function clampVista() {
  const cont = document.getElementById('mapa-contenedor');
  if (!cont) return;
  const cW = cont.offsetWidth;
  const cH = cont.offsetHeight;
  const wW = MUNDO_W * vistaMap.zoom;
  const wH = MUNDO_H * vistaMap.zoom;

  // No dejar ver más allá del borde del mundo
  const minX = Math.min(0, cW - wW);
  const minY = Math.min(0, cH - wH);
  vistaMap.x = Math.max(minX, Math.min(0, vistaMap.x));
  vistaMap.y = Math.max(minY, Math.min(0, vistaMap.y));
}

function centrarVista() {
  const cont = document.getElementById('mapa-contenedor');
  if (!cont) return;
  const cW = cont.offsetWidth;
  const cH = cont.offsetHeight;
  vistaMap.x = (cW - MUNDO_W * vistaMap.zoom) / 2;
  vistaMap.y = (cH - MUNDO_H * vistaMap.zoom) / 2;
  clampVista();
  aplicarTransforma();
}

function resetearVista() {
  cancelarInercia();
  // Escala para que el mundo llene la pantalla
  const cont = document.getElementById('mapa-contenedor');
  if (!cont) return;
  const escalaFit = Math.max(cont.offsetWidth / MUNDO_W, cont.offsetHeight / MUNDO_H);
  vistaMap.zoom = Math.min(escalaFit, 1.0);
  centrarVista();
}

function cambiarZoom(delta) {
  cancelarInercia();
  const cont = document.getElementById('mapa-contenedor');
  if (!cont) return;
  const cx = cont.offsetWidth  / 2;
  const cy = cont.offsetHeight / 2;
  zoomHacia(cx, cy, delta);
}

function zoomHacia(px, py, delta) {
  const zoomAnterior = vistaMap.zoom;
  const zoomNuevo = Math.max(vistaMap.zoomMin, Math.min(vistaMap.zoomMax, vistaMap.zoom + delta));
  const ratio = zoomNuevo / zoomAnterior;
  // Ajustar offset para que el punto bajo el cursor no se mueva
  vistaMap.x = px - ratio * (px - vistaMap.x);
  vistaMap.y = py - ratio * (py - vistaMap.y);
  vistaMap.zoom = zoomNuevo;
  clampVista();
  aplicarTransforma();
}

function cancelarInercia() {
  if (vistaMap.rafInercia) {
    cancelAnimationFrame(vistaMap.rafInercia);
    vistaMap.rafInercia = null;
  }
}

function aplicarInercia() {
  vistaMap.velX *= 0.92;
  vistaMap.velY *= 0.92;
  if (Math.abs(vistaMap.velX) < 0.3 && Math.abs(vistaMap.velY) < 0.3) return;
  vistaMap.x += vistaMap.velX;
  vistaMap.y += vistaMap.velY;
  clampVista();
  aplicarTransforma();
  vistaMap.rafInercia = requestAnimationFrame(aplicarInercia);
}

function initMapaDrag() {
  const cont = document.getElementById('mapa-contenedor');
  if (!cont) return;

  // ── MOUSE ──
  cont.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    // Si el click fue sobre un NPC o zona hotspot, no iniciar drag
    if (e.target.closest('.npc-entidad') || e.target.closest('.zona-hotspot')) return;
    cancelarInercia();
    vistaMap.arrastrando = true;
    vistaMap.startX  = e.clientX;
    vistaMap.startY  = e.clientY;
    vistaMap.startVX = vistaMap.x;
    vistaMap.startVY = vistaMap.y;
    vistaMap.velX = 0; vistaMap.velY = 0;
    vistaMap.lastX = e.clientX;
    vistaMap.lastY = e.clientY;
    cont.classList.add('dragging');
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!vistaMap.arrastrando) return;
    vistaMap.velX = e.clientX - vistaMap.lastX;
    vistaMap.velY = e.clientY - vistaMap.lastY;
    vistaMap.lastX = e.clientX;
    vistaMap.lastY = e.clientY;
    vistaMap.x = vistaMap.startVX + (e.clientX - vistaMap.startX);
    vistaMap.y = vistaMap.startVY + (e.clientY - vistaMap.startY);
    clampVista();
    aplicarTransforma();
  });

  window.addEventListener('mouseup', e => {
    if (!vistaMap.arrastrando) return;
    vistaMap.arrastrando = false;
    cont.classList.remove('dragging');
    // Lanzar inercia
    if (Math.abs(vistaMap.velX) > 1 || Math.abs(vistaMap.velY) > 1) {
      aplicarInercia();
    }
  });

  // ── RUEDA ── zoom centrado en el cursor
  cont.addEventListener('wheel', e => {
    e.preventDefault();
    cancelarInercia();
    const rect = cont.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    zoomHacia(px, py, delta);
  }, { passive: false });

  // ── TOUCH (móvil) ──
  let touchInicial = null;
  let pinchDistInicial = null;
  let zoomAlIniciarPinch = 1;
  let touchMedio = { x: 0, y: 0 };
  let touchSobreInteractivo = false; // ¿El toque comenzó sobre un hotspot o NPC?
  let touchStartTime = 0;
  let touchMovido = false;

  cont.addEventListener('touchstart', e => {
    cancelarInercia();
    touchMovido = false;
    touchStartTime = Date.now();

    // Verificar si el toque está sobre un elemento interactivo
    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    touchSobreInteractivo = !!(el && (el.closest('.zona-hotspot') || el.closest('.npc-entidad')));

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchInicial = { x: t.clientX, y: t.clientY };

      if (!touchSobreInteractivo) {
        // Solo iniciar drag si no es un hotspot/NPC
        vistaMap.arrastrando = true;
        vistaMap.startVX = vistaMap.x;
        vistaMap.startVY = vistaMap.y;
        vistaMap.lastX = t.clientX;
        vistaMap.lastY = t.clientY;
        vistaMap.velX = 0; vistaMap.velY = 0;
        e.preventDefault(); // Prevenir scroll solo al arrastrar el mapa
      }
      // Si es interactivo, NO llamamos preventDefault para que el click llegue
    } else if (e.touches.length === 2) {
      vistaMap.arrastrando = false;
      touchSobreInteractivo = false;
      const t1 = e.touches[0], t2 = e.touches[1];
      pinchDistInicial = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      zoomAlIniciarPinch = vistaMap.zoom;
      touchMedio = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
      e.preventDefault();
    }
  }, { passive: false });

  cont.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && vistaMap.arrastrando && touchInicial) {
      const t = e.touches[0];
      const dx = t.clientX - touchInicial.x;
      const dy = t.clientY - touchInicial.y;
      // Si se movió más de 8px, ya es un drag real
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) touchMovido = true;
      vistaMap.velX = t.clientX - vistaMap.lastX;
      vistaMap.velY = t.clientY - vistaMap.lastY;
      vistaMap.lastX = t.clientX;
      vistaMap.lastY = t.clientY;
      vistaMap.x = vistaMap.startVX + dx;
      vistaMap.y = vistaMap.startVY + dy;
      clampVista();
      aplicarTransforma();
      e.preventDefault();
    } else if (e.touches.length === 2 && pinchDistInicial) {
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const nuevoZoom = Math.max(vistaMap.zoomMin, Math.min(vistaMap.zoomMax, zoomAlIniciarPinch * (dist / pinchDistInicial)));
      const rect = cont.getBoundingClientRect();
      const mx = touchMedio.x - rect.left;
      const my = touchMedio.y - rect.top;
      const ratio = nuevoZoom / vistaMap.zoom;
      vistaMap.x = mx - ratio * (mx - vistaMap.x);
      vistaMap.y = my - ratio * (my - vistaMap.y);
      vistaMap.zoom = nuevoZoom;
      clampVista();
      aplicarTransforma();
      e.preventDefault();
    }
  }, { passive: false });

  cont.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
      const fueRapido = (Date.now() - touchStartTime) < 300;

      // Tap sobre interactivo sin arrastre → disparar click manualmente
      if (touchSobreInteractivo && fueRapido && !touchMovido && touchInicial) {
        const el = document.elementFromPoint(touchInicial.x, touchInicial.y);
        if (el) {
          const hotspot = el.closest('.zona-hotspot');
          const npc = el.closest('.npc-entidad');
          if (hotspot) hotspot.click();
          else if (npc) npc.click();
        }
      }

      vistaMap.arrastrando = false;
      touchInicial = null;
      pinchDistInicial = null;
      touchSobreInteractivo = false;
      touchMovido = false;

      if (Math.abs(vistaMap.velX) > 1 || Math.abs(vistaMap.velY) > 1) {
        aplicarInercia();
      }
    }
  });

  // Vista inicial al mostrar el mapa
  window.addEventListener('resize', () => {
    if (estado.pantalla === 'mapa') { clampVista(); aplicarTransforma(); }
  });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  generarEstrellas();
  actualizarHUD();
  initMapaDrag();
});
