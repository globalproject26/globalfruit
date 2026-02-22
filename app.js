// ===== НАСТРОЙКИ =====
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRkeFxdnYccFA7PFOXn5EJXfINDocaG3OmfIgD29lt8Y18qZDKbuYjaBA4Mg7U9qwTcN2CvIEYNIY7P/pub?output=csv";
const WA_PHONE = "77780878211";
const CACHE_KEY = "globalshop_products";
const CACHE_TIME_KEY = "globalshop_cache_time";
const REFRESH_INTERVAL_MS = 3600000; // 1 час

// ===== ВСТРОЕННЫЕ ДАННЫЕ (резервные, если Google Sheets недоступен) =====
const FALLBACK_PRODUCTS = [
    // Зелень и Грибы
    { id: 14, name: "Грибы шампиньоны (пучок)", category: "Зелень и Грибы", price: 3690, sale: false },
    { id: 15, name: "Грибы Эноки (пучок)", category: "Зелень и Грибы", price: 600, sale: false },
    { id: 62, name: "Петрушка (пучок)", category: "Зелень и Грибы", price: 200, sale: false },
    { id: 63, name: "Кинза (пучок)", category: "Зелень и Грибы", price: 320, sale: false },
    { id: 64, name: "Руккола (пучок)", category: "Зелень и Грибы", price: 650, sale: false },
    { id: 65, name: "Шпинат (пучок)", category: "Зелень и Грибы", price: 780, sale: false },
    { id: 66, name: "Мята (пучок)", category: "Зелень и Грибы", price: 500, sale: false },
    { id: 67, name: "Сельдерей (пучок)", category: "Зелень и Грибы", price: 1680, sale: false },
    { id: 69, name: "Зелёный лук (пучок)", category: "Зелень и Грибы", price: 440, sale: false },
    { id: 71, name: "Имбирь (пучок)", category: "Зелень и Грибы", price: 2800, sale: false },
    // Овощи
    { id: 1, name: "Свекла (кг)", category: "Овощи", price: 280, sale: false },
    { id: 2, name: "Тыква (кг)", category: "Овощи", price: 480, sale: false },
    { id: 3, name: "Капуста (кг)", category: "Овощи", price: 280, sale: false },
    { id: 4, name: "Кабачки (кг)", category: "Овощи", price: 1600, sale: false },
    { id: 5, name: "Баклажаны (кг)", category: "Овощи", price: 1780, sale: false },
    { id: 6, name: "Чеснок (кг)", category: "Овощи", price: 2210, sale: false },
    { id: 7, name: "Помидоры розовые (кг)", category: "Овощи", price: 1790, sale: false },
    { id: 8, name: "Помидоры на ветке (кг)", category: "Овощи", price: 1590, sale: false },
    { id: 9, name: "Огурцы Рава (кг)", category: "Овощи", price: 2590, sale: false },
    { id: 10, name: "Огурцы Миринда Иран (кг)", category: "Овощи", price: 1260, sale: false },
    { id: 11, name: "Капуста цветная (кг)", category: "Овощи", price: 1500, sale: false },
    { id: 12, name: "Брокколи (кг)", category: "Овощи", price: 1800, sale: false },
    { id: 13, name: "Капуста пекинская (кг)", category: "Овощи", price: 460, sale: false },
    { id: 16, name: "Перец светофор (кг)", category: "Овощи", price: 1950, sale: false },
    { id: 17, name: "Редька (кг)", category: "Овощи", price: 510, sale: false },
    { id: 18, name: "Черри красный (кг)", category: "Овощи", price: 1900, sale: false },
    { id: 19, name: "Квашеная капуста 300г (кг)", category: "Овощи", price: 600, sale: false },
    { id: 68, name: "Айсберг (кг)", category: "Овощи", price: 2400, sale: false },
    { id: 70, name: "Листья салата (кг)", category: "Овощи", price: 1700, sale: false },
    // Орехи и сухофрукты
    { id: 72, name: "Грецкие орехи чищенные (кг)", category: "Орехи и сухофрукты", price: 5700, sale: false },
    { id: 73, name: "Кешью (кг)", category: "Орехи и сухофрукты", price: 7800, sale: false },
    { id: 74, name: "Кешью жареный (кг)", category: "Орехи и сухофрукты", price: 8250, sale: false },
    { id: 75, name: "Миндаль (кг)", category: "Орехи и сухофрукты", price: 7800, sale: false },
    { id: 76, name: "Макадамия (кг)", category: "Орехи и сухофрукты", price: 4500, sale: false },
    { id: 77, name: "Арахис соленый (кг)", category: "Орехи и сухофрукты", price: 2400, sale: false },
    { id: 78, name: "Арахис жареный (кг)", category: "Орехи и сухофрукты", price: 1800, sale: false },
    { id: 79, name: "Арахис в карамельной глазури (кг)", category: "Орехи и сухофрукты", price: 2850, sale: false },
    { id: 80, name: "Арахис в белой глазури (кг)", category: "Орехи и сухофрукты", price: 2850, sale: false },
    { id: 81, name: "Тыквенные семечки (кг)", category: "Орехи и сухофрукты", price: 3650, sale: false },
    { id: 82, name: "Чернослив (кг)", category: "Орехи и сухофрукты", price: 2700, sale: false },
    { id: 83, name: "Курага (кг)", category: "Орехи и сухофрукты", price: 3450, sale: false },
    { id: 84, name: "Изюм черный (кг)", category: "Орехи и сухофрукты", price: 4500, sale: false },
    { id: 85, name: "Изюм желтый (кг)", category: "Орехи и сухофрукты", price: 3750, sale: false },
    { id: 86, name: "Науат (кг)", category: "Орехи и сухофрукты", price: 1500, sale: false },
    { id: 87, name: "Конфеты фрукты в шоколаде (кг)", category: "Орехи и сухофрукты", price: 4950, sale: false },
    { id: 88, name: "Кедровые орехи 100г (кг)", category: "Орехи и сухофрукты", price: 1800, sale: false },
    { id: 89, name: "Сушеное манго 1кг (шт)", category: "Орехи и сухофрукты", price: 2250, sale: false },
    // Суперфуды и специи
    { id: 90, name: "Семена льна (кг)", category: "Суперфуды и специи", price: 1350, sale: false },
    { id: 91, name: "Семена чиа (кг)", category: "Суперфуды и специи", price: 3750, sale: false },
    { id: 92, name: "Гвоздика 100г (кг)", category: "Суперфуды и специи", price: 1300, sale: false },
    { id: 93, name: "Корица 100г (кг)", category: "Суперфуды и специи", price: 720, sale: false },
    { id: 94, name: "Бадьян 100г (кг)", category: "Суперфуды и специи", price: 975, sale: false },
    // Цитрусы
    { id: 33, name: "Апельсины (кг)", category: "Цитрусы", price: 990, sale: false },
    { id: 34, name: "Мандарины листовые (кг)", category: "Цитрусы", price: 850, sale: false },
    { id: 35, name: "Мандарины королевские листовые (кг)", category: "Цитрусы", price: 940, sale: false },
    { id: 36, name: "Мандарины Марокко (кг)", category: "Цитрусы", price: 1870, sale: false },
    { id: 37, name: "Мандарины Миниола (кг)", category: "Цитрусы", price: 1670, sale: false },
    { id: 38, name: "Мандарины Медовка (кг)", category: "Цитрусы", price: 850, sale: false },
    { id: 39, name: "Мандарины Турция (кг)", category: "Цитрусы", price: 1550, sale: false },
    { id: 47, name: "Грейпфрут (кг)", category: "Цитрусы", price: 1800, sale: false },
    { id: 56, name: "Лайм (кг)", category: "Цитрусы", price: 580, sale: false },
    { id: 57, name: "Лимон Турция (кг)", category: "Цитрусы", price: 2380, sale: false },
    { id: 59, name: "Помело медовое (кг)", category: "Цитрусы", price: 799, sale: false },
    { id: 60, name: "Помело красное (кг)", category: "Цитрусы", price: 1250, sale: false },
    { id: 61, name: "Помело в сумке (кг)", category: "Цитрусы", price: 2100, sale: false },
    // Экзотика
    { id: 32, name: "Бананы (кг)", category: "Экзотика", price: 990, sale: false },
    { id: 43, name: "Хурма Азербайджан (кг)", category: "Экзотика", price: 1290, sale: false },
    { id: 44, name: "Авокадо (шт)", category: "Экзотика", price: 1190, sale: false },
    { id: 45, name: "Ананас (шт)", category: "Экзотика", price: 1250, sale: false },
    { id: 46, name: "Гранат (кг)", category: "Экзотика", price: 2290, sale: false },
    { id: 51, name: "Манго Смайлик (кг)", category: "Экзотика", price: 1100, sale: false },
    { id: 52, name: "Драгон фрут красный (шт)", category: "Экзотика", price: 1800, sale: false },
    { id: 53, name: "Драгон фрут белый (шт)", category: "Экзотика", price: 870, sale: false },
    { id: 54, name: "Киви в сетке (кг)", category: "Экзотика", price: 990, sale: false },
    { id: 55, name: "Кокос с трубочкой (шт)", category: "Экзотика", price: 1870, sale: false },
    { id: 58, name: "Маракуйя 2 шт (шт)", category: "Экзотика", price: 800, sale: false },
    // Яблоки и Груши
    { id: 22, name: "Яблоки Айдаред (кг)", category: "Яблоки и Груши", price: 980, sale: false },
    { id: 24, name: "Яблоки Лимонка (кг)", category: "Яблоки и Груши", price: 990, sale: false },
    { id: 26, name: "Яблоки Салтанат (кг)", category: "Яблоки и Груши", price: 1050, sale: false },
    { id: 28, name: "Яблоки Семиренко (кг)", category: "Яблоки и Груши", price: 980, sale: false },
    { id: 30, name: "Яблоки Черный принц (кг)", category: "Яблоки и Груши", price: 1190, sale: false },
    { id: 48, name: "Груши Дюшес (кг)", category: "Яблоки и Груши", price: 860, sale: false },
    { id: 49, name: "Груши Конференция (кг)", category: "Яблоки и Груши", price: 2090, sale: false },
    { id: 50, name: "Груши Лесная красавица (кг)", category: "Яблоки и Груши", price: 930, sale: false },
    // Ягоды
    { id: 20, name: "Клубника Египет (кг)", category: "Ягоды", price: 1990, sale: false },
    { id: 21, name: "Голубика (кг)", category: "Ягоды", price: 1650, sale: false },
    { id: 40, name: "Виноград Бычий глаз (кг)", category: "Ягоды", price: 1390, sale: false },
    { id: 41, name: "Виноград Хусаин (кг)", category: "Ягоды", price: 1380, sale: false },
    { id: 42, name: "Виноград Шайн мускат (кг)", category: "Ягоды", price: 3800, sale: false },
    { id: 95, name: "Облепиха замороженная (кг)", category: "Ягоды", price: 2500, sale: false },
    { id: 96, name: "Малина замороженная (кг)", category: "Ягоды", price: 5680, sale: false },
    { id: 97, name: "Вишня замороженная (кг)", category: "Ягоды", price: 5700, sale: false },
    { id: 98, name: "Клюква замороженная (кг)", category: "Ягоды", price: 4350, sale: false },
    { id: 99, name: "Смородина замороженная (кг)", category: "Ягоды", price: 5990, sale: false },
];

