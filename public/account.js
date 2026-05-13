document.addEventListener('DOMContentLoaded', function() {
  
  // ========================
  // ЗАГРУЗКА ПРОФИЛЯ С СЕРВЕРА
  // ========================
 async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const user = await response.json();
        
        // Заполняем приветствие
        const titleEl = document.querySelector('.account-title');
        if (titleEl) {
            const displayName = user.name || 'Пользователь';
            titleEl.textContent = `${displayName}, добрый день!`;
        }
        
        // Заполняем поля формы
        const nameInputs = document.querySelectorAll('#panel-profile .form-input[type="text"]');
        if (nameInputs[0]) nameInputs[0].value = user.name || '';        // Имя
        if (nameInputs[1]) nameInputs[1].value = user.last_name || '';   // Фамилия
        if (nameInputs[2]) nameInputs[2].value = user.middle_name || ''; // Отчество
        
        const emailInput = document.querySelector('#panel-profile input[type="email"]');
        if (emailInput) emailInput.value = user.email || '';
        
        const phoneInput = document.querySelector('#panel-profile input[type="tel"]');
        if (phoneInput) phoneInput.value = user.phone || '';
        
        const birthInput = document.querySelector('#panel-profile input[type="date"]');
        if (birthInput && user.birth_date) {
        const dbDate = user.birth_date; 
        birthInput.value = dbDate.split('T')[0];
}
        
        // Загружаем аватар
        if (user.avatar) {
          if (avatarImg) avatarImg.src = user.avatar;
          updateHeaderAvatar(user.avatar);
          localStorage.setItem('userAvatar', user.avatar);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
}

// ========================
// ГЛАЗИК ДЛЯ ПАРОЛЕЙ
// ========================
function setupPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        // Проверяем, не добавлен ли уже глазик
        if (input.parentNode.querySelector('.password-toggle')) return;
        
        // Создаём кнопку-глазик
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<img src="pictures/nevidimo.png" alt="Показать пароль" class="password-toggle-img">';
        
        // Вставляем глазик после поля ввода
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(toggleBtn);
        
        // Обработчик клика
        toggleBtn.addEventListener('click', function() {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            
            const img = this.querySelector('.password-toggle-img');
            img.src = isPassword ? 'pictures/vidimo.png' : 'pictures/nevidimo.png';
            img.alt = isPassword ? 'Скрыть пароль' : 'Показать пароль';
        });
    });
}
// Следим за изменениями в DOM (например, переключение табов модалки)
const observer = new MutationObserver(function() {
    setupPasswordToggles();
});

observer.observe(document.body, { childList: true, subtree: true });
// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', setupPasswordToggles);
  
  // ========================
  // ЗАГРУЗКА АВАТАРА
  // ========================
  const avatarWrapper = document.getElementById('avatarWrapper');
  const avatarImg = document.getElementById('accountAvatar');
  const avatarInput = document.getElementById('avatarInput');
  const defaultAvatar = 'pictures/cat.png';

  if (avatarWrapper && avatarInput) {
    avatarWrapper.addEventListener('click', function() {
      avatarInput.click();
    });

        avatarInput.addEventListener('change', async function() {
      const file = this.files[0];
      if (!file) return;
      
      // Показываем локально сразу
      const reader = new FileReader();
      reader.onload = function(e) {
        avatarImg.src = e.target.result;
        updateHeaderAvatar(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Отправляем файл на сервер
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);
      
      try {
        const response = await fetch('/api/auth/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData  // ← без 'Content-Type', браузер сам поставит multipart/form-data
        });
        
        if (response.ok) {
          const data = await response.json();
          // Сохраняем путь к файлу в localStorage
          localStorage.setItem('userAvatar', data.avatar);
          // Обновляем аватар в хедере из серверного пути
          avatarImg.src = data.avatar;
          updateHeaderAvatar(data.avatar);
        }
      } catch (error) {
        console.error('Ошибка сохранения аватара:', error);
      }
    });
  }

  // Загружаем сохранённый аватар
  const savedAvatar = localStorage.getItem('userAvatar');
  if (avatarImg) {
    avatarImg.src = savedAvatar || defaultAvatar;
  }
  if (savedAvatar) {
    updateHeaderAvatar(savedAvatar);
  }

  function updateHeaderAvatar(src) {
    const headerIcon = document.querySelector('#accountIcon img');
    if (headerIcon) {
      headerIcon.src = src;
      headerIcon.style.width = '35px';
      headerIcon.style.height = '35px';
      headerIcon.style.borderRadius = '50%';
      headerIcon.style.objectFit = 'cover';
    }
  }

  // Функция перевода файла в base64
  function toBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  // ========================
  // СОХРАНЕНИЕ ПРОФИЛЯ
  // ========================
    // ========================
  // СОХРАНЕНИЕ ПРОФИЛЯ
  // ========================
  const profileForm = document.querySelector('#panel-profile .account-form');
