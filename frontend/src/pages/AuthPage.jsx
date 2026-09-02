import { useState } from "react";
import { Link } from "react-router-dom";
import AuthHero from "../components/auth/AuthHero";
import AuthForm from "../components/auth/AuthForm";

export default function AuthPage() {
  const [mode, setMode] = useState("signin");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-wall px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="w-full max-w-5xl text-left text-sm text-ink/50 hover:text-ink/80"
      >
        ← Back
      </Link>

      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-cream-50 shadow-[0_1px_0_rgba(35,43,26,0.05)] lg:min-h-[640px]">
        <AuthHero mode={mode} />
        <AuthForm mode={mode} onModeChange={setMode} />
      </div>
    </div>
  );
}
