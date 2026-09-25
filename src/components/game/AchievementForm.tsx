import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, FerrisWheel, Send, Star } from "lucide-react";
import { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import {
  normalizeAchievementSubmission,
  type AchievementSubmission,
} from "@/lib/achievement";
import { markAchievementSubmitted } from "@/lib/game/finale-progress";
import type { AchievementStats } from "@/lib/game/play-stats";

type FormState = "idle" | "submitting" | "success" | "error";

function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (hours > 0) return `${hours} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds} s`;
}

export function AchievementForm({
  stats,
  onCancel,
  onSuccess,
}: {
  stats: AchievementStats;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<FormState>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;
    setErrors({});
    setState("idle");
    let submission: AchievementSubmission;
    try {
      submission = normalizeAchievementSubmission({
        name,
        email,
        rating,
        message,
        stats: {
          activePlaySeconds: stats.activePlaySeconds,
          finishedDays: stats.finishedDays,
          perfectDays: stats.perfectDays,
          completedAttractions: stats.completedAttractions,
        },
        completedChallenges: stats.completedChallenges,
        consent,
        website,
        formStartedAt,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const nextErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const field = String(issue.path[0] ?? "form");
          if (!nextErrors[field]) nextErrors[field] = issue.message;
        }
        setErrors(nextErrors);
      } else {
        setErrors({ form: "Revisa los campos señalados." });
      }
      return;
    }

    setState("submitting");
    try {
      const response = await fetch("/api/achievement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission),
      });
      if (!response.ok) throw new Error("achievement_delivery_failed");
      markAchievementSubmitted(new Date().toISOString());
      setState("success");
    } catch {
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <dialog ref={dialog} className="achievement-form-layer" aria-labelledby="achievement-success-title" onCancel={event => event.preventDefault()}>
        <section className="achievement-receipt">
          <CheckCircle2 aria-hidden />
          <small>Pentonúi Games</small>
          <h2 id="achievement-success-title">Hazaña recibida</h2>
          <p>Gracias por compartir este final con nosotros. Tu mensaje ha salido del parque con tus estadísticas.</p>
          <Button size="lg" autoFocus onClick={onSuccess}>Volver al parque</Button>
        </section>
      </dialog>
    );
  }

  return (
    <dialog ref={dialog} className="achievement-form-layer" aria-labelledby="achievement-form-title" onCancel={event => event.preventDefault()}>
      <form className="achievement-form-card" onSubmit={submit} noValidate>
        <header>
          <span><Send aria-hidden /></span>
          <div><small>Mensaje voluntario</small><h2 id="achievement-form-title">Comparte tu hazaña con Pentonúi Games</h2></div>
        </header>
        <p className="achievement-form-intro">Cuéntanos quién ha llegado hasta aquí y qué te ha parecido Poker Park.</p>

        <div className="achievement-fields">
          <label htmlFor="achievement-name">Tu nombre</label>
          <input id="achievement-name" value={name} onChange={event => setName(event.target.value)} maxLength={80} autoComplete="name" autoFocus aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "achievement-name-error" : undefined} />
          {errors.name ? <p id="achievement-name-error" className="achievement-field-error">Escribe tu nombre.</p> : null}

          <label htmlFor="achievement-email">Tu correo</label>
          <input id="achievement-email" type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "achievement-email-error" : undefined} />
          {errors.email ? <p id="achievement-email-error" className="achievement-field-error">Escribe un correo válido.</p> : null}

          <fieldset className="achievement-rating" aria-describedby={errors.rating ? "achievement-rating-error" : undefined}>
            <legend>¿Cuánto te ha gustado el juego?</legend>
            <div>
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}>
                  <input type="radio" name="achievement-rating" value={value} checked={rating === value} onChange={() => setRating(value)} />
                  <span><Star aria-hidden /></span>
                  <span className="sr-only">{value} {value === 1 ? "estrella" : "estrellas"}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {errors.rating ? <p id="achievement-rating-error" className="achievement-field-error">Elige de 1 a 5 estrellas.</p> : null}

          <label htmlFor="achievement-message">Mensaje opcional</label>
          <textarea id="achievement-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={600} rows={4} placeholder="¿Qué momento del parque recordarás?" aria-invalid={Boolean(errors.message)} />
          <small className="achievement-character-count">{message.length}/600</small>
        </div>

        <section className="achievement-stats" aria-label="Estadísticas que se enviarán">
          <div><Clock3 aria-hidden /><span><small>Tiempo activo desde esta versión</small><strong>{formatPlayTime(stats.activePlaySeconds)}</strong></span></div>
          <div><FerrisWheel aria-hidden /><span><small>Jornadas · parques perfectos</small><strong>{stats.finishedDays} · {stats.perfectDays}</strong></span></div>
          <p>{stats.completedAttractions} atracciones completadas en total · 6 retos superados</p>
          <small>El tiempo jugado antes de esta actualización no puede reconstruirse.</small>
        </section>

        <label className="achievement-consent">
          <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} aria-invalid={Boolean(errors.consent)} />
          <span>Acepto enviar mi nombre, correo, valoración, mensaje y las estadísticas mostradas a Pentonúi Games.</span>
        </label>
        {errors.consent ? <p className="achievement-field-error">Confirma el envío voluntario de estos datos.</p> : null}

        <label className="achievement-honeypot" aria-hidden="true">
          Sitio web
          <input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} />
        </label>

        {Object.keys(errors).length > 0 ? <p className="achievement-form-status is-error" role="alert">Revisa los campos señalados antes de enviar.</p> : null}
        {state === "error" ? <p className="achievement-form-status is-error" role="alert">No se ha enviado nada. Puedes revisar los datos e intentarlo de nuevo.</p> : null}
        <div className="achievement-form-actions">
          <Button size="lg" type="submit" disabled={state === "submitting"}><Send aria-hidden /> {state === "submitting" ? "Enviando…" : state === "error" ? "Reintentar envío" : "Enviar mi hazaña"}</Button>
          <Button size="lg" variant="secondary" onClick={onCancel} disabled={state === "submitting"}>Cancelar por ahora</Button>
        </div>
      </form>
    </dialog>
  );
}
