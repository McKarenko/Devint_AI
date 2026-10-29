import { AuthCard } from "@/components/auth/auth-card"

import { PasswordResetForm } from "./password-reset-form"

/** Страница нового пароля. Та же карточка, что у входа. */
export default function PasswordResetPage() {
  return (
    <AuthCard>
      <PasswordResetForm />
    </AuthCard>
  )
}
