export function isAdminMode() {
    return process.env.ADMIN_MODE === "true";
}
