/**
 * Функция для обработки клика по кнопке "В корзину".
 * Увеличивает счётчик покупок на карточке и показывает визуальную обратную связь.
 * @param {HTMLElement} button - Кнопка, по которой кликнули.
 */
function addToCart(button) {
  // Находим родительскую карточку товара
  const card = button.closest('.product-card');
  
  // Если карточка не найдена — выходим
  if (!card) return;
  
  // Находим элемент счётчика внутри этой карточки
  const countEl = card.querySelector('.purchase-count');
  
  // Если счётчик не найден — выходим
  if (!countEl) return;
  
  // Увеличиваем значение счётчика на 1
  countEl.textContent = parseInt(countEl.textContent) + 1;

  // Визуальная обратная связь для кнопки
  button.textContent = 'Добавлено!';
  button.style.opacity = '0.7';
  
  // Возвращаем исходный текст через 1 секунду
  setTimeout(() => {
    button.textContent = 'В корзину';
    button.style.opacity = '1';
  }, 1000);
}

/**
 * Инициализация всех обработчиков событий после загрузки DOM
 */
document.addEventListener('DOMContentLoaded', function() {
  // Находим все кнопки "В корзину"
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  
  // Добавляем обработчик клика для каждой кнопки
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
      addToCart(this);
    });
  });
  
  console.log('Скрипт загружен и готов к работе. Найдено кнопок:', addToCartButtons.length);
});
/**
 * Проверка email и обработка подписки
 */
document.addEventListener('DOMContentLoaded', function() {
  const subscribeBtn = document.getElementById('subscribe-btn');
  const emailInput = document.getElementById('subscribe-email');
  const emailError = document.getElementById('email-error');
  
  // Находим изображение внутри кнопки
  const sendIcon = subscribeBtn ? subscribeBtn.querySelector('.send-icon') : null;
  // Сохраняем оригинальный src иконки
  const originalIconSrc = sendIcon ? sendIcon.src : null;

  // Проверка формата email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Функция для отображения сообщений (успех/ошибка)
  function showMessage(text, isSuccess) {
    emailError.textContent = text;
    if (isSuccess) {
      emailError.style.color = '#337B57';
      emailInput.style.border = '1px solid #337B57';
    } else {
      emailError.style.color = '#ff6b6b';
      emailInput.style.border = '1px solid #ff6b6b';
    }
  }

  // Обработчик клика по кнопке
  if (subscribeBtn) {
    subscribeBtn.addEventListener('click', async function() {
      const email = emailInput.value.trim();

      // Валидация
      if (email === '') {
        showMessage('Введите email', false);
        return;
      }
      if (!isValidEmail(email)) {
        showMessage('Введите корректный email (например: name@domain.com)', false);
        return;
      }

      // Блокируем кнопку и показываем загрузку
      subscribeBtn.disabled = true;
      
      // Меняем прозрачность иконки вместо замены src
      if (sendIcon) {
        sendIcon.style.opacity = '0.5';
      }

      try {
        // Отправляем запрос на сервер
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
          // Успешно (201 или 200)
          if (data.alreadySubscribed) {
            showMessage('✓ Вы уже подписаны на рассылку!', true);
          } else {
            showMessage('✓ Спасибо за подписку! Проверьте почту для подтверждения.', true);
          }
          emailInput.value = ''; // очищаем поле
        } else {
          // Ошибка от сервера (400, 500 и т.д.)
          showMessage(data.error || 'Ошибка подписки. Попробуйте позже.', false);
        }
      } catch (error) {
        console.error('Ошибка соединения:', error);
        showMessage('Не удалось подключиться к серверу', false);
      } finally {
        // ВАЖНО: Возвращаем кнопку в исходное состояние
        subscribeBtn.disabled = false;
        
        // Восстанавливаем прозрачность иконки
        if (sendIcon) {
          sendIcon.style.opacity = '1';
          // На всякий случай восстанавливаем src
          if (originalIconSrc) {
            sendIcon.src = originalIconSrc;
          }
        }

        // Если сообщение об успехе, через 5 секунд убираем его
        if (emailError.style.color === 'rgb(51, 123, 87)') { // #337B57 в rgb
          setTimeout(() => {
            emailError.textContent = '';
            emailInput.style.border = 'none';
          }, 5000);
        }
      }
    });

    // Сброс ошибки при вводе
    emailInput.addEventListener('input', function() {
      emailError.textContent = '';
      emailError.style.color = '#ff6b6b';
      emailInput.style.border = 'none';
    });

    // Отправка по Enter
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        subscribeBtn.click();
      }
    });
  }
});

/**
 * Скрипты для страницы каталога
 */
