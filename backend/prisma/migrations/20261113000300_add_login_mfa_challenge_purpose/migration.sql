-- Keep PostgreSQL's AuthChallengePurpose enum aligned with schema.prisma.
-- Adding an enum value is additive and preserves all existing challenge records.
ALTER TYPE "AuthChallengePurpose" ADD VALUE IF NOT EXISTS 'LOGIN_MFA';
