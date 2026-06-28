document.addEventListener('DOMContentLoaded', function() {
  
  // ========================
  // КНОПКА «ЧИТАТЬ ДАЛЕЕ» — РАСКРЫТИЕ ТЕКСТА
  // ========================
  document.querySelectorAll('.blog-read-more-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.blog-card');
      const fullText = card.querySelector('.blog-card-full-text');
      const excerpt = card.querySelector('.blog-card-excerpt');

      if (fullText.style.display === 'block') {
        fullText.style.display = 'none';
        excerpt.style.display = '-webkit-box';
        this.textContent = 'Читать далее';
      } else {
        fullText.style.display = 'block';
        excerpt.style.display = 'none';
        this.textContent = 'Свернуть';
      }
    });
  });

  // ========================
  // ФИЛЬТР ПО КАТЕГОРИЯМ
  // ========================
  const categoryBtns = document.querySelectorAll('.blog-category-btn');
  const blogCards = document.querySelectorAll('.blog-card');
  const blogGrid = document.querySelector('.blog-grid');
  const pagination = document.querySelector('.blog-pagination');

  // Функция скрытия пагинации
  function updatePagination() {
    if (!pagination) return;
    const visibleCards = document.querySelectorAll('.blog-card:not(.hidden)');
    if (visibleCards.length <= 6) {
      pagination.style.display = 'none';
    } else {
      pagination.style.display = 'flex';
    }
  }

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      categoryBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const category = this.dataset.category;
      let visibleCount = 0;
      let singleCard = null;
      
      blogCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.classList.remove('hidden');
          visibleCount++;
          singleCard = card;
        } else {
          card.classList.add('hidden');
        }
      });
      
      if (visibleCount === 1 && singleCard) {
        blogGrid.style.columnCount = '1';
        singleCard.querySelector('.blog-card-image').style.height = '320px';
      } else {
        blogGrid.style.columnCount = '';
        blogCards.forEach(card => {
          card.querySelector('.blog-card-image').style.height = '220px';
        });
      }

      updatePagination();  // ← проверяем пагинацию
    });
  });

  // ========================
  // ПОИСК ПО СТАТЬЯМ
  // ========================
  const searchInput = document.getElementById('blogSearch');

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase().trim();
      let visibleCount = 0;
      let singleCard = null;
      
      blogCards.forEach(card => {
        const title = card.querySelector('.blog-card-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.blog-card-excerpt').textContent.toLowerCase();
        const fullText = card.querySelector('.blog-card-full-text');
        const fullTextContent = fullText ? fullText.textContent.toLowerCase() : '';
        
        if (title.includes(query) || excerpt.includes(query) || fullTextContent.includes(query)) {
          card.classList.remove('hidden');
          visibleCount++;
          singleCard = card;
        } else {
          card.classList.add('hidden');
        }
      });
      
      if (visibleCount === 1 && singleCard) {
        blogGrid.style.columnCount = '1';
        singleCard.querySelector('.blog-card-image').style.height = '320px';
      } else {
        blogGrid.style.columnCount = '';
        blogCards.forEach(card => {
          card.querySelector('.blog-card-image').style.height = '220px';
        });
      }

      updatePagination();  // ← проверяем пагинацию
    });
  }

  // ========================
  // ПАГИНАЦИЯ
  // ========================
  document.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.pagination-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Вызываем при загрузке
  updatePagination();

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