document.addEventListener('DOMContentLoaded', function() {
  
  // ========================
  // ТУМБЛЕР "ТОЛЬКО В НАЛИЧИИ"
  // ========================
  const inStockToggle = document.getElementById('inStockToggle');
  
  if (inStockToggle) {
    inStockToggle.addEventListener('change', function() {
      if (this.checked) {
        console.log('Включён фильтр "Только в наличии"');
        // Здесь логика фильтрации товаров
      }
    });
  }
  
// ========================
// ПОЛЗУНОК ЦЕНЫ (ВИЗУАЛ)
// ========================

function updatePriceSliderVisual() {
    const sliderMin = document.querySelector('.slider-min');
    const sliderMax = document.querySelector('.slider-max');
    const sliderFill = document.querySelector('.slider-fill');
    const priceMinInput = document.querySelector('.price-min-input');
    const priceMaxInput = document.querySelector('.price-max-input');
    
    if (!sliderMin || !sliderMax || !sliderFill) return;
    
    const min = parseInt(sliderMin.value);
    const max = parseInt(sliderMax.value);
    const minLimit = parseInt(sliderMin.min);
    const maxLimit = parseInt(sliderMax.max);
    
    if (min > max) {
        [sliderMin.value, sliderMax.value] = [sliderMax.value, sliderMin.value];
    }
    
    const minPercent = ((sliderMin.value - minLimit) / (maxLimit - minLimit)) * 100;
    const maxPercent = ((sliderMax.value - minLimit) / (maxLimit - minLimit)) * 100;
    
    sliderFill.style.left = minPercent + '%';
    sliderFill.style.right = (100 - maxPercent) + '%';
    
    if (priceMinInput) priceMinInput.value = sliderMin.value;
    if (priceMaxInput) priceMaxInput.value = sliderMax.value;
}

// Задержка для фильтрации
let priceFilterTimeout;
function applyPriceFilter() {
    clearTimeout(priceFilterTimeout);
    priceFilterTimeout = setTimeout(() => {
        const filters = getCurrentFilters();
        
        // Сохраняем категорию
        const activeChip = document.querySelector('.category-chip.active');
if (activeChip) {
    const slug = activeChip.dataset.slug;
    if (slug) {
        filters.category = slug;
    } else {
        delete filters.category;
    }
}
        currentFilters = filters;
        loadProducts(filters);
    }, 300);
}

// Вешаем обработчики
const sliderMin = document.querySelector('.slider-min');
const sliderMax = document.querySelector('.slider-max');
const priceMinInput = document.querySelector('.price-min-input');
const priceMaxInput = document.querySelector('.price-max-input');

if (sliderMin && sliderMax) {
    // Ползунки — визуал при движении, фильтр при отпускании
    sliderMin.addEventListener('input', updatePriceSliderVisual);
    sliderMin.addEventListener('change', applyPriceFilter);
    
    sliderMax.addEventListener('input', updatePriceSliderVisual);
    sliderMax.addEventListener('change', applyPriceFilter);
    
    // Поле "От" — фильтруем только по Enter или когда ушли с поля
    if (priceMinInput) {
        priceMinInput.addEventListener('change', function() {
            let val = parseInt(this.value);
            if (isNaN(val) || val < 5) {
                val = 5;
                this.value = 5;
            }
            if (val > 300) {
                val = 300;
                this.value = 300;
            }
            sliderMin.value = val;
            updatePriceSliderVisual();
            applyPriceFilter();
        });
        
        // Enter в поле
        priceMinInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur(); // убрать фокус — вызовет change
            }
        });
    }
    
    // Поле "До" — фильтруем только по Enter или когда ушли с поля
    if (priceMaxInput) {
        priceMaxInput.addEventListener('change', function() {
            let val = parseInt(this.value);
            if (isNaN(val) || val > 300) {
                val = 300;
                this.value = 300;
            }
            if (val < 5) {
                val = 5;
                this.value = 5;
            }
            sliderMax.value = val;
            updatePriceSliderVisual();
            applyPriceFilter();
        });
        
        // Enter в поле
        priceMaxInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur(); // убрать фокус — вызовет change
            }
        });
    }
    
    updatePriceSliderVisual();
}
  
  // ========================
  // ПЕРЕКЛЮЧАТЕЛЬ ВИДА (СЕТКА/СПИСОК)
  // ========================
  const viewBtns = document.querySelectorAll('.view-btn');
  const productsGrid = document.getElementById('productsGrid');
  
  viewBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      viewBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const view = this.dataset.view;
      if (view === 'list') {
        productsGrid.style.gridTemplateColumns = '1fr';
        productsGrid.classList.add('list-view');
      } else {
        productsGrid.style.gridTemplateColumns = '';
        productsGrid.classList.remove('list-view');
      }
    });
  });
  
  
  // ========================
// ЗАГРУЗКА КАТЕГОРИЙ В КАТАЛОГЕ (ДИНАМИЧЕСКИЕ ЧИПСЫ)
// ========================
async function loadCategoryChips() {
    const container = document.querySelector('.categories-scroll');
    if (!container) return;
    
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        
        if (!Array.isArray(categories) || categories.length === 0) return;
        
        let chipsHTML = '<button class="category-chip active" data-slug="">Все</button>';
        
        categories.forEach(cat => {
            chipsHTML += `<button class="category-chip" data-slug="${cat.slug}">${cat.name}</button>`;
        });
        
        container.innerHTML = chipsHTML;
        
        // Навешиваем обработчики
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                
                const slug = this.dataset.slug;
                currentPage = 1;
                const filters = getCurrentFilters();
                
                if (slug) {
                    filters.category = slug;
                } else {
                    delete filters.category;
                }
                
                if (window.history.pushState) {
                    const newUrl = window.location.pathname + (slug ? '?category=' + slug : '');
                    window.history.pushState({}, '', newUrl);
                }
                
                currentFilters = filters;
                loadProducts(filters);
            });
        });
        
        // Проверяем URL параметр
        const urlParams = new URLSearchParams(window.location.search);
        const urlCategory = urlParams.get('category');
        if (urlCategory) {
            const chip = container.querySelector(`[data-slug="${urlCategory}"]`);
            if (chip) {
                container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            }
        }
        
    } catch(e) {
        console.error('Ошибка загрузки категорий:', e);
    }
}

// Вызываем при загрузке страницы (один раз)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCategoryChips);
} else {
    loadCategoryChips();
}

function setupCategoryChipsListeners() {
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            const slug = this.dataset.slug;
            
            currentPage = 1;
            const filters = getCurrentFilters();
            
            if (slug) {
                filters.category = slug;
            } else {
                delete filters.category;
            }
            
            // Обновляем URL
            if (window.history.pushState) {
                const newUrl = window.location.pathname + (slug ? '?category=' + slug : '');
                window.history.pushState({}, '', newUrl);
            }
            
            currentFilters = filters;
            loadProducts(filters);
        });
    });
}

