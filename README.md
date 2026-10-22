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

Потрібен Node.js **24.x** (SQLite integration-тести використовують `node:sqlite`). Native-збірка — Android Studio/SDK або Xcode на macOS; також доступний EAS.

```bash
git clone https://github.com/luzhnyak/notto.git
cd notto
npm ci
cp .env.example .env
```

У `app.json` налаштовані Android package та iOS bundle ID `com.luzhnyak.notto`. За потреби їх можна перевизначити через `NOTTO_ANDROID_PACKAGE` та `NOTTO_IOS_BUNDLE_ID` у `.env`. Google OAuth необов’язковий для локальної роботи. EAS project ID налаштовується власником проєкту.

```bash
npm run android
# на macOS:
npm run ios
# для вже встановленого development build:
npx expo start --dev-client
```

**Потрібен development build**: Google Sign-In містить native module, якого немає в Expo Go. Не використовуйте Expo Go як спосіб перевірки цього складу залежностей. При додаванні/зміні native plugins перебудуйте застосунок.

## Збірки Android та iOS

### Підготовка

Потрібен Node.js **24.x**: `node -v` має показувати `v24...`. Попередження
`EBADENGINE` означає невідповідність версії Node вимозі `>=24 <25` у `package.json`.
Для локального Android також потрібні JDK, Android Studio та Android SDK;
для локального iOS — Mac із Xcode. Хмарну EAS-збірку можна запускати з Windows.

Приклади для Windows нижче використовують **PowerShell** і шлях `D:\Web\notto`.
Замініть шлях на свій. Перед оновленням залежностей зупиніть Metro (`Ctrl+C`)
та дочекайтеся завершення поточної native-збірки.

```powershell
cd D:\Web\notto
git pull origin feat/local-mvp
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

За замовчуванням використовується `com.luzhnyak.notto` з `app.json`. Для власного
ідентифікатора задайте `NOTTO_ANDROID_PACKAGE` / `NOTTO_IOS_BUNDLE_ID` у `.env`.
OAuth-параметри потрібні для Google Sign-In/Drive, але не для локальних нотаток.
`app.config.ts` читає ці значення; package/bundle ID мають залишатися сталими
між оновленнями одного застосунку.

Після зміни іконок, splash, native plugins або package/bundle ID синхронізуйте
нативний проєкт. Для Android:

```powershell
npx expo prebuild --platform android
```

Папки `android/` та `ios/` генеруються і не входять до git. Не використовуйте
`prebuild --clean`, якщо потрібно зберегти ручні зміни нативного проєкту,
зокрема налаштування підпису. Звичайний Metro reload не оновлює іконки чи native-код.

### Локальний Android: development build

```powershell
npm run android
# Для подальших запусків Metro з уже встановленим development client:
npx expo start --dev-client
```

Development build призначений для розробки й використовує Metro. Expo Go не
підходить для перевірки native Google Sign-In у цьому проєкті.

### Локальний Android: APK без Metro

З кореня проєкту після `npm ci` і `prebuild`:

```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
```

Готовий APK: `android/app/build/outputs/apk/release/app-release.apk`.
Його можна скопіювати на Android і встановити, дозволивши встановлення з обраного
джерела. Release APK містить JS bundle й працює без Metro.

У стандартному Android-проєкті, згенерованому поточним Expo/RN-шаблоном,
`buildTypes.release` використовує **debug keystore**. Це дозволяє локальну перевірку,
але для розповсюдження налаштуйте власний постійний release keystore або
використовуйте керований підпис EAS. Перевіряйте фактичний ключ через
`signingReport`, а не за назвою варіанта `release`.

Для локальної збірки Android App Bundle для Google Play:

```powershell
cd android
.\gradlew.bat bundleRelease
cd ..
```

Результат: `android/app/build/outputs/bundle/release/app-release.aab`.
Перед публікацією має бути налаштований release/upload key. AAB призначений для
магазину й не встановлюється як APK. Налаштування власного ключа описано в
[Expo: локальна release-збірка](https://docs.expo.dev/guides/local-app-production/).
Збережіть резервну копію ключа та паролів поза git.

### Хмарний Android через Expo EAS

Перший запуск для власного Expo-проєкту:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
```

