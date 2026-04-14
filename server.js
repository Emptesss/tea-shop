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

// ========================
// API — СТРАНЫ
// ========================

// Получить все страны
app.get('/api/countries', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, name_ru, code, flag_emoji, is_top_producer 
             FROM countries 
             WHERE is_active = true 
             ORDER BY display_order`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения стран:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// API — ПРОФИЛИ ВКУСА
// ========================

// Получить все профили вкуса
app.get('/api/taste-profiles', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, name_ru, slug, emoji, description 
             FROM taste_profiles 
             WHERE is_active = true 
             ORDER BY display_order`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения профилей вкуса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// API — ТОВАРЫ
// ========================

// Получить все товары с фильтрацией и пагинацией
app.get('/api/products', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            country,
            minPrice,
            maxPrice,
            inStock,
            tastes,
            harvestYear,
            sort = 'popular',
            search
        } = req.query;

        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                p.id, p.name, p.slug, p.sku, p.description_short,
                p.price, p.old_price, p.stock_quantity, p.is_in_stock,
                p.weight_grams, p.packaging_type, p.harvest_year,
                p.fermentation_level, p.caffeine_level,
                p.main_image_url, p.is_new, p.is_bestseller, p.is_on_sale,
                p.sales_count, p.rating_average, p.rating_count,
                c.name_ru as category_name, c.slug as category_slug,
                co.name_ru as country_name, co.code as country_code, co.flag_emoji
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN countries co ON p.country_id = co.id
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

        // Фильтр по стране
        if (country) {
            query += ` AND co.code = $${paramIndex}`;
            queryParams.push(country);
            paramIndex++;
        }

        // Фильтр по цене
        if (minPrice) {
            query += ` AND p.price >= $${paramIndex}`;
            queryParams.push(minPrice);
            paramIndex++;
        }
        if (maxPrice) {
            query += ` AND p.price <= $${paramIndex}`;
            queryParams.push(maxPrice);
            paramIndex++;
        }

        // Фильтр по наличию
        if (inStock === 'true') {
            query += ` AND p.is_in_stock = true`;
        }

        // Фильтр по году сбора
        if (harvestYear) {
            query += ` AND p.harvest_year = $${paramIndex}`;
            queryParams.push(harvestYear);
            paramIndex++;
        }

        // Поиск по названию и описанию
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.description_short ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Фильтр по вкусам
        if (tastes) {
            const tasteIds = tastes.split(',').map(Number);
            query += ` AND p.id IN (
                SELECT product_id FROM product_taste_profiles 
                WHERE taste_profile_id = ANY($${paramIndex}::int[])
            )`;
            queryParams.push(tasteIds);
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
            case 'bestseller':
                query += ` ORDER BY p.sales_count DESC`;
                break;
            case 'rating':
                query += ` ORDER BY p.rating_average DESC`;
                break;
            default:
                query += ` ORDER BY p.sales_count DESC, p.created_at DESC`;
        }

        // Пагинация
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const result = await pool.query(query, queryParams);

        // Получить общее количество товаров для пагинации
        let countQuery = `
            SELECT COUNT(DISTINCT p.id) 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN countries co ON p.country_id = co.id
            WHERE p.is_active = true
        `;
        const countParams = [];
        let countParamIndex = 1;

        if (category) {
            countQuery += ` AND c.slug = $${countParamIndex}`;
            countParams.push(category);
            countParamIndex++;
        }
        if (country) {
            countQuery += ` AND co.code = $${countParamIndex}`;
            countParams.push(country);
            countParamIndex++;
        }
        if (minPrice) {
            countQuery += ` AND p.price >= $${countParamIndex}`;
            countParams.push(minPrice);
            countParamIndex++;
        }
        if (maxPrice) {
            countQuery += ` AND p.price <= $${countParamIndex}`;
            countParams.push(maxPrice);
            countParamIndex++;
        }
        if (inStock === 'true') {
            countQuery += ` AND p.is_in_stock = true`;
        }
        if (search) {
            countQuery += ` AND (p.name ILIKE $${countParamIndex} OR p.description_short ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / limit);

        // Получить вкусы для каждого товара
        for (const product of result.rows) {
            const tastesResult = await pool.query(
                `SELECT tp.id, tp.name_ru, tp.emoji, ptp.intensity 
                 FROM product_taste_profiles ptp
                 JOIN taste_profiles tp ON ptp.taste_profile_id = tp.id
                 WHERE ptp.product_id = $1
                 ORDER BY ptp.intensity DESC`,
                [product.id]
            );
            product.tastes = tastesResult.rows;
        }

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
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить товар по slug
app.get('/api/products/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const result = await pool.query(
            `SELECT 
                p.*,
                c.name_ru as category_name, c.slug as category_slug,
                co.name_ru as country_name, co.code as country_code, co.flag_emoji
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN countries co ON p.country_id = co.id
             WHERE p.slug = $1 AND p.is_active = true`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const product = result.rows[0];

        // Обновить счётчик просмотров
        await pool.query(
            'UPDATE products SET views_count = views_count + 1 WHERE id = $1',
            [product.id]
        );

        // Получить вкусы товара
        const tastesResult = await pool.query(
            `SELECT tp.id, tp.name_ru, tp.emoji, tp.slug, ptp.intensity 
             FROM product_taste_profiles ptp
             JOIN taste_profiles tp ON ptp.taste_profile_id = tp.id
             WHERE ptp.product_id = $1
             ORDER BY ptp.intensity DESC`,
            [product.id]
        );
        product.tastes = tastesResult.rows;

        // Получить отзывы о товаре
        const reviewsResult = await pool.query(
            `SELECT r.id, r.rating, r.title, r.content, r.pros, r.cons,
                    r.author_name, r.created_at, r.is_verified_purchase,
                    r.helpful_count, r.admin_reply, r.admin_reply_at
             FROM reviews r
             WHERE r.product_id = $1 AND r.is_approved = true
             ORDER BY r.created_at DESC
             LIMIT 10`,
            [product.id]
        );
        product.reviews = reviewsResult.rows;

        // Получить похожие товары
        const similarResult = await pool.query(
            `SELECT p.id, p.name, p.slug, p.price, p.main_image_url, p.rating_average
             FROM products p
             WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true
             ORDER BY p.sales_count DESC
             LIMIT 4`,
            [product.category_id, product.id]
        );
        product.similar_products = similarResult.rows;

        res.json(product);

    } catch (error) {
        console.error('Ошибка получения товара:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить хиты продаж (для главной страницы)
app.get('/api/products/bestsellers', async (req, res) => {
    try {
        const limit = req.query.limit || 3;
        const result = await pool.query(
            `SELECT p.id, p.name, p.slug, p.description_short,
                    p.price, p.main_image_url, p.sales_count, p.rating_average,
                    c.name_ru as category_name, co.flag_emoji
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN countries co ON p.country_id = co.id
             WHERE p.is_active = true AND p.is_bestseller = true
             ORDER BY p.sales_count DESC
             LIMIT $1`,
            [limit]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения хитов продаж:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// API — ПОДПИСКА НА РАССЫЛКУ
// ========================

// Подписка на новости
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        // Проверка формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Некорректный формат email' });
        }

        // Проверка на существование
        const existing = await pool.query(
            'SELECT id FROM newsletter_subscribers WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(200).json({ 
                message: 'Вы уже подписаны на рассылку',
                alreadySubscribed: true 
            });
        }

        // Генерация токена подтверждения
        const confirmationToken = jwt.sign(
            { email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Добавление подписчика
        await pool.query(
            `INSERT INTO newsletter_subscribers (email, source, confirmation_token, confirmation_sent_at)
             VALUES ($1, $2, $3, NOW())`,
            [email, 'footer', confirmationToken]
        );
// Формируем ссылку подтверждения
        const confirmationLink = `http://localhost:3000/api/subscribe/confirm/$%7BconfirmationToken%7D`;

        // Отправляем письмо (не ждём ответа, чтобы не задерживать ответ пользователю)
        sendSubscriptionEmail(email, confirmationLink).catch(err => 
            console.error('Не удалось отправить письмо:', err.message)
        );
        res.status(201).json({ 
            message: 'Спасибо за подписку! Проверьте почту для подтверждения',
            success: true 
        });

    } catch (error) {
        console.error('Ошибка подписки:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Подтверждение подписки
app.get('/api/subscribe/confirm/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const { email } = decoded;

        const result = await pool.query(
            `UPDATE newsletter_subscribers 
             SET is_confirmed = true, confirmed_at = NOW(), confirmation_token = NULL
             WHERE email = $1 AND is_confirmed = false
             RETURNING id`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Недействительный токен или email уже подтверждён' });
        }

        res.redirect('/?subscription=confirmed');

    } catch (error) {
        console.error('Ошибка подтверждения подписки:', error);
        res.status(400).json({ error: 'Недействительный или истёкший токен' });
    }
});

// ========================
// API — КОРЗИНА
// ========================

// Получить корзину
app.get('/api/cart', async (req, res) => {
    try {
        const { sessionId } = req.query;
        const userId = req.user?.id;

        let query = `
            SELECT ci.id, ci.quantity, ci.created_at,
                   p.id as product_id, p.name, p.slug, p.price, 
                   p.main_image_url, p.stock_quantity, p.is_in_stock
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE p.is_active = true
        `;
        const params = [];

        if (userId) {
            query += ` AND ci.user_id = $1`;
            params.push(userId);
        } else if (sessionId) {
            query += ` AND ci.session_id = $1`;
            params.push(sessionId);
        } else {
            return res.json({ items: [], total: 0 });
        }

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
        const userId = req.user?.id;

        if (!productId) {
            return res.status(400).json({ error: 'ID товара обязателен' });
        }

        // Проверка наличия товара
        const productResult = await pool.query(
            'SELECT id, stock_quantity, is_in_stock FROM products WHERE id = $1 AND is_active = true',
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const product = productResult.rows[0];

        if (!product.is_in_stock) {
            return res.status(400).json({ error: 'Товар отсутствует на складе' });
        }

        if (quantity > product.stock_quantity) {
            return res.status(400).json({ 
                error: `Доступно только ${product.stock_quantity} шт.` 
            });
        }

        // Проверка существования товара в корзине
        let checkQuery;
        let checkParams;

        if (userId) {
            checkQuery = 'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2';
            checkParams = [userId, productId];
        } else if (sessionId) {
            checkQuery = 'SELECT id, quantity FROM cart_items WHERE session_id = $1 AND product_id = $2';
            checkParams = [sessionId, productId];
        } else {
            return res.status(400).json({ error: 'Требуется sessionId или авторизация' });
        }

        const existingResult = await pool.query(checkQuery, checkParams);

        if (existingResult.rows.length > 0) {
            // Обновить количество
            const newQuantity = existingResult.rows[0].quantity + quantity;
            await pool.query(
                'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2',
                [newQuantity, existingResult.rows[0].id]
            );
        } else {
            // Добавить новый товар
            await pool.query(
                `INSERT INTO cart_items (user_id, session_id, product_id, quantity, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [userId, sessionId, productId, quantity]
            );
        }

        // Получить обновлённую корзину
        const cartQuery = `
            SELECT ci.id, ci.quantity,
                   p.id as product_id, p.name, p.slug, p.price, p.main_image_url
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ${userId ? 'ci.user_id = $1' : 'ci.session_id = $1'}
        `;
        const cartResult = await pool.query(cartQuery, [userId || sessionId]);

        const items = cartResult.rows;
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({ 
            message: 'Товар добавлен в корзину',
            items,
            total,
            count: items.length
        });

    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить количество товара в корзине
app.put('/api/cart/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Количество должно быть больше 0' });
        }

        // Проверка наличия товара
        const itemResult = await pool.query(
            `SELECT ci.product_id, p.stock_quantity, p.is_in_stock
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.id = $1`,
            [itemId]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Товар в корзине не найден' });
        }

        const item = itemResult.rows[0];

        if (quantity > item.stock_quantity) {
            return res.status(400).json({ 
                error: `Доступно только ${item.stock_quantity} шт.` 
            });
        }

        await pool.query(
            'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2',
            [quantity, itemId]
        );

        res.json({ message: 'Количество обновлено' });

    } catch (error) {
        console.error('Ошибка обновления корзины:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удалить товар из корзины
app.delete('/api/cart/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;

        await pool.query('DELETE FROM cart_items WHERE id = $1', [itemId]);

        res.json({ message: 'Товар удалён из корзины' });

    } catch (error) {
        console.error('Ошибка удаления из корзины:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// API — ЗАКАЗЫ
// ========================

// Создать заказ
app.post('/api/orders', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const {
            email, phone, firstName, lastName,
            shippingAddress, shippingCity, shippingPostalCode,
            shippingMethod, paymentMethod,
            promoCode, comment,
            sessionId
        } = req.body;

        const userId = req.user?.id;

        // Получить товары из корзины
        let cartQuery;
        let cartParams;

        if (userId) {
            cartQuery = `
                SELECT ci.quantity, p.id, p.name, p.sku, p.price, p.main_image_url, p.stock_quantity
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = $1 AND p.is_active = true
            `;
            cartParams = [userId];
        } else if (sessionId) {
            cartQuery = `
                SELECT ci.quantity, p.id, p.name, p.sku, p.price, p.main_image_url, p.stock_quantity
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.session_id = $1 AND p.is_active = true
            `;
            cartParams = [sessionId];
        } else {
            return res.status(400).json({ error: 'Корзина пуста' });
        }

        const cartResult = await client.query(cartQuery, cartParams);

        if (cartResult.rows.length === 0) {
            return res.status(400).json({ error: 'Корзина пуста' });
        }

        const cartItems = cartResult.rows;

        // Проверка наличия товаров
        for (const item of cartItems) {
            if (item.quantity > item.stock_quantity) {
                throw new Error(`Товар "${item.name}" доступен только в количестве ${item.stock_quantity} шт.`);
            }
        }

        // Расчёт сумм
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = shippingMethod === 'courier' ? 300 : 0;
        const totalAmount = subtotal + shippingCost;

        // Генерация номера заказа
        const orderNumber = generateOrderNumber();

        // Создание заказа
        const orderResult = await client.query(
            `INSERT INTO orders (
                order_number, user_id, status,
                customer_email, customer_phone, customer_first_name, customer_last_name,
                shipping_address, shipping_city, shipping_postal_code,
                shipping_method, shipping_cost, payment_method,
                subtotal, total_amount, promo_code, customer_comment,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
            RETURNING id`,
            [
                orderNumber, userId, 'pending',
                email, phone, firstName, lastName,
                shippingAddress, shippingCity, shippingPostalCode,
                shippingMethod, shippingCost, paymentMethod,
                subtotal, totalAmount, promoCode, comment
            ]
        );

        const orderId = orderResult.rows[0].id;

        // Добавление позиций заказа и обновление остатков
        for (const item of cartItems) {
            await client.query(
                `INSERT INTO order_items (
                    order_id, product_id, product_name, product_sku, product_image,
                    quantity, unit_price, total_price
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    orderId, item.id, item.name, item.sku, item.main_image_url,
                    item.quantity, item.price, item.price * item.quantity
                ]
            );

            // Обновление остатков и статистики продаж
            await client.query(
                `UPDATE products 
                 SET stock_quantity = stock_quantity - $1,
                     sales_count = sales_count + $1
                 WHERE id = $2`,
                [item.quantity, item.id]
            );
        }

        // Очистка корзины
        if (userId) {
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        } else if (sessionId) {
            await client.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId]);
        }

        // Обновление статистики пользователя
        if (userId) {
            await client.query(
                `UPDATE users 
                 SET orders_count = orders_count + 1,
                     total_spent = total_spent + $1
                 WHERE id = $2`,
                [totalAmount, userId]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Заказ успешно создан',
            order: {
                id: orderId,
                orderNumber,
                totalAmount,
                status: 'pending'
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка создания заказа:', error);
        res.status(500).json({ 
            error: error.message || 'Ошибка при создании заказа' 
        });
    } finally {
        client.release();
    }
});

// Получить заказы пользователя
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT o.id, o.order_number, o.status, o.total_amount,
                    o.shipping_method, o.payment_status, o.created_at,
                    COUNT(oi.id) as items_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить детали заказа
app.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const orderResult = await pool.query(
            `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        const order = orderResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT product_id, product_name, product_image,
                    quantity, unit_price, total_price
             FROM order_items
             WHERE order_id = $1`,
            [orderId]
        );

        order.items = itemsResult.rows;

        res.json(order);

    } catch (error) {
        console.error('Ошибка получения заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// API — ОТЗЫВЫ
// ========================

// Добавить отзыв
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const { productId, orderId, rating, title, content, pros, cons } = req.body;
        const userId = req.user.id;

        if (!productId || !rating || !content) {
            return res.status(400).json({ error: 'Обязательные поля: productId, rating, content' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
        }

        // Проверка, покупал ли пользователь этот товар
        const purchaseResult = await pool.query(
            `SELECT o.id 
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
             LIMIT 1`,
            [userId, productId]
        );

        const isVerifiedPurchase = purchaseResult.rows.length > 0;

        // Получить имя пользователя
        const userResult = await pool.query(
            'SELECT first_name, last_name, email FROM users WHERE id = $1',
            [userId]
        );

        const user = userResult.rows[0];
        const authorName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : 'Покупатель';

        await pool.query(
            `INSERT INTO reviews (
                product_id, user_id, order_id, author_name, author_email,
                rating, title, content, pros, cons, is_verified_purchase
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [productId, userId, orderId, authorName, user.email,
             rating, title, content, pros, cons, isVerifiedPurchase]
        );

        res.status(201).json({ message: 'Отзыв отправлен на модерацию' });

    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// API — АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
// ========================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        // Проверка формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Некорректный формат email' });
        }

        // Проверка длины пароля
        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
        }

        // Проверка существования пользователя
        const existing = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, first_name, last_name, role`,
            [email, hashedPassword, firstName || null, lastName || null, phone || null]
        );

        const user = result.rows[0];

        // Генерация JWT токена
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Регистрация успешна',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
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

        // Поиск пользователя
        const result = await pool.query(
            `SELECT id, email, password_hash, first_name, last_name, role, is_active
             FROM users
             WHERE email = $1 AND deleted_at IS NULL`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Аккаунт заблокирован' });
        }

        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Обновление последнего входа
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Генерация JWT токена
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить профиль пользователя
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, first_name, last_name, phone, 
                    shipping_address, shipping_city, shipping_postal_code,
                    is_subscribed, orders_count, total_spent, created_at
             FROM users
             WHERE id = $1`,
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

// Обновить профиль пользователя
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, phone, shippingAddress, shippingCity, shippingPostalCode } = req.body;
        const userId = req.user.id;

        await pool.query(
            `UPDATE users 
             SET first_name = COALESCE($1, first_name),
                 last_name = COALESCE($2, last_name),
                 phone = COALESCE($3, phone),
                 shipping_address = COALESCE($4, shipping_address),
                 shipping_city = COALESCE($5, shipping_city),
                 shipping_postal_code = COALESCE($6, shipping_postal_code),
                 updated_at = NOW()
             WHERE id = $7`,
            [firstName, lastName, phone, shippingAddress, shippingCity, shippingPostalCode, userId]
        );

        res.json({ message: 'Профиль обновлён' });

    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// АДМИН-ПАНЕЛЬ (защищённые маршруты)
// ========================

// Получить все заказы (админ)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, u.email as user_email
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить статус заказа (админ)
app.put('/api/admin/orders/:orderId/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус заказа' });
        }

        await pool.query(
            `UPDATE orders 
             SET status = $1, 
                 updated_at = NOW(),
                 shipped_at = CASE WHEN $1 = 'shipped' THEN NOW() ELSE shipped_at END,
                 delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END,
                 cancelled_at = CASE WHEN $1 = 'cancelled' THEN NOW() ELSE cancelled_at END
             WHERE id = $2`,
            [status, orderId]
        );

        res.json({ message: 'Статус заказа обновлён' });

    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавить товар (админ)
app.post('/api/admin/products', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const {
            name, category_id, country_id, price, old_price, stock_quantity,
            description_short, description_full, weight_grams, packaging_type,
            harvest_year, fermentation_level, caffeine_level,
            brewing_temp_min, brewing_temp_max, brewing_time_seconds,
            is_bestseller, is_new, is_on_sale,
            tastes
        } = req.body;

        // Проверка обязательных полей
        if (!name || !category_id || !price) {
            return res.status(400).json({ error: 'Название, категория и цена обязательны' });
        }

        const slug = generateSlug(name);
        const sku = `FT-${Date.now().toString().slice(-6)}`;
        const main_image_url = req.file ? `/pictures/products/${req.file.filename}` : null;

        // Создание товара
        const productResult = await client.query(
            `INSERT INTO products (
                name, slug, sku, price, old_price, stock_quantity,
                description_short, description_full, weight_grams, packaging_type,
                harvest_year, fermentation_level, caffeine_level,
                brewing_temp_min, brewing_temp_max, brewing_time_seconds,
                category_id, country_id, main_image_url,
                is_bestseller, is_new, is_on_sale
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING id`,
            [
                name, slug, sku, price, old_price || null, stock_quantity || 0,
                description_short || null, description_full || null, weight_grams || null, packaging_type || null,
                harvest_year || null, fermentation_level || null, caffeine_level || null,
                brewing_temp_min || null, brewing_temp_max || null, brewing_time_seconds || null,
                category_id, country_id || null, main_image_url,
                is_bestseller === 'true', is_new === 'true', is_on_sale === 'true'
            ]
        );

        const productId = productResult.rows[0].id;

        // Добавление вкусов
        if (tastes) {
            const tasteArray = Array.isArray(tastes) ? tastes : [tastes];
            for (const tasteId of tasteArray) {
                if (tasteId) {
                    await client.query(
                        `INSERT INTO product_taste_profiles (product_id, taste_profile_id, intensity)
                         VALUES ($1, $2, 5)`,
                        [productId, tasteId]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Товар успешно добавлен',
            product: { id: productId, name, slug, sku }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка добавления товара:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    } finally {
        client.release();
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