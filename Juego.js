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
let mapaAnimFrame = null;
let mapaTiempo = 0;
let particulasATP = [];
let particulasDanger = [];

function initParticulas(W, H) {
  // Partículas ATP (zona mitocondria → núcleo)
  particulasATP = Array.from({length: 18}, () => ({
    x: W*0.69 + (Math.random()-0.5)*60,
    y: H*0.35 + (Math.random()-0.5)*40,
    vx: (Math.random()-0.5)*0.6,
    vy: (Math.random()-0.5)*0.6,
    r: Math.random()*3+1,
    alpha: Math.random(),
    color: Math.random()>0.5 ? '#39ff14' : '#00d4ff'
  }));
  // Partículas peligro (zona danger)
  particulasDanger = Array.from({length: 22}, () => ({
    x: W*0.17 + (Math.random()-0.5)*W*0.14,
    y: H*0.17 + (Math.random()-0.5)*H*0.14,
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

  ctx.clearRect(0, 0, W, H);

  // ═══════════════════════════════════
  // 1. FONDO: cielo nocturno orgánico
  // ═══════════════════════════════════
  const sky = ctx.createRadialGradient(W*0.5, H*0.3, 0, W*0.5, H*0.5, W*0.8);
  sky.addColorStop(0,   '#0d1a30');
  sky.addColorStop(0.4, '#091220');
  sky.addColorStop(1,   '#030608');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // ─ Estrellas (fijas, pequeñas) ─
  ctx.save();
  const estrellasSeed = [
    [0.05,0.08],[0.18,0.03],[0.32,0.06],[0.55,0.02],[0.68,0.09],[0.80,0.04],
    [0.90,0.07],[0.95,0.12],[0.03,0.20],[0.15,0.28],[0.92,0.22],[0.75,0.15],
    [0.42,0.10],[0.60,0.16],[0.85,0.25],[0.10,0.32],[0.25,0.35],[0.97,0.30]
  ];
  estrellasSeed.forEach(([sx, sy], i) => {
    const bri = 0.4 + 0.6*Math.abs(Math.sin(t*0.5 + i));
    ctx.fillStyle = `rgba(200,220,255,${bri})`;
    ctx.fillRect(sx*W, sy*H, i%3===0?2:1, i%3===0?2:1);
  });
  ctx.restore();

  // ═══════════════════════════════════
  // 2. TERRENO BASE (césped pixel)
  // ═══════════════════════════════════
  // Zona verde central — base de la aldea
  const terrenoGrad = ctx.createRadialGradient(W*0.5, H*0.6, 0, W*0.5, H*0.6, W*0.55);
  terrenoGrad.addColorStop(0,   '#0f2a10');
  terrenoGrad.addColorStop(0.5, '#0a1f0b');
  terrenoGrad.addColorStop(1,   '#060f06');
  ctx.fillStyle = terrenoGrad;
  ctx.beginPath();
  ctx.ellipse(W*0.5, H*0.65, W*0.52, H*0.45, 0, 0, Math.PI*2);
  ctx.fill();

  // Textura de pasto (líneas pixel)
  ctx.strokeStyle = 'rgba(20,60,20,0.25)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 20) {
    for (let gy = 0; gy < H; gy += 20) {
      if (Math.sin(gx*0.3)*Math.cos(gy*0.3) > 0.1) {
        ctx.beginPath(); ctx.moveTo(gx, gy+4); ctx.lineTo(gx+2, gy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx+4, gy+4); ctx.lineTo(gx+6, gy); ctx.stroke();
      }
    }
  }

  // ═══════════════════════════════════
  // 3. CAMINOS ISOMÉTRICOS
  // ═══════════════════════════════════
  const cx = W*0.49, cy = H*0.46;

  function camino(x1,y1,x2,y2, colorBase='#1e3050', grosor=22) {
    // sombra del camino
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = grosor + 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // cuerpo
    ctx.strokeStyle = colorBase;
    ctx.lineWidth = grosor;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // borde claro
    ctx.strokeStyle = 'rgba(80,130,180,0.18)';
    ctx.lineWidth = grosor - 4;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // línea central punteada
    ctx.strokeStyle = 'rgba(100,160,220,0.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.setLineDash([]);
  }

  camino(cx, cy, W*0.69, H*0.34);        // → Mitocondria
  camino(cx, cy, W*0.26, H*0.49);        // ← Cinthia
  camino(cx, cy, W*0.72, H*0.625);       // → REDOX
  camino(cx, cy, W*0.175, H*0.175, '#2a1010', 18); // ↗ DANGER (rojo)

  // ═══════════════════════════════════
  // 4. RÍO / CANAL DE ELECTRONES
  // ═══════════════════════════════════
  ctx.save();
  ctx.strokeStyle = 'rgba(0,100,180,0.35)';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(W*0.62, H*0.90);
  ctx.bezierCurveTo(W*0.65, H*0.72, W*0.70, H*0.60, W*0.72, H*0.625);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,180,255,0.18)';
  ctx.lineWidth = 6;
  ctx.stroke();
  // ondas del río
  const onda = Math.sin(t*2)*4;
  ctx.strokeStyle = 'rgba(100,200,255,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W*0.62+onda, H*0.88);
  ctx.bezierCurveTo(W*0.65+onda, H*0.70, W*0.70+onda, H*0.62, W*0.72+onda, H*0.625);
  ctx.stroke();
  ctx.restore();

  // ═══════════════════════════════════
  // 5. ZONA NÚCLEO — Edificio central
  // ═══════════════════════════════════

  // Plataforma del núcleo
  ctx.save();
  const nucleoGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W*0.12);
  nucleoGrad.addColorStop(0,   'rgba(0,212,255,0.12)');
  nucleoGrad.addColorStop(0.6, 'rgba(0,100,150,0.08)');
  nucleoGrad.addColorStop(1,   'transparent');
  ctx.fillStyle = nucleoGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, W*0.13, 0, Math.PI*2);
  ctx.fill();

  // Anillos concéntricos (membrana nuclear)
  for (let ring=3; ring>=1; ring--) {
    const r = W*0.055 + ring*14;
    const alpha = 0.08 + (3-ring)*0.04 + Math.sin(t + ring)*0.02;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
    ctx.lineWidth = ring===1 ? 2 : 1;
    ctx.stroke();
  }

  // Edificio principal (torre del núcleo) — pixel art isométrico
  const nw = W*0.07, nh = H*0.13;
  const nx = cx - nw/2, ny = cy - nh*0.8;

  // Sombra edificio
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(nx+6, ny + nh + 4, nw, 10);

  // Cuerpo principal
  const edifGrad = ctx.createLinearGradient(nx, ny, nx+nw, ny);
  edifGrad.addColorStop(0, '#0d3a52');
  edifGrad.addColorStop(0.5, '#1a5a7a');
  edifGrad.addColorStop(1, '#0a2a3a');
  ctx.fillStyle = edifGrad;
  ctx.fillRect(nx, ny, nw, nh);

  // Ventanas brillantes (activas)
  const ventanas = [[0.2,0.15],[0.6,0.15],[0.2,0.42],[0.6,0.42],[0.2,0.68],[0.6,0.68]];
  ventanas.forEach(([wx,wy]) => {
    const bri = 0.5 + 0.5*Math.sin(t*2 + wx*10 + wy*8);
    ctx.fillStyle = `rgba(0,220,255,${bri*0.7})`;
    ctx.fillRect(nx + nw*wx, ny + nh*wy, nw*0.2, nh*0.12);
  });

  // Techo con antena
  ctx.fillStyle = '#1a5a7a';
  ctx.beginPath();
  ctx.moveTo(nx-4, ny);
  ctx.lineTo(cx, ny - H*0.06);
  ctx.lineTo(nx+nw+4, ny);
  ctx.closePath();
  ctx.fill();
  // Antena
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, ny - H*0.06); ctx.lineTo(cx, ny - H*0.10); ctx.stroke();
  const antenaGlow = 0.6 + 0.4*Math.sin(t*3);
  ctx.fillStyle = `rgba(0,212,255,${antenaGlow})`;
  ctx.beginPath(); ctx.arc(cx, ny - H*0.10, 4, 0, Math.PI*2); ctx.fill();

  // Borde pixel del edificio
  ctx.strokeStyle = 'rgba(0,212,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(nx, ny, nw, nh);
  ctx.restore();

  // ═══════════════════════════════════
  // 6. ZONA MITOCONDRIA — Fábrica
  // ═══════════════════════════════════
  const mx = W*0.69, my = H*0.34;
  ctx.save();

  // Plataforma
  const mitoGrad = ctx.createRadialGradient(mx, my, 0, mx, my, W*0.09);
  mitoGrad.addColorStop(0, 'rgba(57,255,20,0.10)');
  mitoGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = mitoGrad;
  ctx.beginPath(); ctx.arc(mx, my, W*0.09, 0, Math.PI*2); ctx.fill();

  // Edificio fábrica
  const fw = W*0.09, fh = H*0.10;
  const fx = mx - fw/2, fy = my - fh*0.6;

  ctx.fillStyle = '#0d2015';
  ctx.fillRect(fx, fy, fw, fh);
  ctx.fillStyle = '#0a1a10';
  ctx.fillRect(fx + fw*0.1, fy, fw*0.35, fh);
  ctx.fillRect(fx + fw*0.55, fy, fw*0.35, fh);

  // Chimeneas con humo verde (ATP)
  function chimenea(x, baseY, colorHumo) {
    ctx.fillStyle = '#1a3a20';
    ctx.fillRect(x-5, baseY-22, 10, 22);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x-5, baseY-22, 10, 22);
    // humo animado
    for (let s=0; s<4; s++) {
      const sy = baseY - 22 - s*16 - ((t*30 + s*15) % 60);
      const sr = 6 + s*3;
      const sa = (0.5 - s*0.1) * (0.4 + 0.4*Math.sin(t+s));
      ctx.fillStyle = `rgba(${colorHumo},${sa})`;
      ctx.beginPath(); ctx.arc(x + Math.sin(t+s)*4, sy, sr, 0, Math.PI*2); ctx.fill();
    }
  }
  chimenea(mx - fw*0.25, fy, '57,255,20');
  chimenea(mx + fw*0.25, fy, '0,212,255');

  // Ventanas fábrica
  [[0.15,0.3],[0.45,0.3],[0.75,0.3],[0.15,0.65],[0.75,0.65]].forEach(([wx,wy])=>{
    const br = 0.4+0.4*Math.sin(t*3+wx*5);
    ctx.fillStyle = `rgba(57,255,20,${br})`;
    ctx.fillRect(fx+fw*wx, fy+fh*wy, fw*0.12, fh*0.2);
  });

  // Borde
  ctx.strokeStyle = 'rgba(57,255,20,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(fx, fy, fw, fh);
  ctx.restore();

  // ═══════════════════════════════════
  // 7. ZONA REDOX — Laboratorio
  // ═══════════════════════════════════
  const rx = W*0.72, ry = H*0.625;
  ctx.save();

  const redoxGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, W*0.09);
  redoxGrad.addColorStop(0, 'rgba(255,107,0,0.10)');
  redoxGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = redoxGrad; ctx.beginPath(); ctx.arc(rx,ry,W*0.09,0,Math.PI*2); ctx.fill();

  // Paneles solares pixel
  function panelSolar(px, py, angle=0) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = '#10104a';
    ctx.fillRect(-18, -12, 36, 24);
    ctx.strokeStyle = '#2020a0';
    ctx.lineWidth = 1;
    [[0,-12],[12,-12],[-18,0],[12,0]].forEach(([lx,ly])=>{
      ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx, ly+12); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(-18,-12); ctx.lineTo(18,-12);
    ctx.moveTo(-18,0);   ctx.lineTo(18,0); ctx.stroke();
    const br = 0.15 + 0.1*Math.sin(t*2+px);
    ctx.fillStyle = `rgba(80,80,255,${br})`;
    ctx.fillRect(-16,-10,8,8); ctx.fillRect(-2,-10,8,8); ctx.fillRect(8,-10,8,8);
    ctx.fillRect(-16,2,8,8);   ctx.fillRect(-2,2,8,8);   ctx.fillRect(8,2,8,8);
    ctx.restore();
  }

  // Laboratorio (cúpula)
  ctx.fillStyle = '#200f00';
  ctx.fillRect(rx - W*0.04, ry - H*0.06, W*0.08, H*0.07);
  ctx.fillStyle = '#2a1500';
  ctx.beginPath(); ctx.arc(rx, ry - H*0.06, W*0.04, Math.PI, 0); ctx.fill();
  // ventana circular
  const labGlow = 0.5 + 0.4*Math.sin(t*2);
  ctx.fillStyle = `rgba(255,107,0,${labGlow*0.4})`;
  ctx.beginPath(); ctx.arc(rx, ry - H*0.04, W*0.015, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = `rgba(255,107,0,${labGlow*0.6})`;
  ctx.lineWidth = 2; ctx.stroke();

  panelSolar(rx - W*0.07, ry + H*0.01, -0.2);
  panelSolar(rx - W*0.04, ry + H*0.04, -0.15);
  panelSolar(rx + W*0.05, ry + H*0.02, 0.1);
  panelSolar(rx + W*0.08, ry - H*0.01, 0.05);
  ctx.restore();

  // ═══════════════════════════════════
  // 8. ZONA MISS CINTHIA — Cabaña
  // ═══════════════════════════════════
  const cinx = W*0.26, ciny = H*0.49;
  ctx.save();
  const cinGrad = ctx.createRadialGradient(cinx,ciny,0,cinx,ciny,W*0.07);
  cinGrad.addColorStop(0,'rgba(255,215,0,0.10)'); cinGrad.addColorStop(1,'transparent');
  ctx.fillStyle = cinGrad; ctx.beginPath(); ctx.arc(cinx,ciny,W*0.07,0,Math.PI*2); ctx.fill();

  // Cabaña
  const cbw = W*0.065, cbh = H*0.09;
  const cbx = cinx - cbw/2, cby = ciny - cbh*0.5;
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(cbx, cby, cbw, cbh);
  // Techo
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.moveTo(cbx-4, cby); ctx.lineTo(cinx, cby - H*0.06); ctx.lineTo(cbx+cbw+4, cby);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(200,150,50,0.3)'; ctx.lineWidth=1; ctx.stroke();
  // Puerta
  ctx.fillStyle = '#150900';
  ctx.fillRect(cinx - cbw*0.12, cby + cbh*0.55, cbw*0.24, cbh*0.45);
  // Ventanas con vela
  const velaGlow = 0.5 + 0.5*Math.sin(t*4 + 0.5);
  ctx.fillStyle = `rgba(255,200,50,${velaGlow*0.6})`;
  ctx.fillRect(cbx+cbw*0.1, cby+cbh*0.15, cbw*0.2, cbh*0.22);
  ctx.fillRect(cbx+cbw*0.7, cby+cbh*0.15, cbw*0.2, cbh*0.22);
  // halo de la cabaña
  ctx.strokeStyle = `rgba(255,215,0,${0.15 + 0.1*Math.sin(t)})`;
  ctx.lineWidth = 2; ctx.strokeRect(cbx,cby,cbw,cbh);
  ctx.restore();

  // ═══════════════════════════════════
  // 9. ZONA DANGER — Ruinas
  // ═══════════════════════════════════
  const dx = W*0.175, dy = H*0.175;
  ctx.save();

  // Niebla roja pulsante
  const pulso = 0.3 + 0.15*Math.sin(t*1.5);
  const dangerGradF = ctx.createRadialGradient(dx, dy, 0, dx, dy, W*0.15);
  dangerGradF.addColorStop(0,   `rgba(180,0,0,${pulso})`);
  dangerGradF.addColorStop(0.5, `rgba(100,0,0,${pulso*0.5})`);
  dangerGradF.addColorStop(1,   'transparent');
  ctx.fillStyle = dangerGradF;
  ctx.fillRect(0, 0, W, H);

  // Ruinas pixel
  function muroRoto(x, y, w, h) {
    ctx.fillStyle = '#1a0505';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2a0808';
    ctx.fillRect(x, y, w*0.4, h*0.6);
    ctx.strokeStyle = 'rgba(150,0,0,0.25)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
  }
  muroRoto(dx - W*0.07, dy - H*0.08, W*0.055, H*0.10);
  muroRoto(dx + W*0.02, dy - H*0.05, W*0.04, H*0.07);
  muroRoto(dx - W*0.02, dy + H*0.04, W*0.06, H*0.05);

  // Caveiras / cráneos decorativos
  ctx.font = `${Math.max(14, W*0.018)}px serif`;
  ctx.textAlign = 'center';
  const cskull = 0.5 + 0.5*Math.sin(t*2);
  ctx.fillStyle = `rgba(255,50,50,${cskull*0.7})`;
  ctx.fillText('☠', dx, dy - H*0.03);
  ctx.font = `${Math.max(10, W*0.012)}px serif`;
  ctx.fillStyle = `rgba(200,0,0,${cskull*0.5})`;
  ctx.fillText('☠', dx - W*0.05, dy + H*0.03);
  ctx.fillText('☠', dx + W*0.04, dy + H*0.02);

  // Partículas danger (humo oscuro)
  particulasDanger.forEach(p => {
    p.x += p.vx + Math.sin(t + p.r)*0.3;
    p.y += p.vy;
    p.life -= 0.008;
    if (p.life <= 0) {
      p.x = dx + (Math.random()-0.5)*W*0.14;
      p.y = dy + (Math.random()-0.5)*H*0.10;
      p.life = 0.8 + Math.random()*0.5;
      p.vy = -Math.random()*0.8 - 0.2;
    }
    ctx.fillStyle = `rgba(180,0,0,${p.life*0.25})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  });
  ctx.restore();

  // ═══════════════════════════════════
  // 10. MOLINOS DE ENERGÍA
  // ═══════════════════════════════════
  function molino(x, y, color, vel=1) {
    ctx.save();
    // Torre
    ctx.fillStyle = '#1a2a40';
    ctx.fillRect(x-4, y-H*0.06, 8, H*0.06);
    ctx.strokeStyle='rgba(100,150,200,0.2)'; ctx.lineWidth=1; ctx.strokeRect(x-4,y-H*0.06,8,H*0.06);
    // Base
    ctx.fillStyle='#0d1a2a';
    ctx.fillRect(x-9, y-4, 18, 8);
    // Aspas
    for (let i=0; i<3; i++) {
      const ang = (Math.PI*2/3)*i + t*vel;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y-H*0.06);
      // aspa con forma de hoja
      const ex = x + Math.cos(ang)*W*0.028;
      const ey = (y-H*0.06) + Math.sin(ang)*W*0.028;
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // punta del aspa
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI*2); ctx.fill();
    }
    // Centro
    const cglow = 0.6+0.4*Math.sin(t*3);
    ctx.fillStyle = color.replace(')', `,${cglow})`).replace('rgb','rgba');
    ctx.beginPath(); ctx.arc(x, y-H*0.06, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  molino(W*0.31, H*0.28, 'rgb(57,255,20)',  0.9);
  molino(W*0.37, H*0.24, 'rgb(0,212,255)',  1.1);
  molino(W*0.33, H*0.35, 'rgb(255,215,0)',  0.7);
  molino(W*0.58, H*0.78, 'rgb(57,255,20)',  1.0);
  molino(W*0.62, H*0.82, 'rgb(0,212,255)',  1.3);

  // ═══════════════════════════════════
  // 11. ÁRBOLES / VEGETACIÓN
  // ═══════════════════════════════════
  function arbol(x, y, escala=1, colorH='#1a4a1a', colorT='#0d2a0d') {
    const s = escala;
    ctx.fillStyle = colorT;
    ctx.fillRect(x-3*s, y, 6*s, 14*s);
    ctx.fillStyle = colorH;
    ctx.fillRect(x-11*s, y-16*s, 22*s, 18*s);
    ctx.fillStyle = colorH;
    ctx.fillRect(x-8*s, y-29*s, 16*s, 15*s);
    ctx.fillStyle = colorH;
    ctx.fillRect(x-5*s, y-39*s, 10*s, 12*s);
    // detalle
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(x-3*s, y-30*s, 4*s, 4*s);
  }
  [
    [W*0.06, H*0.42, 1.0], [W*0.09, H*0.50, 0.8], [W*0.05, H*0.55, 1.1],
    [W*0.86, H*0.38, 0.9], [W*0.89, H*0.46, 1.1], [W*0.84, H*0.52, 0.8],
    [W*0.48, H*0.78, 1.0], [W*0.52, H*0.82, 0.9], [W*0.56, H*0.76, 1.1],
    [W*0.15, H*0.65, 0.8], [W*0.18, H*0.70, 1.0],
    [W*0.80, H*0.68, 0.9], [W*0.83, H*0.73, 0.8],
  ].forEach(([x,y,s]) => arbol(x, y, s));

  // Arbustos de pared (bioluminiscentes)
  [[W*0.38,H*0.75],[W*0.44,H*0.78],[W*0.64,H*0.72]].forEach(([bx,by])=>{
    const br = 0.2+0.15*Math.sin(t*2+bx);
    ctx.fillStyle = `rgba(20,80,20,0.8)`;
    ctx.fillRect(bx-10, by-8, 20, 10);
    ctx.fillStyle = `rgba(57,255,20,${br})`;
    ctx.fillRect(bx-8, by-12, 16, 6);
  });

  // ═══════════════════════════════════
  // 12. PARTÍCULAS ATP (energía flotante)
  // ═══════════════════════════════════
  particulasATP.forEach(p => {
    p.x += p.vx + Math.sin(t*0.5+p.r)*0.4;
    p.y += p.vy + Math.cos(t*0.5+p.r)*0.3;
    p.alpha += 0.015;
    if (p.alpha > 1) p.alpha = 0;
    // reciclar si sale del área mito
    if (p.x < W*0.55 || p.x > W*0.85 || p.y < H*0.20 || p.y > H*0.55) {
      p.x = W*0.69 + (Math.random()-0.5)*W*0.08;
      p.y = H*0.35 + (Math.random()-0.5)*H*0.06;
      p.alpha = 0;
    }
    ctx.save();
    ctx.globalAlpha = p.alpha * 0.7;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // ═══════════════════════════════════
  // 13. TEXTO / ETIQUETAS DEL MAPA
  // ═══════════════════════════════════
  ctx.save();
  ctx.textAlign = 'center';

  function etiquetaMapa(x, y, txt, color, size=W*0.007) {
    ctx.font = `${Math.max(8, size)}px 'Press Start 2P', monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(txt, x+1, y+1);
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
  }

  // Título
  ctx.font = `bold ${Math.max(10, W*0.012)}px 'Press Start 2P', monospace`;
  ctx.fillStyle = 'rgba(0,212,255,0.15)';
  ctx.fillText('BIOVILLA', cx, H*0.93);

  // Mini sub-etiquetas de las zonas del mapa
  etiquetaMapa(W*0.30, H*0.19, 'ZONA ENERGÍA', 'rgba(57,255,20,0.5)', W*0.006);
  etiquetaMapa(W*0.72, H*0.86, 'RÍO DE e⁻', 'rgba(0,120,200,0.4)', W*0.005);
  ctx.restore();

  // ═══════════════════════════════════
  // 14. VIÑETA / BORDE OSCURO
  // ═══════════════════════════════════
  const viñeta = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, W*0.75);
  viñeta.addColorStop(0, 'transparent');
  viñeta.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = viñeta;
  ctx.fillRect(0, 0, W, H);

  // ═══════════════════════════════════
  // LOOP
  // ═══════════════════════════════════
  if (mapaAnimFrame) cancelAnimationFrame(mapaAnimFrame);
  mapaAnimFrame = requestAnimationFrame(dibujarMapa);
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