// Shared building blocks for event reward lists: SVG reward art, labels and the milestone grid.
// Icons are static markup drawn after the in-game art (no user data goes into them).

const SVG_NS = "http://www.w3.org/2000/svg";
const SPRITE_ID = "reward-icon-sprite";

const COIN = `
    <circle cx="24" cy="24" r="20" fill="#f5b82e" stroke="#b97f00" stroke-width="3"/>
    <circle cx="24" cy="24" r="14.5" fill="#ffd862"/>
    <path d="M12 17a14 14 0 0 1 9-7" fill="none" stroke="#fff6c7" stroke-width="3" stroke-linecap="round"/>`;

const chest = (lid, body, band, stroke, center) => `
    <path d="M7 22c0-8 7-12 17-12s17 4 17 12z" fill="${lid}" stroke="${stroke}" stroke-width="2"/>
    <rect x="7" y="22" width="34" height="18" rx="3" fill="${body}" stroke="${stroke}" stroke-width="2"/>
    <path d="M7 22h34" stroke="${band}" stroke-width="4"/>
    <path d="M13 11v29M35 11v29" stroke="${band}" stroke-width="3"/>
    ${center}`;

const LOCK = `<rect x="20" y="19" width="8" height="10" rx="2" fill="#ffd45c" stroke="#a96f00" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="1.6" fill="#6b4300"/>`;

const GEM = (color) => `<path d="M24 18l5 5-5 6-5-6z" fill="${color}" stroke="#fff" stroke-width="1.2"/>`;

