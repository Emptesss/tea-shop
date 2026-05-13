// ========================
// ЗАГРУЗКА ТОВАРА ИЗ БД
// ========================
async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    
    if (!slug) return;
    
    try {
        const response = await fetch(`/api/products/${slug}`);
        if (!response.ok) return;
        
        const product = await response.json();
        renderProductData(product);
        
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
    window._currentProductId = product.id;
    
    // Изображения
    const images = [];
    if (product.image1) images.push(product.image1);
    if (product.image2) images.push(product.image2);
    if (images.length === 0) images.push('pictures/placeholder.jpg');
    
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg && images.length > 0) mainImg.src = images[0];
    
    // Обновляем массив images для галереи
    window.productImages = images;
    
    // Миниатюры
    const thumbsEl = document.querySelector('.gallery-thumbnails');
    if (thumbsEl && images.length > 0) {
        thumbsEl.innerHTML = images.map((img, i) => `
            <button class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                <img src="${img}" alt="Фото ${i+1}" class="gallery-thumb-img">
            </button>
        `).join('');
    }
    
    // Бейджи
    const badgesEl = document.querySelector('.gallery-badges');
    if (badgesEl) {
        let badgesHtml = '';
        if (product.purchase_count > 50) badgesHtml += '<span class="gallery-badge bestseller">Хит продаж</span>';
        if (product.in_stock) badgesHtml += '<span class="gallery-badge in-stock">В наличии</span>';
        else badgesHtml += '<span class="gallery-badge" style="background:rgba(200,0,0,0.7);">Нет в наличии</span>';
        badgesEl.innerHTML = badgesHtml;
    }
    
    // Рейтинг
    const rating = parseFloat(product.rating) || 0;
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    const starsEl = document.querySelector('.product-stars');
    if (starsEl) {
        starsEl.innerHTML = 
            Array(fullStars).fill('<img src="pictures/star-filled.png" alt="★" class="star-icon-static">').join('') +
            Array(emptyStars).fill('<img src="pictures/star-empty.png" alt="☆" class="star-icon-static">').join('');
    }
    const ratingText = document.querySelector('.product-rating-text');
    if (ratingText) ratingText.textContent = `${rating} (${product.purchase_count || 0} покупок)`;
    
    // Мета-теги
    const metaEl = document.querySelector('.product-meta');
