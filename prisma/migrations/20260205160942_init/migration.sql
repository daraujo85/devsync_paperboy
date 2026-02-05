-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "image_url" TEXT,
    "scheduled_at" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "channels" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "provider_message_id" TEXT,
    "last_error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "queued_at" DATETIME,
    "sent_at" DATETIME,
    "failed_at" DATETIME,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false
);
