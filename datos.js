// ═══════════════════════════════════════════════════════
// datos.js — BioVilla: La Célula Viva
// Diálogos, preguntas, personajes y contenido educativo
// ═══════════════════════════════════════════════════════

const INTRO_SECUENCIAS = [
  {
    retrato: "🌌",
    nombre: "SISTEMA",
    texto: "En algún lugar dentro de un organismo vivo... existe una aldea invisible para el ojo humano."
  },
  {
    retrato: "🌌",
    nombre: "SISTEMA",
    texto: "Esta aldea se llama BIOVILLA. Cada casa, cada generador, cada camino... es parte de una célula viva."
  },
  {
    retrato: "<img src='HectorSinBote.png' class='retrato-img'>",
    nombre: "HÉCTOR",
    texto: "¿Qué es este lugar...? Recuerdo que me quedé dormido leyendo sobre bioenergía y ahora... ¡estoy aquí dentro!"
  },
  {
    retrato: "<img src='MissCinthia.png' class='retrato-img'>",
    nombre: "MISS CINTHIA",
    texto: "¡Bienvenido a BioVilla, Héctor! Soy la guía de esta célula. Aquí aprenderás cómo funcionamos como una planta generadora de energía."
  },
  {
    retrato: "<img src='MissCinthia.png' class='retrato-img'>",
    nombre: "MISS CINTHIA",
    texto: "Explora las zonas, habla con los aldeanos, y cuando estés listo... enfrenta al FALLO ENERGÉTICO en la Zona Danger."
  },
  {
    retrato: "<img src='HectorSinBote.png' class='retrato-img'>",
    nombre: "HÉCTOR",
    texto: "¡Entendido! Voy a aprender todo sobre el metabolismo y el ATP. ¡No fallaré, Miss Cinthia!"
  }
];

const DIALOGOS_CINTHIA = [
  {
    retrato: "",
    nombre: "MISS CINTHIA",
    texto: "En esta aldea, la energía se transforma como en una planta eléctrica... pero aquí ocurre dentro de la célula."
  },
  {
    retrato: "",
    nombre: "MISS CINTHIA",
    texto: "La GLUCOSA es nuestro combustible. Sin ella, los aldeanos no pueden trabajar ni producir energía."
  },
  {
    retrato: "",
    nombre: "MISS CINTHIA",
    texto: "El METABOLISMO es el conjunto de reacciones químicas que mantienen la vida. ¡Es el sistema de transformación de energía de BioVilla!"
  },
  {
    retrato: "",
    nombre: "MISS CINTHIA",
    texto: "Visita el NÚCLEO para entender cómo se controla todo. Luego ve a la MITOCONDRIA a ver cómo se genera el ATP."
  },
  {
    retrato: "",
    nombre: "MISS CINTHIA",
    texto: "Cuando sientas que estás listo... el Fallo Energético te espera en la Zona Danger. ¡Buena suerte, Héctor!"
  }
];

