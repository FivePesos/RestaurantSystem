import React from "react";
import { useState } from "react";
import MenuItem from "./MenuItem";

//Parent Component for MenuItem
export default function MenuList({ menus = [], onUpdate, onDelete }) {
    if (!menus.length) return <div>No menu items yet.</div>;
    return (
        <div style={{ display: "grid", gap: 12 }}>
            {menus.map(menu => (
                <MenuItem key={menu.id} menu={menu} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
        </div>
    );
}