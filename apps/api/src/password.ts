import { randomBytes } from "node:crypto"

import { hash, verify } from "@node-rs/argon2"

/** Память хеша: 64 МиБ. Ниже OWASP не опускаемся, на сервере 8 ГБ это ещё спокойно. */
const memoryCostKibibytes = 65536

/** Число проходов. Минимум OWASP — 2, берём 3. */
const timeCost = 3

/** Один поток. Так память не умножается на число потоков. */
const parallelism = 1

/** Argon2id. Число из библиотеки: const enum нельзя импортировать при isolatedModules. */
const argon2id = 2

/** Не больше стольких хешей одновременно. Запас потоков Node задаётся при запуске: UV_THREADPOOL_SIZE=8. */
const maxActiveHashes = 4

/** Сколько случайных байт у пароля, из которого делается фиктивный хеш. */
const dummyPasswordBytes = 32

/** Если ожидающих уже больше этого числа, новый запрос не встаёт в очередь. */
const maxWaitingHashes = 50

/** Сколько хешей считается прямо сейчас. */
let activeHashes = 0

/** Сколько запросов ждут свободный слот. */
let waitingHashes = 0

/** Очередь тех, кто ждёт слот. Каждый элемент будит одного ожидающего. */
const hashWaiters: Array<() => void> = []

/** Фиктивный хеш. Считается один раз при старте, чтобы время входа не выдавало почту. */
let dummyPasswordHash = ""

/** Очередь хешей переполнена. Маршрут отвечает 429, не 500. */
class HashQueueFullError extends Error {
  constructor() {
    super("очередь хешей переполнена")
    this.name = "HashQueueFullError"
  }
}

/** Занимает слот или ждёт, пока один освободится. */
function acquireHashSlot() {
  if (activeHashes < maxActiveHashes) {
    activeHashes += 1
    return Promise.resolve()
  }

  if (waitingHashes > maxWaitingHashes) {
    return Promise.reject(new HashQueueFullError())
  }

  waitingHashes += 1

  return new Promise<void>((resolve) => {
    hashWaiters.push(resolve)
  })
}

/** Отдаёт слот следующему в очереди. Если очереди нет, слот просто освобождается. */
function releaseHashSlot() {
  /** Следующий ожидающий. Его будим в этой же функции, без паузы. */
  const nextWaiter = hashWaiters.shift()

  if (nextWaiter) {
    waitingHashes -= 1
    nextWaiter()
    return
  }

  activeHashes -= 1
}

/** Считает хеш argon2id. Пароль в результат не попадает. */
async function hashPassword(password: string) {
  await acquireHashSlot()

  try {
    return await hash(password, {
      algorithm: argon2id,
      memoryCost: memoryCostKibibytes,
      timeCost,
      parallelism,
    })
  } finally {
    releaseHashSlot()
  }
}

/** Проверяет пароль по хешу. Та же очередь, что у hashPassword. */
async function verifyPassword(password: string, passwordHash: string) {
  await acquireHashSlot()

  try {
    return await verify(passwordHash, password)
  } finally {
    releaseHashSlot()
  }
}

/** Считает фиктивный хеш один раз. В лог уходит только время, не сам хеш. */
async function prepareDummyPasswordHash() {
  /** Начало расчёта. */
  const startedAt = Date.now()

  dummyPasswordHash = await hashPassword(randomBytes(dummyPasswordBytes).toString("base64url"))

  return Date.now() - startedAt
}

/** Фиктивный хеш для входа, когда почты или хеша нет. */
function readDummyPasswordHash() {
  if (dummyPasswordHash.length === 0) {
    throw new Error("фиктивный хеш пароля не подготовлен")
  }

  return dummyPasswordHash
}

export { HashQueueFullError, hashPassword, prepareDummyPasswordHash, readDummyPasswordHash, verifyPassword }
