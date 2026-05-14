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
        pass: 'fwcivniolbjtyhww'          // ← 16-значный пароль
    }
});

// Функция отправки письма
async function sendSubscriptionEmail(to, confirmationLink) {
    const mailOptions = {
        from: '"Forest Tea" <info.foresttea@gmail.com>',
        to: to,
        subject: 'Подписка на рассылку Forest Tea',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #1a3a2a; margin: 0;">🌿 Forest Tea</h1>
                </div>
                <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
                    <h2 style="color: #2c3e50; margin-top: 0;">Спасибо за подписку!</h2>
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Вы подписались на новости и акции Forest Tea. 
                        Мы будем присылать вам информацию о новинках, специальных предложениях и чайных советах.
                    </p>
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Для подтверждения подписки, пожалуйста, перейдите по ссылке:
                    </p>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="${confirmationLink}" 
                           style="display: inline-block; background: #27ae60; color: white; 
                                  padding: 12px 30px; text-decoration: none; border-radius: 25px;
                                  font-size: 16px; font-weight: bold;">
                            Подтвердить подписку
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 20px;">
                        Если вы не подписывались на рассылку, просто проигнорируйте это письмо.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Письмо отправлено на ' + to + ', ID: ' + info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Ошибка отправки на ' + to + ':', error);
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

// Функция для генерации уникального номера заказа
async function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `${year}${month}${day}`;
    
    try {
        // Ищем максимальный номер за сегодня
        const result = await pool.query(
            `SELECT order_number FROM orders 
             WHERE order_number LIKE $1 
             ORDER BY order_number DESC LIMIT 1`,
            [prefix + '%']
        );
        
        let nextNumber = 1;
        
        if (result.rows.length > 0) {
            // Извлекаем последний номер и увеличиваем на 1
            const lastOrderNumber = result.rows[0].order_number;
            const lastNumber = parseInt(lastOrderNumber.split('-').pop());
            nextNumber = lastNumber + 1;
        }
        
        // Добавляем случайную задержку для предотвращения коллизий
        const randomDelay = Math.floor(Math.random() * 10);
        await new Promise(resolve => setTimeout(resolve, randomDelay));
        
        const sequential = String(nextNumber).padStart(4, '0');
        return `${prefix}-${sequential}`;
        
    } catch (error) {
        console.error('Ошибка генерации номера заказа:', error);
        // Запасной вариант с timestamp и случайным числом
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${year}${month}${day}-${timestamp.toString().slice(-6)}-${random}`;
    }
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
app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// ========================
// API — КАТЕГОРИИ
// ========================

// Получить все категории
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, slug, display_order 
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
            `SELECT id, name, slug
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

// Получить товар по slug
// Получить товар по slug
app.get('/api/products/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const result = await pool.query(
            `SELECT 
                p.*,
                COALESCE(
                    (SELECT ROUND(AVG(rating)::numeric, 1) 
                     FROM reviews 
                     WHERE product_id = p.id AND is_approved = true),
                    0
                ) as rating,
                COALESCE(
                    (SELECT COUNT(*) 
                     FROM reviews 
                     WHERE product_id = p.id AND is_approved = true),
                    0
                ) as reviews_count,
                c.name as category_name, c.slug as category_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.slug = $1 AND p.is_active = true`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const product = result.rows[0];

        // Вкусы товара
        const tastesResult = await pool.query(
            `SELECT t.name, t.slug
             FROM product_tastes pt
             JOIN tastes t ON pt.taste_id = t.id
             WHERE pt.product_id = $1`,
            [product.id]
        );
        product.tastes = tastesResult.rows;

        // Похожие товары (по категории и вкусам)
        const similarResult = await pool.query(
            `SELECT p.id, p.name, p.slug, p.short_desc, p.price, p.image1, p.purchase_count,
                    COALESCE(
                        (SELECT ROUND(AVG(rating)::numeric, 1) 
                         FROM reviews 
                         WHERE product_id = p.id AND is_approved = true),
                        0
                    ) as rating,
                    (SELECT COUNT(*) FROM product_tastes pt 
                     WHERE pt.product_id = p.id 
                     AND pt.taste_id IN (SELECT taste_id FROM product_tastes WHERE product_id = $1))
                    as matching_tastes
             FROM products p
             WHERE p.id != $1 AND p.is_active = true
             ORDER BY matching_tastes DESC, RANDOM()
             LIMIT 4`,
            [product.id]
        );
        product.similar_products = similarResult.rows;

        res.json(product);

    } catch (error) {
        console.error('Ошибка получения товара:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
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
// API — ИЗБРАННОЕ
// ========================

// Получить избранное пользователя
app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.id, p.name, p.slug, p.short_desc, p.price, p.old_price,
                    p.image1, p.in_stock, p.purchase_count, p.rating,
                    c.name as category_name, c.slug as category_slug
             FROM favorites f
             JOIN products p ON f.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE f.user_id = $1 AND p.is_active = true
             ORDER BY f.created_at DESC`,
            [req.user.id]
        );
        
        res.json({ favorites: result.rows });
    } catch (error) {
        console.error('Ошибка получения избранного:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавить в избранное
app.post('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;

        if (!productId) {
            return res.status(400).json({ error: 'ID товара обязателен' });
        }

        // Проверяем, есть ли уже в избранном
        const existing = await pool.query(
            'SELECT 1 FROM favorites WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existing.rows.length > 0) {
            return res.json({ message: 'Уже в избранном', inFavorites: true });
        }

        await pool.query(
            'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)',
            [userId, productId]
        );

        res.status(201).json({ message: 'Добавлено в избранное', inFavorites: true });

    } catch (error) {
        console.error('Ошибка добавления в избранное:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удалить из избранного
app.delete('/api/favorites/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        await pool.query(
            'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        res.json({ message: 'Удалено из избранного' });

    } catch (error) {
        console.error('Ошибка удаления из избранного:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверить, в избранном ли товар
app.get('/api/favorites/check/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT 1 FROM favorites WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        res.json({ inFavorites: result.rows.length > 0 });

    } catch (error) {
        console.error('Ошибка проверки избранного:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// API — ОТЗЫВЫ
// ========================

// Получить отзывы товара
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        
        const result = await pool.query(
            `SELECT r.id, r.author_name, r.author_avatar, r.rating, r.title, r.content,
                    r.helpful_count, r.created_at, r.user_id,
                    u.name as user_name
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.product_id = $1 AND r.is_approved = true
             ORDER BY r.created_at DESC`,
            [productId]
        );
        
        res.json({ reviews: result.rows });
    } catch (error) {
        console.error('Ошибка получения отзывов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавить отзыв (только авторизованные)
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const { productId, rating, title, content } = req.body;
        const userId = req.user.id;
        
        console.log('Получен запрос на отзыв:', { productId, rating, title, content, userId });
        
        if (!productId || !rating || !content) {
            return res.status(400).json({ error: 'productId, rating и content обязательны' });
        }
        
        // Проверяем существование товара
        const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        // Получаем имя и аватар пользователя
        const userResult = await pool.query(
            'SELECT name, avatar FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const user = userResult.rows[0];
        const authorName = user.name || 'Пользователь';
        const authorAvatar = user.avatar || null;
        
        const result = await pool.query(
            `INSERT INTO reviews (product_id, user_id, author_name, author_avatar, rating, title, content)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, author_name, author_avatar, rating, title, content, created_at`,
            [productId, userId, authorName, authorAvatar, rating, title || '', content]
        );
        
        console.log('Отзыв создан:', result.rows[0]);
        
        res.status(201).json({ message: 'Отзыв успешно добавлен', review: result.rows[0] });
        
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Полезный отзыв
app.post('/api/reviews/:id/helpful', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1 RETURNING helpful_count',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Отзыв не найден' });
        }
        
        res.json({ message: 'Спасибо!', helpfulCount: result.rows[0].helpful_count });
    } catch (error) {
        console.error('Ошибка helpful_count:', error);
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
        const {
            name, surname, phone, email,
            delivery_method, delivery_address,
            payment_method, comment
        } = req.body;
        
        // Проверяем авторизацию
        let userId = null;
        let sessionId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                userId = decoded.id;
            } catch (err) {}
        }
        
        if (!userId) {
            sessionId = req.body.sessionId;
            if (!sessionId) {
                return res.status(400).json({ error: 'Требуется авторизация или sessionId' });
            }
        }
        
        // Валидация
        if (!name || !surname || !phone) {
            return res.status(400).json({ error: 'Имя, фамилия и телефон обязательны' });
        }
        if (!delivery_method) {
            return res.status(400).json({ error: 'Выберите способ доставки' });
        }
        if (!payment_method) {
            return res.status(400).json({ error: 'Выберите способ оплаты' });
        }
        
        await client.query('BEGIN');
        
        // Получаем корзину
        let cartQuery = `
            SELECT c.quantity, c.product_id, p.name, p.price, p.image1
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE p.is_active = true AND p.in_stock = true AND
        `;
        const cartParams = [];
        
        if (userId) {
            cartQuery += `c.user_id = $1`;
            cartParams.push(userId);
        } else {
            cartQuery += `c.session_id = $1`;
            cartParams.push(sessionId);
        }
        
        const cartResult = await client.query(cartQuery, cartParams);
        
        if (cartResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Корзина пуста' });
        }
        
        // Считаем сумму
        const subtotal = cartResult.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Стоимость доставки
        let deliveryPrice = 0;
        if (delivery_method === 'courier') deliveryPrice = 10;
        if (delivery_method === 'post') deliveryPrice = 5;
        
        const total = subtotal + deliveryPrice;
        
        // Генерируем номер заказа
        // Генерируем номер заказа с повторными попытками при коллизии
let orderNumber;
let retries = 3;

while (retries > 0) {
    try {
        orderNumber = await generateOrderNumber();
        
        // Проверяем, не существует ли уже такой номер
        const existingOrder = await client.query(
            'SELECT id FROM orders WHERE order_number = $1',
            [orderNumber]
        );
        
        if (existingOrder.rows.length === 0) {
            break; // Номер уникальный, выходим из цикла
        }
        
        retries--;
        console.log(`Номер ${orderNumber} уже существует, попытка ${3 - retries + 1}`);
    } catch (error) {
        console.error('Ошибка при генерации номера:', error);
        retries--;
    }
}

if (retries === 0) {
    throw new Error('Не удалось сгенерировать уникальный номер заказа');
}
        
        // Создаём заказ
        const orderResult = await client.query(
            `INSERT INTO orders (order_number, user_id, session_id, name, surname, phone, email,
             delivery_method, delivery_address, payment_method, comment,
             subtotal, delivery_price, total, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'processing')
             RETURNING id, order_number`,
            [orderNumber, userId, sessionId || null, name, surname, phone, email || null,
             delivery_method, delivery_address || null, payment_method, comment || null,
             subtotal, deliveryPrice, total]
        );
        
        const orderId = orderResult.rows[0].id;
        
        // Добавляем товары в заказ
        for (const item of cartResult.rows) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, total)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [orderId, item.product_id, item.name, item.image1, item.price, item.quantity, item.price * item.quantity]
            );
            
            // Обновляем счётчик покупок
            await client.query(
                'UPDATE products SET purchase_count = purchase_count + $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }
        
        // Очищаем корзину
        if (userId) {
            await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);
        } else {
            await client.query('DELETE FROM cart WHERE session_id = $1', [sessionId]);
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Заказ успешно создан',
            order: {
                id: orderId,
                orderNumber: orderResult.rows[0].order_number,
                total: total
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка создания заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    } finally {
        client.release();
    }
});

// Получить заказы пользователя
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const ordersResult = await pool.query(
            `SELECT id, order_number, status, total, delivery_method, payment_method, created_at
             FROM orders
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        
        // Получаем товары для каждого заказа
        const orders = [];
        for (const order of ordersResult.rows) {
            const itemsResult = await pool.query(
                `SELECT product_id, product_name, product_image, price, quantity, total
                 FROM order_items
                 WHERE order_id = $1`,
                [order.id]
            );
            order.items = itemsResult.rows;
            orders.push(order);
        }
        
        res.json({ orders });
        
    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========================
// API — УДАЛЕНИЕ АККАУНТА
// ========================
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const userId = req.user.id;
        
        await client.query('BEGIN');
        
        // Удаляем отзывы пользователя
        await client.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
        
        // Удаляем избранное
        await client.query('DELETE FROM favorites WHERE user_id = $1', [userId]);
        
        // Удаляем корзину
        await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);
        
        // Удаляем заказы и товары в заказах (каскадно)
        await client.query('DELETE FROM orders WHERE user_id = $1', [userId]);
        
        // Удаляем аватар с сервера если есть
        const avatarResult = await client.query('SELECT avatar FROM users WHERE id = $1', [userId]);
        const avatar = avatarResult.rows[0]?.avatar;
        if (avatar && avatar !== 'pictures/cat.png' && avatar.startsWith('/pictures/avatars/')) {
            const avatarPath = path.join(__dirname, 'public', avatar);
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }
        
        // Удаляем пользователя
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        
        await client.query('COMMIT');
        
        res.json({ message: 'Аккаунт успешно удалён' });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка удаления аккаунта:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    } finally {
        client.release();
    }
});

