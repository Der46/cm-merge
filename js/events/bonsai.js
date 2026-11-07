// Bonsai Base (盆栽基地): reward lists for the Bonsai Blitz bar and the Merging Mates fish bar.

import { loadJson, barPanel, mountEvent } from "./reward-kit.js";

const BARS = [
    { id: "blitz", titleKey: "blitzTitle", descKey: "blitzDesc", currency: "lotus" },
    { id: "fish", titleKey: "fishTitle", descKey: "fishDesc", currency: "fish" }
];

let cache = null;

const load = async () => {
    if (!cache) {
        const [data, text] = await Promise.all([
            loadJson("./data/events/bonsai.json"),
            loadJson("./i18n/events/bonsai.json")
        ]);
        cache = { data, text };
    }
    return cache;
};

export async function mount(slot, core) {
    const { data, text } = await load();

    return mountEvent({
        slot,
        core,
        text,
        build: (strings) => BARS.map((bar) => barPanel({
            idBase: `bonsai-${bar.id}`,
            currency: bar.currency,
            title: strings[bar.titleKey],
            desc: strings[bar.descKey],
            milestones: data[bar.id].milestones,
            strings,
            core
        }))
    });
}