// Вызываем при загрузке
document.addEventListener('DOMContentLoaded', function() {
    loadCategoryChips();
});
  
  // ========================
  // КНОПКА "ПОКАЗАТЬ ЕЩЁ"
  // ========================
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
// ИЗБРАННОЕ В КАРТОЧКАХ (главная + каталог)
// ========================
window.toggleFavoriteBottom = async function(btn) {
    const card = btn.closest('.product-card');
    const productId = card?.dataset.productId;
    const token = localStorage.getItem('token');
    
    if (!productId) return;
    
    // Если не авторизован — просто переключаем визуально (localStorage)
    if (!token) {
        btn.classList.toggle('active');
        const img = btn.querySelector('img');
        if (!img) return;
        
        if (btn.classList.contains('active')) {
            img.src = 'pictures/love.png';
            saveLocalFavorite(productId);
        } else {
            img.src = 'pictures/heart-empty.png';
            removeLocalFavorite(productId);
        }
        return;
    }
    
    // Авторизован — отправляем на сервер
    const isActive = btn.classList.contains('active');
    
    try {
        if (isActive) {
            // Удаляем из избранного
            await fetch(`/api/favorites/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            btn.classList.remove('active');
            btn.querySelector('img').src = 'pictures/heart-empty.png';
        } else {
            // Добавляем в избранное
            await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });
            btn.classList.add('active');
            btn.querySelector('img').src = 'pictures/love.png';
        }
    } catch (error) {
        console.error('Ошибка избранного:', error);
    }
};

// Локальное избранное для гостей
function saveLocalFavorite(productId) {
    let favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    const numId = Number(productId); // ✅ Явно в число
    if (!favs.includes(numId)) favs.push(numId);
    localStorage.setItem('localFavorites', JSON.stringify(favs));
}


function removeLocalFavorite(productId) {
    let favs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    const numId = Number(productId); // ✅ Явно в число
    favs = favs.filter(id => id !== numId);
    localStorage.setItem('localFavorites', JSON.stringify(favs));
}

// ========================
// МОДАЛЬНОЕ ОКНО ВХОД/РЕГИСТРАЦИЯ
// ========================
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
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            
            // ✅ АДМИН — входит ТОЛЬКО в админку, основной сайт НЕ входит
            if (payload.role === 'admin') {
                localStorage.setItem('adminToken', data.token);
                // НЕ сохраняем token, isLoggedIn и остальное для основного сайта
                modal.classList.remove('open');
                document.body.style.overflow = '';
                window.location.href = '/admin';
                return; // ← ВАЖНО: выходим, не выполняя код ниже
            }
            
            // ✅ ОБЫЧНЫЙ ПОЛЬЗОВАТЕЛЬ — входит на основной сайт
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('token', data.token);
            
            // Слияние гостевой корзины
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
            window.location.href = 'account.html';
            
        } else {
            alert(data.error || 'Ошибка входа');
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

// ========================
// МОДАЛЬНОЕ ОКНО «СПАСИБО ЗА ЗАКАЗ»
// ========================
if (localStorage.getItem('orderPlaced') === 'true') {
  // Получаем номер заказа
  const orderNumber = localStorage.getItem('lastOrderNumber') || '---';
  
  // Удаляем флаги
  localStorage.removeItem('orderPlaced');
  localStorage.removeItem('lastOrderNumber');

  // Создаём оверлей
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.style.zIndex = '10000';

  // Само окно
  const thanksModal = document.createElement('div');
  thanksModal.className = 'modal-window';
  thanksModal.style.textAlign = 'center';
  thanksModal.style.maxWidth = '480px';

  thanksModal.innerHTML = `
    <button class="modal-close-btn" id="closeThanksModal">
      <img src="pictures/close.png" alt="Закрыть" class="modal-close-icon">
    </button>
    <div style="padding: 24px 16px 12px;">
      <div style="width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%; 
                  display: flex; align-items: center; justify-content: center;">
        <img src="pictures/love.png" alt="Спасибо" style="width: 50px; height: 50px; object-fit: contain;">
      </div>
      <h2 style="font-family: 'Montserrat Alternates', sans-serif; font-weight: 500; 
                 font-size: 28px; color: #fff; margin: 0 0 12px;">
        Спасибо за заказ!
      </h2>
      <p style="font-family: 'Montserrat', sans-serif; font-size: 16px; 
                color: rgba(255,255,255,0.8); margin: 0 0 12px;">
        Ваш заказ принят. Отслеживайте статус заказа в личном кабинете.
      </p>
      <p style="font-family: 'Montserrat', sans-serif; font-size: 18px; 
                color: #fff; margin: 0 0 24px;">
        Номер заказа: <strong style="color: #337B57;">#${orderNumber}</strong>
      </p>
    </div>
  `;

  overlay.appendChild(thanksModal);
  document.body.appendChild(overlay);

  document.body.style.overflow = 'hidden';

  // Закрытие по крестику
  const closeBtn = thanksModal.querySelector('#closeThanksModal');
  closeBtn.addEventListener('click', function() {
    overlay.remove();
    document.body.style.overflow = '';
  });

  // Закрытие по клику на оверлей
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  });

  // Закрытие по ESC
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', handler);
      overlay.remove();
      document.body.style.overflow = '';
    }
  });
}

// Hero-слайдер
document.addEventListener('DOMContentLoaded', function() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  
  if (slides.length === 0) return;        // выходим если слайдера нет на странице
  
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  function startSlider() {
    stopSlider();
    slideInterval = setInterval(nextSlide, 4000);
  }

  function stopSlider() {
    clearInterval(slideInterval);
  }

  // Точки
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      currentSlide = parseInt(dot.dataset.index);
      showSlide(currentSlide);
      startSlider();
    });
  });
  // Кнопки навигации
const prevBtn = document.querySelector('.hero-prev');
const nextBtn = document.querySelector('.hero-next');

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
    startSlider();
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
    startSlider();
  });
}

  // Старт
  showSlide(0);
  startSlider();

  // Ховер
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    heroSection.addEventListener('mouseenter', stopSlider);
    heroSection.addEventListener('mouseleave', startSlider);
  }

  // Видимость вкладки
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      startSlider();
    } else {
      stopSlider();
    }
  });
});

// ========================
// ЗАГРУЗКА ТОВАРОВ КАТАЛОГА ИЗ БАЗЫ ДАННЫХ
// ========================
let currentPage = 1;
let currentFilters = {};
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли URL-параметры — если да, loadProducts вызовется внутри setupFilterListeners
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlFilters = urlParams.get('category') || urlParams.get('country');
    
    if (!hasUrlFilters) {
        loadProducts(); // Загружаем все товары только если нет URL-фильтров
    }
    setupFilterListeners();
});
// Функция загрузки товаров с сервера
async function loadProducts(filters = {}, append = false) {
    try {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        if (!append) {
            grid.innerHTML = '<div style="text-align:center;padding:40px;color:white;">Загрузка товаров...</div>';
            currentPage = 1;
        }
        
        // Сохраняем текущие фильтры
        currentFilters = {...filters};
        
        let url = `/api/products?limit=12&page=${currentPage}`;
        
        if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
        if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
        if (filters.inStock) url += `&inStock=true`;
        if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
        if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
        if (filters.sort) url += `&sort=${filters.sort}`;
        if (filters.countries && filters.countries.length > 0) url += `&countries=${filters.countries.join(',')}`;
        if (filters.caffeine && filters.caffeine.length > 0) url += `&caffeine=${filters.caffeine.join(',')}`;
        if (filters.class && filters.class.length > 0) url += `&class=${filters.class.join(',')}`;
        if (filters.years && filters.years.length > 0) url += `&years=${filters.years.join(',')}`;
        if (filters.tastes && filters.tastes.length > 0) url += `&tastes=${filters.tastes.join(',')}`;
        
        console.log('Загрузка товаров. URL:', url, 'append:', append, 'page:', currentPage);
        
        const response = await fetch(url);
        const data = await response.json();
        
        const countSpan = document.getElementById('productsCount');
        if (countSpan && !append) {
            countSpan.textContent = data.pagination.totalCount;
        }
        
        totalPages = data.pagination.totalPages;
        
        if (append) {
            // Добавляем товары к существующим
            grid.innerHTML += data.products.map(product => createProductCard(product)).join('');
        } else {
            // Заменяем все товары
            grid.innerHTML = data.products.map(product => createProductCard(product)).join('');
        }
        
        // Управляем кнопкой "Показать ещё"
        updateLoadMoreButton();
        
        setupProductCardListeners();
        
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        const grid = document.getElementById('productsGrid');
        if (grid && !append) {
            grid.innerHTML = '<div style="text-align:center;padding:40px;color:#ff6b6b;">Ошибка загрузки товаров</div>';
        }
    }
}

// Управление кнопкой "Показать ещё"
function updateLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const loadMoreWrapper = document.querySelector('.load-more-wrapper');
    
    if (!loadMoreWrapper) return;
    
    // Если остались ещё страницы — показываем кнопку, иначе скрываем
    if (currentPage < totalPages) {
        loadMoreWrapper.style.display = 'flex';
        loadMoreBtn.textContent = 'Показать ещё';
        loadMoreBtn.disabled = false;
    } else {
        loadMoreWrapper.style.display = 'none';
    }
}

// Обработчик кнопки "Показать ещё"
document.addEventListener('click', function(e) {
    if (e.target.closest('.load-more-btn')) {
        const btn = e.target.closest('.load-more-btn');
        btn.textContent = 'Загрузка...';
        btn.disabled = true;
        currentPage++;
        // Важно! Передаём текущие фильтры, а не currentFilters
        const filters = getCurrentFilters();
        loadProducts(filters, true); // true = добавить к существующим
    }
});

// Функция отрисовки карточек товаров
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:white;">Товары не найдены</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => createProductCard(product)).join('');
}

// Создание HTML одной карточки товара
function createProductCard(product) {
    const stockBadge = product.in_stock 
        ? '<div class="stock-badge in-stock">В наличии</div>'
        : '<div class="stock-badge out-of-stock">Нет в наличии</div>';
    
    const oldPriceHtml = product.old_price 
        ? `<span style="text-decoration: line-through; opacity: 0.5; font-size: 14px; margin-left: 4px;">${product.old_price} Br</span>`
        : '';
    
    // Формируем путь к изображению
    const imageUrl = product.image1 || 'pictures/placeholder.jpg';
    
    return `
        <div class="product-card catalog-product-card" data-product-id="${product.id}">
            ${stockBadge}
            <div class="card-image-wrapper">
                <img src="${imageUrl}" alt="${product.name}" class="card-image">
            </div>
            <div class="card-badge">Купили <span class="purchase-count">${product.purchase_count || 0}</span> раз</div>
            <div class="card-body">
                <a href="product.html?slug=${product.slug}" class="card-name-link">
                    <div class="card-name">${product.name}</div>
                </a>
                <a href="product.html?slug=${product.slug}" class="card-desc-link">
                    <div class="card-desc">${product.short_desc || ''}</div>
                </a>
                <div class="card-price">
                    ${product.price} Br 
                    <span class="card-price-unit">/ 50 г</span>
                    ${oldPriceHtml}
                </div>
                <div class="qty-label">Выберите количество:</div>
                <div class="qty-selector">
                    <button class="qty-btn minus" aria-label="Уменьшить">−</button>
                    <span class="qty-value">1</span>
                    <button class="qty-btn plus" aria-label="Увеличить">+</button>
                </div>
                <div class="card-bottom-row">
                    <button class="card-btn add-to-cart-btn">В корзину</button>
                    <button class="card-favorite-bottom" onclick="toggleFavoriteBottom(this)">
                        <img src="pictures/heart-empty.png" alt="В избранное" class="card-favorite-bottom-img">
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Обработчики для кнопок в карточках товаров
function setupProductCardListeners() {
    // Кнопки +/- количества
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const selector = this.closest('.qty-selector');
            const valueEl = selector.querySelector('.qty-value');
            let value = parseInt(valueEl.textContent);
            
            if (this.classList.contains('plus')) {
                value = Math.min(value + 1, 99);
            } else if (this.classList.contains('minus')) {
                value = Math.max(value - 1, 1);
            }
            
            valueEl.textContent = value;
        });
    });
    
    // Кнопки "В корзину"
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.product-card');
            const productId = card.dataset.productId;
            const quantity = parseInt(card.querySelector('.qty-value').textContent);
            
            addToCartApi(productId, quantity, this);
        });
    });

    setupZoomEffect();
    // Проверяем избранное для всех карточек
