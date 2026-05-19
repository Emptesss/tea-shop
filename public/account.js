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
setupPasswordToggles();
  
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
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('userAvatar', data.avatar);
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
      
      let formattedPhone = '';
      if (phone && phone.trim() !== '') {
          if (!validateBelarusPhone(phone)) {
              alert('Неверный формат телефона!\n\nПравильные форматы:\n+375 (29) 123-45-67\n+375291234567\n80291234567\n\nКоды операторов: 29, 33, 44, 25\n\nИли оставьте поле пустым');
              return;
          }
          formattedPhone = formatBelarusPhone(phone);
      }
      
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
            phone: formattedPhone || null,
            birthDate: birthDate || null
          })
        });
        
        if (response.ok) {
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
    const cleaned = phone.replace(/[\s\(\)\-]/g, '');
    const regex = /^(\+375|80)(29|33|44|25|17)\d{7}$/;
    return regex.test(cleaned);
}

function formatBelarusPhone(phone) {
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
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Заполните все поля');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Новые пароли не совпадают');
            return;
        }
        
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
              localStorage.clear();
              
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

  // ========================
  // УДАЛЕНИЕ АККАУНТА
  // ========================
  const deleteBtn = document.querySelector('.account-delete-btn');
  const deleteModal = document.getElementById('deleteModal');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
          if (deleteModal) {
              deleteModal.classList.add('open');
              deleteModal.style.display = 'flex';
              document.body.style.overflow = 'hidden';
          }
      });
  }

  function closeDeleteModalWindow() {
      if (deleteModal) {
          deleteModal.classList.remove('open');
          deleteModal.style.display = 'none';
          document.body.style.overflow = '';
      }
  }

  if (closeDeleteModal) {
      closeDeleteModal.addEventListener('click', closeDeleteModalWindow);
  }

  if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', closeDeleteModalWindow);
  }

  if (deleteModal) {
      deleteModal.addEventListener('click', function(e) {
          if (e.target === deleteModal) {
              closeDeleteModalWindow();
          }
      });
  }

  if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async function() {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          confirmDeleteBtn.disabled = true;
          confirmDeleteBtn.textContent = 'Удаление...';
          cancelDeleteBtn.disabled = true;
          
          try {
              const response = await fetch('/api/auth/account', {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (response.ok) {
                  localStorage.clear();
                  
                  const headerIcon = document.querySelector('#accountIcon img');
                  if (headerIcon) {
                      headerIcon.src = 'pictures/profile.png';
                      headerIcon.style.width = '35px';
                      headerIcon.style.height = '35px';
                      headerIcon.style.borderRadius = '0';
                      headerIcon.style.objectFit = 'contain';
                  }
                  
                  alert('Аккаунт успешно удалён');
                  window.location.href = 'glavnaya.html';
              } else {
                  const data = await response.json();
                  alert(data.error || 'Ошибка удаления аккаунта');
                  confirmDeleteBtn.disabled = false;
                  confirmDeleteBtn.textContent = 'Да, удалить';
                  cancelDeleteBtn.disabled = false;
              }
          } catch (error) {
              console.error('Ошибка:', error);
              alert('Ошибка соединения с сервером');
              confirmDeleteBtn.disabled = false;
              confirmDeleteBtn.textContent = 'Да, удалить';
              cancelDeleteBtn.disabled = false;
          }
      });
  }

  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && deleteModal && deleteModal.classList.contains('open')) {
          closeDeleteModalWindow();
      }
  });

  // ========================
  // ЗАГРУЗКА ЗАКАЗОВ
  // ========================
  loadOrders();
  
}); // КОНЕЦ DOMContentLoaded

// ========================
// ВСЕ ФУНКЦИИ ЗАКАЗОВ (ГЛОБАЛЬНЫЕ)
// ========================