if (metaEl) {
    let metaHtml = '';
    if (product.country) metaHtml += `<span class="product-meta-tag">${product.country}</span>`;
    if (product.year) metaHtml += `<span class="product-meta-tag">${product.year}</span>`;
    if (product.class) metaHtml += `<span class="product-meta-tag">${product.class}</span>`;
    if (product.tea_type) metaHtml += `<span class="product-meta-tag">${product.tea_type}</span>`;
    // Вкусы
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
    
    // Цена
    const priceEl = document.querySelector('.product-price');
    if (priceEl) priceEl.textContent = product.price + ' Br';
    
    // Характеристики
const charsEl = document.querySelector('.product-characteristics');
if (charsEl) {
    let charsHtml = '';
    if (product.country) charsHtml += `<div class="char-row"><span class="char-label">Страна</span><span class="char-value">${product.country}</span></div>`;
    if (product.year) charsHtml += `<div class="char-row"><span class="char-label">Год сбора</span><span class="char-value">${product.year}</span></div>`;
    if (product.tea_type) charsHtml += `<div class="char-row"><span class="char-label">Вид чая</span><span class="char-value">${product.tea_type}</span></div>`;
    // Вкусы
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
        setupSimilarCardsListeners(); // ← ДОБАВЬ ЭТУ СТРОКУ
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
        favBtn.addEventListener('click', async function() {
            const token = localStorage.getItem('token');
            if (!token) {
                this.classList.toggle('active');
                const img = this.querySelector('img');
                img.src = this.classList.contains('active') ? 'pictures/love.png' : 'pictures/heart-empty.png';
                return;
            }
            const isActive = this.classList.contains('active');
            try {
                if (isActive) {
                    await fetch(`/api/favorites/${product.id}`, { method: 'DELETE', headers: {'Authorization': `Bearer ${token}`} });
                    this.classList.remove('active');
                    this.querySelector('img').src = 'pictures/heart-empty.png';
                } else {
                    await fetch('/api/favorites', { method: 'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({productId: product.id}) });
                    this.classList.add('active');
                    this.querySelector('img').src = 'pictures/love.png';
                }
            } catch (e) {}
        });
    }
    // Проверяем, в избранном ли товар
async function checkFavoriteStatus(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        // Для гостей — проверяем localStorage
        const favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
        if (favs.includes(productId)) {
            const favBtn = document.querySelector('.product-favorite-btn');
            if (favBtn) {
                favBtn.classList.add('active');
                favBtn.querySelector('img').src = 'pictures/love.png';
            }
        }
        return;
    }
    
    try {
        const res = await fetch(`/api/favorites/check/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.inFavorites) {
            const favBtn = document.querySelector('.product-favorite-btn');
            if (favBtn) {
                favBtn.classList.add('active');
                favBtn.querySelector('img').src = 'pictures/love.png';
            }
        }
    } catch (e) {}
}

// В конце renderProductData вызови:
checkFavoriteStatus(product.id);
loadReviews(product.id);
}

function createSimilarCard(p) {
    return `
        <div class="product-card" data-product-id="${p.id}">
            <div class="stock-badge in-stock">В наличии</div>
            <div class="card-image-wrapper"><img src="${p.image1 || 'pictures/placeholder.jpg'}" alt="${p.name}" class="card-image"></div>
            <div class="card-badge">Купили <span class="purchase-count">${p.purchase_count || 0}</span> раз</div>
            <div class="card-body">
                <a href="product.html?slug=${p.slug}" class="card-name-link"><div class="card-name">${p.name}</div></a>
                <div class="card-desc">${p.short_desc || ''}</div>
                <div class="card-price">${p.price} Br <span class="card-price-unit">/ 50 г</span></div>
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
    
    // Кнопки избранного (с API)
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
            } catch (e) {}
        });
    });
    
    // Проверяем статус избранного для всех похожих карточек
    checkSimilarFavorites();
    
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

