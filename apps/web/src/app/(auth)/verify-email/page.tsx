import { AuthCard } from "@/components/auth/auth-card"

import { VerifyEmailForm } from "./verify-email-form"

/** Страница подтверждения почты. Та же карточка, что у входа. */
export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <VerifyEmailForm />
    </AuthCard>
  )
}