`init` прив’язує застосунок до вашого Expo-акаунта/проєкту. За потреби погодьтеся
на створення signing credentials під час першої збірки. Для прямого встановлення
на телефон використовуйте готовий профіль `preview`:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

Після завершення CLI покаже посилання на APK. `preview` працює без Metro.
Для Google Play:

```powershell
npx eas-cli@latest build --platform android --profile production
```

Поточний `eas.json` містить такі профілі:

| Профіль       | Android            | iOS                                            | Призначення                     |
| ------------- | ------------------ | ---------------------------------------------- | ------------------------------- |
| `development` | Development client | Development client на зареєстрованому пристрої | Розробка з Metro                |
| `preview`     | APK                | Ad hoc IPA на зареєстрованих пристроях         | Самостійне тестування без Metro |
| `production`  | AAB                | App Store/TestFlight IPA                       | Магазини та TestFlight          |

Файл `.env` і локальні native-папки виключені з git. Для EAS задайте потрібні
`NOTTO_*` та `EXPO_PUBLIC_GOOGLE_*` у змінних середовища вашого EAS-проєкту
для відповідного середовища: `development`, `preview` або `production`.
Не покладайтеся на наявність локального `.env` на сервері збірки.
`EXPO_PUBLIC_*` потрапляють до bundle і не призначені для секретів.
Під час CNG-збірки без native-папок EAS сам запускає prebuild.

### iOS через EAS із Windows

Для збірки на фізичний iPhone через EAS потрібні Apple Account із членством
Apple Developer Program, Expo-акаунт і bundle ID застосунку (за замовчуванням
`com.luzhnyak.notto`; перевизначення — `NOTTO_IOS_BUNDLE_ID`).
Для Google-входу також задайте iOS OAuth client ID і reversed client ID
(`NOTTO_GOOGLE_IOS_URL_SCHEME`). Mac для хмарної збірки не потрібен.

Для внутрішнього встановлення спочатку зареєструйте iPhone за інструкціями CLI,
потім створіть збірку, включивши пристрій у provisioning profile:

```powershell
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Встановіть збірку на зареєстрований пристрій за посиланням EAS. За потреби ввімкніть
Developer Mode на iPhone. Якщо додали інший пристрій, оновіть provisioning profile
і перебудуйте або перепідпишіть збірку: старий IPA не включає його автоматично.
Для TestFlight/App Store:

```powershell
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

У `submit` виберіть потрібну готову збірку. Для App Store Connect потрібно завершити
налаштування запису застосунку; зовнішнє тестування/публікація можуть вимагати review.
Production IPA не встановлюється довільним копіюванням на iPhone.

### Локальний iOS на Mac

Після встановлення залежностей і налаштування `.env`:

```bash
npx expo prebuild --platform ios
npm run ios
# Для підключеного iPhone:
npx expo run:ios --device
```

Для simulator потрібні Xcode та встановлений iOS runtime. Для пристрою налаштуйте
Signing & Capabilities у Xcode й Developer Mode на iPhone. Власний пристрій можна
тестувати з безкоштовним Apple Account через Xcode з обмеженнями підписування;
TestFlight/App Store потребують членства Apple Developer Program.

### Windows: `npm ci` завершується з `EBUSY`

Якщо npm не може видалити JAR у `node_modules/.../android/build/.../lint-cache`,
файл утримує інший процес, часто Gradle/Android Studio. Закрийте Android Studio,
зупиніть Metro та Gradle, потім повторіть встановлення:

```powershell
cd D:\Web\notto\android
.\gradlew.bat --stop
cd ..
npm ci
```

Якщо блокування залишається, перезавантажте Windows і запустіть `npm ci` до
відкриття Android Studio. `npm ci` сам очищує `node_modules`; видаляти lockfile
або дані застосунку на телефоні не потрібно. `gradlew clean` не є обов’язковим
кроком перед кожною збіркою.

## Фінгерпрінт Android для Google Sign-In

