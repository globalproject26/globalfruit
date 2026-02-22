// Shared fallback data moved to js/catalog-data.js.
// Shared emoji dictionaries moved to js/catalog-data.js and js/catalog-utils.js.
// Shared utility helpers moved to js/catalog-utils.js.

// ===== CONFIG =====
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRkeFxdnYccFA7PFOXn5EJXfINDocaG3OmfIgD29lt8Y18qZDKbuYjaBA4Mg7U9qwTcN2CvIEYNIY7P/pub?output=csv";
const WA_PHONE = "77780878211";
const CACHE_KEY = "globalshop_products_v2";
const CACHE_TIME_KEY = "globalshop_products_ts_v2";
const REFRESH_INTERVAL_MS = 300000; // 5 minutes
const CATEGORY_CLONES_COUNT = 2;
const CATEGORY_DRAG_THRESHOLD = 10;
const CART_KEY = "globalshop_cart_v1";
const CART_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVE_SCREEN_KEY = "globalshop_active_screen";

// ===== STATE =====
let PRODUCTS = [...FALLBACK_PRODUCTS];
let PRODUCTS_BY_ID = new Map(PRODUCTS.map((p) => [Number(p.id), p]));

let cart = {};
let activeCategory = null;
const categoriesScrollInitialized = new WeakSet();
const categoriesPointerState = new WeakMap();
let isSyncingCategoryBars = false;

function setProducts(nextProducts) {
    PRODUCTS = Array.isArray(nextProducts) ? nextProducts : [];
    PRODUCTS_BY_ID = new Map(PRODUCTS.map((p) => [Number(p.id), p]));
}

// ===== DOM =====
const $productsList = document.getElementById("products-list");
const $emptyState = document.getElementById("empty-state");
const $searchInput = document.getElementById("search-input");
const $categoriesBars = Array.from(document.querySelectorAll(".categories-bar"));
const $cartItems = document.getElementById("cart-items");
const $cartEmpty = document.getElementById("cart-empty");
const $cartSummary = document.getElementById("cart-summary");
const $cartText = document.getElementById("cart-text");
const $cartTotalPrice = document.getElementById("cart-total-price");
const $cartBadge = document.getElementById("cart-badge");
const $whatsappBtn = document.getElementById("whatsapp-btn");
const $copyCartBtn = document.getElementById("copy-cart-btn");
const $clearCartBtn = document.getElementById("clear-cart-btn");
const $loadingBanner = document.getElementById("loading-banner");
const $lastUpdateEl = document.getElementById("last-update");

function getQuantityStep(product) {
    return getProductUnit(product) === UNIT_KG ? 0.5 : 1;
}

function roundQty(value) {
    return Math.round(Number(value || 0) * 10) / 10;
}

function formatQty(qty) {
    const value = roundQty(qty);
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(1);
}

function hasPieceUnitInName(name) {
    return /\(\s*шт\s*\)|\bшт\b/i.test(String(name || ""));
}

function getDisplayProductName(product) {
    const baseName = String(product?.name || "").trim();
    if (!baseName) return "";
    if (getProductUnit(product) === UNIT_PC && !hasPieceUnitInName(baseName)) {
        return `${baseName} (${UNIT_PC})`;
    }
    return baseName;
}

function formatQtyWithUnit(product, qty) {
    return `${formatQty(qty)} ${getProductUnit(product)}`;
}

// ===== РЈРўРР›РРўР« =====
const LOG_PREFIX = "[ГлобалШоп]";
const logInfo = (...args) => console.log(LOG_PREFIX, ...args);
const logWarn = (...args) => console.warn(LOG_PREFIX, ...args);

function saveCartToStorage() {
    try {
        localStorage.setItem(
            CART_KEY,
            JSON.stringify({ updatedAt: Date.now(), cart })
        );
    } catch (e) {
        logWarn("Не удалось сохранить корзину:", e);
    }
}