async function loadOrders() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.error('Ошибка загрузки заказов:', response.status);
            return;
        }
        
        const data = await response.json();
        window._allOrders = data.orders;
        renderOrders(data.orders);
        
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
}

function renderOrders(orders) {
    const container = document.getElementById('panel-orders');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="account-card" style="text-align:center;padding:40px;">
                <p style="color:rgba(255,255,255,0.5);font-size:16px;">У вас пока нет заказов</p>
                <a href="catalog.html" style="display:inline-block;margin-top:16px;padding:12px 24px;background:linear-gradient(to right, #0D2719, #337B57);border-radius:100px;color:white;text-decoration:none;">Перейти в каталог</a>
            </div>
        `;
        return;
    }
    
    const statusMap = {
        'NEW': { text: 'Новый', class: 'new' },
        'PROCESSING': { text: 'Собирается', class: 'processing' },
        'READY_FOR_PICKUP': { text: 'Готов к выдаче', class: 'ready-pickup' },
        'SHIPPED': { text: 'В пути', class: 'shipped' },
        'DELIVERED': { text: 'Доставлен', class: 'delivered' },
        'CANCELLED': { text: 'Отменён', class: 'cancelled' },
        'REFUNDED': { text: 'Возврат', class: 'cancelled' }
    };
    
    const paymentMap = {
        'UNPAID': 'Не оплачен',
        'PAID': 'Оплачен',
        'REFUND_PENDING': 'Ожидает возврата',
        'REFUNDED': 'Возвращён'
    };
    
    const deliveryMap = {
        'pickup': 'Самовывоз',
        'courier': 'Курьером',
        'post': 'Почтой'
    };
    
    const paymentMethodMap = {
        'card': 'Картой онлайн',
        'cash': 'Наличными',
        'erip': 'ЕРИП'
    };
    
    container.innerHTML = orders.map(order => {
        const status = statusMap[order.status] || { text: order.status, class: '' };
        const date = new Date(order.created_at);
        const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
        const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        
        let actionsHtml = '';
        let hintHtml = '';
        
        const canEdit = order.status === 'NEW' && order.payment_status === 'UNPAID';
        const canCancel = order.status === 'NEW';
        
        if (canEdit) {
            actionsHtml = `
                <button class="order-edit-btn" onclick="openEditOrderModal(${order.id})" 
                        style="background:#337B57;border:none;border-radius:100px;padding:8px 18px;color:white;cursor:pointer;font-size:13px;">
                    Изменить заказ
                </button>
                <button class="order-cancel-btn" onclick="cancelOrder(${order.id})" 
                        style="background:#6B3A3A;border:none;border-radius:100px;padding:8px 18px;color:white;cursor:pointer;font-size:13px;">
                    Отменить заказ
                </button>`;
            hintHtml = '<p style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px;">Вы можете изменить или отменить заказ</p>';
        } else if (canCancel) {
            actionsHtml = `
                <button class="order-cancel-btn" onclick="cancelOrder(${order.id})" 
                        style="background:#6B3A3A;border:none;border-radius:100px;padding:8px 18px;color:white;cursor:pointer;font-size:13px;">
                    Отменить заказ
                </button>`;
            hintHtml = '<p style="font-size:12px;color:#f4a742;margin-top:6px;">Заказ оплачен. Для изменения свяжитесь с поддержкой. Отменить можно.</p>';
        } else if (order.status === 'PROCESSING') {
            hintHtml = '<p style="font-size:12px;color:#f4a742;margin-top:6px;">Заказ собирается. Для изменений свяжитесь с поддержкой</p>';
        } else if (order.status === 'READY_FOR_PICKUP') {
            hintHtml = '<p style="font-size:12px;color:#2ecc71;margin-top:6px;">Заказ ждёт вас в магазине!</p>';
        } else if (order.status === 'SHIPPED') {
            hintHtml = '<p style="font-size:12px;color:#9b59b6;margin-top:6px;">Заказ в пути</p>';
        } else if (order.status === 'DELIVERED') {
            hintHtml = '<p style="font-size:12px;color:#27ae60;margin-top:6px;">Заказ доставлен</p>';
} else if (order.status === 'CANCELLED') {
    hintHtml = '<p style="font-size:12px;color:#e74c3c;margin-top:6px;">Заказ отменён</p>';
} else if (order.status === 'REFUNDED') {
    hintHtml = '<p style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px;">Деньги возвращены</p>';
}
        
        const itemsHtml = order.items.map(item => {
            const imgSrc = item.product_image || 'pictures/placeholder.jpg';
            return `
            <div class="order-item">
                <img src="${imgSrc}" alt="${item.product_name}" class="order-item-img">
                <div class="order-item-info">
                    <span class="order-item-name">${item.product_name}</span>
                    <span class="order-item-qty">× ${item.quantity}</span>
                </div>
                <span class="order-item-price">${item.total} Br</span>
            </div>`;
        }).join('');
        
        return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-number">Заказ №${order.order_number}</span>
                <span class="order-date">${dateStr}</span>
                <span class="order-status ${status.class}">${status.text}</span>
            </div>
            <div style="display:flex;gap:20px;margin-bottom:8px;font-size:13px;color:rgba(255,255,255,0.5);">
                <span>🚚 ${deliveryMap[order.delivery_method] || order.delivery_method}</span>
                <span>💳 ${paymentMethodMap[order.payment_method] || order.payment_method}</span>
                <span>💰 ${paymentMap[order.payment_status] || order.payment_status}</span>
            </div>
            <div class="order-items">${itemsHtml}</div>
            <div class="order-footer">
                <span class="order-total">Итого: ${order.total} Br</span>
                <div style="display:flex;align-items:center;gap:10px;">
                    ${actionsHtml}
                </div>
            </div>
            ${hintHtml}
        </div>`;
    }).join('');
}

