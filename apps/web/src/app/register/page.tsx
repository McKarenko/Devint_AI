import { readFileSync } from "node:fs"
import { join } from "node:path"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "./register-form"

/** Читает черновик документа. Папка лежит в корне репозитория. */
function readLegal(fileName: string) {
  return readFileSync(join(process.cwd(), "../../docs/legal", fileName), "utf8")
}

/** Страница регистрации. Тексты документов читаются на сервере. */
export default function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm offerText={readLegal("offer-draft-1.md")} privacyText={readLegal("privacy-draft-1.md")} />
    </AuthShell>
  )
}
