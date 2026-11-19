// Event shell: picks the active merge event from the URL hash (#island, #bonsai, ...).
// The merge calculator in merge-core.js is shared by every event and is never reset by switching.
// To add an event: add an entry here, a module in js/events/, its data and its i18n file.

const EVENTS = {
    island: { module: null },
    bonsai: { module: "./events/bonsai.js" },
    "game-center": { module: "./events/game-center.js" }
};
const DEFAULT_EVENT = "island";

const nav = document.getElementById("eventNav");
const slot = document.getElementById("eventSlot");

let currentId = null;
let currentUnmount = null;
let switchToken = 0;

const eventFromHash = () => {
    const id = location.hash.replace(/^#/, "");
    return Object.prototype.hasOwnProperty.call(EVENTS, id) ? id : DEFAULT_EVENT;
};

const markNav = (id) => {
    nav.querySelectorAll("a[data-event]").forEach((link) => {
        if (link.dataset.event === id) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
};

const activate = async (id, { scroll }) => {
    if (currentId === id) return;

    const token = ++switchToken;
    const core = window.MergeCore;

    if (currentUnmount) currentUnmount();
    currentUnmount = null;
    currentId = id;

    slot.innerHTML = "";
    slot.hidden = true;
    document.body.dataset.event = id;
    markNav(id);

    const entry = EVENTS[id];

    if (!entry.module) {
        core.setGuideExtra(null);
        return;
    }

    try {
        const mod = await import(entry.module);
        if (token !== switchToken) return;

        const unmount = await mod.mount(slot, core);

        if (token !== switchToken) {
            if (unmount) unmount();
            return;
        }

        currentUnmount = unmount;
        slot.hidden = false;

        if (scroll) {
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            slot.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
    } catch (error) {
        console.error(`Event "${id}" failed to load`, error);
    }
};

const syncNavLabel = () => {
    nav.setAttribute("aria-label", window.MergeCore.t("eventNavLabel"));
};

const start = () => {
    syncNavLabel();
    activate(eventFromHash(), { scroll: false });

    window.addEventListener("merge:lang", syncNavLabel);
    window.addEventListener("hashchange", () => {
        activate(eventFromHash(), { scroll: true });
    });
};

// Sticky title bar: shrink it once the page scrolls (with a gap between the on/off points so it never flickers)
const hero = document.getElementById("hero");
let heroStuck = false;

const syncHero = () => {
    const y = window.scrollY;
    const next = heroStuck ? y > 24 : y > 72;

    if (next !== heroStuck) {
        heroStuck = next;
        hero.classList.toggle("is-stuck", heroStuck);
    }
};

window.addEventListener("scroll", syncHero, { passive: true });
syncHero();

if (window.MergeCore && window.MergeCore.ready) {
    start();
} else {
    window.addEventListener("merge:lang", start, { once: true });
}
