// Centralized admin URL prefix. Changing this in one place renames the
// entire admin surface. New admin code should reference these constants
// instead of hardcoding the URL prefix again.
//
// Note: this is OBSCURITY, not security — the path is bundled into the
// public JS and discoverable by anyone reading the source. Real protection
// comes from ProtectedRoute + RoleGuard (auth check) and ideally an
// nginx-level IP allowlist on /internal/* at the reverse proxy.
export const ADMIN_BASE_PATH = '/internal/garagecollective/controlpanel'
export const ADMIN_LOGIN_PATH = `${ADMIN_BASE_PATH}/login`

/**
 * Build a path under the admin base.
 *   adminPath()              → "/internal/garagecollective/controlpanel"
 *   adminPath('users')       → "/internal/garagecollective/controlpanel/users"
 *   adminPath('/users')      → "/internal/garagecollective/controlpanel/users"
 */
export function adminPath(sub: string = ''): string {
  if (!sub) return ADMIN_BASE_PATH
  return `${ADMIN_BASE_PATH}/${sub.replace(/^\/+/, '')}`
}
