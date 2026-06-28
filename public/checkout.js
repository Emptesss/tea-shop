// ========================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ========================
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// ========================
// ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ
// ========================
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('loginModal');
  const closeBtn = document.getElementById('closeModal');

  if (!isLoggedIn && modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.style.display = '';
  }

  function closeAndRedirect() {
    if (!isLoggedIn) {
      window.location.href = 'cart.html';
    } else {
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeAndRedirect);
  }

  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeAndRedirect();
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeAndRedirect();
    }
  });
    // ========================
  // ПРОВЕРКА ПОВТОРА ЗАКАЗА
  // ========================
  const repeatItems = sessionStorage.getItem('repeatOrderItems');
  
  if (repeatItems) {
      const items = JSON.parse(repeatItems);
      console.log('🔄 Повтор заказа, товары:', items);
      
      // Отображаем товары в сводке БЕЗ добавления в корзину
      const itemsContainer = document.querySelector('.checkout-items');
      if (itemsContainer) {
          itemsContainer.innerHTML = items.map(item => {
              const imgSrc = item.image || 'pictures/placeholder.jpg';
              return `
              <div class="checkout-item">
                  <img src="${imgSrc}" alt="${item.name}" class="checkout-item-img">
                  <div class="checkout-item-info">
                      <span class="checkout-item-name">${item.name}</span>
                      <span class="checkout-item-qty">× ${item.quantity}</span>
                  </div>
                  <span class="checkout-item-price">${(item.price * item.quantity).toFixed(0)} Br</span>
              </div>`;
          }).join('');
      }
      
      // Сохраняем товары в глобальную переменную
      window._repeatOrderItems = items;
      
      // Обновляем сумму
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const subtotalEl = document.getElementById('checkoutSubtotal');
      const totalEl = document.getElementById('checkoutTotal');
      if (subtotalEl) subtotalEl.textContent = subtotal + ' Br';
      if (totalEl) totalEl.textContent = subtotal + ' Br';
  }
  
  // Очищаем повтор при уходе
  window.addEventListener('beforeunload', function() {
      sessionStorage.removeItem('repeatOrderItems');
  });
  
  loadCheckoutCart().then(() => {
    const card = document.querySelector('.checkout-summary-card');
    if (card) { card.style.transition = 'opacity 0.3s ease'; card.style.opacity = '1'; }
    const footer = document.querySelector('.footer');
    if (footer) { footer.style.transition = 'opacity 0.3s ease'; footer.style.opacity = '1'; }
  });
  setupPasswordToggles();
});