// ========================
// API — ПОДПИСКА НА РАССЫЛКУ
// ========================
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Некорректный email' });
        }
        
        // Проверяем, есть ли уже такой подписчик
        const existing = await pool.query(
            'SELECT id, is_confirmed FROM subscribers WHERE email = $1',
            [email]
        );
        
        if (existing.rows.length > 0) {
            if (existing.rows[0].is_confirmed) {
                return res.json({ message: 'Вы уже подписаны!', alreadySubscribed: true });
            }
            // Отправляем письмо повторно
            const confirmationLink = `http://localhost:3000/api/subscribe/confirm?email=${encodeURIComponent(email)}`;
            await sendSubscriptionEmail(email, confirmationLink);
            return res.json({ message: 'Письмо отправлено повторно. Проверьте почту!' });
        }
        
        // Сохраняем подписчика
        await pool.query(
            'INSERT INTO subscribers (email) VALUES ($1)',
            [email]
        );
        
        // Отправляем письмо
        const confirmationLink = `http://localhost:3000/api/subscribe/confirm?email=${encodeURIComponent(email)}`;
        await sendSubscriptionEmail(email, confirmationLink);
        
        res.status(201).json({ message: 'Спасибо за подписку! Проверьте почту для подтверждения.' });
        
    } catch (error) {
        console.error('Ошибка подписки:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Подтверждение подписки
app.get('/api/subscribe/confirm', async (req, res) => {
    try {
        const { email } = req.query;
        
        await pool.query(
            'UPDATE subscribers SET is_confirmed = true, confirmed_at = NOW() WHERE email = $1',
            [email]
        );
        
        res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Подписка подтверждена — Forest Tea</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Montserrat+Alternates:wght@400;600&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Montserrat', sans-serif;
                        background: #09150F;
                        color: #fff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    .confirm-card {
                        background: linear-gradient(160deg, rgba(31, 77, 46, 0.8) 0%, rgba(9, 21, 15, 0.9) 100%);
                        border-radius: 24px;
                        padding: 50px 40px;
                        text-align: center;
                        max-width: 500px;
                        width: 90%;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    }
                
                    h1 {
                        font-family: 'Montserrat Alternates', sans-serif;
                        font-weight: 600;
                        font-size: 28px;
                        color: #fff;
                        margin-bottom: 16px;
                    }
                    p {
                        font-size: 16px;
                        color: rgba(255, 255, 255, 0.8);
                        line-height: 1.6;
                        margin-bottom: 30px;
                    }
                    .back-btn {
                        display: inline-block;
                        padding: 14px 32px;
                        background: linear-gradient(to right, #0D2719, #337B57);
                        border-radius: 100px;
                        color: #fff;
                        text-decoration: none;
                        font-weight: 500;
                        font-size: 16px;
                        transition: opacity 0.3s;
                    }
                    .back-btn:hover {
                        opacity: 0.9;
                    }
                    .brand {
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-family: 'Montserrat Alternates', sans-serif;
                        font-weight: 600;
                        font-size: 20px;
                        color: rgba(255, 255, 255, 0.6);
                    }
                </style>
            </head>
            <body>
                <div class="brand">Forest Tea</div>
                <div class="confirm-card">
                    <div class="confirm-icon">
    <img src="/pictures/confirmed.png" alt="Подтверждено" style="width:50px;height:50px;object-fit:contain;">
</div>
                    <h1>Подписка подтверждена!</h1>
                    <p>Спасибо, что подписались на рассылку Forest Tea.<br>Теперь вы будете первыми узнавать о новинках, акциях и чайных советах.</p>
                    <a href="/" class="back-btn">Вернуться на сайт</a>
                </div>
            </body>
            </html>
        `);
        
    } catch (error) {
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Ошибка — Forest Tea</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Montserrat', sans-serif; background: #09150F; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
                    .error-card { background: rgba(139, 0, 0, 0.2); border: 1px solid rgba(255, 0, 0, 0.3); border-radius: 24px; padding: 40px; text-align: center; max-width: 400px; }
                    h1 { color: #ff6b6b; margin-bottom: 16px; }
                    a { color: #337B57; }
                </style>
            </head>
            <body>
                <div class="error-card">
                    <h1>❌ Ошибка подтверждения</h1>
                    <p>Не удалось подтвердить подписку. Попробуйте позже или свяжитесь с нами.</p>
                    <a href="/">Вернуться на сайт</a>
                </div>
            </body>
            </html>
        `);
    }
});
// ========================
// API — ОБРАТНАЯ СВЯЗЬ
// ========================
app.post('/api/feedback', async (req, res) => {
    try {
        const { name, email, phone, theme, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Имя, email и сообщение обязательны' });
        }
        
        // Маппинг темы
        const themeMap = {
            'order': 'Вопрос по заказу',
            'product': 'Консультация по товару',
            'delivery': 'Доставка и оплата',
            'other': 'Другое'
        };
        
        const themeText = themeMap[theme] || 'Не указана';
        
        // Отправляем письмо вам
        await transporter.sendMail({
            from: '"Forest Tea - Обратная связь" <info.foresttea@gmail.com>',
            to: 'info.foresttea@gmail.com',
            subject: `Новое сообщение: ${themeText} от ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
                    <h2 style="color: #1a3a2a;">🌿 Новое сообщение с сайта Forest Tea</h2>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr><td style="padding: 8px; color: #666; width: 120px;"><strong>Имя:</strong></td><td style="padding: 8px;">${name}</td></tr>
                        <tr><td style="padding: 8px; color: #666;"><strong>Email:</strong></td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
                        <tr><td style="padding: 8px; color: #666;"><strong>Телефон:</strong></td><td style="padding: 8px;">${phone || 'Не указан'}</td></tr>
                        <tr><td style="padding: 8px; color: #666;"><strong>Тема:</strong></td><td style="padding: 8px;">${themeText}</td></tr>
                    </table>
                    <div style="background: #f5f5f5; border-radius: 10px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 0; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <p style="color: #999; font-size: 12px;">Сообщение отправлено с сайта Forest Tea</p>
                </div>
            `
        });
        
        // Отправляем подтверждение пользователю
        await transporter.sendMail({
            from: '"Forest Tea" <info.foresttea@gmail.com>',
            to: email,
            subject: 'Мы получили ваше сообщение — Forest Tea',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #1a3a2a; margin: 0;">🌿 Forest Tea</h1>
                    </div>
                    <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
                        <h2 style="color: #2c3e50;">${name}, спасибо за обращение!</h2>
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Мы получили ваше сообщение и ответим в ближайшее время (обычно в течение 24 часов).
                        </p>
                        <p style="font-size: 14px; color: #666;">
                            Тема: <strong>${themeText}</strong>
                        </p>
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Если у вас появились дополнительные вопросы, просто ответьте на это письмо.
                        </p>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="font-size: 14px; color: #999;">
                                С уважением,<br>команда Forest Tea
                            </p>
                        </div>
                    </div>
                </div>
            `
        });
        
        res.json({ message: 'Сообщение отправлено!' });
        
    } catch (error) {
        console.error('Ошибка отправки обратной связи:', error);
        res.status(500).json({ error: 'Ошибка отправки. Попробуйте позже.' });
    }
});

// Тестовый маршрут для проверки отправки почты
app.get('/api/test-email', async (req, res) => {
    try {
        console.log('📧 Пробую отправить тестовое письмо...');
        
        const info = await transporter.sendMail({
            from: '"Forest Tea Test" <info.foresttea@gmail.com>',
            to: 'info.foresttea@gmail.com',
            subject: 'Тестовое письмо от Forest Tea',
            text: 'Если вы видите это письмо — nodemailer работает!'
        });
        
        console.log('✅ Тестовое письмо отправлено! ID:', info.messageId);
        res.json({ success: true, messageId: info.messageId });
        
    } catch (error) {
        console.error('❌ Ошибка отправки тестового письма:', error);
        res.status(500).json({ 
            error: error.message,
            code: error.code,
            command: error.command 
        });
    }
});

// ========================
// API — АДМИН-ПАНЕЛЬ
// ========================

// Статистика
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [products, orders, users, reviews] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM products WHERE is_active = true'),
            pool.query('SELECT COUNT(*) as count FROM orders'),
            pool.query('SELECT COUNT(*) as count FROM users'),
            pool.query('SELECT COUNT(*) as count FROM reviews WHERE is_approved = true')
        ]);
        res.json({
            products: parseInt(products.rows[0].count),
            orders: parseInt(orders.rows[0].count),
            users: parseInt(users.rows[0].count),
            reviews: parseInt(reviews.rows[0].count)
        });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Все заказы (админ)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { limit } = req.query;
        const result = await pool.query(
            `SELECT * FROM orders ORDER BY created_at DESC ${limit ? 'LIMIT $1' : ''}`,
            limit ? [limit] : []
        );
        res.json({ orders: result.rows });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Обновить статус заказа
app.put('/api/admin/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
        res.json({ message: 'Статус обновлён' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Все пользователи
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, phone, is_admin, is_blocked, created_at FROM users ORDER BY id');
        res.json({ users: result.rows });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Заблокировать/разблокировать пользователя
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { is_blocked } = req.body;
        await pool.query('UPDATE users SET is_blocked = $1 WHERE id = $2', [is_blocked, req.params.id]);
        res.json({ message: 'Пользователь обновлён' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Все отзывы
app.get('/api/admin/reviews', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, p.name as product_name FROM reviews r LEFT JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC`
        );
        res.json({ reviews: result.rows });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Обновить отзыв
app.put('/api/admin/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { is_approved } = req.body;
        await pool.query('UPDATE reviews SET is_approved = $1 WHERE id = $2', [is_approved, req.params.id]);
        res.json({ message: 'Отзыв обновлён' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Удалить отзыв
app.delete('/api/admin/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
        res.json({ message: 'Отзыв удалён' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'public', 'pictures', 'tea');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
});

const uploadProduct = multer({ storage: productStorage, limits: { fileSize: 10 * 1024 * 1024 } });
// Создать товар (админ)
app.post('/api/admin/products', authenticateToken, requireAdmin, uploadProduct.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
]), async (req, res) => {
    try {
        const data = req.body;
        let image1 = null, image2 = null;
        if (req.files && req.files['image1']) image1 = '/pictures/tea/' + req.files['image1'][0].filename;
        if (req.files && req.files['image2']) image2 = '/pictures/tea/' + req.files['image2'][0].filename;
        
        const result = await pool.query(
            `INSERT INTO products (name, slug, category_id, price, old_price, short_desc, full_desc, 
             tea_type, temperature, brewing_time, shelf_life, country, caffeine, class, year, in_stock, is_active, image1, image2)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
            [data.name, data.slug, data.category_id||null, data.price, data.old_price||null,
             data.short_desc, data.full_desc, data.tea_type, data.temperature, data.brewing_time,
             data.shelf_life, data.country, data.caffeine, data.class, data.year||null,
             data.in_stock==='true', data.is_active==='true', image1, image2]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Обновить товар (админ)
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, uploadProduct.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
]), async (req, res) => {
    try {
        const data = req.body;
        const old = await pool.query('SELECT image1, image2 FROM products WHERE id=$1', [req.params.id]);
        let image1 = old.rows[0]?.image1;
        let image2 = old.rows[0]?.image2;
        
        if (req.files && req.files['image1']) {
            if (image1) { const p = path.join(__dirname,'public',image1); if(fs.existsSync(p)) fs.unlinkSync(p); }
            image1 = '/pictures/tea/' + req.files['image1'][0].filename;
        }
        if (req.files && req.files['image2']) {
            if (image2) { const p = path.join(__dirname,'public',image2); if(fs.existsSync(p)) fs.unlinkSync(p); }
            image2 = '/pictures/tea/' + req.files['image2'][0].filename;
        }
        
        await pool.query(
            `UPDATE products SET name=$1,slug=$2,category_id=$3,price=$4,old_price=$5,short_desc=$6,full_desc=$7,
             tea_type=$8,temperature=$9,brewing_time=$10,shelf_life=$11,country=$12,caffeine=$13,class=$14,year=$15,
             in_stock=$16,is_active=$17,image1=$18,image2=$19,updated_at=NOW() WHERE id=$20`,
            [data.name,data.slug,data.category_id||null,data.price,data.old_price||null,
             data.short_desc,data.full_desc,data.tea_type,data.temperature,data.brewing_time,
             data.shelf_life,data.country,data.caffeine,data.class,data.year||null,
             data.in_stock==='true',data.is_active==='true',image1,image2,req.params.id]
        );
        res.json({ message: 'Товар обновлён' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});
// Удалить товар (админ)
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'Товар удалён' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Создать категорию (админ)
app.post('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, slug, display_order } = req.body;
        const result = await pool.query(
            'INSERT INTO categories (name, slug, display_order, is_active) VALUES ($1,$2,$3,true) RETURNING id',
            [name, slug, display_order || 0]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Обновить категорию (админ)
app.put('/api/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, slug, display_order } = req.body;
        await pool.query(
            'UPDATE categories SET name=$1, slug=$2, display_order=$3 WHERE id=$4', 
            [name, slug, display_order || 0, req.params.id]
        );
        res.json({ message: 'Категория обновлена' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Удалить категорию (админ)
app.delete('/api/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE products SET category_id = NULL WHERE category_id = $1', [req.params.id]);
        await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
        res.json({ message: 'Категория удалена' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Страница админ-панели
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

// Статические файлы админки
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

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