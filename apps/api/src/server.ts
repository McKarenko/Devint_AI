import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import Fastify, { type FastifyError, type FastifyInstance } from "fastify"

import { type ApiConfig } from "./config.js"
import { registerAuthRoutes } from "./routes/auth.js"
import { registerHealthRoute } from "./routes/health.js"

/** Сколько байт можно прислать в одном запросе: 100 КБ. */
const maxBodyBytes = 100 * 1024

/** Сколько миллисекунд запрос может висеть, пока сервер его не оборвёт. */
const requestTimeoutMs = 30000

/** Сколько запросов в минуту можно с одного адреса. */
const maxRequestsPerMinute = 100

/** Окно лимита запросов. */
const rateLimitWindow = "1 minute"

/** Короткое тело ответа клиенту. Без стека и без текста исключения. */
type ApiErrorBody = {
  error: string
}

/** Собирает приложение и возвращает его. Слушать порт здесь нельзя. */
async function buildApiApp(config: ApiConfig): Promise<FastifyInstance> {
  /** Приложение Fastify. trustProxy не включаем: это появится вместе с Nginx. */
  const app = Fastify({
    bodyLimit: maxBodyBytes,
    requestTimeout: requestTimeoutMs,
    ajv: {
      customOptions: {
        /** Строку "true" и число 1 не превращать в галочку. */
        coerceTypes: false,
        /** Лишнее поле отклоняется, а не выбрасывается молча. */
        removeAdditional: false,
        /** Пропущенное поле не заполнять значением из схемы. */
        useDefaults: false,
        /** Не собирать все ошибки сразу: это лишняя работа на каждом запросе. */
        allErrors: false,
      },
    },
    logger: {
      redact: ["req.headers.authorization", "req.headers.cookie", "req.body", 'res.headers["set-cookie"]'],
      serializers: {
        req(request: { method: string; url: string; id: string }) {
          return {
            method: request.method,
            url: request.url.split("?")[0] ?? request.url,
            id: request.id,
          }
        },
      },
    },
  })

  await app.register(helmet)

  await app.register(rateLimit, {
    max: maxRequestsPerMinute,
    timeWindow: rateLimitWindow,
    errorResponseBuilder: () => {
      return { statusCode: 429, error: "too_many_requests" }
    },
  })

  app.addHook("onRequest", async (request, reply) => {
    /** Заголовок Origin. У POST, PUT и остальных изменений он обязателен. */
    const origin = request.headers.origin

    /** GET, HEAD и OPTIONS можно без Origin. Чужой Origin всё равно закрыт. */
    const isSafeMethod = request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS"

    if (!isSafeMethod && origin !== config.webOrigin) {
      return reply.code(403).send({ error: "forbidden" } satisfies ApiErrorBody)
    }

    if (isSafeMethod && origin !== undefined && origin !== config.webOrigin) {
      return reply.code(403).send({ error: "forbidden" } satisfies ApiErrorBody)
    }
  })

  app.addHook("onSend", async (request, reply, payload) => {
    reply.removeHeader("Server")
    reply.removeHeader("X-Powered-By")

    /** Ответы входа и регистрации не класть в кэш браузера. */
    const path = request.url.split("?")[0] ?? request.url

    if (path === "/auth" || path.startsWith("/auth/")) {
      reply.header("Cache-Control", "no-store")
    }

    return payload
  })

  await app.register(cookie)

  await app.register(cors, {
    origin: config.webOrigin,
    credentials: true,
  })

  registerHealthRoute(app)
  registerAuthRoutes(app, config.webOrigin, config.nodeEnv, config.loginThrottleSecret)

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({ error: "not_found" } satisfies ApiErrorBody)
  })

  app.setErrorHandler((error: FastifyError, request, reply) => {
    /** Код ответа. Неизвестный сбой всегда 500. */
    const statusCode = error.statusCode ?? 500

    if (error.code === "FST_ERR_VALIDATION") {
      request.log.error("validation_failed")
      return reply.code(400).send({ error: "validation_failed" } satisfies ApiErrorBody)
    }

    request.log.error(error)

    return reply.code(statusCode).send(safeErrorBody(statusCode))
  })

  return app
}

/** Короткий код ошибки для клиента. Текст исключения сюда не попадает. */
function safeErrorBody(statusCode: number): ApiErrorBody {
  if (statusCode === 404) {
    return { error: "not_found" }
  }

  if (statusCode === 403) {
    return { error: "forbidden" }
  }

  if (statusCode === 413) {
    return { error: "payload_too_large" }
  }

  if (statusCode === 429) {
    return { error: "too_many_requests" }
  }

  if (statusCode >= 400 && statusCode < 500) {
    return { error: "bad_request" }
  }

  return { error: "internal" }
}

export { buildApiApp }
