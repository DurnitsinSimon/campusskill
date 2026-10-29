import { SkillLevel, WorkshopFormat, WorkshopStatus } from '../src/generated/prisma/enums';

const { ONLINE, OFFLINE } = WorkshopFormat;
const { BEGINNER, INTERMEDIATE, ADVANCED } = SkillLevel;

export const DEMO_PASSWORD = 'Demo1234!';
export const EMAIL_DOMAIN = 'campus.example';

export interface CategorySeed {
  name: string;
  slug: string;
  icon: string;
  skills: [name: string, slug: string][];
}

export const categories: CategorySeed[] = [
  {
    name: 'Программирование',
    slug: 'programming',
    icon: '💻',
    skills: [
      ['React', 'react'],
      ['TypeScript', 'typescript'],
      ['Python', 'python'],
      ['SQL', 'sql'],
      ['Git', 'git'],
      ['Docker', 'docker'],
      ['NestJS', 'nestjs'],
    ],
  },
  {
    name: 'Дизайн',
    slug: 'design',
    icon: '🎨',
    skills: [
      ['Figma', 'figma'],
      ['UX-исследования', 'ux-research'],
      ['Иллюстрация', 'illustration'],
      ['Типографика', 'typography'],
    ],
  },
  {
    name: 'Иностранные языки',
    slug: 'languages',
    icon: '🌍',
    skills: [
      ['Английский язык', 'english'],
      ['Японский язык', 'japanese'],
      ['Испанский язык', 'spanish'],
    ],
  },
  {
    name: 'Музыка',
    slug: 'music',
    icon: '🎸',
    skills: [
      ['Гитара', 'guitar'],
      ['Вокал', 'vocal'],
      ['Фортепиано', 'piano'],
      ['Сведение и мастеринг', 'mixing'],
    ],
  },
  {
    name: 'Кулинария',
    slug: 'cooking',
    icon: '🍳',
    skills: [
      ['Выпечка', 'baking'],
      ['Азиатская кухня', 'asian-cuisine'],
      ['Кофе и альтернативное заваривание', 'coffee'],
    ],
  },
  {
    name: 'Карьера и soft skills',
    slug: 'career',
    icon: '🚀',
    skills: [
      ['Публичные выступления', 'public-speaking'],
      ['Резюме и собеседования', 'job-interview'],
      ['Тайм-менеджмент', 'time-management'],
    ],
  },
];

export interface PersonSeed {
  key: string;
  firstName: string;
  lastName: string;
  emailName: string;
  university: string;
  course: number;
  bio?: string;
}

export interface MentorSeed extends PersonSeed {
  headline: string;
  experience: string;
  yearsOfExperience: number;
  formats: WorkshopFormat[];
  telegram: string;
  skills: [slug: string, level: SkillLevel][];
}

export const admin: PersonSeed = {
  key: 'admin',
  firstName: 'Ольга',
  lastName: 'Миронова',
  emailName: 'admin',
  university: 'Отдел молодёжной политики',
  course: 0,
  bio: 'Модерирую воркшопы и помогаю менторам с организацией.',
};

