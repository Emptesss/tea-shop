/**
 * Скрипты для страницы контактов
 */
document.addEventListener('DOMContentLoaded', function() {
  
  // ========================
  // ИНИЦИАЛИЗАЦИЯ ЯНДЕКС.КАРТЫ
  // ========================
  if (typeof ymaps !== 'undefined') {
    ymaps.ready(initMap);
  }
  
  function initMap() {
    const mapContainer = document.getElementById('yandex-map');
    
    if (!mapContainer) return;
    
    // Координаты (пример — Минск, ул. Чайная — замените на реальные)
    const coordinates = [53.9045, 27.5615];
    
    const map = new ymaps.Map(mapContainer, {
      center: coordinates,
      zoom: 16,
      controls: ['zoomControl', 'fullscreenControl']
    });
    
    // Добавляем метку
    const placemark = new ymaps.Placemark(coordinates, {
      hintContent: 'Forest Tea',
      balloonContent: `
        <strong>Forest Tea</strong><br>
        агрогородок Лесной, ул. Чайная, д. 15<br>
        Пн–Пт: 10:00–21:00<br>
        Сб–Вс: 11:00–20:00
      `
    }, {
      iconLayout: 'default#image',
      iconImageHref: '/pictures/icons/map-marker.svg',
      iconImageSize: [40, 40],
      iconImageOffset: [-20, -40]
    });
    
    map.geoObjects.add(placemark);
  }
  
  // Если Яндекс.Карты не загрузились — показываем заглушку
  if (typeof ymaps === 'undefined') {
    const mapContainer = document.getElementById('yandex-map');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #2a3a30;">
          <a href="https://yandex.ru/maps/?text=Минск, Чайная, 15" 
             target="_blank" 
             style="color: white; text-decoration: underline;">
            Открыть карту в Яндекс.Картах
          </a>
        </div>
      `;
    }
  }
  
  // ========================
  // ОБРАБОТКА ФОРМЫ ОБРАТНОЙ СВЯЗИ
  // ========================
  const feedbackForm = document.getElementById('feedbackForm');
  
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = this.querySelector('.feedback-submit-btn');
      const messageBox = document.getElementById('feedback-message-box');
      
      // Получаем данные формы
      const formData = {
        name: document.getElementById('feedback-name').value.trim(),
        email: document.getElementById('feedback-email').value.trim(),
        phone: document.getElementById('feedback-phone').value.trim(),
        theme: document.getElementById('feedback-theme').value,
        message: document.getElementById('feedback-message').value.trim()
      };
      
      // Валидация
      if (!formData.name || !formData.email || !formData.message) {
        showFormMessage('Пожалуйста, заполните обязательные поля', 'error');
        return;
      }
      
      if (!isValidEmail(formData.email)) {
        showFormMessage('Введите корректный email', 'error');
        return;
      }
      
      // Блокируем кнопку
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
      
      try {
        // Отправка на сервер
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showFormMessage('✓ Сообщение отправлено! Мы ответим в ближайшее время.', 'success');
          feedbackForm.reset();
        } else {
          showFormMessage(data.error || 'Ошибка отправки. Попробуйте позже.', 'error');
        }
      } catch (error) {
        console.error('Ошибка:', error);
        showFormMessage('Не удалось подключиться к серверу', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить сообщение';
      }
    });
  }
  
  function showFormMessage(text, type) {
    const messageBox = document.getElementById('feedback-message-box');
    if (messageBox) {
      messageBox.textContent = text;
      messageBox.className = 'feedback-message ' + type;
      
      if (type === 'success') {
        setTimeout(() => {
          messageBox.textContent = '';
          messageBox.className = 'feedback-message';
        }, 5000);
      }
    }
  }
  
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  // ========================
  // МАСКА ДЛЯ ТЕЛЕФОНА
  // ========================
  const phoneInput = document.getElementById('feedback-phone');
  
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let value = this.value.replace(/\D/g, '');
      
      if (value.startsWith('375')) {
        value = value.substring(3);
      }
      
      if (value.length > 0) {
        let formatted = '+375 (';
        
        if (value.length >= 2) {
          formatted += value.substring(0, 2) + ') ';
        } else {
          formatted += value + ') ';
        }
        
        if (value.length >= 5) {
          formatted += value.substring(2, 5) + '-';
        } else if (value.length > 2) {
          formatted += value.substring(2);
        }
        
        if (value.length >= 7) {
          formatted += value.substring(5, 7) + '-';
        } else if (value.length > 5) {
          formatted += value.substring(5);
        }
        
        if (value.length > 7) {
          formatted += value.substring(7, 9);
        }
        
        this.value = formatted;
      } else {
        this.value = '';
      }
    });
    
    phoneInput.addEventListener('focus', function() {
      if (!this.value) {
        this.value = '+375 (';
      }
    });
    
    phoneInput.addEventListener('blur', function() {
      if (this.value === '+375 (' || this.value === '+375' || this.value.length < 5) {
        this.value = '';
      }
    });
  }
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