#!/usr/bin/env bash
# Локальный отчёт для старшего агента. Секреты в файл не пишет.
set -euo pipefail

# Корень репозитория: скрипт лежит в scripts/.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Лимит полного diff в байтах (300 КБ).
MAX_DIFF=307200
# Итоговый отчёт. Появляется только после проверки.
FINAL="$ROOT/.ai/handoff.md"
# Временный текст и куски diff. Удаляются при выходе.
TMP="$(mktemp "${TMPDIR:-/tmp}/handoff.XXXXXX")"
DIFF_TMP="$(mktemp -d "${TMPDIR:-/tmp}/handoff-diff.XXXXXX")"
trap 'rm -f "$TMP"; rm -rf "$DIFF_TMP"' EXIT

# Флаг --checks запускает audit, lint и typecheck.
# --scan-file только разбирает готовый текст и отчёт не пишет.
RUN_CHECKS=0
SCAN_FILE=""
if [[ "${1:-}" == "--checks" ]]; then
  RUN_CHECKS=1
elif [[ "${1:-}" == "--scan-file" ]]; then
  if [[ $# -ne 2 || ! -f "${2:-}" ]]; then
    echo "Нужен путь к существующему файлу: --scan-file путь" >&2
    exit 2
  fi
  SCAN_FILE="$2"
elif [[ $# -gt 0 ]]; then
  echo "Неизвестный аргумент. Допустимы --checks и --scan-file." >&2
  exit 2
fi

export TZ=Europe/Moscow

# Имя файла — секрет, если это .env или .env.* кроме примера.
is_blocked_path() {
  local base
  base="$(basename "$1")"
  if [[ "$base" == ".env.example" ]]; then
    return 1
  fi
  if [[ "$base" == ".env" || "$base" == .env.* ]]; then
    return 0
  fi
  if [[ "$1" == ".ai/handoff.md" ]]; then
    return 0
  fi
  return 1
}

# Ключ, чьё значение из .env нельзя переносить в отчёт.
is_sensitive_key() {
  local key
  key="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  case "$key" in
    *password*|*secret*|*token*|*private*|*_key|database_url)
      return 0
      ;;
  esac
  return 1
}

# Один знак diff в начале строки. Секрет в добавленной строке тоже виден.
strip_one_diff_mark() {
  local line="$1"
  case "$line" in
    "+"*|"-"*|" "*)
      printf '%s' "${line:1}"
      ;;
    *)
      printf '%s' "$line"
      ;;
  esac
}

# Имя чувствительное, если оно само или кусок между _ — password, secret, token, key.
is_sensitive_assignment_name() {
  local lower segment old_ifs
  lower="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  old_ifs="$IFS"
  IFS=_
  # Разбор кусков имени. Позиционные параметры функции на скрипт не влияют.
  set -- $lower
  IFS="$old_ifs"
  for segment in "$@"; do
    case "$segment" in
      password|secret|token|key)
        return 0
        ;;
    esac
  done
  return 1
}

