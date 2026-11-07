let i18n = {};
let currentLang = localStorage.getItem("mergeIslandLang") || "zh-Hant";

const t = (key) => {
    if (i18n[currentLang] && i18n[currentLang][key]) return i18n[currentLang][key];
    if (i18n["zh-Hant"] && i18n["zh-Hant"][key]) return i18n["zh-Hant"][key];
    return key;
};

const FIXED_ROWS = 7;
const FIXED_COLS = 7;
const DOUBLE_TAP_MS = 360;
const DRAG_THRESHOLD = 8;
const AUTO_SCROLL_EDGE = 120;
const AUTO_SCROLL_MAX_SPEED = 26;

const paletteEl = document.getElementById("palette");
const boardEl = document.getElementById("board");
const languageSelect = document.getElementById("languageSelect");
const targetSelect = document.getElementById("targetSelect");
const customTargetInput = document.getElementById("customTargetInput");
const buildBtn = document.getElementById("buildBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const deleteModeBtn = document.getElementById("deleteModeBtn");

const targetValueEl = document.getElementById("targetValue");
const targetNoteEl = document.getElementById("targetNote");
const currentValueEl = document.getElementById("currentValue");
const placedNoteEl = document.getElementById("placedNote");
const missingCardEl = document.getElementById("missingCard");
const missingValueEl = document.getElementById("missingValue");
const missingNoteEl = document.getElementById("missingNote");
const progressTextEl = document.getElementById("progressText");
const statusTextEl = document.getElementById("statusText");
const progressBarEl = document.getElementById("progressBar");
const statsListEl = document.getElementById("statsList");
const toastEl = document.getElementById("toast");

const icons = [
    "🍴", "🍽️", "🥄", "🔪", "🧂", "🍳", "🥘", "🍲", "🧃", "🥣",
    "🍞", "🧈", "🥫", "🥤", "🍵", "☕", "🧁", "🍰", "🎂", "🍯",
    "🧊", "🥗", "🍱", "🍜", "🍝", "🍕", "🍔", "🌮", "🥪", "🥐"
];

// Tropical set: each level stays distinct, all sit well on sand and lagoon
const gradients = [
    ["#2ec4b6", "#0f8b8d"],
    ["#ffb347", "#f07c1e"],
    ["#5fa8f5", "#2f6fd6"],
    ["#ff7a8a", "#e04f5f"],
    ["#7bd389", "#2f9e5b"],
    ["#b48cf2", "#7b55d6"],
    ["#ffd25e", "#e09a00"],
    ["#4dd0e1", "#00838f"],
    ["#f78fb3", "#c2477a"],
    ["#9ccc65", "#558b2f"],
    ["#ff9e6d", "#d9542b"],
    ["#64b5f6", "#3949ab"],
    ["#26a69a", "#0b5e69"]
];

const state = {
    targetCount: 13,
    targetLevel: 12, // 2^(13-1) = 2^12
    target: 4096,
    rows: FIXED_ROWS,
    cols: FIXED_COLS,
    selectedValue: null,
    deleteMode: false,
    suppressBuildToast: false,
    items: [],
    board: []
};

let toastTimer = null;
let lastTapIndex = null;
let lastTapAt = 0;
let suppressNextClick = false;

const pointerDrag = {
    active: false,
    started: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    value: null,
    from: null,
    cellIndex: null,
    sourceEl: null,
    ghostEl: null,
    overCell: null,
    autoScrollFrame: null
};

const loadI18n = async () => {
    const response = await fetch("./i18n/core.json", { cache: "no-store" });

    if (!response.ok) throw new Error("Unable to load i18n.json");

    i18n = await response.json();

    if (!i18n[currentLang]) {
        currentLang = "zh-Hant";
        localStorage.setItem("mergeIslandLang", currentLang);
    }
};

const formatTargetOptionLabel = (count) => {
    const unit = t("targetUnit");

    if (currentLang === "ko") {
        return `${count}${unit}`;
    }

    return `${count} ${unit}`;
};

const getSelectedTargetCount = () => {
    if (targetSelect.value === "custom") {
        const customVal = parseInt(customTargetInput.value, 10);
        return (!isNaN(customVal) && customVal >= 2) ? customVal : 13;
    }
    return Number(targetSelect.value) || 13;
};

const renderTargetOptions = () => {
    const selectedValue = targetSelect.value || String(state.targetCount || 13);
    const counts = [11, 12, 13];

    targetSelect.innerHTML = "";

    counts.forEach((count) => {
        const option = document.createElement("option");
        option.value = String(count);
        option.textContent = formatTargetOptionLabel(count);

        if (option.value === selectedValue) {
            option.selected = true;
        }

        targetSelect.appendChild(option);
    });

    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = t("targetCustom") || (currentLang === "zh-Hant" ? "自行輸入" : "Custom");
    if (selectedValue === "custom") {
        customOption.selected = true;
    }
    targetSelect.appendChild(customOption);
};

const applyStaticI18n = () => {
    document.documentElement.lang = currentLang;
    document.title = t("pageTitle");

    const nodes = document.querySelectorAll("[data-i18n]");

    nodes.forEach((node) => {
        const key = node.getAttribute("data-i18n");
        node.textContent = t(key).replace("{year}", String(new Date().getFullYear()));
    });

    languageSelect.value = currentLang;
    renderTargetOptions();
    renderGuide();
};

const setLanguage = (lang) => {
    if (!i18n[lang]) return;

    currentLang = lang;
    localStorage.setItem("mergeIslandLang", currentLang);

    applyStaticI18n();
    renderPalette();
    recalc();
    announceLanguage();
};

const formatNumber = (value) => {
    return Number(value).toLocaleString("en-US");
};

const shuffleArray = (arr) => {
    const copy = arr.slice();

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }

    return copy;
};

