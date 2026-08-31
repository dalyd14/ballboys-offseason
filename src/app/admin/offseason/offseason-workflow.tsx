"use client";

import { useState } from "react";
import type { Season, SeasonStatus, Player } from "@/lib/types";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LockIcon,
  UnlockIcon,
  PlusIcon,
} from "@/components/icons";

interface OwnerRow {
  id: string;
  ownerName: string;
  teamName: string;
  email: string;
  availableYears: number;
  availableNegotiations: number;
  canSubmit: boolean;
  rosterSubmitted: boolean;
}

interface SeasonChecklistData {
  season: Season;
  players: Player[];
  playerCount: number;
  exceptionCount: number;
  draftPoolCount: number;
  submittedCount: number;
  exceptions: {
    id: string;
    playerName: string;
    nflTeam: string;
    position: string;
    ownerName: string;
    contractYearsAtCut: number | null;
    ownerId: string | null;
  }[];
  draftCandidates: {
    id: string;
    playerName: string;
    nflTeam: string;
    position: string;
    ownerName: string;
  }[];
}

interface OffseasonWorkflowProps {
  seasonData: SeasonChecklistData[];
  owners: OwnerRow[];
  ownerTeamMap: { ownerId: string; teamName: string; ownerName: string }[];
  ownerOptions: { id: string; name: string }[];
  createAction: (year: number, baseCapYears: number, baseNegotiations: number) => Promise<{ error: string | null }>;
  updateStatusAction: (seasonId: string, status: SeasonStatus) => Promise<{ error: string | null }>;
  rolloverAction: (seasonId: string) => Promise<{ error: string | null; affected: number }>;
  importAction: (seasonId: string, html: string, ownerTeamMap: { ownerId: string; teamName: string }[]) => Promise<{
    error: string | null;
    imported: number;
    teamsImported: number;
    unmatchedTeams: string[];
    totalPlayers: number;
  }>;
  updateBudgetAction: (ownerId: string, availableYears: number, availableNegotiations: number, seasonId: string) => Promise<{ error: string | null }>;
  updateLockAction: (ownerId: string, canSubmit: boolean, seasonId: string) => Promise<{ error: string | null }>;
  resolveExceptionAction: (playerId: string, resolution: "trade" | "cut" | "pickup", newOwnerId: string | null, seasonId: string) => Promise<{ error: string | null }>;
  markCutAction: (playerId: string, ownerId: string, contractYearsAtCut: number, seasonId: string) => Promise<{ error: string | null; penalty: number }>;
}

