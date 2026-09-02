import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";
import { ChevronLeftIcon } from "./icons";

export default function Sidebar() {
  // По умолчанию — узкая "иконочная" полоса, как на референсе; если
  // человек когда-то явно её разворачивал, уважаем этот выбор ("0" в
  // сторедже — единственный способ получить collapsed=false).
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") !== "0"
  );

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <aside
      className={
        "hidden shrink-0 flex-col gap-8 border-r border-ink/10 bg-cream-50 py-8 transition-[width] duration-200 lg:flex " +
        (collapsed ? "w-24 px-3" : "w-64 px-6")
      }
    >
      <div className={collapsed ? "flex justify-center" : "flex justify-start"}>
        <span className="font-semibold text-2xl leading-6 tracking-tight">
          {collapsed ? (
            <>
              <span className="block text-ink">Y</span>
              <span className="block text-clay-500">D</span>
            </>
          ) : (
            <>
              <span className="block text-ink">You</span>
              <span className="block text-clay-500">Do</span>
            </>
          )}
        </span>
      </div>

      {/* items-center только в свёрнутом виде — иначе фиксированные
          h-11 w-11 квадраты не центрируются по горизонтали внутри
          более широкой колонки навигации */}
      <nav className={"flex flex-col gap-1.5" + (collapsed ? " items-center" : "")}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, enabled }) =>
          enabled ? (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                "flex items-center gap-3 rounded-2xl text-sm font-medium transition-colors " +
                (collapsed ? "h-11 w-11 justify-center " : "px-3 py-2.5 ") +
                (isActive
                  ? "bg-sage-500 text-cream-50 shadow-sm"
                  : "text-ink/60 hover:bg-cream-100 hover:text-ink")
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && label}
            </NavLink>
          ) : (
            <span
              key={to}
              title="Coming soon"
              className={
                "flex cursor-not-allowed items-center gap-3 rounded-2xl text-sm font-medium text-ink/30 " +
                (collapsed ? "h-11 w-11 justify-center" : "px-3 py-2.5")
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && label}
            </span>
          )
        )}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand" : "Collapse"}
        className={
          "mt-auto flex items-center gap-2 rounded-xl py-2 text-sm text-ink/50 hover:bg-cream-100 hover:text-ink " +
          (collapsed ? "justify-center px-0" : "px-3")
        }
      >
        <ChevronLeftIcon
          className={"h-4 w-4 shrink-0 transition-transform " + (collapsed ? "rotate-180" : "")}
        />
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}
