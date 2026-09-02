import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { TimerProvider } from "./context/TimerContext";
import { ProtectedRoute, PublicOnlyRoute } from "./routing/guards";
import AppLayout from "./components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import StatisticsPage from "./pages/StatisticsPage";

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <TimerProvider>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TimerProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
