ALTER TABLE "email_tokens" DROP CONSTRAINT "email_tokens_purpose";--> statement-breakpoint
ALTER TABLE "mail_events" DROP CONSTRAINT "mail_events_kind";--> statement-breakpoint
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_purpose" CHECK ("email_tokens"."purpose" in ('verify_email', 'reset_password'));--> statement-breakpoint
ALTER TABLE "mail_events" ADD CONSTRAINT "mail_events_kind" CHECK ("mail_events"."kind" in ('verify_email', 'already_registered', 'reset_password', 'password_changed'));