import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../api/client";
import FormField from "./FormField";
import GoogleSignInButton from "./GoogleSignInButton";
import { MailIcon, LockIcon, EyeIcon } from "./icons";

export default function AuthForm({ mode, onModeChange }) {
  const { login, register, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === "signin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isSignIn) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle(idToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = (message) => setError(message);

  return (
    <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-[58%] lg:px-16">
      <div className="mx-auto w-full max-w-sm">
        {/* лого — виден только там, где скрыта левая витрина (мобилка) */}
        <span className="mb-8 block font-semibold text-2xl leading-6 tracking-tight lg:hidden">
          <span className="block text-ink">You</span>
          <span className="block text-clay-500">Do</span>
        </span>

        <div className="flex border-b border-ink/10">
          <TabButton active={isSignIn} onClick={() => onModeChange("signin")}>
            Sign in
          </TabButton>
          <TabButton active={!isSignIn} onClick={() => onModeChange("signup")}>
            Sign up
          </TabButton>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <FormField
            label="Email"
            icon={<MailIcon />}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
            autoComplete="email"
          />

          <FormField
            label="Password"
            icon={<LockIcon />}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-ink/40 hover:text-ink/70"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            }
          />

          {isSignIn && (
            <div className="-mt-1 flex items-center justify-end text-sm">
              <span
                className="cursor-not-allowed text-ink/30"
                title="Not implemented yet"
              >
                Forgot password?
              </span>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-sage-500 py-3 font-medium text-cream-50 shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
          >
            {isSubmitting ? "..." : isSignIn ? "Sign in" : "Sign up"}
          </button>

          <div className="flex items-center gap-3 text-xs text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            or
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <GoogleSignInButton onCredential={handleGoogleCredential} onError={handleGoogleError} />
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => onModeChange(isSignIn ? "signup" : "signin")}
            className="font-medium text-sage-600 hover:underline"
          >
            {isSignIn ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 border-b-2 pb-3 text-sm font-medium transition-colors " +
        (active
          ? "border-ink text-ink"
          : "border-transparent text-ink/40 hover:text-ink/60")
      }
    >
      {children}
    </button>
  );
}
