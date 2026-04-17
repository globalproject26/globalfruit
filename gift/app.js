const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRu5mT2Sp-4h6s0zgAr01ptQRPW61pVd_KH3II2Put7sQvmWwWDPPUzA3FtBBjrq8P5eMzGYdTS63Ok/pub?gid=0&single=true&output=csv";
const WA_PHONE = "77780878211";
const SITE_PATH = "/gift";
const CART_KEY = "globalfruit_gift_cart_v1";

const DRIVE_IMAGE_MAP = {
    "101a": "1WokQWQGrccF_C7nCXQlrV1KuZoPM0e5S",
    "101b": "1tSALY3hQbU862fzGrmiqNAY3SFup5o3H",
    "102a": "1ERRBIUF5109nBtF47wFbTuH722GOo6iT",
    "102b": "1gGwHMOfTPC0DoEBunYRtDb9je-Pq56X3",
    "103a": "1CXFZ4lzfJf7rXUp-PVMGyd7-0Nc96gQv",
    "103b": "10DnWV96aWaD5IHsVYs8gWEpVCP94-x53"
};

const IMAGE_SUFFIXES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const catalogList = document.getElementById("catalog-list");
const catalogStatus = document.getElementById("catalog-status");
const cartFab = document.getElementById("cart-fab");
const cartFabMeta = document.getElementById("cart-fab-meta");
const cartSheet = document.getElementById("cart-sheet");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartClose = document.getElementById("cart-close");
const cartEmpty = document.getElementById("cart-empty");
const cartItems = document.getElementById("cart-items");
const cartTotalPrice = document.getElementById("cart-total-price");
const cartWhatsApp = document.getElementById("cart-whatsapp");

let products = [];
let cart = {};

function isFileProtocol() {
    return window.location.protocol === "file:";
}

function driveImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

function cleanText(value) {
    return String(value || "").trim();
}

function normalizePrice(value) {
    const digits = cleanText(value).replace(/[^\d]/g, "");
    if (!digits) {
        return 0;
    }

    return Number(digits);
}

function formatPrice(value) {
    return `${new Intl.NumberFormat("ru-RU").format(value)} ₸`;
}

function splitComposition(value) {
    return cleanText(value)
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeSize(value, fallbackPrice) {
    const raw = cleanText(value).toLowerCase();
    if (raw) {
        if (raw.includes("мини") || raw.includes("mini")) return "мини";
        if (raw.includes("сред")) return "средняя";
        if (raw.includes("больш")) return "большая";
        return raw;
    }

    if (fallbackPrice <= 16000) return "мини";
    if (fallbackPrice <= 28000) return "средняя";
    return "большая";
}

function parseCsvLine(line) {
    const cells = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === "\"") {
            if (inQuotes && nextChar === "\"") {
                current += "\"";
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            cells.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    cells.push(current);
    return cells;
}

function parseCsv(text) {
    const rows = [];
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
    if (!lines.length) {
        return rows;
    }

    const headers = parseCsvLine(lines[0]).map((header) => cleanText(header));

    for (let index = 1; index < lines.length; index += 1) {
        const values = parseCsvLine(lines[index]);
        const row = {};
        headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] || "";
        });
        rows.push(row);
    }

    return rows;
}

function buildImages(row) {
    const directIds = cleanText(row.image_ids);
    if (directIds) {
        return directIds
            .split(/[|,]/)
            .map((item) => cleanText(item))
            .filter(Boolean)
            .map((fileId, index) => ({
                id: `${row.id}-${index + 1}`,
                src: driveImageUrl(fileId)
            }));
    }

    const directUrls = cleanText(row.image_urls);
    if (directUrls) {
        return directUrls
            .split(/[|,]/)
            .map((item) => cleanText(item))
            .filter(Boolean)
            .map((src, index) => ({
                id: `${row.id}-${index + 1}`,
                src
            }));
    }

    return IMAGE_SUFFIXES
        .map((suffix) => {
            const imageId = DRIVE_IMAGE_MAP[`${row.id}${suffix}`];
            if (!imageId) return null;

            return {
                id: `${row.id}${suffix}`,
                src: driveImageUrl(imageId)
            };
        })
        .filter(Boolean);
}

function mapRowToProduct(row) {
    const price = normalizePrice(row.price);
    return {
        id: cleanText(row.id),
        name: cleanText(row.name) || `Корзина ${cleanText(row.id)}`,
        price,
        size: normalizeSize(row.size, price),
        description: cleanText(row.opisanie || row.description),
        composition: splitComposition(row.sostav || row.composition),
        images: buildImages(row)
    };
}

function getCartQuantity(productId) {
    return Number(cart[productId] || 0);
}

function saveCart() {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
        console.warn("[GlobalFruit Gift] cart save error", error);
    }
}

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
            cart = parsed;
        }
    } catch (error) {
        console.warn("[GlobalFruit Gift] cart load error", error);
    }
}

