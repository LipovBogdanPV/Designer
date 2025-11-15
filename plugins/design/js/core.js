// plugins/design/js/core.js
(function () {
  // ===== helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    let c = hex.replace("#", "");
    if (c.length === 3)
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    const v = parseInt(c, 16);
    const r = (v >> 16) & 255,
      g = (v >> 8) & 255,
      b = v & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const STORAGE_KEY = "st:design:blocks:v1";

  // ===== model
  function createBlock(partial = {}) {
    return Object.assign(
      {
        id: uid(),
        display: "flex", // 'flex' | 'grid'
        dir: "column", // flex only
        grid: { cols: 2, gap: 16 }, // grid only
        justify: "flex-start",
        align: "stretch",
        gap: 16,
        padding: { t: 24, r: 24, b: 24, l: 24 },
        maxWidth: "",
        layout: {
          basis: { mode: "auto", value: 0, unit: "px" }, // auto|px|%|fill
          grow: 0,
          shrink: 1,
          alignSelf: "auto",
          widthPx: "",
          minHeightPx: 0,
          fullHeight: false,
          fixedHeight: "",
        },
        style: {
          bg: {
            type: "none",
            color: "#1f2937",
            alpha: 1,
            gA: "#0ea5e9",
            gAalpha: 1,
            gB: "#1d4ed8",
            gBalpha: 1,
            angle: 135,
            url: "",
            size: "cover",
            pos: "center",
            overlayColor: "#0f172a",
            overlayAlpha: 0.35,
            gray: 0,
          },
          radius: {
            mode: "all",
            all: 16,
            tl: 16,
            tr: 16,
            br: 16,
            bl: 16,
            d1a: 24,
            d1b: 8,
            d2a: 24,
            d2b: 8,
          },
          border: {
            width: 1,
            style: "solid",
            color: "#334155",
            alpha: 0.4,
            soft: 6,
          },
          shadow: {
            x: 0,
            y: 8,
            blur: 24,
            spread: 0,
            color: "#000000",
            alpha: 0.25,
            inset: {
              x: 0,
              y: 0,
              blur: 0,
              spread: 0,
              color: "#000000",
              alpha: 0,
            },
          },
          overlay: {
            top: { enable: false, color: "#000000", alpha: 0.4, h: 120 },
            bottom: { enable: false, color: "#000000", alpha: 0.4, h: 120 },
          },
        },
        scroll: {
          x: false,
          y: false,
          panEnable: false,
          panDir: "y",
          bgFixed: false,
        },
        children: [],
      },
      partial
    );
  }

  const cloneBlock = (b) => JSON.parse(JSON.stringify(b));
  const computeRadii = (r) => {
    if (r.mode === "all") return { tl: r.all, tr: r.all, br: r.all, bl: r.all };
    if (r.mode === "per") return { tl: r.tl, tr: r.tr, br: r.br, bl: r.bl };
    if (r.mode === "diag1")
      return { tl: r.d1a, br: r.d1a, tr: r.d1b, bl: r.d1b };
    if (r.mode === "diag2")
      return { tr: r.d2a, bl: r.d2a, tl: r.d2b, br: r.d2b };
    return { tl: 0, tr: 0, br: 0, bl: 0 };
  };
  function buildBackground(bg) {
    if (bg.type === "none") return "transparent";
    if (bg.type === "color") return hexToRgba(bg.color, bg.alpha);
    if (bg.type === "gradient") {
      const ca = hexToRgba(bg.gA, bg.gAalpha),
        cb = hexToRgba(bg.gB, bg.gBalpha);
      return `linear-gradient(${bg.angle}deg, ${ca}, ${cb})`;
    }
    if (bg.type === "image") {
      const ov =
        bg.overlayAlpha > 0
          ? `linear-gradient(${hexToRgba(
              bg.overlayColor,
              bg.overlayAlpha
            )}, ${hexToRgba(bg.overlayColor, bg.overlayAlpha)}), `
          : "";
      return `${ov}url('${bg.url}')`;
    }
    return "transparent";
  }

  // ===== state
  let host,
    canvas,
    rootBlocks = [],
    selectedId = null;

  const listeners = {
    selection: [],
    change: [],
  };
  // ===== drag & drop state
  let dnd = {
    draggingId: null,
    ghost: null,
    targetId: null,
    mode: null, // 'before' | 'after' | 'inside'
  };

  function clearDropHints() {
    document
      .querySelectorAll(
        ".st-block.drop-before, .st-block.drop-after, .st-block.drop-inside"
      )
      .forEach((el) => {
        el.classList.remove("drop-before", "drop-after", "drop-inside");
      });
  }

  const emitSelection = () => {
    const sel = getSelected();
    listeners.selection.forEach((fn) => {
      try {
        fn(sel);
      } catch (e) {
        console.error(e);
      }
    });
  };
  const emitChange = () => {
    saveToStorage();
    const sel = getSelected();
    listeners.change.forEach((fn) => {
      try {
        fn(rootBlocks, sel);
      } catch (e) {
        console.error(e);
      }
    });
  };

  // ===== selection utils
  function findById(list, id) {
    for (const b of list) {
      if (b.id === id) return b;
      const stack = [...b.children];
      while (stack.length) {
        const n = stack.shift();
        if (n.id === id) return n;
        stack.push(...n.children);
      }
    }
    return null;
  }
  function getSelected() {
    return selectedId ? findById(rootBlocks, selectedId) : null;
  }
  function findParentAndIndex(id, list = rootBlocks) {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (b.id === id) return { parent: null, index: i, arr: list };
      const res = deepFindParent(b, id);
      if (res) return res;
    }
    return null;
  }
  function isAncestor(ancestorId, nodeId) {
    const anc = findById(rootBlocks, ancestorId);
    if (!anc) return false;
    const stack = [...anc.children];
    while (stack.length) {
      const n = stack.shift();
      if (n.id === nodeId) return true;
      stack.push(...n.children);
    }
    return false;
  }

  function moveBlock(dragId, targetId, mode) {
    if (!dragId || !targetId || dragId === targetId) return;
    const dragPos = findParentAndIndex(dragId);
    const targetPos = findParentAndIndex(targetId);
    if (!dragPos || !targetPos) return;

    const dragArr = dragPos.arr;
    const targetArr = targetPos.arr;

    const [node] = dragArr.splice(dragPos.index, 1); // вирізаємо

    // не даємо перетягнути в свого ж нащадка
    if (mode === "inside" && isAncestor(dragId, targetId)) {
      // повертаємо назад
      dragArr.splice(dragPos.index, 0, node);
      return;
    }

    if (mode === "inside") {
      targetPos.parent
        ? targetPos.parent.children.push(node)
        : rootBlocks.push(node);
    } else {
      let insertIndex = targetPos.index;
      // якщо рухаємо в межах того самого масиву – зсуваємо індекс
      if (dragArr === targetArr && dragPos.index < targetPos.index) {
        insertIndex -= 1;
      }
      if (mode === "after") insertIndex += 1;
      targetArr.splice(insertIndex, 0, node);
    }
  }
  function attachDragHandle(handleEl, blockId) {
    if (!handleEl) return;

    handleEl.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(blockId, e.clientX, e.clientY);
    });

    // для тачів – pointer події
    handleEl.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return; // мишу вже обробили через mousedown
      e.preventDefault();
      e.stopPropagation();
      startDrag(blockId, e.clientX, e.clientY);
    });
  }

  function startDrag(blockId, clientX, clientY) {
    const blockEl = document.querySelector(`.st-block[data-id="${blockId}"]`);
    if (!blockEl) return;

    dnd.draggingId = blockId;
    dnd.targetId = null;
    dnd.mode = null;
    clearDropHints();

    // простенький "ghost"
    const ghost = blockEl.cloneNode(false);
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "0.6";
    ghost.style.zIndex = "9999";
    ghost.style.width = blockEl.getBoundingClientRect().width + "px";
    ghost.style.height = "32px";
    ghost.style.borderRadius = "999px";
    ghost.style.border = "1px solid rgba(96,165,250,0.8)";
    ghost.style.background = "rgba(15,23,42,0.9)";
    ghost.style.display = "flex";
    ghost.style.alignItems = "center";
    ghost.style.paddingLeft = "12px";
    ghost.textContent = "Перемістити блок";
    document.body.appendChild(ghost);
    dnd.ghost = ghost;

    updateGhost(clientX, clientY);

    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  }

  function updateGhost(x, y) {
    if (!dnd.ghost) return;
    dnd.ghost.style.left = x + 12 + "px";
    dnd.ghost.style.top = y + 12 + "px";
  }

  function onDragMove(e) {
    if (!dnd.draggingId) return;
    const x = e.clientX;
    const y = e.clientY;
    updateGhost(x, y);

    clearDropHints();

    const el = document.elementFromPoint(x, y);
    if (!el) {
      dnd.targetId = null;
      dnd.mode = null;
      return;
    }

    const blockEl = el.closest(".st-block");
    if (!blockEl) {
      dnd.targetId = null;
      dnd.mode = null;
      return;
    }

    const targetId = blockEl.dataset.id;
    if (!targetId || targetId === dnd.draggingId) {
      dnd.targetId = null;
      dnd.mode = null;
      return;
    }

    const rect = blockEl.getBoundingClientRect();
    const relY = (y - rect.top) / rect.height;

    let mode;
    if (relY < 0.25) mode = "before";
    else if (relY > 0.75) mode = "after";
    else mode = "inside";

    dnd.targetId = targetId;
    dnd.mode = mode;

    blockEl.classList.add(
      mode === "before"
        ? "drop-before"
        : mode === "after"
        ? "drop-after"
        : "drop-inside"
    );
  }

  function onDragEnd(e) {
    if (!dnd.draggingId) return;

    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);

    if (dnd.ghost && dnd.ghost.parentNode) {
      dnd.ghost.parentNode.removeChild(dnd.ghost);
    }
    dnd.ghost = null;

    clearDropHints();

    if (dnd.targetId && dnd.mode) {
      moveBlock(dnd.draggingId, dnd.targetId, dnd.mode);
      render();
      emitSelection(); // оновити поточний вибраний блок для інспектора
      emitChange(); // зберегти в localStorage + повідомити слухачів
      //refreshInspector();
    }

    dnd.draggingId = null;
    dnd.targetId = null;
    dnd.mode = null;
  }

  function deepFindParent(node, id) {
    for (let i = 0; i < node.children.length; i++) {
      const c = node.children[i];
      if (c.id === id) return { parent: node, index: i, arr: node.children };
      const r = deepFindParent(c, id);
      if (r) return r;
    }
    return null;
  }

  // ===== render
  function applyBlockStyles(el, b) {
    const s = b.style,
      r = computeRadii(s.radius);

    if (b.display === "grid") {
      el.style.display = "grid";
      el.style.gridTemplateColumns = `repeat(${Math.max(
        1,
        b.grid.cols || 2
      )}, minmax(0,1fr))`;
      el.style.gridGap = (b.grid.gap || 0) + "px";
      el.dataset.dir = "";
    } else {
      el.style.display = "flex";
      el.dataset.dir = b.dir;
      el.style.flexDirection = b.dir;
      el.style.justifyContent = b.justify;
      el.style.alignItems = b.align;
      el.style.gap = (b.gap || 0) + "px";
    }

    el.style.paddingTop = (b.padding.t || 0) + "px";
    el.style.paddingRight = (b.padding.r || 0) + "px";
    el.style.paddingBottom = (b.padding.b || 0) + "px";
    el.style.paddingLeft = (b.padding.l || 0) + "px";
    el.style.maxWidth = b.maxWidth || "";
    el.style.margin = b.maxWidth ? "0 auto" : "";

    const bgLayer = el.querySelector(":scope > .bg-layer");
    if (s.bg.type === "image") {
      el.style.background = "transparent";
      bgLayer.style.display = "block";
      bgLayer.style.background = buildBackground(s.bg);
      bgLayer.style.backgroundSize = s.bg.size;
      bgLayer.style.backgroundPosition = s.bg.pos;
      bgLayer.style.backgroundAttachment = b.scroll.bgFixed
        ? "fixed"
        : "scroll";
      bgLayer.style.filter = `grayscale(${s.bg.gray || 0})`;
    } else {
      bgLayer.style.display = "none";
      el.style.background = buildBackground(s.bg);
      el.style.backgroundSize = "";
      el.style.backgroundPosition = "";
      el.style.backgroundRepeat = "";
    }

    el.style.borderTopLeftRadius = r.tl + "px";
    el.style.borderTopRightRadius = r.tr + "px";
    el.style.borderBottomRightRadius = r.br + "px";
    el.style.borderBottomLeftRadius = r.bl + "px";

    const bcol = hexToRgba(s.border.color, s.border.alpha);
    el.style.borderWidth = (s.border.width || 0) + "px";
    el.style.borderStyle = s.border.style;
    el.style.borderColor = s.border.width ? bcol : "transparent";

    const outer = `${s.shadow.x || 0}px ${s.shadow.y || 0}px ${
      s.shadow.blur || 0
    }px ${s.shadow.spread || 0}px ${hexToRgba(s.shadow.color, s.shadow.alpha)}`;
    const inner = `${s.shadow.inset.x || 0}px ${s.shadow.inset.y || 0}px ${
      s.shadow.inset.blur || 0
    }px ${s.shadow.inset.spread || 0}px ${hexToRgba(
      s.shadow.inset.color,
      s.shadow.inset.alpha
    )} inset`;
    const arr = [];
    if (
      (s.shadow.blur || 0) > 0 ||
      (s.shadow.spread || 0) !== 0 ||
      (s.shadow.x || 0) !== 0 ||
      (s.shadow.y || 0) !== 0 ||
      (s.shadow.alpha || 0) > 0
    )
      arr.push(outer);
    if (
      (s.shadow.inset.blur || 0) > 0 ||
      (s.shadow.inset.spread || 0) !== 0 ||
      (s.shadow.inset.x || 0) !== 0 ||
      (s.shadow.inset.y || 0) !== 0 ||
      (s.shadow.inset.alpha || 0) > 0
    )
      arr.push(inner);
    const soft = s.border.soft || 0;
    if (soft > 0 && s.border.width > 0)
      arr.push(`0 0 ${soft}px ${Math.max(0, Math.floor(soft / 4))}px ${bcol}`);
    el.style.boxShadow = arr.join(", ");

    el.style.overflowX = b.scroll.x ? "auto" : "hidden";
    el.style.overflowY = b.scroll.y ? "auto" : "hidden";

    const L = b.layout || {};
    el.style.flexGrow = L.grow || 0;
    el.style.flexShrink = L.shrink == null ? 1 : L.shrink;
    if (L.basis?.mode === "auto") el.style.flexBasis = "auto";
    else if (L.basis?.mode === "px")
      el.style.flexBasis = (L.basis.value || 0) + "px";
    else if (L.basis?.mode === "%")
      el.style.flexBasis = (L.basis.value || 0) + "%";
    else if (L.basis?.mode === "fill") {
      el.style.flexBasis = "0px";
      el.style.flexGrow = 1;
      el.style.flexShrink = 1;
    }

    el.style.alignSelf =
      L.alignSelf && L.alignSelf !== "auto" ? L.alignSelf : "";
    el.style.width = L.widthPx ? L.widthPx + "px" : "";

    if (L.fullHeight) el.style.minHeight = `calc(100vh - 160px)`;
    else if (L.fixedHeight) el.style.minHeight = (L.fixedHeight | 0) + "px";
    else el.style.minHeight = L.minHeightPx ? L.minHeightPx + "px" : "";

    const top = el.querySelector(":scope > .overlay.top");
    const bot = el.querySelector(":scope > .overlay.bottom");
    if (s.overlay.top.enable) {
      top.style.display = "block";
      top.style.height = (s.overlay.top.h || 0) + "px";
      top.style.background = `linear-gradient(180deg, ${hexToRgba(
        s.overlay.top.color,
        s.overlay.top.alpha
      )} 0%, rgba(0,0,0,0) 100%)`;
    } else top.style.display = "none";
    if (s.overlay.bottom.enable) {
      bot.style.display = "block";
      bot.style.height = (s.overlay.bottom.h || 0) + "px";
      bot.style.background = `linear-gradient(0deg, ${hexToRgba(
        s.overlay.bottom.color,
        s.overlay.bottom.alpha
      )} 0%, rgba(0,0,0,0) 100%)`;
    } else bot.style.display = "none";
  }

  function renderBlock(b) {
    const el = document.createElement("div");
    el.className = "st-block";
    el.dataset.id = b.id;

    const bgL = document.createElement("div");
    bgL.className = "bg-layer";
    el.appendChild(bgL);
    const topO = document.createElement("div");
    topO.className = "overlay top";
    el.appendChild(topO);
    const botO = document.createElement("div");
    botO.className = "overlay bottom";
    el.appendChild(botO);

    const tb = document.createElement("div");
    tb.className = "block-toolbar";
    const sizeChip = (() => {
      const m = b.layout.basis.mode;
      if (m === "px") return `${b.layout.basis.value || 0}px`;
      if (m === "%") return `${b.layout.basis.value || 0}%`;
      if (m === "fill") return "FILL";
      return "AUTO";
    })();
    const modeChip =
      b.display === "grid" ? "GRID" : b.dir === "row" ? "↔ ROW" : "↕ COL";

    tb.innerHTML = `
  <button class="drag-handle" type="button" data-id="${b.id}" title="Перемістити блок">
    ⠿
  </button>
  <span class="chip">${modeChip}</span>
  <span class="chip">${b.children.length} ⬚</span>
  <span class="chip">${sizeChip}</span>
`;
    el.appendChild(tb);
    const dragHandle = tb.querySelector(".drag-handle");
    attachDragHandle(dragHandle, b.id);

    b.children.forEach((c) => el.appendChild(renderBlock(c)));

    if (b.id === selectedId) el.classList.add("selected");

    applyBlockStyles(el, b);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selectedId !== b.id) {
        selectedId = b.id;
        renderBreadcrumbs();
        emitSelection();
        render();
      }
    });

    if (
      b.style.bg.type === "image" &&
      b.scroll.panEnable &&
      !b.scroll.bgFixed
    ) {
      el.addEventListener(
        "scroll",
        () => {
          const bgLayer = el.querySelector(":scope > .bg-layer");
          const maxX = Math.max(1, el.scrollWidth - el.clientWidth);
          const maxY = Math.max(1, el.scrollHeight - el.clientHeight);
          let px = "center",
            py = "center";
          if (
            (b.scroll.panDir === "x" || b.scroll.panDir === "xy") &&
            el.scrollWidth > el.clientWidth
          )
            px = `${((el.scrollLeft / maxX) * 100).toFixed(1)}%`;
          if (
            (b.scroll.panDir === "y" || b.scroll.panDir === "xy") &&
            el.scrollHeight > el.clientHeight
          )
            py = `${((el.scrollTop / maxY) * 100).toFixed(1)}%`;
          bgLayer.style.backgroundPosition = `${px} ${py}`;
        },
        { passive: true }
      );
    }
    return el;
  }

  function render() {
    if (!canvas) return;
    canvas.innerHTML = "";
    rootBlocks.forEach((b) => canvas.appendChild(renderBlock(b)));
    renderBreadcrumbs();
  }

  // ===== breadcrumbs
  function renderBreadcrumbs() {
    const bc = $("#breadcrumbs", host);
    if (!bc) return;
    if (!selectedId) {
      bc.textContent = "Виберіть секцію…";
      return;
    }
    const path = [];
    (function dfs(list, chain) {
      for (const b of list) {
        const cc = [...chain, b];
        if (b.id === selectedId) {
          path.push(...cc);
          return true;
        }
        if (dfs(b.children, cc)) return true;
      }
      return false;
    })(rootBlocks, []);
    bc.innerHTML = path
      .map(
        (b, i) =>
          `<span class="small">${i ? "› " : ""}</span><a href="#" data-id="${
            b.id
          }" style="color:#93c5fd">Block(${
            b.display === "grid" ? "grid" : b.dir
          })</a>`
      )
      .join(" ");
    $$("#breadcrumbs a", host).forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        selectedId = a.dataset.id;
        render();
        emitSelection();
      })
    );
  }

  // ===== actions
  function addRootBlock() {
    const b = createBlock({});
    rootBlocks.push(b);
    selectedId = b.id;
    render();
    emitSelection();
    emitChange();
  }
  function addChildToSelected() {
    const sel = getSelected();
    if (!sel) return;
    const child = createBlock({
      dir: "column",
      style: { ...createBlock().style },
    });
    sel.children.push(child);
    selectedId = child.id;
    render();
    emitSelection();
    emitChange();
  }
  function duplicateSelected() {
    const sel = getSelected();
    if (!sel) return;
    const { arr, index } = findParentAndIndex(selectedId) || {};
    const copy = cloneBlock(sel);
    copy.id = uid();
    if (arr) arr.splice(index + 1, 0, copy);
    else rootBlocks.push(copy);
    selectedId = copy.id;
    render();
    emitSelection();
    emitChange();
  }
  function deleteSelected() {
    if (!selectedId) return;
    const pos = findParentAndIndex(selectedId);
    if (!pos) return;
    pos.arr.splice(pos.index, 1);
    selectedId = rootBlocks[0]?.id || null;
    render();
    emitSelection();
    emitChange();
  }

  function updateSelected(updater) {
    const sel = getSelected();
    if (!sel) return;
    updater(sel);
    render();
    emitSelection();
    emitChange();
  }

  // ===== storage
  function saveToStorage() {
    try {
      const data = JSON.stringify({ rootBlocks, selectedId });
      localStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.warn("[design] помилка збереження", e);
    }
  }
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.rootBlocks)) return null;
      return parsed;
    } catch (e) {
      console.warn("[design] помилка завантаження", e);
      return null;
    }
  }

  // ===== mount / unmount
  function mount(_host) {
    host = _host;
    canvas =
      $("#canvas", host) ||
      (() => {
        const wrap = document.createElement("div");
        wrap.id = "canvas";
        wrap.className = "canvas";
        host.appendChild(wrap);
        return wrap;
      })();

    const saved = loadFromStorage();
    if (saved && saved.rootBlocks?.length) {
      rootBlocks = saved.rootBlocks;
      selectedId = saved.selectedId || saved.rootBlocks[0].id;
    } else {
      // демо
      const demo = createBlock({
        display: "flex",
        dir: "row",
        gap: 20,
        style: {
          ...createBlock().style,
          bg: {
            type: "gradient",
            gA: "#0f172a",
            gAalpha: 1,
            gB: "#1d4ed8",
            gBalpha: 0.6,
            angle: 135,
          },
        },
      });
      demo.children.push(
        createBlock({
          layout: {
            basis: { mode: "%", value: 40, unit: "%" },
            grow: 0,
            shrink: 1,
            alignSelf: "stretch",
            minHeightPx: 260,
          },
          style: {
            ...createBlock().style,
            bg: { type: "color", color: "#111827", alpha: 0.8 },
          },
        })
      );
      demo.children.push(
        createBlock({
          layout: {
            basis: { mode: "fill", value: 0, unit: "px" },
            grow: 1,
            shrink: 1,
            alignSelf: "stretch",
            minHeightPx: 260,
          },
          style: {
            ...createBlock().style,
            bg: {
              type: "image",
              url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
              size: "cover",
              pos: "center",
              overlayColor: "#000",
              overlayAlpha: 0.35,
              gray: 0.3,
            },
          },
          padding: { t: 120, r: 24, b: 120, l: 24 },
          scroll: {
            x: false,
            y: true,
            panEnable: true,
            panDir: "y",
            bgFixed: false,
          },
        })
      );
      rootBlocks = [demo];
      selectedId = demo.id;
    }

    render();
    emitSelection();
    emitChange();

    console.log("[design] ядро змонтоване");

    return api; // повернемо API знизу
  }

  function unmount() {
    host = null;
    canvas = null;
    rootBlocks = [];
    selectedId = null;
    console.log("[design] ядро розмонтоване");
  }

  // ===== публічний API для інших файлів
  const api = {
    mount,
    unmount,
    getSelected,
    updateSelected,
    addRoot: addRootBlock,
    addChild: addChildToSelected,
    duplicate: duplicateSelected,
    deleteSelected,
    subscribeSelection(fn) {
      listeners.selection.push(fn);
      fn(getSelected());
    },
    subscribeChange(fn) {
      listeners.change.push(fn);
      fn(rootBlocks, getSelected());
    },
    getState() {
      return { rootBlocks, selectedId };
    },
  };

  window.STDesignCore = api;
})();