async function checkAllFavorites() {
    const token = localStorage.getItem('token');
    const cards = document.querySelectorAll('.product-card[data-product-id]');
    
    if (!token) {
        // Гость — проверяем localStorage
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
    
    // Авторизован — проверяем через API
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

// Вызываем после загрузки
checkAllFavorites();
}

function setupZoomEffect() {
    const wrappers = document.querySelectorAll('.card-image-wrapper');
    
    wrappers.forEach(wrapper => {
        const img = wrapper.querySelector('.card-image');
        if (!img) return;
        
        // Убираем старые обработчики (если есть)
        const newWrapper = wrapper.cloneNode(true);
        wrapper.parentNode.replaceChild(newWrapper, wrapper);
        
        const newImg = newWrapper.querySelector('.card-image');
        
        newWrapper.addEventListener('mouseenter', () => {
            newWrapper.classList.add('panning');
        });
        
        newWrapper.addEventListener('mousemove', (e) => {
            const rect = newWrapper.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            newImg.style.transformOrigin = `${x}% ${y}%`;
            newImg.style.transform = 'scale(1.4)';
        });
        
        newWrapper.addEventListener('mouseleave', () => {
            newWrapper.classList.remove('panning');
            newImg.style.transform = 'scale(1)';
            newImg.style.transformOrigin = 'center center';
        });
        
        // Тач-версия
        newWrapper.addEventListener('touchstart', (e) => {
            e.preventDefault();
            newWrapper.classList.add('panning');
        }, { passive: false });
        
        newWrapper.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = newWrapper.getBoundingClientRect();
            const x = ((touch.clientX - rect.left) / rect.width) * 100;
            const y = ((touch.clientY - rect.top) / rect.height) * 100;
            
            newImg.style.transformOrigin = `${x}% ${y}%`;
            newImg.style.transform = 'scale(1.4)';
        }, { passive: false });
        
        newWrapper.addEventListener('touchend', () => {
            newWrapper.classList.remove('panning');
            newImg.style.transform = 'scale(1)';
            newImg.style.transformOrigin = 'center center';
        });
    });
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
        } else {
            // ✅ Показываем ошибку пользователю
            const data = await response.json();
            alert(data.error || 'Не удалось добавить товар');
        }
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        alert('Ошибка соединения с сервером');
    }
}

