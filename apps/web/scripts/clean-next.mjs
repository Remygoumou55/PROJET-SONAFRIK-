import { rmSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const PORT = 3000;

// Kill any process holding port 3000 before cleaning — prevents stale server
// serving 500s after .next is removed underneath it.
try {
  if (process.platform === "win32") {
    const result = execSync(
      `netstat -ano 2>nul | findstr /R ":${PORT} "`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
    );
    const pids = [
      ...new Set(
        result
          .split("\n")
          .map((l) => l.trim().split(/\s+/).at(-1))
          .filter((p) => p && /^\d+$/.test(p) && p !== "0"),
      ),
    ];
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid} /T 2>nul`, { stdio: "ignore" });
        console.log(`Killed PID ${pid} on port ${PORT}`);
      } catch {
        /* already gone */
      }
    }
  } else {
    execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`, { stdio: "ignore" });
    console.log(`Killed processes on port ${PORT}`);
  }
} catch {
  /* port was already free */
}

const nextDir = join(import.meta.dirname, "..", ".next");
rmSync(nextDir, { recursive: true, force: true });
console.log("Removed", nextDir);
