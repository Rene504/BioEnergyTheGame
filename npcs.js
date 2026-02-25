// ═══════════════════════════════════════════════════════
// npcs.js — BioVilla: NPCs estáticos posicionados en el mapa
// ═══════════════════════════════════════════════════════

var npcAnimLoop = null;

const NPCS_DATA = [

  // 🎣 PESCADOR — en el barco del lago (centro-izquierda del lago)
  {
    id: 'pescador',
    nombre: 'Pescador',
    sprite: 'pescador',
    velocidad: 0,
    waypoints: [{ x: 22, y: 74 }],
    fraseIntervalo: 7000,
    frases: [
      '¡Hoy el lago está tranquilo... 🐟',
      '¿Sabías que el agua es el disolvente universal? 💧',
      'El ATP fluye como el agua del río...',
      'Buena pesca hoy... 🐟',
    ]
  },

  // 🧑‍🌾 GRANJERO — en medio de los cultivos (abajo centro-derecha)
  {
    id: 'granjero',
    nombre: 'Granjero',
    sprite: 'granjero',
    velocidad: 0,
    waypoints: [{ x: 49, y: 76 }],
    fraseIntervalo: 8000,
    frases: [
      'La glucosa es mi mejor cosecha 🌾',
      'Sin fotosíntesis no hay nada...',
      'El NADH es el mensajero de la energía.',
      'Hoy toca cosechar carbohidratos 🥕',
    ]
  },

  // 💂 GUARDIA — camino al norte, cerca de Zona Danger
  {
    id: 'guardia',
    nombre: 'Guardia',
    sprite: 'guardia',
    velocidad: 0,
    waypoints: [{ x: 66, y: 20 }],
    fraseIntervalo: 9000,
    frases: [
      '⚠ ¡Zona Danger al norte! Cuidado.',
      'Nadie pasa sin saber del ATP...',
      'El Fallo Energético acecha... 💀',
      'Mantente alerta, viajero.',
    ]
  },

  // 🔬 DR. KREBS — entre el molino y la mitocondria (centro-derecha)
  {
    id: 'cientifico',
    nombre: 'Dr. Krebs',
    sprite: 'cientifico',
    velocidad: 0,
    waypoints: [{ x: 61, y: 45 }],
    fraseIntervalo: 8500,
    frases: [
      '¡El ciclo de Krebs gira sin parar! 🔄',
      'Anotando datos del gradiente protónico...',
      '36-38 ATP por glucosa. Impresionante.',
      'La cadena de transporte es fascinante 🧬',
      'CO₂ + H₂O = resultados de la respiración',
    ]
  },

  // 👴 DON CÉLULA — camino central, cerca de la fuente
  {
    id: 'viejo',
    nombre: 'Don Célula',
    sprite: 'anciano',
    velocidad: 0,
    waypoints: [{ x: 40, y: 50 }],
    fraseIntervalo: 9500,
    frases: [
      'En mis tiempos, el ATP valía más...',
      'La glucólisis ocurre en el citoplasma, joven.',
      'Sin energía no hay vida. Simple.',
      '¡Cuida tu mitocondria! 🔋',
      'El metabolismo no descansa nunca...',
    ]
  },

  // 👧 NIÑA — camino del sur, cerca de las casas centrales
  {
    id: 'nina',
    nombre: 'Chica',
    sprite: 'nina',
    velocidad: 0,
    waypoints: [{ x: 35, y: 72 }],
    fraseIntervalo: 10000,
    frases: [
      '¡Corre, el ATP no se produce solo! 🏃',
      '¿Jugamos a las reacciones REDOX?',
      '¡La mitocondria es genial! ⚡',
      'Mi mamá dice que somos células gigantes...',
    ]
  },

  // 👩 ALDEANA — camino entre las casas, al norte del núcleo
  {
    id: 'aldeana',
    nombre: 'Aldeana',
    sprite: 'aldeana',
    velocidad: 0,
    waypoints: [{ x: 36, y: 38 }],
    fraseIntervalo: 11000,
    frases: [
      'BioVilla es el mejor lugar del cuerpo 🏡',
      'Hoy hice anabolismo en casa...',
      '¡El metabolismo nunca duerme!',
      'La energía del sol llega hasta aquí 🌞',
    ]
  },

];

