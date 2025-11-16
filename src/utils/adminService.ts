import { toast } from 'sonner';

// List of admin emails
export const ADMIN_EMAILS = [
  'example@gmail.com', // Replace with actual admin emails
  'admin@zoophi.org',
  'admin@test.com',
  'vikashspidey@gmail.com'
];

/**
 * Check if a user is an admin based on their email
 * @param email User's email
 * @returns Boolean indicating whether the user is an admin
 */
export const isAdmin = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Display a welcome toast for admin users
 * @param email User's email
 */
export const showAdminWelcome = (email: string): void => {
  if (isAdmin(email)) {
    toast.success('Welcome, Admin! You have access to special features.');
  }
};

/**
 * Get the admin email
 * @returns The admin email
 */
export const getAdminEmail = (): string => {
  return ADMIN_EMAILS[0];
};