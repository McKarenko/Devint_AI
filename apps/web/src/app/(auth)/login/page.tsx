import { LoginSwitch } from "./login-switch"

/** Страница входа. Запрос сброса — та же страница, другой текст карточки. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  /** Флаг адреса. Секрета в нём нет. */
  const query = await searchParams
  /** Сейчас открыт запрос ссылки, а не форма входа. */
  const resetRequested = query.reset === "1"

  return <LoginSwitch resetRequested={resetRequested} />
}
