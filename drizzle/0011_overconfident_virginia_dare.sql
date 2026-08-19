CREATE TYPE "public"."lead_temperature" AS ENUM('hot', 'warm', 'cold');--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "temperature" "lead_temperature";