# Заглушка: всё значение или пароль внутри адреса начинается с ЗАМЕНИ_НА_.
is_placeholder_value() {
  local value password
  value="$1"
  if [[ "$value" == ЗАМЕНИ_НА_* ]]; then
    return 0
  fi
  if [[ "$value" =~ ://[^/@:]+:([^@]+)@ ]]; then
    password="${BASH_REMATCH[1]}"
    if [[ "$password" == ЗАМЕНИ_НА_* ]]; then
      return 0
    fi
  fi
  return 1
}

# Пароль внутри scheme://пользователь:пароль@хост. Пустое и заглушка — не секрет.
url_password_is_secret() {
  local value password
  value="$1"
  if [[ "$value" =~ ://[^/@:]+:([^@]+)@ ]]; then
    password="${BASH_REMATCH[1]}"
    if [[ -n "$password" && "$password" != ЗАМЕНИ_НА_* ]]; then
      return 0
    fi
  fi
  return 1
}

# Присваивание оболочки: export, имя, знак =, значение в кавычках или без.
assignment_has_secret() {
  local line name value
  line="$(strip_one_diff_mark "$1")"
  line="${line%$'\r'}"
  line="${line#"${line%%[![:space:]]*}"}"
  if [[ "$line" == export[[:space:]]* ]]; then
    line="${line#export}"
    line="${line#"${line%%[![:space:]]*}"}"
  fi
  if [[ ! "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    return 1
  fi
  name="${BASH_REMATCH[1]}"
  value="${BASH_REMATCH[2]}"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value#\"}"
    value="${value%\"}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value#\'}"
    value="${value%\'}"
  fi
  if is_sensitive_assignment_name "$name"; then
    if [[ -n "$value" ]] && ! is_placeholder_value "$value"; then
      return 0
    fi
  fi
  if url_password_is_secret "$value"; then
    return 0
  fi
  return 1
}

# Печать строки diff-статистики, кроме секретных путей.
filter_stat() {
  local line path
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" != *"|"* ]]; then
      printf '%s\n' "$line"
      continue
    fi
    path="${line%%|*}"
    path="${path#"${path%%[![:space:]]*}"}"
    path="${path%"${path##*[![:space:]]}"}"
    if is_blocked_path "$path"; then
      continue
    fi
    printf '%s\n' "$line"
  done
}

# Строка с шаблоном секрета. Значение в сообщение не попадает.
report_secret() {
  echo "Подозрительная строка $1: $2. Значение скрыто." >&2
  exit 1
}

# Разбор текста, который уйдёт старшему или передан в --scan-file.
scan_secret_file() {
  local file line line_no
  file="$1"
  line_no=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line_no=$((line_no + 1))
    if [[ "$line" == *"PRIVATE KEY"* && "$line" == *"BEGIN"* ]]; then
      report_secret "$line_no" "приватный ключ"
    fi
    if printf '%s\n' "$line" | grep -Eqi '(secret|key|token)[^"'"'"']{0,40}["'"'"'][A-Za-z0-9+/=_-]{32,}["'"'"']'; then
      report_secret "$line_no" "длинная случайная строка после secret, key или token"
    fi
    if assignment_has_secret "$line"; then
      report_secret "$line_no" "присваивание секрета"
    fi
  done < "$file"
}

if [[ -n "$SCAN_FILE" ]]; then
  scan_secret_file "$SCAN_FILE"
  exit 0
fi

# Точка отсчёта: хеш из .ai/last-reviewed или последние 20 коммитов.
FROM_COMMIT=""
LOG_MODE="range"
if [[ -f .ai/last-reviewed ]]; then
  while IFS= read -r line || [[ -n "${line:-}" ]]; do
    if [[ "$line" =~ ^[0-9a-fA-F]{7,40}$ ]]; then
      FROM_COMMIT="$(git rev-parse --verify "${line}^{commit}")"
      break
    fi
  done < .ai/last-reviewed
  if [[ -z "$FROM_COMMIT" ]]; then
    echo "В .ai/last-reviewed нет хеша коммита." >&2
    exit 1
  fi
else
  LOG_MODE="last20"
  oldest="$(git rev-list --max-count=20 HEAD | tail -n 1)"
  if git rev-parse --verify -q "${oldest}^" >/dev/null; then
    FROM_COMMIT="$(git rev-parse --verify "${oldest}^")"
  else
    FROM_COMMIT="$(git hash-object -t tree --stdin </dev/null)"
  fi
fi

{
  echo "# Сдача старшему агенту"
  echo
  echo "Дата: $(date "+%d.%m.%Y %H:%M")"
  echo

  echo "## Точка отсчёта"
  if [[ "$LOG_MODE" == "last20" ]]; then
    echo "Файла .ai/last-reviewed нет. Взяты последние 20 коммитов."
  else
    echo "Хеш: ${FROM_COMMIT}"
  fi
  echo

  echo "## Журнал коммитов"
  if [[ "$LOG_MODE" == "last20" ]]; then
    git log -n 20 --date=format-local:'%d.%m.%Y %H:%M' --pretty=format:'%h %an %ad %s'
    echo
  else
    log_text="$(git log "${FROM_COMMIT}..HEAD" --date=format-local:'%d.%m.%Y %H:%M' --pretty=format:'%h %an %ad %s')"
    if [[ -z "$log_text" ]]; then
      echo "Коммитов после этой точки нет."
    else
      printf '%s\n' "$log_text"
    fi
  fi
  echo

  echo "## Статистика diff"
  if [[ "$LOG_MODE" == "range" ]]; then
    git diff --stat "$FROM_COMMIT" HEAD > "$DIFF_TMP/stat.raw" || true
  else
    git diff --stat "$FROM_COMMIT" HEAD > "$DIFF_TMP/stat.raw" || true
  fi
  if [[ ! -s "$DIFF_TMP/stat.raw" ]]; then
    echo "Изменений в коммитах нет."
  else
    filter_stat < "$DIFF_TMP/stat.raw"
  fi
  echo

  echo "## Неотслеженные файлы"
  : > "$DIFF_TMP/untracked"
  git ls-files --others --exclude-standard > "$DIFF_TMP/untracked.raw" || true
  while IFS= read -r path || [[ -n "$path" ]]; do
    [[ -z "$path" ]] && continue
    if is_blocked_path "$path"; then
      continue
    fi
    printf '%s\n' "$path" >> "$DIFF_TMP/untracked"
  done < "$DIFF_TMP/untracked.raw"
  if [[ ! -s "$DIFF_TMP/untracked" ]]; then
    echo "Нет."
  else
    cat "$DIFF_TMP/untracked"
  fi
  echo

  echo "## Полный diff"
  PATHS=(
    apps/api/src
    apps/api/drizzle
    apps/web/src/components/auth
    docker-compose.yml
    .env.example
    .gitignore
    .cursor/documentations
    .ai
  )
  git diff --name-only "$FROM_COMMIT" HEAD -- "${PATHS[@]}" > "$DIFF_TMP/names.raw" || true
  : > "$DIFF_TMP/names"
  while IFS= read -r path || [[ -n "$path" ]]; do
    [[ -z "$path" ]] && continue
    if is_blocked_path "$path"; then
      continue
    fi
    printf '%s\n' "$path" >> "$DIFF_TMP/names"
  done < "$DIFF_TMP/names.raw"

  count=0
  total=0
  : > "$DIFF_TMP/sizes"
  while IFS= read -r path || [[ -n "$path" ]]; do
    [[ -z "$path" ]] && continue
    count=$((count + 1))
    git diff "$FROM_COMMIT" HEAD -- "$path" > "$DIFF_TMP/d.${count}"
    sz="$(wc -c < "$DIFF_TMP/d.${count}" | tr -d ' ')"
    printf '%s %s\n' "$sz" "$count" >> "$DIFF_TMP/sizes"
    printf '%s\n' "$path" > "$DIFF_TMP/p.${count}"
    total=$((total + sz))
  done < "$DIFF_TMP/names"

  : > "$DIFF_TMP/drop"
  : > "$DIFF_TMP/dropped.names"
  if [[ "$total" -gt "$MAX_DIFF" && "$count" -gt 0 ]]; then
    sort -nr "$DIFF_TMP/sizes" > "$DIFF_TMP/sizes.sorted"
    while read -r sz idx; do
      if [[ "$total" -le "$MAX_DIFF" ]]; then
        break
      fi
      printf '%s\n' "$idx" >> "$DIFF_TMP/drop"
      cat "$DIFF_TMP/p.${idx}" >> "$DIFF_TMP/dropped.names"
      total=$((total - sz))
    done < "$DIFF_TMP/sizes.sorted"
  fi

  if [[ -s "$DIFF_TMP/dropped.names" ]]; then
    echo "Обрезано из-за лимита 300 КБ:"
    cat "$DIFF_TMP/dropped.names"
    echo
  fi
  if [[ "$count" -eq 0 ]]; then
    echo "Полного diff нет."
  else
    i=1
    while [[ "$i" -le "$count" ]]; do
      if ! grep -qx "$i" "$DIFF_TMP/drop"; then
        cat "$DIFF_TMP/d.${i}"
      fi
      i=$((i + 1))
    done
  fi
  echo

  echo "## timework"
  if [[ -f .ai/timework.md ]]; then
    tail -n 150 .ai/timework.md
  else
    echo "Файла .ai/timework.md нет."
  fi
  echo

  echo "## Проверки"
  if [[ "$RUN_CHECKS" -eq 0 ]]; then
    echo "Проверки не запускались."
  else
    set +e
    pnpm audit --prod > "$DIFF_TMP/audit.txt" 2>&1
    audit_code=$?
    pnpm lint > "$DIFF_TMP/lint.txt" 2>&1
    lint_code=$?
    pnpm typecheck > "$DIFF_TMP/typecheck.txt" 2>&1
    type_code=$?
    set -e
    if grep -q "No known vulnerabilities found" "$DIFF_TMP/audit.txt"; then
      echo "pnpm audit --prod: известных уязвимостей нет. Код ${audit_code}."
    else
      echo "pnpm audit --prod: код ${audit_code}."
    fi
    echo "pnpm lint: код ${lint_code}."
    echo "pnpm typecheck: код ${type_code}."
    echo "lint=${lint_code} typecheck=${type_code} audit=${audit_code}" >&2
  fi
} > "$TMP"

scan_secret_file "$TMP"

# Сверка со значениями .env. Печатается только имя переменной.
if [[ -f .env ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" != *"="* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    if [[ "$val" == \"*\" && "$val" == *\" ]]; then
      val="${val#\"}"
      val="${val%\"}"
    elif [[ "$val" == \'*\' && "$val" == *\' ]]; then
      val="${val#\'}"
      val="${val%\'}"
    fi
    [[ -z "$val" ]] && continue
    if [[ "$val" == ЗАМЕНИ_НА_* ]]; then
      continue
    fi
    if ! is_sensitive_key "$key"; then
      continue
    fi
    if [[ "${#val}" -lt 8 ]]; then
      continue
    fi
    hit="$(grep -n -F -m 1 -- "$val" "$TMP" || true)"
    if [[ -n "$hit" ]]; then
      num="${hit%%:*}"
      report_secret "$num" "значение переменной ${key}"
    fi
  done < .env
fi

mkdir -p "$ROOT/.ai"
mv "$TMP" "$FINAL"
trap 'rm -rf "$DIFF_TMP"' EXIT
echo "Записан .ai/handoff.md"