const ZONAS = {
  nucleo: {
    fondo: "linear-gradient(135deg, #0a1628 0%, #162448 100%)",
    dialogos: [
      {
        retrato: "🏛",
        nombre: "ALDEANO DEL NÚCLEO",
        texto: "¡Bienvenido al Centro de Control! Aquí se guarda el ADN, las instrucciones de toda BioVilla."
      },
      {
        retrato: "🏛",
        nombre: "ALDEANO DEL NÚCLEO",
        texto: "El METABOLISMO es como el plan de trabajo de la aldea. Divide en dos partes: el CATABOLISMO (descomponer para obtener energía) y el ANABOLISMO (construir cosas nuevas)."
      },
      {
        retrato: "🏛",
        nombre: "ALDEANO DEL NÚCLEO",
        texto: "¿Ves cómo el núcleo controla todo? Así como la sala de control de una planta eléctrica decide qué generadores encender... el núcleo decide qué proteínas producir."
      }
    ],
    quiz: {
      icono: "🏛",
      titulo: "DESAFÍO DEL NÚCLEO",
      pregunta: "¿Qué es el METABOLISMO celular?",
      opciones: [
        { texto: "El conjunto de reacciones químicas que transforman energía para mantener la vida", correcto: true },
        { texto: "Solo la producción de ATP en la mitocondria", correcto: false },
        { texto: "El proceso de división celular", correcto: false },
        { texto: "El movimiento de electrones en la membrana", correcto: false }
      ],
      feedbackOk: "¡Correcto! El metabolismo es el motor de transformación de energía de la célula. ¡+25 ATP!",
      feedbackFail: "No es correcto. El metabolismo incluye TODAS las reacciones químicas celulares, no solo una.",
      atpRecompensa: 25
    }
  },

  mitocondria: {
    fondo: "linear-gradient(135deg, #0a2010 0%, #0f3020 100%)",
    dialogos: [
      {
        retrato: "⚡",
        nombre: "INGENIERO MITOCONDRIAL",
        texto: "¡Bienvenido a la central eléctrica de BioVilla! Aquí en la Mitocondria, convertimos glucosa en ATP... ¡la electricidad de la célula!"
      },
      {
        retrato: "⚡",
        nombre: "INGENIERO MITOCONDRIAL",
        texto: "El ATP (Adenosín Trifosfato) funciona como la electricidad: almacena energía en sus enlaces y la libera cuando la célula la necesita. Sin ATP, ¡todo se apaga!"
      },
      {
        retrato: "⚡",
        nombre: "INGENIERO MITOCONDRIAL",
        texto: "¿Ves el gradiente de protones? ¡Es como la presión hidráulica de una represa! Los protones fluyen y hacen girar la ATP sintasa como una turbina."
      },
      {
        retrato: "⚡",
        nombre: "INGENIERO MITOCONDRIAL",
        texto: "Esta célula se parece más a una PLANTA HIDRÁULICA: usamos gradientes (como el agua) para generar energía en forma de ATP (como la electricidad)."
      }
    ],
    quiz: {
      icono: "⚡",
      titulo: "DESAFÍO DE LA MITOCONDRIA",
      pregunta: "¿A qué equivale el ATP en la comparación con una planta eléctrica?",
      opciones: [
        { texto: "Al combustible (glucosa que entra)", correcto: false },
        { texto: "A la electricidad generada (energía utilizable)", correcto: true },
        { texto: "A la turbina que gira", correcto: false },
        { texto: "A la presión hidráulica", correcto: false }
      ],
      feedbackOk: "¡Exacto! El ATP es la 'electricidad' celular: energía lista para usar. ¡+35 ATP!",
      feedbackFail: "Incorrecto. El ATP es el PRODUCTO final, la energía utilizable, no el combustible ni el mecanismo.",
      atpRecompensa: 35
    }
  },

  redox: {
    fondo: "linear-gradient(135deg, #1a0f00 0%, #2a1500 100%)",
    dialogos: [
      {
        retrato: "🔋",
        nombre: "CIENTÍFICO REDOX",
        texto: "¡Las reacciones REDOX son el corazón de la cadena de transporte de electrones! REDOX viene de REDucción y OXidación."
      },
      {
        retrato: "🔋",
        nombre: "CIENTÍFICO REDOX",
        texto: "OXIDACIÓN: perder electrones. Como cuando el hierro se oxida y pierde partículas. En la respiración, la glucosa se OXIDA y libera energía."
      },
      {
        retrato: "🔋",
        nombre: "CIENTÍFICO REDOX",
        texto: "REDUCCIÓN: ganar electrones. El oxígeno se REDUCE al final de la cadena, formando agua. ¡Siempre van juntas: si algo se oxida, otro se reduce!"
      },
      {
        retrato: "🔋",
        nombre: "CIENTÍFICO REDOX",
        texto: "¿Sabías que una batería funciona igual? El ánodo se OXIDA (pierde electrones) y el cátodo se REDUCE (gana electrones). ¡La célula es una batería viva!"
      }
    ],
    quiz: {
      icono: "🔋",
      titulo: "DESAFÍO REDOX",
      pregunta: "En una reacción REDOX, ¿qué significa OXIDACIÓN?",
      opciones: [
        { texto: "Ganar electrones y aumentar energía", correcto: false },
        { texto: "Perder electrones y liberar energía", correcto: true },
        { texto: "Absorber oxígeno del ambiente", correcto: false },
        { texto: "Producir ATP directamente", correcto: false }
      ],
      feedbackOk: "¡Correcto! Oxidación = perder electrones. ¡La glucosa se oxida para liberar energía! ¡+40 ATP!",
      feedbackFail: "No es correcto. Oxidación significa PERDER electrones (aunque puede confundirse con 'absorber oxígeno').",
      atpRecompensa: 40
    }
  }
};

