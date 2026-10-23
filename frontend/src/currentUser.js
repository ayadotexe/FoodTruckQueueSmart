export function getCurrentUserId() {
    const storedUser = sessionStorage.getItem("currentUser");

    if (!storedUser) {
        return null;
    }

    try {
        const user = JSON.parse(storedUser);
        return typeof user.id === "string" ? user.id : null;
    } catch {
        return null;
    }
}