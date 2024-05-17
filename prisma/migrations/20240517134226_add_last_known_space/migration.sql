-- CreateTable
CREATE TABLE "UserLastKnownSpace" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "spaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "UserLastKnownSpace_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserLastKnownSpace" ADD CONSTRAINT "UserLastKnownSpace_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLastKnownSpace" ADD CONSTRAINT "UserLastKnownSpace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
