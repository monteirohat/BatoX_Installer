// Step 3: the big action button, like balenaEtcher's "Flash!".

import type { ConsoleInfo, Release } from "../../shared/types";
import { BoltIcon } from "../components/Icons";
import { StepCard } from "../components/StepCard";

interface Props {
  release: Release | null;
  info: ConsoleInfo | null;
  onInstall: () => void;
}

export function InstallStep({ release, info, onInstall }: Props) {
  const ready = !!release && !!info;
  let label = "Install";
  let hint = "Choose a version and check the console first.";
  if (release && info) {
    if (!info.installedVersion) {
      label = `Install ${release.tag}`;
      hint = `Installs BatoX on ${info.host} and starts it.`;
    } else if (info.installedVersion === release.tag) {
      label = `Reinstall ${release.tag}`;
      hint = "This version is already installed. Reinstalling keeps your token, settings and catalog.";
    } else {
      label = `Update to ${release.tag}`;
      hint = `Replaces ${info.installedVersion}. Your token, settings and catalog are kept.`;
    }
  } else if (release) {
    hint = "Check the console to continue.";
  } else if (info) {
    hint = "Choose a version to continue.";
  }

  return (
    <StepCard number={3} title="Install" icon={<BoltIcon size={28} />} complete={false}>
      <button className="btn btn-primary btn-big" disabled={!ready} onClick={onInstall}>{label}</button>
      <p className="muted small">{hint}</p>
    </StepCard>
  );
}
