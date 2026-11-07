// Bonsai Base (盆栽基地): reward lists for the Bonsai Blitz bar and the Merging Mates fish bar.
// Read-only: every level shows its reward (drawn as SVG), its cost and the running total.

const DATA_URL = "./data/events/bonsai.json";
const TEXT_URL = "./i18n/events/bonsai.json";
const SPRITE_ID = "bonsai-icon-sprite";

const BARS = [
    { id: "blitz", titleKey: "blitzTitle", descKey: "blitzDesc", currency: "lotus" },
    { id: "fish", titleKey: "fishTitle", descKey: "fishDesc", currency: "fish" }
];

// Hand-drawn icons, styled after the in-game art. Static markup only (no user data).
const COIN = `
    <circle cx="24" cy="24" r="20" fill="#f5b82e" stroke="#b97f00" stroke-width="3"/>
    <circle cx="24" cy="24" r="14.5" fill="#ffd862"/>
    <path d="M12 17a14 14 0 0 1 9-7" fill="none" stroke="#fff6c7" stroke-width="3" stroke-linecap="round"/>`;

const ICONS = {
    bamboo: `${COIN}
        <rect x="21" y="12" width="6" height="25" rx="3" fill="#3f9e4b"/>
        <path d="M21 20h6M21 29h6" stroke="#25703a" stroke-width="2"/>
        <path d="M27 17c5-5 10-4 11-1-4 3-8 3-11 1z" fill="#62c46e"/>
        <path d="M21 25c-5-4-9-3-10 0 4 2 7 2 10 0z" fill="#62c46e"/>`,
    spins: `${COIN}
        <path d="M31 21a8 8 0 1 0 1 6" fill="none" stroke="#a5660a" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M33 14v8h-8z" fill="#a5660a"/>`,
    thor: `
        <circle cx="24" cy="24" r="20" fill="#c45fd8" stroke="#7d2a99" stroke-width="3"/>
        <circle cx="24" cy="24" r="14.5" fill="#e08ef0"/>
        <path d="M12 17a14 14 0 0 1 9-7" fill="none" stroke="#f6d4ff" stroke-width="3" stroke-linecap="round"/>
        <path d="M26.5 10 16 26h7l-2.5 12L32 21h-7.2z" fill="#ffd23f" stroke="#c98a00" stroke-width="1.6" stroke-linejoin="round"/>`,
    monsterChest: `
        <path d="M7 22c0-8 7-12 17-12s17 4 17 12z" fill="#8d4fd0" stroke="#4e2380" stroke-width="2"/>
        <rect x="7" y="22" width="34" height="18" rx="3" fill="#7a3cc0" stroke="#4e2380" stroke-width="2"/>
        <path d="M7 22h34" stroke="#f2b53a" stroke-width="4"/>
        <path d="M13 11v29M35 11v29" stroke="#f2b53a" stroke-width="3"/>
        <rect x="20" y="19" width="8" height="10" rx="2" fill="#ffd45c" stroke="#a96f00" stroke-width="1.5"/>
        <circle cx="24" cy="24" r="1.6" fill="#6b4300"/>`,
    halloweenChest: `
        <path d="M7 22c0-8 7-12 17-12s17 4 17 12z" fill="#6a2c91" stroke="#3a1257" stroke-width="2"/>
        <rect x="7" y="22" width="34" height="18" rx="3" fill="#5b2380" stroke="#3a1257" stroke-width="2"/>
        <path d="M7 22h34" stroke="#f28c28" stroke-width="4"/>
        <path d="M13 11v29M35 11v29" stroke="#f28c28" stroke-width="3"/>
        <circle cx="24" cy="25" r="5.5" fill="#ff9a2e" stroke="#b85a00" stroke-width="1.5"/>
        <path d="M24 19.5v-2.5" stroke="#3f8c2f" stroke-width="2" stroke-linecap="round"/>
        <path d="M21.5 24.5l1.2-1.4 1.3 1.4M24 24.5l1.3-1.4 1.2 1.4M21.8 27.2h4.4" fill="none" stroke="#5a2a00" stroke-width="1.1"/>`,
    smallThorBox: `
        <path d="M8 18l16-7 16 7-16 7z" fill="#7da2c8" stroke="#3d5f86" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 18v16l16 8V25z" fill="#5b80a8" stroke="#3d5f86" stroke-width="2" stroke-linejoin="round"/>
        <path d="M40 18v16l-16 8V25z" fill="#4a6d93" stroke="#3d5f86" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 18l16 7 16-7" fill="none" stroke="#f2b53a" stroke-width="2.5"/>
        <path d="M24 25v17" stroke="#f2b53a" stroke-width="2.5"/>
        <circle cx="31" cy="31" r="4.5" fill="#c45fd8" stroke="#f2b53a" stroke-width="1.5"/>
        <path d="M31.8 27.6 29 31.6h2l-.7 3.2 3-4.4h-2z" fill="#ffd23f"/>`,
    flowerBox: `
        <rect x="8" y="22" width="32" height="18" rx="3" fill="#d6405f" stroke="#8f1f3a" stroke-width="2"/>
        <rect x="6" y="18" width="36" height="7" rx="2.5" fill="#e85a77" stroke="#8f1f3a" stroke-width="2"/>
        <path d="M24 18v22" stroke="#ffd45c" stroke-width="3"/>
        <g fill="#ffb3cd" stroke="#e46a95" stroke-width="1">
            <circle cx="14" cy="15" r="4.5"/><circle cx="24" cy="12" r="5"/><circle cx="34" cy="15" r="4.5"/>
            <circle cx="19" cy="17" r="3.5"/><circle cx="29" cy="17" r="3.5"/>
        </g>
        <g fill="#ffe17a"><circle cx="14" cy="15" r="1.5"/><circle cx="24" cy="12" r="1.7"/><circle cx="34" cy="15" r="1.5"/></g>`,
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
        <circle cx="17" cy="22" r="2.6" fill="#fff"/><circle cx="16.6" cy="22" r="1.4" fill="#1d2b3a"/>`
};

let cache = null;

const loadJson = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${url}`);
    return response.json();
};

