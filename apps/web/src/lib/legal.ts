import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

/** Папка черновиков. Рядом с сайтом в разработке и в корне при сборке Docker. */
function legalDirectory() {
  /** Путь, когда команда запущена из apps/web. */
  const fromWebApp = join(process.cwd(), "../../docs/legal")

  if (existsSync(fromWebApp)) {
    return fromWebApp
  }

  return join(process.cwd(), "docs/legal")
}

/** Папка документов на этот запуск процесса. */
const legalDir = legalDirectory()

/** Читает черновик документа один раз при загрузке модуля. */
function readLegal(fileName: string) {
  return readFileSync(join(legalDir, fileName), "utf8")
}

/** Черновик оферты. На каждый запрос файл заново не открывается. */
const offerText = readLegal("offer-draft-1.md")

/** Черновик политики. На каждый запрос файл заново не открывается. */
const privacyText = readLegal("privacy-draft-1.md")

export { offerText, privacyText }
