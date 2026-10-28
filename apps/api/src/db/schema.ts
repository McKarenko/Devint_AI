import { sql } from "drizzle-orm"
import { check, date, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

/** Пользователи. Пароль лежит отдельно, в password_credentials. */
const users = pgTable(
  "users",
  {
    /** Идентификатор. Его создаёт сама база. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Почта в нижнем регистре. */
    email: text("email").notNull(),
    /** Дата рождения, календарный день без времени. */
    dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
    /** Когда почта подтверждена. Пустое значит, что ссылку ещё не открывали. */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    /** Когда строка создана. */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Когда строка последний раз изменена. */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
    check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
  ],
)

/** Хеш пароля. Одна строка на пользователя. */
const passwordCredentials = pgTable("password_credentials", {
  /** Тот же идентификатор, что у пользователя. */
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Хеш argon2id. Самого пароля здесь нет. */
  passwordHash: text("password_hash").notNull(),
  /** Когда хеш записан. */
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /** Когда хеш последний раз изменён. */
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/** Принятые документы. Новая версия добавляет новую строку. */
const legalAcceptances = pgTable(
  "legal_acceptances",
  {
    /** Идентификатор записи. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Кто принял документ. */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Вид документа: возраст, оферта или согласие на данные. */
    documentType: text("document_type").notNull(),
    /** Версия текста, которую приняли. */
    documentVersion: text("document_version").notNull(),
    /** Когда приняли. */
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "legal_acceptances_document_type",
      sql`${table.documentType} in ('age_confirmation', 'offer', 'personal_data_consent')`,
    ),
  ],
)

/** Одноразовый токен письма. В базе только хеш, не сам токен. */
const emailTokens = pgTable(
  "email_tokens",
  {
    /** Идентификатор токена. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Кому выдан токен. */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Зачем токен: подтверждение почты или сброс пароля. */
    purpose: text("purpose").notNull(),
    /** Хеш токена. Сама строка из письма сюда не пишется. */
    tokenHash: text("token_hash").notNull(),
    /** Когда токен перестаёт действовать. */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** Когда токеном воспользовались или его погасили. Пустое значит, что он ещё живой. */
    usedAt: timestamp("used_at", { withTimezone: true }),
    /** Когда токен создан. */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("email_tokens_token_hash_unique").on(table.tokenHash),
    index("email_tokens_user_id_idx").on(table.userId),
    check("email_tokens_purpose", sql`${table.purpose} in ('verify_email', 'reset_password')`),
  ],
)

/** Журнал писем. Нужен, чтобы не слать слишком часто. Текста письма здесь нет. */
const mailEvents = pgTable(
  "mail_events",
  {
    /** Идентификатор события. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Кому относилось письмо. */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Какое письмо: подтверждение, «уже зарегистрированы», сброс или смена пароля. */
    kind: text("kind").notNull(),
    /** Когда решили отправить письмо. */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("mail_events_user_id_created_at_idx").on(table.userId, table.createdAt),
    check(
      "mail_events_kind",
      sql`${table.kind} in ('verify_email', 'already_registered', 'reset_password', 'password_changed')`,
    ),
  ],
)

/** Сессия входа. В базе только хеш токена, без IP и данных браузера. */
const sessions = pgTable(
  "sessions",
  {
    /** Идентификатор сессии. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Чья сессия. Удаление пользователя забирает и её. */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** sha256 токена в hex. Сам токен сюда не пишется. */
    tokenHash: text("token_hash").notNull(),
    /** Когда человек вошёл. От этой точки считается потолок 90 дней. */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Когда сессией последний раз пользовались. */
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    /** Когда скользящий срок 30 дней кончится. */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** Когда сессия кончится окончательно, даже если ей пользуются. */
    absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true }).notNull(),
    /** Когда сессию отозвали. Пустое значит, что она ещё не отозвана. */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
)

/** Неудачные попытки входа. В базе только обезличенный ключ, без почты и адреса. */
const loginFailures = pgTable(
  "login_failures",
  {
    /** Идентификатор попытки. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Что считаем: связку, почту или адрес. */
    kind: text("kind").notNull(),
    /** HMAC ключа. Открытой почты и адреса здесь нет. */
    keyHash: text("key_hash").notNull(),
    /** Когда попытка не удалась. */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("login_failures_kind_key_hash_created_at_idx").on(table.kind, table.keyHash, table.createdAt),
    check("login_failures_kind", sql`${table.kind} in ('pair', 'email', 'ip')`),
  ],
)

/** Журнал входа для разбора инцидентов. Наружу не отдаётся. */
const authEvents = pgTable(
  "auth_events",
  {
    /** Идентификатор события. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Чей аккаунт. Пустое, если почта не найдена или пользователя удалили. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Что случилось. Почты, адреса и браузера здесь нет. */
    kind: text("kind").notNull(),
    /** Когда событие записано. */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("auth_events_user_id_created_at_idx").on(table.userId, table.createdAt),
    check(
      "auth_events_kind",
      sql`${table.kind} in ('login_success', 'login_failed', 'logout', 'password_reset_confirmed', 'session_revoked_all')`,
    ),
  ],
)

/** Связка, с которой уже входили. В базе только обезличенный ключ. */
const trustedPairs = pgTable("trusted_pairs", {
  /** HMAC почты и адреса. Открытых значений здесь нет. */
  keyHash: text("key_hash").primaryKey(),
  /** Когда связку увидели впервые. */
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /** Когда с этой связки последний раз входили. */
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
})

export {
  authEvents,
  emailTokens,
  legalAcceptances,
  loginFailures,
  mailEvents,
  passwordCredentials,
  sessions,
  trustedPairs,
  users,
}
