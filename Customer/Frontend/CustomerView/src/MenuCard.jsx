import React from "react";

export default function MenuCard({ menu }) {
    return (
        <span style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            textAlign: "center",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            display: "block",
            width: 200,
            height: 320
        }}>
            <span style={{
                width: "100%",
                height: 200,
                background: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                borderRadius: 6,
                overflow: "hidden"
            }}>
                {menu.image_url ? (
                    <img src={menu.image_url} alt={menu.name} style={{ maxWidth: "100%", maxHeight: "100%" }} />
                ) : (
                    <span style={{ color: "#999" }}>No Image</span>
                )}
            </span>
            <h3 style={{ margin: "8px 0" }}>{menu.name}</h3>
            <p style={{ color: "#666", margin: "4px 0" }}>₱{Number(menu.price).toFixed(2)}</p>
        </span>
    );
}