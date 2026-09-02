import Clock from "../Clock";

const COPY = {
  signin: {
    title: "Welcome back",
    subtitle: "Focus on what matters. One task at a time.",
  },
  signup: {
    title: "Get started",
    subtitle: "Set a timer, pick a task, and go.",
  },
};

export default function AuthHero({ mode }) {
  const { title, subtitle } = COPY[mode];

  return (
    <div className="hidden flex-col justify-center gap-10 bg-cream-100 px-12 py-14 lg:flex lg:w-[42%]">
      <span className="font-semibold text-2xl leading-7 tracking-tight">
        <span className="block text-ink">You</span>
        <span className="block text-clay-500">Do</span>
      </span>

      <div>
        <h1 className="text-4xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-ink/60">{subtitle}</p>
      </div>

      {/* декоративные часы — не функциональные, просто иллюстрация */}
      <div className="mt-4 w-full max-w-xs">
        <Clock
          secondsLeft={25 * 60}
          isOvertime={false}
          overtimeSeconds={0}
          sessions={0}
          totalSecondsToday={0}
        />
      </div>
    </div>
  );
}
