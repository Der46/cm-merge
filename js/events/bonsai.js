// Bonsai Base (盆栽基地): progress trackers for the Bonsai Blitz bar and the Merging Mates fish bar.
// The in-game bar shows "level N  x / cost", so the player enters exactly that; totals are derived here.

const DATA_URL = "./data/events/bonsai.json";
const TEXT_URL = "./i18n/events/bonsai.json";
const STORE_KEY = "bonsaiBaseProgress";

const TRACKERS = [
    { id: "blitz", titleKey: "blitzTitle", descKey: "blitzDesc" },
    { id: "fish", titleKey: "fishTitle", descKey: "fishDesc" }
];

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

const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));

const readStore = () => {
    try {
        return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (error) {
        return {};
    }
};

const writeStore = (value) => {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(value));
    } catch (error) {
        // storage blocked (private mode): the tracker still works for this visit
    }
};

const makeEl = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

// level: 1..N is the level being worked on, N + 1 means every reward is collected
const sanitize = (saved, milestones) => {
    const count = milestones.length;
    const level = Math.min(Math.max(parseInt(saved && saved.level, 10) || 1, 1), count + 1);
    const cost = level <= count ? milestones[level - 1].cost : 0;
    const progress = level <= count ? Math.min(Math.max(parseInt(saved && saved.progress, 10) || 0, 0), cost - 1) : 0;
    return { level, progress };
};

const compute = (config, entry) => {
    const milestones = config.milestones;
    const count = milestones.length;
    const prefix = [];
    milestones.reduce((sum, item, index) => (prefix[index] = sum + item.cost), 0);

    const grand = prefix[count - 1];
    const done = entry.level > count;
    const earned = done ? grand : (entry.level > 1 ? prefix[entry.level - 2] : 0) + entry.progress;
    const toGrand = grand - earned;

    return {
        count,
        done,
        collected: entry.level - 1,
        next: done ? null : milestones[entry.level - 1],
        toNext: done ? 0 : milestones[entry.level - 1].cost - entry.progress,
        toGrand,
        minTimes: Math.ceil(toGrand / config.max),
        percent: grand ? (earned / grand) * 100 : 0
    };
};