function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const updatedAt = Number(parsed?.updatedAt || 0);
        const cartData = parsed?.cart && typeof parsed.cart === "object" ? parsed.cart : null;

        if (!cartData) return;
        if (!updatedAt || Date.now() - updatedAt > CART_TTL_MS) {
            localStorage.removeItem(CART_KEY);
            return;
        }

        const nextCart = {};
        Object.entries(cartData).forEach(([id, qty]) => {
            const normalizedQty = Number(qty) || 0;
            if (normalizedQty > 0) nextCart[id] = normalizedQty;
        });
        cart = nextCart;
    } catch (e) {
        logWarn("Не удалось загрузить корзину:", e);
    }
}

// Availability/sale parsers moved to js/catalog-utils.js.

// ===== РџРђР РЎРРќР“ CSV =====
function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const idIdxRaw = headers.findIndex(h => h === "id" || h.includes("артик") || h.includes("код"));
    const nameIdxRaw = headers.findIndex(h => h.includes("name") || h.includes("наименован"));
    const unitIdxRaw = headers.findIndex(h => h.includes("unit") || h.includes("ед") || h.includes("изм"));
    const catIdxRaw = headers.findIndex(h => h.includes("category") || h.includes("категор"));
    const priceIdxRaw = headers.findIndex(h => h.includes("price") || h.includes("цена"));
    const saleIdxRaw = headers.findIndex(h => h.includes("sale") || h.includes("акц"));
    const availabilityIdxRaw = headers.findIndex(h => h.includes("availability") || h.includes("stock") || h.includes("налич"));
    const iconIdxRaw = headers.findIndex(h => h.includes("icon") || h.includes("emoji") || h.includes("эмодз"));

    // Fallback to known column positions if header text is garbled by encoding.
    const idIdx = idIdxRaw >= 0 ? idIdxRaw : 0;
    const nameIdx = nameIdxRaw >= 0 ? nameIdxRaw : 1;
    const unitIdx = unitIdxRaw >= 0 ? unitIdxRaw : 2;
    const catIdx = catIdxRaw >= 0 ? catIdxRaw : 3;
    const priceIdx = priceIdxRaw >= 0 ? priceIdxRaw : 5;
    const saleIdx = saleIdxRaw >= 0 ? saleIdxRaw : 6;
    const availabilityIdx = availabilityIdxRaw >= 0 ? availabilityIdxRaw : -1;
    const iconIdx = iconIdxRaw >= 0 ? iconIdxRaw : 7;

    const products = [];
    const usedIds = new Set();
    for (let i = 1; i < lines.length; i++) {
        // Разбираем CSV с учетом кавычек
        const cols = parseCSVLine(lines[i]);
        if (!cols || cols.length < 3) continue;

        const idRaw = idIdx >= 0 ? (cols[idIdx] || "").trim() : "";
        const name = (cols[nameIdx] || "").trim();
        const unitRaw = unitIdx >= 0 ? (cols[unitIdx] || "").trim() : "";
        const category = (cols[catIdx] || "").trim();
        const priceRaw = (cols[priceIdx] || "").trim().replace(/[^\d.]/g, "");
        const saleRaw = saleIdx >= 0 ? (cols[saleIdx] || "").trim() : "";
        const availabilityRaw = availabilityIdx >= 0 ? (cols[availabilityIdx] || "").trim() : "";
        const iconRaw = iconIdx >= 0 ? (cols[iconIdx] || "").trim() : "";

        if (!name || !category || !priceRaw) continue;
        const isAvailable = parseAvailabilityValue(availabilityRaw);
        if (!isAvailable) continue;

        const parsedId = parseInt(String(idRaw).replace(/[^\d]/g, ""), 10);
        let productId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : i;
        if (usedIds.has(productId)) {
            logWarn("Duplicate product id in CSV, fallback to row id:", productId, "row:", i);
            productId = i;
        }
        usedIds.add(productId);

        products.push({
            id: productId,
            name,
            category,
            price: parseInt(priceRaw, 10) || 0,
            sale: parseSaleValue(saleRaw),
            available: isAvailable,
            emoji: iconRaw || "",
            unit: normalizeUnit(unitRaw),
        });
    }
    return products;
}

