#!/usr/bin/env bash
# Пробы разбора секретов. В файл попадают только вымышленные значения.
set -euo pipefail

# Корень репозитория: скрипт лежит в scripts/.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Проверяемый разбор. Тот же, что перед записью отчёта.
SCAN="$ROOT/scripts/handoff.sh"
# Временные строки проб. После прогона каталог удаляется.
WORK="$(mktemp -d "${TMPDIR:-/tmp}/handoff-secret-tests.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

# Остановка без печати значения. Третий аргумент — само значение, его не должно быть в ответе.
expect_secret() {
  local name="$1"
  local body="$2"
  local hidden="$3"
  printf '%s\n' "$body" > "$WORK/case.txt"
  if "$SCAN" --scan-file "$WORK/case.txt" >"$WORK/out" 2>"$WORK/err"; then
    echo "ПРОВАЛ: $name должен был остановить разбор" >&2
    exit 1
  fi
  if ! grep -q "Значение скрыто" "$WORK/err"; then
    echo "ПРОВАЛ: $name не назвал шаблон" >&2
    exit 1
  fi
  if grep -F -q -- "$hidden" "$WORK/err" || grep -F -q -- "$hidden" "$WORK/out"; then
    echo "ПРОВАЛ: $name показал значение" >&2
    exit 1
  fi
  echo "ОК: $name остановил разбор"
}

# Строка без секрета. Разбор должен завершиться нулём.
expect_clean() {
  local name="$1"
  local body="$2"
  printf '%s\n' "$body" > "$WORK/case.txt"
  if ! "$SCAN" --scan-file "$WORK/case.txt" >"$WORK/out" 2>"$WORK/err"; then
    echo "ПРОВАЛ: $name остановил безопасный текст" >&2
    exit 1
  fi
  if grep -q "Значение скрыто" "$WORK/err"; then
    echo "ПРОВАЛ: $name назвал секрет в безопасном тексте" >&2
    exit 1
  fi
  echo "ОК: $name пропустил текст"
}

expect_secret "POSTGRES_PASSWORD" "POSTGRES_PASSWORD=supersecretvalue" "supersecretvalue"
expect_secret "TOKEN" "TOKEN=shorttoken" "shorttoken"
expect_secret "API_TOKEN" "API_TOKEN=apitokensecret" "apitokensecret"
expect_secret "двойные кавычки" 'API_TOKEN="quotedsecret"' "quotedsecret"
expect_secret "одинарные кавычки" "TOKEN='singlesecret'" "singlesecret"
expect_secret "префикс diff" "+POSTGRES_PASSWORD=diffsecret" "diffsecret"
expect_secret "пробел вокруг равно" "POSTGRES_PASSWORD = gapone" "gapone"
expect_secret "несколько пробелов" "POSTGRES_PASSWORD    =    gaptwo" "gaptwo"
expect_secret "кавычки и пробел" 'API_TOKEN = "gapthree"' "gapthree"
expect_secret "export и пробел" "export POSTGRES_PASSWORD = gapfour" "gapfour"
expect_secret "строчный password" "password=lowersecret" "lowersecret"
expect_secret "строчный token" "token=lowersecret" "lowersecret"
expect_secret "SECRET" "SECRET=plainsecret" "plainsecret"
expect_secret "PASSWORD" "PASSWORD=plainsecret" "plainsecret"
expect_secret "SERVICE_KEY" "SERVICE_KEY=plainkey" "plainkey"
expect_secret "пароль в адресе" "DATABASE_URL=postgresql://devint:realdbpass@127.0.0.1:5432/devint" "realdbpass"

expect_clean "заглушка пароля" "POSTGRES_PASSWORD=ЗАМЕНИ_НА_СЛУЧАЙНЫЙ_ПАРОЛЬ"
expect_clean "заглушка секрета" "LOGIN_THROTTLE_SECRET=ЗАМЕНИ_НА_СЛУЧАЙНУЮ_СТРОКУ_НЕ_КОРОЧЕ_32"
expect_clean "заглушка адреса" "DATABASE_URL=postgresql://devint:ЗАМЕНИ_НА_СЛУЧАЙНЫЙ_ПАРОЛЬ@127.0.0.1:5432/devint"
expect_clean "diff заглушки" "+POSTGRES_PASSWORD=ЗАМЕНИ_НА_СЛУЧАЙНЫЙ_ПАРОЛЬ"
expect_clean "обычный текст" "Пароль хранится только в виде хеша. Токен в ответ не отдаётся."

echo "Все пробы прошли"
