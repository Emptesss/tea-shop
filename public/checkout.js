// ========================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ========================
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// ========================
// ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ
// ========================
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('loginModal');
  const closeBtn = document.getElementById('closeModal');

  if (!isLoggedIn && modal) {
    // Показываем окно входа
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Кнопку закрытия показываем (убираем скрытие, если было)
    if (closeBtn) closeBtn.style.display = '';
  }

  // ========================
  // ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА (если не авторизован – возврат в корзину)
  // ========================
  function closeAndRedirect() {
    if (!isLoggedIn) {
      // Пользователь не авторизован – отправляем в корзину
      window.location.href = 'cart.html';
    } else {
      // Уже авторизован – просто закрываем окно
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeAndRedirect);
  }

  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeAndRedirect();
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeAndRedirect();
    }
  });
});

// ========================
// АККОРДЕОН ШАГОВ
// ========================
function nextStep(currentId, nextId) {
  const current = document.getElementById(currentId);
  
  if (currentId === 'cardContact') {
    const name = document.getElementById('checkoutName').value.trim();
    const surname = document.getElementById('checkoutSurname').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();
    if (!name || !surname || !phone) {
      alert('Заполните обязательные поля: Имя, Фамилия, Телефон');
      return;
    }
  }

  if (currentId === 'cardDelivery') {
    const delivery = document.querySelector('input[name="delivery"]:checked');
    if (delivery && (delivery.value === 'courier' || delivery.value === 'post')) {
      const addr = document.getElementById('deliveryAddressInput').value.trim();
      if (!addr) {
        alert('Введите адрес доставки');
        return;
      }
    }
  }

  // Закрываем текущий, помечаем как done
  current.classList.remove('active');
  current.classList.add('done');
  current.classList.remove('locked');

  // Открываем следующий
  if (nextId && nextId !== '') {
    const next = document.getElementById(nextId);
    if (next) {
      next.classList.remove('locked');
      next.classList.add('active');
      
      const header = next.querySelector('.checkout-card-header');
      if (header) {
        const top = header.getBoundingClientRect().top + window.pageYOffset - 600;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  checkAllDone();
}

function checkAllDone() {
  const contactDone = document.getElementById('cardContact').classList.contains('done');
  const deliveryDone = document.getElementById('cardDelivery').classList.contains('done');
  const paymentDone = document.getElementById('cardPayment').classList.contains('done');
  const btn = document.getElementById('confirmOrderBtn');
  if (btn) {
    btn.disabled = !(contactDone && deliveryDone && paymentDone);
  }
}

// ========================
// ИНИЦИАЛИЗАЦИЯ
// ========================
document.addEventListener('DOMContentLoaded', function() {
  
  const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
  const deliveryAddress = document.getElementById('deliveryAddress');

  deliveryRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'courier' || this.value === 'post') {
        if (deliveryAddress) deliveryAddress.style.display = 'block';
      } else {
        if (deliveryAddress) deliveryAddress.style.display = 'none';
      }
      updateTotal();
    });
  });

  function updateTotal() {
    const subtotal = 286;
    const selected = document.querySelector('input[name="delivery"]:checked');
    let deliveryPrice = 0;
    if (selected) {
      if (selected.value === 'courier') deliveryPrice = 10;
      if (selected.value === 'post') deliveryPrice = 5;
    }
    const totalEl = document.getElementById('checkoutTotal');
    const deliveryEl = document.getElementById('checkoutDelivery');
    if (deliveryEl) deliveryEl.textContent = deliveryPrice === 0 ? 'Бесплатно' : deliveryPrice + ' Br';
    if (totalEl) totalEl.textContent = (subtotal + deliveryPrice) + ' Br';
  }

  if (localStorage.getItem('isLoggedIn') === 'true') {
    const el = (id) => document.getElementById(id);
    if (el('checkoutName')) el('checkoutName').value = 'Анна';
    if (el('checkoutSurname')) el('checkoutSurname').value = 'Иванова';
    if (el('checkoutPhone')) el('checkoutPhone').value = '+375 (29) 123-45-67';
    if (el('checkoutEmail')) el('checkoutEmail').value = 'anna@mail.ru';
  }

  updateTotal();
});

// ========================
// ПОДТВЕРЖДЕНИЕ ЗАКАЗА
// ========================
function placeOrder() {
  localStorage.setItem('orderPlaced', 'true');
  window.location.href = 'glavnaya.html';
}

// ========================
// МОДАЛЬНОЕ ОКНО ВХОД/РЕГИСТРАЦИЯ (основные обработчики)
// ========================
const modal = document.getElementById('loginModal');
const accountIcon = document.getElementById('accountIcon');
const modalTabs = document.querySelectorAll('.modal-tab');
const modalForms = document.querySelectorAll('.modal-form');

// Обновляем иконку профиля, если уже вошли (на случай повторного использования)
if (isLoggedIn && accountIcon) {
  const iconImg = accountIcon.querySelector('img');
  const savedAvatar = localStorage.getItem('userAvatar');
  iconImg.src = savedAvatar || 'pictures/cat.png';
  if (iconImg) {
    iconImg.style.width = '35px';
    iconImg.style.height = '35px';
    iconImg.style.borderRadius = '50%';
    iconImg.style.objectFit = 'cover';
  }
}

// Обработчик клика по иконке аккаунта в хедере
if (accountIcon) {
  accountIcon.addEventListener('click', function(e) {
    e.preventDefault();
    if (isLoggedIn) {
      window.location.href = 'account.html';
    } else {
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }
  });
}

// Табы
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
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    isLoggedIn = true;
    localStorage.setItem('isLoggedIn', 'true');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
    const iconImg = accountIcon?.querySelector('img');
    if (iconImg) {
      iconImg.src = localStorage.getItem('userAvatar') || 'pictures/cat.png';
      iconImg.style.width = '35px';
      iconImg.style.height = '35px';
      iconImg.style.borderRadius = '50%';
      iconImg.style.objectFit = 'cover';
    }
  });
}

// Регистрация
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    isLoggedIn = true;
    localStorage.setItem('isLoggedIn', 'true');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
    const iconImg = accountIcon?.querySelector('img');
    if (iconImg) {
      iconImg.src = 'pictures/cat.png';
      iconImg.style.width = '35px';
      iconImg.style.height = '35px';
      iconImg.style.borderRadius = '50%';
      iconImg.style.objectFit = 'cover';
    }
  });
}