// Проверка избранного для похожих товаров
async function checkSimilarFavorites() {
    const token = localStorage.getItem('token');
    const cards = document.querySelectorAll('.cards-row .product-card[data-product-id]');
    
    if (!token) {
        const favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
        cards.forEach(card => {
            const pid = parseInt(card.dataset.productId);
            if (favs.includes(pid)) {
                const favBtn = card.querySelector('.card-favorite-bottom');
                if (favBtn) {
                    favBtn.classList.add('active');
                    favBtn.querySelector('img').src = 'pictures/love.png';
                }
            }
        });
        return;
    }
    
    try {
        const res = await fetch('/api/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const favIds = (data.favorites || []).map(f => f.id);
        
        cards.forEach(card => {
            const pid = parseInt(card.dataset.productId);
            if (favIds.includes(pid)) {
                const favBtn = card.querySelector('.card-favorite-bottom');
                if (favBtn) {
                    favBtn.classList.add('active');
                    favBtn.querySelector('img').src = 'pictures/love.png';
                }
            }
        });
    } catch (e) {}
}

// Локальное избранное
function saveLocalFavorite(productId) {
    let favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    if (!favs.includes(productId)) favs.push(productId);
    localStorage.setItem('localFavorites', JSON.stringify(favs));
}

function removeLocalFavorite(productId) {
    let favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    favs = favs.filter(id => id != productId);
    localStorage.setItem('localFavorites', JSON.stringify(favs));
}
// Функция добавления в корзину
async function addToCartApi(productId, quantity, button) {
    try {
        const token = localStorage.getItem('token');
        const body = { productId, quantity };
        let sessionId = localStorage.getItem('cartSessionId');
        if (!sessionId) { sessionId = 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('cartSessionId', sessionId); }
        body.sessionId = sessionId;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/cart', { method: 'POST', headers, body: JSON.stringify(body) });
        if (res.ok) { button.textContent = 'Добавлено!'; button.style.opacity = '0.7'; setTimeout(() => { button.textContent = 'В корзину'; button.style.opacity = '1'; }, 1000); }
    } catch (e) {}
}

// Загружаем товар при открытии
loadProduct();

document.addEventListener('DOMContentLoaded', function() {
  // Галерея
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const mainImg = document.getElementById('mainProductImage');
  const prevBtn = document.querySelector('.gallery-prev');
  const nextBtn = document.querySelector('.gallery-next');
  let currentIndex = 0;

  const images = [
    'pictures/tea/gornayamatcha2.jpg',
    'pictures/tea/gornayamatcha2.png'
  ];

  function updateGallery(index) {
    currentIndex = index;
    mainImg.src = images[index];
    thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
  }

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => updateGallery(parseInt(thumb.dataset.index)));
  });

  prevBtn?.addEventListener('click', () => {
    updateGallery((currentIndex - 1 + images.length) % images.length);
  });

  nextBtn?.addEventListener('click', () => {
    updateGallery((currentIndex + 1) % images.length);
  });

  // Количество на странице товара
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
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
  });

  // ========================
  // ЗВЁЗДЫ ОТЗЫВА (PNG-иконки)
  // ========================
  const starsInput = document.getElementById('starsInput');
  const ratingHidden = document.getElementById('review-rating');
  const starBtns = starsInput.querySelectorAll('.star-btn');

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = parseInt(btn.dataset.value);
      ratingHidden.value = value;

      starBtns.forEach(b => {
        const starValue = parseInt(b.dataset.value);
        const img = b.querySelector('.star-icon');
        if (starValue <= value) {
          img.src = img.dataset.filled;
        } else {
          img.src = img.dataset.empty;
        }
      });
    });

    btn.addEventListener('mouseenter', () => {
      const hoverValue = parseInt(btn.dataset.value);
      starBtns.forEach(b => {
        const starValue = parseInt(b.dataset.value);
        const img = b.querySelector('.star-icon');
        if (starValue <= hoverValue) {
          img.src = img.dataset.filled;
        } else {
          img.src = img.dataset.empty;
        }
      });
    });

    btn.addEventListener('mouseleave', () => {
      const currentValue = parseInt(ratingHidden.value);
      starBtns.forEach(b => {
        const starValue = parseInt(b.dataset.value);
        const img = b.querySelector('.star-icon');
        if (starValue <= currentValue) {
          img.src = img.dataset.filled;
        } else {
          img.src = img.dataset.empty;
        }
      });
    });
  });

  // ========================
  // ИЗБРАННОЕ НА СТРАНИЦЕ ТОВАРА
  // ========================
window.toggleFavorite = async function(btn) {
    const token = localStorage.getItem('token');
    const favBtn = document.querySelector('.product-favorite-btn');
    const productId = favBtn?.dataset.productId || window._currentProductId;
    
    if (!productId) return;
    
    if (!token) {
        btn.classList.toggle('active');
        const img = btn.querySelector('img');
        if (!img) return;
        img.src = btn.classList.contains('active') ? 'pictures/love.png' : 'pictures/heart-empty.png';
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
            btn.querySelector('img').src = 'pictures/heart-empty.png';
        } else {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId })
            });
            btn.classList.add('active');
            btn.querySelector('img').src = 'pictures/love.png';
        }
    } catch (e) {
        console.error('Ошибка избранного:', e);
    }
};

  // ========================
  // ИЗБРАННОЕ В КАРТОЧКАХ (главная + каталог)
  // ========================
  window.toggleFavoriteBottom = function(btn) {
    btn.classList.toggle('active');
    const img = btn.querySelector('img');
    if (!img) return;
    
    if (btn.classList.contains('active')) {
      img.src = 'pictures/love.png';
    } else {
      img.src = 'pictures/heart-empty.png';
    }
  };

});

// ========================
// ЭФФЕКТ ЛУПЫ — ПРИБЛИЖЕНИЕ И ДВИЖЕНИЕ МЫШКОЙ
// ========================
const wrappers = document.querySelectorAll('.card-image-wrapper');

wrappers.forEach(wrapper => {
  const img = wrapper.querySelector('.card-image');
  if (!img) return;

  wrapper.addEventListener('mouseenter', () => {
    wrapper.classList.add('panning');
  });

  wrapper.addEventListener('mousemove', (e) => {
    const rect = wrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = 'scale(1.4)';
  });

  wrapper.addEventListener('mouseleave', () => {
    wrapper.classList.remove('panning');
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center center';
  });

  // Тач-версия
  wrapper.addEventListener('touchstart', (e) => {
    e.preventDefault();
    wrapper.classList.add('panning');
  }, { passive: false });

  wrapper.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = wrapper.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = 'scale(1.4)';
  }, { passive: false });

  wrapper.addEventListener('touchend', () => {
    wrapper.classList.remove('panning');
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center center';
  });
});