const load = async () => {
    if (!cache) {
        const [data, text] = await Promise.all([loadJson(DATA_URL), loadJson(TEXT_URL)]);
        cache = { data, text };
    }
    return cache;
};

const SVG_NS = "http://www.w3.org/2000/svg";

const ensureSprite = () => {
    if (document.getElementById(SPRITE_ID)) return;

    const sprite = document.createElementNS(SVG_NS, "svg");
    sprite.id = SPRITE_ID;
    sprite.setAttribute("aria-hidden", "true");
    sprite.style.display = "none";
    sprite.innerHTML = Object.entries(ICONS)
        .map(([name, body]) => `<symbol id="bonsai-ico-${name}" viewBox="0 0 48 48">${body}</symbol>`)
        .join("");
    document.body.appendChild(sprite);
};

const icon = (name, className) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#bonsai-ico-${ICONS[name] ? name : "bamboo"}`);
    svg.appendChild(use);
    return svg;
};

const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));

const makeEl = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

// Thor tokens show one icon per token (as in the game chart), capped at 4
const prizeArt = (prize) => {
    const art = makeEl("span", "ms-art");
    const copies = prize.type === "thor" ? Math.min(Math.max(prize.n || 1, 1), 4) : 1;
    if (copies > 1) art.classList.add(`is-x${copies}`);
    for (let i = 0; i < copies; i++) art.appendChild(icon(prize.type, "ms-icon"));
    return art;
};

export async function mount(slot, core) {
    const { data, text } = await load();
    ensureSprite();

    const tx = () => text[core.getLang()] || text["zh-Hant"];
    const prizeLabel = (prize) => fill(tx().prizes[prize.type] || prize.type, { n: core.formatNumber(prize.n || 0) });

    const buildBar = (bar) => {
        const strings = tx();
        const milestones = data[bar.id].milestones;
        const idBase = `bonsai-${bar.id}`;

        const panel = makeEl("section", "panel event-panel");
        panel.setAttribute("aria-labelledby", `${idBase}-title`);

        const head = makeEl("div", "panel-head event-head");
        head.appendChild(icon(bar.currency, "event-currency"));
        const headText = makeEl("div");
        const title = makeEl("h2", "panel-title", strings[bar.titleKey]);
        title.id = `${idBase}-title`;
        headText.append(title, makeEl("p", "panel-desc", strings[bar.descKey]));
        head.appendChild(headText);
        panel.appendChild(head);

        const body = makeEl("div", "panel-body");
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
                makeEl("span", "ms-prize", prizeLabel(item.prize)),
                makeEl("span", "ms-cost", fill(strings.needs, { n: core.formatNumber(item.cost) })),
                makeEl("span", "ms-total", fill(strings.total, { n: core.formatNumber(total) }))
            );
            grid.appendChild(cell);
        });

        body.appendChild(grid);
        panel.appendChild(body);
        return panel;
    };

    const render = () => {
        slot.replaceChildren(...BARS.map(buildBar));
    };

    const onLang = () => {
        render();
    };

    core.setGuideExtra((lang) => (text[lang] || text["zh-Hant"]).guide);
    window.addEventListener("merge:lang", onLang);
    render();

    return () => {
        window.removeEventListener("merge:lang", onLang);
        core.setGuideExtra(null);
        slot.replaceChildren();
    };
}
