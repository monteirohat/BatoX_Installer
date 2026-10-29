// Step 1: pick the BatoX version. Defaults to the latest stable release; the
// person can also pick another release from the list or type a tag.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Release } from "../../shared/types";
import { api, errorMessage, formatDate } from "../api";
import { ExternalIcon, PackageIcon, Spinner } from "../components/Icons";
import { StepCard } from "../components/StepCard";

interface Props {
  release: Release | null;
  onChange: (release: Release | null) => void;
  disabled: boolean;
}

export function VersionStep({ release, onChange, disabled }: Props) {
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"latest" | "choose">("latest");
  const [custom, setCustom] = useState("");
  const [finding, setFinding] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setReleases(null);
    try {
      setReleases(await api.listReleases());
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const latest = useMemo(() => releases?.find(r => !r.prerelease) ?? releases?.[0] ?? null, [releases]);

  useEffect(() => {
    if (mode === "latest") onChange(latest);
  }, [mode, latest, onChange]);

  async function find() {
    setFinding(true);
    setFindError(null);
    try {
      const found = await api.getRelease(custom);
      setReleases(list => (list && !list.some(r => r.tag === found.tag) ? [found, ...list] : list));
      onChange(found);
      setCustom("");
    } catch (err) {
      setFindError(errorMessage(err));
    } finally {
      setFinding(false);
    }
  }

  let body;
  if (loadError) {
    body = (
      <div className="notice error">
        {loadError}
        <button className="btn btn-sm" onClick={() => void load()}>Try again</button>
      </div>
    );
  } else if (!releases) {
    body = <p className="muted with-spinner"><Spinner /> Looking for releases on GitHub…</p>;
  } else if (releases.length === 0) {
    body = <div className="notice">No BatoX release has been published yet.</div>;
  } else {
    body = (
      <>
        <div className="segmented" role="radiogroup" aria-label="Version">
          <button role="radio" aria-checked={mode === "latest"} disabled={disabled} onClick={() => setMode("latest")}>Latest</button>
          <button role="radio" aria-checked={mode === "choose"} disabled={disabled} onClick={() => setMode("choose")}>Choose</button>
        </div>

        {mode === "choose" && (
          <div className="stack-sm">
            <label className="field">
              <span>Release</span>
              <select
                value={release?.tag ?? ""}
                disabled={disabled}
                onChange={e => onChange(releases.find(r => r.tag === e.target.value) ?? null)}
              >
                {!release && <option value="">Choose a release</option>}
                {releases.map(r => (
                  <option key={r.tag} value={r.tag}>
                    {r.tag}{r.prerelease ? " (pre-release)" : ""}{r.publishedAt ? `, ${formatDate(r.publishedAt)}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Or type a version</span>
              <div className="row">
                <input
                  value={custom}
                  placeholder="e.g. v1.0.0"
                  disabled={disabled || finding}
                  onChange={e => setCustom(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && custom.trim()) void find(); }}
                  spellCheck={false}
                />
                <button className="btn" disabled={disabled || finding || !custom.trim()} onClick={() => void find()}>
                  {finding ? <Spinner /> : "Find"}
                </button>
              </div>
              {findError && <small className="error-text">{findError}</small>}
            </div>
          </div>
        )}

        {release && (
          <div className="selection">
            <strong className="selection-title">{release.tag}</strong>
            <span className="muted">
              {release.prerelease ? "Pre-release" : mode === "latest" ? "Latest release" : "Release"}
              {release.publishedAt ? `, ${formatDate(release.publishedAt)}` : ""}
            </span>
            <button className="link" onClick={() => void api.openExternal(release.url)}>
              What's new <ExternalIcon size={14} />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <StepCard number={1} title="Version" icon={<PackageIcon size={28} />} complete={!!release}>
      {body}
    </StepCard>
  );
}