// CSV line parser moved to js/catalog-utils.js.

// ===== Р—РђР“Р РЈР—РљРђ РР— GOOGLE SHEETS (С‚РѕР»СЊРєРѕ С„РѕРЅРѕРІРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ) =====
async function fetchProductsFromSheets() {
    // Проверяем кеш через localStorage
    try {
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        if (cachedTime) {
            const age = Date.now() - parseInt(cachedTime, 10);
            if (age < REFRESH_INTERVAL_MS) {
                // Кеш свежий — берём данные из него
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const data = JSON.parse(cached);
                    if (data.length > 0) {
                        setProducts(data);
                        updateLastUpdateDisplay(parseInt(cachedTime, 10));
                        logInfo("Данные взяты из кеша.");
                        return true;
                    }
                }
            }
        }
    } catch (e) {
        // localStorage может быть недоступен (file://, приватный режим) — просто продолжаем
        logWarn("localStorage недоступен:", e);
    }

    // Показываем индикатор загрузки
    if ($loadingBanner) $loadingBanner.style.display = "flex";
    logInfo("Запрос обновления данных из Google Sheets...");

    try {
        const resp = await fetch(SHEET_CSV_URL + "&t=" + Date.now(), { cache: "no-store" });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const csv = await resp.text();
        const parsed = parseCSV(csv);
        if (parsed.length === 0) throw new Error("Пустой ответ");

        setProducts(parsed);
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(PRODUCTS));
            localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch (e) { /* ignore */ }
        updateLastUpdateDisplay(Date.now());
        logInfo(`Данные обновлены, товаров: ${PRODUCTS.length}`);
        if ($loadingBanner) $loadingBanner.style.display = "none";
        return true;
    } catch (err) {
        logWarn("Google Sheets недоступен:", err);
        if ($loadingBanner) $loadingBanner.style.display = "none";
        return false;
    }
}

function updateLastUpdateDisplay(ts) {
    if (!$lastUpdateEl) return;
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    $lastUpdateEl.textContent = `Обновлено: ${h}:${m}`;
}

// ===== РџРћР›РЈР§Р•РќРР• РљРђРўР•Р“РћР РР™ =====
function getCategories() {
    const cats = [...new Set(PRODUCTS.map(p => p.category))];
    const apples = [];
    const rest = [];

    cats.forEach((cat) => {
        if (/яблок/i.test(String(cat))) {
            apples.push(cat);
            return;
        }
        rest.push(cat);
    });

    return [...rest, ...apples];
}

function hasSaleProducts() {
    return PRODUCTS.some(p => p.sale && p.available !== false);
}

// ===== Р Р•РќР”Р•Р  РљРђРўР•Р“РћР РР™-Р§РРџРЎРћР’ =====
function renderCategoryChips() {
    $categoriesBars.forEach(bar => {
        const existingChips = bar.querySelectorAll(".cat-chip");
        existingChips.forEach(c => c.remove());
    });

    const cats = getCategories();
    const finalCats = [];

    // РЎРЅР°С‡Р°Р»Р° "Акция" РµСЃР»Рё РµСЃС‚СЊ С‚РѕРІР°СЂС‹ СЃРѕ СЃРєРёРґРєРѕР№
    if (hasSaleProducts()) {
        finalCats.push({ id: "sale", label: "🔥 Акции" });
    }

    cats.forEach(cat => {
        finalCats.push({ id: cat, label: (CATEGORY_EMOJIS[cat] || "📦") + " " + cat });
    });

    if (finalCats.length > 0) {
        const availableIds = new Set(finalCats.map(c => c.id));
        if (!activeCategory || !availableIds.has(activeCategory)) {
            activeCategory = finalCats[0].id;
        }
    }

    // Рендерим чипсы для бесконечного скролла (клонируем в начале и конце)
    // Структура: [Последние 2] [Все категории] [Первые 2]
    $categoriesBars.forEach(bar => {
        finalCats.forEach((catObj) => {
            const chip = makeChip(catObj.id, catObj.label);
            bar.appendChild(chip);
        });
    });

    // Восстановить активный
    syncActiveChip();
}

