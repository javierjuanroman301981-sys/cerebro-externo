/* =============================================================
   Cerebro Externo Â· MicroApp
   app.js â€” 100% cliente. Sin backend, sin base de datos.
   Persistencia: localStorage (progreso por usuario en el dispositivo).
   ============================================================= */
(function () {
  "use strict";

  /* ============================================================
     1. UTILIDADES
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Copia profunda con respaldo para navegadores viejos que no traen structuredClone
  const clone = (typeof structuredClone === "function")
    ? structuredClone
    : (o) => JSON.parse(JSON.stringify(o));

  function todayKey(d = new Date()) {
    const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return x.toISOString().slice(0, 10);
  }
  function last7Keys() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(todayKey(d));
    }
    return out;
  }
  function dayShort(key) {
    const d = new Date(key + "T12:00:00");
    return ["Dom", "Lun", "Mar", "MiÃ©", "Jue", "Vie", "SÃ¡b"][d.getDay()];
  }
  function fmtClock(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  function relTime(ts) {
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 60) return "hace un momento";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} d`;
  }
  function fmtEvery(min) {
    if (min % 60 === 0) return `cada ${min / 60} h`;
    if (min > 60) return `cada ${Math.floor(min / 60)} h ${min % 60} min`;
    return `cada ${min} min`;
  }

  /* ============================================================
     2. ICONOS (trazo, estilo moderno)
     ============================================================ */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    brain: '<path d="M12 5a3 3 0 0 0-5.9-.8A3 3 0 0 0 4 9.5 3 3 0 0 0 6 15a3 3 0 0 0 6 .8Z"/><path d="M12 5a3 3 0 0 1 5.9-.8A3 3 0 0 1 20 9.5 3 3 0 0 1 18 15a3 3 0 0 1-6 .8Z"/><path d="M12 5v11"/>',
    template: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    bell: '<path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/>',
    chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12.5" y="8" width="3" height="10" rx="1"/><rect x="18" y="5" width="3" height="13" rx="1"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M19 3v18"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z"/>',
    droplet: '<path d="M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3Z"/>',
    pill: '<path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"/><path d="M8.5 8.5l7 7"/>',
    sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M6.3 17.7l2.4-2.4M15.3 8.7l2.4-2.4"/>',
    flower: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM9.5 12a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0ZM19.5 12a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>',
    lungs: '<path d="M12 4v8"/><path d="M12 12c0-2-2-3-2-3M12 12c0-2 2-3 2-3"/><path d="M8 9c-2 1-3 4-3 7 0 2 1 3 3 3s3-1 3-3v-6c0-1-1-2-3-1ZM16 9c2 1 3 4 3 7 0 2-1 3-3 3s-3-1-3-3v-6c0-1 1-2 3-1Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4h6v3"/>',
    play: '<path d="M7 4v16l13-8Z"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    heart: '<path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    coffee: '<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 9h2a2 2 0 0 1 0 4h-2"/><path d="M7 2v2M11 2v2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    camera: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.4-2h5.2L16 6h2.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5Z"/><circle cx="12" cy="13" r="3.4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.1-2.4 3.8"/><path d="M12 17.5h.01"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
  };
  function icon(name, size = 20, sw = 2) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.check}</svg>`;
  }

  /* ============================================================
     3. ESTADO (store) + persistencia
     ============================================================ */
  const KEY = "cerebro-externo/v1";

  function seedAlerts() {
    return [
      { id: uid(), label: "Beber agua", icon: "droplet", every: 90, on: true, last: Date.now() },
      { id: uid(), label: "Medicinas / vitaminas", icon: "pill", every: 240, on: false, last: Date.now() },
      { id: uid(), label: "Bloque de orden (5 min)", icon: "sparkles", every: 180, on: true, last: Date.now() },
      { id: uid(), label: "Tiempo para ti", icon: "flower", every: 240, on: true, last: Date.now() },
      { id: uid(), label: "Pausa para respirar", icon: "lungs", every: 120, on: false, last: Date.now() },
    ];
  }

  const DEFAULT_STATE = {
    version: 1,
    user: { name: "", since: null },
    theme: null, // null => sigue al sistema hasta que elija
    template: null,
    activation: { template: false, alerts: false, firstBlock: false },
    brainDump: [], // {id, text, done, ts}
    alerts: seedAlerts(),
    blocks: [], // {id, title, icon, done, ts}
    history: {}, // dateKey -> nÂº de micro-bloques completados
    notifications: [], // {id, title, body, ts, read}
    browserNotify: false,
    timer: null, // {blockId, total, remaining, running}
    // --- Perfil (se completa desde la secciÃ³n Perfil) ---
    profile: {
      photo: null,                 // dataURL de la foto o null
      location: { country: "", city: "" },
      hasKids: null,               // null | true | false
      kidsCount: 0,
      kids: [],                    // nombres de cada hijo/a
      occupation: "",
    },
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      const merged = Object.assign(clone(DEFAULT_STATE), parsed);
      // Normaliza el sub-objeto de Perfil para versiones anteriores
      merged.profile = Object.assign(clone(DEFAULT_STATE.profile), merged.profile || {});
      merged.profile.location = Object.assign({ country: "", city: "" }, merged.profile.location || {});
      if (!Array.isArray(merged.profile.kids)) merged.profile.kids = [];
      return merged;
    } catch (e) {
      console.warn("No se pudo leer el progreso guardado:", e);
      return clone(DEFAULT_STATE);
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      toast("No se pudo guardar el progreso (almacenamiento lleno).", "warn");
    }
  }
  function set(mutator) {
    mutator(state);
    save();
    render();
  }

  /* ============================================================
     4. PLANTILLAS (Paso 1 de activaciÃ³n)
     ============================================================ */
  const TEMPLATES = {
    bebes: {
      name: "Con bebÃ© en casa",
      emoji: "ðŸ¼",
      desc: "Micro-bloques cortos alrededor de las siestas y las tomas.",
      blocks: [
        "Preparar el bolso de paÃ±ales",
        "Ordenar la zona de juego (5 min)",
        "Dejar lista una comida rÃ¡pida",
        "Beber un vaso de agua",
        "5 min de estiramiento",
        "Anotar 3 pendientes de maÃ±ana",
      ],
      alerts: { "Beber agua": 60, "Bloque de orden (5 min)": 120, "Tiempo para ti": 180 },
    },
    homeoffice: {
      name: "Home office",
      emoji: "ðŸ’»",
      desc: "Bloques de foco con pausas para el cuerpo y la mente.",
      blocks: [
        "Definir la tarea #1 del dÃ­a",
        "Bloque de foco: 5 min de arranque",
        "Pausa visual 20-20-20",
        "Responder mensajes pendientes",
        "Ordenar el escritorio",
        "Cierre del dÃ­a: anotar 3 logros",
      ],
      alerts: { "Beber agua": 90, "Pausa para respirar": 90, "Tiempo para ti": 240 },
    },
    varios: {
      name: "Varios hijos",
      emoji: "ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦",
      desc: "Coordina colegio, comidas y tareas sin perder el hilo.",
      blocks: [
        "Preparar mochilas y uniformes",
        "Revisar la agenda escolar",
        "Dejar la cena decidida",
        "Bloque de tareas con los niÃ±os",
        "Ordenar zonas comunes (5 min)",
        "Preparar la ropa de maÃ±ana",
      ],
      alerts: { "Beber agua": 90, "Bloque de orden (5 min)": 150, "Tiempo para ti": 240 },
    },
  };

  function applyTemplate(id) {
    const tpl = TEMPLATES[id];
    if (!tpl) return;
    set((s) => {
      s.template = id;
      s.activation.template = true;
      // Reemplaza los micro-bloques por los de la plantilla (los completados de hoy se conservan en el historial)
      s.blocks = tpl.blocks.map((title) => ({ id: uid(), title, icon: "target", done: false, ts: Date.now() }));
      // Ajusta las alertas sugeridas
      s.alerts.forEach((a) => {
        if (tpl.alerts[a.label] != null) {
          a.every = tpl.alerts[a.label];
          a.on = true;
        }
      });
    });
    pushNotif("Plantilla importada", `â€œ${tpl.name}â€ estÃ¡ lista. Ya tienes tus micro-bloques cargados.`, "template");
    toast(`Plantilla â€œ${tpl.name}â€ importada`, "ok");
  }

  /* ============================================================
     5. NOTIFICACIONES (campana + navegador)
     ============================================================ */
  function pushNotif(title, body, iconName = "bell") {
    state.notifications.unshift({ id: uid(), title, body, ts: Date.now(), read: false, icon: iconName });
    state.notifications = state.notifications.slice(0, 40);
    save();
    updateBell();
    if (!$("#bellPopover").hidden) renderNotifList();
    maybeBrowserNotify(title, body);
  }
  function updateBell() {
    const badge = $("#bellBadge");
    if (!badge) return;
    const unread = state.notifications.filter((n) => !n.read).length;
    badge.textContent = unread > 9 ? "9+" : unread;
    badge.hidden = unread === 0;
  }
  function maybeBrowserNotify(title, body) {
    if (!state.browserNotify) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try { new Notification(title, { body, icon: undefined }); } catch (e) {}
  }
  // Estado real de las notificaciones del sistema en este dispositivo/navegador.
  // 'unsupported' | 'default' | 'granted' | 'denied'
  function notifState() {
    try {
      if (!("Notification" in window)) return "unsupported";
      if (typeof Notification.requestPermission !== "function") return "unsupported";
      return Notification.permission || "default";
    } catch (e) {
      return "unsupported";
    }
  }
  async function requestBrowserNotify() {
    const st = notifState();
    if (st === "unsupported") {
      toast("Este dispositivo o navegador no admite notificaciones del sistema.", "warn");
      return;
    }
    if (st === "denied") {
      toast("EstÃ¡n bloqueadas. ActÃ­valas desde los ajustes de este sitio en tu navegador.", "warn");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      set((s) => { s.browserNotify = perm === "granted"; });
      toast(perm === "granted" ? "Notificaciones del sistema activadas" : "No se concediÃ³ el permiso", perm === "granted" ? "ok" : "warn");
    } catch (e) {
      toast("Este navegador no permitiÃ³ pedir el permiso.", "warn");
    }
  }

  /* ============================================================
     6. MOTOR DE ALERTAS (funciona mientras la app estÃ¡ abierta)
     ============================================================ */
  function alertsTick() {
    if (!state.user.name) return;
    const now = Date.now();
    let fired = false;
    state.alerts.forEach((a) => {
      if (!a.on) return;
      if (now - (a.last || 0) >= a.every * 60000) {
        a.last = now;
        fired = true;
        pushNotif("Recordatorio: " + a.label, "Tu cerebro externo te avisa. TÃ³mate el micro-bloque cuando puedas.", a.icon);
        toast(`â° ${a.label}`, "info");
      }
    });
    if (fired) save();
  }
  function fireAlertNow(id) {
    const a = state.alerts.find((x) => x.id === id);
    if (!a) return;
    a.last = Date.now();
    save();
    pushNotif("Recordatorio: " + a.label, "Aviso de prueba enviado correctamente.", a.icon);
    toast(`â° ${a.label}`, "info");
  }

  /* ============================================================
     7. TEMPORIZADOR DE MICRO-BLOQUES (5 min)
     ============================================================ */
  let timerInt = null;
  function startTimer(blockId) {
    const b = state.blocks.find((x) => x.id === blockId);
    if (!b) return;
    set((s) => { s.timer = { blockId, total: 300, remaining: 300, running: true }; });
    runTimerLoop();
    if (currentRoute() !== "microbloques") go("microbloques");
  }
  function toggleTimer() {
    if (!state.timer) return;
    set((s) => { s.timer.running = !s.timer.running; });
    runTimerLoop();
  }
  function resetTimer() {
    stopTimerLoop();
    set((s) => { s.timer = null; });
  }
  function runTimerLoop() {
    stopTimerLoop();
    if (!state.timer || !state.timer.running) return;
    timerInt = setInterval(() => {
      if (!state.timer || !state.timer.running) return stopTimerLoop();
      state.timer.remaining = Math.max(0, state.timer.remaining - 1);
      save();
      updateTimerUI();
      if (state.timer.remaining <= 0) {
        const id = state.timer.blockId;
        stopTimerLoop();
        completeBlock(id, true);
        state.timer = null;
        save();
        render();
        pushNotif("Micro-bloque completado", "5 minutos bien invertidos. Una tarea menos en tu cabeza.", "check");
        toast("Â¡Micro-bloque completado! ðŸŽ‰", "ok");
        confetti();
      }
    }, 1000);
  }
  function stopTimerLoop() { if (timerInt) { clearInterval(timerInt); timerInt = null; } }

  function updateTimerUI() {
    const t = state.timer;
    if (!t) return;
    const timeEl = $("#timerTime");
    const ring = $("#timerRing");
    if (timeEl) timeEl.textContent = fmtClock(t.remaining);
    if (ring) {
      const C = 2 * Math.PI * 90;
      ring.style.strokeDasharray = C;
      ring.style.strokeDashoffset = C * (1 - t.remaining / t.total);
    }
  }

  /* ============================================================
     8. MICRO-BLOQUES: acciones
     ============================================================ */
  function completeBlock(id, done) {
    const b = state.blocks.find((x) => x.id === id);
    if (!b) return;
    const was = b.done;
    b.done = done;
    if (done && !was) {
      const k = todayKey();
      state.history[k] = (state.history[k] || 0) + 1;
      if (!state.activation.firstBlock) state.activation.firstBlock = true;
    } else if (!done && was) {
      const k = todayKey();
      state.history[k] = Math.max(0, (state.history[k] || 0) - 1);
    }
    save();
  }
  function toggleBlock(id) {
    const b = state.blocks.find((x) => x.id === id);
    if (!b) return;
    completeBlock(id, !b.done);
    render();
    if (b.done) { toast("Hecho âœ“", "ok"); if (!prefersReduced) confetti(6); }
  }
  function addBlock(title) {
    title = title.trim();
    if (!title) return false;
    set((s) => s.blocks.push({ id: uid(), title, icon: "target", done: false, ts: Date.now() }));
    return true;
  }
  function removeBlock(id) {
    set((s) => { s.blocks = s.blocks.filter((b) => b.id !== id); });
  }

  /* ============================================================
     9. ESTADÃSTICAS DERIVADAS
     ============================================================ */
  function stats() {
    const k = todayKey();
    const doneToday = state.blocks.filter((b) => b.done).length;
    const totalToday = state.blocks.length;
    const pct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;
    const histDone = state.history[k] || 0;
    // Racha: dÃ­as consecutivos (terminando hoy o ayer) con >=1 completado
    let streak = 0;
    const d = new Date();
    if (!(state.history[todayKey(d)] > 0)) d.setDate(d.getDate() - 1);
    while (state.history[todayKey(d)] > 0) { streak++; d.setDate(d.getDate() - 1); }
    const week = last7Keys().map((key) => ({ key, day: dayShort(key), val: state.history[key] || 0 }));
    const weekTotal = week.reduce((a, b) => a + b.val, 0);
    const activeAlerts = state.alerts.filter((a) => a.on).length;
    const pending = state.brainDump.filter((x) => !x.done).length;
    const actDone = Object.values(state.activation).filter(Boolean).length;
    return { doneToday, totalToday, pct, histDone, streak, week, weekTotal, activeAlerts, pending, actDone };
  }

  /* ============================================================
     10. TOASTS / MODAL / CONFETTI
     ============================================================ */
  function toast(msg, kind = "ok") {
    const wrap = $("#toasts");
    const el = document.createElement("div");
    el.className = `toast toast--${kind}`;
    const ic = kind === "warn" ? "zap" : kind === "info" ? "bell" : "check";
    el.innerHTML = `<span class="toast__icon">${icon(ic, 20)}</span><span>${esc(msg)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 320);
    }, 3200);
  }

  function modal({ title, body, confirmText = "Aceptar", cancelText = "Cancelar", danger = false, onConfirm }) {
    const root = $("#modalRoot");
    root.innerHTML = `
      <div class="modal" id="modalOverlay" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal__card">
          <h3 class="modal__title">${esc(title)}</h3>
          <div class="muted">${body}</div>
          <div class="modal__actions">
            <button class="btn btn--ghost" id="modalCancel">${esc(cancelText)}</button>
            <button class="btn ${danger ? "btn--danger" : "btn--cta"}" id="modalConfirm">${esc(confirmText)}</button>
          </div>
        </div>
      </div>`;
    const close = () => { root.innerHTML = ""; };
    $("#modalCancel").onclick = close;
    $("#modalOverlay").onclick = (e) => { if (e.target.id === "modalOverlay") close(); };
    $("#modalConfirm").onclick = () => { try { onConfirm && onConfirm(); } finally { close(); } };
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
    });
    $("#modalConfirm").focus();
  }

  function confetti(count = 90) {
    if (prefersReduced) return;
    const layer = document.createElement("div");
    layer.className = "confetti";
    const colors = ["#6C5CE7", "#55EFC4", "#00B894", "#FF7675", "#8f83f2"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      p.style.animationDelay = Math.random() * 0.3 + "s";
      p.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 3200);
  }

  /* ============================================================
     11. RESUMEN COMPARTIBLE (copiar / compartir)
     ============================================================ */
  function buildSummary() {
    const s = stats();
    const tpl = state.template ? TEMPLATES[state.template].name : "sin plantilla";
    return [
      `âœ¨ Mi dÃ­a con Cerebro Externo â€” ${state.user.name}`,
      `Plantilla: ${tpl}`,
      `Micro-bloques completados hoy: ${s.doneToday}/${s.totalToday} (${s.pct}%)`,
      `Pendientes fuera de mi cabeza: ${state.brainDump.length}`,
      `Alertas activas: ${s.activeAlerts}`,
      `Racha: ${s.streak} ${s.streak === 1 ? "dÃ­a" : "dÃ­as"}`,
    ].join("\n");
  }
  async function copySummary() {
    const text = buildSummary();
    try {
      await navigator.clipboard.writeText(text);
      toast("Resumen copiado al portapapeles", "ok");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("Resumen copiado", "ok"); }
      catch (_) { toast("No se pudo copiar", "warn"); }
      ta.remove();
    }
  }
  async function shareSummary() {
    const text = buildSummary();
    if (navigator.share) {
      try { await navigator.share({ title: "Cerebro Externo", text }); }
      catch (e) { /* cancelado */ }
    } else {
      await copySummary();
      toast("Compartir no disponible: se copiÃ³ el resumen", "info");
    }
  }

  /* ============================================================
     12. ROUTER (hash)
     ============================================================ */
  const ROUTES = {
    inicio: { title: "Inicio", subtitle: "GuÃ­a rÃ¡pida y tu resumen de hoy", navHint: "GuÃ­a y resumen", icon: "home", render: viewInicio },
    volcado: { title: "Volcado mental", subtitle: "SacÃ¡ de la cabeza lo que tenÃ©s pendiente", navHint: "Lo que tenÃ©s en la cabeza", icon: "brain", render: viewVolcado },
    plantillas: { title: "Plantillas", subtitle: "Sets listos para ordenar una situaciÃ³n", navHint: "Estructuras listas para usar", icon: "template", render: viewPlantillas },
    alertas: { title: "Alertas", subtitle: "Recordatorios de tus tareas invisibles", navHint: "Recordatorios automÃ¡ticos", icon: "bell", render: viewAlertas },
    microbloques: { title: "Micro-bloques", subtitle: "Acciones de 5 minutos para avanzar", navHint: "AvanzÃ¡ de a 5 minutos", icon: "timer", render: viewMicrobloques },
    progreso: { title: "Progreso", subtitle: "Tu constancia y tu racha", navHint: "Tu constancia", icon: "chart", render: viewProgreso },
    fundamento: { title: "Fundamento", subtitle: "El mÃ©todo en 5 capÃ­tulos cortos", navHint: "El mÃ©todo, explicado", icon: "book", render: viewFundamento },
    ajustes: { title: "Ajustes", subtitle: "Apariencia y control de tus datos", navHint: "Apariencia y datos", icon: "settings", render: viewAjustes },
    perfil: { title: "Perfil", subtitle: "Tu informaciÃ³n personal", navHint: "Tu informaciÃ³n", icon: "user", render: viewPerfil },
  };
  // El menÃº lateral no cambia: "perfil" se abre desde la tarjeta de usuaria, no desde el menÃº.
  const NAV_ORDER = ["inicio", "volcado", "plantillas", "alertas", "microbloques", "progreso", "fundamento", "ajustes"];

  function currentRoute() {
    const r = location.hash.replace(/^#\/?/, "");
    return ROUTES[r] ? r : "inicio";
  }
  function go(route) {
    location.hash = "#/" + route;
  }
  window.addEventListener("hashchange", () => {
    render();
    closeSidebar();
    const v = $("#view");
    if (v) { v.classList.remove("is-switching"); void v.offsetWidth; v.classList.add("is-switching"); v.focus(); }
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  /* ============================================================
     13. RENDER PRINCIPAL
     ============================================================ */
  function render() {
    if (!state.user.name) return; // aÃºn en onboarding
    const route = currentRoute();
    const def = ROUTES[route];

    // Topbar
    $("#pageTitle").textContent = def.title;
    $("#pageSubtitle").textContent = def.subtitle;

    // Nav
    const s = stats();
    $("#nav").innerHTML = NAV_ORDER.map((r) => {
      const d = ROUTES[r];
      let badge = "";
      if (r === "volcado" && s.pending) badge = `<span class="nav__badge">${s.pending}</span>`;
      if (r === "microbloques" && s.totalToday) badge = `<span class="nav__badge">${s.doneToday}/${s.totalToday}</span>`;
      return `<a class="nav__item ${r === route ? "is-active" : ""}" href="#/${r}">${icon(d.icon)}<span class="nav__lbl"><span>${d.title}</span><small>${d.navHint || ""}</small></span>${badge}</a>`;
    }).join("");

    // Userchip
    $("#avatar").textContent = state.user.name[0] || "?";
    $("#userChipName").textContent = state.user.name;
    $("#userChipStreak").textContent = `Racha de ${s.streak} ${s.streak === 1 ? "dÃ­a" : "dÃ­as"}`;

    // Barra del dÃ­a
    $("#dayFill").style.width = s.pct + "%";

    // Campana
    const unread = state.notifications.filter((n) => !n.read).length;
    const badge = $("#bellBadge");
    badge.textContent = unread > 9 ? "9+" : unread;
    badge.hidden = unread === 0;
    renderNotifList();

    // Vista
    $("#view").innerHTML = def.render(s);
    wireView(route);
    if (route === "microbloques") { updateTimerUI(); }
  }

  function renderNotifList() {
    const list = $("#notifList");
    if (!state.notifications.length) {
      list.innerHTML = `<p class="popover__empty">Sin notificaciones todavÃ­a.<br>Tus alertas aparecerÃ¡n aquÃ­.</p>`;
      return;
    }
    list.innerHTML = state.notifications.map((n) => `
      <div class="notif ${n.read ? "" : "is-unread"}">
        <span class="notif__icon">${icon(n.icon || "bell", 18)}</span>
        <div class="notif__body">
          <strong>${esc(n.title)}</strong>
          <p>${esc(n.body)}</p>
          <time>${relTime(n.ts)}</time>
        </div>
      </div>`).join("");
  }

  /* ============================================================
     14. VISTAS
     ============================================================ */
  function greetingByHour() {
    const h = new Date().getHours();
    if (h < 6) return "AÃºn de madrugada";
    if (h < 12) return "Buenos dÃ­as";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }

  function viewInicio(s) {
    const act = [
      { k: "template", label: "Importa tu plantilla", hint: "Elige el ritmo que se parece a tu vida", route: "plantillas" },
      { k: "alerts", label: "Activa tus alertas", hint: "Agua, orden, medicinas, tiempo propio", route: "alertas" },
      { k: "firstBlock", label: "Ejecuta tu primer micro-bloque", hint: "Solo 5 minutos, sin presiÃ³n", route: "microbloques" },
    ];
    const resume = state.timer
      ? `<div class="card card--brand mt-16">
           <div class="spread wrap">
             <div>
               <div class="card__title" style="color:#fff">Tienes un micro-bloque en marcha</div>
               <p class="muted">${esc(blockTitle(state.timer.blockId))} Â· ${fmtClock(state.timer.remaining)} restantes</p>
             </div>
             <button class="btn" data-go="microbloques">Continuar</button>
           </div>
         </div>` : "";

    return `
      <section class="section">
        <div class="card card--brand">
          <p class="muted" style="font-weight:600">${greetingByHour()},</p>
          <h2 class="hello-name">${esc(state.user.name)} ðŸ‘‹</h2>
          <p class="muted">${s.pending ? `Tienes <strong style="color:#fff">${s.pending}</strong> pendiente(s) en tu volcado mental y ` : "Empieza por soltar lo que traes en la cabeza. "}${s.totalToday ? `<strong style="color:#fff">${s.doneToday}/${s.totalToday}</strong> micro-bloques hechos hoy.` : "aÃºn no tienes micro-bloques cargados."}</p>
          <div class="hstack wrap mt-16">
            <button class="btn" data-go="volcado">${icon("brain", 18)} Volcar pendientes</button>
            <button class="btn" data-go="microbloques">${icon("play", 18)} Empezar 5 min</button>
          </div>
        </div>
        ${resume}
      </section>

      <section class="section">
        <details class="guide" ${(s.actDone === 0 && state.brainDump.length === 0) ? "open" : ""}>
          <summary class="guide__summary">
            <span>${icon("help", 18)} Â¿CÃ³mo funciona esta app?</span>
            <span class="guide__chev">${icon("chevron", 16)}</span>
          </summary>
          <div class="guide__body">
            <p>Cerebro Externo es tu <strong>memoria de apoyo</strong>. En vez de tener todo dando vueltas en la cabeza, lo escribÃ­s acÃ¡, lo partÃ­s en pasos chiquitos y avanzÃ¡s de a 5 minutos. Menos carga mental, sin agendas rÃ­gidas ni culpa.</p>
            <ol class="guide__steps">
              <li data-go="volcado"><span>1</span><div><strong>VolcÃ¡ lo que tenÃ©s en la cabeza</strong><small>Pendientes, ideas, preocupaciones. Todo junto, sin ordenar.</small></div></li>
              <li data-go="volcado"><span>2</span><div><strong>ConvertÃ­ lo importante en micro-bloques</strong><small>TocÃ¡ el botÃ³n de diana en un pendiente para volverlo una acciÃ³n de 5 min.</small></div></li>
              <li data-go="plantillas"><span>3</span><div><strong>UsÃ¡ una plantilla si querÃ©s una estructura lista</strong><small>Un set de micro-bloques y alertas para una situaciÃ³n concreta.</small></div></li>
              <li data-go="microbloques"><span>4</span><div><strong>AvanzÃ¡ en micro-bloques de 5 minutos</strong><small>PonÃ© el reloj, hacÃ© un paso, marcÃ¡ hecho.</small></div></li>
              <li data-go="progreso"><span>5</span><div><strong>MirÃ¡ tu progreso</strong><small>Micro-bloques del dÃ­a, racha y constancia de la semana.</small></div></li>
              <li data-go="alertas"><span>6</span><div><strong>ActivÃ¡ alertas si tu dispositivo las admite</strong><small>Recordatorios de agua, orden, medicinas y tiempo para vos.</small></div></li>
            </ol>
          </div>
        </details>
      </section>

      <section class="section">
        <div class="grid grid--3">
          ${statTile("target", s.doneToday + "/" + s.totalToday, "Micro-bloques hoy")}
          ${statTile("zap", s.streak, s.streak === 1 ? "dÃ­a de racha" : "dÃ­as de racha")}
          ${statTile("bell", s.activeAlerts, "alertas activas")}
        </div>
      </section>

      <section class="section">
        <div class="section__head">
          <div><h2>Tus primeros pasos</h2><p>${s.actDone}/3 completados Â· tocÃ¡ cada uno para ir</p></div>
        </div>
        <div class="card">
          <div class="steps">
            ${act.map((a, i) => `
              <button class="step ${state.activation[a.k] ? "is-done" : ""}" data-go="${a.route}">
                <span class="step__num">${state.activation[a.k] ? icon("check", 16) : i + 1}</span>
                <span class="step__text"><strong>${a.label}</strong><span>${a.hint}</span></span>
                <span class="step__check">${state.activation[a.k] ? icon("check", 18) : icon("play", 15)}</span>
              </button>`).join("")}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__head"><div><h2>Resumen de hoy</h2><p>CÃ³pialo o compÃ¡rtelo</p></div></div>
        <div class="card">
          <div class="donut">
            ${donutSVG(s.pct)}
            <div class="donut__legend">
              <span><span class="legend-dot" style="background:var(--cta)"></span>${s.doneToday} completados</span>
              <span><span class="legend-dot" style="background:var(--surface-2)"></span>${Math.max(0, s.totalToday - s.doneToday)} por hacer</span>
              <span class="faint" style="font-size:.8rem">Semana: ${s.weekTotal} micro-bloques</span>
            </div>
          </div>
          <div class="hstack wrap mt-16">
            <button class="btn btn--ghost" id="copyBtn">${icon("copy", 18)} Copiar resumen</button>
            <button class="btn btn--ghost" id="shareBtn">${icon("share", 18)} Compartir</button>
          </div>
        </div>
      </section>`;
  }

  function statTile(ic, value, label) {
    return `<div class="card card--pad-sm stat">
      <div class="stat__icon">${icon(ic, 20)}</div>
      <div class="stat__value">${esc(String(value))}</div>
      <div class="stat__label">${esc(label)}</div>
    </div>`;
  }

  // Tarjeta breve que explica de quÃ© se trata la secciÃ³n (para usuarias nuevas)
  function intro(html) {
    return `<section class="section"><div class="card card--pad-sm intro-card">${html}</div></section>`;
  }

  function blockTitle(id) {
    const b = state.blocks.find((x) => x.id === id);
    return b ? b.title : "Micro-bloque";
  }

  function viewVolcado(s) {
    const items = state.brainDump;
    return `
      <section class="section">
        <div class="card card--brand">
          <div class="card__title" style="color:#fff">Volcado mental</div>
          <p class="muted">Son esas cosas que tenÃ©s dando vueltas en la cabeza y todavÃ­a no ordenaste: pendientes, ideas, preocupaciones. Escribilas acÃ¡ para sacarlas de tu mente. DespuÃ©s, con el botÃ³n de diana, convertÃ­s las importantes en micro-bloques de 5 minutos.</p>
        </div>
      </section>

      <section class="section">
        <form id="dumpForm" class="dumpbar">
          <input class="input" id="dumpInput" placeholder="Ej. Comprar leche, cita del pediatra, enviar informeâ€¦" maxlength="140" autocomplete="off" />
          <button class="btn btn--cta" type="submit">${icon("plus", 18)} AÃ±adir</button>
        </form>
        <p class="field__help">Consejo: una idea por lÃ­nea. No filtres nada, todo entra.</p>

        ${items.length ? `
          <div class="list" id="dumpList">
            ${items.map((it) => `
              <div class="item ${it.done ? "is-done" : ""}" data-id="${it.id}">
                <button class="item__check" data-act="toggle" aria-label="Marcar">${icon("check", 16)}</button>
                <span class="item__text">${esc(it.text)}</span>
                <button class="iconbtn item__del" data-act="promote" title="Convertir en micro-bloque">${icon("target", 18)}</button>
                <button class="iconbtn item__del" data-act="del" title="Eliminar">${icon("trash", 18)}</button>
              </div>`).join("")}
          </div>
          <div class="hstack wrap mt-16">
            <span class="chip">${items.filter((i) => !i.done).length} sin resolver</span>
            <button class="btn btn--ghost btn--sm" id="clearDoneDump">Quitar resueltos</button>
          </div>
        ` : `
          <div class="empty">${icon("brain", 34)}<p>Tu mente estÃ¡ en blanco aquÃ­â€¦ todavÃ­a.<br>Escribe el primer pendiente arriba.</p></div>
        `}
      </section>`;
  }

  function viewPlantillas(s) {
    return `
      ${intro(`<p>Una <strong>plantilla</strong> es un set listo de micro-bloques y alertas pensado para una situaciÃ³n concreta: bebÃ© en casa, home office o varios hijos. ElegÃ­ la que se parece a tu dÃ­a y se carga sola. Conviene usarla cuando no sabÃ©s por dÃ³nde empezar. DespuÃ©s, solo completÃ¡s los micro-bloques que aparecen.</p>`)}

      <section class="section">
        <div class="section__head"><div><h2>ElegÃ­ tu plantilla</h2><p>Se importa en 1 toque. PodÃ©s cambiarla cuando quieras.</p></div></div>
        <div class="grid grid--3">
          ${Object.entries(TEMPLATES).map(([id, t]) => `
            <div class="card card--hover tpl-card ${state.template === id ? "is-selected" : ""}" data-tpl="${id}" role="button" tabindex="0">
              ${state.template === id ? `<span class="tpl-card__badge">${icon("check", 22)}</span>` : ""}
              <div class="tpl-card__emoji">${t.emoji}</div>
              <div class="card__title mt-8">${t.name}</div>
              <p class="card__lead">${t.desc}</p>
              <div class="mt-16 faint" style="font-size:.82rem">${t.blocks.length} micro-bloques Â· ${Object.keys(t.alerts).length} alertas sugeridas</div>
            </div>`).join("")}
        </div>
      </section>

      ${state.template ? `
      <section class="section">
        <div class="section__head"><div><h2>Incluye estos micro-bloques</h2><p>Plantilla activa: ${TEMPLATES[state.template].name}</p></div></div>
        <div class="card">
          <div class="vstack">
            ${TEMPLATES[state.template].blocks.map((b) => `<div class="hstack">${icon("target", 16)}<span>${esc(b)}</span></div>`).join("")}
          </div>
          <div class="hstack wrap mt-16">
            <button class="btn btn--cta" data-go="alertas">Siguiente: activar alertas</button>
            <button class="btn btn--ghost" data-go="microbloques">Ver mis micro-bloques</button>
          </div>
        </div>
      </section>` : ""}`;
  }

  function viewAlertas(s) {
    const ns = notifState();
    const sysCard =
      ns === "granted" ? `
        <div class="card">
          <div class="spread wrap">
            <div>
              <div class="card__title">Notificaciones del sistema: activadas</div>
              <p class="muted">Vas a recibir un aviso de tu telÃ©fono cuando toque una tarea invisible, aunque tengas la app en segundo plano.</p>
            </div>
            <span class="chip chip--cta">${icon("check", 15)} Activadas</span>
          </div>
        </div>`
      : ns === "default" ? `
        <div class="card card--brand">
          <div class="spread wrap">
            <div>
              <div class="card__title" style="color:#fff">ActivÃ¡ las notificaciones del sistema</div>
              <p class="muted">Con el permiso del navegador recibÃ­s un aviso de tu telÃ©fono en el momento de cada tarea invisible. PodÃ©s desactivarlas cuando quieras.</p>
            </div>
            <button class="btn" id="permBtn">Permitir</button>
          </div>
        </div>`
      : ns === "denied" ? `
        <div class="card">
          <div class="card__title">Notificaciones del sistema: bloqueadas</div>
          <p class="muted">Las bloqueaste antes. Para activarlas, entrÃ¡ a los ajustes de este sitio en tu navegador y permitÃ­ las notificaciones. Las alertas dentro de la app siguen funcionando igual.</p>
        </div>`
      : `
        <div class="card">
          <div class="card__title">Notificaciones del sistema: no disponibles</div>
          <p class="muted">Este navegador o dispositivo no admite notificaciones del sistema (es habitual en iPhone y en navegadores que se abren dentro de otras apps). No pasa nada: las alertas dentro de Cerebro Externo funcionan igual mientras la tengas abierta.</p>
        </div>`;

    return `
      <section class="section">
        ${sysCard}
        <div class="card card--pad-sm intro-card mt-16">
          <p><strong>Alerta en la app:</strong> aviso visual mientras estÃ¡s usando Cerebro Externo. Siempre funciona.</p>
          <p><strong>NotificaciÃ³n del sistema:</strong> aviso de tu telÃ©fono aunque la app estÃ© en segundo plano. Solo si tu dispositivo lo permite.</p>
        </div>
      </section>

      <section class="section">
        <div class="section__head"><div><h2>Tus tareas invisibles</h2><p>Cosas que no â€œse venâ€ pero pesan. EncendÃ© las que quieras que la app te recuerde y ajustÃ¡ cada cuÃ¡nto.</p></div></div>
        <div class="vstack">
          ${state.alerts.map((a) => `
            <div class="alert-row" data-id="${a.id}">
              <span class="alert-row__icon">${icon(a.icon, 20)}</span>
              <div class="alert-row__main">
                <strong>${esc(a.label)}</strong>
                <div class="alert-row__meta">
                  <span class="stepper" role="group" aria-label="Frecuencia de ${esc(a.label)}">
                    <button data-act="dec" aria-label="Menos frecuencia">âˆ’</button>
                    <span>${fmtEvery(a.every)}</span>
                    <button data-act="inc" aria-label="MÃ¡s frecuencia">+</button>
                  </span>
                  <button class="linkbtn" data-act="test">Probar ahora</button>
                </div>
              </div>
              <label class="switch">
                <input type="checkbox" data-act="toggle" ${a.on ? "checked" : ""} aria-label="Activar ${esc(a.label)}" />
                <span class="switch__track"></span>
              </label>
            </div>`).join("")}
        </div>
        <div class="hstack wrap mt-16">
          <span class="chip chip--brand">${s.activeAlerts} activas</span>
          <button class="btn btn--ghost btn--sm" id="addAlert">${icon("plus", 16)} AÃ±adir alerta</button>
        </div>
      </section>`;
  }

  function viewMicrobloques(s) {
    const t = state.timer;
    const active = t ? state.blocks.find((b) => b.id === t.blockId) : null;
    const C = 2 * Math.PI * 90;
    const timerPanel = active ? `
      <section class="section">
        <div class="card">
          <div class="timer">
            <div class="chip chip--brand">${icon("target", 14)} ${esc(active.title)}</div>
            <div class="ring">
              <svg viewBox="0 0 200 200">
                <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#6C5CE7"/><stop offset="1" stop-color="#55EFC4"/>
                </linearGradient></defs>
                <circle class="ring__bg" cx="100" cy="100" r="90"/>
                <circle class="ring__fg" id="timerRing" cx="100" cy="100" r="90"
                  style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - t.remaining / t.total)}"/>
              </svg>
              <div class="ring__label">
                <div class="ring__time" id="timerTime">${fmtClock(t.remaining)}</div>
                <div class="ring__sub">${t.running ? "en marcha" : "en pausa"}</div>
              </div>
            </div>
            <div class="hstack wrap" style="justify-content:center">
              <button class="btn btn--cta" id="timerToggle">${icon(t.running ? "pause" : "play", 18)} ${t.running ? "Pausar" : "Reanudar"}</button>
              <button class="btn btn--ghost" id="timerDone">${icon("check", 18)} Completar ahora</button>
              <button class="btn btn--ghost" id="timerReset">${icon("refresh", 18)} Cancelar</button>
            </div>
          </div>
        </div>
      </section>` : "";

    const list = state.blocks.length ? `
      <div class="list" id="blockList">
        ${state.blocks.map((b) => `
          <div class="item ${b.done ? "is-done" : ""}" data-id="${b.id}">
            <button class="item__check" data-act="toggle" aria-label="Marcar como hecho">${icon("check", 16)}</button>
            <span class="item__text">${esc(b.title)}</span>
            ${b.done ? `<span class="chip chip--cta">${icon("check", 14)} Hecho</span>` :
              `<button class="btn btn--cta btn--sm" data-act="start">${icon("play", 15)} 5 min</button>`}
            <button class="iconbtn item__del" data-act="del" title="Eliminar">${icon("trash", 18)}</button>
          </div>`).join("")}
      </div>` : `
      <div class="empty">${icon("timer", 34)}<p>No tienes micro-bloques.<br>Importa una plantilla o aÃ±ade uno abajo.</p>
        <button class="btn btn--ghost btn--sm mt-16" data-go="plantillas">Ir a plantillas</button></div>`;

    return `
      ${timerPanel}
      ${intro(`<p>Un <strong>micro-bloque</strong> es una acciÃ³n chica de 5 minutos: el primer paso de algo, no la tarea entera. <strong>â€œDe hoyâ€</strong> es tu lista para el dÃ­a. TocÃ¡ <strong>â€œ5 minâ€</strong> para arrancar el reloj; al terminar se marca como hecho y suma a tu progreso. PodÃ©s aÃ±adir los tuyos, traerlos del Volcado mental o de una Plantilla.</p>`)}
      <section class="section">
        <div class="section__head"><div><h2>Tus micro-bloques de hoy</h2><p>${s.doneToday}/${s.totalToday} completados</p></div></div>
        <form id="blockForm" class="dumpbar">
          <input class="input" id="blockInput" placeholder="AÃ±adir micro-bloque (5 min)â€¦" maxlength="120" autocomplete="off" />
          <button class="btn btn--cta" type="submit">${icon("plus", 18)} AÃ±adir</button>
        </form>
        ${list}
        ${state.blocks.length ? `<div class="hstack wrap mt-16">
          <button class="btn btn--ghost btn--sm" id="resetBlocks">${icon("refresh", 16)} Reiniciar el dÃ­a</button>
        </div>` : ""}
      </section>`;
  }

  function viewProgreso(s) {
    const max = Math.max(1, ...s.week.map((d) => d.val));
    const bars = s.week.map((d) => {
      const h = Math.round((d.val / max) * 100);
      const today = d.key === todayKey();
      return `<div class="bars__col ${today ? "is-today" : ""}">
        <span class="bars__val">${d.val || ""}</span>
        <div class="bars__bar" style="height:${d.val ? h + "%" : "4px"}"></div>
        <span class="bars__label">${d.day}</span>
      </div>`;
    }).join("");

    const totalAll = Object.values(state.history).reduce((a, b) => a + b, 0);
    const activeDays = Object.values(state.history).filter((v) => v > 0).length;

    return `
      ${intro(`<p>AcÃ¡ ves tu constancia real: micro-bloques completados hoy, tu <strong>racha</strong> de dÃ­as seguidos y cuÃ¡ntos hiciste en la semana. Sirve para ver el avance, sin exigencias ni comparaciones.</p>`)}
      <section class="section">
        <div class="grid grid--3">
          ${statTile("zap", s.streak, s.streak === 1 ? "dÃ­a seguido" : "dÃ­as seguidos")}
          ${statTile("check", totalAll, "micro-bloques totales")}
          ${statTile("clock", activeDays, activeDays === 1 ? "dÃ­a activo" : "dÃ­as activos")}
        </div>
      </section>

      <section class="section">
        <div class="section__head"><div><h2>Ãšltimos 7 dÃ­as</h2><p>${s.weekTotal} micro-bloques esta semana</p></div></div>
        <div class="card">
          <div class="bars">${bars}</div>
        </div>
      </section>

      <section class="section">
        <div class="section__head"><div><h2>Hoy</h2><p>Constancia del dÃ­a</p></div></div>
        <div class="card">
          <div class="donut">
            ${donutSVG(s.pct)}
            <div class="donut__legend">
              <span><span class="legend-dot" style="background:var(--cta)"></span>${s.doneToday} completados</span>
              <span><span class="legend-dot" style="background:var(--surface-2)"></span>${Math.max(0, s.totalToday - s.doneToday)} pendientes</span>
            </div>
          </div>
          <div class="hstack wrap mt-16">
            <button class="btn btn--ghost" id="copyBtn">${icon("copy", 18)} Copiar</button>
            <button class="btn btn--ghost" id="shareBtn">${icon("share", 18)} Compartir</button>
          </div>
        </div>
      </section>`;
  }

  const EBOOK = [
    {
      h: "1 Â· El problema no es tu memoria",
      html: `<p>La carga mental no es falta de disciplina. Es tener demasiadas tareas abiertas al mismo tiempo dentro de la cabeza: medicinas, ropa, comida, trabajo, colegio, tu propio proyecto. Cada una consume atenciÃ³n aunque no la estÃ©s haciendo.</p>
      <p>La soluciÃ³n no es recordar mejor. Es <strong>dejar de recordar</strong> y delegar ese trabajo a un sistema externo de confianza.</p>
      <blockquote>No necesitas mÃ¡s fuerza de voluntad. Necesitas un lugar fuera de tu mente donde vivan tus pendientes.</blockquote>`,
    },
    {
      h: "2 Â· Volcado mental primero",
      html: `<p>Antes de organizar nada, vacÃ­a la cabeza. Abre el <strong>Volcado mental</strong> y escribe todo lo que tienes pendiente, sin orden ni categorÃ­as. El objetivo no es una lista bonita: es el alivio de verlo fuera.</p>
      <ul><li>Escribe rÃ¡pido, una idea por lÃ­nea.</li><li>No filtres â€œlo importanteâ€. Todo entra.</li><li>Hazlo otra vez cada noche: 2 minutos bastan.</li></ul>`,
    },
    {
      h: "3 Â· Micro-bloques de 5 minutos",
      html: `<p>Las agendas por horas se rompen con una sola interrupciÃ³n. Los micro-bloques no: son unidades de <strong>5 minutos</strong> que puedes hacer entre una toma y otra, mientras hierve el agua o antes de una reuniÃ³n.</p>
      <ul><li>Divide cualquier tarea grande en su primer paso de 5 minutos.</li><li>â€œAvanzarâ€ cuenta. No necesitas terminar.</li><li>Usa el temporizador: al empezar, tu mente deja de negociar.</li></ul>`,
    },
    {
      h: "4 Â· Tareas invisibles en piloto automÃ¡tico",
      html: `<p>Beber agua, tomar la medicina, ordenar 5 minutos, dedicarte tiempo: son tareas que no â€œse venâ€ pero pesan. En vez de recordarlas, ponlas en <strong>Alertas</strong> y deja que la app te avise.</p>
      <p>Empieza con 2 o 3 alertas. Si son demasiadas, se vuelven ruido y las ignoras.</p>`,
    },
    {
      h: "5 Â· Reinicio sin culpa",
      html: `<p>Tu bebÃ© se despierta, entra una llamada, cambia el plan. No pasa nada. El sistema estÃ¡ hecho para eso.</p>
      <ul><li>Respira 3 veces.</li><li>Abre Micro-bloques y elige <strong>uno solo</strong>.</li><li>Pon 5 minutos y empieza. El resto del dÃ­a se reacomoda solo.</li></ul>
      <blockquote>La meta no es un dÃ­a perfecto. Es acostarte con la mente en calma.</blockquote>`,
    },
  ];
  let ebookIdx = 0;
  function viewFundamento() {
    return `
      ${intro(`<p>El <strong>mÃ©todo completo</strong> detrÃ¡s de la app, en 5 capÃ­tulos cortos (15 min de lectura). Leelo cuando quieras entender el porquÃ© de cada herramienta. No hace falta para empezar a usar Cerebro Externo.</p>`)}
      <section class="section">
        <div class="ebook-grid" id="ebookGrid">
          <div class="card card--pad-sm">
            <div class="toc">
              ${EBOOK.map((c, i) => `<button data-ch="${i}" class="${i === ebookIdx ? "is-active" : ""}">${esc(c.h)}</button>`).join("")}
            </div>
          </div>
          <div class="card reader" id="ebookBody">
            <h3>${esc(EBOOK[ebookIdx].h)}</h3>
            ${EBOOK[ebookIdx].html}
            <div class="hstack wrap mt-24">
              <button class="btn btn--ghost btn--sm" id="ebPrev" ${ebookIdx === 0 ? "disabled" : ""}>Anterior</button>
              <button class="btn btn--cta btn--sm" id="ebNext" ${ebookIdx === EBOOK.length - 1 ? "disabled" : ""}>Siguiente</button>
              <span class="faint" style="font-size:.82rem">${ebookIdx + 1} / ${EBOOK.length}</span>
            </div>
          </div>
        </div>
      </section>`;
  }

  function viewAjustes() {
    const themeVal = state.theme || "system";
    return `
      <section class="section">
        <div class="section__head"><div><h2>Apariencia</h2><p>Elige cÃ³mo se ve la app</p></div></div>
        <div class="card">
          <div class="spread wrap">
            <div><strong>Tema</strong><p class="muted" style="font-size:.88rem">El modo oscuro cuida tu vista de noche.</p></div>
            <div class="hstack">
              ${["system", "light", "dark"].map((v) => `<button class="btn btn--sm ${themeVal === v ? "btn--brand" : "btn--ghost"}" data-theme-set="${v}">${{ system: "AutomÃ¡tico", light: "Claro", dark: "Oscuro" }[v]}</button>`).join("")}
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__head"><div><h2>Datos</h2><p>Todo se guarda solo en este dispositivo</p></div></div>
        <div class="card vstack">
          <div class="spread wrap">
            <div><strong>Copiar mi resumen de hoy</strong><p class="muted" style="font-size:.88rem">Para pegarlo donde quieras.</p></div>
            <button class="btn btn--ghost btn--sm" id="copyBtn">${icon("copy", 16)} Copiar</button>
          </div>
          <div class="spread wrap">
            <div><strong>Compartir</strong><p class="muted" style="font-size:.88rem">Comparte tu avance.</p></div>
            <button class="btn btn--ghost btn--sm" id="shareBtn">${icon("share", 16)} Compartir</button>
          </div>
          <div class="spread wrap">
            <div><strong>Exportar copia de seguridad</strong><p class="muted" style="font-size:.88rem">Descarga un archivo .json con todo.</p></div>
            <button class="btn btn--ghost btn--sm" id="exportBtn">${icon("copy", 16)} Exportar</button>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__head"><div><h2>Zona de reinicio</h2><p>Con cuidado</p></div></div>
        <div class="card vstack">
          <div class="spread wrap">
            <div><strong>Reiniciar el dÃ­a</strong><p class="muted" style="font-size:.88rem">Marca todos los micro-bloques como no hechos (conserva tu historial).</p></div>
            <button class="btn btn--ghost btn--sm" id="resetDayBtn">${icon("refresh", 16)} Reiniciar dÃ­a</button>
          </div>
          <div class="spread wrap">
            <div><strong>Borrar todos mis datos</strong><p class="muted" style="font-size:.88rem">Elimina nombre, plantillas, historial y ajustes de este dispositivo.</p></div>
            <button class="btn btn--danger btn--sm" id="wipeBtn">${icon("trash", 16)} Borrar todo</button>
          </div>
        </div>
      </section>

      <p class="faint" style="text-align:center;font-size:.8rem">Cerebro Externo Â· MicroApp 100% local Â· v1</p>`;
  }

  /* ---------- Perfil ---------- */
  function viewPerfil() {
    const p = state.profile;
    const kids = Array.from({ length: p.hasKids === true ? Math.max(1, p.kidsCount) : 0 }, (_, i) => p.kids[i] || "");

    return `
      <section class="section">
        <div class="card">
          <div class="pf-head">
            <div class="pf-photo">
              ${p.photo
                ? `<img src="${p.photo}" alt="Foto de perfil de ${esc(state.user.name)}" />`
                : `<span class="pf-photo__ph">${icon("user", 46, 1.6)}</span>`}
            </div>
            <div class="pf-photo__actions">
              <label class="btn btn--cta btn--sm pf-upload">
                ${icon("camera", 16)} <span>${p.photo ? "Cambiar foto" : "Subir foto"}</span>
                <input type="file" id="pfPhoto" class="pf-file" accept="image/*" aria-label="${p.photo ? "Cambiar foto de perfil" : "Subir foto de perfil"}" />
              </label>
              ${p.photo ? `<button class="btn btn--ghost btn--sm" id="pfPhotoDel">${icon("trash", 16)} Eliminar</button>` : ""}
              <p class="faint" style="font-size:.8rem">Se guarda solo en este dispositivo.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__head"><div><h2>Tus datos</h2><p>Se guardan automÃ¡ticamente al escribir</p></div></div>
        <div class="card">
          <div class="pf-fields">
            <div class="field pf-field">
              <label class="field__label" for="pfName">Nombre</label>
              <input class="input" id="pfName" value="${esc(state.user.name)}" maxlength="30" autocomplete="name" placeholder="Tu nombre" />
              <p class="field__error" id="pfNameError" role="alert" hidden></p>
            </div>

            <div class="field pf-field">
              <label class="field__label">Â¿De dÃ³nde sos?</label>
              <div class="pf-grid">
                <input class="input" id="pfCountry" value="${esc(p.location.country)}" maxlength="56" autocomplete="country-name" placeholder="PaÃ­s" />
                <input class="input" id="pfCity" value="${esc(p.location.city)}" maxlength="80" autocomplete="address-level2" placeholder="Ciudad / localidad" />
              </div>
            </div>

            <div class="field pf-field">
              <label class="field__label" for="pfJob">Â¿A quÃ© te dedicÃ¡s?</label>
              <input class="input" id="pfJob" list="pfJobList" value="${esc(p.occupation)}" maxlength="60" placeholder="ProfesiÃ³n, trabajo, actividad o negocio" />
              <datalist id="pfJobList">
                <option value="Emprendedora"></option>
                <option value="Docente"></option>
                <option value="Abogada"></option>
                <option value="Comerciante"></option>
                <option value="DiseÃ±adora"></option>
                <option value="Profesional independiente"></option>
              </datalist>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__head"><div><h2>Â¿TenÃ©s hijos?</h2></div></div>
        <div class="card">
          <div class="pf-fields">
            <div class="hstack">
              <button class="btn btn--sm ${p.hasKids === true ? "btn--brand" : "btn--ghost"}" data-kids="yes">SÃ­</button>
              <button class="btn btn--sm ${p.hasKids === false ? "btn--brand" : "btn--ghost"}" data-kids="no">No</button>
            </div>

            ${p.hasKids === true ? `
              <div class="field pf-field">
                <label class="field__label" for="pfKidsCount">Â¿CuÃ¡ntos hijos tenÃ©s?</label>
                <select class="select" id="pfKidsCount">
                  ${Array.from({ length: 12 }, (_, i) => i + 1).map((n) => `<option value="${n}" ${Math.max(1, p.kidsCount) === n ? "selected" : ""}>${n}</option>`).join("")}
                </select>
              </div>
              <div class="pf-fields" id="pfKids">
                ${kids.map((name, i) => `
                  <div class="field pf-field">
                    <label class="field__label" for="pfKid${i}">Hijo/a ${i + 1}</label>
                    <input class="input" id="pfKid${i}" data-kid="${i}" value="${esc(name)}" maxlength="30" placeholder="Nombre" autocomplete="off" />
                  </div>`).join("")}
              </div>
            ` : ""}
          </div>
        </div>
      </section>`;
  }

  // Redimensiona una imagen a un cuadrado mÃ¡ximo y devuelve un dataURL JPEG liviano
  function resizeImage(file, max, ok, fail) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const scale = Math.min(1, max / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try { ok(cv.toDataURL("image/jpeg", 0.85)); } catch (e) { fail(); }
      };
      img.onerror = fail;
      img.src = reader.result;
    };
    reader.onerror = fail;
    reader.readAsDataURL(file);
  }

  function wirePerfil() {
    // Nombre (mismo dato que usa toda la app)
    const nm = $("#pfName");
    if (nm) {
      const err = $("#pfNameError");
      nm.oninput = () => {
        const v = nm.value.trim().replace(/\s+/g, " ");
        if (v.length < 2) { err.textContent = "Escribe al menos 2 letras."; err.hidden = false; nm.classList.add("is-invalid"); return; }
        err.hidden = true; nm.classList.remove("is-invalid");
        state.user.name = v;
        save();
        $("#userChipName").textContent = v;
        $("#avatar").textContent = v[0] || "?";
      };
      nm.onblur = () => { if (nm.value.trim().length < 2) { nm.value = state.user.name; $("#pfNameError").hidden = true; nm.classList.remove("is-invalid"); } };
    }

    const bindText = (sel, apply) => {
      const el = $(sel);
      if (!el) return;
      el.oninput = () => { apply(el.value); save(); };
    };
    bindText("#pfCountry", (v) => (state.profile.location.country = v));
    bindText("#pfCity", (v) => (state.profile.location.city = v));
    bindText("#pfJob", (v) => (state.profile.occupation = v));

    // Â¿TenÃ©s hijos?
    $$('[data-kids]').forEach((b) => b.onclick = () => {
      const yes = b.dataset.kids === "yes";
      set((s) => {
        s.profile.hasKids = yes;
        if (yes) {
          if (s.profile.kidsCount < 1) s.profile.kidsCount = 1;
          while (s.profile.kids.length < s.profile.kidsCount) s.profile.kids.push("");
        }
      });
    });

    // Cantidad de hijos
    const kc = $("#pfKidsCount");
    if (kc) kc.onchange = () => {
      const n = clamp(parseInt(kc.value, 10) || 1, 1, 12);
      set((s) => {
        s.profile.kidsCount = n;
        while (s.profile.kids.length < n) s.profile.kids.push("");
      });
    };

    // Nombre de cada hijo/a (sin re-render para no perder el foco)
    $$('[data-kid]').forEach((el) => el.oninput = () => {
      const i = +el.dataset.kid;
      state.profile.kids[i] = el.value;
      save();
    });

    // Foto
    const pf = $("#pfPhoto");
    if (pf) pf.onchange = () => {
      const file = pf.files && pf.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) { toast("ElegÃ­ un archivo de imagen.", "warn"); pf.value = ""; return; }
      resizeImage(file, 480,
        (dataUrl) => { set((s) => { s.profile.photo = dataUrl; }); toast("Foto de perfil actualizada âœ“", "ok"); },
        () => toast("No se pudo procesar la imagen.", "warn"));
    };
    const pd = $("#pfPhotoDel");
    if (pd) pd.onclick = () => modal({
      title: "Eliminar foto de perfil",
      body: "VolverÃ¡s a ver el avatar neutro. Puedes subir otra cuando quieras.",
      confirmText: "Eliminar", danger: true,
      onConfirm: () => { set((s) => { s.profile.photo = null; }); toast("Foto eliminada.", "info"); },
    });
  }

  /* ---------- GrÃ¡fico donut (SVG) ---------- */
  function donutSVG(pct) {
    const r = 52, C = 2 * Math.PI * r;
    const off = C * (1 - clamp(pct, 0, 100) / 100);
    return `<div class="donut__chart">
      <svg viewBox="0 0 128 128">
        <circle cx="64" cy="64" r="${r}" fill="none" style="stroke:var(--surface-2)" stroke-width="14"/>
        <circle cx="64" cy="64" r="${r}" fill="none" stroke-width="14" stroke-linecap="round"
          style="stroke:var(--cta);stroke-dasharray:${C};stroke-dashoffset:${off};transition:stroke-dashoffset .8s var(--ease)"/>
      </svg>
      <div class="donut__center"><b>${pct}%</b><span class="faint" style="font-size:.72rem">hoy</span></div>
    </div>`;
  }

  /* ============================================================
     15. WIRING de cada vista (eventos)
     ============================================================ */
  function wireView(route) {
    // NavegaciÃ³n por data-go (global dentro de la vista)
    $$("[data-go]", $("#view")).forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));
    const copyBtn = $("#copyBtn"); if (copyBtn) copyBtn.onclick = copySummary;
    const shareBtn = $("#shareBtn"); if (shareBtn) shareBtn.onclick = shareSummary;

    if (route === "volcado") wireVolcado();
    if (route === "plantillas") wirePlantillas();
    if (route === "alertas") wireAlertas();
    if (route === "microbloques") wireMicrobloques();
    if (route === "fundamento") wireFundamento();
    if (route === "ajustes") wireAjustes();
    if (route === "perfil") wirePerfil();
  }

  function wireVolcado() {
    const form = $("#dumpForm");
    form.onsubmit = (e) => {
      e.preventDefault();
      const inp = $("#dumpInput");
      const v = inp.value.trim();
      if (!v) { inp.classList.add("is-invalid"); inp.focus(); return; }
      set((s) => s.brainDump.unshift({ id: uid(), text: v, done: false, ts: Date.now() }));
      toast("Pendiente fuera de tu cabeza âœ“", "ok");
    };
    $("#dumpInput") && $("#dumpInput").addEventListener("input", (e) => e.target.classList.remove("is-invalid"));

    $$("#dumpList .item").forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('[data-act="toggle"]').onclick = () => set((s) => {
        const it = s.brainDump.find((x) => x.id === id); if (it) it.done = !it.done;
      });
      row.querySelector('[data-act="del"]').onclick = () => {
        row.classList.add("removing");
        setTimeout(() => set((s) => { s.brainDump = s.brainDump.filter((x) => x.id !== id); }), 260);
      };
      row.querySelector('[data-act="promote"]').onclick = () => {
        const it = state.brainDump.find((x) => x.id === id);
        if (!it) return;
        addBlock(it.text);
        set((s) => { const t = s.brainDump.find((x) => x.id === id); if (t) t.done = true; });
        toast("Convertido en micro-bloque de 5 min", "ok");
      };
    });
    const cd = $("#clearDoneDump");
    if (cd) cd.onclick = () => set((s) => { s.brainDump = s.brainDump.filter((x) => !x.done); });
  }

  function wirePlantillas() {
    $$(".tpl-card").forEach((card) => {
      const pick = () => {
        const id = card.dataset.tpl;
        if (state.template === id) return;
        modal({
          title: `Importar â€œ${TEMPLATES[id].name}â€`,
          body: `Se cargarÃ¡n <strong>${TEMPLATES[id].blocks.length} micro-bloques</strong> y se ajustarÃ¡n tus alertas. Reemplaza los micro-bloques actuales.`,
          confirmText: "Importar",
          onConfirm: () => applyTemplate(id),
        });
      };
      card.addEventListener("click", pick);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
  }

  function wireAlertas() {
    const perm = $("#permBtn"); if (perm) perm.onclick = requestBrowserNotify;
    $$(".alert-row").forEach((row) => {
      const id = row.dataset.id;
      const a = state.alerts.find((x) => x.id === id);
      row.querySelector('[data-act="toggle"]').onchange = (e) => {
        set((s) => {
          const al = s.alerts.find((x) => x.id === id);
          al.on = e.target.checked;
          al.last = Date.now();
          s.activation.alerts = s.alerts.some((x) => x.on);
        });
        toast(e.target.checked ? `â€œ${a.label}â€ activada` : `â€œ${a.label}â€ en pausa`, "info");
      };
      row.querySelector('[data-act="inc"]').onclick = () => set((s) => {
        const al = s.alerts.find((x) => x.id === id); al.every = clamp(al.every + 30, 15, 720);
      });
      row.querySelector('[data-act="dec"]').onclick = () => set((s) => {
        const al = s.alerts.find((x) => x.id === id); al.every = clamp(al.every - 30, 15, 720);
      });
      row.querySelector('[data-act="test"]').onclick = () => fireAlertNow(id);
    });
    const add = $("#addAlert");
    if (add) add.onclick = () => {
      modal({
        title: "Nueva alerta",
        body: `<input class="input" id="newAlertName" placeholder="Nombre de la alerta" maxlength="40" style="margin-top:10px" />`,
        confirmText: "Crear",
        onConfirm: () => {
          const name = ($("#newAlertName") && $("#newAlertName").value || "").trim();
          if (!name) return;
          set((s) => s.alerts.push({ id: uid(), label: name, icon: "clock", every: 120, on: true, last: Date.now() }));
          toast("Alerta creada", "ok");
        },
      });
      setTimeout(() => $("#newAlertName") && $("#newAlertName").focus(), 50);
    };
  }

  function wireMicrobloques() {
    const form = $("#blockForm");
    if (form) form.onsubmit = (e) => {
      e.preventDefault();
      const inp = $("#blockInput");
      if (!addBlock(inp.value)) { inp.classList.add("is-invalid"); inp.focus(); return; }
      inp.value = "";
      toast("Micro-bloque aÃ±adido", "ok");
    };
    $$("#blockList .item").forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('[data-act="toggle"]').onclick = () => toggleBlock(id);
      const start = row.querySelector('[data-act="start"]');
      if (start) start.onclick = () => startTimer(id);
      row.querySelector('[data-act="del"]').onclick = () => {
        row.classList.add("removing");
        setTimeout(() => removeBlock(id), 260);
      };
    });
    const tt = $("#timerToggle"); if (tt) tt.onclick = toggleTimer;
    const tr = $("#timerReset"); if (tr) tr.onclick = () => {
      modal({ title: "Cancelar micro-bloque", body: "El tiempo de este bloque no se guardarÃ¡.", confirmText: "Cancelar bloque", danger: true, onConfirm: resetTimer });
    };
    const td = $("#timerDone"); if (td) td.onclick = () => {
      const id = state.timer && state.timer.blockId;
      resetTimer();
      if (id) { completeBlock(id, true); render(); toast("Â¡Completado! ðŸŽ‰", "ok"); confetti(); }
    };
    const rb = $("#resetBlocks");
    if (rb) rb.onclick = () => modal({
      title: "Reiniciar el dÃ­a",
      body: "Todos los micro-bloques volverÃ¡n a estado â€œpor hacerâ€. Tu historial y tu racha se conservan.",
      confirmText: "Reiniciar",
      onConfirm: () => { set((s) => s.blocks.forEach((b) => (b.done = false))); toast("DÃ­a reiniciado", "ok"); },
    });
  }

  function wireFundamento() {
    $$("[data-ch]").forEach((b) => b.onclick = () => { ebookIdx = +b.dataset.ch; render(); });
    const prev = $("#ebPrev"); if (prev) prev.onclick = () => { ebookIdx = clamp(ebookIdx - 1, 0, EBOOK.length - 1); render(); };
    const next = $("#ebNext"); if (next) next.onclick = () => { ebookIdx = clamp(ebookIdx + 1, 0, EBOOK.length - 1); render(); };
  }

  function wireAjustes() {
    $$("[data-theme-set]").forEach((b) => b.onclick = () => {
      const v = b.dataset.themeSet;
      set((s) => { s.theme = v === "system" ? null : v; });
      applyTheme();
    });
    const exp = $("#exportBtn");
    if (exp) exp.onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `cerebro-externo-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Copia de seguridad descargada", "ok");
    };
    const rd = $("#resetDayBtn");
    if (rd) rd.onclick = () => modal({
      title: "Reiniciar el dÃ­a",
      body: "Los micro-bloques volverÃ¡n a â€œpor hacerâ€. El historial se conserva.",
      confirmText: "Reiniciar", onConfirm: () => { set((s) => s.blocks.forEach((b) => (b.done = false))); toast("DÃ­a reiniciado", "ok"); },
    });
    const wipe = $("#wipeBtn");
    if (wipe) wipe.onclick = () => modal({
      title: "Borrar todos mis datos",
      body: "Esta acciÃ³n no se puede deshacer. Se eliminarÃ¡ tu nombre, plantillas, alertas, micro-bloques, historial y ajustes.",
      confirmText: "SÃ­, borrar todo", danger: true,
      onConfirm: () => {
        localStorage.removeItem(KEY);
        state = clone(DEFAULT_STATE);
        stopTimerLoop();
        location.hash = "#/inicio";
        boot();
        toast("Todo borrado. Empezamos de cero.", "info");
      },
    });
  }

  /* ============================================================
     16. TEMA
     ============================================================ */
  const mqDark = window.matchMedia("(prefers-color-scheme: dark)");
  function resolvedTheme() {
    if (state.theme === "light" || state.theme === "dark") return state.theme;
    return mqDark.matches ? "dark" : "light";
  }
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", resolvedTheme());
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolvedTheme() === "dark" ? "#101019" : "#6C5CE7");
  }
  mqDark.addEventListener("change", () => { if (!state.theme) applyTheme(); });

  function quickThemeToggle() {
    // Ciclo: system -> light -> dark -> system (pero si estÃ¡ en system, alterna al opuesto del actual)
    const cur = resolvedTheme();
    set((s) => { s.theme = cur === "dark" ? "light" : "dark"; });
    applyTheme();
  }

  /* ============================================================
     17. SIDEBAR (mÃ³vil)
     ============================================================ */
  function openSidebar() {
    $("#sidebar").classList.add("is-open");
    $("#sidebarOverlay").hidden = false;
    $("#menuToggle").setAttribute("aria-expanded", "true");
  }
  function closeSidebar() {
    $("#sidebar").classList.remove("is-open");
    $("#sidebarOverlay").hidden = true;
    $("#menuToggle").setAttribute("aria-expanded", "false");
  }

  /* ============================================================
     18. CAMPANA (popover)
     ============================================================ */
  function toggleBell(force) {
    const pop = $("#bellPopover");
    const open = force != null ? force : pop.hidden;
    pop.hidden = !open;
    $("#bellToggle").setAttribute("aria-expanded", String(open));
    if (open && state.notifications.some((n) => !n.read)) {
      // marcar como leÃ­das al abrir (sin re-render completo)
      state.notifications.forEach((n) => (n.read = true));
      save();
      renderNotifList();
      const badge = $("#bellBadge");
      badge.hidden = true;
      badge.textContent = "0";
    }
  }

  /* ============================================================
     19. ONBOARDING
     ============================================================ */
  function initOnboarding() {
    const form = $("#onboardingForm");
    const input = $("#nameInput");
    const err = $("#nameError");

    const showErr = (msg) => { err.textContent = msg; err.hidden = false; input.classList.add("is-invalid"); };
    input.oninput = () => { err.hidden = true; input.classList.remove("is-invalid"); };

    form.onsubmit = (e) => {
      e.preventDefault();
      const raw = input.value.trim().replace(/\s+/g, " ");
      if (raw.length < 2) return showErr("Escribe al menos 2 letras.");
      if (raw.length > 30) return showErr("MÃ¡ximo 30 caracteres.");
      if (!/^[\p{L}][\p{L}\s'â€™.-]*$/u.test(raw)) return showErr("Usa solo letras y espacios.");
      const name = raw.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

      set((s) => { s.user.name = name; s.user.since = Date.now(); });
      pushNotif("Â¡Bienvenida, " + name + "!", "Empieza importando una plantilla en el Paso 1.", "heart");

      const ob = $("#onboarding");
      ob.classList.add("is-leaving");
      setTimeout(() => {
        ob.hidden = true;
        ob.classList.remove("is-leaving");
        ob.setAttribute("aria-hidden", "true");
        $("#app").hidden = false;
        toast(`Bienvenida, ${name} ðŸ’œ`, "ok");
        render();
        $("#view").focus();
      }, 420);
    };

    setTimeout(() => input.focus(), 200);
  }

  /* ============================================================
     20. ARRANQUE
     ============================================================ */
  function boot() {
    applyTheme();
    if (state.user.name) {
      $("#onboarding").hidden = true;
      $("#onboarding").setAttribute("aria-hidden", "true");
      $("#app").hidden = false;
      if (!location.hash) location.hash = "#/inicio";
      render();
      if (state.timer && state.timer.running) runTimerLoop();
    } else {
      const ob = $("#onboarding");
      ob.hidden = false;
      ob.classList.remove("is-leaving");
      ob.setAttribute("aria-hidden", "false");
      $("#nameInput").value = "";
      $("#app").hidden = true;
      initOnboarding();
    }
  }

  // Listeners globales (una sola vez)
  $("#menuToggle").addEventListener("click", openSidebar);
  $("#sidebarClose").addEventListener("click", closeSidebar);
  $("#sidebarOverlay").addEventListener("click", closeSidebar);
  $("#themeToggle").addEventListener("click", quickThemeToggle);
  $("#bellToggle").addEventListener("click", (e) => { e.stopPropagation(); toggleBell(); });
  $("#notifClear").addEventListener("click", () => { set((s) => (s.notifications = [])); toggleBell(true); });
  $("#userChip").addEventListener("click", () => go("perfil"));
  document.addEventListener("click", (e) => {
    const pop = $("#bellPopover");
    if (!pop.hidden && !e.target.closest(".notify")) toggleBell(false);
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 1024) closeSidebar(); });

  // Motor de alertas + refresco de "hace X"
  setInterval(alertsTick, 15000);
  setInterval(() => { if (!$("#bellPopover").hidden) renderNotifList(); }, 30000);

  // Guardar antes de cerrar
  window.addEventListener("beforeunload", save);

  try {
    boot();
  } catch (err) {
    console.error("Cerebro Externo no pudo iniciar:", err);
    if (document.body) {
      document.body.insertAdjacentHTML("beforeend",
        '<div style="position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:#F9FAFB;color:#1C1E2B;font-family:system-ui,-apple-system,sans-serif;text-align:center;z-index:9999">' +
        '<div style="max-width:340px"><p style="font-weight:700;font-size:1.1rem;margin-bottom:8px">No se pudo abrir la app en este navegador</p>' +
        '<p style="color:#6B7280;font-size:.9rem;line-height:1.5">Probá actualizar el navegador, o abrila en una versión reciente de Chrome o Safari.</p></div></div>');
    }
  }
})();
