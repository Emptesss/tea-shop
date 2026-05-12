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
  window.toggleFavorite = function(btn) {
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