function makeChip(category, label) {
    const chip = document.createElement("button");
    chip.className = "cat-chip";
    chip.dataset.category = category;
    chip.textContent = label;
    return chip;
}

function syncActiveChip() {
    document.querySelectorAll(".cat-chip").forEach(c => {
        c.classList.toggle("active", c.dataset.category === activeCategory);
    });
}

function centerActiveRealChip() {
    $categoriesBars.forEach(bar => {
        const chips = Array.from(bar.querySelectorAll(".cat-chip"));
        const matches = chips.filter(chip => chip.dataset.category === activeCategory);
        if (matches.length === 0) return;
        const viewCenter = bar.scrollLeft + (bar.clientWidth / 2);
        let target = matches[0];
        let minDistance = Infinity;
        matches.forEach(chip => {
            const chipCenter = chip.offsetLeft + (chip.offsetWidth / 2);
            const distance = Math.abs(chipCenter - viewCenter);
            if (distance < minDistance) {
                minDistance = distance;
                target = chip;
            }
        });
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    });
}

function bindCategoryClick(bar) {
    bar.addEventListener("click", (e) => {
        const chip = e.target.closest(".cat-chip");
        if (!chip) return;

        const state = categoriesPointerState.get(bar);
        if (state?.ignoreNextClick || state?.startedDragging) return;

        activeCategory = chip.dataset.category;
        syncActiveChip();
        renderProducts();
        centerActiveRealChip();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function syncCategoryBars(sourceBar) {
    if (isSyncingCategoryBars) return;
    isSyncingCategoryBars = true;
    const left = sourceBar.scrollLeft;
    $categoriesBars.forEach(bar => {
        if (bar !== sourceBar) {
            bar.scrollLeft = left;
        }
    });
    requestAnimationFrame(() => { isSyncingCategoryBars = false; });
}

function getCategoryTrackMetrics(bar) {
    const chips = Array.from(bar.querySelectorAll(".cat-chip"));
    const realCount = chips.length - CATEGORY_CLONES_COUNT * 2;
    if (realCount <= 0) return null;

    const firstReal = chips[CATEGORY_CLONES_COUNT];
    const lastReal = chips[CATEGORY_CLONES_COUNT + realCount - 1];
    const firstAfterReal = chips[CATEGORY_CLONES_COUNT + realCount];
    if (!firstReal || !lastReal || !firstAfterReal) return null;

    const firstRealOffset = firstReal.offsetLeft - 8;
    const lastRealOffset = lastReal.offsetLeft - 8;
    const trackWidth = firstAfterReal.offsetLeft - firstReal.offsetLeft;
    if (trackWidth <= 0) return null;

    return { firstRealOffset, lastRealOffset, trackWidth };
}

function normalizeInfiniteScrollPosition(bar) {
    const metrics = getCategoryTrackMetrics(bar);
    if (!metrics) return;

    const leftBoundary = metrics.firstRealOffset - 24;
    const rightBoundary = metrics.lastRealOffset + 24;

    if (bar.scrollLeft < leftBoundary) {
        bar.scrollLeft += metrics.trackWidth;
    } else if (bar.scrollLeft > rightBoundary) {
        bar.scrollLeft -= metrics.trackWidth;
    }
}

function setupInfiniteScroll() {
    $categoriesBars.forEach(bar => {
        if (categoriesScrollInitialized.has(bar)) return;
        categoriesScrollInitialized.add(bar);

        bar.addEventListener("scroll", () => {
            normalizeInfiniteScrollPosition(bar);
            syncCategoryBars(bar);
        });
    });
}

function setupCategoryPointerGuards() {
    $categoriesBars.forEach(bar => {
        if (!categoriesPointerState.has(bar)) {
            categoriesPointerState.set(bar, {
                pointerDown: false,
                startedDragging: false,
                ignoreNextClick: false,
                startX: 0,
                startY: 0,
            });
        }

        const state = categoriesPointerState.get(bar);

        bar.addEventListener("pointerdown", (e) => {
            state.pointerDown = true;
            state.startedDragging = false;
            state.startX = e.clientX;
            state.startY = e.clientY;
        });

        bar.addEventListener("pointermove", (e) => {
            if (!state.pointerDown) return;
            const dx = Math.abs(e.clientX - state.startX);
            const dy = Math.abs(e.clientY - state.startY);
            if (dx > CATEGORY_DRAG_THRESHOLD || dy > CATEGORY_DRAG_THRESHOLD) {
                state.startedDragging = true;
            }
        });

        const stopPointerTracking = () => {
            if (!state.pointerDown) return;
            state.pointerDown = false;
            if (state.startedDragging) {
                state.ignoreNextClick = true;
                setTimeout(() => { state.ignoreNextClick = false; }, 120);
            }
            setTimeout(() => { state.startedDragging = false; }, 0);
        };

        window.addEventListener("pointerup", stopPointerTracking);
        window.addEventListener("pointercancel", stopPointerTracking);
    });
}

// ===== РЕНДЕР ТОВАРОВ =====
function renderProducts() {
    const query = $searchInput ? $searchInput.value.trim().toLowerCase() : "";
    let filtered = PRODUCTS;

    if (activeCategory === "sale") {
        filtered = filtered.filter(p => p.sale);
    } else {
        filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    if (filtered.length === 0) {
        $productsList.innerHTML = "";
        $emptyState.style.display = "block";
        return;
    }
    $emptyState.style.display = "none";

    // Группировка по категoriям
    let html = "";

    if (activeCategory === "sale") {
        // Акции — без дополнительной группировки
        html += renderProductCards(filtered);
    } else {
        const groups = {};
        filtered.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });

        for (const [cat, products] of Object.entries(groups)) {
            const emoji = CATEGORY_EMOJIS[cat] || "📦";
            html += `
                <div class="category-section">
                    <div class="category-header">
                        <span class="category-emoji">${emoji}</span>
                        <span class="category-name">${cat}</span>
                        <span class="category-count">${products.length}</span>
                    </div>
                    ${renderProductCards(products)}
                </div>
            `;
        }
    }

    $productsList.innerHTML = html;
}

function renderProductCards(products) {
    return products.map(p => {
        const qty = cart[p.id] || 0;
        const unit = getProductUnit(p);
        const inCart = qty > 0 ? " in-cart" : "";
        const hasValue = qty > 0 ? " has-value" : "";
        const plusActive = qty > 0 ? " is-active" : "";
        const saleBadge = p.sale ? `<span class="sale-badge">🔥 Акция</span>` : "";
        return `
            <div class="product-card${inCart}" data-id="${p.id}">
                <div class="product-emoji">${getProductEmoji(p.name, p.emoji)}</div>
                <div class="product-info">
                    <div class="product-name">${getDisplayProductName(p)} ${saleBadge}</div>
                    <div class="product-price">${formatPrice(p.price)}</div>
                </div>
                <div class="counter">
                    <button class="counter-btn minus" data-id="${p.id}" data-action="minus">&#8722;</button>
                    <div class="counter-value-wrap">
                        <span class="counter-val${hasValue}" data-id="${p.id}">${formatQty(qty)}</span>
                        <span class="counter-unit">${unit}</span>
                    </div>
                    <button class="counter-btn plus${plusActive}" data-id="${p.id}" data-action="plus">+</button>
                </div>
            </div>
        `;
    }).join("");
}

// ===== РћР‘Р РђР‘РћРўРљРђ РљР›РРљРћР’ РќРђ РЎР§РЃРўР§РРљРђРҐ =====
$productsList.addEventListener("click", (e) => {
    const btn = e.target.closest(".counter-btn");
    if (!btn) return;
    e.stopPropagation();

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const qty = changeCartItemQuantity(id, action);

    // Обновление конкретной карточки без перерендера
    const card = btn.closest(".product-card");
    if (card) {
        const valSpan = card.querySelector(".counter-val");
        const plusBtn = card.querySelector(".counter-btn.plus");
        if (valSpan) {
            valSpan.textContent = formatQty(qty);
            valSpan.classList.toggle("has-value", qty > 0);
        }
        card.classList.toggle("in-cart", qty > 0);
        if (plusBtn) plusBtn.classList.toggle("is-active", qty > 0);
    }

    updateCartBadge();
    saveCartToStorage();
});

// ===== Р‘Р•Р™Р”Р– РљРћР Р—РРќР« =====
function updateCartBadge() {
    const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
    if (totalItems > 0) {
        $cartBadge.style.display = "flex";
        $cartBadge.textContent = totalItems;
    } else {
        $cartBadge.style.display = "none";
    }
}

function changeCartItemQuantity(id, action) {
    if (!Number.isFinite(id) || id <= 0) return 0;
    const product = PRODUCTS_BY_ID.get(Number(id));
    const step = getQuantityStep(product);
    if (action === "plus") {
        cart[id] = roundQty((cart[id] || 0) + step);
    } else if (action === "minus") {
        if (cart[id] && cart[id] > 0) {
            cart[id] = roundQty((cart[id] || 0) - step);
            if (cart[id] <= 0) delete cart[id];
        }
    }
    return roundQty(cart[id] || 0);
}

function clearCartState() {
    Object.keys(cart).forEach((k) => delete cart[k]);
}

function getCartItems() {
    return Object.entries(cart)
        .map(([id, qty]) => {
            const product = PRODUCTS_BY_ID.get(Number(id));
            return product ? { ...product, qty } : null;
        })
        .filter(Boolean)
        .filter(item => item.qty > 0);
}

// ===== Р Р•РќР”Р•Р  РљРћР Р—РРќР« =====
function renderCart() {
    const items = getCartItems();

    if (items.length === 0) {
        $cartItems.innerHTML = "";
        $cartEmpty.style.display = "block";
        $cartSummary.style.display = "none";
        $whatsappBtn.style.display = "none";
        if ($copyCartBtn) {
            $copyCartBtn.disabled = true;
            $copyCartBtn.dataset.copyText = "";
        }
        return;
    }

    $cartEmpty.style.display = "none";
    $cartSummary.style.display = "block";
    $whatsappBtn.style.display = "flex";

    $cartItems.innerHTML = items.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <span class="cart-item-name">${getProductEmoji(item.name, item.emoji)} ${getDisplayProductName(item)}</span>
                <span class="cart-item-price">${formatPrice(item.price * item.qty)}</span>
            </div>
            <div class="counter cart-item-counter">
                <button class="counter-btn minus cart-counter-btn" data-id="${item.id}" data-action="minus">&#8722;</button>
                <div class="counter-value-wrap">
                    <span class="counter-val has-value">${formatQty(item.qty)}</span>
                    <span class="counter-unit">${getProductUnit(item)}</span>
                </div>
                <button class="counter-btn plus is-active cart-counter-btn" data-id="${item.id}" data-action="plus">+</button>
            </div>
        </div>
    `).join("");

    const textLines = items.map(item => `${getDisplayProductName(item)} x ${formatQtyWithUnit(item, item.qty)}`);
    const totalPrice = items.reduce((s, item) => s + item.price * item.qty, 0);

    $cartText.textContent = textLines.join("\n");
    $cartTotalPrice.textContent = `~ ${formatPrice(totalPrice)}`;

    const waText = buildWhatsAppText(items);
    $whatsappBtn.href = `https://wa.me/${WA_PHONE}?text=${waText}`;

    if ($copyCartBtn) {
        $copyCartBtn.disabled = false;
        $copyCartBtn.dataset.copyText = buildOrderText(items);
    }
}

function buildOrderText(items) {
    let text = "Заказ с GlobalFruit.kz:\n\n";
    items.forEach(item => {
        text += `${getDisplayProductName(item)} x ${formatQtyWithUnit(item, item.qty)}\n`;
    });
    text += "\nПосчитайте итоговую стоимость, пожалуйста.";
    return text;
}

function buildWhatsAppText(items) {
    return encodeURIComponent(buildOrderText(items));
}

// ===== РћР§РРЎРўРРўР¬ РљРћР Р—РРќРЈ =====
$clearCartBtn.addEventListener("click", () => {
    if (Object.keys(cart).length === 0) return;
    if (confirm("Очистить корзину?")) {
        clearCartState();
        saveCartToStorage();
        updateCartBadge();
        renderCart();
        renderProducts();
    }
});

$cartItems.addEventListener("click", (e) => {
    const btn = e.target.closest(".cart-counter-btn");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    changeCartItemQuantity(id, action);

    saveCartToStorage();
    updateCartBadge();
    renderCart();
    renderProducts();
});

if ($copyCartBtn) {
    $copyCartBtn.addEventListener("click", async () => {
        const text = $copyCartBtn.dataset.copyText || "";
        if (!text.trim()) return;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.setAttribute("readonly", "");
                ta.style.position = "absolute";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }

            const oldLabel = $copyCartBtn.textContent;
            $copyCartBtn.textContent = "Скопировано";
            setTimeout(() => {
                $copyCartBtn.textContent = oldLabel;
            }, 1200);
        } catch (e) {
            logWarn("Не удалось скопировать заказ:", e);
        }
    });
}