if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const nameInputs = this.querySelectorAll('input[type="text"]');
      const name = nameInputs[0]?.value || '';
      const lastName = nameInputs[1]?.value || '';
      const middleName = nameInputs[2]?.value || '';
      
      const phone = this.querySelector('input[type="tel"]')?.value;
      const birthDate = this.querySelector('input[type="date"]')?.value;
      
      // Валидация телефона
      if (phone && phone.trim() !== '') {
          if (!validateBelarusPhone(phone)) {
              alert('Неверный формат телефона!\n\nПравильные форматы:\n+375 (29) 123-45-67\n+375291234567\n80291234567\n\nКоды операторов: 29, 33, 44, 25');
              return;
          }
      }
      
      const formattedPhone = phone ? formatBelarusPhone(phone) : '';
      
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            name, 
            lastName, 
            middleName, 
            phone: formattedPhone,
            birthDate: birthDate || null
          })
        });
        
        if (response.ok) {
          // Обновляем поле телефона на отформатированное
          const phoneInput = document.querySelector('#panel-profile input[type="tel"]');
          if (phoneInput) phoneInput.value = formattedPhone;
          
          const titleEl = document.querySelector('.account-title');
          if (titleEl && name) {
            titleEl.textContent = `${name}, добрый день!`;
          }
          alert('Профиль сохранён!');
        } else {
          const data = await response.json();
          alert(data.error || 'Ошибка сохранения');
        }
      } catch (error) {
        console.error('Ошибка сохранения:', error);
      }
    });
}

  // ========================
  // ТАБЫ
  // ========================
  document.querySelectorAll('.account-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.account-panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('panel-' + this.dataset.tab).classList.add('active');
    });
  });
// ========================
// ВАЛИДАЦИЯ БЕЛОРУССКОГО ТЕЛЕФОНА
// ========================
function validateBelarusPhone(phone) {
    // Убираем все пробелы, скобки, тире
    const cleaned = phone.replace(/[\s\(\)\-]/g, '');
    
    // Форматы: +375291234567, +375 29 1234567, 80291234567, +375(29)123-45-67
    const regex = /^(\+375|80)(29|33|44|25|17)\d{7}$/;
    return regex.test(cleaned);
}

function formatBelarusPhone(phone) {
    // Приводим к единому формату +375 XX XXX-XX-XX
    const cleaned = phone.replace(/[\s\(\)\-]/g, '');
    let digits = cleaned;
    
    if (digits.startsWith('80')) {
        digits = '+375' + digits.substring(2);
    }
    
    if (digits.length === 13 && digits.startsWith('+375')) {
        return `+375 (${digits.substring(4, 6)}) ${digits.substring(6, 9)}-${digits.substring(9, 11)}-${digits.substring(11, 13)}`;
    }
    
    return phone;
}

// ========================
// СМЕНА ПАРОЛЯ
// ========================
const settingsForm = document.querySelector('#panel-settings .account-form');
if (settingsForm) {
    settingsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = this.querySelector('input[name="currentPassword"]')?.value;
const newPassword = this.querySelector('input[name="newPassword"]')?.value;
const confirmPassword = this.querySelector('input[name="confirmPassword"]')?.value;
        
        // Проверка заполнения
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Заполните все поля');
            return;
        }
        
        // Проверка совпадения нового пароля
        if (newPassword !== confirmPassword) {
            alert('Новые пароли не совпадают');
            return;
        }
        
        // Проверка длины
        if (newPassword.length < 6) {
            alert('Новый пароль должен быть не менее 6 символов');
            return;
        }
        
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Пароль успешно изменён!');
                // Очищаем поля
                this.querySelector('input[name="currentPassword"]').value = '';
this.querySelector('input[name="newPassword"]').value = '';
this.querySelector('input[name="confirmPassword"]').value = '';
            } else {
                alert(data.error || 'Ошибка смены пароля');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения с сервером');
        }
    });
}
  // ========================
  // ВЫХОД
  // ========================
  const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            // Очищаем ВСЁ
            localStorage.clear();
            
            // Возвращаем иконку на дефолт
            const headerIcon = document.querySelector('#accountIcon img');
            if (headerIcon) {
                headerIcon.src = 'pictures/profile.png';
                headerIcon.style.width = '35px';
                headerIcon.style.height = '35px';
                headerIcon.style.borderRadius = '0';
                headerIcon.style.objectFit = 'contain';
            }
            
            window.location.href = 'glavnaya.html';
        }
    });
}

  // Загружаем профиль при открытии
  loadProfile();
});