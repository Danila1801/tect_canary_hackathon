import { json, requireUser } from "@/lib/auth";
import { getAnalysis, getGaps, getResolutions } from "@/lib/store";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (user instanceof Response) return user;
  return json({ analysis: getAnalysis(), resolutions: getResolutions(), gaps: getGaps() });
}
