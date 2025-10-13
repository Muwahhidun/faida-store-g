# Брендбук Faida Group - Руководство по фирменному стилю

Данный документ содержит всю информацию о фирменном стиле Faida Group для использования в разработке веб-проекта.

---

## 📚 Содержание

1. [Фирменные цвета](#фирменные-цвета)
2. [Фирменные шрифты](#фирменные-шрифты)
3. [Использование в коде](#использование-в-коде)
4. [Компоненты UI](#компоненты-ui)
5. [Тестирование](#тестирование)

---

## 🎨 Фирменные цвета

Фирменная палитра состоит из двух основных цветов (жёлтый и тёмно-синий), каждый из которых имеет дополнительный светлый оттенок.

### Основные цвета

#### 1. Тёмно-синий (Primary) - Основной цвет

**Основной оттенок (primary-900):**
- **Hex:** `#0E1A3A`
- **RGB:** `14, 26, 58`
- **HSB:** `224, 76%, 23%`
- **CMYK:** `100, 91, 45, 54`
- **Применение:** Основной цвет интерфейса, заголовки, фон хедера/футера, навигация

**Дополнительный оттенок (primary-800):**
- **Hex:** `#162956`
- **RGB:** `22, 41, 86`
- **HSB:** `222, 74%, 34%`
- **CMYK:** `100, 88, 38, 31`
- **Применение:** Hover эффекты, градиенты, альтернативные фоны

#### 2. Жёлтый (Secondary) - Акцентный цвет

**Основной оттенок (secondary-500):**
- **Hex:** `#F2C56D`
- **RGB:** `242, 197, 109`
- **HSB:** `40, 55%, 95%`
- **CMYK:** `5, 24, 65, 0`
- **Применение:** Акцентные элементы, кнопки CTA, выделение важной информации

**Светлый золотистый (secondary-600):**
- **Hex:** `#D8AE64`
- **RGB:** `216, 174, 100`
- **HSB:** `38, 54%, 85%`
- **CMYK:** `15, 31, 67, 4`
- **Применение:** Hover состояния жёлтых элементов, вторичные акценты

### Полная палитра Tailwind CSS

**Primary (Тёмно-синий):**
```
primary-50   #f0f2f5  // Очень светлый (фоны)
primary-100  #d9dde6
primary-200  #b3bcd2
primary-300  #8d9bbd
primary-400  #677aa9
primary-500  #415994
primary-600  #2c4570
primary-700  #1f3252
primary-800  #162956  ⭐ Дополнительный (из брендбука)
primary-900  #0E1A3A  ⭐ ОСНОВНОЙ (из брендбука)
primary-950  #080f1f
```

**Secondary (Жёлтый/Золотистый):**
```
secondary-50   #fef9ed  // Очень светлый (фоны)
secondary-100  #fdf2d4
secondary-200  #fbe5a9
secondary-300  #f9d77d
secondary-400  #f7c951
secondary-500  #F2C56D  ⭐ ОСНОВНОЙ (из брендбука)
secondary-600  #D8AE64  ⭐ Светлый золотистый (из брендбука)
secondary-700  #c29346
secondary-800  #9d7737
secondary-900  #78582a
secondary-950  #4a3619
```

### Рекомендации по использованию цветов

**✅ Рекомендуемые комбинации:**
- `primary-900` (фон) + `secondary-500` (акценты) + белый (текст)
- `secondary-500` (фон) + `primary-900` (текст)
- Белый (фон) + `primary-900` (текст) + `secondary-500` (акценты)

**❌ Избегать:**
- Близкие оттенки на одном уровне (primary-900 + primary-800)
- Слишком много акцентного цвета
- Низкий контраст текста и фона

**Контрастность (WCAG):**
- Текст на `primary-900`: белый или `secondary-500`
- Текст на `secondary-500`: `primary-900` или чёрный
- Минимальный контраст для основного текста: 4.5:1
- Минимальный контраст для крупного текста: 3:1

---

## 🔤 Фирменные шрифты

Проект использует два семейства шрифтов согласно брендбуку Faida Group:
- **TikTok Sans** - основной шрифт интерфейса
- **Tenor Sans** - шрифт логотипа и фирменных надписей

### Tenor Sans - Шрифт логотипа

**Применение:** Фирменные надписи, логотип, названия компании

- **Семейство:** Tenor Sans
- **Тип:** Google Fonts
- **Загрузка:** через Google Fonts CDN или локально
- **URL:** https://fonts.google.com/specimen/Tenor+Sans

**Где используется:**
- Надпись "Faida Group" в Header
- Логотип компании
- Фирменные заголовки на главной странице

### TikTok Sans - Основной шрифт интерфейса

| Начертание | Font-weight | Файл | Применение |
|-----------|-------------|------|------------|
| **Light** | 300 | TikTokSans_18pt-Light.ttf | Основной текст, абзацы, длинные блоки |
| **Regular** | 400 | TikTokSans_18pt-Regular.ttf | Обычный текст |
| **SemiBold** | 600 | TikTokSans_18pt-SemiBold.ttf | Полужирные акценты, подзаголовки |
| **Bold** | 700 | TikTokSans-Bold.ttf | Заголовки, акцентные надписи |
| **ExtraBold** | 800 | TikTokSans_18pt-ExtraBold.ttf | Особо важные заголовки |

### Применение по умолчанию

- **Основной текст (body):** Light (300)
- **Заголовки (h1-h6):** Bold (700)
- **Все элементы:** TikTok Sans с fallback на system-ui

### Расположение файлов

- **Шрифты:** `frontend/src/assets/fonts/`
- **CSS декларации:** `frontend/src/assets/fonts/tiktok-sans.css`
- **Импорт:** `frontend/src/index.css` (строка 1)
- **Конфигурация:** `frontend/tailwind.config.js`

### Поддержка

✅ Полная поддержка кириллицы и латиницы
✅ Цифры и специальные символы
✅ Отличная читаемость на всех размерах

---

## 💻 Использование в коде

### Цвета

```jsx
// Фон
<div className="bg-primary-900">Тёмно-синий фон</div>
<div className="bg-secondary-500">Жёлтый фон</div>

// Текст
<p className="text-primary-900">Тёмно-синий текст</p>
<p className="text-secondary-500">Жёлтый текст</p>

// Границы
<div className="border-2 border-primary-900">С обводкой</div>

// Hover эффекты
<button className="bg-secondary-500 hover:bg-secondary-600">
  Кнопка
</button>

// Градиенты
<div className="bg-gradient-to-r from-primary-900 to-primary-800">
  Синий градиент
</div>
<div className="bg-gradient-to-r from-secondary-500 to-secondary-600">
  Жёлтый градиент
</div>
```

### Шрифты

```jsx
// Основной текст (Light по умолчанию)
<p>Обычный текст</p>
<p className="font-light">Явно Light текст</p>

// Жирность
<p className="font-normal">Regular (400)</p>
<p className="font-semibold">SemiBold (600)</p>
<p className="font-bold">Bold (700)</p>
<p className="font-extrabold">ExtraBold (800)</p>

// Заголовки (Bold по умолчанию)
<h1>Заголовок H1</h1>
<h2 className="font-extrabold">Очень важный H2</h2>
```

---

## 🧩 Компоненты UI

### Кнопки

```jsx
// Основная кнопка (Primary CTA)
<button className="btn-primary">
  Основная кнопка
</button>

// Вторичная кнопка
<button className="btn-secondary">
  Вторичная кнопка
</button>

// Кнопка с обводкой
<button className="btn-outline">
  Кнопка с обводкой
</button>

// Размеры
<button className="btn-primary btn-sm">Маленькая</button>
<button className="btn-primary">Обычная</button>
<button className="btn-primary btn-lg">Большая</button>
```

Классы кнопок определены в `frontend/src/index.css`:
- `.btn-primary` - жёлтый фон (`secondary-500`) + тёмно-синий текст
- `.btn-secondary` - тёмно-синий фон (`primary-900`) + белый текст
- `.btn-outline` - обводка + hover эффект заливки

### Бейджи

```jsx
<span className="badge-primary">Бейдж</span>
<span className="badge bg-primary-900 text-white">Custom</span>
```

### Карточки

```jsx
// Простая карточка
<div className="card p-6">
  <h3 className="font-bold text-primary-900">Заголовок</h3>
  <p className="font-light">Текст карточки</p>
</div>

// Карточка с hover
<div className="card-hover p-6">
  <h3 className="font-bold text-primary-900">С hover эффектом</h3>
</div>

// Цветные карточки
<div className="bg-primary-900 text-white p-6 rounded-lg">
  Тёмная карточка
</div>

<div className="bg-secondary-500 text-primary-900 p-6 rounded-lg">
  Жёлтая карточка
</div>
```

### Инпуты

```jsx
<input type="text" className="input" placeholder="Введите текст" />
<input type="email" className="input-error" placeholder="С ошибкой" />
```

---

## 🧪 Тестирование

### Тестовые компоненты

Для визуальной проверки фирменного стиля созданы тестовые компоненты:

**Проверка шрифтов:**
```tsx
import { FontTest } from './components/FontTest';

// В App.tsx добавьте маршрут:
<Route path="/font-test" element={<FontTest />} />

// Откройте: http://localhost:5173/font-test
```

**Проверка цветов:**
```tsx
import { ColorPaletteTest } from './components/ColorPaletteTest';

// В App.tsx добавьте маршрут:
<Route path="/colors-test" element={<ColorPaletteTest />} />

// Откройте: http://localhost:5173/colors-test
```

### Проверка в DevTools

**Проверка шрифтов:**
1. Откройте DevTools (F12) → Elements
2. Выберите текстовый элемент
3. В Computed проверьте `font-family: "TikTok Sans"`
4. В Network → Font проверьте загрузку .ttf файлов

**Проверка цветов:**
1. Откройте DevTools (F12) → Elements
2. Выберите цветной элемент
3. В Computed проверьте значения цветов (должны совпадать с брендбуком)

### Перезапуск после изменений

После изменения шрифтов или цветов:
```bash
# Перезапустите frontend контейнер
docker-compose restart frontend

# Или пересоберите
docker-compose up --build frontend
```

---

## 📁 Файлы фирменного стиля

### Конфигурация

- **Tailwind CSS:** `frontend/tailwind.config.js`
  - Настройка цветов (colors.primary, colors.secondary)
  - Настройка шрифтов (fontFamily.sans, fontFamily.heading)

- **Глобальные стили:** `frontend/src/index.css`
  - Импорт шрифтов
  - Базовые стили текста и заголовков
  - Классы компонентов (.btn-*, .card, .badge, .input)

- **Шрифты CSS:** `frontend/src/assets/fonts/tiktok-sans.css`
  - @font-face декларации для всех начертаний

### Ресурсы

- **Файлы шрифтов:** `frontend/src/assets/fonts/*.ttf`
- **Исходники:** `faida_group_style/Брендбук Faida/Fonts/`
- **Тестовые компоненты:**
  - `frontend/src/components/FontTest.tsx`
  - `frontend/src/components/ColorPaletteTest.tsx`

---

## ✨ Итого

### Фирменные цвета:
- ✅ `primary-900` (#0E1A3A) - основной тёмно-синий
- ✅ `primary-800` (#162956) - дополнительный синий
- ✅ `secondary-500` (#F2C56D) - основной жёлтый
- ✅ `secondary-600` (#D8AE64) - светлый золотистый
- ✅ Полная палитра 50-950 для каждого цвета

### Фирменные шрифты:
- ✅ TikTok Sans Light (300) - основной текст
- ✅ TikTok Sans Bold (700) - заголовки
- ✅ Дополнительные начертания: Regular, SemiBold, ExtraBold
- ✅ Полная поддержка кириллицы

### Интеграция:
- ✅ Все цвета доступны через Tailwind классы
- ✅ Все шрифты загружены и настроены
- ✅ Созданы готовые компоненты UI
- ✅ Добавлены тестовые страницы
- ✅ Обновлена документация проекта (CLAUDE.md)

**Весь фирменный стиль Faida Group полностью интегрирован и готов к использованию!** 🎉
