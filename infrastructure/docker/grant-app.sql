-- Права роли приложения. Запускает роль миграций после создания таблиц.
-- Повторять можно: GRANT не падает, если право уже выдано.

BEGIN;

REVOKE ALL ON SCHEMA public FROM devint_app;
GRANT USAGE ON SCHEMA public TO devint_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO devint_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO devint_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO devint_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO devint_app;

COMMIT;
