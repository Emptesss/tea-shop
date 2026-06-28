// ========================
// КЛИЕНТСКИЙ КОД ДЛЯ СТРАНИЦЫ ТОВАРА
// ========================
window._currentProductId = null;

// Загрузка товара при открытии страницы
document.addEventListener('DOMContentLoaded', function() {
    loadProduct();
    setupReviewForm(); // Настраиваем форму отзыва сразу
    setupPasswordToggles();
});

// ========================
// ЗАГРУЗКА ТОВАРА
// ========================
async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    
    if (!slug) {
        console.error('Нет slug в URL');
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${slug}`);
        if (!response.ok) {
            console.error('Ошибка загрузки товара:', response.status);
            return;
        }
        
        const product = await response.json();
        window._currentProductId = product.id;
        renderProductData(product);

        const infoEl = document.querySelector('.product-info');
        if (infoEl) { infoEl.style.transition = 'opacity 0.3s ease'; infoEl.style.opacity = '1'; }
        const footerEl = document.querySelector('.footer');
        if (footerEl) { footerEl.style.transition = 'opacity 0.3s ease'; footerEl.style.opacity = '1'; }

        // Загружаем отзывы после получения ID товара
        loadReviews(product.id);
        
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
    }
}

function renderProductData(product) {
    // Название
    const titleEl = document.querySelector('.product-title');
    if (titleEl) titleEl.textContent = product.name;
    
    // Хлебные крошки
    const crumbEl = document.querySelector('.breadcrumbs-current');
    if (crumbEl) crumbEl.textContent = product.name;
    document.title = product.name + ' — Forest Tea';
    
    // Изображения
    const images = [];
    if (product.image1) images.push(product.image1);
    if (product.image2) images.push(product.image2);
    if (images.length === 0) images.push('pictures/placeholder.jpg');
    
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg && images.length > 0) {
        mainImg.src = images[0];
        mainImg.alt = product.name;
        mainImg.style.display = '';
    }
    
    // Сохраняем изображения для галереи
    window.productImages = images;
    
    // Миниатюры и кнопки навигации
    const thumbsEl = document.querySelector('.gallery-thumbnails');
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');

    if (images.length > 1) {
        if (thumbsEl) {
            thumbsEl.innerHTML = images.map((img, i) => `
                <button class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                    <img src="${img}" alt="Фото ${i+1}" class="gallery-thumb-img">
                </button>
            `).join('');
            thumbsEl.style.display = 'flex';

            thumbsEl.querySelectorAll('.gallery-thumb img').forEach(img => {
                img.onerror = function() {
                    this.closest('.gallery-thumb').remove();
                    const remaining = thumbsEl.querySelectorAll('.gallery-thumb').length;
                    if (remaining <= 1) {
                        thumbsEl.style.display = 'none';
                        if (prevBtn) prevBtn.style.display = 'none';
                        if (nextBtn) nextBtn.style.display = 'none';
                    }
                };
            });
        }
        if (prevBtn) prevBtn.style.display = '';
        if (nextBtn) nextBtn.style.display = '';
        setTimeout(() => setupGalleryListeners(), 100);
    } else {
        if (thumbsEl) { thumbsEl.innerHTML = ''; thumbsEl.style.display = 'none'; }
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
    
    // Бейджи (левый верхний угол)
    const badgesEl = document.querySelector('.gallery-badges');
    if (badgesEl) {
        let badgesHtml = '';
        if (product.purchase_count >= 200 && product.rating >= 4.5) {
            badgesHtml += '<span class="gallery-badge bestseller">Хит продаж</span>';
        }
        if (product.year === 2026) {
            badgesHtml += '<span class="gallery-badge" style="background: #337B57;">Новинка</span>';
        }
        if (product.in_stock) {
            badgesHtml += '<span class="gallery-badge in-stock">В наличии</span>';
        } else {
            badgesHtml += '<span class="gallery-badge" style="background: #0D2719;">Нет в наличии</span>';
        }
        badgesEl.innerHTML = badgesHtml;
    }

    // Бейдж скидки — правый верхний угол, зелёный кружок (как в каталоге)
    const galleryMain = document.querySelector('.gallery-main');
    let galleryDiscountBadge = document.querySelector('.gallery-main .discount-badge');
    if (!galleryDiscountBadge && galleryMain) {
        galleryDiscountBadge = document.createElement('div');
        galleryDiscountBadge.className = 'discount-badge';
        galleryMain.appendChild(galleryDiscountBadge);
    }
    if (galleryDiscountBadge) {
        if (product.old_price && product.old_price > product.price) {
            const discount = Math.round((1 - product.price / product.old_price) * 100);
            galleryDiscountBadge.textContent = `-${discount}%`;
            galleryDiscountBadge.style.display = 'flex';
        } else {
            galleryDiscountBadge.style.display = 'none';
        }
    }
    
    // Рейтинг (динамический из отзывов)
// Рейтинг (динамический из отзывов)
const rating = parseFloat(product.rating) || 0;
const reviewsCount = parseInt(product.reviews_count) || 0;

// Всегда показываем 5 звёзд (заполненные + пустые)
const fullStars = Math.floor(rating);
const hasHalfStar = rating - fullStars >= 0.5;
const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

const starsEl = document.querySelector('.product-stars');
if (starsEl) {
    let starsHtml = '';
    
    if (rating > 0) {
        // Есть рейтинг — показываем заполненные звёзды
        starsHtml += Array(fullStars).fill('<img src="pictures/star-filled.png" alt="★" class="star-icon-static">').join('');
        if (hasHalfStar) {
            // Если есть картинка половинчатой звезды
            starsHtml += '<img src="pictures/star-half.png" alt="½" class="star-icon-static">';
        }
        starsHtml += Array(emptyStars).fill('<img src="pictures/star-empty.png" alt="☆" class="star-icon-static">').join('');
    } else {
        // Нет рейтинга — показываем только пустые звёзды
        starsHtml = Array(5).fill('<img src="pictures/star-empty.png" alt="☆" class="star-icon-static">').join('');
    }
    
    starsEl.innerHTML = starsHtml;
}

const ratingText = document.querySelector('.product-rating-text');
if (ratingText) {
    if (reviewsCount > 0) {
        const reviewWord = getReviewWord(reviewsCount);
        ratingText.textContent = `${rating.toFixed(1)} (${reviewsCount} ${reviewWord})`;
    } else {
        ratingText.textContent = '0.0 (нет отзывов)';
    }
}
    
    // Мета-теги
    const metaEl = document.querySelector('.product-meta');
    if (metaEl) {
        let metaHtml = '';
        if (product.country) metaHtml += `<span class="product-meta-tag">${product.country}</span>`;
        if (product.year) metaHtml += `<span class="product-meta-tag">${product.year}</span>`;
        if (product.class) metaHtml += `<span class="product-meta-tag">${product.class}</span>`;
        if (product.tea_type) metaHtml += `<span class="product-meta-tag">${product.tea_type}</span>`;
        if (product.tastes && product.tastes.length > 0) {
            product.tastes.forEach(t => {
                metaHtml += `<span class="product-meta-tag">${t.name}</span>`;
            });
        }
        metaEl.innerHTML = metaHtml;
    }
    
    // Краткое описание
    const shortDesc = document.querySelector('.product-short-desc');
    if (shortDesc) shortDesc.textContent = product.short_desc || '';
    
        // Цена и старая цена
    const priceEl = document.querySelector('.product-price');
    const oldPriceEl = document.querySelector('.product-old-price');
    const discountBadgeEl = document.querySelector('.product-discount-badge');
    
    if (priceEl) {
        priceEl.textContent = product.price + ' Br';
    }
    
    // Старая цена (зачёркнутая)
    if (oldPriceEl) {
        if (product.old_price && product.old_price > product.price) {
            oldPriceEl.textContent = product.old_price + ' Br';
            oldPriceEl.style.display = 'inline';
        } else {
            oldPriceEl.style.display = 'none';
        }
    }
    
    // Бейдж скидки в процентах
    if (discountBadgeEl) {
        if (product.old_price && product.old_price > product.price) {
            const discount = Math.round((1 - product.price / product.old_price) * 100);
            discountBadgeEl.textContent = '-' + discount + '%';
            discountBadgeEl.style.display = 'inline-block';
        } else {
            discountBadgeEl.style.display = 'none';
        }
    }
    
    // Характеристики
    const charsEl = document.querySelector('.product-characteristics');
    if (charsEl) {
        let charsHtml = '';
        if (product.country) charsHtml += `<div class="char-row"><span class="char-label">Страна</span><span class="char-value">${product.country}</span></div>`;
        if (product.year) charsHtml += `<div class="char-row"><span class="char-label">Год сбора</span><span class="char-value">${product.year}</span></div>`;
        if (product.tea_type) charsHtml += `<div class="char-row"><span class="char-label">Вид чая</span><span class="char-value">${product.tea_type}</span></div>`;
        if (product.tastes && product.tastes.length > 0) {
            const tasteNames = product.tastes.map(t => t.name).join(', ');
            charsHtml += `<div class="char-row"><span class="char-label">Вкус</span><span class="char-value">${tasteNames}</span></div>`;
        }
        if (product.temperature) charsHtml += `<div class="char-row"><span class="char-label">Температура воды</span><span class="char-value">${product.temperature}</span></div>`;
        if (product.brewing_time) charsHtml += `<div class="char-row"><span class="char-label">Время заваривания</span><span class="char-value">${product.brewing_time}</span></div>`;
        if (product.caffeine) charsHtml += `<div class="char-row"><span class="char-label">Кофеин</span><span class="char-value">${product.caffeine}</span></div>`;
        if (product.class) charsHtml += `<div class="char-row"><span class="char-label">Класс</span><span class="char-value">${product.class}</span></div>`;
        if (product.shelf_life) charsHtml += `<div class="char-row"><span class="char-label">Срок хранения</span><span class="char-value">${product.shelf_life}</span></div>`;
        charsEl.innerHTML = charsHtml;
    }
    
    // Полное описание
    if (product.full_desc) {
        const descTab = document.querySelector('#tab-description .product-description');
        if (descTab) {
            descTab.innerHTML = '<h3>О товаре</h3>' + product.full_desc.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
        }
    }
    
    // Похожие товары
    if (product.similar_products && product.similar_products.length > 0) {
        const similarEl = document.querySelector('.cards-row');
        if (similarEl) {
            similarEl.innerHTML = product.similar_products.map(p => createSimilarCard(p)).join('');
            setupSimilarCardsListeners();
        }
    }
    
    // Кнопка "В корзину"
    const cartBtn = document.querySelector('.product-add-to-cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            const qty = parseInt(document.querySelector('.product-qty-value').textContent);
            addToCartApi(product.id, qty, this);
        });
    }
    
    // Избранное
    const favBtn = document.querySelector('.product-favorite-btn');
if (favBtn) {
    favBtn.dataset.productId = product.id;
    // ✅ НЕ добавляем addEventListener — HTML уже имеет onclick="toggleFavorite(this)"
}
    
    // Проверяем статус избранного
    checkFavoriteStatus(product.id);
}

// ========================
// ГАЛЕРЕЯ
// ========================
// ========================
// ГАЛЕРЕЯ
// ========================
function setupGalleryListeners() {
    const thumbs = document.querySelectorAll('.gallery-thumb');
    const mainImg = document.getElementById('mainProductImage');
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    let currentIndex = 0;
    
    // Получаем изображения из атрибутов миниатюр, а не из глобальной переменной
    const images = [];
    thumbs.forEach(thumb => {
        const img = thumb.querySelector('img');
        if (img && img.src) {
            images.push(img.src);
        }
    });
    
    // Если миниатюр нет, пробуем взять из глобальной переменной
    if (images.length === 0 && window.productImages && window.productImages.length > 0) {
        window.productImages.forEach(img => images.push(img));
    }
    
    function updateGallery(index) {
        if (images.length === 0) return;
        currentIndex = index;
        mainImg.src = images[index];
        thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
    }

    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = parseInt(thumb.dataset.index);
            if (!isNaN(index)) {
                updateGallery(index);
            }
        });
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (images.length > 0) {
                updateGallery((currentIndex - 1 + images.length) % images.length);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (images.length > 0) {
                updateGallery((currentIndex + 1) % images.length);
            }
        });
    }
}

// ========================
// КОЛИЧЕСТВО ТОВАРА
// ========================
document.addEventListener('DOMContentLoaded', function() {
    const qtyValue = document.querySelector('.product-qty-value');
    const qtyPlus = document.querySelector('.product-qty-selector .product-qty-btn:last-child');
    const qtyMinus = document.querySelector('.product-qty-selector .product-qty-btn:first-child');

    if (qtyPlus && qtyValue) {
        qtyPlus.addEventListener('click', () => {
            let val = parseInt(qtyValue.textContent);
            if (val < 99) qtyValue.textContent = val + 1;
        });
    }

    if (qtyMinus && qtyValue) {
        qtyMinus.addEventListener('click', () => {
            let val = parseInt(qtyValue.textContent);
            if (val > 1) qtyValue.textContent = val - 1;
        });
    }

    // Опции выбора
    document.querySelectorAll('.option-buttons').forEach(group => {
        group.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    });

    // Табы
    document.querySelectorAll('.product-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.product-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const targetTab = document.getElementById('tab-' + this.dataset.tab);
            if (targetTab) targetTab.classList.add('active');
        });
    });
});

// ========================
// ИЗБРАННОЕ
// ========================
async function toggleFavorite(btn) {
    const productId = btn.dataset.productId || window._currentProductId;
    const token = localStorage.getItem('token');
    
    if (!productId) return;
    
    if (!token) {
        // Гостевой режим
        btn.classList.toggle('active');
        const img = btn.querySelector('img');
        if (img) {
            img.src = btn.classList.contains('active') ? 'pictures/love.png' : 'pictures/heart-empty.png';
        }
        // Сохраняем в localStorage
        if (btn.classList.contains('active')) {
            saveLocalFavorite(productId);
        } else {
            removeLocalFavorite(productId);
        }
        return;
    }
    
    const isActive = btn.classList.contains('active');
    
    try {
        if (isActive) {
            await fetch(`/api/favorites/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            btn.classList.remove('active');
            const img = btn.querySelector('img');
            if (img) img.src = 'pictures/heart-empty.png';
        } else {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId })
            });
            btn.classList.add('active');
            const img = btn.querySelector('img');
            if (img) img.src = 'pictures/love.png';
        }
    } catch (e) {
        console.error('Ошибка избранного:', e);
    }
}