// 從 2^0 開始算，產生到 2^(targetCount - 2)，共 (targetCount - 1) 個物件
const getPaletteValues = (targetCount) => {
    const values = [];
    const paletteCount = Math.max(1, targetCount - 1);

    for (let level = 0; level < paletteCount; level++) {
        values.push(2 ** level);
    }

    return values;
};

const createItems = (targetCount) => {
    const values = getPaletteValues(targetCount);
    const shuffledIcons = shuffleArray(icons);

    return values.map((value, index) => {
        const gradient = gradients[index % gradients.length];

        return {
            level: index + 1,
            value,
            icon: shuffledIcons[index % shuffledIcons.length],
            from: gradient[0],
            to: gradient[1]
        };
    });
};

const getItemByValue = (value) => {
    return state.items.find(item => item.value === value) || null;
};

const createTokenElement = (item, mode, cellIndex) => {
    const token = document.createElement("div");
    token.className = "token";
    token.draggable = false;
    token.dataset.value = String(item.value);
    token.dataset.mode = mode;

    if (typeof cellIndex === "number") {
        token.dataset.cellIndex = String(cellIndex);
    }

    token.style.background = `linear-gradient(135deg, ${item.from}, ${item.to})`;

    if (state.selectedValue === item.value && mode === "palette") {
        token.classList.add("selected");
    }

    const power = document.createElement("div");
    power.className = "token-power";
    power.textContent = `Lv.${item.level}`;

    const icon = document.createElement("div");
    icon.className = "token-icon";
    icon.textContent = item.icon;

    const value = document.createElement("div");
    value.className = "token-value";
    value.textContent = formatNumber(item.value);

    token.appendChild(power);
    token.appendChild(icon);
    token.appendChild(value);

    token.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        if (state.deleteMode) return;

        startPointerDrag(event, {
            from: mode,
            value: item.value,
            cellIndex: typeof cellIndex === "number" ? cellIndex : null,
            sourceEl: token
        });
    });

    if (mode === "palette") {
        token.addEventListener("click", () => {
            if (suppressNextClick) {
                suppressNextClick = false;
                return;
            }

            if (state.selectedValue === item.value) {
                state.selectedValue = null;
            } else {
                state.selectedValue = item.value;
                state.deleteMode = false;
                deleteModeBtn.classList.remove("active");
            }

            renderPalette();
        });
    }

    return token;
};