// ========================
// РЕДАКТИРОВАНИЕ ЗАКАЗА
// ========================
let currentEditOrderId = null;
let currentEditOrderItems = [];

window.openEditOrderModal = function(orderId) {
    const order = (window._allOrders || []).find(o => o.id === orderId);
    if (!order) return;
    
    currentEditOrderId = orderId;
    currentEditOrderItems = JSON.parse(JSON.stringify(order.items));
    
    document.getElementById('editOrderNumber').textContent = '№' + order.order_number;
    
    const itemsContainer = document.getElementById('editOrderItems');
    itemsContainer.innerHTML = order.items.map((item, index) => {
        const imgSrc = item.product_image || 'pictures/placeholder.jpg';
        return `
        <div class="order-item" style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);" data-index="${index}">
            <img src="${imgSrc}" alt="${item.product_name}" class="order-item-img" style="width:60px;height:60px;">
            <div class="order-item-info" style="flex:1;">
                <span class="order-item-name">${item.product_name}</span>
                <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
                    <div class="cart-item-qty" style="display:flex;align-items:center;gap:4px;background:rgba(255,255,255,0.05);border-radius:100px;padding:2px 4px;">
                        <button class="cart-qty-btn" onclick="changeEditQty(${index}, -1)">−</button>
                        <span class="cart-qty-value">${item.quantity}</span>
                        <button class="cart-qty-btn" onclick="changeEditQty(${index}, 1)">+</button>
                    </div>
                    <span style="color:rgba(255,255,255,0.5);font-size:13px;">× ${item.price} Br</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                <span class="order-item-price" style="font-weight:600;">${item.total} Br</span>
                <button onclick="removeEditItem(${index})" 
                        style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:14px;">Удалить</button>
            </div>
        </div>`;
    }).join('');
    
    updateEditTotal();
    document.getElementById('editOrderModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeEditOrderModal = function() {
    document.getElementById('editOrderModal').style.display = 'none';
    document.body.style.overflow = '';
    currentEditOrderId = null;
    currentEditOrderItems = [];
};

window.changeEditQty = function(index, delta) {
    let newQty = currentEditOrderItems[index].quantity + delta;
    if (newQty < 1) newQty = 1;
    
    currentEditOrderItems[index].quantity = newQty;
    currentEditOrderItems[index].total = (currentEditOrderItems[index].price * newQty).toFixed(2);
    
    const itemEl = document.querySelector(`#editOrderItems .order-item[data-index="${index}"]`);
    if (itemEl) {
        itemEl.querySelector('.cart-qty-value').textContent = newQty;
        itemEl.querySelector('.order-item-price').textContent = currentEditOrderItems[index].total + ' Br';
    }
    
    updateEditTotal();
};

window.removeEditItem = function(index) {
    if (!confirm('Удалить товар из заказа?')) return;
    
    currentEditOrderItems.splice(index, 1);
    
    if (currentEditOrderItems.length === 0) {
        alert('Нельзя удалить все товары. Отмените заказ полностью.');
        closeEditOrderModal();
        return;
    }
    
    const itemsContainer = document.getElementById('editOrderItems');
    itemsContainer.innerHTML = currentEditOrderItems.map((item, i) => {
        const imgSrc = item.product_image || 'pictures/placeholder.jpg';
        return `
        <div class="order-item" style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);" data-index="${i}">
            <img src="${imgSrc}" alt="${item.product_name}" class="order-item-img" style="width:60px;height:60px;">
            <div class="order-item-info" style="flex:1;">
                <span class="order-item-name">${item.product_name}</span>
                <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
                    <div class="cart-item-qty" style="display:flex;align-items:center;gap:4px;background:rgba(255,255,255,0.05);border-radius:100px;padding:2px 4px;">
                        <button class="cart-qty-btn" onclick="changeEditQty(${i}, -1)">−</button>
                        <span class="cart-qty-value">${item.quantity}</span>
                        <button class="cart-qty-btn" onclick="changeEditQty(${i}, 1)">+</button>
                    </div>
                    <span style="color:rgba(255,255,255,0.5);font-size:13px;">× ${item.price} Br</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                <span class="order-item-price" style="font-weight:600;">${item.total} Br</span>
                <button onclick="removeEditItem(${i})" 
                        style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:14px;">Удалить</button>
            </div>
        </div>`;
    }).join('');
    
    updateEditTotal();
};

function updateEditTotal() {
    const total = currentEditOrderItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
    document.getElementById('editOrderTotal').textContent = total.toFixed(2);
}

window.saveEditedOrder = async function() {
    const token = localStorage.getItem('token');
    
    for (const item of currentEditOrderItems) {
        const res = await fetch(`/api/orders/${currentEditOrderId}/items/${item.product_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: item.quantity })
        });
        
        if (!res.ok) {
            const err = await res.json();
            alert('Ошибка: ' + (err.error || 'Не удалось сохранить'));
            return;
        }
    }
    
    closeEditOrderModal();
    alert('Заказ обновлён!');
    loadOrders();
};

// Закрытие по клику на оверлей
document.getElementById('editOrderModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeEditOrderModal();
});

// Закрытие по ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('editOrderModal')?.style.display === 'flex') {
        closeEditOrderModal();
    }
});

// ========================
// ОТМЕНА ЗАКАЗА
// ========================
window.cancelOrder = async function(orderId) {
    if (!confirm('Вы уверены, что хотите отменить заказ?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            alert('Заказ отменён. ' + (data.refund ? 'Ожидайте возврат денег.' : ''));
            loadOrders();
        } else {
            alert(data.error || 'Ошибка отмены');
        }
    } catch(e) {
        alert('Ошибка соединения');
    }
};

// Повторить заказ
window.repeatOrder = async function(orderNumber) {
    alert('Функция повтора заказа будет добавлена позже');
};