export const mentors: MentorSeed[] = [
  {
    key: 'kravtsova',
    firstName: 'Елена',
    lastName: 'Кравцова',
    emailName: 'elena.kravtsova',
    university: 'Институт дизайна, Дизайн цифровых продуктов',
    course: 4,
    bio: 'Продуктовый дизайнер, люблю чистые интерфейсы и честные интервью с пользователями.',
    headline: 'Продуктовый дизайнер, 3 года в финтехе',
    experience:
      'Проектирую мобильные приложения для банка, до этого — фриланс и две стажировки в студиях. Провела больше 40 пользовательских интервью, веду дизайн-систему из 120 компонентов.',
    yearsOfExperience: 3,
    formats: [ONLINE, OFFLINE],
    telegram: '@kravtsova_ux',
    skills: [
      ['figma', ADVANCED],
      ['ux-research', ADVANCED],
      ['illustration', INTERMEDIATE],
      ['typography', INTERMEDIATE],
    ],
  },
  {
    key: 'belousov',
    firstName: 'Артём',
    lastName: 'Белоусов',
    emailName: 'artem.belousov',
    university: 'ИРИТ-РТФ, Программная инженерия',
    course: 4,
    bio: 'Пишу фронтенд на React и объясняю сложное на пальцах.',
    headline: 'Frontend-разработчик в e-commerce',
    experience:
      'Два года разрабатываю интернет-магазин с миллионом посетителей в месяц: React, TypeScript, Next.js. Проводил внутренние code review и обучал стажёров.',
    yearsOfExperience: 2,
    formats: [ONLINE],
    telegram: '@artem_frontend',
    skills: [
      ['react', ADVANCED],
      ['typescript', ADVANCED],
      ['git', INTERMEDIATE],
    ],
  },
  {
    key: 'shestakov',
    firstName: 'Дмитрий',
    lastName: 'Шестаков',
    emailName: 'dmitry.shestakov',
    university: 'Институт естественных наук и математики, Прикладная математика',
    course: 3,
    headline: 'Аналитик данных, призёр хакатонов по ML',
    experience:
      'Работаю аналитиком в ритейле: SQL, Python, дашборды. Дважды брал призы на студенческих хакатонах по анализу данных.',
    yearsOfExperience: 2,
    formats: [ONLINE, OFFLINE],
    telegram: '@d_shestakov',
    skills: [
      ['python', ADVANCED],
      ['sql', ADVANCED],
    ],
  },
  {
    key: 'ogneva',
    firstName: 'Мария',
    lastName: 'Огнева',
    emailName: 'maria.ogneva',
    university: 'Уральский гуманитарный институт, Лингвистика',
    course: 4,
    bio: 'IELTS 8.0, полгода училась по обмену в Дублине.',
    headline: 'Преподаватель английского, IELTS 8.0',
    experience:
      'Три года преподаю английский школьникам и студентам, готовлю к IELTS. Веду разговорный клуб при студсовете.',
    yearsOfExperience: 3,
    formats: [ONLINE, OFFLINE],
    telegram: '@maria_speaks',
    skills: [['english', ADVANCED]],
  },
  {
    key: 'zaitsev',
    firstName: 'Кирилл',
    lastName: 'Зайцев',
    emailName: 'kirill.zaitsev',
    university: 'Институт радиоэлектроники и информационных технологий, Радиотехника',
    course: 2,
    headline: 'Гитарист кавер-группы «Восьмой корпус»',
    experience:
      'Играю на гитаре 7 лет, выступаю с группой на студенческих концертах. Записываю и свожу треки в домашней студии.',
    yearsOfExperience: 7,
    formats: [OFFLINE],
    telegram: '@kirill_strings',
    skills: [
      ['guitar', ADVANCED],
      ['mixing', INTERMEDIATE],
    ],
  },
  {
    key: 'tarasova',
    firstName: 'Алина',
    lastName: 'Тарасова',
    emailName: 'alina.tarasova',
    university: 'Институт экономики и управления, Менеджмент',
    course: 3,
    bio: 'Пеку на заказ с первого курса.',
    headline: 'Домашний кондитер, торты и макаронс на заказ',
    experience:
      'Окончила курсы кондитеров, четыре года пеку на заказ. Провела 15 мастер-классов для детей и взрослых.',
    yearsOfExperience: 4,
    formats: [OFFLINE],
    telegram: '@alina_bakes',
    skills: [['baking', ADVANCED]],
  },
  {
    key: 'galiev',
    firstName: 'Тимур',
    lastName: 'Галиев',
    emailName: 'timur.galiev',
    university: 'ИРИТ-РТФ, Информатика и вычислительная техника',
    course: 4,
    headline: 'Backend-разработчик, Node.js и DevOps',
    experience:
      'Разрабатываю микросервисы на NestJS в логистической компании, настраиваю CI/CD и Docker-окружения. Ментор студенческой проектной школы.',
    yearsOfExperience: 2,
    formats: [ONLINE],
    telegram: '@timur_backend',
    skills: [
      ['docker', ADVANCED],
      ['git', ADVANCED],
      ['nestjs', ADVANCED],
      ['typescript', INTERMEDIATE],
    ],
  },
  {
    key: 'li',
    firstName: 'Софья',
    lastName: 'Ли',
    emailName: 'sofya.li',
    university: 'Уральский гуманитарный институт, Востоковедение',
    course: 3,
    bio: 'JLPT N2, стажировалась в Осаке.',
    headline: 'Японский язык, JLPT N2',
    experience:
      'Изучаю японский пять лет, сдала JLPT N2. Год стажировалась в университете Осаки, веду курс для начинающих в клубе востоковедов.',
    yearsOfExperience: 5,
    formats: [OFFLINE, ONLINE],
    telegram: '@sofya_nihongo',
    skills: [['japanese', ADVANCED]],
  },
  {
    key: 'vorobyov',
    firstName: 'Никита',
    lastName: 'Воробьёв',
    emailName: 'nikita.vorobyov',
    university: 'Институт экономики и управления, Управление персоналом',
    course: 4,
    headline: 'HR-стажёр в IT-компании, капитан команды дебатов',
    experience:
      'Полгода провожу первичные собеседования с разработчиками, до этого — три года в клубе дебатов. Помог 30+ студентам переписать резюме.',
    yearsOfExperience: 1,
    formats: [ONLINE, OFFLINE],
    telegram: '@nikita_hr',
    skills: [
      ['job-interview', ADVANCED],
      ['public-speaking', ADVANCED],
      ['time-management', INTERMEDIATE],
    ],
  },
  {
    key: 'medvedeva',
    firstName: 'Варвара',
    lastName: 'Медведева',
    emailName: 'varvara.medvedeva',
    university: 'Институт физической культуры, спорта и молодёжной политики, Организация работы с молодёжью',
    course: 2,
    headline: 'Вокалистка, выпускница музыкальной школы по классу фортепиано',
    experience:
      'Окончила музыкальную школу по фортепиано, пять лет занимаюсь академическим и эстрадным вокалом. Солистка студенческого хора.',
    yearsOfExperience: 5,
    formats: [OFFLINE],
    telegram: '@varya_sings',
    skills: [
      ['vocal', ADVANCED],
      ['piano', INTERMEDIATE],
    ],
  },
  {
    key: 'kim',
    firstName: 'Георгий',
    lastName: 'Ким',
    emailName: 'georgy.kim',
    university: 'Химико-технологический институт, Технология продуктов питания',
    course: 3,
    bio: 'Работал бариста в спешелти-кофейне, готовлю корейскую и японскую кухню.',
    headline: 'Бариста и повар азиатской кухни',
    experience:
      'Два года работал бариста в спешелти-кофейне, участвовал в городском чемпионате по аэропрессу. Дома готовлю рамен и кимчи по семейным рецептам.',
    yearsOfExperience: 2,
    formats: [OFFLINE],
    telegram: '@georgy_brews',
    skills: [
      ['asian-cuisine', ADVANCED],
      ['coffee', ADVANCED],
    ],
  },
];

