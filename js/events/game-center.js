// Game Center (遊戲中心): the Game Frenzy main bar (24 levels) and the Game Zone shop
// (4 stands × 4 items bought in order with tetris tokens, plus a bonus for buying all 16).

import { loadJson, barPanel, panelShell, mountEvent, makeEl, fill, icon, prizeArt, prizeLabel } from "./reward-kit.js";

let cache = null;

const load = async () => {
    if (!cache) {
        const [data, text] = await Promise.all([
            loadJson("./data/events/game-center.json"),
            loadJson("./i18n/events/game-center.json")
        ]);
        cache = { data, text };
    }
    return cache;
};

const shopPanel = (shop, strings, core) => {
    const { panel, body } = panelShell({
        idBase: "game-center-shop",
        currency: "tetris",
        title: strings.shopTitle,
        desc: strings.shopDesc
    });

    const grid = makeEl("div", "shop-grid");

    shop.stands.forEach((items, standIndex) => {
        const stand = makeEl("section", "shop-stand");
        const heading = makeEl("h3", "shop-stand-title");
        heading.append(makeEl("span", "ms-n", String(standIndex + 1)), document.createTextNode(fill(strings.stand, { n: standIndex + 1 })));
        stand.appendChild(heading);

        const list = makeEl("ol", "shop-items");
        items.forEach((item) => {
            const row = makeEl("li", "shop-item");
            const cost = makeEl("span", "shop-cost");
            cost.append(icon("tetris", "shop-cost-icon"), document.createTextNode(core.formatNumber(item.cost)));
            row.append(prizeArt(item.prize), makeEl("span", "shop-prize", prizeLabel(item.prize, strings, core)), cost);
            list.appendChild(row);
        });

        stand.appendChild(list);
        grid.appendChild(stand);
    });

    body.appendChild(grid);

    const bonus = makeEl("div", "shop-bonus");
    bonus.append(prizeArt(shop.bonus), makeEl("span", "", `${strings.bonus} ${prizeLabel(shop.bonus, strings, core)}`));
    body.appendChild(bonus);

    return panel;
};

export async function mount(slot, core) {
    const { data, text } = await load();

    return mountEvent({
        slot,
        core,
        text,
        build: (strings) => [
            barPanel({
                idBase: "game-center-frenzy",
                currency: "slotMachine",
                title: strings.barTitle,
                desc: strings.barDesc,
                milestones: data.frenzy.milestones,
                strings,
                core
            }),
            shopPanel(data.shop, strings, core)
        ]
    });
}
