import { rmSync } from "node:fs";
import { join } from "node:path";
import { execSync, spawnSync } from "node:child_process";

const PORT = 3000;

// Kill any process holding port 3000 before cleaning — prevents stale server
// serving 500s after .next is removed underneath it.
function killPort(port) {
  try {
    if (process.platform === "win32") {
      // Parse netstat output directly in JS — avoids findstr/2>nul issues on Windows
      const result = execSync("netstat -ano", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const pids = [
        ...new Set(
          result
            .split("\n")
            .filter((l) => l.includes(`:${port} `) || l.includes(`:${port}\t`))
            .map((l) => l.trim().split(/\s+/).at(-1))
            .filter((p) => p && /^\d+$/.test(p) && p !== "0"),
        ),
      ];
      for (const pid of pids) {
        const r = spawnSync("taskkill", ["/F", "/PID", pid, "/T"], { stdio: "ignore" });
        if (r.status === 0) console.log(`Killed PID ${pid} on port ${port}`);
      }
    } else {
      spawnSync("sh", ["-c", `fuser -k ${port}/tcp 2>/dev/null || true`], { stdio: "ignore" });
      console.log(`Killed processes on port ${port}`);
    }
  } catch {
    /* port already free or netstat unavailable */
  }
}

killPort(PORT);

const nextDir = join(import.meta.dirname, "..", ".next");
rmSync(nextDir, { recursive: true, force: true });
console.log("Removed", nextDir);
