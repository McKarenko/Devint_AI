"use client"

import { useEffect, useState } from "react"

import { Button } from "@devint_ai/ui"

import { LegalDialog } from "./legal-dialog"

import "./site-shell.css"

/** Ключ выбора в браузере. На сервер не уходит. */
const cookieNoticeKey = "devint_cookie_notice"

/** Версия текста уведомления. Другое число покажет плашку снова. */
const cookieNoticeVersion = "1"

/** Подвал и плашка про cookie. На страницах входа подвал можно скрыть. */
function SiteShell({
  offer,
  privacy,
  showFooter,
}: {
  offer: string
  privacy: string
  showFooter: boolean
}) {
  /** Страница уже в браузере. До этого плашку не рисуем, чтобы она не мигала. */
  const [ready, setReady] = useState(false)

  /** Плашка видна. */
  const [noticeVisible, setNoticeVisible] = useState(false)

  /** Окно оферты. */
  const [offerOpen, setOfferOpen] = useState(false)

  /** Окно политики. Его открывают и плашка, и подвал. */
  const [privacyOpen, setPrivacyOpen] = useState(false)

  useEffect(() => {
    setNoticeVisible(readCookieNotice() !== cookieNoticeVersion)
    setReady(true)
  }, [])

  /** Пишет версию и убирает плашку. Если браузер не дал записать, прячет до перезагрузки. */
  function acceptNotice() {
    try {
      window.localStorage.setItem(cookieNoticeKey, cookieNoticeVersion)
    } catch {
      setNoticeVisible(false)
      return
    }

    setNoticeVisible(false)
  }

  return (
    <>
      {ready && noticeVisible ? (
        <div className="cookie-notice">
          <p className="cookie-notice-text">
            Мы используем только необходимые cookie для работы входа. Подробнее в{" "}
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="cookie-notice-link text-[var(--color-link)] underline hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0 font-[inherit]"
            >
              политике конфиденциальности
            </button>
          </p>
          <Button type="button" onClick={acceptNotice}>
            Понятно
          </Button>
        </div>
      ) : null}
      {showFooter ? (
        <footer className="site-footer">
          <button type="button" className="cookie-notice-link" onClick={() => setOfferOpen(true)}>
            Оферта
          </button>
          {" · "}
          <button type="button" className="cookie-notice-link" onClick={() => setPrivacyOpen(true)}>
            Политика конфиденциальности
          </button>
        </footer>
      ) : null}
      {showFooter && ready && noticeVisible ? <div className="cookie-notice-spacer" aria-hidden="true" /> : null}
      <LegalDialog title="Договор оферты" content={offer} open={offerOpen} onClose={() => setOfferOpen(false)} />
      <LegalDialog
        title="Политика конфиденциальности"
        content={privacy}
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
    </>
  )
}

/** Версия из браузера или пустая строка, если хранилище недоступно. */
function readCookieNotice() {
  try {
    return window.localStorage.getItem(cookieNoticeKey) ?? ""
  } catch {
    return ""
  }
}

export { SiteShell }
