import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Users, Clock, CalendarDays } from "lucide-react";

const Sidebar = ({ className = "", onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const links = [
    {
      to: isAdmin ? "/admin" : "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Dashboard",
    },
    // We only expose certain tabs if admin
    ...(isAdmin
      ? [
          { to: "/admin/employees", icon: <Users className="w-5 h-5" />, label: "Employees" },
          { to: "/admin/leaves", icon: <CalendarDays className="w-5 h-5" />, label: "Leave Requests" },
          { to: "/admin/attendance", icon: <Clock className="w-5 h-5" />, label: "Attendance Logs" },
        ]
      : [
          // Employee specific routes if needed. For now EmployeeDashboard handles it all.
        ]),
  ];

  return (
    <aside className={`w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 p-4 flex flex-col gap-2 ${className}`}>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          end={link.to === "/admin" || link.to === "/dashboard"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              isActive
                ? "bg-blue-600/10 text-blue-700 shadow-inner border border-blue-500/20"
                : "text-gray-600 hover:bg-white/30 hover:text-gray-900"
            }`
          }
        >
          {link.icon}
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;
