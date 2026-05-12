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
        blogGrid.style.gridTemplateColumns = '1fr';
        blogGrid.style.justifyItems = 'center';
        singleCard.querySelector('.blog-card-image').style.height = '320px';
      } else {
        blogGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        blogGrid.style.justifyItems = 'stretch';
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
        blogGrid.style.gridTemplateColumns = '1fr';
        blogGrid.style.justifyItems = 'center';
        singleCard.querySelector('.blog-card-image').style.height = '320px';
      } else {
        blogGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        blogGrid.style.justifyItems = 'stretch';
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
const modal = document.getElementById('loginModal');
const accountIcon = document.getElementById('accountIcon');
const closeModal = document.getElementById('closeModal');
const modalTabs = document.querySelectorAll('.modal-tab');
const modalForms = document.querySelectorAll('.modal-form');

let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// При загрузке — ставим аватар или плейсхолдер
if (isLoggedIn && accountIcon) {
  const iconImg = accountIcon.querySelector('img');
  const savedAvatar = localStorage.getItem('userAvatar');
  iconImg.src = savedAvatar || 'pictures/cat.png';   // ← котик если нет аватара
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

// Закрытие
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
  iconImg.src = 'pictures/cat.png';          // ← котик при регистрации
  iconImg.style.width = '35px';
  iconImg.style.height = '35px';
  iconImg.style.borderRadius = '50%';
  iconImg.style.objectFit = 'cover';
});