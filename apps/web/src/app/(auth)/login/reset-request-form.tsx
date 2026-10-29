"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"

import { Button, Input } from "@devint_ai/ui"

import { AuthSwitchLink, loginHref } from "@/components/auth/auth-switch-link"
import { emailError } from "../register/register-rules"

/** Адрес API из окружения. Пароль базы сюда не входит. */
const apiUrl = process.env.NEXT_PUBLIC_API_URL

/** Запрос ссылки на сброс. Не говорит, есть ли такой адрес. */
function ResetRequestForm() {
  /** Почта. */
  const [email, setEmail] = useState("")
  /** Ошибка почты. */
  const [emailMessage, setEmailMessage] = useState("")
  /** Ошибка под кнопкой. */
  const [formMessage, setFormMessage] = useState("")
  /** Сервер принял запрос. Отдельной страницы нет. */
  const [sent, setSent] = useState(false)
  /** Идёт отправка. Второй клик её не повторяет. */
  const [pending, setPending] = useState(false)
  /** Замок на тот же миг, когда состояние ещё не успело обновиться. */
  const pendingLock = useRef(false)
  /** Карточка после отправки. С неё ставим фокус на возврат. */
  const sentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sent) {
      return
    }

    /** Ссылка возврата. Поля на этом шаге уже нет. */
    const link = sentRef.current?.querySelector("a")
    if (link instanceof HTMLElement) {
      link.focus()
    }
  }, [sent])

  /** Проверяет почту и, если она годна, просит ссылку. */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pendingLock.current) {
      return
    }

    /** Ошибка почты до запроса. */
    const nextEmailMessage = emailError(email)
    setEmailMessage(nextEmailMessage)
    setFormMessage("")

    if (nextEmailMessage) {
      return
    }

    if (!apiUrl) {
      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
      return
    }

    pendingLock.current = true
    setPending(true)

    try {
      /** Ответ запроса. Текст сервера на экран не выводим. */
      const response = await fetch(`${apiUrl}/auth/password-reset/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      if (response.status === 200) {
        setSent(true)
        return
      }

      if (response.status === 429) {
        setFormMessage("Слишком много попыток. Попробуйте позже")
        return
      }

      if (response.status === 400) {
        setFormMessage("Проверьте введённые данные")
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

  if (sent) {
    return (
      <div ref={sentRef}>
        <h1 className="auth-title">Проверьте почту</h1>
        <p className="auth-note">
          Если для этого адреса существует аккаунт, мы отправили ссылку для восстановления пароля.
        </p>
        <p className="auth-login">
          <AuthSwitchLink href={loginHref}>Вернуться ко входу</AuthSwitchLink>
        </p>
      </div>
    )
  }

  return (
    <form className="auth-form" method="post" action="/login?reset=1" noValidate onSubmit={onSubmit}>
      <h1 className="auth-title">Восстановление пароля</h1>
      <p className="auth-note">Введите электронную почту, указанную при регистрации.</p>
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
            aria-describedby={emailMessage ? "reset-email-note" : undefined}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailMessage("")
            }}
          />
          {emailMessage ? (
            <p id="reset-email-note" className="auth-field-error">
              {emailMessage}
            </p>
          ) : null}
        </div>
      </div>
      {formMessage ? <p className="auth-form-error">{formMessage}</p> : null}
      <Button className="auth-submit" type="submit" disabled={pending}>
        {pending ? "Отправляем…" : "Отправить ссылку"}
      </Button>
      <p className="auth-login">
        <AuthSwitchLink href={loginHref}>← Вернуться ко входу</AuthSwitchLink>
      </p>
    </form>
  )
}

export { ResetRequestForm }