export const demoParticipant: PersonSeed = {
  key: 'smirnov',
  firstName: 'Иван',
  lastName: 'Смирнов',
  emailName: 'ivan.smirnov',
  university: 'ИРИТ-РТФ, Прикладная информатика',
  course: 3,
  bio: 'Учусь на прикладной информатике, хочу во фронтенд и параллельно учу гитару.',
};

export const participants: PersonSeed[] = [
  { key: 'p01', firstName: 'Анна', lastName: 'Петрова', emailName: 'anna.petrova', university: 'ИРИТ-РТФ, Программная инженерия', course: 2 },
  { key: 'p02', firstName: 'Максим', lastName: 'Волков', emailName: 'maxim.volkov', university: 'ИРИТ-РТФ, Информационная безопасность', course: 3 },
  { key: 'p03', firstName: 'Дарья', lastName: 'Соколова', emailName: 'darya.sokolova', university: 'Институт дизайна, Графический дизайн', course: 1 },
  { key: 'p04', firstName: 'Егор', lastName: 'Никитин', emailName: 'egor.nikitin', university: 'Физико-технологический институт, Ядерная физика', course: 2 },
  { key: 'p05', firstName: 'Полина', lastName: 'Морозова', emailName: 'polina.morozova', university: 'Уральский гуманитарный институт, Журналистика', course: 3 },
  { key: 'p06', firstName: 'Лев', lastName: 'Афанасьев', emailName: 'lev.afanasyev', university: 'ИРИТ-РТФ, Прикладная информатика', course: 1 },
  { key: 'p07', firstName: 'Вероника', lastName: 'Козлова', emailName: 'veronika.kozlova', university: 'Институт экономики и управления, Бизнес-информатика', course: 2 },
  { key: 'p08', firstName: 'Арсений', lastName: 'Гусев', emailName: 'arseny.gusev', university: 'Институт строительства и архитектуры, Архитектура', course: 4 },
  { key: 'p09', firstName: 'Ксения', lastName: 'Лебедева', emailName: 'ksenia.lebedeva', university: 'Институт естественных наук и математики, Биология', course: 2 },
  { key: 'p10', firstName: 'Роман', lastName: 'Ефимов', emailName: 'roman.efimov', university: 'Институт новых материалов и технологий, Металлургия', course: 3 },
  { key: 'p11', firstName: 'Ульяна', lastName: 'Захарова', emailName: 'ulyana.zakharova', university: 'Уральский гуманитарный институт, Лингвистика', course: 1 },
  { key: 'p12', firstName: 'Тихон', lastName: 'Орлов', emailName: 'tikhon.orlov', university: 'ИРИТ-РТФ, Радиотехника', course: 2 },
  { key: 'p13', firstName: 'Злата', lastName: 'Романова', emailName: 'zlata.romanova', university: 'Институт дизайна, Дизайн цифровых продуктов', course: 2 },
  { key: 'p14', firstName: 'Глеб', lastName: 'Степанов', emailName: 'gleb.stepanov', university: 'ИРИТ-РТФ, Информатика и вычислительная техника', course: 3 },
  { key: 'p15', firstName: 'Милана', lastName: 'Фёдорова', emailName: 'milana.fedorova', university: 'Химико-технологический институт, Биотехнология', course: 1 },
  { key: 'p16', firstName: 'Савелий', lastName: 'Белов', emailName: 'savely.belov', university: 'Институт экономики и управления, Экономика', course: 4 },
  { key: 'p17', firstName: 'Алиса', lastName: 'Яковлева', emailName: 'alisa.yakovleva', university: 'Уральский гуманитарный институт, Востоковедение', course: 2 },
  { key: 'p18', firstName: 'Марк', lastName: 'Карпов', emailName: 'mark.karpov', university: 'ИРИТ-РТФ, Программная инженерия', course: 1 },
  { key: 'p19', firstName: 'Ева', lastName: 'Николаева', emailName: 'eva.nikolaeva', university: 'Институт физической культуры, спорта и молодёжной политики, Спортивный менеджмент', course: 3 },
  { key: 'p20', firstName: 'Фёдор', lastName: 'Данилов', emailName: 'fedor.danilov', university: 'Физико-технологический институт, Электроника и наноэлектроника', course: 2 },
  { key: 'p21', firstName: 'София', lastName: 'Ершова', emailName: 'sofia.ershova', university: 'Институт строительства и архитектуры, Дизайн архитектурной среды', course: 3 },
  { key: 'p22', firstName: 'Даниил', lastName: 'Комаров', emailName: 'daniil.komarov', university: 'ИРИТ-РТФ, Прикладная информатика', course: 4 },
  { key: 'p23', firstName: 'Таисия', lastName: 'Сорокина', emailName: 'taisiya.sorokina', university: 'Институт естественных наук и математики, Химия', course: 1 },
  { key: 'p24', firstName: 'Илья', lastName: 'Мельников', emailName: 'ilya.melnikov', university: 'Институт новых материалов и технологий, Материаловедение', course: 2 },
];

export interface ReviewSeed {
  workshop: number;
  mentor: number;
  comment?: string;
  reply?: string;
}

export type DemoRole =
  | { status: 'CONFIRMED' }
  | { status: 'WAITLISTED'; position: number }
  | { status: 'ATTENDED'; review?: ReviewSeed }
  | { status: 'CANCELLED' };