const renderPalette = () => {
    paletteEl.innerHTML = "";

    for (const item of state.items) {
        paletteEl.appendChild(createTokenElement(item, "palette"));
    }
};

const renderBoard = () => {
    boardEl.innerHTML = "";

    for (let i = 0; i < state.board.length; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = String(i);

        const value = state.board[i];

        if (value !== null) {
            cell.classList.add("filled");

            const item = getItemByValue(value);

            if (item) {
                cell.appendChild(createTokenElement(item, "cell", i));
            }

            const remove = document.createElement("div");
            remove.className = "cell-remove";
            remove.textContent = "×";
            cell.appendChild(remove);
        }

        cell.addEventListener("click", () => {
            if (suppressNextClick) {
                suppressNextClick = false;
                return;
            }

            const index = Number(cell.dataset.index);
            const now = Date.now();

            if (state.deleteMode) {
                removeCell(index);
                return;
            }

            const isSameCell = lastTapIndex === index;
            const isFastEnough = now - lastTapAt <= DOUBLE_TAP_MS;
            const hasItem = state.board[index] !== null;
            const noSelectedItem = state.selectedValue === null;

            if (isSameCell && isFastEnough && hasItem && noSelectedItem) {
                lastTapIndex = null;
                lastTapAt = 0;
                removeCell(index);
                return;
            }

            lastTapIndex = index;
            lastTapAt = now;

            if (state.selectedValue !== null) {
                state.board[index] = state.selectedValue;
                renderBoard();
                recalc();
            }
        });

        cell.addEventListener("dblclick", () => {
            const index = Number(cell.dataset.index);
            removeCell(index);
        });

        boardEl.appendChild(cell);
    }
};

const startPointerDrag = (event, payload) => {
    pointerDrag.active = true;
    pointerDrag.started = false;
    pointerDrag.pointerId = event.pointerId;
    pointerDrag.startX = event.clientX;
    pointerDrag.startY = event.clientY;
    pointerDrag.currentX = event.clientX;
    pointerDrag.currentY = event.clientY;
    pointerDrag.value = payload.value;
    pointerDrag.from = payload.from;
    pointerDrag.cellIndex = payload.cellIndex;
    pointerDrag.sourceEl = payload.sourceEl;
    pointerDrag.ghostEl = null;
    pointerDrag.overCell = null;
    pointerDrag.autoScrollFrame = null;

    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, { passive: false });
    document.addEventListener("pointercancel", cancelPointerDrag, { passive: false });
};

const onPointerMove = (event) => {
    if (!pointerDrag.active || event.pointerId !== pointerDrag.pointerId) return;

    const dx = event.clientX - pointerDrag.startX;
    const dy = event.clientY - pointerDrag.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const distance = Math.sqrt(dx * dx + dy * dy);

    pointerDrag.currentX = event.clientX;
    pointerDrag.currentY = event.clientY;

    if (!pointerDrag.started && distance < DRAG_THRESHOLD) return;

    if (!pointerDrag.started && pointerDrag.from === "palette" && absX > absY * 1.15) {
        cleanupPointerDrag();
        return;
    }

    event.preventDefault();

    if (!pointerDrag.started) {
        beginVisualDrag(event.clientX, event.clientY);
    }

    moveGhost(event.clientX, event.clientY);
    updateOverCell(event.clientX, event.clientY);
    startAutoScroll();
};

const onPointerUp = (event) => {
    if (!pointerDrag.active || event.pointerId !== pointerDrag.pointerId) return;

    pointerDrag.currentX = event.clientX;
    pointerDrag.currentY = event.clientY;

    if (pointerDrag.started) {
        event.preventDefault();

        const cell = getCellFromPoint(event.clientX, event.clientY);

        if (cell) {
            const targetIndex = Number(cell.dataset.index);
            placeDraggedItem(targetIndex);
        }

        suppressNextClick = true;
    }

    cleanupPointerDrag();
};

const cancelPointerDrag = () => {
    cleanupPointerDrag();
};