function setActiveScreen(screenId) {
    const valid = screenId === "catalog-screen" || screenId === "cart-screen";
    const nextScreen = valid ? screenId : "catalog-screen";

    document.querySelectorAll(".nav-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.screen === nextScreen);
    });

    document.querySelectorAll(".screen").forEach(s => {
        s.classList.toggle("active", s.id === nextScreen);
    });

    if (nextScreen === "cart-screen") {
        renderCart();
    }

    try {
        localStorage.setItem(ACTIVE_SCREEN_KEY, nextScreen);
    } catch (e) {
        logWarn("Не удалось сохранить активный экран:", e);
    }

    const nextHash = nextScreen === "cart-screen" ? "#cart" : "#catalog";
    if (window.location.hash !== nextHash) {
        history.replaceState(null, "", nextHash);
    }
}

// ===== РќРђР’РР“РђР¦РРЇ =====
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        setActiveScreen(btn.dataset.screen);
    });
});

// ===== РџРћРРЎРљ =====
let searchTimeout;
let isRefreshInProgress = false;
if ($searchInput) {
    $searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(renderProducts, 200);
    });
}

function scheduleAutoRefresh() {
    setInterval(async () => {
        if (document.hidden) return;
        if (isRefreshInProgress) return;
        isRefreshInProgress = true;
        logInfo("Авто-обновление данных...");
        try {
            const updated = await fetchProductsFromSheets();
            if (updated) {
                renderCategoryChips();
                renderProducts();
                if (document.getElementById("cart-screen").classList.contains("active")) {
                    renderCart();
                }
            }
        } finally {
            isRefreshInProgress = false;
        }
    }, REFRESH_INTERVAL_MS);
}

