-- CreateTable
CREATE TABLE "BenefitLevelPointCap" (
    "level" "BenefitLevel" NOT NULL,
    "pointCap" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenefitLevelPointCap_pkey" PRIMARY KEY ("level")
);

-- CreateIndex
CREATE UNIQUE INDEX "BenefitLevelPointCap_pointCap_key" ON "BenefitLevelPointCap"("pointCap");