const beginVisualDrag = (x, y) => {
    pointerDrag.started = true;
    document.body.classList.add("is-dragging");

    if (pointerDrag.sourceEl) {
        pointerDrag.sourceEl.classList.add("dragging-source");

        try {
            pointerDrag.sourceEl.setPointerCapture(pointerDrag.pointerId);
        } catch (err) { }
    }

    const item = getItemByValue(pointerDrag.value);
    if (!item) return;

    const ghost = createTokenElement(item, "ghost");
    ghost.classList.add("drag-ghost");
    ghost.style.width = pointerDrag.sourceEl ? `${pointerDrag.sourceEl.offsetWidth}px` : "70px";
    ghost.style.height = pointerDrag.sourceEl ? `${pointerDrag.sourceEl.offsetHeight}px` : "70px";
    ghost.style.pointerEvents = "none";

    document.body.appendChild(ghost);
    pointerDrag.ghostEl = ghost;
    moveGhost(x, y);
};

const moveGhost = (x, y) => {
    if (!pointerDrag.ghostEl) return;

    pointerDrag.ghostEl.style.left = `${x}px`;
    pointerDrag.ghostEl.style.top = `${y}px`;
};

const startAutoScroll = () => {
    if (pointerDrag.autoScrollFrame !== null) return;

    const step = () => {
        if (!pointerDrag.active || !pointerDrag.started) {
            stopAutoScroll();
            return;
        }

        const y = pointerDrag.currentY;
        const viewportHeight = window.innerHeight;

        let scrollSpeed = 0;

        if (y < AUTO_SCROLL_EDGE) {
            const intensity = (AUTO_SCROLL_EDGE - y) / AUTO_SCROLL_EDGE;
            scrollSpeed = -AUTO_SCROLL_MAX_SPEED * intensity;
        } else if (y > viewportHeight - AUTO_SCROLL_EDGE) {
            const intensity = (y - (viewportHeight - AUTO_SCROLL_EDGE)) / AUTO_SCROLL_EDGE;
            scrollSpeed = AUTO_SCROLL_MAX_SPEED * intensity;
        }

        if (scrollSpeed !== 0) {
            const scroller = document.scrollingElement || document.documentElement || document.body;
            scroller.scrollTop += scrollSpeed;

            moveGhost(pointerDrag.currentX, pointerDrag.currentY);
            updateOverCell(pointerDrag.currentX, pointerDrag.currentY);
        }

        pointerDrag.autoScrollFrame = requestAnimationFrame(step);
    };

    pointerDrag.autoScrollFrame = requestAnimationFrame(step);
};

const stopAutoScroll = () => {
    if (pointerDrag.autoScrollFrame !== null) {
        cancelAnimationFrame(pointerDrag.autoScrollFrame);
        pointerDrag.autoScrollFrame = null;
    }
};

const getCellFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return el.closest ? el.closest(".cell") : null;
};

const updateOverCell = (x, y) => {
    const cell = getCellFromPoint(x, y);

    if (pointerDrag.overCell && pointerDrag.overCell !== cell) {
        pointerDrag.overCell.classList.remove("drag-over");
    }

    if (cell) {
        cell.classList.add("drag-over");
    }

    pointerDrag.overCell = cell;
};

const placeDraggedItem = (targetIndex) => {
    if (pointerDrag.from === "cell" && typeof pointerDrag.cellIndex === "number") {
        const oldIndex = pointerDrag.cellIndex;
        const movingValue = state.board[oldIndex];

        if (movingValue === null) return;

        state.board[oldIndex] = null;
        state.board[targetIndex] = movingValue;
    } else {
        state.board[targetIndex] = pointerDrag.value;
    }

    state.selectedValue = null;
    renderPalette();
    renderBoard();
    recalc();
};

