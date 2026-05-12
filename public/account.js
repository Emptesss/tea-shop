document.addEventListener('DOMContentLoaded', function() {
  
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

    avatarInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          avatarImg.src = e.target.result;
          localStorage.setItem('userAvatar', e.target.result);
          updateHeaderAvatar(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Загружаем сохранённый аватар или плейсхолдер
  const savedAvatar = localStorage.getItem('userAvatar');
  
  if (avatarImg) {
    avatarImg.src = savedAvatar || defaultAvatar;
  }
  
  // Обновляем иконку в хедере
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
  // ВЫХОД
  // ========================
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.setItem('isLoggedIn', 'false');
        localStorage.removeItem('userAvatar');
        
        // Возвращаем иконку в хедере на дефолтную
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

});