const ICONS = {
    bamboo: `${COIN}
        <rect x="21" y="12" width="6" height="25" rx="3" fill="#3f9e4b"/>
        <path d="M21 20h6M21 29h6" stroke="#25703a" stroke-width="2"/>
        <path d="M27 17c5-5 10-4 11-1-4 3-8 3-11 1z" fill="#62c46e"/>
        <path d="M21 25c-5-4-9-3-10 0 4 2 7 2 10 0z" fill="#62c46e"/>`,
    spins: `
        <g transform="rotate(14 24 24)">
            <rect x="14" y="11" width="20" height="26" rx="3" fill="#33c3e6" stroke="#167aa3" stroke-width="2"/>
            <rect x="17" y="13" width="4" height="22" rx="2" fill="#bff3ff" opacity="0.85"/>
            <rect x="29" y="13" width="2.5" height="22" rx="1.25" fill="#1d97c4" opacity="0.6"/>
            <path d="M26.5 14.5 19.5 25h5l-2 9 7.5-11.5h-5.2z" fill="#fff" stroke="#9be7fb" stroke-width="0.8" stroke-linejoin="round"/>
            <rect x="11.5" y="4" width="25" height="10" rx="4.5" fill="#a8622c" stroke="#5e3215" stroke-width="2"/>
            <rect x="14" y="5.8" width="17" height="2.6" rx="1.3" fill="#d89356"/>
            <path d="M11.5 11.5h25" stroke="#7a4219" stroke-width="2"/>
            <rect x="11.5" y="34" width="25" height="10" rx="4.5" fill="#a8622c" stroke="#5e3215" stroke-width="2"/>
            <rect x="14" y="38.6" width="17" height="2.6" rx="1.3" fill="#d89356"/>
            <path d="M11.5 36.5h25" stroke="#7a4219" stroke-width="2"/>
        </g>`,
    thor: `
        <circle cx="24" cy="24" r="20" fill="#c45fd8" stroke="#7d2a99" stroke-width="3"/>
        <circle cx="24" cy="24" r="14.5" fill="#e08ef0"/>
        <path d="M12 17a14 14 0 0 1 9-7" fill="none" stroke="#f6d4ff" stroke-width="3" stroke-linecap="round"/>
        <path d="M26.5 10 16 26h7l-2.5 12L32 21h-7.2z" fill="#ffd23f" stroke="#c98a00" stroke-width="1.6" stroke-linejoin="round"/>`,
    monsterChest: chest("#8d4fd0", "#7a3cc0", "#f2b53a", "#4e2380", LOCK),
    halloweenChest: chest("#6a2c91", "#5b2380", "#f28c28", "#3a1257", `
        <circle cx="24" cy="25" r="5.5" fill="#ff9a2e" stroke="#b85a00" stroke-width="1.5"/>
        <path d="M24 19.5v-2.5" stroke="#3f8c2f" stroke-width="2" stroke-linecap="round"/>
        <path d="M21.5 24.5l1.2-1.4 1.3 1.4M24 24.5l1.3-1.4 1.2 1.4M21.8 27.2h4.4" fill="none" stroke="#5a2a00" stroke-width="1.1"/>`),
    rangeChest: chest("#f2b53a", "#e09a1c", "#8a3fc9", "#8a5600", `${GEM("#e2338f")}
        <circle cx="13" cy="31" r="2" fill="#35c3e6"/><circle cx="35" cy="31" r="2" fill="#35c3e6"/>`),
    seasonSmall: chest("#4fb3ea", "#2f8fd0", "#ff7cc6", "#1d5f96", `${GEM("#ffd23f")}`),
    seasonLarge: chest("#7a6be0", "#5b4cc9", "#ffd23f", "#33278f", `${GEM("#ff7cc6")}
        <path d="M16 15l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4zM32 15l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" fill="#fff6c7"/>`),
    seasonGold: chest("#ffd04a", "#f2b53a", "#c2389a", "#946000", `${GEM("#8a3fc9")}`),
    smallThorBox: `
        <path d="M8 18l16-7 16 7-16 7z" fill="#7da2c8" stroke="#3d5f86" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 18v16l16 8V25z" fill="#5b80a8" stroke="#3d5f86" stroke-width="2" stroke-linejoin="round"/>
        <path d="M40 18v16l-16 8V25z" fill="#4a6d93" stroke="#3d5f86" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 18l16 7 16-7" fill="none" stroke="#f2b53a" stroke-width="2.5"/>
        <path d="M24 25v17" stroke="#f2b53a" stroke-width="2.5"/>
        <circle cx="31" cy="31" r="4.5" fill="#c45fd8" stroke="#f2b53a" stroke-width="1.5"/>
        <path d="M31.8 27.6 29 31.6h2l-.7 3.2 3-4.4h-2z" fill="#ffd23f"/>`,
    largeThorBox: `
        <path d="M5 17l19-8 19 8-19 8z" fill="#ffd04a" stroke="#946000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M5 17v18l19 9V25z" fill="#f2b53a" stroke="#946000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M43 17v18l-19 9V25z" fill="#d99100" stroke="#946000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M5 17l19 8 19-8M24 25v19" fill="none" stroke="#c2389a" stroke-width="2.5"/>
        <circle cx="33" cy="32" r="5.5" fill="#c45fd8" stroke="#fff" stroke-width="1.5"/>
        <path d="M34 28l-3.6 5h2.5l-.9 4 3.8-5.4h-2.5z" fill="#ffd23f"/>
        <circle cx="14" cy="32" r="4" fill="#c45fd8" stroke="#fff" stroke-width="1.2"/>
        <path d="M14.7 29.2l-2.6 3.6h1.8l-.6 2.8 2.7-3.9h-1.8z" fill="#ffd23f"/>`,
    flowerBox: `
        <rect x="8" y="22" width="32" height="18" rx="3" fill="#d6405f" stroke="#8f1f3a" stroke-width="2"/>
        <rect x="6" y="18" width="36" height="7" rx="2.5" fill="#e85a77" stroke="#8f1f3a" stroke-width="2"/>
        <path d="M24 18v22" stroke="#ffd45c" stroke-width="3"/>
        <g fill="#ffb3cd" stroke="#e46a95" stroke-width="1">
            <circle cx="14" cy="15" r="4.5"/><circle cx="24" cy="12" r="5"/><circle cx="34" cy="15" r="4.5"/>
            <circle cx="19" cy="17" r="3.5"/><circle cx="29" cy="17" r="3.5"/>
        </g>
        <g fill="#ffe17a"><circle cx="14" cy="15" r="1.5"/><circle cx="24" cy="12" r="1.7"/><circle cx="34" cy="15" r="1.5"/></g>`,
    tetris: `
        <rect x="9" y="9" width="30" height="30" rx="7" transform="rotate(45 24 24)" fill="#4e7ff0" stroke="#e8f0ff" stroke-width="3"/>
        <rect x="11.5" y="11.5" width="25" height="25" rx="5" transform="rotate(45 24 24)" fill="#3a62d6"/>
        <g fill="#7ff0ff" stroke="#1d9bc4" stroke-width="0.8">
            <rect x="17" y="20" width="5" height="5" rx="1"/><rect x="22" y="20" width="5" height="5" rx="1"/>
            <rect x="27" y="20" width="5" height="5" rx="1"/><rect x="22" y="25" width="5" height="5" rx="1"/>
        </g>`,
    coinFrenzy: `
        <path d="M19 6h10v9c7 2.5 11 8 11 14 0 8.5-7 14-16 14S8 37.5 8 29c0-6 4-11.5 11-14z" fill="#d8f3ff" stroke="#7aaecb" stroke-width="2" opacity="0.95"/>
        <rect x="18" y="4" width="12" height="5" rx="2" fill="#a8622c" stroke="#5e3215" stroke-width="1.5"/>
        <path d="M10.5 28c3 2 7 3 13.5 3s10.5-1 13.5-3c.3 7-5.6 12.5-13.5 12.5S10.2 35 10.5 28z" fill="#ffc83d"/>
        <circle cx="24" cy="30" r="7" fill="#f5b82e" stroke="#b97f00" stroke-width="2"/>
        <path d="M24 26v8M21.5 27.5h4a1.6 1.6 0 0 1 0 3.2h-3a1.6 1.6 0 0 0 0 3.2h4" fill="none" stroke="#8a5600" stroke-width="1.4" stroke-linecap="round"/>`,
    goldCard: `
        <rect x="11" y="6" width="26" height="36" rx="4" fill="#ffd04a" stroke="#946000" stroke-width="2.5"/>
        <rect x="15" y="10" width="18" height="28" rx="2.5" fill="#ffe791"/>
        <path d="M24 15l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#f2a500" stroke="#946000" stroke-width="1"/>`,
    diamondCard: `
        <rect x="11" y="6" width="26" height="36" rx="4" fill="#7fd8ff" stroke="#1d6fa8" stroke-width="2.5"/>
        <rect x="15" y="10" width="18" height="28" rx="2.5" fill="#d9f5ff"/>
        <path d="M18 20l3-4h6l3 4-6 9z" fill="#4fb3ea" stroke="#1d6fa8" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M18 20h12M21 16l3 13 3-13" fill="none" stroke="#1d6fa8" stroke-width="0.9"/>`,
    lotus: `
        <path d="M24 3l13 5 7 12-2 14-11 10H17L6 34 4 20l7-12z" fill="#b82f86" stroke="#e6a93a" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M24 12c4 5 4 13 0 20-4-7-4-15 0-20z" fill="#ff9fd6"/>
        <path d="M24 32c-6 0-11-4-12-11 6 0 10 4 12 11zM24 32c6 0 11-4 12-11-6 0-10 4-12 11z" fill="#ff7cc6"/>
        <path d="M24 33c-7 1-12-1-14-5 5-2 10-1 14 5zM24 33c7 1 12-1 14-5-5-2-10-1-14 5z" fill="#f45bb2"/>`,
    fish: `
        <circle cx="24" cy="24" r="20" fill="#4fb3ea" stroke="#1d78b3" stroke-width="2.5"/>
        <path d="M36 24l7-6v12z" fill="#f08a1c" stroke="#b85a00" stroke-width="1.5" stroke-linejoin="round"/>
        <ellipse cx="24" cy="24" rx="13" ry="9" fill="#ffa62b" stroke="#b85a00" stroke-width="1.5"/>
        <path d="M22 15c3-3 7-3 9 0z" fill="#f08a1c"/>
        <path d="M27 20c2 2 2 6 0 8" fill="none" stroke="#d9740f" stroke-width="1.5"/>
        <circle cx="17" cy="22" r="2.6" fill="#fff"/><circle cx="16.6" cy="22" r="1.4" fill="#1d2b3a"/>`,
    slotMachine: `
        <rect x="7" y="9" width="30" height="34" rx="5" fill="#2f3f86" stroke="#f2b53a" stroke-width="2.5"/>
        <rect x="10" y="5" width="24" height="7" rx="3" fill="#f2b53a" stroke="#946000" stroke-width="1.5"/>
        <rect x="11" y="16" width="22" height="13" rx="2" fill="#fff"/>
        <path d="M18.3 16v13M25.6 16v13" stroke="#c9d3ea" stroke-width="1"/>
        <g fill="#e2335a" font-family="Arial, sans-serif" font-weight="900" font-size="9" text-anchor="middle">
            <text x="14.7" y="26">7</text><text x="22" y="26">7</text><text x="29.3" y="26">7</text>
        </g>
        <rect x="12" y="33" width="20" height="5" rx="2" fill="#1d2a5e"/>
        <path d="M40 14v14" stroke="#9aa9bd" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="40" cy="12" r="3.2" fill="#e2335a" stroke="#8f1f3a" stroke-width="1.2"/>`
};