const cleanupPointerDrag = () => {
    stopAutoScroll();

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", cancelPointerDrag);

    if (pointerDrag.overCell) {
        pointerDrag.overCell.classList.remove("drag-over");
    }

    if (pointerDrag.sourceEl) {
        pointerDrag.sourceEl.classList.remove("dragging-source");

        try {
            if (
                pointerDrag.pointerId !== null &&
                pointerDrag.sourceEl.hasPointerCapture(pointerDrag.pointerId)
            ) {
                pointerDrag.sourceEl.releasePointerCapture(pointerDrag.pointerId);
            }
        } catch (err) { }
    }

    if (pointerDrag.ghostEl && pointerDrag.ghostEl.parentNode) {
        pointerDrag.ghostEl.parentNode.removeChild(pointerDrag.ghostEl);
    }

    document.body.classList.remove("is-dragging");

    pointerDrag.active = false;
    pointerDrag.started = false;
    pointerDrag.pointerId = null;
    pointerDrag.startX = 0;
    pointerDrag.startY = 0;
    pointerDrag.currentX = 0;
    pointerDrag.currentY = 0;
    pointerDrag.value = null;
    pointerDrag.from = null;
    pointerDrag.cellIndex = null;
    pointerDrag.sourceEl = null;
    pointerDrag.ghostEl = null;
    pointerDrag.overCell = null;
    pointerDrag.autoScrollFrame = null;
};

const buildGame = () => {
    state.targetCount = getSelectedTargetCount();
    state.targetLevel = state.targetCount - 1; // 2^(targetCount - 1)
    state.target = 2 ** state.targetLevel;
    state.selectedValue = null;
    state.deleteMode = false;
    state.items = createItems(state.targetCount);
    state.board = [];

    for (let i = 0; i < state.rows * state.cols; i++) {
        state.board.push(null);
    }

    lastTapIndex = null;
    lastTapAt = 0;

    deleteModeBtn.classList.remove("active");

    renderPalette();
    renderBoard();
    recalc();

    if (!state.suppressBuildToast) {
        showToast(t("toastBuilt"));
    }
};

const clearBoard = () => {
    for (let i = 0; i < state.board.length; i++) {
        state.board[i] = null;
    }

    lastTapIndex = null;
    lastTapAt = 0;

    renderBoard();
    recalc();
    showToast(t("toastCleared"));
};

const removeCell = (index) => {
    if (state.board[index] === null) return;

    state.board[index] = null;
    renderBoard();
    recalc();
    showToast(t("toastRemoved"));
};

const getBoardTotal = () => {
    let total = 0;

    for (const value of state.board) {
        if (value !== null) {
            total += value;
        }
    }

    return total;
};

const getPlacedCount = () => {
    let count = 0;

    for (const value of state.board) {
        if (value !== null) count++;
    }

    return count;
};

const getValueStats = () => {
    const stats = {};

    for (const value of state.board) {
        if (value !== null) {
            if (!stats[value]) stats[value] = 0;
            stats[value]++;
        }
    }

    return stats;
};

const getPercent = (current, target) => {
    if (target <= 0) return 0;

    const capped = current > target ? target : current;
    return (capped / target) * 100;
};

const renderStats = (stats) => {
    statsListEl.innerHTML = "";

    let hasAny = false;
    const values = getPaletteValues(state.targetCount).reverse();

    for (const value of values) {
        if (stats[value]) {
            hasAny = true;

            const line = document.createElement("div");
            line.className = "mini-line";

            const left = document.createElement("span");
            left.textContent = `${t("statsLinePrefix")}${formatNumber(value)}${t("statsLineMiddle")}${stats[value]}`;

            const right = document.createElement("strong");
            right.textContent = formatNumber(value * stats[value]);

            line.appendChild(left);
            line.appendChild(right);
            statsListEl.appendChild(line);
        }
    }

    if (!hasAny) {
        const empty = document.createElement("div");
        empty.className = "tip";
        empty.textContent = t("statsEmpty");
        statsListEl.appendChild(empty);
    }
};

