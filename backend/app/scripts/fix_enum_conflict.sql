-- Fix enum conflict
-- The issue: both 'parts.drive_side' and 'part_translation_standardization.drive_side_specific' 
-- were using the same enum name 'drive_side_enum' but with different values

-- Step 1: Drop the constraint from part_translation_standardization
ALTER TABLE part_translation_standardization 
ALTER COLUMN drive_side_specific TYPE VARCHAR(10);

-- Step 2: Drop the old enum if it exists (it might have wrong values)
DROP TYPE IF EXISTS drive_side_enum CASCADE;

-- Step 3: Create the correct enum for parts table
CREATE TYPE drive_side_enum AS ENUM ('NA', 'LHD', 'RHD');

-- Step 4: Create the enum for part_translation_standardization
CREATE TYPE drive_side_specific_enum AS ENUM ('yes', 'no');

-- Step 5: Convert parts.drive_side to use the enum
ALTER TABLE parts 
ALTER COLUMN drive_side TYPE drive_side_enum USING drive_side::drive_side_enum;

-- Step 6: Convert part_translation_standardization.drive_side_specific to use the enum
ALTER TABLE part_translation_standardization 
ALTER COLUMN drive_side_specific TYPE drive_side_specific_enum USING drive_side_specific::drive_side_specific_enum;

-- Set defaults
ALTER TABLE parts ALTER COLUMN drive_side SET DEFAULT 'NA';
ALTER TABLE part_translation_standardization ALTER COLUMN drive_side_specific SET DEFAULT 'no';
