import { HomeIcon, CalendarIcon, ChartIcon, GearIcon } from "./icons";

// enabled: false — маршрут ещё не существует (страницы Life Calendar,
// Tasks-как-отдельная-страница пока не построены), пункт показывается,
// но неактивен, с тултипом — по аналогии с тем, как уже сделаны
// Google-вход и Forgot password на странице входа.
export const NAV_ITEMS = [
  { to: "/home", label: "Home", icon: HomeIcon, enabled: true },
  { to: "/life-calendar", label: "Life Calendar", mobileLabel: "Calendar", icon: CalendarIcon, enabled: false },
  { to: "/statistics", label: "Statistics", icon: ChartIcon, enabled: true },
  { to: "/settings", label: "Settings", icon: GearIcon, enabled: true },
];
