import { getUser, json, USERS } from "@/canary/auth";

export async function GET(req: Request) {
  const user = getUser(req);
  // The persona list is public so the sign-in form can offer it; passwords are not.
  const personas = USERS.map(({ id, name, team, role }) => ({ id, name, team, role }));
  return json({ user, personas });
}
