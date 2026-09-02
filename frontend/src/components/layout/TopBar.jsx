import { useState } from "react";

export default function TopBar({ onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center justify-between px-6 py-6 sm:px-10 lg:justify-end lg:px-10">
      {/* лого — только там, где сайдбар (с лого внутри) скрыт */}
      <span className="font-semibold text-2xl leading-6 tracking-tight lg:hidden">
        <span className="block text-ink">You</span>
        <span className="block text-clay-500">Do</span>
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-ink hover:bg-cream-100/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"
        >
          <span className="hidden sm:inline text-sm font-medium">Profile</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="8" r="4" />
            </svg>
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-10 mt-2 w-40 overflow-hidden rounded-xl border border-ink/10 bg-cream-50 py-1 shadow-md">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onLogout?.();
              }}
              className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-cream-100"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
