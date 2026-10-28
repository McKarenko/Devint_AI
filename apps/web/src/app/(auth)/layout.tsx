import type { ReactNode } from "react"

import { AuthShell } from "@/components/auth/auth-shell"
import { AuthStage } from "@/components/auth/auth-stage"

/** Общий экран входа и регистрации. Логотип не пересоздаётся при смене адреса. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell>
      <AuthStage>{children}</AuthStage>
    </AuthShell>
  )
}
