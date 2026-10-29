import type { ReactNode } from "react"

import { SiteShell } from "@/components/site-shell"
import { offerText, privacyText } from "@/lib/legal"

/** Страницы вне входа: содержимое сверху, подвал снизу. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <SiteShell offer={offerText} privacy={privacyText} showFooter />
    </div>
  )
}
