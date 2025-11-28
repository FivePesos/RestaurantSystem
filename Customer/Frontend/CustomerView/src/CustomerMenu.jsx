import React, { useEffect, useState } from "react";
import { getMenus, socket } from "../api";
import MenuCard from "./MenuCard";

export default function CustomerMenu() {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMenus();
    }, []);

    useEffect(() => {
        // Listen for real-time menu updates
        socket.on("menu_created", (menu) => {
            setMenus(prev => [...prev, menu]);
        });
        socket.on("menu_updated", (menu) => {
            setMenus(prev => prev.map(m => m.id === menu.id ? menu : m));
        });
        socket.on("menu_deleted", (data) => {
            setMenus(prev => prev.filter(m => m.id !== data.id));
        });

        return () => {
            socket.off("menu_created");
            socket.off("menu_updated");
            socket.off("menu_deleted");
        };
    }, []);

    async function fetchMenus() {
        setLoading(true);
        setError(null);
        const res = await getMenus();
        if (res.ok && res.body.menus) {
            setMenus(res.body.menus);
        } else {
            setError(`Failed to load menus: ${res.body?.error || res.status}`);
        }
        setLoading(false);
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
            <h1>Menu</h1>

            {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

            {loading ? (
                <div>Loading menus...</div>
            ) : menus.length === 0 ? (
                <div>No menu items available.</div>
            ) : (
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20
                }}>
                    {menus.map(menu => (
                        <MenuCard key={menu.id} menu={menu} />
                    ))}
                </div>
            )}
        </div>
    );
}