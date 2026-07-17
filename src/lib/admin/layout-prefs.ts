export const ADMIN_DENSE_TABLES_KEY = "admin-dense-tables";
export const ADMIN_DARK_SIDEBAR_KEY = "admin-dark-sidebar";
export const ADMIN_SIMPLE_NAVIGATION_KEY = "admin-simple-navigation";

export function readAdminDenseTables(): boolean {
  try {
    return window.localStorage.getItem(ADMIN_DENSE_TABLES_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAdminDenseTables(value: boolean): void {
  try {
    window.localStorage.setItem(ADMIN_DENSE_TABLES_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function readAdminDarkSidebar(): boolean {
  try {
    return window.localStorage.getItem(ADMIN_DARK_SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAdminDarkSidebar(value: boolean): void {
  try {
    window.localStorage.setItem(ADMIN_DARK_SIDEBAR_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function readAdminSimpleNavigation(): boolean {
  try {
    return window.localStorage.getItem(ADMIN_SIMPLE_NAVIGATION_KEY) !== "0";
  } catch {
    return true;
  }
}

export function writeAdminSimpleNavigation(value: boolean): void {
  try {
    window.localStorage.setItem(ADMIN_SIMPLE_NAVIGATION_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}
