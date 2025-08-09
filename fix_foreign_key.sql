-- Fix SpaceBenefitUsage foreign key to reference User table instead of User2

-- 1. Drop the incorrect foreign key constraint
ALTER TABLE "SpaceBenefitUsage" 
DROP CONSTRAINT IF EXISTS "SpaceBenefitUsage_userId_fkey";

-- 2. Add the correct foreign key constraint
ALTER TABLE "SpaceBenefitUsage" 
ADD CONSTRAINT "SpaceBenefitUsage_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "User"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;

-- 3. Verify the fix
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'SpaceBenefitUsage_userId_fkey';