// ========================
// МОДАЛЬНОЕ ОКНО ВХОД/РЕГИСТРАЦИЯ
// ========================
const modal = document.getElementById('loginModal');
const accountIcon = document.getElementById('accountIcon');
const closeModal = document.getElementById('closeModal');
const modalTabs = document.querySelectorAll('.modal-tab');
const modalForms = document.querySelectorAll('.modal-form');

let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

if (isLoggedIn && accountIcon) {
    const iconImg = accountIcon.querySelector('img');
    const savedAvatar = localStorage.getItem('userAvatar');
    iconImg.src = savedAvatar || 'pictures/cat.png';
    iconImg.style.width = '35px'; iconImg.style.height = '35px';
    iconImg.style.borderRadius = '50%'; iconImg.style.objectFit = 'cover';
}

restoreSession();
loadAvatarFromServer();

function restoreSession() {
    const token = localStorage.getItem('token');
    if (token && isLoggedIn && accountIcon) {
        const iconImg = accountIcon.querySelector('img');
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            iconImg.src = savedAvatar;
            iconImg.style.width = '35px'; iconImg.style.height = '35px';
            iconImg.style.borderRadius = '50%'; iconImg.style.objectFit = 'cover';
        }
    }
}

async function loadAvatarFromServer() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const res = await fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const user = await res.json();
            if (user.avatar) {
                localStorage.setItem('userAvatar', user.avatar);
                if (accountIcon) {
                    const img = accountIcon.querySelector('img');
                    if (img) { img.src = user.avatar; img.style.width = '35px'; img.style.height = '35px'; img.style.borderRadius = '50%'; img.style.objectFit = 'cover'; }
                }
            }
        }
    } catch (e) {}
}

if (accountIcon) {
    accountIcon.addEventListener('click', function(e) {
        e.preventDefault();
        isLoggedIn ? window.location.href = 'account.html' : (modal.classList.add('open'), document.body.style.overflow = 'hidden');
    });
}

closeModal?.addEventListener('click', () => { modal.classList.remove('open'); document.body.style.overflow = ''; });
modal?.addEventListener('click', e => { if (e.target === modal) { modal.classList.remove('open'); document.body.style.overflow = ''; } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.classList.contains('open')) { modal.classList.remove('open'); document.body.style.overflow = ''; } });

modalTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        modalTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        modalForms.forEach(f => { f.classList.remove('active'); if (f.id === this.dataset.tab + 'Form') f.classList.add('active'); });
    });
});

// Вход
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const emailInput = this.querySelector('input[placeholder*="example"]') || this.querySelector('input[type="email"]');
    const passwordInput = this.querySelector('input[placeholder*="•••"]') || this.querySelectorAll('input:not([type="email"])')[0];
    const email = emailInput?.value;
    const password = passwordInput?.value;
    
    try {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.name || '');
            localStorage.setItem('userAvatar', data.user.avatar || 'pictures/cat.png');
            
            const gsid = localStorage.getItem('cartSessionId');
            if (gsid) fetch('/api/cart/merge', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` }, body: JSON.stringify({ sessionId: gsid }) }).then(() => localStorage.removeItem('cartSessionId'));
            
            isLoggedIn = true;
            updateHeaderAvatar();
            modal.classList.remove('open');
            document.body.style.overflow = '';
            window.location.href = 'account.html';
        } else { alert(data.error || 'Ошибка входа'); }
    } catch (err) { alert('Ошибка соединения с сервером'); }
});

// Регистрация
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = this.querySelector('input[type="text"]')?.value;
    const email = this.querySelector('input[type="email"]')?.value;
    const passwordInput = this.querySelector('input[placeholder*="•••"]') || this.querySelectorAll('input:not([type="email"]):not([type="text"])')[0];
    const password = passwordInput?.value;
    
    try {
        const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.name || '');
            localStorage.setItem('userAvatar', 'pictures/cat.png');
            
            const gsid = localStorage.getItem('cartSessionId');
            if (gsid) fetch('/api/cart/merge', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` }, body: JSON.stringify({ sessionId: gsid }) }).then(() => localStorage.removeItem('cartSessionId'));
            
            isLoggedIn = true;
            updateHeaderAvatar();
            modal.classList.remove('open');
            document.body.style.overflow = '';
            window.location.href = 'account.html';
        } else { alert(data.error || 'Ошибка регистрации'); }
    } catch (err) { alert('Ошибка соединения с сервером'); }
});

