# Notto

Український локальний записник і щоденник для Android та iOS. Незалежний застосунок на Expo SDK 54, React Native 0.81.5, React 19.1 та TypeScript strict. Архітектурний референс — [Home Cellar](https://github.com/luzhnyak/home-cellar), але його дані, дизайн, OAuth-ідентифікатори й секрети не переносяться.

## Реалізовано

- Нотатки: створення, перегляд, редагування, вибране, закріплення, архів, кошик, відновлення й остаточне видалення з підтвердженням.
- Обов’язковий заголовок, довільний текст, тип із власними кольором та іконкою, емоція, необов’язкова дата події, багато тегів. Захист незбережених змін редактора.
- Керування типами й емоціями, порядок сортування. Видалення типу переносить **усі** його записи до іншого типу в одній транзакції.
- Нормалізовані українські теги без дублікатів, перейменування, видалення та фільтрація.
- Комбінований пошук: заголовок/текст, тип, усі вибрані теги, емоція, дата створення/події, стан. Сортування за датою, назвою, змінами. FTS5 з екрануванням запиту; fallback LIKE з нормалізованими Unicode-полями.
- Місячний календар із кольоровими індикаторами, перегляд дня, список/хронологічна стрічка.
- Фотографії, документи, вебпосилання; додавання на екрані збереженої нотатки. Файли копіюються з picker до власного каталогу, у БД — лише відносні шляхи. Перегляд фотографій, відкриття посилань, системне меню для документів, зміна назви та видалення вкладень.
- Експорт нотатки TXT, Markdown, JSON і PDF через системне меню. PDF екранує HTML і підтримує український текст. Експорт нотатки містить описи вкладень; самі файли входять до резервного пакета.
- Ручний локальний ZIP backup/restore та Google Drive `appDataFolder`. Пакет: консистентний snapshot SQLite, вкладення, маніфест v1 із SHA-256. Перевірки формату, розмірів, шляхів, hashes, integrity/FK/schema перед заміною.
- Відновлення готує нове покоління файлів; SQLite online backup атомарно замінює БД разом із вказівником покоління. Помилка до commit не змінює активні дані. Старі покоління очищуються після успішної заміни; повторне очищення під час запуску прибирає залишки перерваних операцій.
- Світла/темна/системна тема, збереження налаштування у SQLite, Safe Area, українські повідомлення, повторення після помилок.

Без сервера, реєстрації для локальної роботи, нагадувань, геолокації, чек-листів, AI та спільного редагування.

## Запуск

Потрібен Node.js **24 LTS** (SQLite integration-тести використовують `node:sqlite`). Native-збірка — Android Studio/SDK або Xcode на macOS; також доступний EAS.

```bash
git clone https://github.com/luzhnyak/notto.git
cd notto
npm ci
cp .env.example .env
```

Задайте власні `NOTTO_ANDROID_PACKAGE` та `NOTTO_IOS_BUNDLE_ID` (наприклад, ваш reverse-DNS identifier). Google OAuth необов’язковий для локальної роботи. У проєкті немає запозичених package IDs чи EAS project ID.

```bash
npm run android
# на macOS:
npm run ios
# для вже встановленого development build:
npx expo start --dev-client
```

**Потрібен development build**: Google Sign-In містить native module, якого немає в Expo Go. Не використовуйте Expo Go як спосіб перевірки цього складу залежностей. При додаванні/зміні native plugins перебудуйте застосунок.

EAS: `npx eas-cli login`, `npx eas-cli init`, `npx eas-cli build --profile preview --platform android`. `eas.json` містить development, preview APK та production profiles. Обліковий запис, підпис, store identifiers і креденшали створює власник проєкту; вони не входять до git.

## Google Drive

1. Створіть власний Google Cloud project, увімкніть Google Drive API.
2. Налаштуйте OAuth consent screen та за потреби test users. Дозвіл — `https://www.googleapis.com/auth/drive.appdata`.
3. Створіть Web OAuth client; запишіть його ID у `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
4. Android: створіть Android OAuth client для **вашого** package і SHA-1 development/EAS/production signing certificate. SHA-1 різних збірок може відрізнятися.
5. iOS: створіть iOS OAuth client для власного bundle ID; задайте `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` і reversed client ID у `NOTTO_GOOGLE_IOS_URL_SCHEME`.
6. Перебудуйте native app. У налаштуваннях натисніть «Підключити Google» й надайте дозвіл Drive.

Кожне завантаження створює окрему копію; відновлення використовує найновішу в поточному акаунті. Старі копії автоматично не видаляються. OAuth token не записується до SQLite, файлів чи Zustand; ним керує native Google Sign-In. У разі відключення застосунок виконує sign-out. Жодного автоматичного download/перезаписування за датою немає.

Це **резервне копіювання**, а не двостороння синхронізація. Автоматичне копіювання відкладене до перевірки ручного сценарію на пристроях. Пакет не зашифрований. Обмеження: вкладення до 50 МБ, весь розпакований пакет до 200 МБ; ZIP кодується в пам’яті. Для великих сховищ потрібен streaming archive у наступній версії.

## Архітектура та дані

```text
app/                         Expo Router: Tabs, Stack, екрани
components/common/           базові UI-елементи, backup panel
components/notes/            картки, списки, вкладення
components/forms/            React Hook Form editor
components/calendar/         календар
src/domain/entities/         сутності й input/filter types
src/domain/repositories/     контракти репозиторіїв
src/infrastructure/database/ міграції, FTS, initialize gate
src/infrastructure/repositories/ SQLite реалізації
src/infrastructure/filesystem/ файли, native snapshot/restore, експорт
src/services/                правила, каталог, backup codec, Drive, composition
src/store/                   UI тема та revision сигнал
src/hooks/                   завантаження з error/retry та захистом stale response
src/theme/                   палітри
src/utils/                   календарні дати, Unicode, повідомлення
tests/                       правила, справжній SQLite, backup codec
```

SQLite — єдине джерело істини. React-компоненти не виконують SQL. `notto.db` створюється після mount; root не відкриває екрани до успішних міграцій. `foreign_keys=ON`, WAL, `user_version`, транзакційний seed один раз. Наступні зміни схеми додаються новим елементом migrations; існуючі міграції після релізу не переписувати.

`event_date` — локальна дата `YYYY-MM-DD`, без `toISOString` перетворення. Інші timestamps — UTC ISO 8601. Календар використовує дату події або локальний день створення. Закріплення не змінює порядок стрічки.

`OperationGate` серіалізує запис нотаток, файлові зміни, snapshot і restore. Native backup використовує SQLite online backup API, а не копіювання відкритого WAL-файлу. Відносні attachment paths перевіряються перед читанням і відновленням.

## Перевірки

```bash
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform android --output-dir /tmp/notto-android
npm run format:check
```

Під час реалізації фактично пройдено TypeScript, 31 Jest tests, Expo Doctor 18/18 і Android Metro/Hermes export. SQL-тести виконуються на справжньому in-memory SQLite Node, не на SQL-моках. Покривають CRUD, транзакційний rollback, FK/CHECK, перенесення типів, теги, фільтри, FTS/fallback, архів/кошик, календарні дати; окремі тести — файли, серіалізація backup, hashes/path traversal, HTML escaping.

**Не перевірено на Android/iOS пристрої:** native Google OAuth/Drive, picker/permissions, filesystem, PDF renderer, системне поширення, SQLite online restore, клавіатура й native navigation. У середовищі немає Android SDK/емулятора або Xcode й немає OAuth-креденшалів власника. Успішний JS export не є APK build або тестом на пристрої.

Перед релізом: пройти native сценарії створення/редагування/back-guard, дозволи picker, фото/документи/URL, kill/relaunch, теми, CRUD каталогів, export кожного формату, backup → зміни → restore, пошкоджений пакет, відсутній файл, відмова мережі/Google login. Для Google перевірити окремо debug та EAS signed build.

## Етапи

1. Фундамент: конфігурації, домени, навігація, палітри, аналіз референсу.
2. SQLite: міграції, seed, FK/CHECK, репозиторії, сервіси й транзакції.
3. Нотатки: CRUD, довідники, теги, емоції, архів і кошик.
4. Пошук/календар: FTS5/fallback, фільтри, стрічка, індикатори.
5. Вкладення: власне сховище, відносні шляхи, URL validation, перегляд.
6. Backup/експорт: ZIP+маніфест, staging restore, Drive й 4 формати.
7. Якість: unit/integration tests, TypeScript, Doctor, JS export, документація. Native acceptance, accessibility/device/performance profiling і автоматичний backup залишаються наступними кроками.
