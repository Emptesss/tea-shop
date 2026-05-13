// ========================
// ИМПОРТЫ И НАСТРОЙКИ
// ========================
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Загрузка переменных окружения
require('dotenv').config();
// ========================
// НАСТРОЙКА ПОЧТЫ (NODEMAILER)
// ========================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'info.foresttea@gmail.com',           // ← замените на свой
        pass: 'wlsnvienguhzibta'          // ← 16-значный пароль
    }
});

// Функция отправки письма
async function sendSubscriptionEmail(to, confirmationLink) {
    const mailOptions = {
        from: '"Forest Tea" <info.foresttea@gmail.com>',
        to: to,
        subject: 'Подтверждение подписки на дрочилку Forest Tea',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2c3e50;">🌿 Спасибо за подписку!</h2>
                <p>Вы подписались на новости и акции Forest Tea.</p>
                <p>Для подтверждения подписки, пожалуйста, перейдите по ссылке:</p>
                <a href="${confirmationLink}" style="display: inline-block; background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Подтвердить подписку</a>
                <p style="margin-top: 20px; font-size: 12px; color: #7f8c8d;">Если вы не подписывались, просто проигнорируйте это письмо.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Письмо отправлено на ${to}, ID: ${info.messageId}');
        return info;
    } catch (error) {
        console.error('❌ Ошибка отправки на ${to}:', error);
        throw error;
    }
}
// Создание приложения Express
const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ POSTGRESQL
// ========================
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'tea_shop',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Проверка подключения к БД
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Ошибка подключения к базе данных:', err.stack);
    } else {
        console.log('✅ Успешное подключение к базе данных tea_shop');
        release();
    }
});

// ========================
// MIDDLEWARE
// ========================
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname,'public')));
app.use('/pictures', express.static(path.join(__dirname,'public', 'pictures')));
app.use('/css', express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'public')));

const avatarDir = path.join(__dirname, 'public', 'pictures', 'avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}
// ========================
// НАСТРОЙКА MULTER ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ
// ========================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'pictures', 'products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|svg/;
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;
        if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения (jpeg, jpg, png, webp, svg)'));
        }
    }
});
// Настройка multer для аватаров
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB для аватара
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения (jpeg, jpg, png, webp)'));
        }
    }
});

// ========================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
    }
};

// Функция для генерации slug из строки
function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// Функция для генерации номера заказа
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FT-${year}-${month}-${random}`;
}

// ========================
// МАРШРУТЫ ДЛЯ СТРАНИЦ
// ========================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'glavnaya.html'));
});

app.get('/catalog', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'catalog.html'));
});

// ========================
// API — КАТЕГОРИИ
// ========================

// Получить все категории
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, name_ru, slug, description, image_url, display_order 
             FROM categories 
             WHERE is_active = true 
             ORDER BY display_order`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения категорий:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить категорию по slug
