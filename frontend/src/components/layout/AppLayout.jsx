import { Outlet } from "react-router-dom";
import PageBackground from "../PageBackground";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout() {
  const { logout } = useAuth();

  return (
    <>
      <PageBackground />

      <div className="flex min-h-svh">
        <Sidebar />

        {/* pb-20 — место под фиксированный BottomNav на мобилке, чтобы
            он не перекрывал последний ряд контента */}
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <TopBar onLogout={logout} />
          <main className="px-6 pb-10 sm:px-10 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
