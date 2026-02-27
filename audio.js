// ═══════════════════════════════════════════════════════
// audio.js — BioVilla: La Célula Viva
// Sistema de música ambiente y efectos de sonido
// ═══════════════════════════════════════════════════════
//
// ESTRUCTURA DE ARCHIVOS ESPERADA:
//   sounds/
//     musica/
//       tema_inicio.mp3       ← Pantalla de inicio / créditos
//       tema_intro.mp3        ← Cinemática de introducción
//       tema_mapa.mp3         ← Exploración del mapa (loop)
//       tema_dialogo.mp3      ← Escenas de diálogo / misiones
//       tema_quiz.mp3         ← Durante las preguntas
//       tema_boss.mp3         ← Batalla contra el Fallo Energético
//       tema_boss_fase2.mp3   ← Fase final del boss (más intensa)
//       tema_victoria.mp3     ← Pantalla de victoria
//     sfx/
//       click.mp3             ← Click de botón general
//       dialogo_bip.mp3       ← Bip del texto escribiéndose
//       correcto.mp3          ← Respuesta correcta en quiz/boss
//       incorrecto.mp3        ← Respuesta incorrecta
//       perder_vida.mp3       ← Al perder una vida
//       game_over.mp3         ← Sin vidas
//       zona_desbloqueada.mp3 ← Al desbloquear una nueva zona
//       atp_suma.mp3          ← Al ganar ATP
//       boss_danio.mp3        ← Al dañar al boss
//       boss_fase2.mp3        ← Stinger de entrada a fase 2
//       victoria_fanfare.mp3  ← Fanfare de victoria final
//       entrada_zona.mp3      ← Al entrar a una zona del mapa
// ═══════════════════════════════════════════════════════

