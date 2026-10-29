"use client"

import { useRef, useState, type FormEvent } from "react"

import { Button, Input, PasswordInput } from "@devint_ai/ui"

import { AuthSwitchLink, registerHref, resetRequestHref } from "@/components/auth/auth-switch-link"
import { emailError } from "../register/register-rules"

/** Адрес API из окружения. Пароль базы сюда не входит. */
const apiUrl = process.env.NEXT_PUBLIC_API_URL

/** Самая длинная длина пароля. Как на сервере. */
const passwordMaxLength = 128

/** Пустая строка или текст ошибки пароля. Короткий пароль сервер проверит сам. */
function loginPasswordError(value: string) {
  if (value.length === 0) {
    return "Введите пароль"
  }

  if (value.length > passwordMaxLength) {
    return "Проверьте введённые данные"
  }

  return ""
}

/** Форма входа. Пароль не пишется в консоль и не остаётся в адресе. */
function LoginForm({
  email,
  onEmailChange,
}: {
  email: string
  onEmailChange: (value: string) => void
}) {
  /** Пароль. */
  const [password, setPassword] = useState("")
  /** Ошибка почты. */
  const [emailMessage, setEmailMessage] = useState("")
  /** Ошибка пароля. */
  const [passwordMessage, setPasswordMessage] = useState("")
  /** Ошибка под кнопкой. */
  const [formMessage, setFormMessage] = useState("")
  /** Сервер принял вход. Отдельной страницы кабинета нет. */
  const [signedIn, setSignedIn] = useState(false)
  /** Идёт отправка. Второй клик её не повторяет. */
  const [pending, setPending] = useState(false)
  /** Замок на тот же миг, когда состояние ещё не успело обновиться. */
  const pendingLock = useRef(false)

  /** Проверяет поля и, если они годны, отправляет вход. */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pendingLock.current) {
      return
    }

    /** Ошибка почты. */
    const nextEmailMessage = emailError(email)
    /** Ошибка пароля до запроса. */
    const nextPasswordMessage = loginPasswordError(password)
    /** Длинный пароль показываем под кнопкой, пустой — под полем. */
    const passwordTooLong = nextPasswordMessage === "Проверьте введённые данные"

    setEmailMessage(nextEmailMessage)
    setPasswordMessage(passwordTooLong ? "" : nextPasswordMessage)
    setFormMessage(passwordTooLong ? nextPasswordMessage : "")

    if (nextEmailMessage || nextPasswordMessage) {
      return
    }

    if (!apiUrl) {
      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
      return
    }

    pendingLock.current = true
    setPending(true)

    try {
      /** Ответ входа. Тело ошибки в консоль не пишется. */
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      if (response.status === 200) {
        setPassword("")

        try {
          /** Сессия после входа. Один запрос, без повтора. */
          const session = await fetch(`${apiUrl}/auth/me`, { credentials: "include" })

          if (session.status === 200) {
            setSignedIn(true)
            return
          }

          if (session.status === 401) {
            setFormMessage(
              "Вход не завершён: браузер не сохранил сессию. Разрешите файлы cookie для этого сайта и попробуйте ещё раз",
            )
            return
          }

          setFormMessage("Не удалось подтвердить вход. Попробуйте ещё раз")
        } catch {
          setFormMessage("Не удалось подтвердить вход. Попробуйте ещё раз")
        }

        return
      }

      /** Код ошибки. Сам пароль из ответа не читается. */
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      /** Короткий код сервера. */
      const code = payload?.error

      if (response.status === 401 && code === "invalid_credentials") {
        setFormMessage("Неверная почта или пароль")
        return
      }

      if (response.status === 403 && code === "email_not_verified") {
        setFormMessage("Сначала подтвердите почту по ссылке из письма")
        return
      }

      if (response.status === 429) {
        setFormMessage("Слишком много попыток. Попробуйте позже")
        return
      }

      setFormMessage("Проверьте введённые данные")
    } catch {
      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
    } finally {
      pendingLock.current = false
      setPending(false)
    }
  }

  if (signedIn) {
    return (
      <>
        <h1 className="auth-title">Вход</h1>
        <p className="auth-note">Вход выполнен</p>
        <p className="auth-login">
          Нет аккаунта? <AuthSwitchLink href={registerHref}>Регистрация</AuthSwitchLink>
        </p>
      </>
    )
  }

  return (
    <form className="auth-form" method="post" action="/login" noValidate onSubmit={onSubmit}>
      <h1 className="auth-title">Вход</h1>
      <div className="auth-fields">
        <div>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Электронная почта"
            aria-label="Электронная почта"
            aria-invalid={emailMessage.length > 0}
            aria-describedby={emailMessage ? "login-email-note" : undefined}
            value={email}
            onChange={(event) => {
              onEmailChange(event.target.value)
              setEmailMessage("")
            }}
          />
          {emailMessage ? (
            <p id="login-email-note" className="auth-field-error">
              {emailMessage}
            </p>
          ) : null}
        </div>
        <div>
          <PasswordInput
            name="password"
            autoComplete="current-password"
            placeholder="Пароль"
            aria-label="Пароль"
            aria-invalid={passwordMessage.length > 0}
            aria-describedby={passwordMessage ? "login-password-note" : undefined}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setPasswordMessage("")
            }}
          />
          {passwordMessage ? (
            <p id="login-password-note" className="auth-field-error">
              {passwordMessage}
            </p>
          ) : null}
        </div>
      </div>
      <AuthSwitchLink className="auth-forgot" href={resetRequestHref}>
        Забыли пароль?
      </AuthSwitchLink>
      {formMessage ? <p className="auth-form-error">{formMessage}</p> : null}
      <Button className="auth-submit" type="submit" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
      </Button>
      <p className="auth-login">
        Нет аккаунта? <AuthSwitchLink href={registerHref}>Регистрация</AuthSwitchLink>
      </p>
    </form>
  )
}

export { LoginForm }
