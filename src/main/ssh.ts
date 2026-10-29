// Thin promise-based wrapper around ssh2: connect, run commands, upload files.
// ssh2 is a pure JavaScript SSH client, so the installer doesn't depend on
// ssh/scp/sshpass being installed on the user's computer.

import { Client, type ConnectConfig, type SFTPWrapper } from "ssh2";
import type { Target } from "../shared/types";

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

export class Remote {
  private client = new Client();
  private sftpSession: SFTPWrapper | null = null;
  private closed = false;

  connect(target: Target): Promise<void> {
    const config: ConnectConfig = {
      host: target.host,
      port: target.port,
      username: target.username,
      password: target.password,
      tryKeyboard: true,
      readyTimeout: 15000,
      keepaliveInterval: 10000,
    };
    return new Promise((resolve, reject) => {
      // Some SSH servers ask for the password through keyboard-interactive.
      this.client.on("keyboard-interactive", (_name, _instructions, _lang, prompts, finish) => {
        finish(prompts.map(() => target.password));
      });
      this.client.once("ready", () => resolve());
      this.client.once("error", reject);
      this.client.connect(config);
    });
  }

  exec(command: string): Promise<ExecResult> {
    return new Promise((resolve, reject) => {
      this.client.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        let stdout = "";
        let stderr = "";
        stream.on("data", (data: Buffer) => { stdout += data.toString(); });
        stream.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });
        stream.on("close", (code: number | null) => resolve({ code: code ?? 0, stdout, stderr }));
      });
    });
  }

  private sftp(): Promise<SFTPWrapper> {
    if (this.sftpSession) {
      return Promise.resolve(this.sftpSession);
    }
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        this.sftpSession = sftp;
        resolve(sftp);
      });
    });
  }

  async upload(localPath: string, remotePath: string, mode: number): Promise<void> {
    const sftp = await this.sftp();
    await new Promise<void>((resolve, reject) => {
      sftp.fastPut(localPath, remotePath, { mode }, err => (err ? reject(err) : resolve()));
    });
  }

  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.client.end();
    }
  }
}

/** Turns network and SSH errors into messages a person can act on. */
export function describeError(err: unknown, host: string): string {
  const e = err as { code?: string; level?: string; message?: string };
  const msg = e?.message || String(err);
  if (e?.code === "ENOTFOUND" || e?.code === "EAI_AGAIN") {
    return `Couldn't find "${host}" on the network. Check the address, or use the console's IP address (on Batocera: Main menu > Network settings).`;
  }
  if (e?.code === "ECONNREFUSED") {
    return `"${host}" refused the SSH connection. Check that SSH is enabled on Batocera (it is by default) and that the port is right.`;
  }
  if (e?.code === "ETIMEDOUT" || e?.code === "EHOSTUNREACH" || /Timed out while waiting for handshake/i.test(msg)) {
    return `"${host}" did not answer. Check that the console is on and connected to the same network as this computer.`;
  }
  if (e?.level === "client-authentication" || /authentication methods failed/i.test(msg)) {
    return "The user name or password is wrong. Batocera's default login is root / linux.";
  }
  return msg;
}
