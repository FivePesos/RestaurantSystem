// Use Vite env var (VITE_API_BASE). Fallback to localhost backend.
const API_BASE = import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:5000";

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, options);
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, body: JSON.parse(text || "{}") }; }
    catch { return { ok: res.ok, status: res.status, body: text }; }
}

export async function getMenus() { return request("/admin/menu"); }

export async function createMenu({ name, price, imageFile }) {
    if (imageFile) {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("price", String(price));
        fd.append("image", imageFile);
        return request("/admin/menu", { method: "POST", body: fd });
    }
    return request("/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price })
    });
}

export async function updateMenu(id, { name, price, imageFile }) {
    if (imageFile) {
        const fd = new FormData();
        if (name !== undefined) fd.append("name", name);
        if (price !== undefined) fd.append("price", String(price));
        fd.append("image", imageFile);
        return request(`/admin/menu/${id}`, { method: "PUT", body: fd });
    }
    return request(`/admin/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price })
    });
}

export async function deleteMenu(id) {
    return request(`/admin/menu/${id}`, { method: "DELETE" });
}