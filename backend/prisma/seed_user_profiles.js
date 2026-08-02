/**
 * OBSOLETE — kept intentionally as a no-op.
 *
 * This script previously back-filled profile fields (firstName, lastName,
 * displayName, bio, avatarUrl, phoneNumber) that lived directly on the
 * `User` table.
 *
 * After the Phase-1 domain refactor those fields were removed from `User`
 * and moved into the dedicated `Profile` model. Profiles are now created
 * during the main seed (prisma/seed.js). This migration script is no
 * longer applicable and should not be run.
 */
console.warn(
  '[seed_user_profiles] This script is obsolete after the User/Profile split. ' +
    'Profile data is now seeded by prisma/seed.js. Nothing to do.'
);
process.exit(0);
