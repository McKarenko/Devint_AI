import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Папка со списками рядом с исходниками API. */
const dataDirectory = join(dirname(fileURLToPath(import.meta.url)), "../data")

/** Чужой список самых частых паролей. */
const commonPasswordsFile = "common-passwords.txt"

/** Свой список русских сочетаний. */
const extraPasswordsFile = "extra-common-passwords.txt"

/** Латинские клавиши в порядке русской раскладки ЙЦУКЕН. */
const latinKeys = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`"

/** Русские буквы на тех же клавишах. */
const cyrillicKeys = "йцукенгшщзхъфывапролджэячсмитьбюё"

/** Цифры, алфавит и ряды клавиатуры, прямые и обратные. */
const simpleSequences = [
  "01234567890",
  "09876543210",
  "abcdefghijklmnopqrstuvwxyz",
  "zyxwvutsrqponmlkjihgfedcba",
  "qwertyuiop",
  "poiuytrewq",
  "asdfghjkl",
  "lkjhgfdsa",
  "zxcvbnm",
  "mnbvcxz",
  "йцукенгшщзхъ",
  "ъхзщшгнекуцй",
  "фывапролджэ",
  "эждлорпавыф",
  "ячсмитьбю",
  "юбьтимсчя",
]

/** Самая короткая последовательность, которую ещё считаем простой. */
const shortestSequence = 4

/** Короче этой основы хвост уже не с чем сравнивать. */
const shortestPasswordStem = 4

/** Короче этой локальной части почты совпадение внутри пароля не проверяем. */
const shortestLocalPart = 4

/** Похожие символы, которые подменяют буквы в частых паролях. */
const lookalikeCharacters = "013457@$"

/** Буквы, которыми заменяются похожие символы. Порядок совпадает с картой выше. */
const lookalikeLetters = "oieastas"

/** Загруженные пароли. Пустое значение значит, что старт ещё не читал файлы. */
let commonPasswords: Set<string> | undefined

/** Читает оба списка в память. Пустой или пропавший файл не пускает сервер. */
function loadPasswordLists() {
  /** Начало чтения. */
  const startedAt = performance.now()

  /** Общее множество. Одинаковые строки из двух файлов схлопываются. */
  const passwords = new Set<string>()

  /** Байты текста. У строки в JavaScript два байта на символ. */
  let bytes = 0

  for (const fileName of [commonPasswordsFile, extraPasswordsFile]) {
    /** Строки одного файла. */
    const lines = readPasswordFile(fileName)

    for (const line of lines) {
      passwords.add(line)
      bytes += line.length * 2
    }
  }

  commonPasswords = passwords

  return {
    loadMs: Math.round(performance.now() - startedAt),
    bytes,
    count: passwords.size,
  }
}

/** Читает один список. Пустые строки выбрасывает. */
function readPasswordFile(fileName: string) {
  /** Полный путь. В ошибку попадает только имя файла. */
  const filePath = join(dataDirectory, fileName)

  /** Текст файла. */
  let text: string

  try {
    text = readFileSync(filePath, "utf8")
  } catch {
    throw new Error(`не найден список ${fileName}`)
  }

  /** Строки без пустоты и в нижнем регистре. */
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    throw new Error(`список ${fileName} пуст`)
  }

  return lines
}

/** Причина отказа или пустая строка, если пароль можно принять. */
function rejectPassword(password: string, email: string, dateOfBirth: string) {
  if (commonPasswords === undefined) {
    throw new Error("списки паролей ещё не загружены")
  }

  /** Пароль в нижнем регистре. */
  const lowered = password.toLowerCase()

  /** Те же символы, если человек печатал в другой раскладке. */
  const forms = uniqueForms(lowered)

  for (const form of forms) {
    if (isListedPassword(form)) {
      return "частый пароль"
    }

    if (isRepeatedCharacter(form)) {
      return "один символ"
    }

    if (isSimpleSequence(form)) {
      return "последовательность"
    }
  }

  /** Почта и её часть до @. */
  const loweredEmail = email.toLowerCase()
  /** Часть адреса до собаки. */
  const localPart = loweredEmail.split("@")[0] ?? ""

  /** Три записи даты рождения. */
  const birthForms = birthDateForms(dateOfBirth)

  for (const form of forms) {
    if (form.length > 0 && (form === loweredEmail || form === localPart)) {
      return "совпадает с почтой"
    }

    if (localPart.length >= shortestLocalPart && form.includes(localPart)) {
      return "содержит почту"
    }

    if (birthForms.includes(form)) {
      return "совпадает с датой рождения"
    }

    if (birthForms.some((birthForm) => form.includes(birthForm))) {
      return "содержит дату рождения"
    }
  }

  return ""
}

/** Пароль или его основа без хвоста есть в списках, в том числе после замены похожих символов. */
function isListedPassword(form: string) {
  if (commonPasswords === undefined) {
    return false
  }

  if (commonPasswords.has(form) || commonPasswords.has(applyLookalikes(form))) {
    return true
  }

  /** Основа без цифр и знаков на конце. */
  const stem = stripTrailingNonLetters(form)

  if (stem.length < shortestPasswordStem) {
    return false
  }

  return commonPasswords.has(stem) || commonPasswords.has(applyLookalikes(stem))
}

/** Срезает с конца всё, что не буква. */
function stripTrailingNonLetters(value: string) {
  return value.replace(/\P{L}+$/u, "")
}

/** Заменяет похожие символы буквами. Остальные символы не трогает. */
function applyLookalikes(value: string) {
  /** Результат замены. */
  let replaced = ""

  for (const character of value) {
    /** Позиция в карте похожих символов. Минус один значит, что замены нет. */
    const keyIndex = lookalikeCharacters.indexOf(character)
    replaced += keyIndex === -1 ? character : lookalikeLetters[keyIndex]
  }

  return replaced
}

/** Исходный пароль и обе замены раскладки, без повторов. */
function uniqueForms(lowered: string) {
  return [...new Set([lowered, swapLayout(lowered, latinKeys, cyrillicKeys), swapLayout(lowered, cyrillicKeys, latinKeys)])]
}

/** Меняет символы одной раскладки на другую. Незнакомые оставляет. */
function swapLayout(value: string, fromKeys: string, toKeys: string) {
  /** Результат замены. */
  let swapped = ""

  for (const character of value) {
    /** Позиция клавиши. Минус один значит, что такой клавиши в карте нет. */
    const keyIndex = fromKeys.indexOf(character)
    swapped += keyIndex === -1 ? character : toKeys[keyIndex]
  }

  return swapped
}

/** Все символы строки одинаковые. */
function isRepeatedCharacter(value: string) {
  if (value.length < 2) {
    return false
  }

  /** Первый символ. С ним сравниваются остальные. */
  const firstCharacter = value[0]

  for (const character of value) {
    if (character !== firstCharacter) {
      return false
    }
  }

  return true
}

/** Строка целиком лежит на одном простом ряду. */
function isSimpleSequence(value: string) {
  if (value.length < shortestSequence) {
    return false
  }

  for (const sequence of simpleSequences) {
    if (sequence.includes(value)) {
      return true
    }
  }

  return false
}

/** Дата ГГГГ-ММ-ДД в трёх видах. Чужой формат даёт пустой список. */
function birthDateForms(dateOfBirth: string) {
  /** Год, месяц и день. */
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth)

  if (!match) {
    return []
  }

  /** Год. */
  const year = match[1]
  /** Месяц. */
  const month = match[2]
  /** День. */
  const day = match[3]

  return [`${day}${month}${year}`, `${year}${month}${day}`, `${day}.${month}.${year}`]
}

export { loadPasswordLists, rejectPassword }
