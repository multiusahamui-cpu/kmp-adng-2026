ALTER TABLE "resignation_requests" ADD COLUMN "case_type" varchar(20) DEFAULT 'self' NOT NULL;--> statement-breakpoint
ALTER TABLE "resignation_requests" ADD COLUMN "disbursement_method" varchar(20) DEFAULT 'bank_transfer';--> statement-breakpoint
ALTER TABLE "resignation_requests" ADD COLUMN "closed_at" timestamp;--> statement-breakpoint
ALTER TABLE "resignation_requests" ADD COLUMN "closed_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_account_number" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_account_holder" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resignation_requests" ADD CONSTRAINT "resignation_requests_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
