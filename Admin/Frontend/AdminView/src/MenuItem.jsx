import React, { useState } from "react";

export default function MenuItem({ menu, onUpdate, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: menu.name, price: menu.price, imageFile: null });

    async function save(e) {
        e.preventDefault();
        const data = { name: form.name, price: form.price };
        if (form.imageFile) data.imageFile = form.imageFile;
        await onUpdate(menu.id, data);
        setEditing(false);
    }

    return (
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, display: "flex", gap: 12, alignItems: "center" }}>
            {!editing ? (
                <>
                    <div style={{ width: 96, height: 72, background: "#f6f6f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {menu.image_url ? <img src={menu.image_url} alt={menu.name} style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <small>No image</small>}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{menu.name}</div>
                        <div style={{ color: "#555" }}>Price: ₱{Number(menu.price).toFixed(2)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditing(true)}>Edit</button>
                        <button onClick={() => onDelete(menu.id)} style={{ color: "red" }}>Delete</button>
                    </div>
                </>
            ) : (
                <form onSubmit={save} style={{ display: "flex", gap: 8, width: "100%", alignItems: "center" }}>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    <input type="file" accept="image/*" onChange={e => setForm({ ...form, imageFile: e.target.files[0] || null })} />
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => { setEditing(false); setForm({ name: menu.name, price: menu.price, imageFile: null }); }}>Cancel</button>
                </form>
            )}
        </div>
    );
}