export async function mount(slot, core) {
    const { data, text } = await load();
    const saved = readStore();
    const state = {};

    TRACKERS.forEach((tracker) => {
        state[tracker.id] = sanitize(saved[tracker.id], data[tracker.id].milestones);
    });

    const tx = () => text[core.getLang()] || text["zh-Hant"];
    const prizeLabel = (prize) => fill(tx().prizes[prize.type] || prize.type, { n: core.formatNumber(prize.n || 0) });

    const buildTracker = (tracker) => {
        const config = data[tracker.id];
        const milestones = config.milestones;
        const strings = tx();
        const entry = state[tracker.id];
        const idBase = `bonsai-${tracker.id}`;

        const panel = makeEl("section", "panel event-panel");
        panel.setAttribute("aria-labelledby", `${idBase}-title`);

        const head = makeEl("div", "panel-head");
        const title = makeEl("h2", "panel-title", strings[tracker.titleKey]);
        title.id = `${idBase}-title`;
        head.appendChild(title);
        head.appendChild(makeEl("p", "panel-desc", strings[tracker.descKey]));
        panel.appendChild(head);

        const body = makeEl("div", "panel-body");

        // Inputs: current level + progress inside it
        const inputs = makeEl("div", "tracker-inputs");

        const levelField = makeEl("div", "field");
        const levelLabel = makeEl("label", "", strings.levelLabel);
        levelLabel.htmlFor = `${idBase}-level`;
        const levelSelect = makeEl("select");
        levelSelect.id = `${idBase}-level`;
        milestones.forEach((item, index) => {
            const option = makeEl("option", "", fill(strings.levelOption, { n: index + 1 }));
            option.value = String(index + 1);
            levelSelect.appendChild(option);
        });
        const doneOption = makeEl("option", "", strings.allDone);
        doneOption.value = String(milestones.length + 1);
        levelSelect.appendChild(doneOption);
        levelSelect.value = String(entry.level);
        levelField.append(levelLabel, levelSelect);

        const progressField = makeEl("div", "field");
        const progressLabel = makeEl("label", "", strings.progressLabel);
        progressLabel.htmlFor = `${idBase}-progress`;
        const progressRow = makeEl("div", "tracker-progress");
        const progressInput = makeEl("input", "tracker-input");
        progressInput.type = "number";
        progressInput.inputMode = "numeric";
        progressInput.min = "0";
        progressInput.id = `${idBase}-progress`;
        progressInput.value = String(entry.progress);
        const ofCost = makeEl("span", "tracker-of");
        progressRow.append(progressInput, ofCost);
        progressField.append(progressLabel, progressRow);

        inputs.append(levelField, progressField);
        body.appendChild(inputs);
        body.appendChild(makeEl("p", "tracker-hint", strings.inputHint));

        // Results
        const results = makeEl("div", "result-list");
        results.setAttribute("aria-live", "polite");

        const makeCard = (label) => {
            const card = makeEl("div", "result-card");
            card.appendChild(makeEl("div", "result-label", label));
            const value = makeEl("div", "result-value");
            const note = makeEl("div", "result-note");
            card.append(value, note);
            results.appendChild(card);
            return { card, value, note };
        };

        const collectedCard = makeCard(strings.collected);
        const nextCard = makeCard(strings.nextReward);
        nextCard.value.classList.add("is-text");
        const grandCard = makeCard(strings.toGrand);
        body.appendChild(results);

        const progressBox = makeEl("div", "progress-box");
        const progressTop = makeEl("div", "progress-top");
        const progressName = makeEl("span", "", strings.overall);
        const progressPct = makeEl("span");
        progressTop.append(progressName, progressPct);
        const track = makeEl("div", "progress-track");
        const bar = makeEl("div", "progress-bar");
        track.appendChild(bar);
        progressBox.append(progressTop, track);
        body.appendChild(progressBox);

        // Milestone grid
        const grid = makeEl("ol", "ms-grid");
        const cells = milestones.map((item, index) => {
            const cell = makeEl("li", "ms");
            const number = makeEl("span", "ms-n", String(index + 1));
            if (index === milestones.length - 1) {
                cell.classList.add("is-grand");
                number.appendChild(makeEl("span", "ms-tag", strings.grand));
            }
            cell.append(
                number,
                makeEl("span", "ms-prize", prizeLabel(item.prize)),
                makeEl("span", "ms-cost", fill(strings.needs, { n: core.formatNumber(item.cost) }))
            );
            grid.appendChild(cell);
            return cell;
        });
        body.appendChild(grid);
        panel.appendChild(body);

        const update = () => {
            const result = compute(config, entry);

            ofCost.textContent = result.done ? "" : `/ ${core.formatNumber(result.next.cost)}`;
            progressInput.disabled = result.done;
            progressInput.max = result.done ? "0" : String(result.next.cost - 1);

            collectedCard.value.textContent = `${result.collected} / ${result.count}`;
            collectedCard.note.textContent = "";

            nextCard.card.classList.toggle("missing", !result.done);
            nextCard.card.classList.toggle("done", result.done);
            nextCard.value.textContent = result.done ? strings.doneAll : prizeLabel(result.next.prize);
            nextCard.note.textContent = result.done ? "" : fill(strings.toNext, { n: core.formatNumber(result.toNext) });

            grandCard.value.textContent = core.formatNumber(result.toGrand);
            grandCard.note.textContent = result.done ? "" : fill(strings.minTimes, { n: core.formatNumber(result.minTimes) });

            const pct = Math.min(result.percent, 100);
            progressPct.textContent = `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
            bar.style.width = `${pct}%`;

            cells.forEach((cell, index) => {
                const level = index + 1;
                cell.classList.toggle("is-done", level < entry.level);
                cell.classList.toggle("is-next", level === entry.level);
                if (level === entry.level) {
                    cell.setAttribute("aria-current", "step");
                } else {
                    cell.removeAttribute("aria-current");
                }
            });
        };

        const save = () => {
            const store = readStore();
            store[tracker.id] = { level: entry.level, progress: entry.progress };
            writeStore(store);
        };

        levelSelect.addEventListener("change", () => {
            Object.assign(entry, sanitize({ level: levelSelect.value, progress: entry.progress }, milestones));
            progressInput.value = String(entry.progress);
            save();
            update();
        });

        progressInput.addEventListener("input", () => {
            Object.assign(entry, sanitize({ level: entry.level, progress: progressInput.value }, milestones));
            save();
            update();
        });

        progressInput.addEventListener("blur", () => {
            progressInput.value = String(entry.progress);
        });

        update();
        return panel;
    };

    const render = () => {
        slot.replaceChildren(...TRACKERS.map(buildTracker));
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
