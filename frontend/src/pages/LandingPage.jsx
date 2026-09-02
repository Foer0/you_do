import { useNavigate } from "react-router-dom";
import Clock from "../components/Clock";

export default function LandingPage() {
  const navigate = useNavigate();
  const goToAuth = () => navigate("/auth");

  return (
    <div className="min-h-svh bg-wall">
      <div className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <span className="font-semibold text-2xl leading-6 tracking-tight">
          <span className="block text-ink">You</span>
          <span className="block text-clay-500">Do</span>
        </span>

        <button
          type="button"
          onClick={goToAuth}
          className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream-100"
        >
          Sign in
        </button>
      </div>

      <main className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 pb-20 pt-6 text-center sm:px-10 lg:flex-row lg:gap-16 lg:px-16 lg:pt-16 lg:text-left">
        <div className="flex flex-col items-center gap-6 lg:w-1/2 lg:items-start">
          <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Focus on what matters,
            <br />
            one task at a time.
          </h1>
          <p className="max-w-md text-ink/60">
            A simple Pomodoro timer paired with a task list — nothing
            extra, just what helps you actually finish things.
          </p>
          <button
            type="button"
            onClick={goToAuth}
            className="rounded-xl bg-sage-500 px-8 py-3.5 font-medium text-cream-50 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started
          </button>
        </div>

        <div className="w-full max-w-sm lg:w-1/2">
          <Clock
            secondsLeft={25 * 60}
            isOvertime={false}
            overtimeSeconds={0}
            sessions={0}
            totalSecondsToday={0}
          />
        </div>
      </main>
    </div>
  );
}