function setupFilterListeners() {
    // Поиск
    const searchInput = document.querySelector('.catalog-search-input');
if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            const filters = getCurrentFilters();
            
            // Сохраняем категорию
            const activeChip = document.querySelector('.category-chip.active');
if (activeChip) {
    const slug = activeChip.dataset.slug;
    if (slug) {
        filters.category = slug;
    } else {
        delete filters.category;
    }
}
            
            currentFilters = filters;
            loadProducts(filters);
        }, 500);
    });
}

    
    // Тумблер "Только в наличии"
    const inStockToggle = document.getElementById('inStockToggle');
if (inStockToggle) {
    inStockToggle.addEventListener('change', function() {
        currentPage = 1;
        const filters = getCurrentFilters();
        
        // Сохраняем категорию
        const activeChip = document.querySelector('.category-chip.active');
if (activeChip) {
    const slug = activeChip.dataset.slug;
    if (slug) {
        filters.category = slug;
    } else {
        delete filters.category;
    }
}
        
        currentFilters = filters;
        loadProducts(filters);
    });
}
    
    // Ползунок цены
    const sliderMin = document.querySelector('.slider-min');
    const sliderMax = document.querySelector('.slider-max');
    const priceMinInput = document.querySelector('.price-min-input');
    const priceMaxInput = document.querySelector('.price-max-input');
    
    if (sliderMin && sliderMax) {
        let priceTimeout;
        function applyPriceFilter() {
    clearTimeout(priceFilterTimeout);
    priceFilterTimeout = setTimeout(() => {
        const filters = getCurrentFilters();
        
        // Сохраняем категорию
        const activeChip = document.querySelector('.category-chip.active');
if (activeChip) {
    const slug = activeChip.dataset.slug;
    if (slug) {
        filters.category = slug;
    } else {
        delete filters.category;
    }
}
        
        currentFilters = filters;
        loadProducts(filters);
    }, 300);
}
        
        sliderMin.addEventListener('change', applyPriceFilter);
        sliderMax.addEventListener('change', applyPriceFilter);
        
        if (priceMinInput) {
            priceMinInput.addEventListener('change', function() {
                sliderMin.value = this.value;
                updatePriceSliderVisual();
                applyPriceFilter();
            });
        }
        if (priceMaxInput) {
            priceMaxInput.addEventListener('change', function() {
                sliderMax.value = this.value;
                updatePriceSliderVisual();
                applyPriceFilter();
            });
        }
    }
    
    // Все чекбоксы в сайдбаре
    document.querySelectorAll('.catalog-sidebar .checkbox-input').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        currentPage = 1;
        // Берём все фильтры, включая текущую категорию
        const filters = getCurrentFilters();
        
        // Добавляем категорию из активного чипса
        const activeChip = document.querySelector('.category-chip.active');
if (activeChip) {
    const slug = activeChip.dataset.slug;
    if (slug) {
        filters.category = slug;
    } else {
        delete filters.category;
    }
}
        currentFilters = filters;
        loadProducts(filters);
    });
});
    
    // Сортировка
    const sortSelect = document.querySelector('.sort-select');
if (sortSelect) {
    sortSelect.addEventListener('change', function() {
        currentPage = 1;
        const filters = getCurrentFilters();
        filters.sort = this.value;
        
        // Сохраняем категорию
        const activeChip = document.querySelector('.category-chip.active');
if (activeChip) {
    const slug = activeChip.dataset.slug;
    if (slug) {
        filters.category = slug;
    } else {
        delete filters.category;
    }
}
        
        currentFilters = filters;
        loadProducts(filters);
    });
}
    
    // Кнопка "Сбросить фильтры"
    const resetBtn = document.querySelector('.reset-filters-btn');
if (resetBtn) {
    resetBtn.addEventListener('click', function() {
        // Сбрасываем все чекбоксы
        document.querySelectorAll('.catalog-sidebar .checkbox-input').forEach(cb => cb.checked = false);
        
        // Сбрасываем тумблер
        const inStockToggle = document.getElementById('inStockToggle');
        if (inStockToggle) inStockToggle.checked = false;
        
        // Сбрасываем ползунки цены
        const sliderMin = document.querySelector('.slider-min');
        const sliderMax = document.querySelector('.slider-max');
        if (sliderMin) sliderMin.value = 5;
        if (sliderMax) sliderMax.value = 300;
        
        // Сбрасываем поля ввода цены
        const priceMinInput = document.querySelector('.price-min-input');
        const priceMaxInput = document.querySelector('.price-max-input');
        if (priceMinInput) priceMinInput.value = 5;
        if (priceMaxInput) priceMaxInput.value = 300;
        
        // Сбрасываем визуал ползунка
        const sliderFill = document.querySelector('.slider-fill');
        if (sliderFill) { sliderFill.style.left = '0%'; sliderFill.style.right = '0%'; }
        
        // Сбрасываем сортировку
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) sortSelect.value = 'popular';
        
        // Сбрасываем поиск
        const searchInput = document.querySelector('.catalog-search-input');
        if (searchInput) searchInput.value = '';
        
        // Сбрасываем чипсы категорий
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        const allChip = document.querySelector('.category-chip');
        if (allChip) allChip.classList.add('active');
        
        // Сбрасываем URL
        if (window.history.pushState) {
            window.history.pushState({}, '', window.location.pathname);
        }
        
        // Сбрасываем страницу и фильтры
        currentPage = 1;
        currentFilters = {};
        
        // Загружаем все товары
        loadProducts({});
    });
}
    // Проверяем URL параметры при загрузке каталога
