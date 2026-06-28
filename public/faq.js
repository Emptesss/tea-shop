/**
 * Скрипты для страницы FAQ
 */
document.addEventListener('DOMContentLoaded', function() {
  
  // ========================
  // АККОРДЕОН
  // ========================
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(button => {
    button.addEventListener('click', function() {
      const faqItem = this.closest('.faq-item');
      const isOpen = faqItem.classList.contains('active');
      
      // Закрыть все
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      
      // Открыть текущий (если был не открыт)
      if (!isOpen) {
        faqItem.classList.add('active');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });
  
  // ========================
  // ПОИСК ПО ВОПРОСАМ
  // ========================
  const searchInput = document.getElementById('faqSearch');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase().trim();
      
      document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question-text').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer-inner').textContent.toLowerCase();
        
        if (query === '') {
          item.classList.remove('hidden');
        } else if (question.includes(query) || answer.includes(query)) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  }
  
  // ========================
  // ФИЛЬТР ПО КАТЕГОРИЯМ
  // ========================
  const categoryBtns = document.querySelectorAll('.faq-category-btn');
  
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const category = this.dataset.category;
      
      // Обновляем активную кнопку
      categoryBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Показываем/скрываем вопросы
      document.querySelectorAll('.faq-item').forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
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