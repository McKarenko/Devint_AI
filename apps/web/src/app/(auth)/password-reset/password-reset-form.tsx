"use client"

import { useLayoutEffect, useRef, useState, type FormEvent } from "react"

import { Button, PasswordInput } from "@devint_ai/ui"

import { AuthSwitchLink, loginHref, resetRequestHref } from "@/components/auth/auth-switch-link"
import { passwordLengthError } from "../register/register-rules"

/** Адрес API из окружения. Пароль базы сюда не входит. */
const apiUrl = process.env.NEXT_PUBLIC_API_URL

/** Какая карточка сейчас на сцене. */
type ResetOutcome = "ready" | "missing" | "done" | "stale"

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

/** Новый пароль по ссылке из письма. Само при открытии запрос не уходит. */
function PasswordResetForm() {
  /** Токен письма. В консоль и в адрес не пишется. */
  const [token, setToken] = useState("")
  /** Новый пароль. После неуспеха стирается. */
  const [password, setPassword] = useState("")
  /** Ошибка длины пароля под полем. */
  const [passwordMessage, setPasswordMessage] = useState("")
  /** Готовая карточка, пустая ссылка, успех или старая ссылка. */
  const [outcome, setOutcome] = useState<ResetOutcome>("ready")
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
          setPassword("")
        }
        return
      }

      /** Токен, который был в ссылке. Пустая строка — ссылка без него. */
      const nextToken = readLinkToken()
      consumed.current = true
      setToken(nextToken)
      setOutcome(nextToken ? "ready" : "missing")
      setPassword("")
      setPasswordMessage("")
      setFormMessage("")
      setPending(false)
      pendingLock.current = false
    }

    takeToken()
    window.addEventListener("hashchange", takeToken)
    return () => window.removeEventListener("hashchange", takeToken)
  }, [])

  /** Проверяет длину и, если она годна, сохраняет новый пароль. */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pendingLock.current || !token) {
      return
    }

    /** Ошибка длины до запроса. Правила длины те же, что при регистрации. */
    const nextPasswordMessage = passwordLengthError(password)
    setPasswordMessage(nextPasswordMessage)
    setFormMessage("")

    if (nextPasswordMessage) {
      return
    }

    if (!apiUrl) {
      setPassword("")
      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
      return
    }

    pendingLock.current = true
    setPending(true)

    try {
      /** Ответ смены пароля. Текст сервера на экран не выводим. */
      const response = await fetch(`${apiUrl}/auth/password-reset/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      if (response.status === 200) {
        setPassword("")
        setOutcome("done")
        return
      }

      setPassword("")

      /** Код ошибки. Сам пароль из ответа не читается. */
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (response.status === 400 && payload?.error === "invalid_token") {
        setOutcome("stale")
        return
      }

      if (response.status === 400 && payload?.error === "weak_password") {
        setFormMessage("Пароль слишком простой. Не используйте почту, дату рождения и распространённые пароли")
        return
      }

      if (response.status === 429) {
        setFormMessage("Слишком много попыток. Попробуйте позже")
        return
      }

      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
    } catch {
      setPassword("")
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
        <p className="auth-note">Откройте ссылку из письма целиком или запросите новую.</p>
        <p className="auth-login">
          <AuthSwitchLink href={resetRequestHref}>Запросить ссылку заново</AuthSwitchLink>
        </p>
      </>
    )
  }

  if (outcome === "done") {
    return (
      <>
        <h1 className="auth-title">Пароль изменён</h1>
        <p className="auth-note">Вход на других устройствах сброшен. Войдите с новым паролем.</p>
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
        <p className="auth-note">Ссылка действует 1 час и только один раз. Запросите новую.</p>
        <p className="auth-login">
          <AuthSwitchLink href={resetRequestHref}>Запросить ссылку заново</AuthSwitchLink>
        </p>
      </>
    )
  }

  return (
    <form className="auth-form" method="post" action="/password-reset" noValidate onSubmit={onSubmit}>
      <h1 className="auth-title">Новый пароль</h1>
      <p className="auth-note">Придумайте новый пароль для входа.</p>
      <div className="auth-fields">
        <div>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="Новый пароль"
            aria-label="Новый пароль"
            aria-invalid={passwordMessage.length > 0}
            aria-describedby={passwordMessage ? "reset-password-note" : undefined}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setPasswordMessage("")
            }}
          />
          {passwordMessage ? (
            <p id="reset-password-note" className="auth-field-error">
              {passwordMessage}
            </p>
          ) : null}
        </div>
      </div>
      {formMessage ? <p className="auth-form-error">{formMessage}</p> : null}
      <Button className="auth-submit" type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить пароль"}
      </Button>
    </form>
  )
}

export { PasswordResetForm }