async function checkFavoriteStatus(productId) {
    const token = localStorage.getItem('token');
    const favBtn = document.querySelector('.product-favorite-btn');
    if (!favBtn) return;
    
    if (!token) {
        const favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
        // ✅ Сравниваем как числа
        if (favs.map(Number).includes(Number(productId))) {
            favBtn.classList.add('active');
            const img = favBtn.querySelector('img');
            if (img) img.src = 'pictures/love.png';
        }
        return;
    }
    
    try {
        const res = await fetch(`/api/favorites/check/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.inFavorites) {
            favBtn.classList.add('active');
            const img = favBtn.querySelector('img');
            if (img) img.src = 'pictures/love.png';
        }
    } catch (e) {
        console.error('Ошибка проверки избранного:', e);
    }
}

function saveLocalFavorite(productId) {
    let favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    const numId = Number(productId);
    // ✅ Проверяем по числам
    if (!favs.map(Number).includes(numId)) favs.push(numId);
    localStorage.setItem('localFavorites', JSON.stringify(favs));
    console.log('Добавлено в избранное:', numId, 'Все:', favs); // для отладки
}
function removeLocalFavorite(productId) {
    let favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    const numId = Number(productId);
    favs = favs.filter(id => Number(id) !== numId);
    localStorage.setItem('localFavorites', JSON.stringify(favs));
    console.log('Удалено из избранного:', numId, 'Осталось:', favs); // для отладки
}

// ========================
// КОРЗИНА
// ========================
async function addToCartApi(productId, quantity, button) {
    try {
        const token = localStorage.getItem('token');
        const body = { productId, quantity };
        let sessionId = localStorage.getItem('cartSessionId');
        if (!sessionId) {
            sessionId = 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('cartSessionId', sessionId);
        }
        body.sessionId = sessionId;
        
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        
        if (res.ok) {
            const originalText = button.textContent;
            button.textContent = 'Добавлено!';
            button.style.opacity = '0.7';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.opacity = '1';
            }, 1000);
        }
    } catch (e) {
        console.error('Ошибка добавления в корзину:', e);
    }
}

// ========================
// ПОХОЖИЕ ТОВАРЫ
// ========================
function createSimilarCard(p) {
    const isSet = (p.category_name || '').toLowerCase().includes('набор');
    const priceUnit = isSet ? '' : '<span class="card-price-unit">/ 50 г</span>';

    // Расчёт скидки
    let discountBadge = '';
    if (p.old_price && p.old_price > p.price) {
        const discount = Math.round((1 - p.price / p.old_price) * 100);
        discountBadge = `<div class="discount-badge">-${discount}%</div>`;
    }

    const oldPriceHtml = p.old_price
        ? `<span class="card-old-price">${p.old_price} Br</span>`
        : '';
    
    return `
        <div class="product-card" data-product-id="${p.id}">
            <div class="stock-badge in-stock">В наличии</div>
            <div class="card-image-wrapper">
                ${discountBadge}
                <img src="${p.image1 || 'pictures/placeholder.jpg'}" alt="${p.name}" class="card-image">
            </div>
            <div class="card-badge">Купили <span class="purchase-count">${p.purchase_count || 0}</span> раз</div>
            <div class="card-body">
                <a href="product.html?slug=${p.slug}" class="card-name-link"><div class="card-name">${p.name}</div></a>
                <a href="product.html?slug=${p.slug}" class="card-desc-link"><div class="card-desc">${p.short_desc || ''}</div></a>
                <div class="card-price">${p.price} Br ${priceUnit}${oldPriceHtml}</div>
                <div class="qty-label">Выберите количество:</div>
                <div class="qty-selector">
                    <button class="qty-btn minus">−</button><span class="qty-value">1</span><button class="qty-btn plus">+</button>
                </div>
                <div class="card-bottom-row">
                    <button class="card-btn add-to-cart-btn">В корзину</button>
                    <button class="card-favorite-bottom"><img src="pictures/heart-empty.png" class="card-favorite-bottom-img"></button>
                </div>
            </div>
        </div>`;
}

function setupSimilarCardsListeners() {
    // Кнопки количества
    document.querySelectorAll('.cards-row .qty-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const selector = this.closest('.qty-selector');
            const valueEl = selector.querySelector('.qty-value');
            let value = parseInt(valueEl.textContent);
            if (this.classList.contains('plus')) value = Math.min(value + 1, 99);
            else value = Math.max(value - 1, 1);
            valueEl.textContent = value;
        });
    });
    
    // Кнопки "В корзину"
    document.querySelectorAll('.cards-row .add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.product-card');
            const productId = card.dataset.productId;
            const quantity = parseInt(card.querySelector('.qty-value').textContent);
            addToCartApi(productId, quantity, this);
        });
    });
    
    // Кнопки избранного
    document.querySelectorAll('.cards-row .card-favorite-bottom').forEach(btn => {
        btn.addEventListener('click', async function() {
            const card = this.closest('.product-card');
            const productId = card?.dataset.productId;
            const token = localStorage.getItem('token');
            
            if (!productId) return;
            
            if (!token) {
                this.classList.toggle('active');
                const img = this.querySelector('img');
                if (!img) return;
                if (this.classList.contains('active')) {
                    img.src = 'pictures/love.png';
                    saveLocalFavorite(productId);
                } else {
                    img.src = 'pictures/heart-empty.png';
                    removeLocalFavorite(productId);
                }
                return;
            }
            
            const isActive = this.classList.contains('active');
            
            try {
                if (isActive) {
                    await fetch(`/api/favorites/${productId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    this.classList.remove('active');
                    this.querySelector('img').src = 'pictures/heart-empty.png';
                } else {
                    await fetch('/api/favorites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ productId })
                    });
                    this.classList.add('active');
                    this.querySelector('img').src = 'pictures/love.png';
                }
            } catch (e) {
                console.error('Ошибка избранного:', e);
            }
        });
    });
    
    // Эффект лупы
    document.querySelectorAll('.cards-row .card-image-wrapper').forEach(wrapper => {
        const img = wrapper.querySelector('.card-image');
        if (!img) return;
        
        wrapper.addEventListener('mouseenter', () => wrapper.classList.add('panning'));
        wrapper.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            img.style.transformOrigin = `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`;
            img.style.transform = 'scale(1.4)';
        });
        wrapper.addEventListener('mouseleave', () => {
            wrapper.classList.remove('panning');
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center center';
        });
    });
}

