#!/bin/sh
# Первый запуск пустой базы: расширение vector и две роли.
# Роль приложения не суперпользователь. Роль миграций создаёт таблицы, но тоже не суперпользователь.
set -eu

case "$POSTGRES_DB" in
  *[!a-z0-9_]*)
    echo "POSTGRES_DB: только строчные буквы, цифры и подчёркивание" >&2
    exit 1
    ;;
esac

case "$APP_DB_PASSWORD" in
  *[!A-Za-z0-9]*)
    echo "APP_DB_PASSWORD: только буквы и цифры" >&2
    exit 1
    ;;
esac

case "$MIGRATE_DB_PASSWORD" in
  *[!A-Za-z0-9]*)
    echo "MIGRATE_DB_PASSWORD: только буквы и цифры" >&2
    exit 1
    ;;
esac

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE EXTENSION IF NOT EXISTS vector;
CREATE ROLE devint_app LOGIN PASSWORD '${APP_DB_PASSWORD}';
CREATE ROLE devint_migrate LOGIN PASSWORD '${MIGRATE_DB_PASSWORD}';
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO devint_app;
GRANT CONNECT, CREATE ON DATABASE ${POSTGRES_DB} TO devint_migrate;
GRANT USAGE, CREATE ON SCHEMA public TO devint_migrate;
SQL