// ========================
// ЗАГРУЗКА КОРЗИНЫ В СВОДКУ
// ========================
async function loadCheckoutCart() {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('cartSessionId');
    
    if (!token && !sessionId) return;
    
    try {
        let url = '/api/cart';
        let options = {};
        
        if (token) {
            options.headers = { 'Authorization': `Bearer ${token}` };
        }
        
        if (!token && sessionId) {
            url += `?sessionId=${sessionId}`;
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) return;
        
        const itemsContainer = document.querySelector('.checkout-items');
        if (itemsContainer) {
            itemsContainer.innerHTML = data.items.map(item => {
                const imgSrc = item.main_image_url || 'pictures/placeholder.jpg';
                return `
                <div class="checkout-item">
                    <img src="${imgSrc}" alt="${item.name}" class="checkout-item-img">
                    <div class="checkout-item-info">
                        <span class="checkout-item-name">${item.name}</span>
                        <span class="checkout-item-qty">× ${item.quantity}</span>
                    </div>
                    <span class="checkout-item-price">${(item.price * item.quantity).toFixed(0)} Br</span>
                </div>`;
            }).join('');
        }
        
        updateCheckoutTotal(data.items);
        
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

function updateCheckoutTotal(items) {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const totalEl = document.getElementById('checkoutTotal');
    
    if (subtotalEl) subtotalEl.textContent = subtotal + ' Br';
    if (totalEl) totalEl.textContent = subtotal + ' Br';
}

// ✅ Считает сумму к предоплате на основе ТЕКУЩЕГО выбора способа оплаты/доставки
function getAmountToPay() {
    const paymentEl = document.querySelector('input[name="payment"]:checked');
    const deliveryEl = document.querySelector('input[name="delivery"]:checked');
    const payment_method = paymentEl ? paymentEl.value : 'card';
    const delivery_method = deliveryEl ? deliveryEl.value : 'pickup';

    if (payment_method === 'card' || payment_method === 'erip') {
        const totalText = document.getElementById('checkoutTotal').textContent;
        return parseFloat(totalText.replace(/[^0-9.]/g, '')) || 0;
    } else if (payment_method === 'cash' && delivery_method !== 'pickup') {
        return delivery_method === 'courier' ? 10 : 15;
    }
    return 0;
}

// ========================
// АККОРДЕОН ШАГОВ
// ========================
function nextStep(currentId, nextId) {
  const current = document.getElementById(currentId);
  
  if (currentId === 'cardContact') {
    const name = document.getElementById('checkoutName').value.trim();
    const surname = document.getElementById('checkoutSurname').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();
    if (!name || !surname || !phone) {
      alert('Заполните обязательные поля: Имя, Фамилия, Телефон');
      return;
    }
  }

 if (currentId === 'cardDelivery') {
    const delivery = document.querySelector('input[name="delivery"]:checked');
    if (delivery) {
        if (delivery.value === 'courier') {
            const city = document.getElementById('courierCity').value.trim();
            const street = document.getElementById('courierStreet').value.trim();
            const house = document.getElementById('courierHouse').value.trim();
            if (!city || !street || !house) {
                alert('Заполните город, улицу и дом');
                return;
            }
        } else if (delivery.value === 'post') {
            const city = document.getElementById('postCity').value.trim();
            const street = document.getElementById('postStreet').value.trim();
            const index = document.getElementById('postalIndex').value.trim();
            if (!city || !street || !index) {
                alert('Заполните город, улицу и почтовый индекс');
                return;
            }
        }
    }
}

  // ✅ При переходе с оплаты — открываем модалку, меняем кнопку
  if (currentId === 'cardPayment') {
    const amountToPay = getAmountToPay();

    if (amountToPay > 0) {
        showCardPayment(amountToPay);
    }

    // Меняем кнопку "Продолжить" на "Изменить способ оплаты"
    const nextBtn = current.querySelector('.step-next-btn');
    if (nextBtn) {
        nextBtn.textContent = 'Изменить способ оплаты';
        // ✅ Пересчитываем способ оплаты/сумму заново при каждом клике —
        // пользователь мог вернуться и поменять способ оплаты или доставки
        nextBtn.onclick = function() {
            const currentAmount = getAmountToPay();
            if (currentAmount > 0) {
                showCardPayment(currentAmount);
            } else {
                // Без попапа — закрываем шаг оплаты и открываем следующий шаг (комментарий)
                current.classList.remove('active');
                const commentCard = document.getElementById('cardComment');
                if (commentCard) {
                    commentCard.classList.remove('locked');
                    commentCard.classList.add('active');
                }
            }
        };
    }
  }

  current.classList.remove('active');
  current.classList.add('done');
  current.classList.remove('locked');

  if (nextId && nextId !== '') {
    const next = document.getElementById(nextId);
    if (next) {
      next.classList.remove('locked');
      next.classList.add('active');
      
      const header = next.querySelector('.checkout-card-header');
      if (header) {
        const top = header.getBoundingClientRect().top + window.pageYOffset - 600;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  checkAllDone();
}

function checkAllDone() {
  const contactDone = document.getElementById('cardContact').classList.contains('done');
  const deliveryDone = document.getElementById('cardDelivery').classList.contains('done');
  const paymentDone = document.getElementById('cardPayment').classList.contains('done');
  const btn = document.getElementById('confirmOrderBtn');
  if (btn) {
    btn.disabled = !(contactDone && deliveryDone && paymentDone);
  }
}

// ========================
// ИНИЦИАЛИЗАЦИЯ
// ========================
document.addEventListener('DOMContentLoaded', function() {
  
  const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
const deliveryAddress = document.getElementById('deliveryAddress');
const courierFields = document.getElementById('courierAddressFields');
const postFields = document.getElementById('postAddressFields');

deliveryRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'courier') {
            if (deliveryAddress) deliveryAddress.style.display = 'block';
            if (courierFields) courierFields.style.display = 'block';
            if (postFields) postFields.style.display = 'none';
        } else if (this.value === 'post') {
            if (deliveryAddress) deliveryAddress.style.display = 'block';
            if (courierFields) courierFields.style.display = 'none';
            if (postFields) postFields.style.display = 'block';
        } else {
            if (deliveryAddress) deliveryAddress.style.display = 'none';
            if (courierFields) courierFields.style.display = 'none';
            if (postFields) postFields.style.display = 'none';
        }
        resetCardData();
        updateTotal();
        updatePrepaymentInfo();
    });
});

const paymentRadios = document.querySelectorAll('input[name="payment"]');
  const prepaymentInfo = document.getElementById('prepaymentInfo');

  paymentRadios.forEach(radio => {
      radio.addEventListener('change', function() {
          if (this.value === 'cash') {
              if (prepaymentInfo) prepaymentInfo.style.display = 'block';
          } else {
              if (prepaymentInfo) prepaymentInfo.style.display = 'none';
          }
          resetCardData();
        updatePrepaymentInfo();
      });
  });
  // ✅ Функция обновления информации о предоплате
  function updatePrepaymentInfo() {
      const paymentEl = document.querySelector('input[name="payment"]:checked');
      const deliveryEl = document.querySelector('input[name="delivery"]:checked');
      const prepaymentInfo = document.getElementById('prepaymentInfo');
      
      if (!paymentEl || !deliveryEl || !prepaymentInfo) return;
      
      const payment_method = paymentEl.value;
      const delivery_method = deliveryEl.value;
      
      // Показываем предоплату ТОЛЬКО при наличных + доставка (не самовывоз)
      if (payment_method === 'cash' && delivery_method !== 'pickup') {
          prepaymentInfo.style.display = 'block';
          const deliveryPrice = delivery_method === 'courier' ? 10 : 15;
          document.getElementById('prepaymentAmount').textContent = deliveryPrice + ' Br';
      } else {
          prepaymentInfo.style.display = 'none';
      }
  }
  // ✅ Добавьте эту функцию:
function resetCardData() {
    savedCardData = null;
    cardDataConfirmed = false;
    
    // Очищаем поля в модалке
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardCVV = document.getElementById('cardCVV');
    const cardHolder = document.getElementById('cardHolder');
    
    if (cardNumber) cardNumber.value = '';
    if (cardExpiry) cardExpiry.value = '';
    if (cardCVV) cardCVV.value = '';
    if (cardHolder) cardHolder.value = '';
}

  // ✅ ЗАМЕНИТЕ существующую функцию updateTotal (она внутри DOMContentLoaded)
// на эту:
function updateTotal() {
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const subtotalText = subtotalEl ? subtotalEl.textContent : '0 Br';
    const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, '')) || 0;
    
    const selected = document.querySelector('input[name="delivery"]:checked');
    let deliveryPrice = 0;
    if (selected) {
        if (selected.value === 'courier') deliveryPrice = 10;
        if (selected.value === 'post') deliveryPrice = 15;
    }
    
    const totalEl = document.getElementById('checkoutTotal');
    const deliveryEl = document.getElementById('checkoutDelivery');
    const prepaymentAmount = document.getElementById('prepaymentAmount');
    
    if (deliveryEl) {
        deliveryEl.textContent = deliveryPrice === 0 ? 'Бесплатно' : deliveryPrice + ' Br';
    }
    if (totalEl) {
        totalEl.textContent = (subtotal + deliveryPrice) + ' Br';
    }
    if (prepaymentAmount) {
        prepaymentAmount.textContent = deliveryPrice + ' Br';
    }
}

  if (localStorage.getItem('isLoggedIn') === 'true') {
    loadProfileData();
  }

  updateTotal();