// ===== РРќРР¦РРђР›РР—РђР¦РРЇ =====
function init() {
    loadCartFromStorage();
    updateCartBadge();

    // 1. Мгновенно показываем каталог из встроенных данных
    renderCategoryChips();
    renderProducts();

    // 2. В фоне пробуем подгрузить актуальные данные из Google Sheets
    fetchProductsFromSheets().then(updated => {
        if (updated) {
            renderCategoryChips();
            renderProducts();
        }
    }).catch(() => {/* РЅРµС‚ РёРЅС‚РµСЂРЅРµС‚Р° вЂ” СЂР°Р±РѕС‚Р°РµРј СЃ РІСЃС‚СЂРѕРµРЅРЅС‹РјРё */ });

    // 3. Планируем авто-обновление каждый час
    scheduleAutoRefresh();

    // 4. Тень sticky-бара при прилипании
    const stickyBar = document.querySelector(".sticky-bar");
    if (stickyBar && "IntersectionObserver" in window) {
        const sentinel = document.createElement("div");
        sentinel.style.cssText = "position:absolute;top:0;height:1px;pointer-events:none";
        stickyBar.parentElement.insertBefore(sentinel, stickyBar);
        new IntersectionObserver(
            ([entry]) => stickyBar.classList.toggle("is-stuck", !entry.isIntersecting),
            { threshold: 1.0 }
        ).observe(sentinel);
    }

    // 5. Бесконечный скролл по кругу + защита от ложного клика при прокрутке
    $categoriesBars.forEach(bindCategoryClick);
    setupCategoryPointerGuards();

    // 6. Свайп для переключения категорий
    initSwipe();

    try {
        const fromHash = window.location.hash === "#cart"
            ? "cart-screen"
            : (window.location.hash === "#catalog" ? "catalog-screen" : null);
        const savedScreen = localStorage.getItem(ACTIVE_SCREEN_KEY);
        setActiveScreen(fromHash || savedScreen || "catalog-screen");
    } catch (e) {
        setActiveScreen("catalog-screen");
    }
}