export const makeEl = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

export const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));

export const loadJson = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${url}`);
    return response.json();
};

export const ensureSprite = () => {
    if (document.getElementById(SPRITE_ID)) return;

    const sprite = document.createElementNS(SVG_NS, "svg");
    sprite.id = SPRITE_ID;
    sprite.setAttribute("aria-hidden", "true");
    sprite.style.display = "none";
    sprite.innerHTML = Object.entries(ICONS)
        .map(([name, body]) => `<symbol id="reward-ico-${name}" viewBox="0 0 48 48">${body}</symbol>`)
        .join("");
    document.body.appendChild(sprite);
};

export const icon = (name, className) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#reward-ico-${ICONS[name] ? name : "spins"}`);
    svg.appendChild(use);
    return svg;
};

// Thor tokens show one icon per token (as in the game charts), capped at 4
export const prizeArt = (prize) => {
    const art = makeEl("span", "ms-art");
    const copies = prize.type === "thor" ? Math.min(Math.max(prize.n || 1, 1), 4) : 1;
    if (copies > 1) art.classList.add(`is-x${copies}`);
    for (let i = 0; i < copies; i++) art.appendChild(icon(prize.type, "ms-icon"));
    return art;
};

export const prizeLabel = (prize, strings, core) => {
    const vars = { ...prize, n: core.formatNumber(prize.n || 0) };
    let label = fill(strings.prizes[prize.type] || prize.type, vars);
    if (prize.cards && strings.cardsSuffix) label += fill(strings.cardsSuffix, vars);
    return label;
};