const urlParams = new URLSearchParams(window.location.search);
const urlCountry = urlParams.get('country');
if (urlCountry) {
    const countryMap = {
        'Китай': 'china', 'Япония': 'japan', 'Индия': 'india',
        'Тайвань': 'taiwan', 'Шри-Ланка': 'sri-lanka', 'Вьетнам': 'vietnam'
    };
    const countryValue = countryMap[urlCountry];
    if (countryValue) {
        const checkbox = document.querySelector(`.catalog-sidebar .checkbox-input[value="${countryValue}"]`);
        if (checkbox) {
            checkbox.checked = true;
            // Сразу загружаем товары с фильтром
            const filters = getCurrentFilters();
            loadProducts(filters);
        }
    }
}
// Проверяем URL параметр категории
// Проверяем URL параметр категории
const urlCategory = urlParams.get('category');
if (urlCategory) {
    document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
    const chip = document.querySelector(`.category-chip[data-slug="${urlCategory}"]`);
    if (chip) chip.classList.add('active');
    
    currentPage = 1;
    const filters = { category: urlCategory };
    currentFilters = filters;
    loadProducts(filters);
}
}

// ========================
// ЗАГРУЗКА ТОВАРОВ НА ГЛАВНУЮ
// ========================
async function loadMainPageProducts() {
    const cardsRow = document.querySelector('.products-section .cards-row');
    if (!cardsRow) return; // не на главной — выходим
    
    try {
        const response = await fetch('/api/products?limit=3&sort=popular');
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
            cardsRow.innerHTML = data.products.map(product => createMainPageCard(product)).join('');
            setupMainPageCardListeners();
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров на главную:', error);
    }
}