export interface WorkshopSeed {
  mentor: string;
  title: string;
  shortDescription: string;
  description: string;
  requirements?: string;
  format: WorkshopFormat;
  location?: string;
  meetingUrl?: string;
  level: SkillLevel;
  /** день относительно сегодняшнего: -7 — неделю назад, 3 — через три дня */
  day: number;
  time: [hours: number, minutes: number];
  durationMinutes: number;
  capacity: number;
  price: number;
  status: WorkshopStatus;
  rejectionReason?: string;
  /** первый навык — основной */
  skills: string[];
  program: [title: string, minutes: number, description?: string][];
  /** участники, кроме демо-пользователя */
  confirmed?: number;
  attended?: number;
  noShow?: number;
  waitlisted?: number;
  cancelled?: number;
  reviews?: ReviewSeed[];
  demo?: DemoRole;
}

const room = {
  gukDesign: 'Главный учебный корпус, ауд. 412 (лаборатория дизайна)',
  coworking: 'Студенческий коворкинг «Точка сборки», корп. 1, 2 этаж',
  kitchen: 'Учебная кухня Химико-технологического института, ауд. Х-118',
  music: 'Музыкальная студия студсовета, корп. 3, ауд. 012',
  linguaClub: 'Языковой клуб, корп. 2, ауд. 305',
  hall: 'Малый актовый зал, корп. 1',
};

const meet = (id: string) => `https://telemost.yandex.ru/j/${id}`;

