const BASE = '';  // Все запросы идут напрямую к /api/...
let token = localStorage.getItem('adminToken');

if (token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin') showAdmin();
    } catch(e) {}
}
let categories = [];
let editingProductId = null;
let editingCategoryId = null;

// ======================== АВТОРИЗАЦИЯ ========================
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            if (payload.role !== 'admin') {
                alert('Доступ запрещён! Только для администраторов.');
                return;
            }
            // ✅ Сохраняем в ОТДЕЛЬНЫЙ ключ, не затрагивая основной сайт
            localStorage.setItem('adminToken', data.token);
            token = data.token;
            showAdmin();
        } else {
            alert(data.error || 'Неверный email или пароль');
        }
    } catch (e) {
        console.error(e);
        alert('Ошибка соединения');
    }
}

function logout() {
    // Удаляем ТОЛЬКО токен админки
    localStorage.removeItem('adminToken');
    // Перенаправляем на страницу входа в админку (она же перезагрузится)
    window.location.href = '/admin';
}

function showAdmin() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminContainer').classList.remove('hidden');
    loadAll();
}

// Проверка при загрузке
if (token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin') showAdmin();
    } catch(e) {}
}

// ======================== НАВИГАЦИЯ ========================
function switchPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('panel-' + name);
    if (panel) panel.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector(`[data-panel="${name}"]`);
    if (nav) nav.classList.add('active');
    if (name === 'dashboard') loadDashboard();
}

// ======================== API-ЗАПРОСЫ ========================
async function api(url, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`; // token уже adminToken
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    const res = await fetch(url, options);
    return res.json();
}

async function loadAll() {
    loadDashboard();
    loadProducts();
    loadOrders();
    loadUsers();
    loadReviews();
    loadCategories();
}

async function loadDashboard() {
    try {
        const [stats, ordersRes] = await Promise.all([
            api('/api/admin/stats'),
            api('/api/admin/orders?limit=5')
        ]);
        
        // Основные счётчики
        document.getElementById('dashboardStats').innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.products || 0}</div>
                <div class="stat-label">Товаров</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.orders || 0}</div>
                <div class="stat-label">Заказов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.users || 0}</div>
                <div class="stat-label">Пользователей</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.reviews || 0}</div>
                <div class="stat-label">Отзывов</div>
            </div>
        `;
        
        // Статистика по статусам заказов
        const os = stats.ordersByStatus || {};
        document.getElementById('ordersStatusStats').innerHTML = `
            <div class="stat-card" style="border-left: 4px solid #f4a742;">
                <div class="stat-value" style="color: #f4a742;">${os.processing || 0}</div>
                <div class="stat-label">В обработке</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #3498db;">
                <div class="stat-value" style="color: #3498db;">${os.inTransit || 0}</div>
                <div class="stat-label">В пути</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #27ae60;">
                <div class="stat-value" style="color: #27ae60;">${os.delivered || 0}</div>
                <div class="stat-label">Доставлено</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #e74c3c;">
                <div class="stat-value" style="color: #e74c3c;">${os.cancelled || 0}</div>
                <div class="stat-label">Отменено</div>
            </div>
        `;
        
        // Топ продаваемых товаров
        const topProducts = stats.topProducts || [];
        document.getElementById('topProductsTable').innerHTML = `
            <div class="section-title" style="margin-top:24px;">Самые продаваемые товары</div>
            <table>
                <thead><tr><th>Товар</th><th>Цена</th><th>Продано</th></tr></thead>
                <tbody>
                    ${topProducts.map(p => `
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:12px;">
                                    <img src="${p.image1 ? (p.image1.startsWith('/') ? p.image1 : '/' + p.image1) : '/pictures/placeholder.jpg'}" 
                                         style="width:40px;height:40px;border-radius:8px;object-fit:cover;"
                                         onerror="this.src='/pictures/placeholder.jpg'">
                                    <span>${p.name}</span>
                                </div>
                            </td>
                            <td>${p.price} Br</td>
                            <td><span class="badge badge-success">${p.purchase_count || 0} шт.</span></td>
                        </tr>
                    `).join('')}
                    ${topProducts.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);">Нет данных</td></tr>' : ''}
                </tbody>
            </table>
        `;
        
        // Топ непродаваемых товаров
        const bottomProducts = stats.bottomProducts || [];
        document.getElementById('bottomProductsTable').innerHTML = `
            <div class="section-title" style="margin-top:24px;">Наименее продаваемые товары</div>
            <table>
                <thead><tr><th>Товар</th><th>Цена</th><th>Продано</th></tr></thead>
                <tbody>
                    ${bottomProducts.map(p => `
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:12px;">
                                    <img src="${p.image1 ? (p.image1.startsWith('/') ? p.image1 : '/' + p.image1) : '/pictures/placeholder.jpg'}" 
                                         style="width:40px;height:40px;border-radius:8px;object-fit:cover;"
                                         onerror="this.src='/pictures/placeholder.jpg'">
                                    <span>${p.name}</span>
                                </div>
                            </td>
                            <td>${p.price} Br</td>
                            <td><span class="badge badge-warning">${p.purchase_count || 0} шт.</span></td>
                        </tr>
                    `).join('')}
                    ${bottomProducts.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);">Нет данных</td></tr>' : ''}
                </tbody>
            </table>
        `;
        
        // Последние заказы
        const statusMap = { processing: 'В обработке', delivered: 'Доставлен', cancelled: 'Отменён', 'in-transit': 'В пути' };
        const orders = ordersRes.orders || [];
        document.getElementById('recentOrdersTable').innerHTML = `
            <div class="section-title" style="margin-top:24px;">Последние заказы</div>
            <table><thead><tr><th>Номер</th><th>Клиент</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>
            ${orders.map(o => `
                <tr><td>${o.order_number}</td><td>${o.name}</td><td>${o.total} Br</td>
                <td><span class="badge badge-${o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'danger' : 'warning'}">${statusMap[o.status] || o.status}</span></td></tr>
            `).join('')}
            ${orders.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">Нет заказов</td></tr>' : ''}
            </tbody></table>`;
            
    } catch(e) { console.error('Ошибка дашборда:', e); }
}

