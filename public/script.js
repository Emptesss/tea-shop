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
  // ПОЛЗУНОК ЦЕНЫ
  // ========================
  const sliderMin = document.querySelector('.slider-min');
  const sliderMax = document.querySelector('.slider-max');
  const sliderFill = document.querySelector('.slider-fill');
  const priceMinInput = document.querySelector('.price-min-input');
  const priceMaxInput = document.querySelector('.price-max-input');
  
  if (sliderMin && sliderMax && sliderFill) {
    
    function updatePriceSlider() {
      const min = parseInt(sliderMin.value);
      const max = parseInt(sliderMax.value);
      
      if (min > max) {
        [sliderMin.value, sliderMax.value] = [sliderMax.value, sliderMin.value];
      }
      
      const minPercent = ((sliderMin.value - sliderMin.min) / (sliderMin.max - sliderMin.min)) * 100;
      const maxPercent = ((sliderMax.value - sliderMax.min) / (sliderMax.max - sliderMax.min)) * 100;
      
      sliderFill.style.left = minPercent + '%';
      sliderFill.style.right = (100 - maxPercent) + '%';
      
      priceMinInput.value = sliderMin.value;
      priceMaxInput.value = sliderMax.value;
    }
    
    function updatePriceInputs() {
      let min = parseInt(priceMinInput.value);
      let max = parseInt(priceMaxInput.value);
      
      if (min < 300) min = 300;
      if (max > 15000) max = 15000;
      if (min > max) min = max;
      
      sliderMin.value = min;
      sliderMax.value = max;
      
      const minPercent = ((min - 300) / (15000 - 300)) * 100;
      const maxPercent = ((max - 300) / (15000 - 300)) * 100;
      
      sliderFill.style.left = minPercent + '%';
      sliderFill.style.right = (100 - maxPercent) + '%';
    }
    
    sliderMin.addEventListener('input', updatePriceSlider);
    sliderMax.addEventListener('input', updatePriceSlider);
    priceMinInput.addEventListener('change', updatePriceInputs);
    priceMaxInput.addEventListener('change', updatePriceInputs);
    
    updatePriceSlider();
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
  // КНОПКА "СБРОСИТЬ ФИЛЬТРЫ"
  // ========================
  const resetBtn = document.querySelector('.reset-filters-btn');
  
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      // Сброс чекбоксов
      document.querySelectorAll('.checkbox-input').forEach(cb => cb.checked = false);
      // Сброс тумблера
      if (inStockToggle) inStockToggle.checked = false;
      // Сброс цены
      sliderMin.value = 300;
      sliderMax.value = 15000;
      updatePriceSlider();
      console.log('Фильтры сброшены');
    });
  }
  
  // ========================
  // ЧИПСЫ КАТЕГОРИЙ
  // ========================
  const categoryChips = document.querySelectorAll('.category-chip');
  
  categoryChips.forEach(chip => {
    chip.addEventListener('click', function() {
      categoryChips.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      console.log('Выбрана категория:', this.textContent);
    });
  });
  
  // ========================
  // КНОПКА "ПОКАЗАТЬ ЕЩЁ"
  // ========================
  const loadMoreBtn = document.querySelector('.load-more-btn');
  
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      console.log('Загрузка дополнительных товаров...');
      this.textContent = 'Загрузка...';
      setTimeout(() => {
        this.textContent = 'Показать ещё';
      }, 1000);
    });
  }
  
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
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  isLoggedIn = true;
  localStorage.setItem('isLoggedIn', 'true');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  const iconImg = accountIcon.querySelector('img');
  const savedAvatar = localStorage.getItem('userAvatar');
  iconImg.src = savedAvatar || 'pictures/cat.png';
  iconImg.style.width = '35px';
  iconImg.style.height = '35px';
  iconImg.style.borderRadius = '50%';
  iconImg.style.objectFit = 'cover';
});

// Регистрация
document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();
  isLoggedIn = true;
  localStorage.setItem('isLoggedIn', 'true');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  const iconImg = accountIcon.querySelector('img');
  iconImg.src = 'pictures/cat.png';
  iconImg.style.width = '35px';
  iconImg.style.height = '35px';
  iconImg.style.borderRadius = '50%';
  iconImg.style.objectFit = 'cover';
});

// ========================
// МОДАЛЬНОЕ ОКНО «СПАСИБО ЗА ЗАКАЗ»
// ========================
if (localStorage.getItem('orderPlaced') === 'true') {
  // Удаляем флаг, чтобы окно не показывалось при следующем обновлении
  localStorage.removeItem('orderPlaced');

  // Создаём оверлей
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.style.zIndex = '10000';

  // Само окно (копия стиля входа/регистрации)
  const modal = document.createElement('div');
  modal.className = 'modal-window';
  modal.style.textAlign = 'center';
  modal.style.maxWidth = '480px';

  modal.innerHTML = `
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
        Номер заказа: <strong style="color: #337B57;">#0042</strong>
      </p>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Блокируем прокрутку страницы пока окно открыто
  document.body.style.overflow = 'hidden';

  // Закрытие по крестику
  const closeBtn = modal.querySelector('#closeThanksModal');
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