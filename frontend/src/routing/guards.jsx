import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Простой центрированный "пульс" — тот же визуальный язык, что и
// скелетоны загрузки на других страницах, только на весь экран.
function InitializingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-wall">
      <div className="h-10 w-10 animate-pulse rounded-full bg-cream-200" />
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  // Пока не попробовали тихий /auth/refresh хотя бы раз — не решаем
  // ничего, иначе на долю секунды мигнёт редиректом на /auth даже
  // у реально залогиненного (просто ещё не подтверждённого) пользователя.
  if (isInitializing) return <InitializingScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
}

// Лендинг и форма входа не должны показываться уже залогиненному —
// сразу отправляем на главную.
export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return <InitializingScreen />;
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
}
