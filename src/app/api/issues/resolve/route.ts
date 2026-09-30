import { json, readJson, requireUser, userIdForOwner } from "@/canary/auth";
import { getAnalysis, getResolutions, resolveIssue } from "@/canary/store";

export async function POST(req: Request) {
  const user = requireUser(req, { mutation: true });
  if (user instanceof Response) return user;

  const body = await readJson(req, 2_048);
  if (body instanceof Response) return body;
  const issueId = typeof body.issue_id === "string" ? body.issue_id.slice(0, 200) : "";
  const action = body.action === "approve" ? "approved" : body.action === "dismiss" ? "dismissed" : null;
  if (!issueId || !action) return json({ error: "issue_id and action (approve | dismiss) are required" }, 400);

  // The owner is looked up server-side from the issue itself. The client cannot claim ownership,
  // so changing the issue id in the request does not let anyone act on someone else's content.
  const issue = getAnalysis().issues.find((i) => i.id === issueId);
  if (!issue) return json({ error: "Unknown issue" }, 404);
  const isOwner = userIdForOwner(issue.owner.name) === user.id;
  if (!isOwner && user.role !== "admin") {
    return json({ error: `Only ${issue.owner.name} (owner) or a knowledge admin can resolve this issue` }, 403);
  }
  // A decision is final for owners; only an admin can overturn it.
  if (getResolutions().some((r) => r.issue_id === issue.id) && user.role !== "admin") {
    return json({ error: "This issue was already resolved. Ask a knowledge admin to reopen it." }, 409);
  }

  const resolution = { issue_id: issue.id, action, by: user.name, at: new Date().toISOString() } as const;
  resolveIssue(resolution);
  return json({ resolution });
}