// ===== СОСТОЯНИЕ =====
let PRODUCTS = [...FALLBACK_PRODUCTS]; // сразу зашиты данные, fetch только обновит цены

let cart = {};
let activeCategory = "all";

// ===== ЭМОДЗИ ДЛЯ КАТЕГОРИЙ =====
const CATEGORY_EMOJIS = {
    "Акция": "🔥",
    "Зелень и Грибы": "🌿",
    "Овощи": "🥦",
    "Орехи и сухофрукты": "🥜",
    "Суперфуды и специи": "✨",
    "Цитрусы": "🍊",
    "Экзотика": "🥭",
    "Яблоки и Груши": "🍎",
    "Ягоды": "🍓",
};

// ===== ЭМОДЗИ ДЛЯ ТОВАРОВ =====
const PRODUCT_EMOJIS = {
    "грибы": "🍄", "шампиньон": "🍄", "эноки": "🍄",
    "петрушка": "🌿", "кинза": "🌿", "руккола": "🥬", "шпинат": "🥬",
    "мята": "🌿", "сельдерей": "🥬", "лук": "🧅", "имбирь": "🫚",
    "свекла": "🫒", "тыква": "🎃", "капуста": "🥬", "кабачк": "🥒",
    "баклажан": "🍆", "чеснок": "🧄", "помидор": "🍅", "огурц": "🥒",
    "брокколи": "🥦", "перец": "🫑", "редька": "🫒", "черри": "🍅",
    "квашен": "🥬", "айсберг": "🥬", "салат": "🥬",
    "орех": "🥜", "кешью": "🥜", "миндаль": "🥜", "макадам": "🥜",
    "арахис": "🥜", "семечк": "🌻", "чернослив": "🫐", "курага": "🍑",
    "изюм": "🍇", "науат": "🍬", "конфет": "🍫", "кедров": "🌲",
    "манго": "🥭", "семена": "🌱", "чиа": "🌱",
    "гвоздик": "🌺", "корица": "✨", "бадьян": "⭐",
    "апельсин": "🍊", "мандарин": "🍊", "грейпфрут": "🍊",
    "лайм": "🍋", "лимон": "🍋", "помело": "🍈",
    "банан": "🍌", "хурма": "🍅", "авокадо": "🥑", "ананас": "🍍",
    "гранат": "🫐", "драгон": "🐉", "киви": "🥝", "кокос": "🥥",
    "маракуйя": "💛",
    "яблок": "🍎", "груш": "🍐",
    "клубник": "🍓", "голубик": "🫐", "виноград": "🍇",
    "облепих": "🟠", "малин": "🫐", "вишн": "🍒",
    "клюкв": "🔴", "смородин": "🫐",
    "сушеное": "🥭", "замороженная": "❄️",
};

