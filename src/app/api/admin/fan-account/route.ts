import { isStoreAdmin } from "@/lib/admin-auth";
import { fanAccountBranches, fanConfiguration } from "@/lib/fan";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  if (!isStoreAdmin(request)) return Response.json({ error: "Acces interzis." }, { status: 401, headers });
  const config = fanConfiguration();
  if (!config.username || !config.password) return Response.json({ error: "Datele API FAN nu sunt configurate." }, { status: 503, headers });
  try {
    const branches = await fanAccountBranches();
    return Response.json({ branches, configuredClientId: config.clientId || null,
      clientIdValid: branches.some((branch) => String(branch.id) === config.clientId) }, { headers });
  } catch {
    return Response.json({ error: "Autentificarea FAN sau lista sucursalelor nu a putut fi verificată." }, { status: 503, headers });
  }
}