function updateHeaderAvatar() {
    const img = document.querySelector('#accountIcon img');
    if (!img) return;
    const av = localStorage.getItem('userAvatar');
    img.src = av || 'pictures/profile.png';
    img.style.width = '35px'; img.style.height = '35px';
    img.style.borderRadius = av && av !== 'pictures/profile.png' ? '50%' : '0';
    img.style.objectFit = av && av !== 'pictures/profile.png' ? 'cover' : 'contain';
}

// ========================
// ГЛАЗИК ДЛЯ ПАРОЛЕЙ
// ========================
function setupPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.parentNode.querySelector('.password-toggle')) return;
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'password-toggle';
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
// ========================
// ЗАГРУЗКА И ОТПРАВКА ОТЗЫВОВ
// ========================
async function loadReviews(productId) {
    try {
        const res = await fetch(`/api/reviews/${productId}`);
        const data = await res.json();
        renderReviews(data.reviews);
    } catch (e) {
        console.error('Ошибка загрузки отзывов:', e);
    }
}

function renderReviews(reviews) {
    const container = document.querySelector('.reviews-list');
    if (!container) return;
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px;">Пока нет отзывов. Будьте первым!</p>';
        return;
    }
    
    container.innerHTML = reviews.map(r => {
        const date = new Date(r.created_at);
        const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
        const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        const avatar = r.author_avatar && r.author_avatar !== 'pictures/cat.png' ? r.author_avatar : null;
        const firstLetter = r.author_name.charAt(0).toUpperCase();
        const avatarHtml = avatar 
            ? `<img src="${avatar}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" alt="${r.author_name}">`
            : firstLetter;
        
        return `
        <div class="review-card">
            <div class="review-header">
                <div class="review-author-avatar">${avatarHtml}</div>
                <div class="review-author-info">
                    <span class="review-author-name">${r.author_name}</span>
                    <span class="review-date">${dateStr}</span>
                </div>
                <div class="review-stars">
                    ${'<img src="pictures/star-filled.png" class="star-icon-static">'.repeat(r.rating)}
                    ${'<img src="pictures/star-empty.png" class="star-icon-static">'.repeat(5 - r.rating)}
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
    
    const reviewsTab = document.querySelector('.product-tab[data-tab="reviews"]');
    if (reviewsTab) reviewsTab.textContent = `Отзывы (${reviews.length})`;
}

async function markHelpful(reviewId, btn) {
    try {
        await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
        const current = parseInt(btn.textContent.match(/\d+/)[0]);
        btn.textContent = `Полезно (${current + 1})`;
        btn.disabled = true;
        btn.style.opacity = '0.5';
    } catch (e) {}
}

// Отправка отзыва
document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('productReviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Чтобы оставить отзыв, войдите в аккаунт');
                document.getElementById('loginModal').classList.add('open');
                return;
            }
            
            const rating = parseInt(document.getElementById('review-rating').value);
            const title = document.getElementById('review-title')?.value || '';
            const content = document.getElementById('review-text')?.value;
            const productId = window._currentProductId;
            
            if (!rating || rating === 0) { alert('Поставьте оценку'); return; }
            if (!content) { alert('Напишите отзыв'); return; }
            
            try {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ productId, rating, title, content })
                });
                
                if (res.ok) {
                    alert('Спасибо за отзыв!');
                    reviewForm.reset();
                    document.getElementById('review-rating').value = '0';
                    document.querySelectorAll('.star-icon').forEach(img => img.src = 'pictures/star-empty.png');
                    loadReviews(productId);
                } else {
                    const data = await res.json();
                    alert(data.error || 'Ошибка');
                }
            } catch (e) {
                alert('Ошибка соединения');
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', setupPasswordToggles);