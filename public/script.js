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