// ========================
// ОТЗЫВЫ
// ========================
async function loadReviews(productId) {
    if (!productId) {
        console.error('Нет productId для загрузки отзывов');
        return;
    }
    
    try {
        const res = await fetch(`/api/reviews/${productId}`);
        if (!res.ok) {
            console.error('Ошибка загрузки отзывов:', res.status);
            return;
        }
        const data = await res.json();
        renderReviews(data.reviews);
    } catch (e) {
        console.error('Ошибка загрузки отзывов:', e);
    }
}

function renderReviews(reviews) {
    const container = document.querySelector('.reviews-list');
    if (!container) {
        console.error('Контейнер .reviews-list не найден');
        return;
    }
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px;">Пока нет отзывов. Будьте первым!</p>';
        return;
    }
    
    container.innerHTML = reviews.map(r => {
        const date = new Date(r.created_at);
        const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
        const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        const firstLetter = r.author_name ? r.author_name.charAt(0).toUpperCase() : '?';
        
        let avatarHtml;
        if (r.author_avatar && r.author_avatar !== 'pictures/cat.png' && r.author_avatar.startsWith('/')) {
            avatarHtml = `<img src="${r.author_avatar}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" alt="${r.author_name}">`;
        } else {
            avatarHtml = `<div style="width:44px;height:44px;border-radius:50%;background:#34495e;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">${firstLetter}</div>`;
        }
        
        return `
        <div class="review-card">
            <div class="review-header">
                <div class="review-author-avatar">${avatarHtml}</div>
                <div class="review-author-info">
                    <span class="review-author-name">${r.author_name || 'Пользователь'}</span>
                    <span class="review-date">${dateStr}</span>
                </div>
                <div class="review-stars">
                    ${'<img src="pictures/star-filled.png" class="star-icon-static">'.repeat(r.rating || 0)}
                    ${'<img src="pictures/star-empty.png" class="star-icon-static">'.repeat(5 - (r.rating || 0))}
                </div>
            </div>
            <div class="review-body">
                ${r.title ? `<h4>${r.title}</h4>` : ''}
                <p>${r.content}</p>
            </div>
            <div class="review-footer">
                <button class="review-helpful-btn" onclick="markHelpful(${r.id}, this)">Полезно (${r.helpful_count || 0})</button>
            </div>
        </div>`;
    }).join('');
    
    // Обновляем счетчик на вкладке
    const reviewsTab = document.querySelector('.product-tab[data-tab="reviews"]');
    if (reviewsTab) {
        reviewsTab.textContent = `Отзывы (${reviews.length})`;
    }
    if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    const starsEl = document.querySelector('.product-stars');
    if (starsEl) {
        let starsHtml = '';
        starsHtml += Array(fullStars).fill('<img src="pictures/star-filled.png" alt="★" class="star-icon-static">').join('');
        if (hasHalfStar) starsHtml += '<img src="pictures/star-half.png" alt="½" class="star-icon-static">';
        starsHtml += Array(emptyStars).fill('<img src="pictures/star-empty.png" alt="☆" class="star-icon-static">').join('');
        starsEl.innerHTML = starsHtml;
    }
    
    const ratingText = document.querySelector('.product-rating-text');
    if (ratingText) {
        const reviewWord = getReviewWord(reviews.length);
        ratingText.textContent = `${avgRating.toFixed(1)} (${reviews.length} ${reviewWord})`;
    }
} else {
    // Нет отзывов — показываем 0
    const starsEl = document.querySelector('.product-stars');
    if (starsEl) {
        starsEl.innerHTML = Array(5).fill('<img src="pictures/star-empty.png" alt="☆" class="star-icon-static">').join('');
    }
    
    const ratingText = document.querySelector('.product-rating-text');
    if (ratingText) {
        ratingText.textContent = '0.0 (нет отзывов)';
    }
}
}

