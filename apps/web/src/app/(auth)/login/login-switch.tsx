"use client"

import { useState } from "react"

import { AuthCard } from "@/components/auth/auth-card"

import { LoginForm } from "./login-form"
import { ResetRequestForm } from "./reset-request-form"

/** Вход и запрос сброса. Почта живёт здесь, выше key карточки. */
function LoginSwitch({ resetRequested }: { resetRequested: boolean }) {
  /** Почта, которую человек уже ввёл. Смена карточки её не стирает. */
  const [email, setEmail] = useState("")

  return (
    <AuthCard key={resetRequested ? "reset" : "login"}>
      {resetRequested ? (
        <ResetRequestForm email={email} onEmailChange={setEmail} />
      ) : (
        <LoginForm email={email} onEmailChange={setEmail} />
      )}
    </AuthCard>
  )
}

export { LoginSwitch }
