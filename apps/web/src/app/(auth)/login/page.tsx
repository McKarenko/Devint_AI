import { AuthCard } from "@/components/auth/auth-card"

import { LoginForm } from "./login-form"
import { ResetRequestForm } from "./reset-request-form"

/** Страница входа. Запрос сброса — та же страница, другой текст карточки. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  /** Флаг адреса. Секрета в нём нет. */
  const query = await searchParams
  /** Сейчас открыт запрос ссылки, а не форма входа. */
  const resetRequested = query.reset === "1"

  return (
    <AuthCard key={resetRequested ? "reset" : "login"}>
      {resetRequested ? <ResetRequestForm /> : <LoginForm />}
    </AuthCard>
  )
}
