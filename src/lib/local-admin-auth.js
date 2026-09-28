const LOCAL_ADMIN_STORAGE_KEY = "climaclaro_local_admin";

export function isLocalAdminLoginEnabled() {
  return false;
}

export function getLocalAdminUser() {
  if (!isLocalAdminLoginEnabled()) return null;
  if (localStorage.getItem(LOCAL_ADMIN_STORAGE_KEY) !== "true") return null;

  return {
    id: "local-admin",
    full_name: "Admin local",
    email: "admin.local@climaclaro.dev",
    role: "admin",
    isLocalAdmin: true,
  };
}

export function loginLocalAdmin(password) {
  if (!isLocalAdminLoginEnabled()) return { ok: false, message: "El login local no está habilitado." };

  const expectedPassword = "";
  if (expectedPassword && password !== expectedPassword) {
    return { ok: false, message: "Contraseña local incorrecta." };
  }

  localStorage.setItem(LOCAL_ADMIN_STORAGE_KEY, "true");
  return { ok: true };
}

export function logoutLocalAdmin() {
  localStorage.removeItem(LOCAL_ADMIN_STORAGE_KEY);
}
