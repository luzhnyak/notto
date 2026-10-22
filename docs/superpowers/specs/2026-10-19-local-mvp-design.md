# Notto: локальний MVP

Вихідне ТЗ: наданий користувачем «Вставлений текст.txt». Мета — незалежний український записник і щоденник Android/iOS, local-first, без сервера. Користувач доручив самостійно приймати рішення та одразу реалізувати перший етап.

## Аналіз Home Cellar (main, 369a9da)

Перевірено реальні app layouts, package.json, Product, init.ts, SQLiteStorageLocationRepository, LocationService, useAppStore, GoogleDriveService, SyncService, LocationService tests, ItemCard.
Expo 54 / RN 0.81.5 / React 19.1 / Router 6 / SQLite 16 / Zustand 5 / RHF 7. Зберігаємо поділ entities → repositories → services → UI, ін'єкцію залежностей, Router Tabs/Stack та SafeArea.
Покращення: усі репозиторії мають доменні інтерфейси, сервіси не імпортують SQLite; версійні транзакційні міграції замість ad-hoc ALTER; асинхронний доступ до БД; готовність БД блокує UI; Zustand зберігає лише налаштування/фільтри. Не переносимо any, предметну область запасів, конфігурацію OAuth або секрети.
DriveService у референсі читає відкритий файл БД, SyncService автоматично замінює локальні дані новішими віддаленими. Для Notto ці підходи неприйнятні: резервні копії — окремий наступний етап із консистентним snapshot та вкладеннями, без автоматичного злиття.

## Обраний підхід

Прямий expo-sqlite без ORM: невелика схема та контроль SQL/міграцій. Альтернатива Drizzle додає build/config без потрібного виграшу. SQLite є джерелом істини, доменні сутності — TypeScript interfaces. Одна композиція сервісів через React Context.

## Межі поточної реалізації

Нотатки CRUD, закріплення, вибране, архів/кошик/відновлення; типи та транзакційне перенесення; емоції; нормалізовані теги; комбіновані фільтри; FTS5 з LIKE fallback; місячний календар, хронологічна стрічка; український UI, світла/темна тема, захист редактора. Дата події — YYYY-MM-DD без UTC-конвертації; timestamps UTC. Власний колір нотатки відсутній.
Вкладення (схема готується), Drive Backup та експорт розвиваються після стабільного локального MVP. Не показуємо фіктивних кнопок підключення/синхронізації.

## Потік та помилки

Root відкриває notto.db → foreign_keys/WAL → міграції user_version → seed → сервіси → навігація. Створення/редагування нотатки разом із тегами — одна exclusive transaction. Видалення типу переносить усі записи (включно з архівом/кошиком) в одній transaction. Помилки доступні користувачеві, є повторення завантаження. Немає SQL у UI.

## Структура

app/ — маршрути; components/common, notes, forms, calendar — UI; src/domain/entities та repositories — контракти; src/infrastructure/database та repositories — SQLite; src/services — правила; src/store — UI-стан; src/hooks — завантаження; src/theme — кольори; src/utils — дати/нормалізація; tests/ — перевірки.

## Перевірка

Jest для правил та інтеграційні SQL-тести на справжньому SQLite через Node 24. tsc, expo-doctor, Metro export Android. Запуск Android вимагає емулятора/пристрою; збірка bundle його не замінює.

## Розширення реалізації після локального ядра

Додано етапи 5–6 з наданого ТЗ: AttachmentRepository/Service, керовані native файли, фотографії/документи/HTTP(S); ExportService для TXT/MD/JSON/PDF; BackupService із ZIP/маніфестом SHA-256, 200 МБ загальний ліміт, 50 МБ на вкладення. Snapshot використовує SQLite online backup. Restore перевіряє пакет, SQLite integrity/FK/schema, готує generation folder, потім атомарно замінює SQLite разом із generation pointer; старі покоління видаляються після commit та під час boot. Drive використовує native Google Sign-In і appDataFolder; потрібні власні OAuth клієнти й native build. Автоматичне копіювання та злиття виключено. Нотатка спочатку зберігається, потім на її екрані додаються вкладення, що запобігає сиротам від скасованого create.

## Результати code review

Expo exclusive transaction створює нове з’єднання й не успадковує PRAGMA foreign_keys. Використовуємо власний database port: окреме native connection, foreign_keys ON, перевірка FK, BEGIN IMMEDIATE, COMMIT/ROLLBACK, close. Додано регресійний тест на початково вимкнених FK. Редактор не перемонтовується під час background revision refresh, щоб створення тегу не губило введений текст.
