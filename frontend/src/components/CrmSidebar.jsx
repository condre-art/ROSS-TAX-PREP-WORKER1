import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/crm", label: "Intakes" },
  { to: "/crm/clients", label: "Clients" },
  { to: "/crm/staff", label: "Staff" },
  { to: "/crm/certificates", label: "Certificates" },
];

export default function CrmSidebar({ collapsed, onToggle }) {
  return (
    <aside
      className="crm-sidebar"
      style={{
        width: collapsed ? 56 : 180,
        background: "#2C3E50",
        color: "#fff",
        minHeight: "100vh",
        transition: "width 0.2s",
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: collapsed ? "center" : "flex-start",
        padding: collapsed ? "12px 0" : "24px 0 0 0",
      }}
    >
      <button
        aria-label="Toggle sidebar"
        onClick={onToggle}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: 22,
          margin: collapsed ? "0 0 16px 0" : "0 0 24px 12px",
          cursor: "pointer",
        }}
      >
        {collapsed ? "☰" : "⮜"}
      </button>
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            isActive ? "crm-sidelink active" : "crm-sidelink"
          }
          style={{
            display: "block",
            color: "#fff",
            textDecoration: "none",
            padding: collapsed ? "12px 0" : "12px 24px",
            fontWeight: 500,
            borderLeft: isActive => isActive ? "4px solid #27AE60" : "4px solid transparent",
            background: isActive => isActive ? "rgba(39,174,96,0.08)" : "none",
            borderRadius: "0 16px 16px 0",
            marginBottom: 4,
            fontSize: 16,
            transition: "background 0.2s, border 0.2s",
            minWidth: 0,
            textAlign: collapsed ? "center" : "left",
          }}
        >
          {collapsed ? link.label[0] : link.label}
        </NavLink>
      ))}
    </aside>
  );
}