Фінгерпрінт — SHA-1/SHA-256 **сертифіката підпису застосунку**, а не телефона.
Android OAuth client у Google Cloud прив’язаний до пари **package name + SHA-1**.
Debug, EAS і Google Play можуть використовувати різні сертифікати.

### Локальні debug/release: Gradle signing report

Після першого `npx expo prebuild --platform android` виконайте з кореня проєкту:

```powershell
cd android
.\gradlew.bat signingReport
cd ..
```

На macOS/Linux команда всередині `android/`: `./gradlew signingReport`.
У виводі знайдіть блок модуля `:app` для потрібного варіанта (`debug` або `release`)
і скопіюйте рядок `SHA1`. `SHA-256` також буде у звіті; для Android OAuth client
у Google Cloud потрібен саме **SHA-1**. Поля `Store` та `Alias` показують,
який keystore фактично використано. Якщо `release` підписаний debug-ключем,
його SHA-1 збігатиметься з debug.

Альтернатива для debug keystore поточного згенерованого шаблону, з кореня проєкту:

```powershell
keytool -list -v -keystore .\android\app\debug.keystore -alias androiddebugkey -storepass android
```

`keytool` входить до JDK; якщо команда не знайдена, перевірте `JAVA_HOME`/`PATH`
або викличте `keytool.exe` із каталогу `bin` установленого JDK.
Для власного release keystore використовуйте його шлях та alias; пароль введіть
за запитом, не додаючи його до командної історії:

```powershell
keytool -list -v -keystore "D:\Keys\notto-release.jks" -alias notto
```

### EAS signing certificate

```powershell
npx eas-cli@latest credentials --platform android
```

Виберіть потрібний build profile та перегляньте SHA-1/SHA-256 його keystore.
Якщо credentials ще не створені, спочатку налаштуйте їх у цьому меню або запустіть
першу EAS-збірку. Після зміни ключа fingerprint потрібно перевірити повторно.

### Google Play App Signing

У Google Play Console відкрийте **App integrity / App signing** і скопіюйте
SHA-1 з **App signing key certificate**. Саме ним Google підписує застосунок,
який користувач установлює з Play. **Upload key certificate** використовується
для завантаження збірок і може мати інший SHA-1.

### Куди додати SHA-1

У Google Cloud Console вашого проєкту відкрийте **APIs & Services → Credentials →
Create credentials → OAuth client ID → Android**. Укажіть фактичний Android package
(`NOTTO_ANDROID_PACKAGE` / `applicationId` згенерованої збірки) та SHA-1.
Для кожної потрібної пари package + SHA-1 створіть відповідний Android OAuth client
в одному Google Cloud project: локальний debug, EAS APK та Play App Signing.
Якщо сертифікат і package збігаються, дублювати client не потрібно.

`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` має містити ID **Web application** client,
не Android client і не сам fingerprint. Обидва OAuth clients мають належати
до того самого Google Cloud project. Після зміни `.env`/native OAuth-конфігурації
перебудуйте застосунок; при самому додаванні SHA-1 до Google Cloud без зміни ключа
чи конфігурації перевстановлення не потрібне.

