import { json, requireUser } from "@/canary/auth";
import { getAnalysis, getGaps, getResolutions } from "@/canary/store";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (user instanceof Response) return user;
  return json({ analysis: getAnalysis(), resolutions: getResolutions(), gaps: getGaps() });
}
