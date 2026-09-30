import { getAnalysis } from "@/canary/store";
import CanaryLive from "./canary-app";

export default function Home() {
  // Only counts reach the sign-in page. Everything else needs a session.
  const { stats, issues } = getAnalysis();
  return <CanaryLive publicStats={{ docs: stats.docs, claims: stats.claims, issues: issues.length }} />;
}
