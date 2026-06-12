/* ===== PCUrandomizer ===== */
(function () {
  "use strict";

  var DATA_KEY = "pcurandomizer:data";
  var ANIM_KEY = "pcurandomizer:anim";
  var KEYS = ["personajes", "caracteristicas", "universos"];

  /* ---- Estado ---- */
  var state = loadData();
  var animEnabled = loadAnim();
  var lastTriplet = null; // { personajes: idx, ... }
  var spinning = false;

  /* ---- Persistencia ---- */
  function loadData() {
    var base = { personajes: [], caracteristicas: [], universos: [] };
    try {
      var raw = JSON.parse(localStorage.getItem(DATA_KEY));
      if (raw && typeof raw === "object") {
        KEYS.forEach(function (k) {
          if (Array.isArray(raw[k])) base[k] = raw[k].slice();
        });
      }
    } catch (e) { /* ignorar */ }
    return base;
  }
  function saveData() {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function loadAnim() {
    var v = localStorage.getItem(ANIM_KEY);
    return v === null ? true : v === "true";
  }
  function saveAnim() {
    try { localStorage.setItem(ANIM_KEY, String(animEnabled)); } catch (e) {}
  }

  /* ---- Referencias DOM ---- */
  var viewInput = document.getElementById("view-input");
  var viewRoulette = document.getElementById("view-roulette");
  var goBtn = document.getElementById("go-btn");
  var clearBtn = document.getElementById("clear-btn");
  var goHelp = document.getElementById("go-help");
  var backBtn = document.getElementById("back-btn");
  var nextBtn = document.getElementById("next-btn");
  var animToggle = document.getElementById("anim-toggle");
  var modalOverlay = document.getElementById("modal-overlay");
  var modalConfirm = document.getElementById("modal-confirm");
  var modalCancel = document.getElementById("modal-cancel");

  var columns = {}; // key -> { input, chips }
  document.querySelectorAll("#view-input .column").forEach(function (col) {
    var key = col.getAttribute("data-key");
    columns[key] = {
      input: col.querySelector(".concept-input"),
      chips: col.querySelector(".chips")
    };
  });

  var reels = {}; // key -> { window, strip }
  document.querySelectorAll("#view-roulette .reel").forEach(function (reel) {
    var key = reel.getAttribute("data-key");
    reels[key] = {
      window: reel.querySelector(".reel-window"),
      strip: reel.querySelector(".reel-strip")
    };
  });

  /* ---- Render de chips ---- */
  function renderChips(key) {
    var ul = columns[key].chips;
    ul.innerHTML = "";
    state[key].forEach(function (value, idx) {
      var li = document.createElement("li");
      li.className = "chip";

      var span = document.createElement("span");
      span.textContent = value;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Eliminar " + value);
      btn.textContent = "×";
      btn.addEventListener("click", function () {
        state[key].splice(idx, 1);
        saveData();
        renderChips(key);
        updateGoState();
      });

      li.appendChild(span);
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  function addConcept(key, value) {
    var v = value.trim();
    if (!v) return;
    // evitar duplicados exactos (case-insensitive)
    var exists = state[key].some(function (x) {
      return x.toLowerCase() === v.toLowerCase();
    });
    if (exists) return;
    state[key].push(v);
    saveData();
    renderChips(key);
    updateGoState();
  }

  /* ---- Botón GO! ---- */
  function allColumnsReady() {
    return KEYS.every(function (k) { return state[k].length > 0; });
  }
  function hasAnyConcept() {
    return KEYS.some(function (k) { return state[k].length > 0; });
  }
  function updateGoState() {
    var ready = allColumnsReady();
    goBtn.disabled = !ready;
    goHelp.classList.toggle("hidden", ready);
    clearBtn.disabled = !hasAnyConcept();
  }

  /* ---- Modal de confirmación ---- */
  function openModal() {
    modalOverlay.classList.remove("hidden");
    modalConfirm.focus();
  }
  function closeModal() {
    modalOverlay.classList.add("hidden");
  }
  function doClear() {
    KEYS.forEach(function (k) { state[k] = []; });
    saveData();
    KEYS.forEach(renderChips);
    updateGoState();
  }

  function clearLists() {
    if (!hasAnyConcept()) return;
    openModal();
  }

  /* ---- Navegación entre vistas ---- */
  function showRoulette() {
    viewInput.classList.add("hidden");
    viewRoulette.classList.remove("hidden");
  }
  function showInput() {
    viewRoulette.classList.add("hidden");
    viewInput.classList.remove("hidden");
  }

  /* ---- Generación de tripletas ---- */
  function randIndex(len) {
    return Math.floor(Math.random() * len);
  }

  function pickTriplet() {
    // total de combinaciones posibles
    var total = KEYS.reduce(function (acc, k) {
      return acc * state[k].length;
    }, 1);

    var triplet, attempts = 0;
    do {
      triplet = {};
      KEYS.forEach(function (k) {
        triplet[k] = randIndex(state[k].length);
      });
      attempts++;
    } while (
      total > 1 &&
      lastTriplet &&
      attempts < 20 &&
      KEYS.every(function (k) { return triplet[k] === lastTriplet[k]; })
    );

    lastTriplet = triplet;
    return triplet;
  }

  /* ---- Animación de los reels ---- */
  // duraciones distintas por columna para efecto escalonado (tragamonedas)
  var SPIN_DURATIONS = { personajes: 1.4, caracteristicas: 1.7, universos: 2.0 };
  var LOOPS = 6;

  function makeItem(text) {
    var div = document.createElement("div");
    div.className = "reel-item";
    div.textContent = text;
    return div;
  }

  function setStripInstant(key, text) {
    var strip = reels[key].strip;
    strip.classList.add("no-anim");
    strip.style.transitionDuration = "";
    strip.innerHTML = "";
    strip.appendChild(makeItem(text));
    strip.style.transform = "translateY(0)";
  }

  function spinReel(key, chosenIdx) {
    var arr = state[key];
    var strip = reels[key].strip;

    if (!animEnabled || arr.length === 0) {
      setStripInstant(key, arr[chosenIdx]);
      return;
    }

    // construir tira larga que termina en el ítem elegido
    strip.innerHTML = "";
    for (var loop = 0; loop < LOOPS; loop++) {
      arr.forEach(function (txt) { strip.appendChild(makeItem(txt)); });
    }
    var finalPos = strip.childNodes.length; // índice donde irá el elegido
    strip.appendChild(makeItem(arr[chosenIdx]));

    // medir el alto real del ítem renderizado (debe coincidir con el desplazamiento)
    var itemH = strip.firstChild.getBoundingClientRect().height;

    // posición inicial sin animación
    strip.classList.add("no-anim");
    strip.style.transform = "translateY(0)";
    // forzar reflow para que el cambio de transform anime
    void strip.offsetHeight;
    strip.classList.remove("no-anim");
    strip.style.transitionDuration = SPIN_DURATIONS[key] + "s";
    strip.style.transform = "translateY(" + (-finalPos * itemH) + "px)";
  }

  function spin() {
    if (spinning) return;
    var triplet = pickTriplet();

    if (animEnabled) {
      spinning = true;
      nextBtn.disabled = true;
      var maxDur = Math.max.apply(null, KEYS.map(function (k) {
        return SPIN_DURATIONS[k];
      }));
      setTimeout(function () {
        spinning = false;
        nextBtn.disabled = false;
      }, maxDur * 1000 + 80);
    }

    KEYS.forEach(function (k) { spinReel(k, triplet[k]); });
  }

  /* ---- Toggle de animación ---- */
  function updateAnimToggle() {
    animToggle.textContent = "Animación: " + (animEnabled ? "ON" : "OFF");
  }

  /* ---- Listeners ---- */
  KEYS.forEach(function (key) {
    columns[key].input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addConcept(key, this.value);
        this.value = "";
      }
    });
  });

  goBtn.addEventListener("click", function () {
    if (!allColumnsReady()) return;
    showRoulette();
    spin();
  });

  clearBtn.addEventListener("click", clearLists);

  modalConfirm.addEventListener("click", function () {
    doClear();
    closeModal();
  });
  modalCancel.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modalOverlay.classList.contains("hidden")) {
      closeModal();
    }
  });

  nextBtn.addEventListener("click", spin);
  backBtn.addEventListener("click", showInput);

  animToggle.addEventListener("click", function () {
    animEnabled = !animEnabled;
    saveAnim();
    updateAnimToggle();
  });

  /* ---- Init ---- */
  KEYS.forEach(renderChips);
  updateGoState();
  updateAnimToggle();
})();