window.markHelpful = async function(reviewId, btn) {
    try {
        const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            btn.textContent = `Полезно (${data.helpfulCount})`;
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
    } catch (e) {
        console.error('Ошибка:', e);
    }
};

// ========================
// ФОРМА ОТЗЫВА
// ========================
function setupReviewForm() {
    const reviewForm = document.getElementById('productReviewForm');
    
    if (!reviewForm) {
        console.error('❌ Форма отзыва не найдена (productReviewForm)');
        return;
    }
    
    console.log('✅ Форма отзыва найдена, настраиваю обработчик');
    
    // Удаляем старый обработчик если был
    const newForm = reviewForm.cloneNode(true);
    reviewForm.parentNode.replaceChild(newForm, reviewForm);
    
    // Настраиваем звезды
    const starsInput = newForm.querySelector('#starsInput');
    const ratingHidden = newForm.querySelector('#review-rating');
    
    if (starsInput && ratingHidden) {
        const starBtns = starsInput.querySelectorAll('.star-btn');
        
        starBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.dataset.value);
                ratingHidden.value = value;
                console.log('⭐ Выбрана оценка:', value);
                
                starBtns.forEach(b => {
                    const starValue = parseInt(b.dataset.value);
                    const img = b.querySelector('.star-icon');
                    if (img) {
                        img.src = starValue <= value ? img.dataset.filled : img.dataset.empty;
                    }
                });
            });
            
            // Эффект при наведении
            btn.addEventListener('mouseenter', () => {
                const hoverValue = parseInt(btn.dataset.value);
                starBtns.forEach(b => {
                    const starValue = parseInt(b.dataset.value);
                    const img = b.querySelector('.star-icon');
                    if (img) {
                        img.src = starValue <= hoverValue ? img.dataset.filled : img.dataset.empty;
                    }
                });
            });
            
            btn.addEventListener('mouseleave', () => {
                const currentValue = parseInt(ratingHidden.value) || 0;
                starBtns.forEach(b => {
                    const starValue = parseInt(b.dataset.value);
                    const img = b.querySelector('.star-icon');
                    if (img) {
                        img.src = starValue <= currentValue ? img.dataset.filled : img.dataset.empty;
                    }
                });
            });
        });
    }
    
    // Основной обработчик отправки
        // Основной обработчик отправки
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Форма отправлена');
        
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Чтобы оставить отзыв, войдите в аккаунт');
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
            return;
        }
        
        const rating = parseInt(document.getElementById('review-rating').value) || 0;
        const title = document.getElementById('review-title')?.value || '';
        const content = document.getElementById('review-text')?.value || '';
        const productId = window._currentProductId;
        
        console.log('Данные формы:', { rating, title, content, productId });
        
        if (!rating || rating === 0) {
            alert('Пожалуйста, поставьте оценку');
            return;
        }
        
        if (!content || content.trim() === '') {
            alert('Пожалуйста, напишите текст отзыва');
            return;
        }
        
        if (!productId) {
            alert('Ошибка: товар не определен');
            return;
        }
        
        // Блокируем кнопку на время отправки
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
        }
        
        try {
            console.log('📤 Отправляю запрос на /api/reviews');
            
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId,
                    rating,
                    title,
                    content
                })
            });
            
            const data = await res.json();
            console.log('📥 Ответ сервера:', data);
            
            if (res.ok) {
                alert('✅ Спасибо за отзыв!');
                
                // Очищаем форму
                this.reset();
                document.getElementById('review-rating').value = '0';
                
                // Сбрасываем звезды
                document.querySelectorAll('#starsInput .star-icon').forEach(img => {
                    img.src = img.dataset.empty || 'pictures/star-empty.png';
                });
                
                // Перезагружаем отзывы (рейтинг обновится автоматически)
                await loadReviews(productId);
                
                // Обновляем рейтинг из БД
                try {
                    const slug = new URLSearchParams(window.location.search).get('slug');
                    if (slug) {
                        const productRes = await fetch(`/api/products/${slug}`);
                        if (productRes.ok) {
                            const updatedProduct = await productRes.json();
                            const rating = parseFloat(updatedProduct.rating) || 0;
const reviewsCount = parseInt(updatedProduct.reviews_count) || 0;

// Всегда показываем 5 звёзд
const fullStars = Math.floor(rating);
const emptyStars = 5 - fullStars;

const starsEl = document.querySelector('.product-stars');
if (starsEl) {
    if (rating > 0) {
        starsEl.innerHTML = 
            Array(fullStars).fill('<img src="pictures/star-filled.png" alt="★" class="star-icon-static">').join('') +
            Array(emptyStars).fill('<img src="pictures/star-empty.png" alt="☆" class="star-icon-static">').join('');
    } else {
        starsEl.innerHTML = Array(5).fill('<img src="pictures/star-empty.png" alt="☆" class="star-icon-static">').join('');
    }
}

const ratingText = document.querySelector('.product-rating-text');
if (ratingText) {
    if (reviewsCount > 0) {
        const reviewWord = getReviewWord(reviewsCount);
        ratingText.textContent = `${rating.toFixed(1)} (${reviewsCount} ${reviewWord})`;
    } else {
        ratingText.textContent = '0.0 (нет отзывов)';
    }
}
                        }
                    }
                } catch (e) {
                    console.error('Ошибка обновления рейтинга:', e);
                }
            } else {
                alert('❌ Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('❌ Ошибка отправки отзыва:', error);
            alert('Ошибка соединения с сервером. Проверьте консоль.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить отзыв';
            }
        }
    });
    
    console.log('✅ Обработчик формы отзыва настроен');
}

