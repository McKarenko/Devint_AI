"use client"

import { useLayoutEffect, useRef, useState, type FormEvent } from "react"

import { Button } from "@devint_ai/ui"

import { AuthSwitchLink, loginHref, registerHref } from "@/components/auth/auth-switch-link"

/** Адрес API из окружения. Пароль базы сюда не входит. */
const apiUrl = process.env.NEXT_PUBLIC_API_URL

/** Какая карточка сейчас на сцене. */
type VerifyOutcome = "ready" | "missing" | "done" | "stale"

/** Токен из фрагмента #token=. Фрагмент сразу убирается из адреса. */
function readLinkToken() {
  /** Фрагмент без решётки. */
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
  /** Токен письма. В адрес после чтения он не возвращается. */
  const token = (new URLSearchParams(hash).get("token") ?? "").trim()
  /** Адрес без фрагмента. Токен в нём не остаётся. */
  const nextUrl = `${window.location.pathname}${window.location.search}`

  window.history.replaceState(window.history.state, "", nextUrl)
  return token
}

/** Подтверждение почты. Само при открытии ссылки запрос не уходит. */
function VerifyEmailForm() {
  /** Токен письма. В консоль и в адрес не пишется. */
  const [token, setToken] = useState("")
  /** Готовая карточка, пустая ссылка, успех или старая ссылка. */
  const [outcome, setOutcome] = useState<VerifyOutcome>("ready")
  /** Ошибка под кнопкой. */
  const [formMessage, setFormMessage] = useState("")
  /** Идёт отправка. Второй клик её не повторяет. */
  const [pending, setPending] = useState(false)
  /** Замок на тот же миг, когда состояние ещё не успело обновиться. */
  const pendingLock = useRef(false)
  /** Токен уже снят с адреса. Повторный запуск эффекта не считает ссылку пустой. */
  const consumed = useRef(false)

  useLayoutEffect(() => {
    /** Берёт токен из фрагмента. Повторная ссылка в той же вкладке приходит как hashchange. */
    function takeToken() {
      if (!window.location.hash.includes("token=")) {
        if (!consumed.current) {
          setToken("")
          setOutcome("missing")
        }
        return
      }

      /** Токен, который был в ссылке. Пустая строка — ссылка без него. */
      const nextToken = readLinkToken()
      consumed.current = true
      setToken(nextToken)
      setOutcome(nextToken ? "ready" : "missing")
      setFormMessage("")
      setPending(false)
      pendingLock.current = false
    }

    takeToken()
    window.addEventListener("hashchange", takeToken)
    return () => window.removeEventListener("hashchange", takeToken)
  }, [])

  /** Просит сервер подтвердить почту. Повторно сам не вызывает. */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pendingLock.current || !token) {
      return
    }

    if (!apiUrl) {
      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
      return
    }

    pendingLock.current = true
    setPending(true)
    setFormMessage("")

    try {
      /** Ответ подтверждения. Текст сервера на экран не выводим. */
      const response = await fetch(`${apiUrl}/auth/verify-email`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (response.status === 200) {
        setOutcome("done")
        return
      }

      /** Код ошибки. Сам токен из ответа не читается. */
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (response.status === 400 && payload?.error === "invalid_token") {
        setOutcome("stale")
        return
      }

      if (response.status === 429) {
        setFormMessage("Слишком много попыток. Попробуйте позже")
        return
      }

      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
    } catch {
      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
    } finally {
      pendingLock.current = false
      setPending(false)
    }
  }

  if (outcome === "missing") {
    return (
      <>
        <h1 className="auth-title">Ссылка неполная</h1>
        <p className="auth-note">
          Откройте ссылку из письма целиком. Если письмо не пришло, зарегистрируйтесь заново.
        </p>
        <p className="auth-login">
          <AuthSwitchLink href={registerHref}>Регистрация</AuthSwitchLink>
        </p>
      </>
    )
  }

  if (outcome === "done") {
    return (
      <>
        <h1 className="auth-title">Почта подтверждена</h1>
        <p className="auth-note">Теперь можно войти.</p>
        <p className="auth-login">
          <AuthSwitchLink href={loginHref}>Войти</AuthSwitchLink>
        </p>
      </>
    )
  }

  if (outcome === "stale") {
    return (
      <>
        <h1 className="auth-title">Ссылка устарела</h1>
        <p className="auth-note">
          Ссылка действует 24 часа и только один раз. Зарегистрируйтесь заново, мы отправим новое письмо.
        </p>
        <p className="auth-login">
          <AuthSwitchLink href={registerHref}>Регистрация</AuthSwitchLink>
        </p>
      </>
    )
  }

  return (
    <form className="auth-form" method="post" action="/verify-email" noValidate onSubmit={onSubmit}>
      <h1 className="auth-title">Подтверждение почты</h1>
      <p className="auth-note">Нажмите кнопку, чтобы подтвердить адрес.</p>
      {formMessage ? <p className="auth-form-error">{formMessage}</p> : null}
      <Button className="auth-submit" type="submit" disabled={pending}>
        {pending ? "Подтверждаем…" : "Подтвердить почту"}
      </Button>
    </form>
  )
}

export { VerifyEmailForm }