updatePrepaymentInfo();
});

async function loadProfileData() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            
            const el = (id) => document.getElementById(id);
            if (el('checkoutName') && user.name) el('checkoutName').value = user.name;
            if (el('checkoutSurname') && user.last_name) el('checkoutSurname').value = user.last_name;
            if (el('checkoutPhone') && user.phone) el('checkoutPhone').value = user.phone;
            if (el('checkoutEmail')) el('checkoutEmail').value = user.email || '';
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

// ========================
// ПОДТВЕРЖДЕНИЕ ЗАКАЗА
// ========================
async function placeOrder() {
    const btn = document.getElementById('confirmOrderBtn');
    if (!btn) return;

    const paymentEl = document.querySelector('input[name="payment"]:checked');
    const payment_method = paymentEl ? paymentEl.value : 'card';
    const deliveryEl = document.querySelector('input[name="delivery"]:checked');
    const delivery_method = deliveryEl ? deliveryEl.value : 'pickup';

    const needsCardPayment = (payment_method === 'card') || 
                             (payment_method === 'cash' && delivery_method !== 'pickup');
                         
    if (needsCardPayment && !cardDataConfirmed) {
        alert('Сначала введите данные карты. Нажмите "Изменить способ оплаты".');
        return;
    }
    
    if (payment_method === 'cash' && delivery_method !== 'pickup') {
        const deliveryPrice = delivery_method === 'courier' ? 10 : 15;
        if (!confirm(`При оплате наличными требуется предоплата доставки ${deliveryPrice} Br. Продолжить?`)) {
            return;
        }
    }
    
    btn.disabled = true;
    btn.textContent = 'Оформление...';
    
    try {
        const name = document.getElementById('checkoutName').value.trim();
        const surname = document.getElementById('checkoutSurname').value.trim();
        const phone = document.getElementById('checkoutPhone').value.trim();
        const email = document.getElementById('checkoutEmail').value.trim();
        const comment = document.querySelector('#cardComment textarea')?.value || '';
        
        // ✅ ТОЛЬКО ОДНО объявление delivery_address
        let delivery_address = '';
        let postal_index = null;

        if (delivery_method === 'courier') {
    const city = document.getElementById('courierCity')?.value.trim() || '';
    const street = document.getElementById('courierStreet')?.value.trim() || '';
    const house = document.getElementById('courierHouse')?.value.trim() || '';
    const apartment = document.getElementById('courierApartment')?.value.trim() || '';
    delivery_address = [city, street, house, apartment].filter(Boolean).join(', ');
    
} else if (delivery_method === 'post') {
    const city = document.getElementById('postCity')?.value.trim() || '';
    const street = document.getElementById('postStreet')?.value.trim() || '';
    const house = document.getElementById('postHouse')?.value.trim() || '';
    const apartment = document.getElementById('postApartment')?.value.trim() || '';
    postal_index = document.getElementById('postalIndex')?.value.trim() || '';
    delivery_address = [city, street, house, apartment].filter(Boolean).join(', ');
}
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('cartSessionId');
        
        if (!token && !sessionId) {
            alert('Необходимо авторизоваться');
            btn.disabled = false;
            btn.textContent = 'Подтвердить заказ';
            return;
        }
        
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const body = {
            name, surname, phone, email,
            delivery_method, delivery_address,
            postal_index,
            payment_method, comment
        };
        
        if (!token && sessionId) {
            body.sessionId = sessionId;
        }
                // Если это повтор заказа — добавляем товары в корзину
        if (window._repeatOrderItems && window._repeatOrderItems.length > 0) {
            for (const item of window._repeatOrderItems) {
                const cartBody = { 
                    productId: item.productId, 
                    quantity: item.quantity,
                    sessionId: sessionId
                };
                
                const cartHeaders = { 'Content-Type': 'application/json' };
                if (token) cartHeaders['Authorization'] = `Bearer ${token}`;
                
                await fetch('/api/cart', {
                    method: 'POST',
                    headers: cartHeaders,
                    body: JSON.stringify(cartBody)
                });
            }
            // Очищаем
            sessionStorage.removeItem('repeatOrderItems');
            window._repeatOrderItems = null;
        }
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.removeItem('cartSessionId');
            localStorage.setItem('lastOrderNumber', data.order.orderNumber);
            localStorage.setItem('orderPlaced', 'true');
            window.location.href = 'glavnaya.html';
        } else {
            alert(data.error || 'Ошибка при создании заказа');
            btn.disabled = false;
            btn.textContent = 'Подтвердить заказ';
        }
        
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        alert('Ошибка соединения с сервером');
        btn.disabled = false;
        btn.textContent = 'Подтвердить заказ';
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
        });
    });
}

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
const modalTabs = document.querySelectorAll('.modal-tab');
const modalForms = document.querySelectorAll('.modal-form');

