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

  // Функция проверки email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Обработчик клика по кнопке подписки
  if (subscribeBtn) {
    subscribeBtn.addEventListener('click', function() {
      const email = emailInput.value.trim();
      
      if (email === '') {
        emailError.textContent = 'Введите email';
        emailInput.style.border = '1px solid #ff6b6b';
      } else if (!isValidEmail(email)) {
        emailError.textContent = 'Введите корректный email (например: name@domain.com)';
        emailInput.style.border = '1px solid #ff6b6b';
      } else {
        emailError.textContent = '✓ Спасибо за подписку!';
        emailError.style.color = '#337B57';
        emailInput.style.border = '1px solid #337B57';
        emailInput.value = '';
        
        // Здесь можно добавить отправку на сервер
        console.log('Подписка на email:', email);
        
        // Сброс через 3 секунды
        setTimeout(() => {
          emailError.textContent = '';
          emailError.style.color = '#ff6b6b';
          emailInput.style.border = 'none';
        }, 3000);
      }
    });

    // Сброс ошибки при вводе
    emailInput.addEventListener('input', function() {
      emailError.textContent = '';
      emailInput.style.border = 'none';
    });

    // Отправка по Enter
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        subscribeBtn.click();
      }
    });
  }
});