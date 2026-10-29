/** Самая ранняя дата рождения. Как на сервере. */
const earliestBirthDate = "1900-01-01"

/** С какого числа полных лет сервис пускает. */
const adultAgeYears = 18

/** Часовой пояс, в котором считается возраст. */
const moscowTimeZone = "Europe/Moscow"

/** Почта как на сервере: только ASCII, без пробелов. */
const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/

/** Самая короткая длина пароля. */
const passwordMinLength = 10

/** Самая длинная длина пароля. */
const passwordMaxLength = 128

/** Самая длинная почта. */
const emailMaxLength = 254

/** Оставляет только цифры и ставит точки: ДД.ММ.ГГГГ. */
function maskBirthDate(value: string) {
  /** Цифры, не больше восьми. */
  const digits = value.replace(/\D/g, "").slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

/** ДД.ММ.ГГГГ в ГГГГ-ММ-ДД. Пустая строка, если вид другой. */
function toIsoDate(masked: string) {
  /** День, месяц и год. */
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(masked)

  if (!match) {
    return ""
  }

  return `${match[3]}-${match[2]}-${match[1]}`
}

/** Сегодня в Москве, формат ГГГГ-ММ-ДД. */
function moscowToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: moscowTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/** День есть в календаре. */
function isRealCalendarDate(value: string) {
  /** Год, месяц и день. */
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  /** Год. */
  const year = Number(match[1])
  /** Месяц. */
  const month = Number(match[2])
  /** День. */
  const day = Number(match[3])
  /** Та же дата в UTC. Если день уехал, такой даты нет. */
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Дата допустима: существует, не раньше 1900 и не в будущем по Москве. */
function isAllowedBirthDate(value: string) {
  return isRealCalendarDate(value) && value >= earliestBirthDate && value <= moscowToday()
}

/** Полных лет на московский день. */
function fullYears(birthDate: string, today: string) {
  /** Разница годов. День рождения в этом году ещё может не наступить. */
  let years = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4))

  if (today.slice(5) < birthDate.slice(5)) {
    years -= 1
  }

  return years
}

/** Пустая строка или текст ошибки почты. */
function emailError(value: string) {
  /** Почта без краевых пробелов, как перед проверкой на сервере. */
  const email = value.trim().toLowerCase()

  if (email.length > emailMaxLength || !emailPattern.test(email)) {
    return "Введите корректный адрес электронной почты"
  }

  return ""
}

/** Пустая строка или текст ошибки пароля по длине. */
function passwordLengthError(value: string) {
  if (value.length < passwordMinLength) {
    return "Минимум 10 символов"
  }

  if (value.length > passwordMaxLength) {
    return "Проверьте введённые данные"
  }

  return ""
}

/** Пустая строка, ошибка формата или ошибка возраста. */
function birthDateError(masked: string) {
  /** Дата для сервера. */
  const isoDate = toIsoDate(masked)

  if (!isAllowedBirthDate(isoDate)) {
    return "Введите дату в формате ДД.ММ.ГГГГ"
  }

  if (fullYears(isoDate, moscowToday()) < adultAgeYears) {
    return "Сервис доступен только с 18 лет"
  }

  return ""
}

export { birthDateError, emailError, maskBirthDate, passwordLengthError, toIsoDate }
