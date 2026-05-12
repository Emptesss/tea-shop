document.addEventListener('DOMContentLoaded', function() {
  
  // Удаление из избранного — клик по сердечку
  window.toggleFavorite = function(btn) {
    const card = btn.closest('.favorite-card-item');
    if (!card) return;
    
    const img = btn.querySelector('img');
    
    // Всегда убираем из избранного (сердечко уже активное)
    btn.classList.remove('active');
    img.src = 'pictures/heart-empty.png';
    
    // Анимация исчезновения
    card.classList.add('removing');
    
    setTimeout(() => {
      card.remove();
      checkEmpty();
    }, 300);
  };

  // Проверка пустого состояния
  function checkEmpty() {
    const cards = document.querySelectorAll('.favorite-card-item');
    const empty = document.getElementById('favoritesEmpty');
    const grid = document.getElementById('favoritesGrid');
    
    if (cards.length === 0 && grid && empty) {
      grid.style.display = 'none';
      empty.style.display = 'block';
    }
  }

  // Кнопка "В корзину"
  document.querySelectorAll('.favorite-card-item .add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const originalText = this.textContent;
      this.textContent = 'Добавлено!';
      this.style.opacity = '0.7';
      setTimeout(() => {
        this.textContent = originalText;
        this.style.opacity = '1';
      }, 1000);
    });
  });

  // Счётчики количества
  document.querySelectorAll('.qty-selector').forEach(counter => {
    const minusBtn = counter.querySelector('.minus');
    const plusBtn = counter.querySelector('.plus');
    const valueEl = counter.querySelector('.qty-value');

    minusBtn?.addEventListener('click', () => {
      let val = parseInt(valueEl.textContent);
      if (val > 1) valueEl.textContent = val - 1;
    });

    plusBtn?.addEventListener('click', () => {
      let val = parseInt(valueEl.textContent);
      if (val < 99) valueEl.textContent = val + 1;
    });
  });

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