// ===== DOM =====
const $productsList = document.getElementById("products-list");
const $emptyState = document.getElementById("empty-state");
const $searchInput = document.getElementById("search-input");
const $categoriesBar = document.querySelector(".categories-bar");
const $cartItems = document.getElementById("cart-items");
const $cartEmpty = document.getElementById("cart-empty");
const $cartSummary = document.getElementById("cart-summary");
const $cartText = document.getElementById("cart-text");
const $cartTotalPrice = document.getElementById("cart-total-price");
const $cartBadge = document.getElementById("cart-badge");
const $whatsappBtn = document.getElementById("whatsapp-btn");
const $clearCartBtn = document.getElementById("clear-cart-btn");
const $loadingBanner = document.getElementById("loading-banner");
const $lastUpdateEl = document.getElementById("last-update");

// ===== УТИЛИТЫ =====
function formatPrice(price) {
    return price.toLocaleString("ru-KZ") + " ₸";
}

function getProductEmoji(name) {
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(PRODUCT_EMOJIS)) {
        if (lower.includes(key)) return emoji;
    }
    return "🛒";
}

// ===== ПАРСИНГ CSV =====
function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const nameIdx = headers.findIndex(h => h.includes("наименован"));
    const catIdx = headers.findIndex(h => h.includes("категор"));
    const priceIdx = headers.findIndex(h => h.includes("цена"));
    const saleIdx = headers.findIndex(h => h.includes("акц"));

    const products = [];
    for (let i = 1; i < lines.length; i++) {
        // Разбираем CSV с учётом кавычек
        const cols = parseCSVLine(lines[i]);
        if (!cols || cols.length < 3) continue;

        const name = (cols[nameIdx] || "").trim();
        const category = (cols[catIdx] || "").trim();
        const priceRaw = (cols[priceIdx] || "").trim().replace(/[^\d.]/g, "");
        const saleRaw = saleIdx >= 0 ? (cols[saleIdx] || "").trim().toLowerCase() : "no";

        if (!name || !category || !priceRaw) continue;

        products.push({
            id: i,
            name,
            category,
            price: parseInt(priceRaw, 10) || 0,
            sale: saleRaw === "yes",
        });
    }
    return products;
}

