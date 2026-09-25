import { createFileRoute } from "@tanstack/react-router";
import { handleAchievement } from "@/lib/achievement.server";

const handle = ({ request }: { request: Request }) => handleAchievement(request);

export const Route = createFileRoute("/api/achievement")({
  server: { handlers: { POST: handle } },
});