export function OffseasonWorkflow({
  seasonData,
  owners,
  ownerTeamMap,
  ownerOptions,
  createAction,
  updateStatusAction,
  rolloverAction,
  importAction,
  updateBudgetAction,
  updateLockAction,
  resolveExceptionAction,
  markCutAction,
}: OffseasonWorkflowProps) {
  // Track which season cards are expanded. Active season starts expanded.
  const activeSeasonId = seasonData.find((s) =>
    ["setup", "open", "locked"].includes(s.season.status)
  )?.season.id;
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(
    activeSeasonId ? new Set([activeSeasonId]) : new Set(),
  );

  const [showCreateForm, setShowCreateForm] = useState(seasonData.length === 0);

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Create New Season button / form */}
      <div className="rounded-xl border border-line bg-surface p-5">
        {showCreateForm ? (
          <CreateSeasonForm
            createAction={createAction}
            onCancel={() => setShowCreateForm(false)}
            onCreated={() => setShowCreateForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 text-[14px] font-medium text-accent transition-colors hover:text-accent-hover"
          >
            <PlusIcon className="h-4 w-4" />
            Create New Season
          </button>
        )}
      </div>

      {/* Season cards */}
      <div className="space-y-4">
        {seasonData.map(({ season, playerCount, exceptionCount, draftPoolCount, submittedCount, exceptions, draftCandidates }) => {
          const isActive = ["setup", "open", "locked"].includes(season.status);
          const isExpanded = expandedSeasons.has(season.id);

          // Checklist state for this season
          const hasPlayers = playerCount > 0;
          const rolloverDone = season.rolloverCompleted;
          const exceptionsResolved = exceptionCount === 0;

          const completedCount = [
            hasPlayers,
            rolloverDone,
            exceptionsResolved,
          ].filter(Boolean).length;

          return (
            <div
              key={season.id}
              className={`overflow-hidden rounded-xl border transition-colors ${
                isActive
                  ? "border-accent/30 bg-surface"
                  : "border-line bg-surface"
              }`}
            >
              {/* Season header */}
              <button
                onClick={() => toggleSeason(season.id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-hover/50 sm:gap-4 sm:px-5"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 shrink-0 text-fg-subtle" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-fg-subtle" />
                )}
                <span className="shrink-0 text-[18px] font-semibold text-fg">{season.year}</span>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                  isActive
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-line bg-elevated text-fg-subtle"
                }`}>
                  {season.status}
                </span>
                {isActive && (
                  <span className="hidden text-[13px] text-fg-muted sm:inline">
                    {completedCount}/3 steps complete
                  </span>
                )}
                {!isActive && (
                  <span className="hidden text-[13px] text-fg-subtle sm:inline">
                    {playerCount} players
                  </span>
                )}
              </button>

              {/* Expanded checklist */}
              {isExpanded && (
                <div className="border-t border-line px-5 py-5">
                  <SeasonChecklist
                    season={season}
                    owners={owners}
                    playerCount={playerCount}
                    exceptionCount={exceptionCount}
                    draftPoolCount={draftPoolCount}
                    submittedCount={submittedCount}
                    exceptions={exceptions}
                    draftCandidates={draftCandidates}
                    ownerTeamMap={ownerTeamMap}
                    ownerOptions={ownerOptions}
                    updateStatusAction={updateStatusAction}
                    rolloverAction={rolloverAction}
                    importAction={importAction}
                    updateBudgetAction={updateBudgetAction}
                    updateLockAction={updateLockAction}
                    resolveExceptionAction={resolveExceptionAction}
                    markCutAction={markCutAction}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Create Season Form ----

function CreateSeasonForm({
  createAction,
  onCancel,
  onCreated,
}: {
  createAction: (year: number, baseCapYears: number, baseNegotiations: number) => Promise<{ error: string | null }>;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [capYears, setCapYears] = useState(8);
  const [negotiations, setNegotiations] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createAction(year, capYears, negotiations);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      onCreated();
    }
  };

  const inputClass = "w-24 rounded-lg border border-line bg-elevated px-3 py-2 text-[14px] text-fg focus:border-accent focus:outline-none";

  return (
    <div className="space-y-4">
      <h3 className="text-[14px] font-semibold text-fg">Create New Season</h3>
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1.5">
          <label className="block text-[12px] text-fg-subtle">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[12px] text-fg-subtle">Base Cap Years</label>
          <input type="number" value={capYears} onChange={(e) => setCapYears(parseInt(e.target.value))} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[12px] text-fg-subtle">Base Negotiations</label>
          <input type="number" value={negotiations} onChange={(e) => setNegotiations(parseInt(e.target.value))} className={inputClass} />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {loading ? "Creating..." : "Create Season"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line bg-elevated px-4 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-hover"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- Season Checklist ----

function SeasonChecklist({
  season,
  owners,
  playerCount,
  exceptionCount,
  draftPoolCount,
  submittedCount,
  exceptions,
  draftCandidates,
  ownerTeamMap,
  ownerOptions,
  updateStatusAction,
  rolloverAction,
  importAction,
  updateBudgetAction,
  updateLockAction,
  resolveExceptionAction,
  markCutAction,
}: {
  season: Season;
  owners: OwnerRow[];
  playerCount: number;
  exceptionCount: number;
  draftPoolCount: number;
  submittedCount: number;
  exceptions: SeasonChecklistData["exceptions"];
  draftCandidates: SeasonChecklistData["draftCandidates"];
  ownerTeamMap: { ownerId: string; teamName: string; ownerName: string }[];
  ownerOptions: { id: string; name: string }[];
  updateStatusAction: (seasonId: string, status: SeasonStatus) => Promise<{ error: string | null }>;
  rolloverAction: (seasonId: string) => Promise<{ error: string | null; affected: number }>;
  importAction: (seasonId: string, html: string, ownerTeamMap: { ownerId: string; teamName: string }[]) => Promise<{
    error: string | null;
    imported: number;
    teamsImported: number;
    unmatchedTeams: string[];
    totalPlayers: number;
  }>;
  updateBudgetAction: (ownerId: string, availableYears: number, availableNegotiations: number, seasonId: string) => Promise<{ error: string | null }>;
  updateLockAction: (ownerId: string, canSubmit: boolean, seasonId: string) => Promise<{ error: string | null }>;
  resolveExceptionAction: (playerId: string, resolution: "trade" | "cut" | "pickup", newOwnerId: string | null, seasonId: string) => Promise<{ error: string | null }>;
  markCutAction: (playerId: string, ownerId: string, contractYearsAtCut: number, seasonId: string) => Promise<{ error: string | null; penalty: number }>;
}) {
  const [openStep, setOpenStep] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenStep(openStep === id ? null : id);
  };

  const hasPlayers = playerCount > 0;
  const rolloverDone = season.rolloverCompleted;
  const exceptionsResolved = exceptionCount === 0;

  const steps = [
    {
      id: "import-rosters",
      title: "Import ESPN Rosters",
      description: "Upload the ESPN League Roster HTML export to load all players.",
      done: hasPlayers,
      canDo: true,
    },
    {
      id: "run-rollover",
      title: "Run Rollover",
      description: "Decrement all contract years by 1. Players at 0 years go to the draft pool.",
      done: rolloverDone,
      canDo: hasPlayers,
    },
    {
      id: "review-exceptions",
      title: "Review Exceptions",
      description: "Handle in-season cuts, trades, and pickups.",
      done: exceptionsResolved,
      canDo: rolloverDone,
    },
    {
      id: "owners-budgets",
      title: "Set Owner Budgets & Locks",
      description: "Review auto-calculated caps, adjust for trades, and open/close submissions.",
      done: false,
      canDo: rolloverDone,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Status selector */}
      <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-[12px] text-fg-subtle">Status:</span>
        <select
          value={season.status}
          onChange={async (e) => {
            await updateStatusAction(season.id, e.target.value as SeasonStatus);
          }}
          className="rounded-lg border border-line bg-elevated px-3 py-1.5 text-[13px] text-fg focus:border-accent focus:outline-none"
        >
          <option value="setup">setup</option>
          <option value="open">open</option>
          <option value="locked">locked</option>
          <option value="archived">archived</option>
        </select>
        <span className="text-[12px] text-fg-subtle">·</span>
        <span className="text-[12px] text-fg-subtle">Cap: {season.baseCapYears}y / {season.baseNegotiations}n</span>
      </div>

      {/* Steps */}
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={`overflow-hidden rounded-lg border transition-colors ${
            step.done
              ? "border-success/20 bg-success/5"
              : step.canDo
                ? "border-line bg-elevated/50"
                : "border-line bg-elevated/30 opacity-50"
          }`}
        >
          <button
            onClick={() => step.canDo && toggle(step.id)}
            disabled={!step.canDo}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover/50 disabled:cursor-not-allowed"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center">
              {step.done ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15">
                  <CheckIcon className="h-4 w-4 text-success" />
                </span>
              ) : (
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[12px] font-semibold ${
                  step.canDo ? "border-accent/30 text-accent" : "border-line text-fg-subtle"
                }`}>
                  {i + 1}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium ${step.done ? "text-fg-muted" : "text-fg"}`}>
                {step.title}
              </p>
              <p className="text-[12px] text-fg-subtle">{step.description}</p>
            </div>

            {step.canDo && (
              <span className="text-fg-subtle">
                {openStep === step.id ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </span>
            )}
          </button>

          {openStep === step.id && step.canDo && (
            <div className="border-t border-line px-4 py-4">
              {step.id === "import-rosters" && (
                <ImportSection
                  seasonId={season.id}
                  seasonYear={season.year}
                  ownerTeamMap={ownerTeamMap}
                  importAction={importAction}
                />
              )}
              {step.id === "run-rollover" && (
                <RolloverSection
                  seasonId={season.id}
                  seasonYear={season.year}
                  playerCount={playerCount}
                  rolloverAction={rolloverAction}
                />
              )}
              {step.id === "review-exceptions" && (
                <ReviewSection
                  seasonId={season.id}
                  exceptions={exceptions}
                  draftCandidates={draftCandidates}
                  ownerOptions={ownerOptions}
                  resolveAction={resolveExceptionAction}
                  markCutAction={markCutAction}
                />
              )}
              {step.id === "owners-budgets" && (
                <OwnersBudgetSection
                  owners={owners}
                  seasonId={season.id}
                  baseCapYears={season.baseCapYears}
                  baseNegotiations={season.baseNegotiations}
                  submittedCount={submittedCount}
                  draftPoolCount={draftPoolCount}
                  updateBudgetAction={updateBudgetAction}
                  updateLockAction={updateLockAction}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Import Section ----

function ImportSection({
  seasonId,
  seasonYear,
  ownerTeamMap,
  importAction,
}: {
  seasonId: string;
  seasonYear: number;
  ownerTeamMap: { ownerId: string; teamName: string; ownerName: string }[];
  importAction: (seasonId: string, html: string, ownerTeamMap: { ownerId: string; teamName: string }[]) => Promise<{
    error: string | null;
    imported: number;
    teamsImported: number;
    unmatchedTeams: string[];
    totalPlayers: number;
  }>;
}) {
  const [html, setHtml] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; teamsImported: number; unmatchedTeams: string[] } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setHtml(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!html.trim()) {
      setError("Please upload an HTML file or paste the HTML content.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await importAction(seasonId, html, ownerTeamMap);
    setLoading(false);
    if (res.error && res.imported === 0) {
      setError(res.error);
    } else {
      setResult({ imported: res.imported, teamsImported: res.teamsImported, unmatchedTeams: res.unmatchedTeams });
      if (res.error) setError(res.error);
    }
  };

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      {result && (
        <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3">
          <p className="text-[13px] font-medium text-success">
            Imported {result.imported} players across {result.teamsImported} teams for {seasonYear}.
          </p>
          {result.unmatchedTeams.length > 0 && (
            <div className="mt-2">
              <p className="text-[13px] text-warning">Could not match these teams:</p>
              <ul className="mt-1 list-inside list-disc text-[13px] text-warning">
                {result.unmatchedTeams.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-[13px] text-fg-muted">
        Export the full <strong className="text-fg">League Roster</strong> page from ESPN as HTML, then upload below.
      </p>

      <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-[12px] text-fg-muted">
        <strong className="text-accent">Team name matching:</strong> Each owner's team name must match ESPN exactly.
        <ul className="mt-2 list-inside list-disc space-y-0.5">
          {ownerTeamMap.map((o) => (
            <li key={o.ownerId}>
              {o.ownerName} → &quot;{o.teamName || "(not set)"}&quot;
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-1 rounded-lg border border-line bg-elevated p-1 w-fit">
        <button
          type="button"
          onClick={() => { setInputMode("file"); setHtml(""); setError(null); }}
          className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${inputMode === "file" ? "bg-accent text-white" : "text-fg-muted hover:text-fg"}`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => { setInputMode("paste"); setHtml(""); setError(null); }}
          className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${inputMode === "paste" ? "bg-accent text-white" : "text-fg-muted hover:text-fg"}`}
        >
          Paste HTML
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {inputMode === "file" ? (
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleFileUpload}
            className="block w-full text-[13px] text-fg-muted file:mr-4 file:rounded-lg file:border-0 file:bg-elevated file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-fg hover:file:bg-hover"
          />
        ) : (
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="Paste the raw HTML from the ESPN League Roster page here..."
            rows={12}
            className="w-full rounded-lg border border-line bg-elevated px-3 py-2 font-mono text-[12px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        )}
        {html && <p className="text-[12px] text-fg-subtle">{html.length.toLocaleString()} characters loaded</p>}

        <button
          type="submit"
          disabled={loading || !html.trim()}
          className="rounded-lg bg-accent px-6 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {loading ? "Importing..." : `Import to ${seasonYear} Season`}
        </button>
      </form>
    </div>
  );
}

// ---- Rollover Section ----

function RolloverSection({
  seasonId,
  seasonYear,
  playerCount,
  rolloverAction,
}: {
  seasonId: string;
  seasonYear: number;
  playerCount: number;
  rolloverAction: (seasonId: string) => Promise<{ error: string | null; affected: number }>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  const handleRollover = async () => {
    if (!confirm("Run rollover? This decrements all contract years by 1.")) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await rolloverAction(seasonId);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setResult(res.affected);
    }
  };

  return (
    <div className="space-y-3">
      {error && <ErrorBanner message={error} />}
      {result !== null && (
        <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-[13px] font-medium text-success">
          Rollover complete: {result} players decremented for {seasonYear}.
        </div>
      )}
      <p className="text-[13px] text-fg-muted">
        {playerCount} players will have their contract years decremented by 1.
        Players reaching 0 years with no negotiation available will go to the draft pool.
      </p>
      <button
        onClick={handleRollover}
        disabled={loading}
        className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-2 text-[13px] font-medium text-warning transition-colors hover:bg-warning/10 disabled:opacity-40"
      >
        {loading ? "Running..." : "Run Rollover"}
      </button>
    </div>
  );
}

// ---- Review Exceptions Section ----

function ReviewSection({
  seasonId,
  exceptions,
  draftCandidates,
  ownerOptions,
  resolveAction,
  markCutAction,
}: {
  seasonId: string;
  exceptions: SeasonChecklistData["exceptions"];
  draftCandidates: SeasonChecklistData["draftCandidates"];
  ownerOptions: { id: string; name: string }[];
  resolveAction: (playerId: string, resolution: "trade" | "cut" | "pickup", newOwnerId: string | null, seasonId: string) => Promise<{ error: string | null }>;
  markCutAction: (playerId: string, ownerId: string, contractYearsAtCut: number, seasonId: string) => Promise<{ error: string | null; penalty: number }>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tradeOwner, setTradeOwner] = useState<Record<string, string>>({});

  const handleResolve = async (playerId: string, resolution: "trade" | "cut" | "pickup", ownerId: string | null) => {
    setBusy(playerId);
    setError(null);
    const newOwnerId = resolution === "trade" ? tradeOwner[playerId] ?? null : ownerId;
    const res = await resolveAction(playerId, resolution, newOwnerId, seasonId);
    setBusy(null);
    if (res.error) setError(res.error);
  };

  const thClass = "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";
  const tdClass = "px-3 py-2.5";

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}

      <div>
        <h4 className="mb-2 text-[13px] font-medium text-fg">
          In-Season Cuts <span className="text-fg-muted">({exceptions.length})</span>
        </h4>
        {exceptions.length === 0 ? (
          <p className="text-[13px] text-fg-muted">No in-season cuts flagged.</p>
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="space-y-2.5 sm:hidden">
              {exceptions.map((ex) => {
                const penalty = ex.contractYearsAtCut ? Math.ceil(ex.contractYearsAtCut / 2) : 0;
                return (
                  <div key={ex.id} className="rounded-xl border border-warning/20 bg-warning/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-medium text-fg">{ex.playerName}</p>
                      <span className="shrink-0 text-[12px] text-fg-subtle">{ex.position}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-fg-muted">
                      <div><span className="text-fg-subtle">Owner:</span> {ex.ownerName}</div>
                      <div><span className="text-fg-subtle">Years at cut:</span> <span className="font-semibold text-fg">{ex.contractYearsAtCut ?? "—"}</span></div>
                      {penalty > 0 && <div><span className="text-fg-subtle">Penalty:</span> <span className="font-semibold text-danger">−{penalty}y</span></div>}
                    </div>
                    <button
                      onClick={() => handleResolve(ex.id, "cut", ex.ownerId)}
                      disabled={busy === ex.id}
                      className="mt-2.5 w-full rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-40"
                    >
                      Send to Draft
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table */}
            <div className="hidden overflow-x-auto rounded-lg border border-line sm:block">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-elevated/50">
                  <tr>
                    <th className={thClass}>Player</th>
                    <th className={thClass}>Pos</th>
                    <th className={thClass}>Original Owner</th>
                    <th className={`${thClass} text-center`}>Years at Cut</th>
                    <th className={`${thClass} text-center`}>Penalty</th>
                    <th className={`${thClass} text-center`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {exceptions.map((ex) => {
                    const penalty = ex.contractYearsAtCut ? Math.ceil(ex.contractYearsAtCut / 2) : 0;
                    return (
                      <tr key={ex.id} className="transition-colors hover:bg-hover/50">
                        <td className={`${tdClass} font-medium text-fg`}>{ex.playerName}</td>
                        <td className={`${tdClass} text-fg-muted`}>{ex.position}</td>
                        <td className={`${tdClass} text-fg-muted`}>{ex.ownerName}</td>
                        <td className={`${tdClass} text-center font-semibold text-fg`}>{ex.contractYearsAtCut ?? "—"}</td>
                        <td className={`${tdClass} text-center font-semibold text-danger`}>{penalty > 0 ? `−${penalty}y` : "—"}</td>
                        <td className={tdClass}>
                          <button
                            onClick={() => handleResolve(ex.id, "cut", ex.ownerId)}
                            disabled={busy === ex.id}
                            className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-1 text-[12px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-40"
                          >
                            Send to Draft
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div>
        <h4 className="mb-1 text-[13px] font-medium text-fg">
          Draft-Eligible Players <span className="text-fg-muted">({draftCandidates.length})</span>
        </h4>
        <p className="mb-3 text-[12px] text-fg-subtle">
          Players with 0 contract years and no negotiation available.
        </p>
        {draftCandidates.length === 0 ? (
          <p className="text-[13px] text-fg-muted">No draft candidates.</p>
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="space-y-2.5 sm:hidden">
              {draftCandidates.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-fg">{p.playerName}</p>
                    <p className="text-[12px] text-fg-subtle">{p.position} · {p.ownerName}</p>
                  </div>
                  <button
                    onClick={() => handleResolve(p.id, "cut", null)}
                    disabled={busy === p.id}
                    className="shrink-0 rounded-lg border border-line bg-elevated px-3 py-2 text-[12px] font-medium text-fg-muted transition-colors hover:bg-hover disabled:opacity-40"
                  >
                    Send to Draft
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden overflow-x-auto rounded-lg border border-line sm:block">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-elevated/50">
                  <tr>
                    <th className={thClass}>Player</th>
                    <th className={thClass}>Pos</th>
                    <th className={thClass}>Owner</th>
                    <th className={`${thClass} text-center`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {draftCandidates.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-hover/50">
                      <td className={`${tdClass} font-medium text-fg`}>{p.playerName}</td>
                      <td className={`${tdClass} text-fg-muted`}>{p.position}</td>
                      <td className={`${tdClass} text-fg-muted`}>{p.ownerName}</td>
                      <td className={`${tdClass} text-center`}>
                        <button
                          onClick={() => handleResolve(p.id, "cut", null)}
                          disabled={busy === p.id}
                          className="rounded-lg border border-line bg-elevated px-3 py-1 text-[12px] font-medium text-fg-muted transition-colors hover:bg-hover disabled:opacity-40"
                        >
                          Send to Draft
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Owners & Budgets Section ----

function OwnersBudgetSection({
  owners,
  seasonId,
  baseCapYears,
  baseNegotiations,
  submittedCount,
  draftPoolCount,
  updateBudgetAction,
  updateLockAction,
}: {
  owners: OwnerRow[];
  seasonId: string;
  baseCapYears: number;
  baseNegotiations: number;
  submittedCount: number;
  draftPoolCount: number;
  updateBudgetAction: (ownerId: string, availableYears: number, availableNegotiations: number, seasonId: string) => Promise<{ error: string | null }>;
  updateLockAction: (ownerId: string, canSubmit: boolean, seasonId: string) => Promise<{ error: string | null }>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [years, setYears] = useState(0);
  const [negotiations, setNegotiations] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEdit = (owner: OwnerRow) => {
    setEditing(owner.id);
    setYears(owner.availableYears);
    setNegotiations(owner.availableNegotiations);
  };

  const saveBudget = async (ownerId: string) => {
    setBusy(true);
    setError(null);
    const res = await updateBudgetAction(ownerId, years, negotiations, seasonId);
    setBusy(false);
    if (res.error) setError(res.error);
    else setEditing(null);
  };

  const toggleLock = async (owner: OwnerRow) => {
    setBusy(true);
    setError(null);
    const res = await updateLockAction(owner.id, !owner.canSubmit, seasonId);
    setBusy(false);
    if (res.error) setError(res.error);
  };

  const thClass = "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-fg-subtle";
  const tdClass = "px-3 py-2.5";

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted">
        <span><span className="font-semibold text-fg">{submittedCount}</span> / {owners.length} submitted</span>
        <span><span className="font-semibold text-fg">{draftPoolCount}</span> in draft pool</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { owners.forEach((o) => startEdit(o)); }}
          className="rounded-lg border border-line bg-elevated px-3 py-1.5 text-[12px] text-fg-muted transition-colors hover:bg-hover"
        >
          Set all to base ({baseCapYears}y / {baseNegotiations}n)
        </button>
      </div>

      {/* Mobile: Card list */}
      <div className="space-y-2.5 sm:hidden">
        {owners.map((owner) => (
          <div key={owner.id} className="rounded-xl border border-line bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-fg">{owner.ownerName}</p>
                <p className="truncate text-[12px] text-fg-subtle">{owner.email}</p>
              </div>
              <button
                onClick={() => toggleLock(owner)}
                disabled={busy}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors disabled:opacity-40 ${
                  owner.canSubmit
                    ? "border-success/30 bg-success/10 text-success hover:bg-success/15"
                    : "border-danger/30 bg-danger/10 text-danger hover:bg-danger/15"
                }`}
              >
                {owner.canSubmit ? <UnlockIcon className="h-3 w-3" /> : <LockIcon className="h-3 w-3" />}
                {owner.canSubmit ? "Open" : "Locked"}
              </button>
            </div>
            <div className="mt-2.5 flex items-end gap-4 border-t border-line pt-2.5">
              <div>
                <p className="text-[10px] uppercase text-fg-subtle">Cap Years</p>
                {editing === owner.id ? (
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                    className="mt-0.5 w-16 rounded border border-line bg-elevated px-2 py-1 text-center text-[14px] text-fg focus:border-accent focus:outline-none"
                  />
                ) : (
                  <p className="text-[15px] font-semibold text-fg">{owner.availableYears}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase text-fg-subtle">Negotiations</p>
                {editing === owner.id ? (
                  <input
                    type="number"
                    value={negotiations}
                    onChange={(e) => setNegotiations(parseInt(e.target.value) || 0)}
                    className="mt-0.5 w-16 rounded border border-line bg-elevated px-2 py-1 text-center text-[14px] text-fg focus:border-accent focus:outline-none"
                  />
                ) : (
                  <p className="text-[15px] font-semibold text-fg">{owner.availableNegotiations}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase text-fg-subtle">Submitted</p>
                <p className="text-[15px]">
                  {owner.rosterSubmitted ? <span className="text-success">✓</span> : <span className="text-fg-subtle">—</span>}
                </p>
              </div>
              <div className="ml-auto">
                {editing === owner.id ? (
                  <button
                    onClick={() => saveBudget(owner.id)}
                    disabled={busy}
                    className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(owner)}
                    className="text-[12px] text-accent hover:underline"
                  >
                    Edit Budget
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden overflow-x-auto rounded-lg border border-line sm:block">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-elevated/50">
            <tr>
              <th className={thClass}>Owner</th>
              <th className={`${thClass} text-center`}>Cap Years</th>
              <th className={`${thClass} text-center`}>Negotiations</th>
              <th className={`${thClass} text-center`}>Submitted?</th>
              <th className={`${thClass} text-center`}>Can Submit?</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {owners.map((owner) => (
              <tr key={owner.id} className="transition-colors hover:bg-hover/50">
                <td className={`${tdClass} font-medium text-fg`}>
                  {owner.ownerName}
                  <div className="text-[12px] text-fg-subtle">{owner.email}</div>
                </td>
                <td className={`${tdClass} text-center`}>
                  {editing === owner.id ? (
                    <input
                      type="number"
                      value={years}
                      onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                      className="w-16 rounded border border-line bg-elevated px-2 py-1 text-center text-[14px] text-fg focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <span className="text-[15px] font-semibold text-fg">{owner.availableYears}</span>
                  )}
                </td>
                <td className={`${tdClass} text-center`}>
                  {editing === owner.id ? (
                    <input
                      type="number"
                      value={negotiations}
                      onChange={(e) => setNegotiations(parseInt(e.target.value) || 0)}
                      className="w-16 rounded border border-line bg-elevated px-2 py-1 text-center text-[14px] text-fg focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <span className="text-[15px] font-semibold text-fg">{owner.availableNegotiations}</span>
                  )}
                </td>
                <td className={`${tdClass} text-center`}>
                  {owner.rosterSubmitted ? (
                    <span className="text-success">✓</span>
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </td>
                <td className={`${tdClass} text-center`}>
                  <button
                    onClick={() => toggleLock(owner)}
                    disabled={busy}
                    className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5 mx-auto ${
                      owner.canSubmit
                        ? "border-success/30 bg-success/10 text-success hover:bg-success/15"
                        : "border-danger/30 bg-danger/10 text-danger hover:bg-danger/15"
                    }`}
                  >
                    {owner.canSubmit ? <UnlockIcon className="h-3 w-3" /> : <LockIcon className="h-3 w-3" />}
                    {owner.canSubmit ? "Open" : "Locked"}
                  </button>
                </td>
                <td className={`${tdClass} text-right`}>
                  {editing === owner.id ? (
                    <button
                      onClick={() => saveBudget(owner.id)}
                      disabled={busy}
                      className="rounded-lg bg-accent px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(owner)}
                      className="text-[12px] text-accent hover:underline"
                    >
                      Edit Budget
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Shared ----

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
      {message}
    </div>
  );
}
