import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "./login-form"

/** Страница входа. Оболочка и логотип живут в общем layout. */
export default function LoginPage() {
  return (
    <AuthCard>
      <LoginForm />
    </AuthCard>
  )
}