const Audio = (() => {

  // ── Volúmenes por defecto ──
  const VOL = {
    musica: 0.45,
    sfx:    0.7,
    bip:    0.15   // El bip de diálogo es más suave
  };

  // ── Pista de música actual ──
  let _musicaActual = null;
  let _nombreMusica = '';
  let _bipTimer     = null;
  let _bipActivo    = false;

  // ── Caché de efectos ──
  const _cache = {};

  // ── Estado: ¿el usuario ya interactuó? (política autoplay) ──
  let _desbloqueado = false;
  let _colaInicio   = null; // música pendiente antes del primer click

  // ─────────────────────────────────────────────
  // PRIVADO: cargar o recuperar Audio del caché
  // ─────────────────────────────────────────────
  function _cargar(ruta) {
    if (!_cache[ruta]) {
      const a = new window.Audio(ruta);
      a.preload = 'auto';
      _cache[ruta] = a;
    }
    return _cache[ruta];
  }

  // ─────────────────────────────────────────────
  // PRIVADO: fade out de la música actual
  // ─────────────────────────────────────────────
  function _fadeOut(audio, duracion, callback) {
    if (!audio) { if (callback) callback(); return; }
    const paso = audio.volume / (duracion / 50);
    const intervalo = setInterval(() => {
      if (audio.volume > paso) {
        audio.volume = Math.max(0, audio.volume - paso);
      } else {
        audio.volume = 0;
        audio.pause();
        clearInterval(intervalo);
        if (callback) callback();
      }
    }, 50);
  }

  // ─────────────────────────────────────────────
  // PRIVADO: fade in de un audio
  // ─────────────────────────────────────────────
  function _fadeIn(audio, volObjetivo, duracion) {
    audio.volume = 0;
    const paso = volObjetivo / (duracion / 50);
    const intervalo = setInterval(() => {
      if (audio.volume < volObjetivo - paso) {
        audio.volume = Math.min(volObjetivo, audio.volume + paso);
      } else {
        audio.volume = volObjetivo;
        clearInterval(intervalo);
      }
    }, 50);
  }

  // ─────────────────────────────────────────────
  // PÚBLICO: desbloquear audio tras interacción
  // (necesario por política autoplay de navegadores)
  // ─────────────────────────────────────────────
  function desbloquear() {
    if (_desbloqueado) return;
    _desbloqueado = true;
    // Si había música pendiente, reproducirla ahora
    if (_colaInicio) {
      const { nombre, loop } = _colaInicio;
      _colaInicio = null;
      musica(nombre, loop);
    }
  }

  // ─────────────────────────────────────────────
  // PÚBLICO: reproducir / cambiar música
  // nombre: clave del objeto MUSICA
  // loop: true por defecto
  // ─────────────────────────────────────────────
  const MUSICA = {
    inicio:       'sounds/musica/tema_inicio.mp3',
    intro:        'sounds/musica/tema_intro.mp3',
    mapa:         'sounds/musica/tema_mapa.mp3',
    dialogo:      'sounds/musica/tema_dialogo.mp3',
    quiz:         'sounds/musica/tema_quiz.mp3',
    boss:         'sounds/musica/tema_boss.mp3',
    boss_fase2:   'sounds/musica/tema_boss_fase2.mp3',
    victoria:     'sounds/musica/tema_victoria.mp3',
  };

  function musica(nombre, loop = true) {
    const ruta = MUSICA[nombre];
    if (!ruta) return;

    // Ya está sonando esa misma pista → no interrumpir
    if (_nombreMusica === nombre && _musicaActual && !_musicaActual.paused) return;

    if (!_desbloqueado) {
      // Guardar para reproducir tras primer click
      _colaInicio = { nombre, loop };
      return;
    }

    const nueva = _cargar(ruta);
    nueva.loop   = loop;

    if (_musicaActual && !_musicaActual.paused) {
      // Fade out de la actual → fade in de la nueva
      _fadeOut(_musicaActual, 800, () => {
        _musicaActual = nueva;
        _nombreMusica = nombre;
        nueva.currentTime = 0;
        nueva.volume = 0;
        nueva.play().catch(() => {});
        _fadeIn(nueva, VOL.musica, 1000);
      });
    } else {
      _musicaActual = nueva;
      _nombreMusica = nombre;
      nueva.currentTime = 0;
      nueva.volume = 0;
      nueva.play().catch(() => {});
      _fadeIn(nueva, VOL.musica, 800);
    }
  }

  // ─────────────────────────────────────────────
  // PÚBLICO: detener música
  // ─────────────────────────────────────────────
  function detenerMusica(fade = true) {
    if (!_musicaActual) return;
    if (fade) {
      _fadeOut(_musicaActual, 600, () => {
        _musicaActual = null;
        _nombreMusica = '';
      });
    } else {
      _musicaActual.pause();
      _musicaActual = null;
      _nombreMusica = '';
    }
  }

  // ─────────────────────────────────────────────
  // PÚBLICO: reproducir efecto de sonido
  // ─────────────────────────────────────────────
  const SFX = {
    click:             'sounds/sfx/click.mp3',
    correcto:          'sounds/sfx/correcto.mp3',
    incorrecto:        'sounds/sfx/incorrecto.mp3',
    perder_vida:       'sounds/sfx/perder_vida.mp3',
    game_over:         'sounds/sfx/game_over.mp3',
    zona_desbloqueada: 'sounds/sfx/zona_desbloqueada.mp3',
    atp_suma:          'sounds/sfx/atp_suma.mp3',
    boss_danio:        'sounds/sfx/boss_danio.mp3',
    boss_fase2:        'sounds/sfx/boss_fase2.mp3',
    victoria_fanfare:  'sounds/sfx/victoria_fanfare.mp3',
    entrada_zona:      'sounds/sfx/entrada_zona.mp3',
    dialogo_bip:       'sounds/sfx/dialogo_bip.mp3',
  };

  function sfx(nombre, volumen) {
    if (!_desbloqueado) return;
    const ruta = SFX[nombre];
    if (!ruta) return;
    // Clonar para permitir solapamiento de sonidos
    const base = _cargar(ruta);
    const clon = base.cloneNode();
    clon.volume = volumen !== undefined ? volumen : VOL.sfx;
    clon.play().catch(() => {});
  }

  // ─────────────────────────────────────────────
  // PÚBLICO: bip de diálogo (mientras se escribe texto)
  // Llama a iniciarBip() al empezar y detenerBip() al terminar
  // ─────────────────────────────────────────────
  function iniciarBip(intervaloMs = 80) {
    if (_bipActivo) return;
    _bipActivo = true;
    _bipTimer = setInterval(() => {
      sfx('dialogo_bip', VOL.bip);
    }, intervaloMs);
  }

  function detenerBip() {
    _bipActivo = false;
    if (_bipTimer) { clearInterval(_bipTimer); _bipTimer = null; }
  }

  // ─────────────────────────────────────────────
  // PÚBLICO: ajustar volumen global de música/sfx
  // ─────────────────────────────────────────────
  function setVolMusica(v) {
    VOL.musica = Math.max(0, Math.min(1, v));
    if (_musicaActual && !_musicaActual.paused) _musicaActual.volume = VOL.musica;
  }

  function setVolSFX(v) {
    VOL.sfx = Math.max(0, Math.min(1, v));
  }

  // API pública
  return { musica, detenerMusica, sfx, iniciarBip, detenerBip, desbloquear, setVolMusica, setVolSFX, MUSICA, SFX };

})();

// ─────────────────────────────────────────────────────
// Desbloquear audio en el primer toque/click del usuario
// (política de autoplay de Chrome, Safari, Firefox móvil)
// ─────────────────────────────────────────────────────
['click', 'touchstart', 'keydown'].forEach(ev => {
  document.addEventListener(ev, () => Audio.desbloquear(), { once: true });
});