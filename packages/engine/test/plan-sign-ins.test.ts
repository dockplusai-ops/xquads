import { afterEach, expect, test } from "bun:test";
import { computerBrainUnavailable } from "../src/brains/select";
import type { MachineStatus } from "../src/machine-hub";
import { planSignInRefusal, setPlanSignIns } from "../src/plan-sign-ins";

afterEach(() => setPlanSignIns({ hosted: true, claude: true }));

test("API keys on the server's computers, no Claude subscription anywhere, keys always pass", () => {
  setPlanSignIns({ hosted: false, claude: false });
  expect(planSignInRefusal("codex", "managed")?.code).toBe("plan_off");
  expect(planSignInRefusal("codex", "host")?.code).toBe("plan_off");
  expect(planSignInRefusal("codex", "connected")).toBeNull();
  expect(planSignInRefusal("claude_code", "connected")?.code).toBe("plan_off");
  // A coding plan's key on Claude Code, OpenCode and the model brain are never plans.
  expect(planSignInRefusal("claude_code", "managed", "zai")).toBeNull();
  expect(planSignInRefusal("opencode", "managed")).toBeNull();
  expect(planSignInRefusal("model", "managed")).toBeNull();

  setPlanSignIns({ hosted: true, claude: true });
  expect(planSignInRefusal("claude_code", "managed")).toBeNull();
});

test("a refused plan reads as signed out for the agent, so it asks for a key", () => {
  setPlanSignIns({ hosted: true, claude: false });
  const status = { name: "Mac", kind: "connected", online: true } as MachineStatus;
  const why = computerBrainUnavailable("claude_code", "m1", status, Date.now(), {
    id: "a1",
    label: "Claude",
    status: "active",
  });
  expect(why?.code).toBe("not_logged_in");
  expect(why?.message).toContain("API key");
});