function parseCSVLine(line) {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
            result.push(cur);
            cur = "";
        } else {
            cur += ch;
        }
    }
    result.push(cur);
    return result;
}

// ===== ЗАГРУЗКА ИЗ GOOGLE SHEETS (только фоновое обновление) =====
async function fetchProductsFromSheets() {
    // Если URL не задан — работаем на встроенных данных
    if (!SHEET_CSV_URL) return false;

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
                        PRODUCTS = data;
                        updateLastUpdateDisplay(parseInt(cachedTime, 10));
                        return true;
                    }
                }
            }
        }
    } catch (e) {
        // localStorage может быть недоступен (file://, приватный режим) — просто продолжаем
        console.warn("localStorage недоступен:", e);
    }

    // Показываем индикатор загрузки
    if ($loadingBanner) $loadingBanner.style.display = "flex";

    try {
        const resp = await fetch(SHEET_CSV_URL + "&t=" + Date.now(), { cache: "no-store" });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const csv = await resp.text();
        const parsed = parseCSV(csv);
        if (parsed.length === 0) throw new Error("Пустой ответ");

        PRODUCTS = parsed;
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(PRODUCTS));
            localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch (e) { /* ignore */ }
        updateLastUpdateDisplay(Date.now());
        if ($loadingBanner) $loadingBanner.style.display = "none";
        return true;
    } catch (err) {
        console.warn("Google Sheets недоступен:", err);
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

// ===== ПОЛУЧЕНИЕ КАТЕГОРИЙ =====
function getCategories() {
    const cats = [...new Set(PRODUCTS.map(p => p.category))];
    return cats;
}

function hasSaleProducts() {
    return PRODUCTS.some(p => p.sale);
}

// ===== РЕНДЕР КАТЕГОРИЙ-ЧИПСОВ =====
function renderCategoryChips() {
    // Убираем всё кроме чипа "Все"
    const existingChips = $categoriesBar.querySelectorAll(".cat-chip:not([data-category='all'])");
    existingChips.forEach(c => c.remove());

    const cats = getCategories();

    // Сначала "Акция" если есть товары со скидкой
    if (hasSaleProducts()) {
        const saleChip = makeChip("sale", "🔥 Акция");
        $categoriesBar.appendChild(saleChip);
    }

    cats.forEach(cat => {
        const chip = makeChip(cat, (CATEGORY_EMOJIS[cat] || "📦") + " " + cat);
        $categoriesBar.appendChild(chip);
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

$categoriesBar.addEventListener("click", (e) => {
    const chip = e.target.closest(".cat-chip");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    syncActiveChip();
    renderProducts();
    $productsList.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ===== РЕНДЕР ТОВАРОВ =====
function renderProducts() {
    const query = $searchInput.value.trim().toLowerCase();
    let filtered = PRODUCTS;

    if (activeCategory === "sale") {
        filtered = filtered.filter(p => p.sale);
    } else if (activeCategory !== "all") {
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
        const inCart = qty > 0 ? " in-cart" : "";
        const hasValue = qty > 0 ? " has-value" : "";
        const saleBadge = p.sale ? `<span class="sale-badge">🔥 Акция</span>` : "";
        return `
            <div class="product-card${inCart}" data-id="${p.id}">
                <div class="product-emoji">${getProductEmoji(p.name)}</div>
                <div class="product-info">
                    <div class="product-name">${p.name} ${saleBadge}</div>
                    <div class="product-price">${formatPrice(p.price)}</div>
                </div>
                <div class="counter">
                    <button class="counter-btn minus" data-id="${p.id}" data-action="minus">−</button>
                    <span class="counter-val${hasValue}" data-id="${p.id}">${qty}</span>
                    <button class="counter-btn plus" data-id="${p.id}" data-action="plus">+</button>
                </div>
            </div>
        `;
    }).join("");
}

// ===== ОБРАБОТКА КЛИКОВ НА СЧЁТЧИКАХ =====
$productsList.addEventListener("click", (e) => {
    const btn = e.target.closest(".counter-btn");
    if (!btn) return;
    e.stopPropagation();

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === "plus") {
        cart[id] = (cart[id] || 0) + 1;
    } else if (action === "minus") {
        if (cart[id] && cart[id] > 0) {
            cart[id]--;
            if (cart[id] === 0) delete cart[id];
        }
    }

    // Обновление конкретной карточки без перерендера
    const card = btn.closest(".product-card");
    if (card) {
        const valSpan = card.querySelector(".counter-val");
        const qty = cart[id] || 0;
        valSpan.textContent = qty;
        valSpan.classList.toggle("has-value", qty > 0);
        card.classList.toggle("in-cart", qty > 0);
    }

    updateCartBadge();
});

// ===== БЕЙДЖ КОРЗИНЫ =====
function updateCartBadge() {
    const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
    if (totalItems > 0) {
        $cartBadge.style.display = "flex";
        $cartBadge.textContent = totalItems;
    } else {
        $cartBadge.style.display = "none";
    }
}

// ===== РЕНДЕР КОРЗИНЫ =====
function renderCart() {
    const items = Object.entries(cart)
        .map(([id, qty]) => {
            const product = PRODUCTS.find(p => p.id === Number(id));
            return product ? { ...product, qty } : null;
        })
        .filter(Boolean)
        .filter(item => item.qty > 0);

    if (items.length === 0) {
        $cartItems.innerHTML = "";
        $cartEmpty.style.display = "block";
        $cartSummary.style.display = "none";
        $whatsappBtn.style.display = "none";
        return;
    }

    $cartEmpty.style.display = "none";
    $cartSummary.style.display = "block";
    $whatsappBtn.style.display = "flex";

    $cartItems.innerHTML = items.map(item => `
        <div class="cart-item">
            <span class="cart-item-name">${getProductEmoji(item.name)} ${item.name}</span>
            <span class="cart-item-qty">×${item.qty}</span>
            <span class="cart-item-sum">${formatPrice(item.price * item.qty)}</span>
        </div>
    `).join("");

    const textLines = items.map(item => `${item.name} × ${item.qty}`);
    const totalPrice = items.reduce((s, item) => s + item.price * item.qty, 0);

    $cartText.textContent = textLines.join("\n");
    $cartTotalPrice.textContent = formatPrice(totalPrice);

    const waText = buildWhatsAppText(items, totalPrice);
    $whatsappBtn.href = `https://wa.me/${WA_PHONE}?text=${waText}`;
}

function buildWhatsAppText(items, totalPrice) {
    let text = "🛒 Заказ с GlobalShop:\n\n";
    items.forEach(item => {
        text += `${item.name} × ${item.qty}\n`;
    });
    text += `\nИтого: ${formatPrice(totalPrice)}`;
    return encodeURIComponent(text);
}

// ===== ОЧИСТИТЬ КОРЗИНУ =====
$clearCartBtn.addEventListener("click", () => {
    if (Object.keys(cart).length === 0) return;
    if (confirm("Очистить корзину?")) {
        Object.keys(cart).forEach(k => delete cart[k]);
        updateCartBadge();
        renderCart();
        renderProducts();
    }
});

// ===== НАВИГАЦИЯ =====
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const screenId = btn.dataset.screen;
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        document.getElementById(screenId).classList.add("active");
        if (screenId === "cart-screen") renderCart();
    });
});