// ========================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================
function setupPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.closest('#loginModal')) return; // Пропускаем модальное окно
        
        if (input.parentNode.querySelector('.password-toggle')) return;
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'password-toggle';
        btn.innerHTML = '<img src="pictures/nevidimo.png" alt="Показать пароль" class="password-toggle-img">';
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(btn);
        
        btn.addEventListener('click', () => {
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            btn.querySelector('img').src = isPass ? 'pictures/vidimo.png' : 'pictures/nevidimo.png';
        });
    });
}
// Склонение слова "отзыв"
function getReviewWord(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    
    if (mod10 === 1 && mod100 !== 11) return 'отзыв';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'отзыва';
    return 'отзывов';
}

// МОДАЛЬНОЕ ОКНО ВХОД/РЕГИСТРАЦИЯ
// ========================
function showForgotBtn(form, email) {
    if (form.querySelector('.forgot-pwd-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'forgot-pwd-btn';
    btn.textContent = 'Забыли пароль?';
    btn.addEventListener('click', function() { handleForgotPassword(email); });
    const submitBtn = form.querySelector('.modal-submit-btn');
    if (submitBtn) submitBtn.insertAdjacentElement('afterend', btn);
}

async function handleForgotPassword(email) {
    alert('Мы отправим инструкцию по восстановлению на вашу почту');
    if (!email) return;
    try {
        await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
    } catch(e) {}
}

const modal = document.getElementById('loginModal');
const accountIcon = document.getElementById('accountIcon');
const closeModal = document.getElementById('closeModal');
const modalTabs = document.querySelectorAll('.modal-tab');
const modalForms = document.querySelectorAll('.modal-form');

// Проверяем, сохранён ли вход
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// При загрузке — ставим аватар или плейсхолдер
if (isLoggedIn && accountIcon) {
  const iconImg = accountIcon.querySelector('img');
  const savedAvatar = localStorage.getItem('userAvatar');
  iconImg.src = savedAvatar || 'pictures/cat.png';
  iconImg.style.width = '35px';
  iconImg.style.height = '35px';
  iconImg.style.borderRadius = '50%';
  iconImg.style.objectFit = 'cover';
}
// Вызываем при загрузке страницы
restoreSession();

loadAvatarFromServer();

function restoreSession() {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (token && isLoggedIn && accountIcon) {
        const iconImg = accountIcon.querySelector('img');
        const savedAvatar = localStorage.getItem('userAvatar');
        
        if (savedAvatar) {
            iconImg.src = savedAvatar;
            iconImg.style.width = '35px';
            iconImg.style.height = '35px';
            iconImg.style.borderRadius = '50%';
            iconImg.style.objectFit = 'cover';
        }
    }
}
async function loadAvatarFromServer() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            
            // Если на сервере есть аватар — обновляем localStorage и иконку
            if (user.avatar) {
                localStorage.setItem('userAvatar', user.avatar);
                
                if (accountIcon) {
                    const iconImg = accountIcon.querySelector('img');
                    if (iconImg) {
                        iconImg.src = user.avatar;
                        iconImg.style.width = '35px';
                        iconImg.style.height = '35px';
                        iconImg.style.borderRadius = '50%';
                        iconImg.style.objectFit = 'cover';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки аватара с сервера:', error);
    }
}
if (accountIcon) {
  accountIcon.addEventListener('click', function(e) {
    e.preventDefault();
    if (isLoggedIn) {
      window.location.href = 'account.html';
    } else {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });
}

if (closeModal) {
  closeModal.addEventListener('click', function() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  });
}

modal.addEventListener('click', function(e) {
  if (e.target === modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && modal.classList.contains('open')) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
});

modalTabs.forEach(tab => {
  tab.addEventListener('click', function() {
    modalTabs.forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    const target = this.dataset.tab;
    modalForms.forEach(form => {
      form.classList.remove('active');
      if (form.id === target + 'Form') form.classList.add('active');
    });
  });
});

let loginAttempts = 0;
// Вход
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const emailInput = this.querySelector('input[placeholder*="example"]') || this.querySelector('input[type="email"]');
    const passwordInput = this.querySelector('input[placeholder*="•••"]') || this.querySelectorAll('input:not([type="email"])')[0];
    
    const email = emailInput?.value;
    const password = passwordInput?.value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('token', data.token);  // ← ВОТ ЗДЕСЬ
            
            // 👇 ВСТАВЬ СЮДА ЭТОТ КОД
            const guestSessionId = localStorage.getItem('cartSessionId');
            if (guestSessionId) {
                fetch('/api/cart/merge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.token}`
                    },
                    body: JSON.stringify({ sessionId: guestSessionId })
                }).then(() => localStorage.removeItem('cartSessionId'));
            }
            // Переносим локальное избранное
const localFavs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
if (localFavs.length > 0) {
    for (const pid of localFavs) {
        fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
            body: JSON.stringify({ productId: pid })
        }).catch(() => {});
    }
    localStorage.removeItem('localFavorites');
}
            
            localStorage.setItem('userName', data.user.name || '');
            if (data.user.avatar) {
                localStorage.setItem('userAvatar', data.user.avatar);
            } else {
                localStorage.setItem('userAvatar', 'pictures/cat.png');
            }
            
            isLoggedIn = true;