const BOSS_DATA = {
  nombre: "FALLO ENERGÉTICO",
  retrato: "💀",
  hpTotal: 3,
  introduccion: [
    {
      texto: "JA JA JA... ¡Héctor! Has llegado hasta aquí. Pero nadie puede vencerme sin entender el sistema energético celular...",
    },
    {
      texto: "Soy el FALLO ENERGÉTICO. Si la cadena de transporte de electrones se detiene... ¡TODO se acaba! ¿Puedes responder mis preguntas y salvar a BioVilla?"
    }
  ],
  preguntas: [
    {
      icono: "💀",
      titulo: "ATAQUE DEL BOSS — FASE 1",
      pregunta: "Si la cadena de transporte de electrones se DETIENE, ¿qué ocurre con la producción de ATP?",
      opciones: [
        { texto: "El ATP se produce más rápido por compensación", correcto: false },
        { texto: "La producción de ATP cae casi a cero y la célula colapsa energéticamente", correcto: true },
        { texto: "La glucólisis produce suficiente ATP para suplir la diferencia", correcto: false },
        { texto: "Las mitocondrias se dividen para producir más energía", correcto: false }
      ],
      feedbackOk: "¡Bien! Sin la cadena de transporte, el gradiente de protones desaparece. La ATP sintasa se detiene. ¡Solo queda la glucólisis con muy poco ATP!",
      feedbackFail: "¡INCORRECTO! La cadena de transporte genera el 90% del ATP. Sin ella, la célula muere por falta de energía.",
      danoBoss: 1
    },
    {
      icono: "💀",
      titulo: "ATAQUE DEL BOSS — FASE 2",
      pregunta: "En una planta eléctrica, si se DETIENE la turbina, ¿qué pasa? ¿Cómo se relaciona esto con la mitocondria?",
      opciones: [
        { texto: "La planta produce más electricidad por reserva de combustible", correcto: false },
        { texto: "Se corta la generación de electricidad, como cuando la ATP sintasa para de girar y no hay ATP", correcto: true },
        { texto: "Los paneles solares compensan la energía perdida", correcto: false },
        { texto: "Solo baja un poco la producción pero no hay problema grave", correcto: false }
      ],
      feedbackOk: "¡PERFECTO! La turbina = ATP sintasa. Si para → no hay electricidad = no hay ATP. ¡La analogía es exacta!",
      feedbackFail: "¡Fallo! Cuando la turbina para, NO hay generación. Igual en la mitocondria: sin rotación de ATP sintasa = sin ATP.",
      danoBoss: 1
    },
    {
      icono: "💀",
      titulo: "ATAQUE FINAL — ¡GOLPE DEFINITIVO!",
      pregunta: "Completa: \"Mi célula funciona como una planta HIDRÁULICA porque...\"",
      opciones: [
        { texto: "...usa agua para generar energía directamente en el citoplasma", correcto: false },
        { texto: "...usa el flujo de protones (como agua en una represa) para hacer girar la ATP sintasa y generar ATP, como una turbina genera electricidad", correcto: true },
        { texto: "...la glucosa fluye como el agua por tuberías hasta el núcleo", correcto: false },
        { texto: "...tiene membranas que funcionan como presas artificiales que almacenan agua", correcto: false }
      ],
      feedbackOk: "¡¡¡VICTORIA TOTAL!!! ¡Derrotaste al Fallo Energético! El gradiente de protones = la presión del agua. La ATP sintasa = la turbina. ¡BioVilla está a salvo!",
      feedbackFail: "¡Casi! El gradiente de PROTONES (H⁺) fluye a través de la ATP sintasa como el agua en una turbina hidráulica. ¡Inténtalo de nuevo!",
      danoBoss: 1
    }
  ],
  dialogoVictoria: "N-no puede ser... ¡Un estudiante que entiende el metabolismo, el ATP y las reacciones REDOX! ¡BioVilla... está... a salvo!",
  textoVictoria: "Comprendiste que la célula es una planta generadora viva.\nEl metabolismo transforma glucosa en ATP mediante reacciones REDOX.\nLa cadena de transporte de electrones es la turbina que nunca debe parar.\n\n¡Proyecto BioEnergía completado! 🏆"
};