function createCard(product) {
    const quantity = getCartQuantity(product.id);
    const article = document.createElement("article");
    article.className = "product-card";
    article.dataset.productId = product.id;

    article.innerHTML = `
        <div class="product-card__media">
            <span class="product-card__size">${product.size}</span>
            <img class="product-card__image" src="${product.images[0]?.src || ""}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-card__body">
            <div class="product-card__head">
                <div>
                    <p class="product-card__number">${product.id}</p>
                    <h2 class="product-card__title">${product.name}</h2>
                </div>
                <p class="product-card__price">${formatPrice(product.price)}</p>
            </div>

            <ul class="product-card__composition">
                ${product.composition.map((item) => `<li>${item}</li>`).join("")}
            </ul>

            ${product.description ? `<p class="product-card__description">${product.description}</p>` : ""}

            <div class="product-card__footer">
                <div class="qty-control" data-qty-control="${product.id}">
                    <button class="qty-control__button" type="button" data-action="minus" data-product-id="${product.id}">−</button>
                    <span class="qty-control__value" data-qty-value="${product.id}">${quantity}</span>
                    <button class="qty-control__button" type="button" data-action="plus" data-product-id="${product.id}">+</button>
                </div>
                <button class="product-card__cta" type="button" data-add-product-id="${product.id}">Добавить</button>
            </div>
        </div>
    `;

    return article;
}

function renderCatalog(items) {
    catalogList.innerHTML = "";
    const fragment = document.createDocumentFragment();
    items.forEach((product) => fragment.appendChild(createCard(product)));
    catalogList.appendChild(fragment);
}

function getCartEntries() {
    return Object.entries(cart)
        .map(([id, qty]) => {
            const product = products.find((item) => item.id === id);
            if (!product || qty <= 0) return null;
            return { ...product, qty };
        })
        .filter(Boolean);
}

function buildOrderText(entries) {
    const lines = ["Здравствуйте! Хочу оформить заказ.", "", `Сайт: ${SITE_PATH}`, ""];

    entries.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.name}`);
        lines.push(`Размер: ${item.size}`);
        lines.push(`Количество: ${item.qty}`);
        lines.push(`Состав: ${item.composition.join(", ")}`);
        lines.push("");
    });

    const total = entries.reduce((sum, item) => sum + item.price * item.qty, 0);
    lines.push(`Итого: ${formatPrice(total)}`);
    return lines.join("\n");
}

function renderCart() {
    const entries = getCartEntries();
    const totalCount = entries.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = entries.reduce((sum, item) => sum + item.price * item.qty, 0);

    cartFab.classList.toggle("is-hidden", totalCount === 0);
    cartFabMeta.textContent = totalCount > 0 ? `${totalCount} · ${formatPrice(totalPrice)}` : "0";
    cartEmpty.classList.toggle("is-hidden", entries.length > 0);

    cartItems.innerHTML = entries.map((item) => `
        <article class="cart-item">
            <div class="cart-item__top">
                <div>
                    <p class="cart-item__name">${item.name}</p>
                    <p class="cart-item__size">Размер: ${item.size}</p>
                    <p class="cart-item__composition">Состав: ${item.composition.join(", ")}</p>
                </div>
                <span class="cart-item__price">${formatPrice(item.price * item.qty)}</span>
            </div>
            <div class="cart-item__actions">
                <div class="qty-control">
                    <button class="qty-control__button" type="button" data-action="minus" data-product-id="${item.id}">−</button>
                    <span class="qty-control__value">${item.qty}</span>
                    <button class="qty-control__button" type="button" data-action="plus" data-product-id="${item.id}">+</button>
                </div>
            </div>
        </article>
    `).join("");

    cartTotalPrice.textContent = formatPrice(totalPrice);
    cartWhatsApp.href = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(buildOrderText(entries))}`;

    document.querySelectorAll("[data-qty-value]").forEach((node) => {
        const { qtyValue } = node.dataset;
        node.textContent = getCartQuantity(qtyValue);
    });
}

function updateProductQuantity(productId, delta) {
    const nextValue = Math.max(0, getCartQuantity(productId) + delta);
    if (nextValue === 0) {
        delete cart[productId];
    } else {
        cart[productId] = nextValue;
    }
    saveCart();
    renderCart();
}

function openCart() {
    cartSheet.classList.add("is-open");
    cartSheet.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
}

function closeCart() {
    cartSheet.classList.remove("is-open");
    cartSheet.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
}

function setStatus(message, hidden = false) {
    catalogStatus.textContent = message;
    catalogStatus.classList.toggle("is-hidden", hidden);
}

async function loadCatalog() {
    if (isFileProtocol()) {
        setStatus("Для локальной проверки откройте страницу через start-local.cmd или локальный сервер, а не напрямую как файл.");
        return;
    }

    try {
        setStatus("Загружаю корзины...");
        const response = await fetch(CSV_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`CSV request failed with ${response.status}`);
        }

        const text = await response.text();
        products = parseCsv(text)
            .map(mapRowToProduct)
            .filter((item) => item.id && item.name && item.images.length);

        renderCatalog(products);
        renderCart();
        setStatus("", true);
    } catch (error) {
        console.error("[GlobalFruit Gift] Catalog load error:", error);
        setStatus("Не получилось загрузить каталог. Для локальной проверки используйте start-local.cmd или локальный сервер.");
    }
}

function setupEvents() {
    document.addEventListener("click", (event) => {
        const qtyButton = event.target.closest("[data-action][data-product-id]");
        if (qtyButton) {
            const delta = qtyButton.dataset.action === "plus" ? 1 : -1;
            updateProductQuantity(qtyButton.dataset.productId, delta);
            return;
        }

        const addButton = event.target.closest("[data-add-product-id]");
        if (addButton) {
            updateProductQuantity(addButton.dataset.addProductId, 1);
            openCart();
            return;
        }
    });

    cartFab.addEventListener("click", openCart);
    cartBackdrop.addEventListener("click", closeCart);
    cartClose.addEventListener("click", closeCart);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && cartSheet.classList.contains("is-open")) {
            closeCart();
        }
    });
}

loadCart();
setupEvents();
loadCatalog();
