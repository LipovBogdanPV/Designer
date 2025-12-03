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

  const STORAGE_KEY = "st:design:blocks:v2";

  function applyHeight(node, px) {
    node.style.height = px + "px";
    node.style.minHeight = px + "px";
    node.style.flexGrow = 0;
    node.style.flexShrink = 0;
    node.style.alignSelf = "flex-start";
  }
  let resizeHintTimer = null;

  function startInlineTextEdit(node) {
    node.contentEditable = "true";
    node.focus();

    // виділяємо текст
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function finish() {
      node.contentEditable = "false";
      node.removeEventListener("blur", onBlur);
      node.removeEventListener("keydown", onKey);

      const value = node.textContent || "";
      updateSelected((b) => {
        b.text = value;
      });
    }

    function onBlur() {
      finish();
    }

    function onKey(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        finish();
      } else if (e.key === "Escape") {
        e.preventDefault();
        node.contentEditable = "false";
        node.removeEventListener("blur", onBlur);
        node.removeEventListener("keydown", onKey);
      }
    }

    node.addEventListener("blur", onBlur);
    node.addEventListener("keydown", onKey);
  }


  function showResizeHint() {
    if (!host) return; // host = корінь плагіна, у тебе вже є

    let el = host.querySelector(".st-resize-hint");
    if (!el) {
      el = document.createElement("div");
      el.className = "st-resize-hint";
      el.textContent = "Спочатку виберіть блок для редагування";
      host.appendChild(el);
    }

    el.classList.add("visible");
    clearTimeout(resizeHintTimer);
    resizeHintTimer = setTimeout(() => {
      el.classList.remove("visible");
    }, 1500);
  }

  // ===== model
  function createBlock(partial = {}) {
    return Object.assign(
      {
        id: uid(),

        // 👇 НОВЕ: тип блоку
        // box  – звичайний контейнер
        // text – параграф
        // heading – заголовок (h1–h3)
        // image – картинка
        kind: "box",
        text: "",
        headingLevel: 2, // для kind = "heading"
        img: { src: "", alt: "" }, // для kind = "image"

        display: "flex", // 'flex' | 'grid'
        dir: "column", // flex only
        grid: { cols: 2, gap: 16 }, // grid only
        justify: "flex-start",
        align: "stretch",
        gap: 16,
        padding: { t: 24, r: 24, b: 24, l: 24 },
        outerMargin: { t: 5, r: 5, b: 5, l: 5 },
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
            all: 0,
            tl: 0,
            tr: 0,
            br: 0,
            bl: 0,
            d1a: 0,
            d1b: 0,
            d2a: 0,
            d2b: 0,
          },
          border: {
            width: 0,
            style: "solid",
            color: "#334155",
            alpha: 1,
            soft: 0,
          },
          shadow: {
            x: 0,
            y: 0,
            blur: 0,
            spread: 0,
            color: "#000000",
            alpha: 0,
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
          cornersOn: false,
          shadowsOn: false,   // 🔥 новий перемикач
          blockShadow: true, // ✅ НОВЕ поле
        },
        scroll: {
          x: false,
          y: false,
          panEnable: false,
          panDir: "y",
          bgFixed: false,
          // налаштування скролбару
          sbHide: false,
          sbThick: 8, // товщина, px
          sbTrack: "#020617", // фон треку
          sbThumb: "#64748b", // колір повзунка
          sbRadius: 8, // радіус повзунка, px
        },
        children: [],
      },
      partial
    );
  }

  const cloneBlock = (b) => JSON.parse(JSON.stringify(b));

  function applyCopyOffset(node, offsetPx) {
    const off = Number(offsetPx) || 0;
    if (!off) return;
    node.padding = node.padding || { t: 0, r: 0, b: 0, l: 0 };
    node.padding.t = (node.padding.t || 0) + off;
    node.padding.l = (node.padding.l || 0) + off;
  }

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
    if (!bg || bg.type === "none") return "";
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
    return "";
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
    hoverId: null,
    hoverMode: null,  // 'before' | 'after' | 'inside'
    hoverEl: null
    //ghost: null,
  };

  function clearDropHints() {
    document
      .querySelectorAll(
        ".st-block.drop-inside, .st-block.drop-before, .st-block.drop-after"
      )
      .forEach((el) => {
        el.classList.remove("drop-inside", "drop-before", "drop-after");
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
  // розширене переміщення блоку moveBlock
  // Переміщення з before/after/inside
  function findParentAndIndex(id, list = rootBlocks, parent = null) {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (b.id === id) {
        return { parent, arr: list, index: i };
      }
      if (b.children && b.children.length) {
        const res = findParentAndIndex(id, b.children, b);
        if (res) return res;
      }
    }
    return null;
  }

  function isAncestor(ancestorId, nodeId) {
    const pos = findParentAndIndex(ancestorId);
    if (!pos) return false;

    const anc = pos.arr[pos.index];
    const stack = [...(anc.children || [])];

    while (stack.length) {
      const n = stack.shift();
      if (n.id === nodeId) return true;
      if (n.children && n.children.length) {
        stack.push(...n.children);
      }
    }
    return false;
  }
  function moveBlockRelative(sourceId, targetId, mode) {
    if (!sourceId || !targetId || sourceId === targetId) return;

    const srcPos = findParentAndIndex(sourceId);
    const tgtPos = findParentAndIndex(targetId);
    if (!srcPos || !tgtPos) return;

    // не дозволяємо кидати батька у свого нащадка
    if (mode === "inside" && isAncestor(sourceId, targetId)) return;

    const srcArr = srcPos.arr;
    const tgtArr = tgtPos.arr;

    const [node] = srcArr.splice(srcPos.index, 1);

    if (mode === "inside") {
      const tgtNode = tgtArr[tgtPos.index];
      tgtNode.children = tgtNode.children || [];
      tgtNode.children.push(node);
      return;
    }

    // вставка перед / після target у той самий масив
    let insertIndex = tgtPos.index;

    // якщо тягнемо вниз у той самий масив – індекс зміщується
    if (srcArr === tgtArr && srcPos.index < tgtPos.index) {
      insertIndex -= 1;
    }
    if (mode === "after") insertIndex += 1;

    tgtArr.splice(insertIndex, 0, node);
  }
  // запуск перетягування (на іконці "⠿" чи на всьому блоці – як у тебе)

  function attachDragHandle(handleEl, blockId) {
    if (!handleEl) return;

    handleEl.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return; // тільки ЛКМ
      if (window.ST_DESIGN_DND_ENABLED === false) return;
      e.preventDefault();
      e.stopPropagation();
      startDrag(blockId, e.clientX, e.clientY);
    });
  }

  function startDrag(blockId, clientX, clientY) {
    const blockEl = document.querySelector(`.st-block[data-id="${blockId}"]`);
    if (!blockEl) return;

    dnd.draggingId = blockId;
    dnd.hoverId = null;
    clearDropHints();

    // простий "ghost"
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
    const host =
      el && el.closest ? el.closest('[data-plugin="design"] .st-block') : null;
    const targetId = host && host.dataset ? host.dataset.id : null;

    // не можна наводитись на самого себе
    if (targetId && targetId !== dnd.draggingId) {
      dnd.hoverId = targetId;

      const rect = host.getBoundingClientRect();
      const relY = (y - rect.top) / rect.height;

      let mode;
      if (relY < 0.25) mode = "before";
      else if (relY > 0.75) mode = "after";
      else mode = "inside";

      dnd.hoverMode = mode;

      host.classList.add(
        mode === "before"
          ? "drop-before"
          : mode === "after"
            ? "drop-after"
            : "drop-inside"
      );
    } else {
      dnd.hoverId = null;
      dnd.hoverMode = null;
    }

  }

  function onDragEnd() {
    if (!dnd.draggingId) return;

    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);

    if (dnd.ghost && dnd.ghost.parentNode) {
      dnd.ghost.parentNode.removeChild(dnd.ghost);
    }
    dnd.ghost = null;

    clearDropHints();

    const fromId = dnd.draggingId;
    const toId = dnd.hoverId;
    const mode = dnd.hoverMode || "inside";

    if (fromId && toId && fromId !== toId) {
      moveBlockRelative(fromId, toId, mode);
      render();
      emitSelection();
      emitChange();
    }

    dnd.hoverMode = null;
    dnd.draggingId = null;
    dnd.hoverId = null;
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
    const s = b.style;
    const r = computeRadii(s.radius);
    const cornersOn = !!s.cornersOn;

    //r = computeRadii(s.radius);

    if (b.display === "grid") {
      el.style.display = "grid";
      el.style.gridTemplateColumns = `repeat(${Math.max(
        1,
        b.grid.cols || 2
      )}, minmax(0,1fr))`;
      el.style.gridGap = (b.grid.gap || 0) + "px";
      el.dataset.dir = "";
    } else if (b.display === "flex") {
      el.style.display = "flex";
      el.dataset.dir = b.dir;
      el.style.flexDirection = b.dir;
      el.style.justifyContent = b.justify;
      el.style.alignItems = b.align;
      el.style.gap = (b.gap || 0) + "px";
    } else if (b.display === "block") {
      el.style.display = "block";
      el.dataset.dir = "";
    } else if (b.display === "inline-block") {
      el.style.display = "inline-block";
      el.dataset.dir = "";
    }

    el.style.paddingTop = (b.padding.t || 0) + "px";
    el.style.paddingRight = (b.padding.r || 0) + "px";
    el.style.paddingBottom = (b.padding.b || 0) + "px";
    el.style.paddingLeft = (b.padding.l || 0) + "px";
    el.style.maxWidth = b.maxWidth || "";
    const m = b.outerMargin || { t: 0, r: 0, b: 0, l: 0 };

    el.style.marginTop = (m.t || 0) + "px";
    el.style.marginBottom = (m.b || 0) + "px";

    if (b.maxWidth) {
      // центруємо по ширині, ігноруємо left/right margin
      el.style.marginLeft = "auto";
      el.style.marginRight = "auto";
    } else {
      el.style.marginLeft = (m.l || 0) + "px";
      el.style.marginRight = (m.r || 0) + "px";
    }

    const bgLayer = el.querySelector(":scope > .bg-layer");
    // фон /
    if (s.bg.type === "image") {
      // фон малюємо через окремий шар, сам блочний фон очищаємо
      el.style.background = "";
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

      const bg = buildBackground(s.bg); // "" або реальний фон
      if (bg) {
        el.style.background = bg;
      } else {
        // тип "none" — повністю прибираємо фон
        el.style.background = "";
      }


      // Повне очищення зайвих background-властивостей

    }

    // радіуси
    // ----- КУТИ / БОРДЕР -----
    const bw = s.border.width || 0;
    const bcol = hexToRgba(s.border.color, s.border.alpha);

    if (cornersOn) {
      // радіуси
      el.style.borderTopLeftRadius = r.tl + "px";
      el.style.borderTopRightRadius = r.tr + "px";
      el.style.borderBottomRightRadius = r.br + "px";
      el.style.borderBottomLeftRadius = r.bl + "px";

      // бордер
      if (bw > 0) {
        el.style.borderWidth = bw + "px";
        el.style.borderStyle = s.border.style || "solid";
        el.style.borderColor = bcol;
      } else {
        el.style.borderWidth = "";
        el.style.borderStyle = "";
        el.style.borderColor = "";
      }
    } else {
      // скидаємо кути та бордер повністю
      el.style.borderTopLeftRadius = "0px";
      el.style.borderTopRightRadius = "0px";
      el.style.borderBottomRightRadius = "0px";
      el.style.borderBottomLeftRadius = "0px";

      el.style.borderWidth = "";
      el.style.borderStyle = "";
      el.style.borderColor = "";
    }

    // ----- ТІНІ (незалежно від cornersOn) -----
    const boxShadows = [];

    if (s.shadowsOn) {
      const outer = `${s.shadow.x || 0}px ${s.shadow.y || 0}px ${s.shadow.blur || 0}px ${s.shadow.spread || 0
        }px ${hexToRgba(s.shadow.color, s.shadow.alpha)}`;

      const inner = `${s.shadow.inset.x || 0}px ${s.shadow.inset.y || 0}px ${s.shadow.inset.blur || 0
        }px ${s.shadow.inset.spread || 0}px ${hexToRgba(
          s.shadow.inset.color,
          s.shadow.inset.alpha
        )} inset`;

      // зовнішня тінь
      if (
        (s.shadow.blur || 0) > 0 ||
        (s.shadow.spread || 0) !== 0 ||
        (s.shadow.x || 0) !== 0 ||
        (s.shadow.y || 0) !== 0 ||
        (s.shadow.alpha || 0) > 0
      ) {
        boxShadows.push(outer);
      }

      // внутрішня тінь
      if (
        (s.shadow.inset.blur || 0) > 0 ||
        (s.shadow.inset.spread || 0) !== 0 ||
        (s.shadow.inset.x || 0) !== 0 ||
        (s.shadow.inset.y || 0) !== 0 ||
        (s.shadow.inset.alpha || 0) > 0
      ) {
        boxShadows.push(inner);
      }
    }

    // м’який контур від бордера (прив’язаний до кута/бордера, але не до shadowsOn)
    const soft = s.border.soft || 0;
    if (cornersOn && bw > 0 && soft > 0) {
      boxShadows.push(
        `0 0 ${soft}px ${Math.max(0, Math.floor(soft / 4))}px ${bcol}`
      );
    }

    el.style.boxShadow = boxShadows.join(", ");

    // ----- ПРОКРУТКА / SCROLLBAR -----
    const sc = b.scroll || {};

    el.style.overflowX = sc.x ? "auto" : "hidden";
    el.style.overflowY = sc.y ? "auto" : "hidden";

    // прокрутка + кастомний скролбар через CSS-змінні
    el.style.setProperty("--sb-thick", (sc.sbThick ?? 0) + "px");
    el.style.setProperty("--sb-track", sc.sbTrack || "");
    el.style.setProperty("--sb-thumb", sc.sbThumb || "");
    el.style.setProperty("--sb-radius", (sc.sbRadius ?? 0) + "px");

    if (sc.sbHide) el.classList.add("sb-hide-scrollbar");
    else el.classList.remove("sb-hide-scrollbar");
    // розміри та поведінка в flex-контейнері
    const L = b.layout || {};
    el.style.flexGrow = L.grow || 0;
    el.style.flexShrink = L.shrink == null ? 1 : L.shrink;

    if (L.basis?.mode === "auto") {
      el.style.flexBasis = "auto";
    } else if (L.basis?.mode === "px") {
      el.style.flexBasis = (L.basis.value || 0) + "px";
    } else if (L.basis?.mode === "%") {
      el.style.flexBasis = (L.basis.value || 0) + "%";
    } else if (L.basis?.mode === "fill") {
      el.style.flexBasis = "0px";
      el.style.flexGrow = 1;
      el.style.flexShrink = 1;
    }

    // базове align-self з layout (якщо користувач явно вибрав)
    let selfAlign =
      L.alignSelf && L.alignSelf !== "auto" ? L.alignSelf : "";

    // явна ширина
    el.style.width = L.widthPx ? L.widthPx + "px" : "";

    // ВИСОТА / МІН-ВИСОТА
    if (L.fullHeight) {
      el.style.minHeight = `calc(100vh - 160px)`;
    } else if (L.fixedHeight) {
      const h = L.fixedHeight | 0;
      el.style.minHeight = h ? h + "px" : "";
      // якщо користувач не задав alignSelf – не даємо flex'у нас розтягувати
      if (!selfAlign) selfAlign = "flex-start";
    } else if (L.minHeightPx) {
      el.style.minHeight = L.minHeightPx + "px";
      if (!selfAlign) selfAlign = "flex-start";
    } else {
      el.style.minHeight = "";
    }

    // тільки тут виставляємо align-self
    el.style.alignSelf = selfAlign;
    // ----- PIN / FIXED ПОЗИЦІЯ -----
    const pin = L.pin || {};
    if (pin.enabled) {
      el.style.position = "fixed";
      el.style.zIndex = 1000;
      el.style.top = "";
      el.style.right = "";
      el.style.bottom = "";
      el.style.left = "";

      if (pin.side === "top") el.style.top = "0";
      else if (pin.side === "bottom") el.style.bottom = "0";
      else if (pin.side === "left") el.style.left = "0";
      else if (pin.side === "right") el.style.right = "0";
    } else {
      el.style.position = "";
      el.style.top = "";
      el.style.right = "";
      el.style.bottom = "";
      el.style.left = "";
      el.style.zIndex = "";
    }


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

    // створюємо resize-ручки
    const resizeRight = document.createElement("div");
    resizeRight.className = "resize-handle resize-right";

    const resizeLeft = document.createElement("div");
    resizeLeft.className = "resize-handle resize-left";

    const resizeBottom = document.createElement("div");
    resizeBottom.className = "resize-handle resize-bottom";

    const resizeTop = document.createElement("div");
    resizeTop.className = "resize-handle resize-top";

    // кути
    const resizeCornerBR = document.createElement("div");
    resizeCornerBR.className = "resize-handle resize-corner br";

    const resizeCornerTR = document.createElement("div");
    resizeCornerTR.className = "resize-handle resize-corner tr";

    const resizeCornerBL = document.createElement("div");
    resizeCornerBL.className = "resize-handle resize-corner bl";

    const resizeCornerTL = document.createElement("div");
    resizeCornerTL.className = "resize-handle resize-corner tl";

    el.appendChild(resizeRight);
    el.appendChild(resizeLeft);
    el.appendChild(resizeBottom);
    el.appendChild(resizeTop);
    el.appendChild(resizeCornerBR);
    el.appendChild(resizeCornerTR);
    el.appendChild(resizeCornerBL);
    el.appendChild(resizeCornerTL);

    // привʼязуємо ресайз
    attachResizeHandlers(el, b.id);

    // === КОНТЕНТ БЛОКУ (TEXT / HEADING / IMG) ===
    let contentEl = null;

    if (b.kind === "text") {
      contentEl = document.createElement("p");
      contentEl.className = "st-text";
      contentEl.textContent = b.text || "Новий текст…";
    } else if (b.kind === "heading") {
      const lvl = clamp(b.headingLevel || 2, 1, 3);
      const tag = "h" + lvl;
      contentEl = document.createElement(tag);
      contentEl.className = "st-heading st-heading-" + lvl;
      contentEl.textContent = b.text || "Заголовок";
    } else if (b.kind === "image") {
      contentEl = document.createElement("img");
      contentEl.className = "st-image";
      contentEl.src = (b.img && b.img.src) || "https://placehold.co/800x300?text=Hello+World";
      contentEl.alt = (b.img && b.img.alt) || "";
    }

    if (contentEl) {
      contentEl.classList.add("st-block-content");
      el.appendChild(contentEl);

      // вибір блоку + інлайн-редагування тексту
      if (b.kind === "text" || b.kind === "heading") {
        contentEl.addEventListener("dblclick", (e) => {
          e.stopPropagation();

          if (selectedId !== b.id) {
            selectedId = b.id;
            renderBreadcrumbs();
            emitSelection();
            render();
            return; // при наступному даблкліку вже будемо редагувати у новому DOM
          }

          startInlineTextEdit(contentEl);
        });
      }

      if (b.kind === "image") {
        contentEl.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          if (selectedId !== b.id) {
            selectedId = b.id;
            renderBreadcrumbs();
            emitSelection();
          }
          const url = prompt("Введіть URL зображення", b.img?.src || "");
          if (url != null) {
            updateSelected((blk) => {
              blk.img = blk.img || {};
              blk.img.src = url;
            });
          }
        });
      }
    }

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
  // головний рендер

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
          `<span class="small">${i ? "› " : ""}</span><a href="#" data-id="${b.id
          }" style="color:#93c5fd">Block(${b.display === "grid" ? "grid" : b.dir
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
    // 🧩 якщо батько — flex + горизонтальний ряд,
    // робимо дитину "FILL" (flex: 1 1 0)
    if (sel.display === "flex" && sel.dir === "row") {
      child.layout.basis.mode = "fill";
      child.layout.basis.value = 0;
    }
    sel.children.push(child);
    selectedId = child.id;
    render();
    emitSelection();
    emitChange();
  }
  // 
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
  // копіювання всередину
  function copyInside(offsetPx = 0) {
    const sel = getSelected();
    if (!sel) return;

    const copy = cloneBlock(sel);
    copy.id = uid();
    applyCopyOffset(copy, offsetPx);

    sel.children = sel.children || [];
    sel.children.push(copy);

    selectedId = copy.id;
    render();
    emitSelection();
    emitChange();
  }
  // 
  function addContentToSelected(kind) {
    const sel = getSelected();
    if (!sel) return;

    let partial = {
      kind,
      layout: { ...createBlock().layout },
      style: { ...createBlock().style },
      padding: { t: 8, r: 8, b: 8, l: 8 },
      children: [],
    };

    if (kind === "text") {
      partial.text = "Новий текст…";
    } else if (kind === "heading") {
      partial.text = "Новий заголовок";
      partial.headingLevel = 2;
    } else if (kind === "image") {
      partial.img = {
        src: "https://placehold.co/800x300?text=Hello+World",
        alt: "Зображення",
      };
      // для картинки часто фон не потрібен
      partial.style.bg = { type: "none" };
    } else {
      partial.kind = "box";
    }

    const child = createBlock(partial);

    // якщо батько — ряд (COL), можна зробити fill
    if (sel.display === "flex" && sel.dir === "row") {
      child.layout.basis.mode = "fill";
      child.layout.grow = 1;
      child.layout.shrink = 1;
    }

    sel.children.push(child);
    selectedId = child.id;
    render();
    emitSelection();
    emitChange();
  }
  //
  function copyOutside(offsetPx = 0) {
    const sel = getSelected();
    if (!sel) return;

    const pos = findParentAndIndex(sel.id);
    let arr, index;

    if (pos) {
      arr = pos.arr;
      index = pos.index;
    } else {
      // якщо блок на верхньому рівні
      arr = rootBlocks;
      index = rootBlocks.findIndex((b) => b.id === sel.id);
      if (index === -1) return;
    }

    const copy = cloneBlock(sel);
    copy.id = uid();
    applyCopyOffset(copy, offsetPx);

    arr.splice(index + 1, 0, copy);

    selectedId = copy.id;
    render();
    emitSelection();
    emitChange();
  }
  //
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
  //
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
    addContentToSelected,              // 👈 НОВЕ
    addText() { addContentToSelected("text"); },
    addHeading() { addContentToSelected("heading"); },
    addImage() { addContentToSelected("image"); },
    duplicate: duplicateSelected,
    deleteSelected,
    copyInside,
    copyOutside,
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
  // ===== обробники зміни розміру
  function attachResizeHandlers(blockEl, blockId) {
    const right = blockEl.querySelector(".resize-right");
    const left = blockEl.querySelector(".resize-left");
    const bottom = blockEl.querySelector(".resize-bottom");
    const top = blockEl.querySelector(".resize-top");

    const cornerBR = blockEl.querySelector(".resize-corner.br");
    const cornerTR = blockEl.querySelector(".resize-corner.tr");
    const cornerBL = blockEl.querySelector(".resize-corner.bl");
    const cornerTL = blockEl.querySelector(".resize-corner.tl");

    function startResize(e, axis, side) {
      e.preventDefault();
      e.stopPropagation();

      // 🔒 дозволяємо ресайз тільки для поточно вибраного блоку
      if (selectedId !== blockId) {
        showResizeHint();
        return;
      }

      const sel = findById(rootBlocks, blockId);
      if (!sel) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const rect = blockEl.getBoundingClientRect();

      const startWidth = rect.width;
      const startHeight = rect.height;

      const isLeft =
        side === "left" || side === "tl" || side === "bl";
      const isTop =
        side === "top" || side === "tl" || side === "tr";

      function onMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        updateSelected((b) => {
          b.layout = b.layout || {};
          const L = b.layout;

          // --- ШИРИНА ---
          if (axis === "x" || axis === "xy") {
            let newW = isLeft ? startWidth - dx : startWidth + dx;
            newW = Math.max(80, Math.round(newW)); // мінімальна ширина

            L.widthPx = newW;

            // перевести в режим фіксованої ширини
            if (L.basis) {
              L.basis.mode = "auto";
              L.basis.value = 0;
            }
            L.grow = 0;
            // shrink можна залишити як є
          }

          // --- ВИСОТА ---
          if (axis === "y" || axis === "xy") {
            let newH = isTop ? startHeight - dy : startHeight + dy;
            newH = Math.max(40, Math.round(newH)); // мінімальна висота

            L.fixedHeight = newH;
            L.fullHeight = false; // якщо вручну тягнемо — скидаємо fullHeight
          }
        });
      }

      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    // горизонтальні
    right?.addEventListener("mousedown", (e) => startResize(e, "x", "right"));
    left?.addEventListener("mousedown", (e) => startResize(e, "x", "left"));

    // вертикальні
    bottom?.addEventListener("mousedown", (e) => startResize(e, "y", "bottom"));
    top?.addEventListener("mousedown", (e) => startResize(e, "y", "top"));

    // кути (міняємо і ширину, і висоту)
    cornerBR?.addEventListener("mousedown", (e) => startResize(e, "xy", "br"));
    cornerTR?.addEventListener("mousedown", (e) => startResize(e, "xy", "tr"));
    cornerBL?.addEventListener("mousedown", (e) => startResize(e, "xy", "bl"));
    cornerTL?.addEventListener("mousedown", (e) => startResize(e, "xy", "tl"));
  }


  window.STDesignCore = api;
})();
