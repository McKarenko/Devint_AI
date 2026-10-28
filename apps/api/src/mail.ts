import { createHash, randomBytes } from "node:crypto"

/** Сколько байт случайности в токене. В base64url это длиннее 20 символов. */
const tokenByteLength = 32

/** Тема письма со ссылкой подтверждения. */
const verifySubject = "Подтверждение почты"

/** Тема письма, если адрес уже подтверждён. */
const alreadyRegisteredSubject = "Вы уже зарегистрированы"

/** Тема письма со ссылкой сброса пароля. */
const resetPasswordSubject = "Сброс пароля"

/** Тема письма о том, что пароль уже сменён. */
const passwordChangedSubject = "Пароль изменён"

/** Токен и его хеш. В базу и в логи попадает только хеш. */
type EmailToken = {
  token: string
  tokenHash: string
}

/** Готовое письмо: тема и текст. Адрес передаётся отдельно. */
type MailLetter = {
  subject: string
  text: string
}

/** Случайный токен и sha256 в hex. */
function createEmailToken(): EmailToken {
  /** Сам токен для ссылки. В базе его не храним. */
  const token = randomBytes(tokenByteLength).toString("base64url")

  return { token, tokenHash: hashEmailToken(token) }
}

/** Хеш токена из письма. Сам токен в результат не входит. */
function hashEmailToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

/** Письмо со ссылкой. Токен только во фрагменте после #. */
function verifyEmailLetter(webOrigin: string, token: string): MailLetter {
  /** Ссылка. Страницы пока нет, её делает пункт 6.7. */
  const link = `${webOrigin}/verify-email#token=${token}`

  return {
    subject: verifySubject,
    text: `Подтвердите почту. Ссылка действует 24 часа:\n${link}\n\nЕсли вы не регистрировались, ничего не делайте.`,
  }
}

/** Письмо для уже подтверждённого адреса. Пароля здесь нет. */
function alreadyRegisteredLetter(webOrigin: string): MailLetter {
  return {
    subject: alreadyRegisteredSubject,
    text: `Вы уже зарегистрированы.\nВход: ${webOrigin}/login\nСброс пароля: ${webOrigin}/password-reset\n\nЕсли это были не вы, ничего не делайте.`,
  }
}

/** Письмо со ссылкой сброса. Токен только во фрагменте после #. Страницы ещё нет. */
function resetPasswordLetter(webOrigin: string, token: string): MailLetter {
  /** Ссылка. Страницу делает пункт 6.8. */
  const link = `${webOrigin}/password-reset#token=${token}`

  return {
    subject: resetPasswordSubject,
    text: `Сброс пароля. Ссылка действует 1 час:\n${link}\n\nЕсли вы не запрашивали сброс, ничего не делайте, пароль останется прежним.`,
  }
}

/** Письмо после смены пароля. Токена в ссылке нет. */
function passwordChangedLetter(webOrigin: string): MailLetter {
  return {
    subject: passwordChangedSubject,
    text: `Пароль изменён. Если это были не вы, сразу запросите сброс пароля заново.\n${webOrigin}/password-reset`,
  }
}

/** Печатает письмо в терминал. В production и в режиме disabled ничего не делает. */
async function sendMail(to: string, subject: string, text: string) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  /** Режим из окружения. Пустое значение совпадает с config: печать в терминал. */
  const mailMode = process.env.MAIL_MODE === undefined ? "console" : process.env.MAIL_MODE.trim()

  if (mailMode !== "console") {
    return
  }

  console.log(`----- письмо -----\nКому: ${to}\nТема: ${subject}\n${text}\n----- конец письма -----`)
}

export {
  alreadyRegisteredLetter,
  createEmailToken,
  hashEmailToken,
  passwordChangedLetter,
  resetPasswordLetter,
  sendMail,
  verifyEmailLetter,
}
