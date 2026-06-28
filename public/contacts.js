/**
 * Скрипты для страницы контактов
 */
document.addEventListener('DOMContentLoaded', function() {
  
  console.log('✅ contacts.js загружен');
  
  // ========================
  // ИНИЦИАЛИЗАЦИЯ ЯНДЕКС.КАРТЫ
  // ========================
  if (typeof ymaps !== 'undefined') {
    ymaps.ready(initMap);
  }
  
  function initMap() {
    const mapContainer = document.getElementById('yandex-map');
    if (!mapContainer) return;
    
    const coordinates = [53.9045, 27.5615];
    const map = new ymaps.Map(mapContainer, {
      center: coordinates, zoom: 16,
      controls: ['zoomControl', 'fullscreenControl']
    });
    
    const placemark = new ymaps.Placemark(coordinates, {
      hintContent: 'Forest Tea',
      balloonContent: '<strong>Forest Tea</strong><br>агрогородок Лесной, ул. Чайная, д. 15'
    }, {
      iconLayout: 'default#image',
      iconImageHref: '/pictures/icons/map-marker.svg',
      iconImageSize: [40, 40],
      iconImageOffset: [-20, -40]
    });
    map.geoObjects.add(placemark);
  }
  
  if (typeof ymaps === 'undefined') {
    const mapContainer = document.getElementById('yandex-map');
    if (mapContainer) {
      mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#2a3a30;"><a href="https://yandex.ru/maps/?text=Минск" target="_blank" style="color:white;">Открыть карту</a></div>';
    }
  }
  
  // ========================
  // ОБРАБОТКА ФОРМЫ ОБРАТНОЙ СВЯЗИ
  // ========================
  const feedbackForm = document.getElementById('feedbackForm');
  
  if (feedbackForm) {
    console.log('✅ Форма #feedbackForm найдена');
    
    feedbackForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      console.log('📤 Кнопка нажата, форма не обновляет страницу!');
      
      const submitBtn = this.querySelector('.feedback-submit-btn');
      
      const name = document.getElementById('feedback-name').value.trim();
      const email = document.getElementById('feedback-email').value.trim();
      const phone = document.getElementById('feedback-phone').value.trim();
      const theme = document.getElementById('feedback-theme').value;
      const message = document.getElementById('feedback-message').value.trim();
      
      console.log('📋 Данные:', { name, email, phone, theme, message });
      
      if (!name || !email || !message) {
        alert('Заполните обязательные поля: Имя, Email и Сообщение');
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
      
      try {
        console.log('📡 Отправляю fetch на /api/feedback...');
        
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, theme, message })
        });
        
        console.log('📥 Статус ответа:', response.status);
        
        const data = await response.json();
        console.log('📥 Данные ответа:', data);
        
        if (response.ok) {
          const msgBox = document.getElementById('feedback-message-box');
          if (msgBox) {
            msgBox.textContent = '✓ Сообщение отправлено! Мы ответим в ближайшее время.';
            msgBox.className = 'feedback-message success';
            msgBox.style.display = 'block';
            setTimeout(() => { msgBox.style.display = 'none'; }, 5000);
          }
          feedbackForm.reset();
          alert('✅ Сообщение отправлено! Проверьте почту.');
        } else {
          alert('❌ Ошибка: ' + (data.error || 'Неизвестная ошибка'));
        }
      } catch (error) {
        console.error('❌ Ошибка fetch:', error);
        alert('❌ Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
      }
    });
    
    console.log('✅ Обработчик формы настроен');
  } else {
    console.error('❌ Форма #feedbackForm НЕ найдена!');
  }
  
  // ========================
  // МАСКА ДЛЯ ТЕЛЕФОНА
  // ========================
  const phoneInput = document.getElementById('feedback-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      let value = this.value.replace(/\D/g, '');
      if (value.startsWith('375')) value = value.substring(3);
      if (value.length > 0) {
        let formatted = '+375 (';
        if (value.length >= 2) formatted += value.substring(0, 2) + ') ';
        else formatted += value + ') ';
        if (value.length >= 5) formatted += value.substring(2, 5) + '-';
        else if (value.length > 2) formatted += value.substring(2);
        if (value.length >= 7) formatted += value.substring(5, 7) + '-';
        else if (value.length > 5) formatted += value.substring(5);
        if (value.length > 7) formatted += value.substring(7, 9);
        this.value = formatted;
      } else {
        this.value = '';
      }
    });
  }
});

// ========================
// АНИМАЦИЯ ПОЯВЛЕНИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// (без скролла и IntersectionObserver — играет один раз, предсказуемо,
// одинаково для всех блоков, без рывков и "зависших" элементов)
// ========================
(function() {
    const main = document.querySelector('.contacts-main');
    if (!main) return;

    const items = Array.from(main.querySelectorAll('.contacts-reveal'));
    if (items.length === 0) return;

    function play() {
        items.forEach((el, i) => {
            el.style.animationDelay = Math.min(i * 0.08, 0.32) + 's';
            el.classList.add('contacts-reveal-play');
            el.addEventListener('animationend', function handler() {
                el.classList.remove('contacts-reveal-play');
                el.style.animationDelay = '';
                el.removeEventListener('animationend', handler);
            });
        });
    }

    // Если страница была предзагружена браузером заранее (prerendering),
    // запускаем анимацию в момент её реального показа пользователю
    if (document.prerendering) {
        document.addEventListener('prerenderingchange', play, { once: true });
    } else {
        play();
    }
})();