const recalc = () => {
    state.targetCount = getSelectedTargetCount();
    state.targetLevel = state.targetCount - 1;
    state.target = 2 ** state.targetLevel;

    const target = state.target;
    const current = getBoardTotal();
    const missing = target > current ? target - current : 0;
    const over = current > target ? current - target : 0;
    const percent = getPercent(current, target);
    const placedCount = getPlacedCount();
    const stats = getValueStats();

    targetValueEl.textContent = formatNumber(target);
    targetNoteEl.textContent = t("targetNote");

    currentValueEl.textContent = formatNumber(current);
    placedNoteEl.textContent = `${t("placedNotePrefix")}${placedCount}${t("placedNoteSuffix")}`;

    missingValueEl.textContent = formatNumber(missing);

    if (missing === 0) {
        missingCardEl.classList.remove("missing");
        missingCardEl.classList.add("done");

        if (over > 0) {
            missingNoteEl.textContent = `${t("overPrefix")}${formatNumber(over)}${t("overSuffix")}`;
        } else {
            missingNoteEl.textContent = t("exactDone");
        }

        statusTextEl.textContent = t("done");
    } else {
        missingCardEl.classList.add("missing");
        missingCardEl.classList.remove("done");
        missingNoteEl.textContent = `${t("missingNeedPrefix")}${formatNumber(missing)}${t("missingNeedSuffix")}`;
        statusTextEl.textContent = t("notDone");
    }

    const percentText = Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(".00", "");
    progressTextEl.textContent = `${t("progressPrefix")}${percentText}%`;
    progressBarEl.style.width = `${Math.min(percent, 100)}%`;

    renderStats(stats);
};

const toggleDeleteMode = () => {
    state.deleteMode = !state.deleteMode;

    if (state.deleteMode) {
        state.selectedValue = null;
        deleteModeBtn.classList.add("active");
    } else {
        deleteModeBtn.classList.remove("active");
    }

    renderPalette();
};

