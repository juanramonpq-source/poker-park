import { z } from "zod";

export const CHALLENGE_IDS = ["classic", "night", "festival", "mirror", "storm", "impossible"] as const;
export const MIN_ACHIEVEMENT_FORM_AGE_MS = 2_000;

const trimmedText = (maximum: number) => z.string().trim().max(maximum);
const safeCounter = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

const baseAchievementSchema = z.object({
  name: trimmedText(80).min(1),
  email: trimmedText(254).toLowerCase().pipe(z.email().max(254)),
  rating: z.number().int().min(1).max(5),
  message: trimmedText(600).optional().default(""),
  stats: z.object({
    activePlaySeconds: safeCounter,
    finishedDays: safeCounter,
    perfectDays: safeCounter,
    completedAttractions: safeCounter,
  }).strict(),
  completedChallenges: z.array(z.enum(CHALLENGE_IDS)).length(CHALLENGE_IDS.length)
    .refine(challenges => new Set(challenges).size === CHALLENGE_IDS.length, "Los retos deben ser únicos"),
  consent: z.literal(true),
  website: z.literal(""),
  formStartedAt: z.number().int().positive(),
}).strict();

function withHumanTiming(now: () => number) {
  return baseAchievementSchema.superRefine((submission, context) => {
    const age = now() - submission.formStartedAt;
    if (age < MIN_ACHIEVEMENT_FORM_AGE_MS) {
      context.addIssue({
        code: "custom",
        path: ["formStartedAt"],
        message: "El formulario se ha enviado demasiado rápido",
      });
    }
  });
}

export const achievementSchema = withHumanTiming(Date.now);
export type AchievementSubmission = z.infer<typeof baseAchievementSchema>;

export function normalizeAchievementSubmission(
  input: unknown,
  now = Date.now(),
): AchievementSubmission {
  return withHumanTiming(() => now).parse(input);
}