restoreSession();
loadAvatarFromServer();

function restoreSession() {
    const token = localStorage.getItem('token');
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

if (isLoggedIn && accountIcon) {
  const iconImg = accountIcon.querySelector('img');
  const savedAvatar = localStorage.getItem('userAvatar');
  iconImg.src = savedAvatar || 'pictures/cat.png';
  if (iconImg) {
    iconImg.style.width = '35px';
    iconImg.style.height = '35px';
    iconImg.style.borderRadius = '50%';
    iconImg.style.objectFit = 'cover';
  }
}

if (accountIcon) {
  accountIcon.addEventListener('click', function(e) {
    e.preventDefault();
    if (isLoggedIn) {
      window.location.href = 'account.html';
    } else {
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }
  });
}

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
            updateHeaderAvatar();
            
            if (modal) {
                modal.classList.remove('open');
                document.body.style.overflow = '';
            }
            
            loadProfileData();
            loadCheckoutCart();
            
        } else {
            loginAttempts++;
            alert(data.error || 'Ошибка входа');
            if (loginAttempts >= 3) showForgotBtn(this, email);
        }
    } catch (error) {
        console.error('Ошибка:', error);
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
            updateHeaderAvatar();
            
            if (modal) {
                modal.classList.remove('open');
                document.body.style.overflow = '';
            }
            
            loadCheckoutCart();
            
        } else {
            alert(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка:', error);
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
// МОДАЛКА ОПЛАТЫ КАРТОЙ
// ========================

let savedCardData = null;
let cardDataConfirmed = false; // флаг, что карта введена

function showCardPayment(amount) {
    document.getElementById('cardPaymentAmount').textContent = amount.toFixed(2);
    
    // Если есть сохранённые данные — заполняем (кроме CVV)
    if (savedCardData) {
        document.getElementById('cardNumber').value = savedCardData.number || '';
        document.getElementById('cardExpiry').value = savedCardData.expiry || '';
        document.getElementById('cardCVV').value = '';
        document.getElementById('cardHolder').value = savedCardData.holder || '';
    }
    
    document.getElementById('cardPaymentModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCardPayment() {
    document.getElementById('cardPaymentModal').style.display = 'none';
    document.body.style.overflow = '';
}

function saveCardData() {
    const number = document.getElementById('cardNumber').value.trim();
    const expiry = document.getElementById('cardExpiry').value.trim();
    const cvv = document.getElementById('cardCVV').value.trim();
    const holder = document.getElementById('cardHolder').value.trim();
    
    // Базовая проверка
    if (!number || number.replace(/\s/g, '').length < 13) {
        alert('Введите корректный номер карты');
        return;
    }
    if (!expiry || !expiry.includes('/')) {
        alert('Введите срок действия (ММ/ГГ)');
        return;
    }
    if (!cvv || cvv.length < 3) {
        alert('Введите CVV-код (3 цифры)');
        return;
    }
    
    // Сохраняем данные (демо)
    savedCardData = { number, expiry, holder };
    cardDataConfirmed = true;
    
    closeCardPayment();
    alert('✅ Данные карты сохранены. Оплата произойдёт при подтверждении заказа.');
}

// Закрытие по клику на оверлей
const cardPaymentModal = document.getElementById('cardPaymentModal');
if (cardPaymentModal) {
    cardPaymentModal.addEventListener('click', function(e) {
        if (e.target === this) closeCardPayment();
    });
}

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