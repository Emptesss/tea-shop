document.addEventListener('DOMContentLoaded', function() {
  
  // ========================
  // КОЛИЧЕСТВО ТОВАРОВ
  // ========================
  document.querySelectorAll('.cart-item-qty').forEach(qtyBlock => {
    const minusBtn = qtyBlock.querySelector('.cart-qty-btn:first-child');
    const plusBtn = qtyBlock.querySelector('.cart-qty-btn:last-child');
    const valueEl = qtyBlock.querySelector('.cart-qty-value');

    minusBtn?.addEventListener('click', () => {
      let val = parseInt(valueEl.textContent);
      if (val > 1) {
        valueEl.textContent = val - 1;
        updateCartTotal();
      }
    });

    plusBtn?.addEventListener('click', () => {
      let val = parseInt(valueEl.textContent);
      if (val < 99) {
        valueEl.textContent = val + 1;
        updateCartTotal();
      }
    });
  });

  // ========================
  // УДАЛЕНИЕ ТОВАРА
  // ========================
  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      const item = this.closest('.cart-item');
      if (!item) return;
      
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      item.style.transition = 'all 0.3s';
      
      setTimeout(() => {
        item.remove();
        updateCartTotal();
        checkEmpty();
      }, 300);
    });
  });

  // ========================
  // ЧЕКБОКСЫ — ПЕРЕСЧЁТ
  // ========================
  document.querySelectorAll('.cart-item-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateCartTotal);
  });

  // ========================
  // ПРОВЕРКА ПУСТОЙ КОРЗИНЫ
  // ========================
  function checkEmpty() {
    const items = document.querySelectorAll('.cart-item');
    const empty = document.getElementById('cartEmpty');
    const layout = document.getElementById('cartLayout');
    
    if (items.length === 0) {
      if (layout) layout.style.display = 'none';
      if (empty) empty.style.display = 'block';
    }
  }

  // Первый запуск
  updateCartTotal();

});

// ========================
// ПЕРЕСЧЁТ ИТОГОВ
// ========================
function updateCartTotal() {
  const items = document.querySelectorAll('.cart-item');
  let totalItems = 0;
  let totalPrice = 0;

  items.forEach(item => {
    const checkbox = item.querySelector('.cart-item-checkbox');
    if (checkbox && checkbox.checked) {
      const qtyEl = item.querySelector('.cart-qty-value');
      const priceEl = item.querySelector('.cart-item-price-value');
      if (qtyEl && priceEl) {
        const qty = parseInt(qtyEl.textContent);
        const price = parseInt(priceEl.textContent);
        totalItems += qty;
        totalPrice += price * qty;
      }
    }
  });

  const totalItemsEl = document.getElementById('cartTotalItems');
  const totalPriceEl = document.getElementById('cartTotalPrice');
  
  if (totalItemsEl) totalItemsEl.textContent = totalItems + ' товаров';
  if (totalPriceEl) totalPriceEl.textContent = totalPrice + ' Br';
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