updateHeaderAvatar();
modal.classList.remove('open');
document.body.style.overflow = '';

// Проверяем роль и редиректим
const payload = JSON.parse(atob(data.token.split('.')[1]));
if (payload.role === 'admin') {
    window.location.href = '/admin';
} else {
    window.location.href = 'account.html';
}
        } else {
            loginAttempts++;
            alert(data.error || 'Ошибка входа');
            if (loginAttempts >= 3) showForgotBtn(this, email);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения с сервером');
    }
});

// Регистрация
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const passwordInput = this.querySelector('input[placeholder*="•••"]') || this.querySelectorAll('input:not([type="email"]):not([type="text"])')[0];
    const password = passwordInput?.value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('token', data.token);

            const guestSessionId = localStorage.getItem('cartSessionId');
            if (guestSessionId) {
                fetch('/api/cart/merge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.token}`
                    },
                    body: JSON.stringify({ sessionId: guestSessionId })
                }).then(() => localStorage.removeItem('cartSessionId'));
            }
            // Переносим локальное избранное
const localFavs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
if (localFavs.length > 0) {
    for (const pid of localFavs) {
        fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
            body: JSON.stringify({ productId: pid })
        }).catch(() => {});
    }
    localStorage.removeItem('localFavorites');
}
            localStorage.setItem('userName', data.user.name || '');
            localStorage.setItem('userAvatar', data.user.avatar || 'pictures/cat.png');
            
            isLoggedIn = true;
            updateHeaderAvatar();
            
            modal.classList.remove('open');
            document.body.style.overflow = '';
            window.location.href = 'account.html';
        } else {
            alert(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения с сервером');
    }
});

