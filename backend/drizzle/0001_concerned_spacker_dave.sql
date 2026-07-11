CREATE TABLE IF NOT EXISTS "coop_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"total_simpanan_pokok" numeric(15, 2) DEFAULT '0',
	"total_simpanan_wajib" numeric(15, 2) DEFAULT '0',
	"total_simpanan_sukarela" numeric(15, 2) DEFAULT '0',
	"cadangan_modal" numeric(15, 2) DEFAULT '0',
	"hibah" numeric(15, 2) DEFAULT '0',
	"shu_ditahan" numeric(15, 2) DEFAULT '0',
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "savings_pokok" numeric(15, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "savings_wajib" numeric(15, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "savings_sukarela" numeric(15, 2) DEFAULT '0' NOT NULL;