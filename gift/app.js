const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRu5mT2Sp-4h6s0zgAr01ptQRPW61pVd_KH3II2Put7sQvmWwWDPPUzA3FtBBjrq8P5eMzGYdTS63Ok/pub?gid=0&single=true&output=csv";

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
const modal = document.getElementById("product-modal");
const modalImage = document.getElementById("modal-image");
const modalTitle = document.getElementById("modal-title");
const modalPrice = document.getElementById("modal-price");
const modalSize = document.getElementById("modal-size");
const modalDescription = document.getElementById("modal-description");
const modalComposition = document.getElementById("modal-composition");
const modalDimensions = document.getElementById("modal-dimensions");
const modalAction = document.getElementById("modal-action");
const modalPrev = document.getElementById("modal-prev");
const modalNext = document.getElementById("modal-next");
const modalCounter = document.getElementById("modal-counter");

let products = [];
let currentProduct = null;
let currentSlideIndex = 0;
let touchStartX = 0;
let touchDeltaX = 0;

function driveImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

function cleanText(value) {
    return (value || "").trim();
}

function normalizePrice(value) {
    const digits = cleanText(value).replace(/[^\d]/g, "");
    if (!digits) {
        return "Цена по запросу";
    }

    return `${new Intl.NumberFormat("ru-RU").format(Number(digits))} ₸`;
}

function splitComposition(value) {
    return cleanText(value)
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function prettifyAvailability(value) {
    const normalized = cleanText(value).toLowerCase();
    if (normalized === "in stock") {
        return "В наличии";
    }
    if (normalized === "out of stock") {
        return "Под заказ";
    }
    return cleanText(value) || "Уточняется";
}

function inferSizeFromPrice(priceValue) {
    const digits = Number(cleanText(priceValue).replace(/[^\d]/g, ""));
    if (!digits) {
        return "Подарочная корзина";
    }
    if (digits <= 16000) {
        return "Небольшая корзина";
    }
    if (digits <= 28000) {
        return "Средняя корзина";
    }
    return "Большая корзина";
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

    const collected = IMAGE_SUFFIXES
        .map((suffix) => {
            const imageId = DRIVE_IMAGE_MAP[`${row.id}${suffix}`];
            if (!imageId) {
                return null;
            }

            return {
                id: `${row.id}${suffix}`,
                src: driveImageUrl(imageId)
            };
        })
        .filter(Boolean);

    return collected;
}

function parseCsvLine(line) {
    const cells = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
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

function mapRowToProduct(row) {
    const composition = splitComposition(row.sostav || row.composition);
    const images = buildImages(row);
    const size = cleanText(row.size) || inferSizeFromPrice(row.price);
    const availability = prettifyAvailability(row.availability);

    return {
        id: cleanText(row.id),
        name: cleanText(row.name) || `Корзина ${cleanText(row.id)}`,
        price: normalizePrice(row.price),
        size,
        dimensions: cleanText(row.dimensions) || `${size}. Статус: ${availability}.`,
        description: cleanText(row.opisanie || row.description) || "Состав и детали можно открыть внутри карточки.",
        composition,
        compositionPreview: composition.slice(0, 4).join(", "),
        availability,
        images
    };
}

function createCard(product) {
    const article = document.createElement("article");
    article.className = "product-card";
    article.id = `product-${product.id}`;

    article.innerHTML = `
        <div class="product-card__media">
            <span class="product-card__tag">${product.size}</span>
            <img src="${product.images[0]?.src || ""}" alt="${product.name} — фруктовая корзина GlobalFruit" loading="lazy">
        </div>
        <div class="product-card__body">
            <div class="product-card__head">
                <div>
                    <span class="product-card__number">${product.id}</span>
                    <h2 class="product-card__title">${product.name}</h2>
                    <p class="product-card__price">${product.price}</p>
                </div>
            </div>

            <p class="product-card__description">${product.description}</p>

            <div class="product-card__meta">
                <div class="product-card__meta-item">
                    <span>Размер</span>
                    <strong>${product.size}</strong>
                </div>
                <div class="product-card__meta-item">
                    <span>Наличие</span>
                    <strong>${product.availability}</strong>
                </div>
            </div>

            <div class="product-card__footer">
                <p class="product-card__preview">${product.compositionPreview || "Откройте pop-up, чтобы увидеть весь состав."}</p>
                <button class="product-card__button" type="button" data-product-id="${product.id}">
                    Открыть состав
                </button>
            </div>
        </div>
    `;

    return article;
}

function renderCatalog(items) {
    catalogList.innerHTML = "";
    const fragment = document.createDocumentFragment();

    items.forEach((product) => {
        fragment.appendChild(createCard(product));
    });

    catalogList.appendChild(fragment);
    setupReveal();
}

function updateModalSlide() {
    if (!currentProduct || !currentProduct.images.length) {
        return;
    }

    const image = currentProduct.images[currentSlideIndex];
    modalImage.src = image.src;
    modalImage.alt = `${currentProduct.name} — фото ${currentSlideIndex + 1}`;

    const multipleImages = currentProduct.images.length > 1;
    modalPrev.classList.toggle("is-hidden", !multipleImages);
    modalNext.classList.toggle("is-hidden", !multipleImages);
    modalCounter.classList.toggle("is-hidden", !multipleImages);
    modalCounter.textContent = `${currentSlideIndex + 1} / ${currentProduct.images.length}`;
}

function changeSlide(step) {
    if (!currentProduct || currentProduct.images.length < 2) {
        return;
    }

    currentSlideIndex = (currentSlideIndex + step + currentProduct.images.length) % currentProduct.images.length;
    updateModalSlide();
}

function openModal(productId) {
    currentProduct = products.find((item) => item.id === productId);
    if (!currentProduct) {
        return;
    }

    currentSlideIndex = 0;
    modalTitle.textContent = currentProduct.name;
    modalPrice.textContent = currentProduct.price;
    modalSize.textContent = `${currentProduct.id} · ${currentProduct.size}`;
    modalDescription.textContent = currentProduct.description;
    modalDimensions.textContent = currentProduct.dimensions;
    modalComposition.innerHTML = currentProduct.composition.map((item) => `<li>${item}</li>`).join("");
    modalAction.href = `https://wa.me/77780878211?text=${encodeURIComponent(`Здравствуйте! Хочу узнать подробнее про корзину ${currentProduct.id} — ${currentProduct.name}.`)}`;

    updateModalSlide();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
}

function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    currentProduct = null;
    currentSlideIndex = 0;
}

function setupReveal() {
    const cards = document.querySelectorAll(".product-card");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18 });

    cards.forEach((card) => observer.observe(card));
}