function createMainPageCard(product) {
    const stockBadge = product.in_stock 
        ? '<div class="stock-badge in-stock">В наличии</div>'
        : '<div class="stock-badge out-of-stock">Нет в наличии</div>';
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            ${stockBadge}
            <div class="card-image-wrapper">
                <img src="${product.image1 || 'pictures/placeholder.jpg'}" alt="${product.name}" class="card-image">
            </div>
            <div class="card-badge">Купили <span class="purchase-count">${product.purchase_count || 0}</span> раз</div>
            <div class="card-body">
                <a href="product.html?slug=${product.slug}" class="card-name-link">
                    <div class="card-name">${product.name}</div>
                </a>
                <a href="product.html?slug=${product.slug}" class="card-desc-link">
                    <div class="card-desc">${product.short_desc || ''}</div>
                </a>
                <div class="card-price">${product.price} br <span class="card-price-unit">/ 50 г</span></div>
                <div class="qty-label">Выберите количество:</div>
                <div class="qty-selector">
                    <button class="qty-btn minus">−</button><span class="qty-value">1</span><button class="qty-btn plus">+</button>
                </div>
                <div class="card-bottom-row">
                    <button class="card-btn add-to-cart-btn">В корзину</button>
                    <!-- ✅ ДОБАВЬ onclick -->
                    <button class="card-favorite-bottom" onclick="toggleFavoriteBottom(this)">
                        <img src="pictures/heart-empty.png" alt="В избранное" class="card-favorite-bottom-img">
                    </button>
                </div>
            </div>
        </div>`;
}

function setupMainPageCardListeners() {
    const cardsRow = document.querySelector('.products-section .cards-row');
    if (!cardsRow) return;
    
    // Кнопки количества
    cardsRow.querySelectorAll('.qty-btn').forEach(btn => {
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
    cardsRow.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.product-card');
            const productId = card.dataset.productId;
            const quantity = parseInt(card.querySelector('.qty-value').textContent);
            addToCartApi(productId, quantity, this);
        });
    });
    
    // Избранное
    cardsRow.querySelectorAll('.card-favorite-bottom').forEach(btn => {
        btn.addEventListener('click', function() {
            toggleFavoriteBottom(this);
        });
    });
    
    // Эффект лупы
    cardsRow.querySelectorAll('.card-image-wrapper').forEach(wrapper => {
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
    
    // Проверка избранного
    checkMainPageFavorites();

    setTimeout(() => {
        setupProductCardsAnimation();
    }, 200);
}

async function checkMainPageFavorites() {
    const token = localStorage.getItem('token');
    const cards = document.querySelectorAll('.products-section .product-card[data-product-id]');
    
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
        const res = await fetch('/api/favorites', { headers: { 'Authorization': `Bearer ${token}` } });
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

// Загружаем при открытии главной
document.addEventListener('DOMContentLoaded', function() {
    loadMainPageProducts();
});

// ========================
// ГЛАЗИК ДЛЯ ПАРОЛЕЙ
// ========================
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

function goToCatalog(country) {
    window.location.href = `catalog.html?country=${encodeURIComponent(country)}`;
}
// Получить текущие значения ВСЕХ фильтров
function getCurrentFilters() {
    const filters = {};
    
    // ========================
    // ПОИСК
    // ========================
    const searchInput = document.querySelector('.catalog-search-input');
    if (searchInput && searchInput.value.trim()) {
        filters.search = searchInput.value.trim();
    }
    
    // ========================
    // ТОЛЬКО В НАЛИЧИИ
    // ========================
    const inStockToggle = document.getElementById('inStockToggle');
    if (inStockToggle && inStockToggle.checked) {
        filters.inStock = true;
    }
    
    // ========================
    // ЦЕНА
    // ========================
    const sliderMin = document.querySelector('.slider-min');
    const sliderMax = document.querySelector('.slider-max');
    if (sliderMin && sliderMax) {
        const minVal = parseInt(sliderMin.value);
        const maxVal = parseInt(sliderMax.value);
        
        if (minVal > 5) filters.minPrice = minVal;
        if (maxVal < 300) filters.maxPrice = maxVal;
    }
    

   // ========================
// СТРАНЫ (выбранные чекбоксы)
// ========================
const selectedCountries = [];
document.querySelectorAll('.catalog-sidebar .checkbox-input[value="china"], .catalog-sidebar .checkbox-input[value="japan"], .catalog-sidebar .checkbox-input[value="india"], .catalog-sidebar .checkbox-input[value="taiwan"], .catalog-sidebar .checkbox-input[value="sri-lanka"], .catalog-sidebar .checkbox-input[value="vietnam"]').forEach(cb => {
    if (cb.checked) {
        const countryMap = {
            'china': 'Китай',
            'japan': 'Япония',
            'india': 'Индия',
            'taiwan': 'Тайвань',
            'sri-lanka': 'Шри-Ланка',
            'vietnam': 'Вьетнам'
        };
        selectedCountries.push(countryMap[cb.value] || cb.value);
    }
});
if (selectedCountries.length > 0) {
    filters.countries = selectedCountries;
}
    
    // ========================
    // ВКУСЫ
    // ========================
    const selectedTastes = [];
    document.querySelectorAll('.catalog-sidebar .checkbox-input[value="floral"], .catalog-sidebar .checkbox-input[value="fruity"], .catalog-sidebar .checkbox-input[value="earthy"], .catalog-sidebar .checkbox-input[value="nutty"], .catalog-sidebar .checkbox-input[value="creamy"]').forEach(cb => {
        if (cb.checked) selectedTastes.push(cb.value);
    });
    if (selectedTastes.length > 0) {
        filters.tastes = selectedTastes;
    }
    
    // ========================
    // УРОВЕНЬ КОФЕИНА
    // ========================
    // ========================
// УРОВЕНЬ КОФЕИНА
// ========================
const selectedCaffeine = [];
document.querySelectorAll('.catalog-sidebar .checkbox-input[value="high"], .catalog-sidebar .checkbox-input[value="medium"], .catalog-sidebar .checkbox-input[value="low"], .catalog-sidebar .checkbox-input[value="caffeine-free"]').forEach(cb => {
    if (cb.checked) {
        // Маппинг английских значений на русские (как в БД)
        const caffeineMap = {
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий',
            'caffeine-free': 'Без кофеина'
        };
        selectedCaffeine.push(caffeineMap[cb.value] || cb.value);
    }
});
if (selectedCaffeine.length > 0) {
    filters.caffeine = selectedCaffeine;
}

// ========================
// КЛАСС ЧАЯ
// ========================
const selectedClass = [];
document.querySelectorAll('.catalog-sidebar .checkbox-input[value="organic"], .catalog-sidebar .checkbox-input[value="ceremonial"], .catalog-sidebar .checkbox-input[value="premium"], .catalog-sidebar .checkbox-input[value="classic"]').forEach(cb => {
    if (cb.checked) {
        // Маппинг английских значений на русские (как в БД)
        const classMap = {
            'organic': 'Органический',
            'ceremonial': 'Церемониальный',
            'premium': 'Премиум',
            'classic': 'Классический'
        };
        selectedClass.push(classMap[cb.value] || cb.value);
    }
});
if (selectedClass.length > 0) {
    filters.class = selectedClass;
}
    
    // ========================
    // ГОД СБОРА
    // ========================
    const selectedYears = [];
    document.querySelectorAll('.catalog-sidebar .checkbox-input[value="2026"], .catalog-sidebar .checkbox-input[value="2025"], .catalog-sidebar .checkbox-input[value="2024"], .catalog-sidebar .checkbox-input[value="older"]').forEach(cb => {
        if (cb.checked) selectedYears.push(cb.value);
    });
    if (selectedYears.length > 0) {
        filters.years = selectedYears;
    }
    
    // ========================
    // СОРТИРОВКА
    // ========================
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        filters.sort = sortSelect.value;
    }
    
    return filters;
}

// ========================
// АНИМАЦИИ ПРИ СКРОЛЛЕ
// ========================
// ========================
// АНИМАЦИИ ПРИ СКРОЛЛЕ
// ========================
document.addEventListener('DOMContentLoaded', function() {
    // Для статических элементов — запускаем сразу
    setupStaticAnimations();
    
    // Для динамических карточек — будем запускать после загрузки
    // (вызывается из setupMainPageCardListeners)
});

// Анимация для статических элементов (заголовки, линия, преимущества, баннер)
function setupStaticAnimations() {
    const sectionTitle = document.querySelector('.products-section .section-title');
    const sectionSubtitle = document.querySelector('.products-section .section-subtitle');
    const dividerLine = document.querySelector('.products-section .divider-line');
    const whyUsCards = document.querySelectorAll('.why-us-card');
    const aboutBook = document.querySelector('.about-book');
    
    if (sectionTitle) sectionTitle.classList.add('animate-hidden');
    if (sectionSubtitle) sectionSubtitle.classList.add('animate-hidden');
    if (dividerLine) dividerLine.classList.add('animate-hidden');
    
    whyUsCards.forEach((card, index) => {
        card.classList.add('animate-hidden');
        if (index === 0) card.classList.add('animate-delay-1');
        if (index === 1) card.classList.add('animate-delay-2');
        if (index === 2) card.classList.add('animate-delay-3');
    });
    
    if (aboutBook) {
        aboutBook.classList.add('animate-hidden');
    }
    
    // Функция проверки видимости
    function isElementInViewport(el, offset = 100) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= (window.innerHeight - offset) && rect.bottom >= 0;
    }
    
    function checkAnimations() {
        if (isElementInViewport(dividerLine)) dividerLine?.classList.add('animate-visible');
        if (isElementInViewport(sectionTitle)) sectionTitle?.classList.add('animate-visible');
        if (isElementInViewport(sectionSubtitle)) sectionSubtitle?.classList.add('animate-visible');
        
        whyUsCards.forEach(card => {
    if (isElementInViewport(card, 50)) {
        card.classList.add('animate-visible');
        setTimeout(() => {
            card.style.transition = 'transform 0.2s ease';
        }, 800);
    }
});
        
        if (isElementInViewport(aboutBook, 100)) aboutBook?.classList.add('animate-visible');
    }
    
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
            checkAnimations();
        }, 20);
    }, { passive: true });
    
    setTimeout(checkAnimations, 300);
}

// ✅ НОВАЯ ФУНКЦИЯ — анимация для динамических карточек товаров
function setupProductCardsAnimation() {
    const productCards = document.querySelectorAll('.products-section .product-card');
    
    if (productCards.length === 0) return;
    
    // Добавляем классы анимации
    productCards.forEach((card, index) => {
        // Сбрасываем старые классы если есть
        card.classList.remove('animate-visible', 'animate-from-left', 'animate-from-bottom', 'animate-from-right', 'animate-delay-1', 'animate-delay-2', 'animate-delay-3');
        
        card.classList.add('animate-hidden');
        
        if (index === 0) {
            card.classList.add('animate-from-left', 'animate-delay-1');
        } else if (index === 1) {
            card.classList.add('animate-from-bottom', 'animate-delay-2');
        } else if (index === 2) {
            card.classList.add('animate-from-right', 'animate-delay-3');
        } else {
            // Для дополнительных карточек — случайное направление
            const directions = ['animate-from-left', 'animate-from-bottom', 'animate-from-right'];
            card.classList.add(directions[index % 3], `animate-delay-${(index % 3) + 1}`);
        }
    });
    
    function isElementInViewport(el, offset = 50) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= (window.innerHeight - offset) && rect.bottom >= 0;
    }
    
   function checkCards() {
    productCards.forEach(card => {
        if (isElementInViewport(card, 80)) {
            card.classList.add('animate-visible');
            // ✅ Сбрасываем transition через 900мс (после окончания анимации)
            setTimeout(() => {
                card.style.transition = 'transform 0.2s ease, box-shadow 0.3s';
            }, 900);
        }
    });
}
    
    // Проверяем сразу (если карточки уже видны)
    setTimeout(checkCards, 100);
    
    // И при скролле
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
            checkCards();
        }, 20);
    }, { passive: true });
}
// ========================
// АНИМАЦИИ ДЛЯ СТРАНИЦЫ "О НАС"
// ========================
(function() {
    if (!document.querySelector('.about-main')) return;

    const pageTitle = document.querySelector('.about-page-title');
    const pageSubtitle = document.querySelector('.about-page-subtitle');
    const historyBook = document.querySelector('.about-history-book');
    const dividers = document.querySelectorAll('.about-main .divider-line');
    const sectionTitles = document.querySelectorAll('.about-section-title, .about-section-title-desc');
    const sectionDesc = document.querySelector('.about-section-desc');
    const valueCards = document.querySelectorAll('.about-value-card');
    const journeySteps = document.querySelectorAll('.journey-step');
    const ctaBlock = document.querySelector('.about-cta');

    // Начальные классы
    if (pageTitle) pageTitle.classList.add('animate-hidden');
    if (pageSubtitle) pageSubtitle.classList.add('animate-hidden');
    if (historyBook) historyBook.classList.add('animate-hidden');
    if (sectionDesc) sectionDesc.classList.add('animate-hidden');
    if (ctaBlock) ctaBlock.classList.add('animate-hidden');

    dividers.forEach(d => d.classList.add('animate-hidden'));
    sectionTitles.forEach(t => t.classList.add('animate-hidden'));

    // ✅ Ценности — слева направо с задержкой
    valueCards.forEach((card, i) => {
        card.classList.add('animate-hidden');
        if (i === 0) card.classList.add('animate-delay-1');
        if (i === 1) card.classList.add('animate-delay-2');
        if (i === 2) card.classList.add('animate-delay-3');
    });

    // ✅ Шаги пути — левые слева, правые справа, номера на месте
    journeySteps.forEach(step => {
        step.classList.add('animate-hidden');
        const card = step.querySelector('.journey-card-left, .journey-card-right');
        const marker = step.querySelector('.journey-marker');
        if (card) {
            card.classList.add(card.classList.contains('journey-card-left') ? 'animate-from-left' : 'animate-from-right');
        }
        if (marker) marker.classList.add('animate-hidden');
    });

    function isInView(el, offset = 100) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top <= (window.innerHeight - offset) && r.bottom >= 0;
    }

    function check() {
        if (isInView(pageTitle)) { pageTitle?.classList.add('animate-visible'); pageSubtitle?.classList.add('animate-visible'); }
        if (isInView(historyBook, 150)) historyBook?.classList.add('animate-visible');
        dividers.forEach(d => { if (isInView(d, 50)) d.classList.add('animate-visible'); });
        sectionTitles.forEach(t => { if (isInView(t, 80)) t.classList.add('animate-visible'); });
        if (isInView(sectionDesc, 80)) sectionDesc?.classList.add('animate-visible');

        // ✅ Ценности — проявляются слева направо
        valueCards.forEach(card => {
            if (isInView(card, 80)) {
                card.classList.add('animate-visible');
                setTimeout(() => { card.style.transition = 'transform 0.2s ease'; }, 750);
            }
        });

        // ✅ Шаги — карточки вылетают, номера на линии
        journeySteps.forEach((step, i) => {
            if (isInView(step, 100)) {
                step.classList.add('animate-visible');
                const marker = step.querySelector('.journey-marker');
                const card = step.querySelector('.journey-card-left, .journey-card-right');
                // Номер проявляется сразу
                setTimeout(() => marker?.classList.add('animate-visible'), 100);
                // Карточка вылетает
                setTimeout(() => {
                    card?.classList.add('animate-visible');
                    if (card) setTimeout(() => { card.style.transition = 'transform 0.2s ease'; }, 850);
                }, 250);
            }
        });

        if (isInView(ctaBlock, 100)) ctaBlock?.classList.add('animate-visible');
    }

    let t;
    window.addEventListener('scroll', () => {
        if (t) return;
        t = setTimeout(() => { t = null; check(); }, 20);
    }, { passive: true });

    setTimeout(check, 300);
})();