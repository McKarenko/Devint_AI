import { Suspense, type ReactNode } from "react"

import { AuthShell } from "@/components/auth/auth-shell"
import { AuthStage } from "@/components/auth/auth-stage"
import { SiteShell } from "@/components/site-shell"
import { offerText, privacyText } from "@/lib/legal"

/** Общий экран входа и регистрации. Логотип не пересоздаётся при смене адреса. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthShell>
        <Suspense fallback={<div className="auth-stage">{children}</div>}>
          <AuthStage>{children}</AuthStage>
        </Suspense>
      </AuthShell>
      <SiteShell offer={offerText} privacy={privacyText} showFooter={false} />
    </>
  )
}
