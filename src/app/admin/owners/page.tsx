import { getOwners, getActiveSeason } from "@/lib/data";
import { OwnerManager } from "./owner-manager";
import { updateOwnerBudgetAction, updateOwnerLockAction } from "../actions";

export default async function AdminOwnersPage() {
  const [owners, season] = await Promise.all([
    getOwners(),
    getActiveSeason(),
  ]);

  if (!season) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">No active season.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-bold">Owners — Budgets & Submission Locks</h2>
      <p className="mb-4 text-sm text-gray-600">
        Set each owner&apos;s salary cap years and renegotiation tokens for the{" "}
        {season.year} offseason. Toggle &quot;Can Submit&quot; to open/close
        each owner&apos;s submission window.
      </p>
      <OwnerManager
        owners={owners.map((o) => ({
          id: o.id,
          ownerName: o.ownerName ?? o.name,
          teamName: o.teamName ?? "",
          email: o.email,
          availableYears: o.availableYears,
          availableNegotiations: o.availableNegotiations,
          canSubmit: o.canSubmit,
          rosterSubmitted: o.rosterSubmitted,
        }))}
        seasonId={season.id}
        baseCapYears={season.baseCapYears}
        baseNegotiations={season.baseNegotiations}
        updateBudgetAction={updateOwnerBudgetAction}
        updateLockAction={updateOwnerLockAction}
      />
    </div>
  );
}
