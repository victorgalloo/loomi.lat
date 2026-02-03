/**
 * Partners authentication helper
 *
 * Controls access to the /partners route for authorized partners only.
 * Add partner emails to the PARTNER_EMAILS array to grant access.
 */

// List of authorized partner emails
// TODO: Move to database table or environment variable for production
const PARTNER_EMAILS: string[] = [
  'joscardona@icloud.com',
  'victorgalloo@icloud.com',
  'carloscardonam1@gmail.com',
];

/**
 * Check if a user email is an authorized partner
 */
export function isAuthorizedPartner(email: string): boolean {
  // If no partners configured, allow all authenticated users (for development)
  if (PARTNER_EMAILS.length === 0) {
    return true;
  }

  return PARTNER_EMAILS.includes(email.toLowerCase());
}

/**
 * Get the list of authorized partner emails
 */
export function getPartnerEmails(): string[] {
  return [...PARTNER_EMAILS];
}
