import type { ReactNode } from "react"

import { SiteShell } from "@/components/site-shell"
import { WorkspaceHeader } from "@/components/workspace/workspace-header"
import { offerText, privacyText } from "@/lib/legal"

/** Рабочий экран: шапка сверху, подвала нет. Плашка cookie та же, что на входе. */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="workspace-screen">
      <WorkspaceHeader />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <SiteShell offer={offerText} privacy={privacyText} showFooter={false} />
    </div>
  )
}