export const workshops: WorkshopSeed[] = [
  // ───────────── прошедшие ─────────────
  {
    mentor: 'kravtsova',
    title: 'Figma с нуля: первый макет мобильного приложения',
    shortDescription: 'За три часа соберём экран приложения доставки еды — от сетки до кликабельного прототипа.',
    description:
      'Разберём интерфейс Figma, фреймы, автолейауты и компоненты. Каждый участник соберёт главный экран приложения доставки и свяжет его в простой прототип. Подойдёт тем, кто ни разу не открывал Figma.',
    requirements: 'Ноутбук и аккаунт Figma (бесплатный тариф).',
    format: OFFLINE,
    location: room.gukDesign,
    level: BEGINNER,
    day: -21,
    time: [17, 0],
    durationMinutes: 180,
    capacity: 12,
    price: 0,
    status: WorkshopStatus.COMPLETED,
    skills: ['figma', 'ux-research'],
    program: [
      ['Интерфейс Figma и фреймы', 30],
      ['Сетки и автолейаут', 50, 'Почему макет «едет» и как это исправить'],
      ['Компоненты и варианты', 50],
      ['Прототип и показ результатов', 50],
    ],
    attended: 9,
    noShow: 1,
    reviews: [
      { workshop: 5, mentor: 5, comment: 'Наконец поняла автолейаут! Елена объясняет очень спокойно и понятно.', reply: 'Спасибо, Анна! Жду тебя на UX-исследовании.' },
      { workshop: 5, mentor: 5, comment: 'Отличный темп, успел собрать весь экран и даже анимацию перехода.' },
      { workshop: 4, mentor: 5, comment: 'Было бы здорово получить файл-шпаргалку с горячими клавишами.' },
      { workshop: 5, mentor: 4 },
      { workshop: 4, mentor: 4, comment: 'Компоненты показали быстро, я немного отстала, но Елена помогла.' },
      { workshop: 5, mentor: 5, comment: 'Лучший первый опыт с Figma, который можно представить.' },
      { workshop: 4, mentor: 5 },
    ],
  },
  {
    mentor: 'belousov',
    title: 'React Hooks на практике: useState, useEffect и свои хуки',
    shortDescription: 'Пишем приложение «Список покупок» и разбираемся, когда хуки помогают, а когда мешают.',
    description:
      'Посмотрим, как React перерисовывает компоненты, почему useEffect срабатывает дважды и как вынести логику в собственный хук. Пишем код вместе, по ходу разбираем частые ошибки с зависимостями.',
    requirements: 'Базовый JavaScript, установленный Node.js 20+ и редактор кода.',
    format: ONLINE,
    meetingUrl: meet('48213907551023'),
    level: INTERMEDIATE,
    day: -14,
    time: [19, 0],
    durationMinutes: 120,
    capacity: 20,
    price: 300,
    status: WorkshopStatus.COMPLETED,
    skills: ['react', 'typescript'],
    program: [
      ['Как React рендерит компоненты', 20],
      ['useState и иммутабельность', 30],
      ['useEffect: зависимости и очистка', 40],
      ['Пишем свой хук useLocalStorage', 30],
    ],
    attended: 11,
    noShow: 1,
    reviews: [
      { workshop: 5, mentor: 5, comment: 'Разбор useEffect — то, чего мне не хватало. Теперь понимаю, откуда бесконечные ререндеры.' },
      { workshop: 4, mentor: 5, comment: 'Хотелось бы больше времени на свой хук, но в целом очень полезно.' },
      { workshop: 5, mentor: 5, comment: 'Код из воркшопа уже использую в курсовой.', reply: 'Супер, удачи с курсовой!' },
      { workshop: 5, mentor: 4 },
      { workshop: 3, mentor: 4, comment: 'Для меня было слишком быстро — стоит заранее подтянуть JS.' },
      { workshop: 5, mentor: 5, comment: 'Артём отвечал на все вопросы в чате, даже после окончания.' },
      { workshop: 4, mentor: 4 },
    ],
    demo: {
      status: 'ATTENDED',
      review: { workshop: 5, mentor: 5, comment: 'Очень понятно про зависимости useEffect, переписал свой пет-проект после воркшопа.' },
    },
  },
  {
    mentor: 'shestakov',
    title: 'Pandas за вечер: анализируем расписание электричек',
    shortDescription: 'Загружаем открытые данные, чистим их и строим первые графики в Jupyter.',
    description:
      'На реальном датасете пригородных поездов разберём основы pandas: фильтрацию, группировки, работу с датами. В конце построим графики загруженности по часам и выясним, когда электрички опаздывают чаще всего.',
    requirements: 'Ноутбук с Python 3.11+ и Jupyter (или аккаунт Google Colab).',
    format: ONLINE,
    meetingUrl: meet('70315528940217'),
    level: BEGINNER,
    day: -10,
    time: [18, 30],
    durationMinutes: 150,
    capacity: 15,
    price: 0,
    status: WorkshopStatus.COMPLETED,
    skills: ['python', 'sql'],
    program: [
      ['DataFrame и загрузка CSV', 30],
      ['Фильтрация и очистка данных', 40],
      ['Группировки и даты', 40],
      ['Графики с matplotlib', 40],
    ],
    attended: 9,
    noShow: 2,
    reviews: [
      { workshop: 5, mentor: 5, comment: 'Классный датасет, сразу видно, зачем нужны группировки.' },
      { workshop: 4, mentor: 4, comment: 'Немного не хватило времени на графики.' },
      { workshop: 5, mentor: 5 },
      { workshop: 4, mentor: 5, comment: 'Дмитрий хорошо объясняет, почему код работает именно так.' },
      { workshop: 5, mentor: 4 },
      { workshop: 3, mentor: 4, comment: 'В Colab всё запустилось не сразу, потеряла минут 15.' },
    ],
    demo: { status: 'ATTENDED' },
  },
  {
    mentor: 'ogneva',
    title: 'Разговорный клуб: small talk без страха',
    shortDescription: 'Тренируем лёгкие разговоры на английском: знакомство, хобби, учёба.',
    description:
      'Небольшая группа, много практики в парах. Разберём фразы, которые помогают поддержать разговор и выйти из неловкой паузы. Уровень — от уверенного Pre-Intermediate.',
    format: OFFLINE,
    location: room.linguaClub,
    level: INTERMEDIATE,
    day: -7,
    time: [16, 0],
    durationMinutes: 90,
    capacity: 10,
    price: 0,
    status: WorkshopStatus.COMPLETED,
    skills: ['english'],
    program: [
      ['Разминка: истории в парах', 20],
      ['Фразы для поддержания беседы', 30],
      ['Ролевые ситуации: нетворкинг', 30],
      ['Обратная связь', 10],
    ],
    attended: 8,
    noShow: 1,
    reviews: [
      { workshop: 5, mentor: 5, comment: 'Впервые говорила на английском полтора часа и не замолкала!' },
      { workshop: 5, mentor: 5, comment: 'Уютная атмосфера, никто не стесняется ошибаться.' },
      { workshop: 4, mentor: 5 },
      { workshop: 5, mentor: 5, comment: 'Мария даёт очень точную обратную связь по произношению.' },
      { workshop: 4, mentor: 4, comment: 'Хотелось бы чаще — раз в неделю было бы идеально.', reply: 'Планируем сделать клуб еженедельным, следите за каталогом!' },
    ],
  },
  {
    mentor: 'zaitsev',
    title: 'Гитара за два часа: первые аккорды и бой',
    shortDescription: 'Научимся держать гитару, ставить четыре базовых аккорда и сыграем первую песню.',
    description:
      'Для тех, у кого гитара пылится в углу. Разберём посадку, постановку рук, аккорды Am, C, G, Em и простой бой «шестёрка». В конце сыграем вместе знакомую всем мелодию.',
    requirements: 'Своя акустическая гитара (несколько учебных гитар есть на месте — предупредите заранее).',
    format: OFFLINE,
    location: room.music,
    level: BEGINNER,
    day: -5,
    time: [18, 0],
    durationMinutes: 120,
    capacity: 8,
    price: 200,
    status: WorkshopStatus.COMPLETED,
    skills: ['guitar'],
    program: [
      ['Посадка и настройка гитары', 20],
      ['Аккорды Am, C, G, Em', 50],
      ['Бой «шестёрка» и смена аккордов', 30],
      ['Играем песню вместе', 20],
    ],
    attended: 5,
    reviews: [
      { workshop: 5, mentor: 5, comment: 'Пальцы болят, но я сыграла первую песню. Кирилл — огонь!' },
      { workshop: 4, mentor: 5, comment: 'Хорошо бы продолжение про баррэ.', reply: 'Будет! Готовлю fingerstyle-воркшоп.' },
      { workshop: 5, mentor: 4 },
    ],
    demo: {
      status: 'ATTENDED',
      review: { workshop: 5, mentor: 5, comment: 'Наконец-то смена аккордов перестала быть мучением, спасибо за упражнения.' },
    },
  },
  {
    mentor: 'tarasova',
    title: 'Французские макаронс: секреты идеальной «юбочки»',
    shortDescription: 'Печём макаронс по итальянской меренге и забираем коробочку домой.',
    description:
      'Разберём, почему макаронс трескаются и не дают «юбочку», научимся делать итальянскую меренгу и ганаш. Все продукты и инвентарь предоставляются, стоимость включает ингредиенты.',
    requirements: 'Фартук и контейнер для готовых пирожных.',
    format: OFFLINE,
    location: room.kitchen,
    level: INTERMEDIATE,
    day: -3,
    time: [12, 0],
    durationMinutes: 180,
    capacity: 6,
    price: 500,
    status: WorkshopStatus.COMPLETED,
    skills: ['baking'],
    program: [
      ['Теория: миндальная мука и меренга', 30],
      ['Готовим тесто и отсаживаем', 60],
      ['Ганаш и начинки', 40],
      ['Сборка и упаковка', 50],
    ],
    attended: 6,
    reviews: [
      { workshop: 5, mentor: 5, comment: 'Получились с первого раза! Дома повторила — тоже вышло.' },
      { workshop: 5, mentor: 5, comment: 'Очень подробная теория, теперь понимаю, что делала не так.' },
      { workshop: 4, mentor: 5, comment: 'Немного тесно на кухне вшестером, но атмосфера чудесная.' },
      { workshop: 5, mentor: 5 },
      { workshop: 5, mentor: 4, comment: 'Стоит своих денег, тем более что всё включено.' },
    ],
  },

  // ───────────── предстоящие, опубликованы ─────────────
  {
    mentor: 'galiev',
    title: 'Docker для студентов: упаковываем свой проект в контейнер',
    shortDescription: 'Пишем Dockerfile и docker-compose для учебного проекта на Node.js с PostgreSQL.',
    description:
      'Разберём, чем контейнер отличается от виртуальной машины, напишем Dockerfile с многоэтапной сборкой и поднимем приложение вместе с базой через docker-compose. Приносите свой проект или возьмите шаблон.',
    requirements: 'Установленный Docker Desktop, базовые знания терминала.',
    format: ONLINE,
    meetingUrl: meet('51870426631590'),
    level: INTERMEDIATE,
    day: 2,
    time: [19, 0],
    durationMinutes: 120,
    capacity: 15,
    price: 0,
    status: WorkshopStatus.PUBLISHED,
    skills: ['docker', 'git'],
    program: [
      ['Образы, контейнеры и слои', 25],
      ['Пишем Dockerfile', 35],
      ['docker-compose: приложение и база', 40],
      ['Частые ошибки и вопросы', 20],
    ],
    confirmed: 8,
    demo: { status: 'CONFIRMED' },
  },
  {
    mentor: 'kravtsova',
    title: 'UX-исследование: как брать интервью у пользователей',
    shortDescription: 'Составляем гайд интервью и проводим первое исследование прямо на воркшопе.',
    description:
      'Научимся формулировать открытые вопросы, не подсказывать ответы и превращать заметки в инсайты. Участники в парах проведут интервью о студенческой столовой и соберут карту болей.',
    requirements: 'Блокнот или ноутбук. Опыт в дизайне не обязателен.',
    format: OFFLINE,
    location: room.coworking,
    level: BEGINNER,
    day: 4,
    time: [17, 30],
    durationMinutes: 150,
    capacity: 10,
    price: 0,
    status: WorkshopStatus.PUBLISHED,
    skills: ['ux-research', 'figma'],
    program: [
      ['Зачем исследовать до макетов', 20],
      ['Пишем гайд интервью', 40],
      ['Практика в парах', 50],
      ['Синтез: карта болей', 40],
    ],
    confirmed: 10,
    waitlisted: 2,
    demo: { status: 'WAITLISTED', position: 2 },
  },
  {
    mentor: 'belousov',
    title: 'TypeScript для тех, кто уже знает JavaScript',
    shortDescription: 'Типизируем реальный React-компонент и учимся читать ошибки компилятора.',
    description:
      'Разберём базовые типы, интерфейсы, дженерики и сужение типов. На практике переведём небольшое React-приложение с JavaScript на TypeScript и посмотрим, сколько багов найдёт компилятор.',
    requirements: 'Уверенный JavaScript, Node.js 20+.',
    format: ONLINE,
    meetingUrl: meet('63029174458806'),
    level: INTERMEDIATE,
    day: 6,
    time: [19, 0],
    durationMinutes: 120,
    capacity: 25,
    price: 350,
    status: WorkshopStatus.PUBLISHED,
    skills: ['typescript', 'react'],
    program: [
      ['Зачем типы и как работает tsc', 20],
      ['Интерфейсы, union и сужение', 35],
      ['Дженерики на примерах', 35],
      ['Миграция компонента на TS', 30],
    ],
    confirmed: 14,
    cancelled: 2,
  },
  {
    mentor: 'shestakov',
    title: 'SQL: от SELECT до оконных функций',
    shortDescription: 'Решаем задачи на базе студенческой библиотеки — от простых выборок до рейтингов.',
    description:
      'Пошагово пройдём JOIN, GROUP BY, подзапросы и оконные функции на учебной базе библиотеки. Каждая тема — с задачей, которую решаем сами, а потом разбираем вместе.',
    requirements: 'Ноутбук с браузером — работаем в онлайн-песочнице.',
    format: ONLINE,
    meetingUrl: meet('39554180027713'),
    level: BEGINNER,
    day: 8,
    time: [18, 30],
    durationMinutes: 150,
    capacity: 20,
    price: 0,
    status: WorkshopStatus.PUBLISHED,
    skills: ['sql', 'python'],
    program: [
      ['SELECT, WHERE, ORDER BY', 25],
      ['JOIN: соединяем таблицы', 40],
      ['GROUP BY и агрегаты', 40],
      ['Оконные функции: рейтинги', 45],
    ],
    confirmed: 11,
  },
  {
    mentor: 'li',
    title: 'Японский: хирагана за один вечер',
    shortDescription: 'Выучим 46 знаков хираганы с помощью мнемоник и напишем своё имя по-японски.',
    description:
      'Хирагана — первая японская азбука. Разберём каждый ряд с мнемоническими картинками, потренируем написание кисточкой и прочитаем первые слова. После воркшопа — набор карточек для повторения.',
    format: OFFLINE,
    location: room.linguaClub,
    level: BEGINNER,
    day: 3,
    time: [17, 0],
    durationMinutes: 120,
    capacity: 12,
    price: 0,
    status: WorkshopStatus.PUBLISHED,
    skills: ['japanese'],
    program: [
      ['Как устроена японская письменность', 15],
      ['Ряды あ–な с мнемониками', 45],
      ['Ряды は–ん и практика письма', 45],
      ['Читаем первые слова', 15],
    ],
    confirmed: 7,
  },
  {
    mentor: 'vorobyov',
    title: 'Первое собеседование в IT: как пройти HR-скрининг',
    shortDescription: 'Разбираем резюме участников и репетируем ответы на частые вопросы рекрутера.',
    description:
      'Расскажу, что HR смотрит в резюме за 30 секунд, какие вопросы задаёт на скрининге и как говорить о проектах без опыта работы. Во второй части — пробные интервью в парах с разбором.',
    requirements: 'Резюме в PDF (можно черновик).',
    format: ONLINE,
    meetingUrl: meet('80416693215472'),
    level: BEGINNER,
    day: 5,
    time: [18, 0],
    durationMinutes: 90,
    capacity: 40,
    price: 0,
    status: WorkshopStatus.PUBLISHED,
    skills: ['job-interview', 'public-speaking'],
    program: [
      ['Как читают резюме', 25],
      ['Топ-10 вопросов на скрининге', 25],
      ['Пробные интервью в парах', 40],
    ],
    confirmed: 23,
  },
  {
    mentor: 'medvedeva',
    title: 'Постановка голоса: дыхание и опора',
    shortDescription: 'Упражнения, которые помогут петь и говорить громче без напряжения связок.',
    description:
      'Практическое занятие о диафрагмальном дыхании, опоре и резонаторах. Подойдёт не только тем, кто поёт, но и тем, кто много выступает. Каждый получит разбор своего голоса.',
    format: OFFLINE,
    location: room.music,
    level: BEGINNER,
    day: 9,
    time: [16, 30],
    durationMinutes: 90,
    capacity: 8,
    price: 400,
    status: WorkshopStatus.PUBLISHED,
    skills: ['vocal', 'public-speaking'],
    program: [
      ['Как работает голосовой аппарат', 15],
      ['Дыхание и опора', 30],
      ['Распевки и резонаторы', 30],
      ['Индивидуальный разбор', 15],
    ],
    confirmed: 4,
  },
  {
    mentor: 'kim',
    title: 'Рамен с нуля: бульон, тарэ и яйцо аджитама',
    shortDescription: 'Готовим сёю-рамен и разбираем, из чего складывается вкус настоящего бульона.',
    description:
      'Бульон заранее томится шесть часов, а на воркшопе мы приготовим тарэ, маринованное яйцо и соберём миску рамена. Продукты включены в стоимость. Есть вегетарианский вариант — укажите при записи.',
    requirements: 'Фартук. Сообщите об аллергиях в комментарии к записи.',
    format: OFFLINE,
    location: room.kitchen,
    level: BEGINNER,
    day: 11,
    time: [13, 0],
    durationMinutes: 150,
    capacity: 8,
    price: 600,
    status: WorkshopStatus.PUBLISHED,
    skills: ['asian-cuisine'],
    program: [
      ['Из чего состоит рамен', 20],
      ['Тарэ и ароматное масло', 40],
      ['Яйцо аджитама и топпинги', 40],
      ['Сборка и дегустация', 50],
    ],
    confirmed: 5,
  },
  {
    mentor: 'galiev',
    title: 'Git без боли: ветки, merge и rebase',
    shortDescription: 'Разбираемся с ветками, конфликтами и историей коммитов на живом репозитории.',
    description:
      'Поймём, как Git хранит историю, научимся работать в ветках, решать конфликты и делать аккуратные pull request. Отдельно — когда использовать rebase и как не потерять чужие коммиты.',
    requirements: 'Установленный Git и аккаунт на GitHub.',
    format: ONLINE,
    meetingUrl: meet('27741830064951'),
    level: BEGINNER,
    day: 13,
    time: [19, 0],
    durationMinutes: 120,
    capacity: 30,
    price: 0,
    status: WorkshopStatus.PUBLISHED,
    skills: ['git'],
    program: [
      ['Как устроены коммиты и ветки', 25],
      ['Merge и конфликты', 35],
      ['Rebase и интерактивная история', 35],
      ['Pull request и code review', 25],
    ],
    confirmed: 6,
  },
  {
    mentor: 'ogneva',
    title: 'Английский для IT: читаем документацию без переводчика',
    shortDescription: 'Разбираем структуру технической документации и 150 самых частых терминов.',
    description:
      'Читаем реальные фрагменты документации React, Docker и PostgreSQL. Разберём типичные конструкции, ложных друзей переводчика и научимся быстро находить нужное в длинных текстах.',
    format: ONLINE,
    meetingUrl: meet('15928837406112'),
    level: INTERMEDIATE,
    day: 15,
    time: [18, 0],
    durationMinutes: 90,
    capacity: 15,
    price: 250,
    status: WorkshopStatus.PUBLISHED,
    skills: ['english', 'typescript'],
    program: [
      ['Как устроена документация', 20],
      ['Частые конструкции и термины', 35],
      ['Практика: ищем ответ в доках', 35],
    ],
    confirmed: 3,
  },
  {
    mentor: 'vorobyov',
    title: 'Выступление за пять минут: структура и подача',
    shortDescription: 'Готовим короткую речь по формуле «проблема — решение — призыв» и выступаем перед группой.',
    description:
      'Научимся строить короткие выступления для защит проектов и питчей: структура, работа с голосом и паузами, ответы на вопросы. Каждый выступит дважды и получит разбор.',
    format: OFFLINE,
    location: room.hall,
    level: BEGINNER,
    day: 18,
    time: [17, 0],
    durationMinutes: 120,
    capacity: 20,
    price: 0,
    status: WorkshopStatus.PUBLISHED,
    skills: ['public-speaking'],
    program: [
      ['Структура короткой речи', 25],
      ['Голос, паузы, жесты', 25],
      ['Выступления и разбор', 60],
      ['Как отвечать на вопросы', 10],
    ],
    confirmed: 2,
  },
  {
    mentor: 'kim',
    title: 'Альтернативный кофе: воронка V60 и аэропресс',
    shortDescription: 'Завариваем кофе тремя способами и учимся слышать разницу во вкусе.',
    description:
      'Разберём, как помол, температура и время влияют на вкус. Сравним три сорта зерна, заварим в V60 и аэропрессе и проведём каппинг. Зерно и оборудование предоставляются.',
    format: OFFLINE,
    location: room.kitchen,
    level: BEGINNER,
    day: 20,
    time: [11, 0],
    durationMinutes: 120,
    capacity: 10,
    price: 300,
    status: WorkshopStatus.PUBLISHED,
    skills: ['coffee'],
    program: [
      ['Зерно, обжарка и помол', 25],
      ['Пуровер в V60', 35],
      ['Аэропресс: классика и инверсия', 35],
      ['Каппинг', 25],
    ],
    confirmed: 0,
  },

  // ───────────── на модерации, черновик, отклонён, отменён ─────────────
  {
    mentor: 'kravtsova',
    title: 'Рисуем стикерпак для Telegram',
    shortDescription: 'Придумываем персонажа и рисуем пять векторных стикеров с эмоциями.',
    description:
      'От идеи персонажа до экспорта стикеров в формате для Telegram. Разберём построение простых форм, работу с кривыми и цветом. Рисовать умеете не обязательно.',
    requirements: 'Ноутбук с Figma или Illustrator, мышь.',
    format: OFFLINE,
    location: room.gukDesign,
    level: BEGINNER,
    day: 25,
    time: [16, 0],
    durationMinutes: 180,
    capacity: 10,
    price: 0,
    status: WorkshopStatus.PENDING_REVIEW,
    skills: ['illustration', 'figma'],
    program: [
      ['Персонаж из простых форм', 40],
      ['Кривые и цвет', 50],
      ['Пять эмоций', 60],
      ['Экспорт и загрузка в Telegram', 30],
    ],
  },
  {
    mentor: 'zaitsev',
    title: 'Fingerstyle: мелодия и аккомпанемент одновременно',
    shortDescription: 'Разбираем перебор и играем первую fingerstyle-аранжировку.',
    description:
      'Продолжение воркшопа для начинающих: освоим независимость пальцев, базовые переборы и сыграем простую аранжировку, где мелодия и бас звучат вместе.',
    requirements: 'Своя акустическая гитара, знание базовых аккордов.',
    format: OFFLINE,
    location: room.music,
    level: INTERMEDIATE,
    day: 22,
    time: [18, 0],
    durationMinutes: 120,
    capacity: 8,
    price: 250,
    status: WorkshopStatus.PENDING_REVIEW,
    skills: ['guitar'],
    program: [
      ['Постановка правой руки', 25],
      ['Переборы и независимость пальцев', 45],
      ['Разбор аранжировки', 50],
    ],
  },
  {
    mentor: 'galiev',
    title: 'NestJS: REST API за вечер',
    shortDescription: 'Пишем API для списка задач с валидацией и Swagger.',
    description:
      'Черновик: модули, контроллеры, сервисы, DTO и валидация. Подключим PostgreSQL через Prisma и сгенерируем документацию Swagger.',
    format: ONLINE,
    level: INTERMEDIATE,
    day: 30,
    time: [19, 0],
    durationMinutes: 150,
    capacity: 20,
    price: 0,
    status: WorkshopStatus.DRAFT,
    skills: ['nestjs', 'typescript'],
    program: [
      ['Архитектура Nest', 30],
      ['CRUD и DTO', 60],
      ['Prisma и Swagger', 60],
    ],
  },
  {
    mentor: 'zaitsev',
    title: 'Сведение первого трека в Ableton',
    shortDescription: 'Балансируем громкость, эквализируем и добавляем эффекты.',
    description: 'Разберём базовые приёмы сведения на примере демо-трека.',
    format: OFFLINE,
    location: room.music,
    level: INTERMEDIATE,
    day: 16,
    time: [18, 0],
    durationMinutes: 120,
    capacity: 6,
    price: 300,
    status: WorkshopStatus.REJECTED,
    rejectionReason:
      'Не указаны требования к оборудованию и программному обеспечению. Добавьте их и подробнее опишите программу, затем отправьте воркшоп повторно.',
    skills: ['mixing'],
    program: [
      ['Баланс и панорама', 40],
      ['Эквалайзер и компрессия', 50],
      ['Эффекты пространства', 30],
    ],
  },
  {
    mentor: 'vorobyov',
    title: 'Тайм-менеджмент для сессии',
    shortDescription: 'Планируем подготовку к экзаменам так, чтобы не учить всё в последнюю ночь.',
    description:
      'Разберём технику помидора, матрицу Эйзенхауэра и составим реальный план подготовки к сессии на две недели.',
    format: ONLINE,
    meetingUrl: meet('94402516378830'),
    level: BEGINNER,
    day: 1,
    time: [18, 0],
    durationMinutes: 90,
    capacity: 30,
    price: 0,
    status: WorkshopStatus.CANCELLED,
    skills: ['time-management'],
    program: [
      ['Почему мы откладываем', 20],
      ['Техники планирования', 35],
      ['Собираем план на сессию', 35],
    ],
    confirmed: 6,
    demo: { status: 'CANCELLED' },
  },
];