// ===== РЎР’РђР™Рџ вЂ” РџР•Р Р•РљР›Р®Р§Р•РќРР• РљРђРўР•Р“РћР РР™ РџРћ РљР РЈР“РЈ =====
function initSwipe() {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const MIN_X = 70;   // РјРёРЅРёРјСѓРј px РїРѕ РіРѕСЂРёР·РѕРЅС‚Р°Р»Рё
    const MAX_YR = 0.6;  // РІРµСЂС‚РёРєР°Р»СЊ РЅРµ Р±РѕР»СЊС€Рµ 60% РѕС‚ РіРѕСЂРёР·РѕРЅС‚Р°Р»Рё

    document.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;

        // Не переключаем категории, если жест начался на интерактивных элементах/товаре.
        if (e.target.closest(".categories-bar, .product-card, .counter, .cart-item, .cart-items, .whatsapp-btn, button, a, input, textarea, select, label")) {
            tracking = false;
            return;
        }

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        tracking = true;
    }, { passive: true });

    document.addEventListener("touchend", (e) => {
        if (!tracking) return;
        tracking = false;

        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;

        // Достаточно горизонтальный жест?
        if (Math.abs(dx) < MIN_X) return;
        if (Math.abs(dy) > Math.abs(dx) * MAX_YR) return;

        // Работаем только на экране каталога
        const catalogScreen = document.getElementById("catalog-screen");
        if (!catalogScreen.classList.contains("active")) return;

        // Собираем только реальные чипсы для расчёта индекса
        const refBar = $categoriesBars[0];
        const chips = refBar ? Array.from(refBar.querySelectorAll(".cat-chip")) : [];
        if (chips.length === 0) return;

        const currentIdx = chips.findIndex(c => c.dataset.category === activeCategory);
        const safeCurrentIdx = currentIdx >= 0 ? currentIdx : 0;
        const total = chips.length;
        let nextIdx;

        if (dx < 0) {
            // Свайп влево → следующая категория
            nextIdx = Math.min(safeCurrentIdx + 1, total - 1);
        } else {
            // Свайп вправо → предыдущая категория
            nextIdx = Math.max(safeCurrentIdx - 1, 0);
        }

        const nextChip = chips[nextIdx];
        activeCategory = nextChip.dataset.category;
        syncActiveChip();
        renderProducts();

        // Прокручиваем окно вверх к началу списка
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Центрируем выбранный чип
        nextChip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    }, { passive: true });

    document.addEventListener("touchcancel", () => { tracking = false; }, { passive: true });
}

init();