// ── CONFIGURACIÓN DE COLORES DE SPRITES ──
const SPRITE_CONFIGS = {
  pescador:   { cuerpo: '#2a5fa8', piel: '#c8824a', ropa: '#1a4a80', sombrero: '#8B4513', hasSombrero: true  },
  anciano:    { cuerpo: '#5a5a7a', piel: '#c8824a', ropa: '#3a3a5a', sombrero: '#888888', hasSombrero: true  },
  nina:       { cuerpo: '#e85da8', piel: '#c8824a', ropa: '#c84088', sombrero: null,      hasSombrero: false },
  granjero:   { cuerpo: '#7a5a2a', piel: '#c8824a', ropa: '#5a3a1a', sombrero: '#5a3a0a', hasSombrero: true  },
  cientifico: { cuerpo: '#e8e8ff', piel: '#c8824a', ropa: '#c0c0e0', sombrero: null,      hasSombrero: false },
  guardia:    { cuerpo: '#2a4a2a', piel: '#c8824a', ropa: '#1a3a1a', sombrero: '#1a2a1a', hasSombrero: true  },
  aldeana:    { cuerpo: '#d45a5a', piel: '#c8824a', ropa: '#a03a3a', sombrero: null,      hasSombrero: false },
};

const npcEstados = {};

function crearSpriteNPC(cfg) {
  const wrap = document.createElement('div');
  wrap.className = 'npc-sprite-wrap';
  wrap.innerHTML = `
    <div class="npc-pixel-sprite"
         style="--color-cuerpo:${cfg.cuerpo};--color-piel:${cfg.piel};--color-ropa:${cfg.ropa};--color-sombrero:${cfg.sombrero || cfg.cuerpo};">
      ${cfg.hasSombrero ? '<div class="npc-sombrero"></div>' : ''}
      <div class="npc-cabeza"></div>
      <div class="npc-cuerpo"></div>
      <div class="npc-piernas"></div>
    </div>
  `;
  return wrap;
}

function crearElementoNPC(data) {
  const el = document.createElement('div');
  el.className = 'npc-entidad';
  el.id = 'npc-' + data.id;

  const cfg = SPRITE_CONFIGS[data.sprite] || SPRITE_CONFIGS.anciano;
  el.appendChild(crearSpriteNPC(cfg));

  const burbuja = document.createElement('div');
  burbuja.className = 'npc-burbuja oculta';
  el.appendChild(burbuja);

  const nombreEl = document.createElement('div');
  nombreEl.className = 'npc-nombre';
  nombreEl.textContent = data.nombre;
  el.appendChild(nombreEl);

  // Evitar que el click/mousedown en NPC active el drag del mapa
  el.addEventListener('mousedown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    mostrarFraseNPC(data.id);
  });

  return el;
}

function initNPCs() {
  const mundo = document.getElementById('mapa-mundo');
  if (!mundo) return;

  document.querySelectorAll('.npc-entidad').forEach(e => e.remove());

  NPCS_DATA.forEach(data => {
    const el = crearElementoNPC(data);
    mundo.appendChild(el);

    const wp = data.waypoints[0];
    npcEstados[data.id] = {
      el,
      data,
      burbujaTimer: null,
      fraseIdx: 0,
    };

    // Posición fija
    el.style.left = wp.x + '%';
    el.style.top  = wp.y + '%';

    if (data.frases && data.frases.length > 0) {
      programarFrase(data.id);
    }
  });

  // No hay loop de movimiento — los NPCs son estáticos
  // npcAnimLoop queda en null intencionalmente
}

// tickNPCs es un no-op (todos son estáticos), se deja para compatibilidad
function tickNPCs() {}

function mostrarFraseNPC(id) {
  const st = npcEstados[id];
  if (!st) return;
  const el = document.getElementById('npc-' + id);
  if (!el) return;
  const burbuja = el.querySelector('.npc-burbuja');
  if (!burbuja) return;

  const data = NPCS_DATA.find(n => n.id === id);
  const frase = data.frases[st.fraseIdx % data.frases.length];
  st.fraseIdx++;

  burbuja.textContent = frase;
  burbuja.classList.remove('oculta');
  burbuja.classList.add('visible');

  clearTimeout(st.burbujaTimer);
  st.burbujaTimer = setTimeout(() => {
    burbuja.classList.remove('visible');
    burbuja.classList.add('oculta');
  }, 3500);
}

function programarFrase(id) {
  const data = NPCS_DATA.find(n => n.id === id);
  if (!data) return;
  const intervalo = data.fraseIntervalo + Math.random() * 3000;
  setTimeout(() => {
    const mapa = document.getElementById('pantalla-mapa');
    if (mapa && mapa.classList.contains('activa')) {
      mostrarFraseNPC(id);
    }
    programarFrase(id);
  }, intervalo);
}

// pararNPCs — no hay loop que cancelar pero se deja por compatibilidad con juego.js
function pararNPCs() {
  if (npcAnimLoop) {
    cancelAnimationFrame(npcAnimLoop);
    npcAnimLoop = null;
  }
}
