import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-ink/10 bg-cream-50/95 py-2 backdrop-blur-sm lg:hidden">
      {NAV_ITEMS.map(({ to, label, mobileLabel, icon: Icon, enabled }) =>
        enabled ? (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium " +
              (isActive ? "text-ink" : "text-ink/40")
            }
          >
            <Icon className="h-5 w-5" />
            {mobileLabel ?? label}
          </NavLink>
        ) : (
          <span
            key={to}
            title="Coming soon"
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] font-medium text-ink/25"
          >
            <Icon className="h-5 w-5" />
            {mobileLabel ?? label}
          </span>
        )
      )}
    </nav>
  );
}
