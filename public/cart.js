
// ========================
// ЗАГРУЗКА КОРЗИНЫ
// ========================
async function loadCart() {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('cartSessionId');
    
    if (!token && !sessionId) {
        showEmptyCart();
        return;
    }
    
    try {
        let url = '/api/cart';
        let options = {};
        
        if (token) {
            options.headers = { 'Authorization': `Bearer ${token}` };
        }
        
        if (!token && sessionId) {
            url += `?sessionId=${sessionId}`;
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            showEmptyCart();
            return;
        }
        
        renderCartItems(data.items);
        updateCartTotal();
        
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        showEmptyCart();
    }
}

// Отрисовка товаров в корзине
function renderCartItems(items) {
    const container = document.getElementById('cartItems');
    const empty = document.getElementById('cartEmpty');
    const layout = document.getElementById('cartLayout');
    
    if (!items || items.length === 0) {
        showEmptyCart();
        return;
    }
    
    if (empty) empty.style.display = 'none';
    if (layout) layout.style.display = 'flex';
    
    container.innerHTML = items.map(item => {
        const imgSrc = item.main_image_url || item.image1 || 'pictures/placeholder.jpg';
        const itemTotal = item.price * item.quantity;
        
        return `
        <div class="cart-item" data-item-id="${item.id}">
            <button class="cart-item-remove" data-action="remove" data-id="${item.id}">
                <img src="pictures/close.png" alt="Удалить" class="cart-remove-icon">
            </button>
            <label class="cart-item-checkbox-wrapper">
                <input type="checkbox" class="cart-item-checkbox" checked>
                <span class="cart-item-checkbox-custom"></span>
            </label>
            <div class="cart-item-image">
                <img src="${imgSrc}" alt="${item.name}" class="cart-item-img">
            </div>
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-desc">${item.short_desc || ''}</p>
            </div>
            <div class="cart-item-qty">
                <button class="cart-qty-btn" data-action="minus" data-id="${item.id}">−</button>
                <span class="cart-qty-value">${item.quantity}</span>
                <button class="cart-qty-btn" data-action="plus" data-id="${item.id}">+</button>
            </div>
            <div class="cart-item-price">
                <span class="cart-item-price-value" data-unit-price="${item.price}">${itemTotal} Br</span>
                <span class="cart-item-price-unit">/ 50 г</span>
            </div>
        </div>
        `;
    }).join('');
}

// Показать пустую корзину
function showEmptyCart() {
    const empty = document.getElementById('cartEmpty');
    const layout = document.getElementById('cartLayout');
    if (empty) empty.style.display = 'block';
    if (layout) layout.style.display = 'none';
}

// ========================
// ВСЕ КЛИКИ ЧЕРЕЗ ДЕЛЕГИРОВАНИЕ
// ========================
document.addEventListener('click', async function(e) {
    // Кнопка удаления
    if (e.target.closest('[data-action="remove"]')) {
        const btn = e.target.closest('[data-action="remove"]');
        const itemId = btn.dataset.id;
        const item = btn.closest('.cart-item');
        
        try {
            await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
            item.style.transition = 'all 0.3s';
            
            setTimeout(() => {
                item.remove();
                updateCartTotal();
                if (document.querySelectorAll('.cart-item').length === 0) {
                    showEmptyCart();
                }
            }, 300);
        } catch (error) {
            console.error('Ошибка удаления:', error);
        }
    }
    
    // Кнопка минус
    if (e.target.closest('[data-action="minus"]')) {
        const btn = e.target.closest('[data-action="minus"]');
        const itemId = btn.dataset.id;
        const item = btn.closest('.cart-item');
        const qtyEl = item.querySelector('.cart-qty-value');
        let newQty = parseInt(qtyEl.textContent) - 1;
        
        if (newQty < 1) return;
        await updateQuantity(itemId, newQty, item);
    }
    
    // Кнопка плюс
    if (e.target.closest('[data-action="plus"]')) {
        const btn = e.target.closest('[data-action="plus"]');
        const itemId = btn.dataset.id;
        const item = btn.closest('.cart-item');
        const qtyEl = item.querySelector('.cart-qty-value');
        let newQty = parseInt(qtyEl.textContent) + 1;
        
        if (newQty > 99) return;
        await updateQuantity(itemId, newQty, item);
    }
});

// Изменение количества
async function updateQuantity(itemId, newQty, item) {
    try {
        await fetch(`/api/cart/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQty })
        });
        
        // Обновляем значение на странице
        item.querySelector('.cart-qty-value').textContent = newQty;
        
        // Обновляем цену в строке
        const priceEl = item.querySelector('.cart-item-price-value');
        const unitPrice = parseFloat(priceEl.dataset.unitPrice);
        priceEl.textContent = (unitPrice * newQty) + ' Br';
        
        // Пересчитываем итог
        updateCartTotal();
        
    } catch (error) {
        console.error('Ошибка обновления:', error);
    }
}

// Пересчёт итогов
function updateCartTotal() {
    const items = document.querySelectorAll('.cart-item');
    let totalItems = 0;
    let totalPrice = 0;
    
    items.forEach(item => {
        const checkbox = item.querySelector('.cart-item-checkbox');
        if (checkbox && checkbox.checked) {
            const qty = parseInt(item.querySelector('.cart-qty-value').textContent);
            const priceEl = item.querySelector('.cart-item-price-value');
            const unitPrice = parseFloat(priceEl.dataset.unitPrice);
            totalItems += qty;
            totalPrice += unitPrice * qty;
        }
    });
    
    const totalItemsEl = document.getElementById('cartTotalItems');
    const totalPriceEl = document.getElementById('cartTotalPrice');
    
    if (totalItemsEl) totalItemsEl.textContent = totalItems + ' товаров';
    if (totalPriceEl) totalPriceEl.textContent = totalPrice + ' Br';
}

// Чекбоксы — пересчёт при изменении
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('cart-item-checkbox')) {
        updateCartTotal();
    }
});

// ========================
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

// Восстанавливаем сессию
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
        console.error('Ошибка загрузки аватара:', error);
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

let loginAttempts = 0;
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
            
            // Слияние корзины
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
            
            isLoggedIn = true;
            modal.classList.remove('open');
            document.body.style.overflow = '';
            window.location.href = 'account.html';
        } else {
            loginAttempts++;
            alert(data.error || 'Ошибка входа');
            if (loginAttempts >= 3) showForgotBtn(this, email);
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
            
            // Слияние корзины
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
            
            isLoggedIn = true;
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

// ========================
// ЗАПУСК ПРИ ЗАГРУЗКЕ
// ========================
document.addEventListener('DOMContentLoaded', async function() {
    await loadCart();
    const layout = document.getElementById('cartLayout');
    if (layout && layout.style.display !== 'none') {
        layout.style.transition = 'opacity 0.3s ease';
        layout.style.opacity = '1';
    }
    const footer = document.querySelector('.footer');
    if (footer) { footer.style.transition = 'opacity 0.3s ease'; footer.style.opacity = '1'; }
});

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
            img.alt = isPassword ? 'Скрыть пароль' : 'Показать пароль';
        });
    });
}

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