function setStatus(message, hidden = false) {
    catalogStatus.textContent = message;
    catalogStatus.classList.toggle("is-hidden", hidden);
}

async function loadCatalog() {
    try {
        setStatus("Загружаю корзины из Google Sheets...");
        const response = await fetch(CSV_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`CSV request failed with ${response.status}`);
        }

        const text = await response.text();
        const rows = parseCsv(text);
        products = rows
            .map(mapRowToProduct)
            .filter((item) => item.id && item.name && item.images.length);

        if (!products.length) {
            throw new Error("No valid products found in CSV");
        }

        renderCatalog(products);
        setStatus("", true);
    } catch (error) {
            console.error("[GlobalFruit Gift] Catalog load error:", error);
        setStatus("Не получилось загрузить каталог из таблицы. Проверьте доступ к CSV и ссылки на изображения.");
    }
}

function setupEvents() {
    document.addEventListener("click", (event) => {
        const openButton = event.target.closest("[data-product-id]");
        if (openButton) {
            openModal(openButton.dataset.productId);
            return;
        }

        if (event.target.closest("[data-close-modal]")) {
            closeModal();
        }
    });

    modalPrev.addEventListener("click", () => changeSlide(-1));
    modalNext.addEventListener("click", () => changeSlide(1));

    modalImage.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].clientX;
        touchDeltaX = 0;
    }, { passive: true });

    modalImage.addEventListener("touchmove", (event) => {
        touchDeltaX = event.changedTouches[0].clientX - touchStartX;
    }, { passive: true });

    modalImage.addEventListener("touchend", () => {
        if (Math.abs(touchDeltaX) < 40) {
            return;
        }

        if (touchDeltaX < 0) {
            changeSlide(1);
        } else {
            changeSlide(-1);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!modal.classList.contains("is-open")) {
            return;
        }

        if (event.key === "Escape") {
            closeModal();
        }

        if (event.key === "ArrowLeft") {
            changeSlide(-1);
        }

        if (event.key === "ArrowRight") {
            changeSlide(1);
        }
    });
}

setupEvents();
loadCatalog();
