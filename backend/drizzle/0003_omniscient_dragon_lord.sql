CREATE TABLE IF NOT EXISTS "kordinator_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"location_code" varchar(20),
	"member_counter" integer DEFAULT 0,
	"level" varchar(50),
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referred_by" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_settled" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kordinator_details" ADD CONSTRAINT "kordinator_details_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
