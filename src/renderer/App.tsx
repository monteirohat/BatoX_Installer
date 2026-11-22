// Main screen: three steps side by side (version, console, install), then the
// installation progress and its result.

import { useCallback, useEffect, useState } from "react";
import type { AppInfo, ConsoleInfo, InstallResult, Release, Target } from "../shared/types";
import { api, errorMessage } from "./api";
import { GitHubIcon } from "./components/Icons";
import { ConsoleStep } from "./steps/ConsoleStep";
import { InstallStep } from "./steps/InstallStep";
import { VersionStep } from "./steps/VersionStep";
import { ProgressList, overallPercent, type StepMap } from "./views/Progress";
import { Failure, Success } from "./views/Result";
import wordmarkUrl from "./assets/wordmark.svg";

type Phase =
  | { name: "setup" }
  | { name: "installing" }
  | { name: "done"; result: InstallResult }
  | { name: "failed"; message: string };

export function App() {
  const [release, setRelease] = useState<Release | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [info, setInfo] = useState<ConsoleInfo | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "setup" });
  const [steps, setSteps] = useState<StepMap>({});
  const [cancelling, setCancelling] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => { api.appInfo().then(setAppInfo).catch(() => {}); }, []);

  const onConsole = useCallback((t: Target | null, i: ConsoleInfo | null) => {
    setTarget(t);
    setInfo(i);
  }, []);

  async function install() {
    if (!release || !target) return;
    setSteps({});
    setCancelling(false);
    setPhase({ name: "installing" });
    const unsubscribe = api.onProgress(p => setSteps(s => ({ ...s, [p.step]: p })));
    try {
      const result = await api.install({ target, tag: release.tag });
      setInfo({ ...result.console, installedVersion: result.version, hasMyMine: false });
      setPhase({ name: "done", result });
    } catch (err) {
      setPhase({ name: "failed", message: errorMessage(err) });
    } finally {
      unsubscribe();
    }
  }

  async function cancel() {
    setCancelling(true);
    await api.cancelInstall();
  }

  const percent = overallPercent(steps);

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <img src={wordmarkUrl} width={115} height={46} alt="BatoX" />
          <span className="brand-tag">Installer</span>
        </div>
        <button className="link muted" onClick={() => void api.openExternal(`https://github.com/${appInfo?.repo ?? "monteirohat/BatoX"}`)}>
          <GitHubIcon size={16} /> BatoX on GitHub
        </button>
      </header>

      <main className="main">
        {/* The steps stay mounted while hidden, so choices survive an installation. */}
        <div hidden={phase.name !== "setup"}>
          <div className="steps">
            <VersionStep release={release} onChange={setRelease} disabled={phase.name !== "setup"} />
            <ConsoleStep info={info} onChange={onConsole} disabled={phase.name !== "setup"} />
            <InstallStep release={release} info={info} onInstall={() => void install()} />
          </div>
          <p className="intro muted">
            BatoX lets you manage the games, music, themes and settings of your Batocera from any browser.
            This installer copies it to the console over your local network.
          </p>
        </div>

        {phase.name === "installing" && (
          <section className="installing">
            <h1>{cancelling ? "Cancelling…" : `Installing BatoX ${release?.tag ?? ""}`}</h1>
            <p className="muted">Keep {target?.host} on and connected until it finishes.</p>
            <div className="bar bar-big" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${percent}%` }} />
            </div>
            <ProgressList steps={steps} />
            <button className="btn" onClick={() => void cancel()} disabled={cancelling}>Cancel</button>
          </section>
        )}

        {phase.name === "done" && (
          <Success result={phase.result} onAgain={() => { setInfo(null); setTarget(null); setPhase({ name: "setup" }); }} />
        )}

        {phase.name === "failed" && (
          <Failure message={phase.message} steps={steps} onBack={() => setPhase({ name: "setup" })} />
        )}
      </main>

      <footer className="bottom muted small">
        <span>BatoX Installer {appInfo ? `v${appInfo.version}` : ""}</span>
        <span>BatoX is not affiliated with the Batocera project.</span>
      </footer>
    </div>
  );
}
