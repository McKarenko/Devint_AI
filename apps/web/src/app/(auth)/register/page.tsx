import { AuthCard } from "@/components/auth/auth-card"
import { offerText, privacyText } from "@/lib/legal"

import { RegisterForm } from "./register-form"

/** Страница регистрации. Тексты документов уже прочитаны. */
export default function RegisterPage() {
  return (
    <AuthCard>
      <RegisterForm offerText={offerText} privacyText={privacyText} />
    </AuthCard>
  )
}
