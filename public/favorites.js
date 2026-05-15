// ========================
// ЗАГРУЗКА ИЗБРАННОГО
// ========================
async function loadFavorites() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        const favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
        if (favs.length === 0) {
            showEmpty();
            return;
        }
        loadProductsByIds(favs);
        return;
    }
    
    try {
        const response = await fetch('/api/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (!data.favorites || data.favorites.length === 0) {
            showEmpty();
            return;
        }
        
        renderFavorites(data.favorites);
        
    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        showEmpty();
    }
}

async function loadProductsByIds(ids) {
    try {
        const response = await fetch(`/api/products?limit=50`);
        const data = await response.json();
        const favProducts = data.products.filter(p => ids.includes(p.id));
        renderFavorites(favProducts);
    } catch (error) {
        console.error('Ошибка:', error);
        showEmpty();
    }
}

function renderFavorites(products) {
    const grid = document.getElementById('favoritesGrid');
    const empty = document.getElementById('favoritesEmpty');
    
    if (!products || products.length === 0) {
        showEmpty();
        return;
    }
    
    if (empty) empty.style.display = 'none';
    if (grid) grid.style.display = 'flex';
    
    grid.innerHTML = products.map(product => {
        const stockBadge = product.in_stock 
            ? '<div class="stock-badge in-stock">В наличии</div>'
            : '<div class="stock-badge out-of-stock">Нет в наличии</div>';
        
        return `
        <div class="product-card favorite-card-item" data-product-id="${product.id}">
            ${stockBadge}
            <div class="card-image-wrapper">
                <img src="${product.image1 || 'pictures/placeholder.jpg'}" alt="${product.name}" class="card-image">
            </div>
            <div class="card-badge">Купили <span class="purchase-count">${product.purchase_count || 0}</span> раз</div>
            <div class="card-body">
                <a href="product.html?slug=${product.slug}" class="card-name-link"><div class="card-name">${product.name}</div></a>
                <!-- ✅ ДОБАВЛЕНА ССЫЛКА НА ОПИСАНИЕ -->
                <a href="product.html?slug=${product.slug}" class="card-desc-link">
                    <div class="card-desc">${product.short_desc || ''}</div>
                </a>
                <div class="card-price">${product.price} Br <span class="card-price-unit">/ 50 г</span></div>
                <div class="qty-label">Выберите количество:</div>
                <div class="qty-selector">
                    <button class="qty-btn minus" aria-label="Уменьшить">−</button>
                    <span class="qty-value">1</span>
                    <button class="qty-btn plus" aria-label="Увеличить">+</button>
                </div>
                <div class="card-bottom-row">
                    <button class="card-btn add-to-cart-btn">В корзину</button>
                    <button class="card-favorite-bottom active" onclick="toggleFavoriteItem(this, ${product.id})">
                        <img src="pictures/love.png" alt="В избранном" class="card-favorite-bottom-img">
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
    
    setupCardListeners();
    setupZoomEffect();
}

window.toggleFavoriteItem = async function(btn, productId) {
    const token = localStorage.getItem('token');
    const card = btn.closest('.favorite-card-item');
    
    if (token) {
        await fetch(`/api/favorites/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } else {
        removeLocalFavorite(productId);
    }
    
    card.classList.add('removing');
    setTimeout(() => {
        card.remove();
        if (document.querySelectorAll('.favorite-card-item').length === 0) {
            showEmpty();
        }
    }, 300);
};

function showEmpty() {
    const grid = document.getElementById('favoritesGrid');
    const empty = document.getElementById('favoritesEmpty');
    if (grid) grid.style.display = 'none';
    if (empty) empty.style.display = 'block';
}

function setupCardListeners() {
    document.querySelectorAll('.qty-btn').forEach(btn => {
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
    
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.favorite-card-item');
            const productId = card?.dataset.productId;
            const quantity = parseInt(card.querySelector('.qty-value').textContent);
            if (productId) addToCartApi(productId, quantity, this);
        });
    });
}

function removeLocalFavorite(productId) {
    let favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    favs = favs.filter(id => id != productId);
    localStorage.setItem('localFavorites', JSON.stringify(favs));
}

// ========================
// ЭФФЕКТ ЛУПЫ
// ========================
function setupZoomEffect() {
    document.querySelectorAll('.card-image-wrapper').forEach(wrapper => {
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
// ГЛАЗИК ДЛЯ ПАРОЛЕЙ
// ========================
function setupPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.parentNode.querySelector('.password-toggle')) return;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<img src="pictures/nevidimo.png" alt="Показать пароль" class="password-toggle-img">';
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(toggleBtn);
        toggleBtn.addEventListener('click', function() {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const img = this.querySelector('.password-toggle-img');
            img.src = isPassword ? 'pictures/vidimo.png' : 'pictures/nevidimo.png';
        });
    });
}

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
    iconImg.style.width = '35px';
    iconImg.style.height = '35px';
    iconImg.style.borderRadius = '50%';
    iconImg.style.objectFit = 'cover';
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
    } catch (error) {}
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

modal?.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal?.classList.contains('open')) {
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

// Вход
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
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
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.name || '');
            localStorage.setItem('userAvatar', data.user.avatar || 'pictures/cat.png');
            
            const guestSessionId = localStorage.getItem('cartSessionId');
            if (guestSessionId) {
                fetch('/api/cart/merge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
                    body: JSON.stringify({ sessionId: guestSessionId })
                }).then(() => localStorage.removeItem('cartSessionId'));
            }
            
            isLoggedIn = true;
            updateHeaderAvatar();
            modal.classList.remove('open');
            document.body.style.overflow = '';
            window.location.href = 'account.html';
        } else {
            alert(data.error || 'Ошибка входа');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
    }
});

// Регистрация
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = this.querySelector('input[type="text"]')?.value;
    const email = this.querySelector('input[type="email"]')?.value;
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
            localStorage.setItem('userName', data.user.name || '');
            localStorage.setItem('userAvatar', 'pictures/cat.png');
            
            const guestSessionId = localStorage.getItem('cartSessionId');
            if (guestSessionId) {
                fetch('/api/cart/merge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
                    body: JSON.stringify({ sessionId: guestSessionId })
                }).then(() => localStorage.removeItem('cartSessionId'));
            }
            
            isLoggedIn = true;
            updateHeaderAvatar();
            modal.classList.remove('open');
            document.body.style.overflow = '';
            window.location.href = 'account.html';
        } else {
            alert(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
    }
});

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

// Функция добавления в корзину через API
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
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            button.textContent = 'Добавлено!';
            button.style.opacity = '0.7';
            setTimeout(() => {
                button.textContent = 'В корзину';
                button.style.opacity = '1';
            }, 1000);
        }
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
    }
}

// ========================
// ЗАПУСК
// ========================
document.addEventListener('DOMContentLoaded', function() {
    loadFavorites();
    setupPasswordToggles();
});