// Функция обновления аватара в хедере
function updateHeaderAvatar() {
    const iconImg = document.querySelector('#accountIcon img');
    if (!iconImg) return;
    
    const savedAvatar = localStorage.getItem('userAvatar');
    iconImg.src = savedAvatar || 'pictures/profile.png';
    iconImg.style.width = '35px';
    iconImg.style.height = '35px';
    
    if (savedAvatar && savedAvatar !== 'pictures/profile.png') {
        iconImg.style.borderRadius = '50%';
        iconImg.style.objectFit = 'cover';
    } else {
        iconImg.style.borderRadius = '0';
        iconImg.style.objectFit = 'contain';
    }
}
function setupPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        // Проверяем, не добавлен ли уже глазик
        if (input.parentNode.querySelector('.password-toggle')) return;
        
        // Создаём кнопку-глазик
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<img src="pictures/nevidimo.png" alt="Показать пароль" class="password-toggle-img">';
        
        // Вставляем глазик после поля ввода
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(toggleBtn);
        
        // Обработчик клика
        toggleBtn.addEventListener('click', function() {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            
            const img = this.querySelector('.password-toggle-img');
            img.src = isPassword ? 'pictures/vidimo.png' : 'pictures/nevidimo.png';
            img.alt = isPassword ? 'Скрыть пароль' : 'Показать пароль';
        });
    });
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', setupPasswordToggles);

// ========================
// АНИМАЦИИ ПРОКРУТКИ
// ========================
function initScrollReveal() {
    if (typeof IntersectionObserver === 'undefined') return;
    const viewH = window.innerHeight;
    const selector = [
        '.product-card', '.why-us-card', '.blog-card',
        '.section-title', '.section-subtitle',
        '.delivery-card-item',
        '.contact-card', '.faq-item',
        '.about-img', '.about-text-content',
        '.checkout-block', '.account-orders-block'
    ].join(',');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('ft-visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });

    const parentMap = new Map();
    document.querySelectorAll(selector).forEach(el => {
        if (el.getBoundingClientRect().top <= viewH) return;
        const p = el.parentElement;
        if (!parentMap.has(p)) parentMap.set(p, []);
        parentMap.get(p).push(el);
    });

    parentMap.forEach(group => {
        group.forEach((el, i) => {
            el.classList.add('ft-reveal');
            if (i > 0) el.style.transitionDelay = Math.min(i * 0.11, 0.33) + 's';
            observer.observe(el);
        });
    });
}

document.addEventListener('DOMContentLoaded', initScrollReveal);
