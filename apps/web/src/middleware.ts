import { NextResponse, type NextRequest } from "next/server"

/** Свой одноразовый код для скриптов и стилей этого ответа. */
function createNonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64")
}

/** Origin API из публичного адреса. Путь и секрет сюда не входят. */
function readApiOrigin() {
  /** Адрес API, который Next уже отдал в браузер. */
  const rawUrl = process.env.NEXT_PUBLIC_API_URL

  if (!rawUrl) {
    return ""
  }

  try {
    return new URL(rawUrl).origin
  } catch {
    return ""
  }
}

/** Политика страницы. В разработке скриптам нужен eval для стека React. */
function contentSecurityPolicy(nonce: string) {
  /** Сейчас запущен next dev, не production-сборка. */
  const isDev = process.env.NODE_ENV === "development"
  /** Куда браузеру можно ходить за API, кроме самого сайта. */
  const apiOrigin = readApiOrigin()
  /** Скрипты только свои и с одноразовым кодом. */
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`
  /** Позиции ядра и наклон карточки пишутся атрибутом style. Тег style сюда не входит. */
  const styleAttr = "'unsafe-inline'"

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}'`,
    `style-src-attr ${styleAttr}`,
    "img-src 'self'",
    "font-src 'self'",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
  ].join("; ")
}

/** Ставит CSP на запрос, чтобы Next подписал свои скрипты, и на ответ браузеру. */
function middleware(request: NextRequest) {
  /** Код этой отрисовки. На другой запрос он уже другой. */
  const nonce = createNonce()
  /** Готовая политика без лишних пробелов. */
  const policy = contentSecurityPolicy(nonce)
  /** Заголовки, которые увидит отрисовка страницы. */
  const requestHeaders = new Headers(request.headers)

  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", policy)

  /** Ответ страницы. Статику этот обработчик не перехватывает. */
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  response.headers.set("Content-Security-Policy", policy)
  return response
}

/** Не трогаем файлы сборки: у них нет HTML и свой nonce не нужен. */
const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}

export { config, middleware }
