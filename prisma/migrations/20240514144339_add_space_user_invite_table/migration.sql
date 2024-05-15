-- CreateTable
CREATE TABLE "SpaceUserInvites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "spaceId" UUID NOT NULL,

    CONSTRAINT "SpaceUserInvites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpaceUserInvites_email_key" ON "SpaceUserInvites"("email");

-- AddForeignKey
ALTER TABLE "SpaceUserInvites" ADD CONSTRAINT "SpaceUserInvites_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
