// Shared pure helpers for catalog/cart scripts.
// Loaded before app.js.

const PRODUCT_EMOJI_ENTRIES = Object.entries(PRODUCT_EMOJIS);
const UNIT_KG = "\u043a\u0433";
const UNIT_PC = "\u0448\u0442";
const DEFAULT_PRODUCT_EMOJI = "??";

function formatPrice(price) {
    return Number(price || 0).toLocaleString("ru-KZ") + " \u20b8";
}

function normalizeUnit(rawUnit) {
    const unit = String(rawUnit || "").trim().toLowerCase();
    if (!unit) return "";
    if (unit.includes(UNIT_KG) || unit.includes("kg")) return UNIT_KG;
    if (unit.includes(UNIT_PC) || unit.includes("pcs") || unit.includes("pc")) return UNIT_PC;
    return unit;
}

function inferUnitFromName(name) {
    const normalizedName = String(name || "").toLowerCase();
    if (normalizedName.includes(`(${UNIT_PC}`) || normalizedName.includes(` ${UNIT_PC}`)) return UNIT_PC;
    if (normalizedName.includes(`(${UNIT_KG}`) || normalizedName.includes(` ${UNIT_KG}`)) return UNIT_KG;
    return UNIT_PC;
}

function getProductUnit(product) {
    return normalizeUnit(product?.unit) || inferUnitFromName(product?.name);
}

function getProductEmoji(name, explicitEmoji) {
    if (explicitEmoji && String(explicitEmoji).trim()) return String(explicitEmoji).trim();
    const lower = String(name || "").toLowerCase();
    for (const [key, emoji] of PRODUCT_EMOJI_ENTRIES) {
        if (lower.includes(key)) return emoji;
    }
    return DEFAULT_PRODUCT_EMOJI;
}

function parseAvailabilityValue(rawValue) {
    const value = String(rawValue || "").trim().toLowerCase();
    if (!value) return true;

    const falseValues = [
        "out of stock",
        "unavailable",
        "not available",
        "\u043d\u0435\u0442 \u0432 \u043d\u0430\u043b\u0438\u0447\u0438\u0438",
        "\u043d\u0435\u0442",
        "no",
        "false",
        "0",
    ];
    if (falseValues.some((marker) => value.includes(marker))) return false;

    const trueValues = [
        "in stock",
        "available",
        "\u0432 \u043d\u0430\u043b\u0438\u0447\u0438\u0438",
        "\u0434\u0430",
        "yes",
        "true",
        "1",
    ];
    if (trueValues.some((marker) => value.includes(marker))) return true;

    return true;
}

function parseSaleValue(rawValue) {
    const value = String(rawValue || "").trim().toLowerCase();
    if (!value) return false;

    const truthy = ["yes", "true", "1", "sale", "\u0430\u043a\u0446\u0438\u044f", "promo", "promotion"];
    if (truthy.includes(value)) return true;

    const falsy = ["no", "false", "0", "-", "none"];
    if (falsy.includes(value)) return false;

    return false;
}

function parseCSVLine(line) {
    const result = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (ch === "," && !inQuotes) {
            result.push(cur);
            cur = "";
            continue;
        }

        cur += ch;
    }

    result.push(cur);
    return result;
}
