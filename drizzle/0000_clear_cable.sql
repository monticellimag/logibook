CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP,
	"userId" text,
	"userEmail" text,
	"userRole" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entityId" text,
	"oldValue" text,
	"newValue" text,
	"ipAddress" text,
	"userAgent" text,
	"details" text
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"depotId" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"carrierName" text NOT NULL,
	"licensePlate" text NOT NULL,
	"company" text,
	"phone" text,
	"orderRef" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending',
	"gateStatus" text DEFAULT 'expected',
	"operationType" text,
	"pallets" integer DEFAULT 0,
	"difficulty" text DEFAULT 'standard',
	"isEmergency" boolean DEFAULT false,
	"attachment" text,
	"arrivalPhoto" text,
	"operationStartedAt" text,
	"completedAt" text,
	"createdAt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"createdAt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"role" text NOT NULL,
	"depotId" text,
	"vatNumber" text,
	"address" text,
	"city" text,
	"zipCode" text,
	"phone" text,
	"contactPerson" text,
	"status" text DEFAULT 'ACTIVE',
	"must_change_password" boolean DEFAULT false,
	"temp_password_at" text,
	"requested_at" text,
	"reviewed_at" text,
	"reviewed_by" text,
	"rejection_reason" text,
	"interested_depots" text,
	"notes" text,
	"createdAt" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;