export const panelShell = ({ idBase, currency, title, desc }) => {
    const panel = makeEl("section", "panel event-panel");
    panel.setAttribute("aria-labelledby", `${idBase}-title`);

    const head = makeEl("div", "panel-head event-head");
    head.appendChild(icon(currency, "event-currency"));
    const headText = makeEl("div");
    const heading = makeEl("h2", "panel-title", title);
    heading.id = `${idBase}-title`;
    headText.append(heading, makeEl("p", "panel-desc", desc));
    head.appendChild(headText);
    panel.appendChild(head);

    const body = makeEl("div", "panel-body");
    panel.appendChild(body);
    return { panel, body };
};

// A milestone bar: per-level cost, prize art and running total; the last level is the grand prize
export const barPanel = ({ idBase, currency, title, desc, milestones, strings, core }) => {
    const { panel, body } = panelShell({ idBase, currency, title, desc });
    const grid = makeEl("ol", "ms-grid");
    let total = 0;

    milestones.forEach((item, index) => {
        total += item.cost;
        const isGrand = index === milestones.length - 1;
        const cell = makeEl("li", isGrand ? "ms is-grand" : "ms");

        const top = makeEl("span", "ms-top");
        top.appendChild(makeEl("span", "ms-n", String(index + 1)));
        if (isGrand) top.appendChild(makeEl("span", "ms-tag", strings.grand));

        cell.append(
            top,
            prizeArt(item.prize),
            makeEl("span", "ms-prize", prizeLabel(item.prize, strings, core)),
            makeEl("span", "ms-cost", fill(strings.needs, { n: core.formatNumber(item.cost) })),
            makeEl("span", "ms-total", fill(strings.total, { n: core.formatNumber(total) }))
        );
        grid.appendChild(cell);
    });

    body.appendChild(grid);
    return panel;
};

// Mount helper shared by events: renders on load and on language change, adds the event's guide sections
export const mountEvent = ({ slot, core, text, build }) => {
    ensureSprite();

    const strings = () => text[core.getLang()] || text["zh-Hant"];
    const render = () => slot.replaceChildren(...build(strings()));
    const onLang = () => render();

    core.setGuideExtra((lang) => (text[lang] || text["zh-Hant"]).guide);
    window.addEventListener("merge:lang", onLang);
    render();

    return () => {
        window.removeEventListener("merge:lang", onLang);
        core.setGuideExtra(null);
        slot.replaceChildren();
    };
};
