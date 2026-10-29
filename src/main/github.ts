// Reads BatoX releases from the GitHub API. Anonymous requests are limited to
// 60 per hour per IP, which is plenty for an installer.

import { REPO, type Release } from "../shared/types";

const API = `https://api.github.com/repos/${REPO}`;

interface GitHubAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  prerelease: boolean;
  draft: boolean;
  html_url: string;
  body: string | null;
  assets: GitHubAsset[];
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "BatoX-Installer",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch {
    throw new Error("Couldn't reach GitHub. Check your internet connection.");
  }
  if (res.status === 404) {
    throw new Error("Not found on GitHub.");
  }
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    throw new Error("GitHub's hourly request limit was reached. Try again in a few minutes.");
  }
  if (!res.ok) {
    throw new Error(`GitHub returned an error (HTTP ${res.status}).`);
  }
  return (await res.json()) as T;
}

function toRelease(r: GitHubRelease): Release {
  return {
    tag: r.tag_name,
    name: r.name || r.tag_name,
    publishedAt: r.published_at || "",
    prerelease: r.prerelease,
    url: r.html_url,
    notes: r.body || "",
    assets: r.assets.map(a => ({ name: a.name, size: a.size, url: a.browser_download_url })),
  };
}

/** Published releases, newest first (drafts are skipped). */
export async function listReleases(): Promise<Release[]> {
  const data = await request<GitHubRelease[]>("/releases?per_page=30");
  return data.filter(r => !r.draft).map(toRelease);
}

/** One release by tag. "1.2.0" also finds "v1.2.0". */
export async function getRelease(tag: string): Promise<Release> {
  const clean = tag.trim();
  if (!clean) {
    throw new Error("Enter a version, for example v1.0.0.");
  }
  const candidates = /^v/i.test(clean) ? [clean] : [`v${clean}`, clean];
  for (const candidate of candidates) {
    try {
      return toRelease(await request<GitHubRelease>(`/releases/tags/${encodeURIComponent(candidate)}`));
    } catch (err) {
      if (!(err instanceof Error) || err.message !== "Not found on GitHub.") {
        throw err;
      }
    }
  }
  throw new Error(`Version ${clean} was not found in the BatoX releases.`);
}
