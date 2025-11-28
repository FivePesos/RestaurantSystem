import React, { useEffect, useState } from "react";
import { getMenus, createMenu, updateMenu, deleteMenu, socket } from "./api";
import MenuList from "./MenuList";

export default function Menu() {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", price: "", imageFile: null });
    const [msg, setMsg] = useState(null);

    useEffect(() => { fetchMenus(); }, []);

    useEffect(() => {
        // Listen for real-time menu updates
        socket.on("menu_created", (menu) => {
            setMenus(prev => [...prev, menu]);
            setMsg("New menu item added!");
        });
        socket.on("menu_updated", (menu) => {
            setMenus(prev => prev.map(m => m.id === menu.id ? menu : m));
            setMsg("Menu item updated!");
        });
        socket.on("menu_deleted", (data) => {
            setMenus(prev => prev.filter(m => m.id !== data.id));
            setMsg("Menu item deleted!");
        });

        return () => {
            socket.off("menu_created");
            socket.off("menu_updated");
            socket.off("menu_deleted");
        };
    }, []);

    async function fetchMenus() {
        setLoading(true);
        const res = await getMenus();
        if (res.ok && res.body.menus) setMenus(res.body.menus);
        else setMsg(`Failed to load menus (${res.status})`);
        setLoading(false);
    }

    async function handleCreate(e) {
        e.preventDefault();
        setMsg(null);
        try {
            const res = await createMenu({ name: form.name, price: form.price, imageFile: form.imageFile });
            if (res.ok) {
                setForm({ name: "", price: "", imageFile: null });
            } else {
                setMsg(JSON.stringify(res.body));
            }
        } catch (err) { setMsg(String(err)); }
    }

    async function handleUpdate(id, data) {
        setMsg(null);
        const res = await updateMenu(id, data);
        if (!res.ok) setMsg(JSON.stringify(res.body));
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this menu item?")) return;
        const res = await deleteMenu(id);
        if (!res.ok) setMsg(JSON.stringify(res.body));
    }

    return (
        <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
            <h2>Admin — Menu CRUD</h2>

            <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
                <input required placeholder="Name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                <input required placeholder="Price" type="number" step="0.01" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} />
                <input type="file" accept="image/*" onChange={e => setForm({ ...form, imageFile: e.target.files[0] || null })} />
                <button type="submit">Add</button>
            </form>

            {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}

            {loading ? <div>Loading...</div> : (
                <MenuList menus={menus} onUpdate={handleUpdate} onDelete={handleDelete} />
            )}
        </div>
    );
}