// ===== ПОИСК =====
let searchTimeout;
$searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(renderProducts, 200);
});



// ===== АВТО-ОБНОВЛЕНИЕ РАЗ В ЧАС =====
function scheduleAutoRefresh() {
    setInterval(async () => {
        console.log("[GlobalShop] Авто-обновление данных...");
        const updated = await fetchProductsFromSheets();
        if (updated) {
            renderCategoryChips();
            renderProducts();
            if (document.getElementById("cart-screen").classList.contains("active")) {
                renderCart();
            }
        }
    }, REFRESH_INTERVAL_MS);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function init() {
    // 1. Мгновенно показываем каталог из встроенных данных
    renderCategoryChips();
    renderProducts();

    // 2. В фоне пробуем подгрузить актуальные данные из Google Sheets
    fetchProductsFromSheets().then(updated => {
        if (updated) {
            renderCategoryChips();
            renderProducts();
        }
    }).catch(() => {/* нет интернета — работаем с встроенными */ });

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

    // 5. Свайп для переключения категорий
    initSwipe();
}

// ===== СВАЙП — ПЕРЕКЛЮЧЕНИЕ КАТЕГОРИЙ ПО КРУГУ =====
function initSwipe() {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const MIN_X = 70;   // минимум px по горизонтали
    const MAX_YR = 0.6;  // вертикаль не больше 60% от горизонтали

    document.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
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

        // Собираем текущие чипсы в порядке DOM
        const chips = Array.from($categoriesBar.querySelectorAll(".cat-chip"));
        if (chips.length === 0) return;

        const currentIdx = chips.findIndex(c => c.dataset.category === activeCategory);
        const total = chips.length;
        let nextIdx;

        if (dx < 0) {
            // Свайп влево → следующая категория
            nextIdx = (currentIdx + 1) % total;
        } else {
            // Свайп вправо → предыдущая категория
            nextIdx = (currentIdx - 1 + total) % total;
        }

        const nextChip = chips[nextIdx];
        activeCategory = nextChip.dataset.category;
        syncActiveChip();
        renderProducts();

        // Прокручиваем выбранный чип в зону видимости
        nextChip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    }, { passive: true });

    document.addEventListener("touchcancel", () => { tracking = false; }, { passive: true });
}

init();