const copyResult = () => {
    const target = targetValueEl.textContent;
    const current = currentValueEl.textContent;
    const missing = missingValueEl.textContent;
    const percent = progressTextEl.textContent.replace(t("progressPrefix"), "");
    const status = statusTextEl.textContent;

    const text =
        `${t("copyTitle")}\n` +
        `${t("copyTarget")}${target}\n` +
        `${t("copyCurrent")}${current}\n` +
        `${t("copyMissing")}${missing}\n` +
        `${t("copyProgress")}${percent}\n` +
        `${t("copyStatus")}${status}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast(t("toastCopied"));
            })
            .catch(() => {
                fallbackCopy(text);
            });
    } else {
        fallbackCopy(text);
    }
};

const fallbackCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        document.execCommand("copy");
        showToast(t("toastCopied"));
    } catch (err) {
        showToast(t("toastCopyFailed"));
    }

    document.body.removeChild(textarea);
};

const showToast = (message) => {
    toastEl.textContent = message;
    toastEl.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toastEl.classList.remove("show");
    }, 1500);
};

buildBtn.addEventListener("click", buildGame);
clearBtn.addEventListener("click", clearBoard);
copyBtn.addEventListener("click", copyResult);
deleteModeBtn.addEventListener("click", toggleDeleteMode);

targetSelect.addEventListener("change", () => {
    if (targetSelect.value === "custom") {
        customTargetInput.style.display = "block";
        if (!customTargetInput.value) {
            customTargetInput.value = "14";
        }
    } else {
        customTargetInput.style.display = "none";
    }
    buildGame();
});

customTargetInput.addEventListener("input", buildGame);

languageSelect.addEventListener("change", () => {
    setLanguage(languageSelect.value);
});

// ---------- Strategy guide ----------
const guideFab = document.getElementById("guideFab");
const guideFabLabel = document.getElementById("guideFabLabel");
const guideDialog = document.getElementById("guideDialog");
const guideTitleEl = document.getElementById("guideTitle");
const guideSubEl = document.getElementById("guideSub");
const guideCloseBtn = document.getElementById("guideClose");
const guideBodyEl = document.getElementById("guideBody");

const getGuide = () => {
    if (i18n[currentLang] && i18n[currentLang].guide) return i18n[currentLang].guide;
    if (i18n["zh-Hant"] && i18n["zh-Hant"].guide) return i18n["zh-Hant"].guide;
    return null;
};

const makeEl = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

// "**bold**" segments become <strong>; everything stays as text nodes
const appendRich = (parent, text) => {
    String(text).split("**").forEach((part, index) => {
        if (!part) return;
        if (index % 2 === 1) {
            parent.appendChild(makeEl("strong", "", part));
        } else {
            parent.appendChild(document.createTextNode(part));
        }
    });
};

const makePointList = (points, extraClass) => {
    const list = makeEl("ul", extraClass ? `guide-points ${extraClass}` : "guide-points");

    points.forEach((point) => {
        const item = makeEl("li");
        const text = typeof point === "string" ? point : point.t;
        if (point && point.tone) item.className = point.tone;
        appendRich(item, text);
        list.appendChild(item);
    });

    return list;
};

const makeSection = (title, number) => {
    const section = makeEl("section", "guide-section");
    const heading = makeEl("h3");

    if (number) heading.appendChild(makeEl("span", "guide-num", String(number)));
    heading.appendChild(document.createTextNode(title));
    section.appendChild(heading);

    return section;
};

let guideExtraProvider = null;

const renderGuide = () => {
    const guide = getGuide();

    if (!guide) {
        guideFab.hidden = true;
        return;
    }

    guideFab.hidden = false;
    guideFabLabel.textContent = guide.fab;
    guideFab.setAttribute("aria-label", guide.fabAria);
    guideTitleEl.textContent = guide.title;
    guideSubEl.textContent = guide.subtitle;
    guideCloseBtn.setAttribute("aria-label", guide.close);
    guideBodyEl.innerHTML = "";

    // Active event's own sections (e.g. Bonsai Base) come first, then the shared merge tips
    const eventSections = guideExtraProvider ? (guideExtraProvider(currentLang) || []) : [];

    eventSections.concat(guide.sections).forEach((data, index) => {
        const section = makeSection(data.title, index + 1);
        section.appendChild(makePointList(data.points));

        if (data.boxes && data.boxes.length) {
            const boxes = makeEl("div", "guide-boxes");

            data.boxes.forEach((box) => {
                const boxEl = makeEl("div", "guide-box");
                boxEl.appendChild(makeEl("h4", "", box.title));
                boxEl.appendChild(makePointList(box.points));
                boxes.appendChild(boxEl);
            });

            section.appendChild(boxes);
        }

        if (data.note) {
            const note = makeEl("p", "guide-note");
            appendRich(note, data.note);
            section.appendChild(note);
        }

        guideBodyEl.appendChild(section);
    });

    const summarySection = makeSection(guide.summary.title);
    summarySection.appendChild(makePointList(guide.summary.points, "guide-summary"));
    guideBodyEl.appendChild(summarySection);
};

const openGuide = () => {
    if (guideDialog.open) return;

    renderGuide();
    guideDialog.showModal();
    guideBodyEl.scrollTop = 0;

    // Let the phone's back button close the guide instead of leaving the page
    try {
        history.pushState({ guide: true }, "");
    } catch (error) {
        // history unavailable (e.g. sandboxed frame): the close button and Esc still work
    }
};

const closeGuide = () => {
    if (history.state && history.state.guide) {
        history.back();
    } else if (guideDialog.open) {
        guideDialog.close();
    }
};

guideFab.addEventListener("click", openGuide);
guideCloseBtn.addEventListener("click", closeGuide);

guideDialog.addEventListener("click", (event) => {
    if (event.target === guideDialog) closeGuide();
});

guideDialog.addEventListener("close", () => {
    if (history.state && history.state.guide) history.back();
});

window.addEventListener("popstate", () => {
    if (guideDialog.open) guideDialog.close();
});

// ---------- Public API for event modules (js/app.js, js/events/*) ----------
// Event modules add their own tools around the calculator; they never touch the board or its state.
window.MergeCore = {
    ready: false,
    getLang: () => currentLang,
    t,
    formatNumber,
    showToast,
    setGuideExtra: (provider) => {
        guideExtraProvider = typeof provider === "function" ? provider : null;
        renderGuide();
    }
};

const announceLanguage = () => {
    window.dispatchEvent(new CustomEvent("merge:lang", { detail: { lang: currentLang } }));
};

loadI18n()
    .then(() => {
        applyStaticI18n();

        state.suppressBuildToast = true;
        buildGame();
        state.suppressBuildToast = false;

        window.MergeCore.ready = true;
        announceLanguage();
    })
    .catch((error) => {
        console.error("語系檔載入失敗，請確認檔案路徑與 JSON 格式。", error);

        toastEl.textContent = "語系檔載入失敗";
        toastEl.classList.add("show");
    });
