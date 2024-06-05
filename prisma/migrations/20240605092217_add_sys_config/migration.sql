-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settingsBannerLink" TEXT,
    "settingsBannerHeading" TEXT,
    "settingsBannerDescription" TEXT,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);
