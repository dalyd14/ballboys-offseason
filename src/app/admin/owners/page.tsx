import { getOwners } from "@/lib/data";
import { OwnersManager } from "./owners-manager";
import {
  createOwnerAction,
  updateOwnerProfileAction,
  resetOwnerPasswordAction,
  deleteOwnerAction,
  toggleOwnerRoleAction,
} from "../actions";

export default async function AdminOwnersPage() {
  const owners = await getOwners();

  return (
    <OwnersManager
      owners={owners.map((o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        role: o.role,
        ownerName: o.ownerName,
        teamName: o.teamName,
        createdAt: o.createdAt,
      }))}
      createAction={createOwnerAction}
      updateProfileAction={updateOwnerProfileAction}
      resetPasswordAction={resetOwnerPasswordAction}
      deleteAction={deleteOwnerAction}
      toggleRoleAction={toggleOwnerRoleAction}
    />
  );
}