Довідка: [Google: client authentication та signingReport](https://developers.google.com/android/guides/client-auth),
[Expo: APK](https://docs.expo.dev/build-reference/apk/),
[Expo: signing credentials](https://docs.expo.dev/app-signing/app-credentials/),
[Expo: внутрішні збірки](https://docs.expo.dev/build/internal-distribution/),
[Expo: iOS у TestFlight/App Store](https://docs.expo.dev/submit/ios/).

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

Під час реалізації фактично пройдено TypeScript, 43 Jest tests, Expo Doctor 18/18 і Android Metro/Hermes export. SQL-тести виконуються на справжньому in-memory SQLite Node, не на SQL-моках. Покривають CRUD, транзакційний rollback, FK/CHECK, перенесення типів, теги, фільтри, FTS/fallback, архів/кошик, календарні дати; окремі тести — файли, серіалізація backup, hashes/path traversal, HTML escaping.

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

### Виправлення closeAsync при збереженні

SQLite-з’єднання живе протягом роботи застосунку; транзакції та зовнішні запити проходять через одну чергу. З’єднання більше не відкривається й не закривається після кожного запису, що обходить проблему Expo SDK 54 / FTS під час closeAsync. Прямі звернення налаштувань також проходять через чергу. Транзакційний callback має використовувати переданий `tx`, а не повторно викликати queued repository methods (це спричинило б deadlock). Native-перевірку виправлення потрібно виконати на пристрої.

### Android crash after saving: ScreenStackFragment

`react-native-screens@4.16.0` може викликати `canNavigateBack()` під час оновлення заголовка вже від’єднаного екрана. У журналі це `ScreenStackFragment added into a non-stack container` після навігації з редактора. `scripts/patch-react-native-screens.cjs` переносить захист від null stack з upstream PR #4498 та виконується автоматично через `postinstall`. Версію screens зафіксовано; патч перевіряє очікуваний код і є ідемпотентним. Під час оновлення Expo/screens потрібно переглянути й прибрати патч, якщо виправлення вже включене в залежність.

Після отримання цього виправлення виконайте `npm ci`, потім **`npm run android`**, щоб перебудувати native-застосунок. Одного Metro reload недостатньо. Очищати дані застосунку або видаляти нотатки не потрібно. Під час перевірки збірка APK/запуск емулятора в середовищі розробника були недоступні; перевірено застосування патча до фактично встановленого Kotlin-файлу та повторне застосування без змін.

### Календар, кнопки та нижня safe area

Поле дати події в редакторі й дата у фільтрах пошуку використовують `@react-native-community/datetimepicker` 8.4.4 (версія для Expo SDK 54). На Android відкривається системний календар через `DateTimePickerAndroid.open`; на iOS — нативний inline picker у вікні з «Готово» і «Скасувати». Скасування залишає попереднє значення. Праворуч від поля з датою є окрема іконка × для очищення з доступною текстовою міткою. Дата зберігається як локальний `YYYY-MM-DD`, без UTC-перетворення. Заголовок створення — «Нова нотатка».

Екран календаря використовує `Agenda` з `react-native-calendars` від Wix: календар, що розгортається та згортається, і стрічка нотаток, згрупованих за днями. Збережено українські назви, тиждень із понеділка та до трьох кольорових позначок типів на день. Нотатки використовують дату події або локальну дату створення; картки відкриваються як раніше. Вибір дати та прокручування стрічки синхронізовані. Попередній/наступний рік і сітка швидкого вибору переносять на ту саму дату відповідного року; 29 лютого коректно переходить на 28 лютого невисокосного року.

`Agenda` має власний список, тому зовнішній `Screen` використовує `scroll={false}`. Для відвіданих місяців та сусідніх місяців відомі порожні дні передаються як `[]`, щоб вони не виглядали як незавантажені. Явний перехід між роками перестворює обмежене вікно прокручування календаря; звичайний вибір дня цього не робить. Нові нативні залежності для переходу на `Agenda` не потрібні.

Після встановлення нової залежності потрібне перезбирання development client: `npm ci`, потім `npm run android`. У конфігурації Expo зареєстрований плагін `@react-native-community/datetimepicker`. Одного Metro reload недостатньо.

Звичайні кнопки мають окрему від полів вводу заливку у світлій та темній темах. Коренева SafeAreaView враховує системну нижню зону для всіх екранів; Tabs не додає її повторно. Вікно вибору дати також має safe area. Перевірено component tests нативного вибору/скасування/очищення дати, фільтрів пошуку та переходів між роками, зокрема початкової дати 29 лютого. Native-вигляд із жестовою й трьохкнопковою навігацією потрібно перевірити на пристрої.

### Компактні довідники у формах

Тип нотатки та емоція у редакторі й пошуку вибираються через спільний SelectField зі списком та пошуком. Для необов’язкової емоції доступне «Без емоції», у пошуку — «Усі типи»/«Усі емоції». TagPicker згортає вибрані теги в один рядок (дві назви та кількість решти); відкриває список із пошуком і множинним вибором. «Готово» застосовує набір, «Скасувати» відкидає зміни, «Зняти всі» очищує чернетку вибору. Списки використовують FlatList та окрему safe area; нових native-залежностей немає.

### Меню дій нотатки

На екрані нотатки дії доступні через «⋮» праворуч у navigation header. У меню: редагування, архів/повернення з архіву, закріплення/відкріплення, вибране, експорт і кошик. Експорт відкриває підменю TXT/Markdown/PDF/JSON. У кошику доступні відновлення, експорт та остаточне видалення з підтвердженням. Натискання поза меню або системної кнопки «Назад» закриває його. На iOS дія запускається після завершення native-dismiss меню, щоб не накладати системне поширення/діалог або навігацію на відкритий Modal. Тіло екрана залишає вміст, метадані, теги та вкладення.

### Збереження вкладень на Android

Кнопка «Зберегти» для фотографій і документів відкриває системний діалог «Зберегти як» (`ACTION_CREATE_DOCUMENT`). Користувач обирає папку та назву окремого файла; доступ до всього дерева папок більше не запитується. Скасування не показує повідомлення про успіх. Байти записуються через сучасний `expo-file-system File.write` без legacy-перевірки `DocumentFile.canWrite()` для дерева Downloads.

Після оновлення виконайте `npm ci` і **`npm run android`**. Додано `expo-intent-launcher` 13.0.8 та ідемпотентний postinstall-патч `scripts/patch-expo-intent-launcher.cjs`: native-модуль має повертати `Intent.data`, а не `Intent.toString()`. Патч перевіряє версію та очікуваний код. Перегляньте його під час оновлення Expo. Самого перезапуску Metro недостатньо.

На пристрої перевірте збереження PNG/JPEG і PDF у Downloads та вкладену папку, зміну назви, повторне збереження з тією самою назвою, скасування і надсилання. Автоматичні перевірки не замінюють перевірку системного діалогу й запису на Android.

### Застосування Android-патчів Expo

Expo SDK 54 може використовувати готові AAR-модулі з `local-maven-repo` (позначка `[📦]` у журналі Gradle). У такому режимі зміни Kotlin у `node_modules` не включаються навіть після очищення Android-збірки. Для `expo-file-system` і `expo-intent-launcher` увімкнено `expo.autolinking.android.buildFromSource` у `package.json`. Інші модулі зберігають стандартний спосіб збірки.

Патч `FileSystemFile.write` для `content://` відкриває потік `ContentResolver` до вже створеного документа без повторного `File.create()`. Неповні метадані провайдера більше не повинні переводити запис у гілку створення файла. Системні дозволи перевіряє Android під час відкриття потоку. Для звичайних локальних файлів поведінка створення збережена.

Оновлення: `git pull origin feat/local-mvp`, `npm ci`, `npm run android`. Перевірте, що під час Gradle-конфігурації обидва змінені модулі показуються без позначки `[📦]`, а під час компіляції є задачі `:expo-file-system:compileDebugKotlin` і `:expo-intent-launcher:compileDebugKotlin`. `gradlew clean` не потрібен. Реальний запис через провайдер Downloads має бути перевірений на Android; JS-тести й перевірка конфігурації не виконують його.

### Захист Agenda від циклу оновлень React 19

У `react-native-calendars` 1.1314.0 `ReservationList.componentDidUpdate` порівнює об’єкти `prevProps` і `this.props` за посиланням. Коли React 19/Fabric передає новий об’єкт із тими самими значеннями, власний `setState` списку запускає нескінченний цикл (`Maximum update depth exceeded`).

`scripts/patch-react-native-calendars.cjs` замінює цю перевірку на неглибоке порівняння значень усіх полів. Зміна нотаток, вибраного дня та інших props і далі оновлює список. Версію календаря зафіксовано; патч застосовується через `postinstall`, підтримує повторний запуск і відхиляє неочікуваний код чи версію залежності. Під час оновлення бібліотеки його потрібно переглянути.

Оновлення: `npm ci`, потім `npx expo start --dev-client --clear`. Перезбирання Android для цього JavaScript-патча не потрібне. Регресійні тести виконують справжній код `ReservationList` з імітацією клонування props після власного `setState`; нативний рендеринг і стилі підмінено. Це не замінює перевірку відкриття, розгортання та прокручування Agenda на пристрої.
