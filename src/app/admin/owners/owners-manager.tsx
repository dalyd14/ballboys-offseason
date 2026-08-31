"use client";

import { useState } from "react";
import {
  PlusIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
  UnlockIcon,
} from "@/components/icons";

interface OwnerRow {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  ownerName: string | null;
  teamName: string | null;
  createdAt: Date;
}

interface OwnersManagerProps {
  owners: OwnerRow[];
  createAction: (email: string, password: string, ownerName: string, teamName: string) => Promise<{ error: string | null }>;
  updateProfileAction: (ownerId: string, ownerName: string, teamName: string, email: string) => Promise<{ error: string | null }>;
  resetPasswordAction: (ownerId: string, newPassword: string) => Promise<{ error: string | null }>;
  deleteAction: (ownerId: string) => Promise<{ error: string | null }>;
  toggleRoleAction: (ownerId: string, role: "user" | "admin") => Promise<{ error: string | null }>;
}

export function OwnersManager({
  owners,
  createAction,
  updateProfileAction,
  resetPasswordAction,
  deleteAction,
  toggleRoleAction,
}: OwnersManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-fg-muted">
          {owners.length} {owners.length === 1 ? "owner" : "owners"} in the league
        </p>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <PlusIcon className="h-4 w-4" />
            Add Owner
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <CreateOwnerForm
          createAction={createAction}
          onCancel={() => setShowCreateForm(false)}
          onCreated={() => setShowCreateForm(false)}
        />
      )}

      {/* Owners table — desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-line sm:block">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-elevated/50">
            <tr>
              <th className={thClass}>Owner</th>
              <th className={thClass}>Team</th>
              <th className={thClass}>Email</th>
              <th className={`${thClass} text-center`}>Role</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {owners.map((owner) => (
              <OwnerTableRow
                key={owner.id}
                owner={owner}
                updateProfileAction={updateProfileAction}
                resetPasswordAction={resetPasswordAction}
                deleteAction={deleteAction}
                toggleRoleAction={toggleRoleAction}
              />
            ))}
            {owners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-fg-muted">
                  No owners yet. Click "Add Owner" to create the first account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Owners cards — mobile */}
      <div className="space-y-3 sm:hidden">
        {owners.map((owner) => (
          <OwnerCard
            key={owner.id}
            owner={owner}
            updateProfileAction={updateProfileAction}
            resetPasswordAction={resetPasswordAction}
            deleteAction={deleteAction}
            toggleRoleAction={toggleRoleAction}
          />
        ))}
        {owners.length === 0 && (
          <div className="rounded-xl border border-line bg-surface p-8 text-center text-[13px] text-fg-muted">
            No owners yet. Tap "Add Owner" to create the first account.
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Create Owner Form ----

function CreateOwnerForm({
  createAction,
  onCancel,
  onCreated,
}: {
  createAction: (email: string, password: string, ownerName: string, teamName: string) => Promise<{ error: string | null }>;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createAction(email, password, ownerName, teamName);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      onCreated();
    }
  };

  const inputClass = "w-full rounded-lg border border-line bg-elevated px-3 py-2 text-[14px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none";

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h3 className="mb-4 text-[14px] font-semibold text-fg">Create New Owner Account</h3>
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-[12px] text-fg-subtle">Owner Name</label>
          <input
            required
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className={inputClass}
            placeholder="John Smith"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[12px] text-fg-subtle">Team Name</label>
          <input
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className={inputClass}
            placeholder="Must match ESPN exactly"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[12px] text-fg-subtle">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[12px] text-fg-subtle">Password</label>
          <input
            required
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Temporary password"
          />
        </div>
        <div className="col-span-1 flex flex-wrap gap-3 pt-2 sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {loading ? "Creating..." : "Create Owner"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line bg-elevated px-5 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-hover"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- Owner Table Row ----

function OwnerTableRow({
  owner,
  updateProfileAction,
  resetPasswordAction,
  deleteAction,
  toggleRoleAction,
}: {
  owner: OwnerRow;
  updateProfileAction: (ownerId: string, ownerName: string, teamName: string, email: string) => Promise<{ error: string | null }>;
  resetPasswordAction: (ownerId: string, newPassword: string) => Promise<{ error: string | null }>;
  deleteAction: (ownerId: string) => Promise<{ error: string | null }>;
  toggleRoleAction: (ownerId: string, role: "user" | "admin") => Promise<{ error: string | null }>;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [ownerName, setOwnerName] = useState(owner.ownerName ?? "");
  const [teamName, setTeamName] = useState(owner.teamName ?? "");
  const [email, setEmail] = useState(owner.email);

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    const res = await updateProfileAction(owner.id, ownerName, teamName, email);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setEditing(false);
    }
  };

  const handleResetPassword = async () => {
    setBusy(true);
    setError(null);
    const res = await resetPasswordAction(owner.id, newPassword);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setShowPasswordReset(false);
      setNewPassword("");
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    const res = await deleteAction(owner.id);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleRole = async () => {
    setBusy(true);
    setError(null);
    const newRole = owner.role === "admin" ? "user" : "admin";
    const res = await toggleRoleAction(owner.id, newRole);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    }
  };

  const inputClass = "w-full rounded border border-line bg-elevated px-2 py-1 text-[13px] text-fg focus:border-accent focus:outline-none";

  return (
    <>
      {error && (
        <tr>
          <td colSpan={5} className="px-3 py-2">
            <ErrorBanner message={error} />
          </td>
        </tr>
      )}
      <tr className="transition-colors hover:bg-hover/50">
        <td className="px-3 py-2.5">
          {editing ? (
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputClass} />
          ) : (
            <div>
              <p className="text-[13px] font-medium text-fg">{owner.ownerName ?? owner.name}</p>
              <p className="text-[11px] text-fg-subtle">Joined {owner.createdAt.toLocaleDateString()}</p>
            </div>
          )}
        </td>
        <td className="px-3 py-2.5">
          {editing ? (
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputClass} />
          ) : (
            <span className="text-[13px] text-fg-muted">{owner.teamName ?? "—"}</span>
          )}
        </td>
        <td className="px-3 py-2.5">
          {editing ? (
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          ) : (
            <span className="text-[13px] text-fg-muted">{owner.email}</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-center">
          <button
            onClick={handleToggleRole}
            disabled={busy}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-40 ${
              owner.role === "admin"
                ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
                : "border-line bg-elevated text-fg-subtle hover:bg-hover"
            }`}
          >
            {owner.role === "admin" ? "Admin" : "User"}
          </button>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center justify-end gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="rounded-lg bg-accent px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setError(null); }}
                  disabled={busy}
                  className="rounded-lg border border-line bg-elevated px-3 py-1 text-[12px] font-medium text-fg-muted transition-colors hover:bg-hover disabled:opacity-40"
                >
                  Cancel
                </button>
              </>
            ) : showPasswordReset ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-32 rounded border border-line bg-elevated px-2 py-1 text-[12px] text-fg focus:border-accent focus:outline-none"
                />
                <button
                  onClick={handleResetPassword}
                  disabled={busy || !newPassword}
                  className="rounded-lg bg-accent px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                >
                  Reset
                </button>
                <button
                  onClick={() => { setShowPasswordReset(false); setNewPassword(""); setError(null); }}
                  disabled={busy}
                  className="rounded-lg border border-line bg-elevated px-3 py-1 text-[12px] font-medium text-fg-muted transition-colors hover:bg-hover"
                >
                  Cancel
                </button>
              </div>
            ) : showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-danger">Sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="rounded-lg bg-danger px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-danger/80 disabled:opacity-40"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={busy}
                  className="rounded-lg border border-line bg-elevated px-3 py-1 text-[12px] font-medium text-fg-muted transition-colors hover:bg-hover"
                >
                  No
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-[12px] text-accent hover:underline"
                >
                  Edit
                </button>
                <span className="text-fg-subtle">·</span>
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="text-[12px] text-accent hover:underline"
                >
                  Reset PW
                </button>
                <span className="text-fg-subtle">·</span>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-[12px] text-danger hover:underline"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}

const thClass = "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";

// ---- Mobile Owner Card ----

function OwnerCard({
  owner,
  updateProfileAction,
  resetPasswordAction,
  deleteAction,
  toggleRoleAction,
}: {
  owner: OwnerRow;
  updateProfileAction: (ownerId: string, ownerName: string, teamName: string, email: string) => Promise<{ error: string | null }>;
  resetPasswordAction: (ownerId: string, newPassword: string) => Promise<{ error: string | null }>;
  deleteAction: (ownerId: string) => Promise<{ error: string | null }>;
  toggleRoleAction: (ownerId: string, role: "user" | "admin") => Promise<{ error: string | null }>;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [ownerName, setOwnerName] = useState(owner.ownerName ?? "");
  const [teamName, setTeamName] = useState(owner.teamName ?? "");
  const [email, setEmail] = useState(owner.email);

  const inputClass = "w-full rounded-lg border border-line bg-elevated px-3 py-2 text-[14px] text-fg focus:border-accent focus:outline-none";

  const handleSave = async () => {
    setBusy(true); setError(null);
    const res = await updateProfileAction(owner.id, ownerName, teamName, email);
    setBusy(false);
    if (res.error) setError(res.error); else setEditing(false);
  };

  const handleResetPassword = async () => {
    setBusy(true); setError(null);
    const res = await resetPasswordAction(owner.id, newPassword);
    setBusy(false);
    if (res.error) { setError(res.error); } else { setShowPasswordReset(false); setNewPassword(""); }
  };

  const handleDelete = async () => {
    setBusy(true); setError(null);
    const res = await deleteAction(owner.id);
    setBusy(false);
    if (res.error) setError(res.error); else setShowDeleteConfirm(false);
  };

  const handleToggleRole = async () => {
    setBusy(true); setError(null);
    const newRole = owner.role === "admin" ? "user" : "admin";
    const res = await toggleRoleAction(owner.id, newRole);
    setBusy(false);
    if (res.error) setError(res.error);
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      {error && <div className="mb-3"><ErrorBanner message={error} /></div>}

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] text-fg-subtle">Owner Name</label>
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-fg-subtle">Team Name</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-fg-subtle">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={busy} className="flex-1 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40">
              Save
            </button>
            <button onClick={() => { setEditing(false); setError(null); }} disabled={busy} className="rounded-lg border border-line bg-elevated px-4 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-hover disabled:opacity-40">
              Cancel
            </button>
          </div>
        </div>
      ) : showPasswordReset ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] text-fg-subtle">New Password</label>
            <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="New temporary password" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleResetPassword} disabled={busy || !newPassword} className="flex-1 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40">
              Reset Password
            </button>
            <button onClick={() => { setShowPasswordReset(false); setNewPassword(""); setError(null); }} disabled={busy} className="rounded-lg border border-line bg-elevated px-4 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-hover disabled:opacity-40">
              Cancel
            </button>
          </div>
        </div>
      ) : showDeleteConfirm ? (
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-danger">Delete {owner.ownerName ?? owner.name}?</span>
          <button onClick={handleDelete} disabled={busy} className="ml-auto rounded-lg bg-danger px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-danger/80 disabled:opacity-40">
            Delete
          </button>
          <button onClick={() => setShowDeleteConfirm(false)} disabled={busy} className="rounded-lg border border-line bg-elevated px-3 py-1.5 text-[12px] font-medium text-fg-muted transition-colors hover:bg-hover disabled:opacity-40">
            No
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-fg">{owner.ownerName ?? owner.name}</p>
              <p className="truncate text-[12px] text-fg-subtle">{owner.email}</p>
            </div>
            <button
              onClick={handleToggleRole}
              disabled={busy}
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-40 ${
                owner.role === "admin"
                  ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
                  : "border-line bg-elevated text-fg-subtle hover:bg-hover"
              }`}
            >
              {owner.role === "admin" ? "Admin" : "User"}
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-fg-muted">Team: {owner.teamName ?? "—"}</p>
          <div className="mt-3 flex gap-3 border-t border-line pt-3">
            <button onClick={() => setEditing(true)} className="text-[13px] text-accent hover:underline">Edit</button>
            <span className="text-fg-subtle">·</span>
            <button onClick={() => setShowPasswordReset(true)} className="text-[13px] text-accent hover:underline">Reset PW</button>
            <span className="text-fg-subtle">·</span>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-[13px] text-danger hover:underline">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
      {message}
    </div>
  );
}