app.get('/api/categories/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query(
            `SELECT id, name, name_ru, slug, description, image_url 
             FROM categories 
             WHERE slug = $1 AND is_active = true`,
            [slug]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения категории:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// Получить все товары с фильтрацией и пагинацией
// Получить все товары с фильтрацией и пагинацией
app.get('/api/products', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            search,
            sort = 'popular',
            inStock,
            minPrice,
            maxPrice,
            countries,
            caffeine,
            class: classFilter,
            years,
            tastes
        } = req.query;

        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                p.id, p.name, p.slug, p.short_desc,
                p.price, p.old_price, p.in_stock,
                p.country, p.caffeine, p.class, p.year,
                p.image1, p.purchase_count, p.rating,
                c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true
        `;
        
        const queryParams = [];
        let paramIndex = 1;

        // Фильтр по категории
        if (category) {
            query += ` AND c.slug = $${paramIndex}`;
            queryParams.push(category);
            paramIndex++;
        }

        // Фильтр "Только в наличии"
        if (inStock === 'true') {
            query += ` AND p.in_stock = true`;
        }

        // Фильтр по цене (мин)
        if (minPrice) {
            query += ` AND p.price >= $${paramIndex}`;
            queryParams.push(parseFloat(minPrice));
            paramIndex++;
        }

        // Фильтр по цене (макс)
        if (maxPrice) {
            query += ` AND p.price <= $${paramIndex}`;
            queryParams.push(parseFloat(maxPrice));
            paramIndex++;
        }

        // Фильтр по странам (несколько)
        if (countries) {
            const countryList = countries.split(',').map(c => c.trim());
            query += ` AND p.country IN (${countryList.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
            queryParams.push(...countryList);
            paramIndex += countryList.length;
        }

        // Фильтр по кофеину (несколько)
        if (caffeine) {
            const caffeineList = caffeine.split(',').map(c => c.trim());
            query += ` AND p.caffeine IN (${caffeineList.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
            queryParams.push(...caffeineList);
            paramIndex += caffeineList.length;
        }

        // Фильтр по классу (несколько)
        if (classFilter) {
            const classList = classFilter.split(',').map(c => c.trim());
            query += ` AND p.class IN (${classList.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
            queryParams.push(...classList);
            paramIndex += classList.length;
        }

        // Фильтр по годам (несколько)
        if (years) {
            const yearList = years.split(',').map(y => y.trim());
            const yearConditions = [];
            
            yearList.forEach(y => {
                if (y === 'older') {
                    // "Выдержанный" — всё что старше 2024
                    query += ` AND p.year < $${paramIndex}`;
                    queryParams.push(2024);
                    paramIndex++;
                } else {
                    yearConditions.push(`$${paramIndex}`);
                    queryParams.push(parseInt(y));
                    paramIndex++;
                }
            });
            
            if (yearConditions.length > 0) {
                query += ` AND p.year IN (${yearConditions.join(', ')})`;
            }
        }
                // Фильтр по вкусам (многие-ко-многим)
        if (tastes) {
            const tasteList = tastes.split(',').map(t => t.trim());
            query += ` AND p.id IN (
                SELECT pt.product_id 
                FROM product_tastes pt 
                JOIN tastes t ON pt.taste_id = t.id 
                WHERE t.slug IN (${tasteList.map((_, i) => `$${paramIndex + i}`).join(', ')})
            )`;
            queryParams.push(...tasteList);
            paramIndex += tasteList.length;
        }

        // Поиск по названию и описанию
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.short_desc ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Сортировка
        switch (sort) {
            case 'price-asc':
                query += ` ORDER BY p.price ASC`;
                break;
            case 'price-desc':
                query += ` ORDER BY p.price DESC`;
                break;
            case 'new':
                query += ` ORDER BY p.created_at DESC`;
                break;
            case 'rating':
                query += ` ORDER BY p.rating DESC`;
                break;
            case 'popular':
            default:
                query += ` ORDER BY p.purchase_count DESC`;
        }

        // Пагинация
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        console.log('SQL:', query);
        console.log('Params:', queryParams);

        const result = await pool.query(query, queryParams);

        // Получить общее количество товаров (без пагинации)
        let countQuery = `
            SELECT COUNT(p.id) 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true
        `;
        const countParams = [];
        let countParamIndex = 1;

        // Повторяем все те же фильтры для подсчёта
        if (category) {
            countQuery += ` AND c.slug = $${countParamIndex}`;
            countParams.push(category);
            countParamIndex++;
        }
        if (inStock === 'true') {
            countQuery += ` AND p.in_stock = true`;
        }
        if (minPrice) {
            countQuery += ` AND p.price >= $${countParamIndex}`;
            countParams.push(parseFloat(minPrice));
            countParamIndex++;
        }
        if (maxPrice) {
            countQuery += ` AND p.price <= $${countParamIndex}`;
            countParams.push(parseFloat(maxPrice));
            countParamIndex++;
        }
        if (countries) {
            const countryList = countries.split(',').map(c => c.trim());
            countQuery += ` AND p.country IN (${countryList.map((_, i) => `$${countParamIndex + i}`).join(', ')})`;
            countParams.push(...countryList);
            countParamIndex += countryList.length;
        }
        if (caffeine) {
            const caffeineList = caffeine.split(',').map(c => c.trim());
            countQuery += ` AND p.caffeine IN (${caffeineList.map((_, i) => `$${countParamIndex + i}`).join(', ')})`;
            countParams.push(...caffeineList);
            countParamIndex += caffeineList.length;
        }
        if (classFilter) {
            const classList = classFilter.split(',').map(c => c.trim());
            countQuery += ` AND p.class IN (${classList.map((_, i) => `$${countParamIndex + i}`).join(', ')})`;
            countParams.push(...classList);
            countParamIndex += classList.length;
        }
        if (years) {
            const yearList = years.split(',').map(y => y.trim());
            yearList.forEach(y => {
                if (y === 'older') {
                    countQuery += ` AND p.year < $${countParamIndex}`;
                    countParams.push(2024);
                    countParamIndex++;
                }
            });
            const numericYears = yearList.filter(y => y !== 'older').map(y => parseInt(y));
            if (numericYears.length > 0) {
                countQuery += ` AND p.year IN (${numericYears.map((_, i) => `$${countParamIndex + i}`).join(', ')})`;
                countParams.push(...numericYears);
                countParamIndex += numericYears.length;
            }
        }
        if (tastes) {
            const tasteList = tastes.split(',').map(t => t.trim());
            countQuery += ` AND p.id IN (
                SELECT pt.product_id 
                FROM product_tastes pt 
                JOIN tastes t ON pt.taste_id = t.id 
                WHERE t.slug IN (${tasteList.map((_, i) => `$${countParamIndex + i}`).join(', ')})
            )`;
            countParams.push(...tasteList);
            countParamIndex += tasteList.length;
        }
        if (search) {
            countQuery += ` AND (p.name ILIKE $${countParamIndex} OR p.short_desc ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            products: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Ошибка получения товаров:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});
// ========================
// API — КОРЗИНА
// ========================

// Получить корзину
app.get('/api/cart', async (req, res) => {
    try {
        const { sessionId } = req.query;
        
        // Проверяем авторизацию через заголовок
        let userId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                userId = decoded.id;
            } catch (err) {
                // токен невалидный — игнорируем
            }
        }

        let query = `
            SELECT c.id, c.quantity, c.product_id,
                   p.name, p.slug, p.price, p.short_desc,
                   p.image1 as main_image_url,
                   p.in_stock
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE p.is_active = true AND (
        `;
        const params = [];

        if (userId) {
            query += `c.user_id = $1`;
            params.push(userId);
        } else if (sessionId) {
            query += `c.session_id = $1`;
            params.push(sessionId);
        } else {
            return res.json({ items: [], total: 0 });
        }
        
        query += `)`;

        const result = await pool.query(query, params);

        const items = result.rows;
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({ items, total });

    } catch (error) {
        console.error('Ошибка получения корзины:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавить товар в корзину
app.post('/api/cart', async (req, res) => {
    try {
        const { productId, quantity = 1, sessionId } = req.body;
        
        // Проверяем авторизацию
        let userId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                userId = decoded.id;
            } catch (err) {}
        }

        if (!productId) {
            return res.status(400).json({ error: 'ID товара обязателен' });
        }

        if (!userId && !sessionId) {
            return res.status(400).json({ error: 'Требуется sessionId или авторизация' });
        }

        let checkQuery, checkParams;
        if (userId) {
            checkQuery = 'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2';
            checkParams = [userId, productId];
        } else {
            checkQuery = 'SELECT id, quantity FROM cart WHERE session_id = $1 AND product_id = $2';
            checkParams = [sessionId, productId];
        }

        const existing = await pool.query(checkQuery, checkParams);

        if (existing.rows.length > 0) {
            await pool.query(
                'UPDATE cart SET quantity = $1, updated_at = NOW() WHERE id = $2',
                [existing.rows[0].quantity + quantity, existing.rows[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO cart (user_id, session_id, product_id, quantity) VALUES ($1, $2, $3, $4)',
                [userId, sessionId, productId, quantity]
            );
        }

        res.json({ message: 'Товар добавлен в корзину', success: true });

    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить количество
app.put('/api/cart/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Количество должно быть больше 0' });
        }
        await pool.query('UPDATE cart SET quantity = $1, updated_at = NOW() WHERE id = $2', [quantity, itemId]);
        res.json({ message: 'Количество обновлено' });
    } catch (error) {
        console.error('Ошибка обновления:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удалить товар
app.delete('/api/cart/:itemId', async (req, res) => {
    try {
        await pool.query('DELETE FROM cart WHERE id = $1', [req.params.itemId]);
        res.json({ message: 'Товар удалён' });
    } catch (error) {
        console.error('Ошибка удаления:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Слияние корзин
app.post('/api/cart/merge', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user.id;
        if (!sessionId) return res.json({ message: 'Нет гостевой корзины' });

        const guestCart = await pool.query('SELECT product_id, quantity FROM cart WHERE session_id = $1', [sessionId]);
        
        for (const item of guestCart.rows) {
            const existing = await pool.query('SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2', [userId, item.product_id]);
            if (existing.rows.length > 0) {
                await pool.query('UPDATE cart SET quantity = $1 WHERE id = $2', [existing.rows[0].quantity + item.quantity, existing.rows[0].id]);
            } else {
                await pool.query('INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)', [userId, item.product_id, item.quantity]);
            }
        }

        await pool.query('DELETE FROM cart WHERE session_id = $1', [sessionId]);
        res.json({ message: 'Корзина перенесена' });
    } catch (error) {
        console.error('Ошибка слияния:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// ========================
// API — АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
// ========================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, lastName, middleName, phone, birthDate } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, last_name, middle_name, phone, birth_date, avatar)
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8)
     RETURNING id, email, name, last_name, middle_name, phone, to_char(birth_date, 'YYYY-MM-DD') as birth_date, avatar, is_admin`,
    [email, hashedPassword, name || null, lastName || null, middleName || null, phone || null, birthDate || null, 'pictures/cat.png']
);

        const user = result.rows[0];

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.is_admin ? 'admin' : 'user' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Регистрация успешна',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                lastName: user.last_name,
                middleName: user.middle_name,
                phone: user.phone,
                birthDate: user.birth_date,
                avatar: user.avatar
            },
            token
        });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

       const result = await pool.query(
    `SELECT id, email, password_hash, name, last_name, middle_name, phone, 
            to_char(birth_date, 'YYYY-MM-DD') as birth_date, 
            avatar, is_admin, is_blocked
     FROM users WHERE email = $1`,
    [email]
);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = result.rows[0];

        if (user.is_blocked) {
            return res.status(403).json({ error: 'Аккаунт заблокирован' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.is_admin ? 'admin' : 'user' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
    message: 'Вход выполнен успешно',
    user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.last_name,
        middleName: user.middle_name,
        phone: user.phone,
        birthDate: user.birth_date,
        avatar: user.avatar
    },
    token
});

    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// Получить профиль
// Получить профиль
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, name, last_name, middle_name, phone, 
                    to_char(birth_date, 'YYYY-MM-DD') as birth_date, 
                    avatar 
             FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// Обновить профиль
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { name, lastName, middleName, phone, birthDate } = req.body;
        const userId = req.user.id;

        // Валидация телефона
        if (phone && phone.trim() !== '') {
            const cleaned = phone.replace(/[\s\(\)\-]/g, '');
            const phoneRegex = /^(\+375|80)(29|33|44|25|17)\d{7}$/;
            if (!phoneRegex.test(cleaned)) {
                return res.status(400).json({ error: 'Неверный формат телефона. Используйте: +375 (29) 123-45-67' });
            }
        }

        await pool.query(
    `UPDATE users 
     SET name = COALESCE($1, name),
         last_name = COALESCE($2, last_name),
         middle_name = COALESCE($3, middle_name),
         phone = COALESCE($4, phone),
         birth_date = CASE WHEN $5::date IS NOT NULL THEN $5::date ELSE birth_date END,
         updated_at = NOW()
     WHERE id = $6`,
    [name, lastName, middleName, phone, birthDate || null, userId]
);

        res.json({ message: 'Профиль обновлён' });

    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// ========================
// API — ЗАГРУЗКА АВАТАРА
// ========================


// Загрузка аватара (файл на сервер)
// Загрузка аватара (файл на сервер)
app.post('/api/auth/avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        console.log('=== ЗАГРУЗКА АВАТАРА ===');
        console.log('Пользователь ID:', req.user.id);
        
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        // 1. Получаем старый аватар пользователя
        const oldAvatarResult = await pool.query(
            'SELECT avatar FROM users WHERE id = $1',
            [req.user.id]
        );
        
        const oldAvatar = oldAvatarResult.rows[0]?.avatar;
        console.log('Старый аватар:', oldAvatar);
        
        // 2. Сохраняем новый аватар
        const avatarUrl = '/pictures/avatars/' + req.file.filename;
        console.log('Новый аватар:', avatarUrl);
        
        await pool.query(
            'UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2',
            [avatarUrl, req.user.id]
        );
        
        // 3. Удаляем старый файл (если это не дефолтный кот)
        if (oldAvatar && 
            oldAvatar !== 'pictures/cat.png' && 
            oldAvatar.startsWith('/pictures/avatars/')) {
            
            const oldFilePath = path.join(__dirname, 'public', oldAvatar);
            console.log('Путь к старому файлу:', oldFilePath);
            
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
                console.log('✅ Старый аватар удалён:', oldFilePath);
            } else {
                console.log('⚠️ Старый файл не найден:', oldFilePath);
            }
        } else {
            console.log('ℹ️ Старый аватар не удаляем (дефолтный или отсутствует)');
        }
        
        console.log('✅ Новый аватар сохранён!');
        res.json({ avatar: avatarUrl });
        
    } catch (error) {
        console.error('❌ Ошибка загрузки аватара:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// ========================
// API — СМЕНА ПАРОЛЯ
// ========================

app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Новый пароль должен быть не менее 6 символов' });
        }

        // Получаем текущий хеш пароля
        const userResult = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Проверяем текущий пароль
        const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Неверный текущий пароль' });
        }

        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, userId]
        );

        res.json({ message: 'Пароль успешно изменён' });

    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// ========================
// ЗАПУСК СЕРВЕРА
// ========================
app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 Сервер Forest Tea запущен на порту ${PORT}`);
    console.log(`📍 Локальный адрес: http://localhost:${PORT}`);
    console.log(`📦 База данных: ${process.env.DB_NAME || 'tea_shop'}`);
    console.log('========================================');
});