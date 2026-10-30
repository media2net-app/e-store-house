import { isStoreAdmin } from "@/lib/admin-auth";
import { fanAccountBranches, fanConfiguration, fanInternalTariff } from "@/lib/fan";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  if (!isStoreAdmin(request)) return Response.json({ error: "Acces interzis." }, { status: 401, headers });
  const config = fanConfiguration();
  if (!config.username || !config.password) return Response.json({ error: "Datele API FAN nu sunt configurate." }, { status: 503, headers });
  try {
    const branches = await fanAccountBranches();
    const clientIdValid = branches.some((branch) => String(branch.id) === config.clientId);
    let referenceTariff = null;
    let referenceCodTariff = null;
    let tariffError = null;
    if (clientIdValid) {
      try {
        const destination = { clientId: config.clientId!, county: "Bucuresti", locality: "Bucuresti",
          parcel: { weight: 1, length: 10, width: 10, height: 10 } };
        const [standard, cod] = await Promise.all([
          fanInternalTariff({ ...destination, service: "Standard" }),
          fanInternalTariff({ ...destination, service: "Cont Colector" }),
        ]);
        referenceTariff = { ...standard, contractFirstKgMatches: Math.abs(standard.weightCost - 13) < 0.02 };
        referenceCodTariff = { ...cod, codSurcharge: cod.weightCost - standard.weightCost,
          contractCodSurchargeMatches: Math.abs(cod.weightCost - standard.weightCost - 5.5) < 0.02 };
      } catch {
        tariffError = "Estimarea tarifului FAN nu a putut fi verificată.";
      }
    }
    return Response.json({ branches, configuredClientId: config.clientId || null,
      clientIdValid, referenceTariff, referenceCodTariff, tariffError }, { headers });
  } catch {
    return Response.json({ error: "Autentificarea FAN sau lista sucursalelor nu a putut fi verificată." }, { status: 503, headers });
  }
}