// ======================== ТОВАРЫ ========================
async function loadProducts() {
    const data = await api('/api/products?limit=100');
    const products = data.products || [];
    
    document.getElementById('productsTable').innerHTML = `
        <table><thead><tr><th>ID</th><th>Название</th><th>Категория</th><th>Цена</th><th>В наличии</th><th></th></tr></thead><tbody>
        ${products.map(p => `
            <tr>
                <td>${p.id}</td><td>${p.name}</td><td>${p.category_name || ''}</td><td>${p.price} Br</td>
                <td><span class="badge ${p.in_stock ? 'badge-success' : 'badge-danger'}">${p.in_stock ? 'Да' : 'Нет'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editProduct(${p.id})">
    <img src="/pictures/edit.png" alt="Ред." style="width:20px;height:20px;">
</button>
<button class="btn btn-sm btn-outline" onclick="deleteProduct(${p.id})">
    <img src="/pictures/delete.png" alt="Уд." style="width:20px;height:20px;">
</button>
                </td>
            </tr>
        `).join('')}
        </tbody></table>`;
}

async function openProductForm(id = null) {
    await loadCategories();
    
    const catSelect = document.getElementById('prodCategory');
    catSelect.innerHTML = '<option value="">-- Выберите категорию --</option>' + 
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    editingProductId = id;
    
    // Сбрасываем файловые инпуты
    document.getElementById('prodImage1').value = '';
    document.getElementById('prodImage2').value = '';
    
    if (id) {
        // Получаем ВСЕ товары через обычный fetch (без api())
        const allRes = await fetch('/api/products?limit=200', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const allData = await allRes.json();
        const product = (allData.products || []).find(p => p.id === id);
        
        // Получаем полные данные товара
        let detailData = null;
        if (product && product.slug) {
            try {
                const detailRes = await fetch(`/api/products/${product.slug}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                detailData = await detailRes.json();
            } catch(e) {
                console.error('Ошибка загрузки деталей:', e);
            }
        }
        
        // Заполняем поля из detailData (там есть все поля)
        const p = detailData || product || {};
        
        document.getElementById('prodName').value = p.name || '';
        document.getElementById('prodSlug').value = p.slug || '';
        document.getElementById('prodPrice').value = p.price || '';
        document.getElementById('prodOldPrice').value = p.old_price || '';
        document.getElementById('prodShortDesc').value = p.short_desc || '';
        document.getElementById('prodFullDesc').value = p.full_desc || '';
        document.getElementById('prodTeaType').value = p.tea_type || '';
        document.getElementById('prodTemp').value = p.temperature || '';
        document.getElementById('prodTime').value = p.brewing_time || '';
        document.getElementById('prodShelf').value = p.shelf_life || '';
        
        // ✅ ИСПРАВЛЕНИЕ: Явно устанавливаем значения select'ов
        document.getElementById('prodCountry').value = p.country || '';
        document.getElementById('prodCaffeine').value = p.caffeine || '';
        document.getElementById('prodClass').value = p.class || '';
        document.getElementById('prodYear').value = p.year || '';
        document.getElementById('prodInStock').value = p.in_stock ? 'true' : 'false';
        document.getElementById('prodIsActive').value = p.is_active !== false ? 'true' : 'false';
        
        // Категория
        if (p.category_id) {
            catSelect.value = p.category_id;
        }
        
        // ✅ ЗАГРУЗКА ВКУСОВ
        await loadTastesForProduct(id);
        
        // ✅ Превью изображений
        const preview1 = document.getElementById('preview1');
        const preview2 = document.getElementById('preview2');

        if (p.image1) {
            const imgPath = p.image1.startsWith('/') ? p.image1 : '/' + p.image1;
            preview1.src = imgPath;
            preview1.style.display = 'block';
        } else {
            preview1.src = '';
            preview1.style.display = 'none';
        }

        if (p.image2) {
            const imgPath = p.image2.startsWith('/') ? p.image2 : '/' + p.image2;
            preview2.src = imgPath;
            preview2.style.display = 'block';
        } else {
            preview2.src = '';
            preview2.style.display = 'none';
        }
        
        document.getElementById('modalTitle').textContent = 'Редактировать товар';
        document.getElementById('saveProductBtn').textContent = 'Обновить';
    } else {
        // Очистка для нового товара
        ['prodName','prodSlug','prodPrice','prodOldPrice','prodShortDesc','prodFullDesc',
         'prodTeaType','prodTemp','prodTime','prodShelf'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('prodCountry').value = '';
        document.getElementById('prodCaffeine').value = '';
        document.getElementById('prodClass').value = '';
        document.getElementById('prodYear').value = '';
        document.getElementById('prodInStock').value = 'true';
        document.getElementById('prodIsActive').value = 'true';
        
        // Скрываем превью
        document.getElementById('preview1').style.display = 'none';
        document.getElementById('preview2').style.display = 'none';
        
        // ✅ Загружаем вкусы для нового товара (пустые чекбоксы)
        await loadTastesForProduct(null);
        
        document.getElementById('modalTitle').textContent = 'Добавить товар';
        document.getElementById('saveProductBtn').textContent = 'Добавить';
    }
    
    document.getElementById('productModal').classList.remove('hidden');
}

function closeProductForm() {
    document.getElementById('productModal').classList.add('hidden');
}

// Генерация slug при вводе названия
document.getElementById('prodName').addEventListener('input', function() {
    if (!editingProductId) { // только для новых товаров
        const slug = this.value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
        document.getElementById('prodSlug').value = slug;
    }
});

// Превью изображений
document.getElementById('prodImage1').addEventListener('change', function() {
    const file = this.files[0];
    const preview = document.getElementById('preview1');
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    }
});

document.getElementById('prodImage2').addEventListener('change', function() {
    const file = this.files[0];
    const preview = document.getElementById('preview2');
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    }
});

// Сохранение товара с файлами
document.getElementById('saveProductBtn').addEventListener('click', async function() {
    const name = document.getElementById('prodName').value.trim();
    const slug = document.getElementById('prodSlug').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    
    if (!name || !slug || !price) { 
        alert('Название, slug и цена обязательны'); 
        return; 
    }
    
    // Создаём FormData для отправки файлов
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('category_id', parseInt(document.getElementById('prodCategory').value) || '');
    formData.append('price', price);
    formData.append('old_price', parseFloat(document.getElementById('prodOldPrice').value) || '');
    formData.append('short_desc', document.getElementById('prodShortDesc').value);
    formData.append('full_desc', document.getElementById('prodFullDesc').value);
    formData.append('tea_type', document.getElementById('prodTeaType').value);
    formData.append('temperature', document.getElementById('prodTemp').value);
    formData.append('brewing_time', document.getElementById('prodTime').value);
    formData.append('shelf_life', document.getElementById('prodShelf').value);
    formData.append('country', document.getElementById('prodCountry').value);
    formData.append('caffeine', document.getElementById('prodCaffeine').value);
    formData.append('class', document.getElementById('prodClass').value);
    formData.append('year', document.getElementById('prodYear').value);
    formData.append('in_stock', document.getElementById('prodInStock').value);
    formData.append('is_active', document.getElementById('prodIsActive').value);
    
    // Добавляем файлы
    const image1 = document.getElementById('prodImage1').files[0];
    const image2 = document.getElementById('prodImage2').files[0];
    if (image1) formData.append('image1', image1);
    if (image2) formData.append('image2', image2);
    
    const url = editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
    const method = editingProductId ? 'PUT' : 'POST';
    
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        
        if (res.ok) {
            // ✅ Сохраняем вкусы (если редактируем или создаём новый)
            const productId = editingProductId || data.id;
            if (productId) {
                const tasteIds = getSelectedTasteIds();
                await fetch(`/api/products/${productId}/tastes`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ tasteIds })
                });
            }
            
            closeProductForm();
            loadProducts();
            alert(editingProductId ? 'Товар обновлён!' : 'Товар добавлен!');
        } else {
            alert(data.error || 'Ошибка сохранения');
        }
    } catch(e) {
        console.error(e);
        alert('Ошибка соединения');
    }
});

async function editProduct(id) { openProductForm(id); }

async function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    await api(`/api/admin/products/${id}`, { method: 'DELETE' });
    loadProducts();
}


// ======================== ЗАКАЗЫ ========================
// ======================== ЗАКАЗЫ ========================
async function loadOrders() {
    const data = await api('/api/admin/orders?limit=50');
    const orders = data.orders || [];
    const statusMap = { processing: 'В обработке', delivered: 'Доставлен', cancelled: 'Отменён', 'in-transit': 'В пути' };
    const deliveryMap = { pickup: 'Самовывоз', courier: 'Курьером', post: 'Почтой' };
    const paymentMap = { card: 'Картой', cash: 'Наличными', erip: 'ЕРИП' };
    
    // Сохраняем заказы для использования в модальном окне
    window.allOrders = orders;
    
    document.getElementById('ordersTable').innerHTML = `
        <table><thead><tr>
            <th>Номер</th><th>Клиент</th><th>Телефон</th><th>Доставка</th><th>Сумма</th><th>Статус</th><th>Дата</th><th></th>
        </tr></thead><tbody>
        ${orders.map(o => `
            <tr>
                <td><strong>${o.order_number}</strong></td>
                <td>${o.name} ${o.surname}</td>
                <td>${o.phone}</td>
                <td>${deliveryMap[o.delivery_method] || o.delivery_method}</td>
                <td>${o.total} Br</td>
                <td>
                    <select onchange="updateOrderStatus(${o.id}, this.value)" class="form-select" style="width:150px;padding:8px 28px 8px 8px;">
                        ${Object.entries(statusMap).map(([k,v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                </td>
                <td>${new Date(o.created_at).toLocaleDateString('ru-RU')}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="showOrderDetail(${o.id})">
                        Подробнее
                    </button>
                </td>
            </tr>
        `).join('')}
        </tbody></table>`;
}

// Показать детали заказа
function showOrderDetail(orderId) {
    const order = (window.allOrders || []).find(o => o.id === orderId);
    if (!order) return;
    
    const statusMap = { processing: 'В обработке', delivered: 'Доставлен', cancelled: 'Отменён', 'in-transit': 'В пути' };
    const deliveryMap = { pickup: 'Самовывоз', courier: 'Курьером', post: 'Почтой' };
    const paymentMap = { card: 'Банковской картой', cash: 'Наличными', erip: 'Через ЕРИП' };
    
    document.getElementById('orderDetailContent').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
            <div>
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">Номер заказа</div>
                <div style="font-weight:600;">${order.order_number}</div>
            </div>
            <div>
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">Статус</div>
                <span class="badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}">${statusMap[order.status] || order.status}</span>
            </div>
            <div>
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">Дата</div>
                <div>${new Date(order.created_at).toLocaleString('ru-RU')}</div>
            </div>
            <div>
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">Сумма</div>
                <div style="font-weight:600;color:var(--accent);">${order.total} Br</div>
            </div>
        </div>
        
        <h3 style="font-size:16px;margin-bottom:12px;">Клиент</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;padding:16px;background:rgba(0,0,0,0.2);border-radius:12px;">
            <div><span style="color:var(--text-secondary);">Имя:</span> ${order.name} ${order.surname}</div>
            <div><span style="color:var(--text-secondary);">Телефон:</span> ${order.phone}</div>
            <div><span style="color:var(--text-secondary);">Email:</span> ${order.email || '—'}</div>
        </div>
        
        <h3 style="font-size:16px;margin-bottom:12px;">Доставка и оплата</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;padding:16px;background:rgba(0,0,0,0.2);border-radius:12px;">
            <div><span style="color:var(--text-secondary);">Способ:</span> ${deliveryMap[order.delivery_method] || order.delivery_method}</div>
            <div><span style="color:var(--text-secondary);">Оплата:</span> ${paymentMap[order.payment_method] || order.payment_method}</div>
            <div style="grid-column:1/-1;"><span style="color:var(--text-secondary);">Адрес:</span> ${order.delivery_address || '—'}</div>
        </div>
        
        ${order.comment ? `
        <h3 style="font-size:16px;margin-bottom:12px;">Комментарий</h3>
        <div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:12px;margin-bottom:20px;white-space:pre-wrap;">${order.comment}</div>
        ` : ''}
        
        <h3 style="font-size:16px;margin-bottom:12px;">Товары (${order.items ? order.items.length : 0} шт.)</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${(order.items || []).map(item => `
                <div style="display:flex;align-items:center;gap:12px;padding:8px;background:rgba(0,0,0,0.2);border-radius:8px;">
                    <img src="${item.product_image ? (item.product_image.startsWith('/') ? item.product_image : '/' + item.product_image) : '/pictures/placeholder.jpg'}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;" onerror="this.src='/pictures/placeholder.jpg'">
                    <div style="flex:1;">
                        <div>${item.product_name}</div>
                        <div style="font-size:12px;color:var(--text-secondary);">×${item.quantity} × ${item.price} Br</div>
                    </div>
                    <div style="font-weight:600;">${item.total} Br</div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('orderDetailModal').classList.remove('hidden');
}

// Закрыть детали заказа
function closeOrderDetail() {
    document.getElementById('orderDetailModal').classList.add('hidden');
}

// Закрытие по клику на оверлей
document.getElementById('orderDetailModal').addEventListener('click', function(e) {
    if (e.target === this) closeOrderDetail();
});

async function updateOrderStatus(id, status) {
    try {
        const res = await fetch(`/api/admin/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Перезагружаем список заказов для обновления сумм
            await loadOrders();
            console.log('✅ Статус заказа обновлён');
        } else {
            alert('Ошибка: ' + (data.error || 'Не удалось обновить статус'));
        }
    } catch(e) {
        console.error('Ошибка обновления статуса:', e);
    }
}

// ======================== ПОЛЬЗОВАТЕЛИ ========================
async function loadUsers() {
    const data = await api('/api/admin/users');
    const users = data.users || [];
    
    document.getElementById('usersTable').innerHTML = `
        <table><thead><tr><th>ID</th><th>Имя</th><th>Email</th><th>Телефон</th><th>Админ</th><th>Заблокирован</th><th></th></tr></thead><tbody>
        ${users.map(u => `
            <tr>
                <td>${u.id}</td><td>${u.name || ''}</td><td>${u.email}</td><td>${u.phone || ''}</td>
                <td>${u.is_admin ? 'Да' : 'Нет'}</td>
                <td>${u.is_blocked ? 'Да' : 'Нет'}</td>
                <td>
                    <button class="btn btn-sm ${u.is_blocked ? 'btn-primary' : 'btn-danger'}" onclick="toggleBlockUser(${u.id}, ${!u.is_blocked})">${u.is_blocked ? 'Разблокировать' : 'Заблокировать'}</button>
                </td>
            </tr>
        `).join('')}
        </tbody></table>`;
}

async function toggleBlockUser(id, block) {
    await api(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_blocked: block })
    });
    loadUsers();
}

// ======================== ОТЗЫВЫ ========================
async function loadReviews() {
    const data = await api('/api/admin/reviews');
    const reviews = data.reviews || [];
    
    // Сохраняем отзывы для модального окна
    window.allReviews = reviews;
    
    document.getElementById('reviewsTable').innerHTML = `
        <table><thead><tr><th>ID</th><th>Автор</th><th>Товар</th><th>Оценка</th><th>Текст</th><th>Одобрен</th><th></th></tr></thead><tbody>
        ${reviews.map(r => `
            <tr>
                <td>${r.id}</td><td>${r.author_name}</td><td>${r.product_name || ''}</td>
                <td>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(r.content || '').substring(0, 60)}...</td>
                <td><span class="badge ${r.is_approved ? 'badge-success' : 'badge-warning'}">${r.is_approved ? 'Да' : 'Нет'}</span></td>
                <td style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline" onclick="showReviewDetail(${r.id})">Подробнее</button>
                    <button class="btn btn-sm ${r.is_approved ? 'btn-outline' : 'btn-primary'}" onclick="toggleApproveReview(${r.id}, ${!r.is_approved})">${r.is_approved ? 'Скрыть' : 'Одобрить'}</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReview(${r.id})">
                        <img src="/pictures/delete.png" alt="Уд." style="width:16px;height:16px;">
                    </button>
                </td>
            </tr>
        `).join('')}
        </tbody></table>`;
}
// ======================== ДЕТАЛИ ОТЗЫВА ========================
function showReviewDetail(reviewId) {
    const review = (window.allReviews || []).find(r => r.id === reviewId);
    if (!review) return;
    
    const date = new Date(review.created_at);
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    
    document.getElementById('reviewDetailContent').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
            <div>
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">ID отзыва</div>
                <div style="font-weight:600;">#${review.id}</div>
            </div>
            <div>
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">Дата</div>
                <div>${dateStr}</div>
            </div>
            <div>
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">Статус</div>
                <span class="badge ${review.is_approved ? 'badge-success' : 'badge-warning'}">${review.is_approved ? 'Одобрен' : 'Не одобрен'}</span>
            </div>
            <div>
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">Полезно</div>
                <div>${review.helpful_count || 0}</div>
            </div>
        </div>
        
        <h3 style="font-size:16px;margin-bottom:12px;">Автор</h3>
        <div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:12px;margin-bottom:20px;">
            <div style="margin-bottom:4px;"><span style="color:var(--text-secondary);">Имя:</span> ${review.author_name || '—'}</div>
            <div><span style="color:var(--text-secondary);">Email:</span> ${review.author_email || review.email || '—'}</div>
        </div>
        
        <h3 style="font-size:16px;margin-bottom:12px;">Товар</h3>
        <div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:12px;margin-bottom:20px;">
            <div style="margin-bottom:4px;">${review.product_name || 'Товар не указан'}</div>
            <div style="color:var(--accent);font-size:18px;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
        </div>
        
        ${review.title ? `
        <h3 style="font-size:16px;margin-bottom:12px;">Заголовок</h3>
        <div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:12px;margin-bottom:20px;font-weight:500;">${review.title}</div>
        ` : ''}
        
        <h3 style="font-size:16px;margin-bottom:12px;">Текст отзыва</h3>
        <div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:12px;margin-bottom:20px;word-wrap:break-word;overflow-wrap:break-word;word-break:break-word;line-height:1.6;white-space:pre-wrap;">${review.content || '—'}</div>
    `;
    
    document.getElementById('reviewDetailModal').classList.remove('hidden');
}

function closeReviewDetail() {
    document.getElementById('reviewDetailModal').classList.add('hidden');
}

// Закрытие по клику на оверлей
document.getElementById('reviewDetailModal').addEventListener('click', function(e) {
    if (e.target === this) closeReviewDetail();
});

async function toggleApproveReview(id, approve) {
    await api(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_approved: approve })
    });
    loadReviews();
}

async function deleteReview(id) {
    if (!confirm('Удалить отзыв?')) return;
    await api(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    loadReviews();
}

// ======================== КАТЕГОРИИ ========================
async function loadCategories() {
    try {
        const res = await fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        // API возвращает массив напрямую
        categories = Array.isArray(data) ? data : [];
        
        console.log('📁 Категории загружены:', categories);
        
        // Заполняем таблицу
        const table = document.getElementById('categoriesTable');
        if (table) {
            if (categories.length === 0) {
                table.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);">Категорий пока нет. <a href="#" onclick="openCategoryForm()" style="color:var(--accent);">Добавить</a></div>';
            } else {
                table.innerHTML = `
                    <table><thead><tr><th>ID</th><th>Название</th><th>Slug</th><th>Порядок</th><th></th></tr></thead><tbody>
                    ${categories.map(c => `
                        <tr>
                            <td>${c.id}</td><td>${c.name}</td><td>${c.slug}</td><td>${c.display_order || 0}</td>
                            <td>
                                <button class="btn btn-sm btn-outline" onclick="editCategory(${c.id})">
    <img src="/pictures/edit.png" alt="Редактировать" style="width:20px;height:20px;">
</button>
<button class="btn btn-sm btn-outline" onclick="deleteCategory(${c.id})">
    <img src="/pictures/delete.png" alt="Удалить" style="width:20px;height:20px;">
</button>
                            </td>
                        </tr>
                    `).join('')}
                    </tbody></table>`;
            }
        }
        
        return categories;
    } catch(e) {
        console.error('Ошибка загрузки категорий:', e);
        return [];
    }
}

function openCategoryForm(id = null) {
    editingCategoryId = id;
    if (id) {
        const cat = categories.find(c => c.id === id);
        if (cat) {
            document.getElementById('catName').value = cat.name || '';
            document.getElementById('catSlug').value = cat.slug || '';
            document.getElementById('catOrder').value = cat.display_order || 0;
        }
        document.getElementById('categoryModalTitle').textContent = 'Редактировать категорию';
        document.getElementById('saveCategoryBtn').textContent = 'Обновить';
    } else {
        document.getElementById('catName').value = '';
        document.getElementById('catSlug').value = '';
        document.getElementById('catOrder').value = '0';
        document.getElementById('categoryModalTitle').textContent = 'Добавить категорию';
        document.getElementById('saveCategoryBtn').textContent = 'Добавить';
    }
    document.getElementById('categoryModal').classList.remove('hidden');
}

function closeCategoryForm() {
    document.getElementById('categoryModal').classList.add('hidden');
}

document.getElementById('saveCategoryBtn').addEventListener('click', async function() {
    const data = {
        name: document.getElementById('catName').value.trim(),
        slug: document.getElementById('catSlug').value.trim(),
        display_order: parseInt(document.getElementById('catOrder').value) || 0
    };
    
    if (!data.name || !data.slug) { 
        alert('Название и slug обязательны'); 
        return; 
    }
    
    const url = editingCategoryId ? `/api/admin/categories/${editingCategoryId}` : '/api/admin/categories';
    const method = editingCategoryId ? 'PUT' : 'POST';
    
    const res = await api(url, { method, body: JSON.stringify(data) });
    
    if (res.error) {
        alert(res.error);
        return;
    }
    
    closeCategoryForm();
    loadCategories();
    alert(editingCategoryId ? 'Категория обновлена!' : 'Категория добавлена!');
});

async function editCategory(id) { openCategoryForm(id); }

async function deleteCategory(id) {
    if (!confirm('Удалить категорию?')) return;
    await api(`/api/admin/categories/${id}`, { method: 'DELETE' });
    loadCategories();
}

// ======================== РАБОТА С ВКУСАМИ ========================

// Загрузка всех вкусов и отметка выбранных для товара
async function loadTastesForProduct(productId) {
    try {
        // Загружаем все вкусы
        const allTastesRes = await fetch('/api/tastes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const allTastes = await allTastesRes.json();
        
        // Загружаем вкусы товара (если редактируем)
        let productTastes = [];
        if (productId) {
            const productTastesRes = await fetch(`/api/products/${productId}/tastes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            productTastes = await productTastesRes.json();
        }
        
        const productTasteIds = productTastes.map(t => t.id);
        
        // Рендерим чекбоксы
        const container = document.getElementById('tastesCheckboxes');
        if (!container) {
            console.error('❌ Контейнер для вкусов не найден (tastesCheckboxes)');
            return;
        }
        
        container.innerHTML = allTastes.map(taste => `
            <label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;">
                <input type="checkbox" 
                       value="${taste.id}" 
                       class="taste-checkbox"
                       ${productTasteIds.includes(taste.id) ? 'checked' : ''}>
                <span>${taste.name}</span>
            </label>
        `).join('');
        
        console.log('✅ Вкусы загружены:', allTastes.length, 'шт.');
    } catch (e) {
        console.error('Ошибка загрузки вкусов:', e);
    }
}

// Получить массив выбранных ID вкусов
function getSelectedTasteIds() {
    const checkboxes = document.querySelectorAll('.taste-checkbox:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
}