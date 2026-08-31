"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/session";
import { resetRoster, submitRoster } from "@/lib/data";
import { logEvent } from "@/lib/data";
import type { PlayerAction } from "@/lib/types";

export async function resetRosterAction(formData: FormData) {
  const owner = await requireOwner();
  const seasonId = formData.get("seasonId") as string;

  await resetRoster(seasonId, owner.id);
  await logEvent(seasonId, "roster_reset", { owner: owner.email }, owner.id, owner.id);

  revalidatePath("/submit-roster");
  revalidatePath("/my-team");
}

export async function submitRosterAction(
  seasonId: string,
  ownerEmail: string,
  moves: {
    playerId: string;
    action: PlayerAction;
    newContract: number | null;
    newNegotiationAvailable: boolean;
    yearDebit: number;
  }[],
): Promise<{ error: string | null }> {
  const owner = await requireOwner();

  if (owner.email !== ownerEmail) {
    return { error: "Unauthorized" };
  }

  if (!owner.canSubmit || owner.rosterSubmitted) {
    return { error: "You are not allowed to submit right now" };
  }

  try {
    await submitRoster(seasonId, owner.id, moves);
    await logEvent(
      seasonId,
      "roster_submitted",
      { movesCount: moves.length },
      owner.id,
      owner.id,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Submission failed" };
  }

  revalidatePath("/submit-roster");
  revalidatePath("/my-team");
  revalidatePath("/other-teams");

  return { error: null };
}
