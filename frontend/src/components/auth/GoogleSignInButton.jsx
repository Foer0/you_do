import { useEffect, useRef, useState } from "react";

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Скрипт Google Identity Services общий на всё приложение — грузим его
// один раз и переиспользуем промис, даже если кнопка смонтируется
// повторно (например, при быстром переключении Sign in / Sign up).
let gsiScriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
        return;
      }
      const script = document.createElement("script");
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google script"));
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

/**
 * Рендерит официальную кнопку Google ("Continue with Google") через
 * Google Identity Services (GIS) — библиотека сама рисует кнопку внутри
 * переданного div и по клику открывает выбор аккаунта Google.
 *
 * onCredential(idToken) — вызывается с JWT credential после успешного
 * выбора аккаунта; именно этот idToken нужно отправлять на бэкенд
 * ("/auth/google"), а не парсить его на фронте.
 * onError(message) — вызывается, если скрипт не загрузился, клиент не
 * настроен или сам Google вернул ответ без credential.
 */
export default function GoogleSignInButton({ onCredential, onError }) {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Актуальные колбэки держим в ref, чтобы не переинициализировать GIS
  // и не перерисовывать кнопку при каждом ре-рендере AuthForm (например,
  // при вводе текста в соседних полях email/password) — эффект ниже
  // должен отработать один раз за монтирование.
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!CLIENT_ID) {
      // eslint-disable-next-line no-console
      console.error("VITE_GOOGLE_CLIENT_ID is not set — Google sign-in is disabled.");
      onErrorRef.current?.("Google sign-in is not configured.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              onCredentialRef.current?.(response.credential);
            } else {
              onErrorRef.current?.("Google sign-in failed. Please try again.");
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          width: containerRef.current?.offsetWidth || 320,
        });

        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        onErrorRef.current?.("Couldn't load Google sign-in. Check your connection and try again.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {isLoading && (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/10 py-3 text-sm font-medium text-ink/50">
          Loading Google sign-in…
        </div>
      )}
      <div ref={buttonRef} className={isLoading ? "hidden" : "flex justify-center"} />
    </div>
  );
}
