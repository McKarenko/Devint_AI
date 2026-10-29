"use client"

import { useRef, useState, type FormEvent, type MouseEvent } from "react"

import { Button, Checkbox, Dialog, DialogContent, Input, PasswordInput } from "@devint_ai/ui"

import { AuthSwitchLink } from "@/components/auth/auth-switch-link"
import { offerVersion, privacyVersion } from "@/legal-versions"
import { birthDateError, emailError, maskBirthDate, passwordLengthError, toIsoDate } from "./register-rules"

/** Тексты документов, которые прочитала серверная страница. */
type RegisterFormProps = {
  offerText: string
  privacyText: string
}

/** Адрес API из окружения. Пароль базы сюда не входит. */
const apiUrl = process.env.NEXT_PUBLIC_API_URL

/** Страница регистрации. Пароль не пишется в консоль и не остаётся в адресе. */
function RegisterForm({ offerText, privacyText }: RegisterFormProps) {
  /** Почта. */
  const [email, setEmail] = useState("")
  /** Пароль. */
  const [password, setPassword] = useState("")
  /** Дата в виде ДД.ММ.ГГГГ. */
  const [birthDate, setBirthDate] = useState("")
  /** Галочка 18 лет. */
  const [adult, setAdult] = useState(false)
  /** Галочка оферты. */
  const [offer, setOffer] = useState(false)
  /** Галочка политики. */
  const [privacy, setPrivacy] = useState(false)
  /** Ошибка почты. */
  const [emailMessage, setEmailMessage] = useState("")
  /** Ошибка пароля. */
  const [passwordMessage, setPasswordMessage] = useState("")
  /** Ошибка даты. */
  const [birthMessage, setBirthMessage] = useState("")
  /** Ошибка трёх галочек. */
  const [checksMessage, setChecksMessage] = useState("")
  /** Ошибка под кнопкой. */
  const [formMessage, setFormMessage] = useState("")
  /** Какое окно открыто. */
  const [dialog, setDialog] = useState<"offer" | "privacy" | "success" | null>(null)
  /** Идёт отправка. Второй клик её не повторяет. */
  const [pending, setPending] = useState(false)
  /** Замок на тот же миг, когда состояние ещё не успело обновиться. */
  const pendingLock = useRef(false)

  /** Ссылка документа не переключает галочку. */
  function openDocument(event: MouseEvent<HTMLButtonElement>, name: "offer" | "privacy") {
    event.preventDefault()
    event.stopPropagation()
    setDialog(name)
  }

  /** Убирает введённое после окна «Проверьте почту». */
  function clearForm() {
    setEmail("")
    setPassword("")
    setBirthDate("")
    setAdult(false)
    setOffer(false)
    setPrivacy(false)
    setEmailMessage("")
    setPasswordMessage("")
    setBirthMessage("")
    setChecksMessage("")
    setFormMessage("")
  }

  /** Проверяет поля и, если они годны, отправляет регистрацию. */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pendingLock.current) {
      return
    }

    /** Ошибка почты. */
    const nextEmailMessage = emailError(email)
    /** Ошибка длины пароля. */
    const nextPasswordMessage = passwordLengthError(password)
    /** Ошибка даты или возраста. */
    const nextBirthMessage = birthDateError(birthDate)
    /** Не все галочки стоят. */
    const nextChecksMessage = adult && offer && privacy ? "" : "Чтобы продолжить, подтвердите все три пункта"
    /** Длинный пароль показываем под кнопкой, короткий — под полем. */
    const passwordTooLong = nextPasswordMessage === "Проверьте введённые данные"

    setEmailMessage(nextEmailMessage)
    setPasswordMessage(passwordTooLong ? "" : nextPasswordMessage)
    setBirthMessage(nextBirthMessage)
    setChecksMessage(nextChecksMessage)
    setFormMessage(passwordTooLong ? nextPasswordMessage : "")

    if (nextEmailMessage || nextPasswordMessage || nextBirthMessage || nextChecksMessage) {
      return
    }

    if (!apiUrl) {
      setFormMessage("Не удалось связаться с сервером. Попробуйте ещё раз")
      return
    }

    pendingLock.current = true
    setPending(true)

    try {
      /** Ответ регистрации. */
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          dateOfBirth: toIsoDate(birthDate),
          confirmAdult: true,
          acceptOffer: true,
          acceptPersonalData: true,
          offerVersion,
          privacyVersion,
        }),
      })

      if (response.status === 201) {
        setDialog("success")
        return
      }

      /** Код ошибки. Тело больше нигде не печатается. */
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      /** Короткий код сервера. */
      const code = payload?.error

      if (response.status === 400 && code === "weak_password") {
        setPasswordMessage("Пароль слишком простой. Придумайте другой")
        return
      }

      if (response.status === 403 && code === "age_restriction") {
        setBirthMessage("Сервис доступен только с 18 лет")
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

  return (
    <>
      <form className="auth-form" method="post" action="/register" noValidate onSubmit={onSubmit}>
        <h1 className="auth-title">Регистрация</h1>
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
              aria-describedby={emailMessage ? "email-note" : undefined}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailMessage("")
              }}
            />
            {emailMessage ? (
              <p id="email-note" className="auth-field-error">
                {emailMessage}
              </p>
            ) : null}
          </div>
          <div>
            <PasswordInput
              name="password"
              autoComplete="new-password"
              placeholder="Пароль"
              aria-label="Пароль"
              aria-invalid={passwordMessage.length > 0}
              aria-describedby="password-note"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setPasswordMessage("")
              }}
            />
            <p id="password-note" className={passwordMessage ? "auth-field-error" : "auth-note"}>
              {passwordMessage || "Минимум 10 символов"}
            </p>
          </div>
          <div>
            <Input
              name="birthDate"
              inputMode="numeric"
              placeholder="Дата рождения"
              aria-label="Дата рождения"
              aria-invalid={birthMessage.length > 0}
              aria-describedby="birth-note"
              value={birthDate}
              onChange={(event) => {
                setBirthDate(maskBirthDate(event.target.value))
                setBirthMessage("")
              }}
            />
            <p id="birth-note" className={birthMessage ? "auth-field-error" : "auth-note"}>
              {birthMessage || "Формат: ДД.ММ.ГГГГ"}
            </p>
          </div>
          <div className="auth-checks">
            <Checkbox id="adult" checked={adult} onCheckedChange={setAdult}>
              Подтверждаю, что мне исполнилось 18 лет
            </Checkbox>
            <Checkbox id="offer" checked={offer} onCheckedChange={setOffer}>
              Я принимаю условия{" "}
              <button
                type="button"
                className="check-link"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => openDocument(event, "offer")}
              >
                договора оферты
              </button>
            </Checkbox>
            <Checkbox id="privacy" checked={privacy} onCheckedChange={setPrivacy}>
              Даю согласие на обработку персональных данных на условиях{" "}
              <button
                type="button"
                className="check-link"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => openDocument(event, "privacy")}
              >
                политики конфиденциальности
              </button>
            </Checkbox>
            {checksMessage ? <p className="auth-field-error">{checksMessage}</p> : null}
          </div>
        </div>
        {formMessage ? <p className="auth-form-error">{formMessage}</p> : null}
        <Button className="auth-submit" type="submit" disabled={pending}>
          {pending ? "Отправляем…" : "Зарегистрироваться"}
        </Button>
        <p className="auth-login">
          Уже есть аккаунт? <AuthSwitchLink href="/login">Войти</AuthSwitchLink>
        </p>
      </form>

      <Dialog open={dialog === "offer"} onOpenChange={(open) => setDialog(open ? "offer" : null)}>
        <DialogContent title="Договор оферты">
          <div className="dialog-body">{offerText}</div>
          <div className="dialog-actions">
            <Button
              type="button"
              onClick={() => {
                setOffer(true)
                setChecksMessage("")
                setDialog(null)
              }}
            >
              Соглашаюсь
            </Button>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "privacy"} onOpenChange={(open) => setDialog(open ? "privacy" : null)}>
        <DialogContent title="Политика конфиденциальности">
          <div className="dialog-body">{privacyText}</div>
          <div className="dialog-actions">
            <Button
              type="button"
              onClick={() => {
                setPrivacy(true)
                setChecksMessage("")
                setDialog(null)
              }}
            >
              Соглашаюсь
            </Button>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "success"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
            clearForm()
          }
        }}
      >
        <DialogContent title="Проверьте почту">
          <div className="dialog-body">
            Для продолжения регистрации подтвердите аккаунт по ссылке в письме. Если адрес можно использовать, мы
            отправили на него письмо.
          </div>
          <div className="dialog-actions">
            <Button
              type="button"
              onClick={() => {
                setDialog(null)
                clearForm()
              }}
            >
              Понятно
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { RegisterForm }
