# TikTok Sans - Фирменные шрифты Faida Group

## Установленные шрифты

В проекте используется семейство шрифтов **TikTok Sans** согласно брендбуку Faida Group.

### Доступные начертания:

- **TikTokSans_18pt-Light.ttf** (font-weight: 300)
  - Использование: основной текст, абзацы, длинные информационные блоки

- **TikTokSans_18pt-Regular.ttf** (font-weight: 400)
  - Использование: обычный текст

- **TikTokSans_18pt-SemiBold.ttf** (font-weight: 600)
  - Использование: полужирные акценты, подзаголовки

- **TikTokSans-Bold.ttf** (font-weight: 700)
  - Использование: заголовки, акцентные надписи, ключевые визуальные элементы

- **TikTokSans_18pt-ExtraBold.ttf** (font-weight: 800)
  - Использование: особо важные заголовки и акценты

## Применение в коде

### С помощью Tailwind CSS классов:

```jsx
// Основной текст (Light)
<p className="font-light">Текст абзаца</p>

// Обычный текст (Regular) - по умолчанию
<p>Обычный текст</p>

// Полужирный (SemiBold)
<p className="font-semibold">Полужирный текст</p>

// Жирный (Bold) - для заголовков
<h1 className="font-bold">Заголовок</h1>

// Экстра жирный (ExtraBold)
<h1 className="font-extrabold">Очень важный заголовок</h1>
```

### Прямое применение через font-weight:

```css
/* Light */
font-weight: 300;

/* Regular */
font-weight: 400;

/* SemiBold */
font-weight: 600;

/* Bold */
font-weight: 700;

/* ExtraBold */
font-weight: 800;
```

## Глобальные настройки

Шрифт настроен глобально в `src/index.css`:
- Весь сайт использует `TikTok Sans` по умолчанию
- Основной текст имеет weight 300 (Light)
- Заголовки h1-h6 используют weight 700 (Bold)

## Согласно брендбуку

**Основной шрифт:** TikTok Sans 18pt (Light) — для основного текста, абзацев, описаний и длинных информационных блоков.

**Шрифт для заголовков:** TikTok Sans (Bold) — для заголовков, акцентных надписей и ключевых визуальных элементов.
