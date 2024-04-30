-- CreateEnum
CREATE TYPE "SpaceUserRole" AS ENUM ('SPACE_ADMIN');

-- CreateTable
CREATE TABLE "SpaceUser" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "spaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "SpaceUserRole" NOT NULL DEFAULT 'SPACE_ADMIN',

    CONSTRAINT "SpaceUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpaceUser_spaceId_userId_key" ON "SpaceUser"("spaceId", "userId");

-- AddForeignKey
ALTER TABLE "SpaceUser" ADD CONSTRAINT "SpaceUser_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SpaceUser" ADD CONSTRAINT "SpaceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
