/**
 * Общий фон для всех страниц внутри AppLayout — тёплая нейтральная
 * стена с едва заметной атмосферой: мягкий световой блик сверху и
 * лёгкий перепад глубины по нижним углам, всё в тонах самой стены
 * (cream/table), без отдельных ярких цветовых пятен — чтобы фон не
 * бросался в глаза и не спорил с контентом. Плюс тень листвы в
 * верхнем левом углу. Один инстанс на AppLayout, не завязан на
 * положение часов на конкретной странице.
 */
export default function PageBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-wall">
      {/* тёплый блик сверху-по-центру — держит фокус композиции */}
      <div
        className="absolute -top-[14%] left-1/2 h-[42%] w-[60%] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--color-cream-100)" }}
        aria-hidden="true"
      />

      {/* едва уловимый перепад глубины по нижним углам — тон самой
          стены, не отдельный акцентный цвет */}
      <div
        className="absolute -bottom-[16%] -left-[10%] h-[46%] w-[38%] rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--color-cream-200)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-[18%] -right-[8%] h-[42%] w-[34%] rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--color-table)" }}
        aria-hidden="true"
      />

      {/* тень листвы — верхний левый угол, лёгкий "оконный" блик */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute -left-[6%] -top-[8%] h-[48%] w-[40%] opacity-[0.12] blur-md"
      >
        <ellipse cx="70" cy="60" rx="9" ry="130" fill="var(--color-ink)" transform="rotate(32 70 60)" />
        <ellipse cx="120" cy="30" rx="10" ry="160" fill="var(--color-ink)" transform="rotate(21 120 30)" />
        <ellipse cx="175" cy="10" rx="8" ry="180" fill="var(--color-ink)" transform="rotate(12 175 10)" />
        <ellipse cx="225" cy="35" rx="7" ry="150" fill="var(--color-ink)" transform="rotate(4 225 35)" />
        <ellipse cx="30" cy="110" rx="7" ry="100" fill="var(--color-ink)" transform="rotate(46 30 110)" />
      </svg>

      {/* едва заметный точечный узор — тихий акцент у правого края,
          не парный волне (её больше нет), просто лёгкая текстура */}
      <div
        className="absolute right-0 top-[10%] h-40 w-40 opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-ink-soft) 1.4px, transparent 1.6px)",
          backgroundSize: "16px 16px",
          WebkitMaskImage:
            "radial-gradient(circle at 75% 35%, black 0%, transparent 72%)",
          maskImage:
            "radial-gradient(circle at 75% 35%, black 0%, transparent 72%)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
