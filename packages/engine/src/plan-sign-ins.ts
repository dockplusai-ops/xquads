/**
 * Where an AI plan (a person's subscription, signed in through its CLI) may think for agents. Two switches, set at
 * boot from `HOSTED_PLAN_SIGN_INS` and `CLAUDE_PLAN_SIGN_INS`:
 * - `hosted`: on a computer the server runs (`managed`, `host`), never one a person connected. Off, those
 *   computers think with API keys only: a plan's sign-in would sit on a machine its owner doesn't hold.
 * - `claude`: a Claude subscription (Claude Code's own sign-in) on a person's own computer. Anthropic's terms let
 *   no third-party product route agents through Claude Free, Pro, Max or Ultra (code.claude.com/docs/en/legal-and-compliance).
 * A key is never a plan: a coding plan's key, Cursor's or OpenCode's key, and Gemini Enterprise pass either way.
 * The module defaults keep every sign-in, as before these switches; the server's config defaults turn both off.
 */

let hosted = true;
let claude = true;

export function setPlanSignIns(on: { hosted: boolean; claude: boolean }) {
  hosted = on.hosted;
  claude = on.claude;
}

export const planSignIns = () => ({ hosted, claude });

/** A computer the server runs, not one a person connected (`MachineKind`). */
export const hostedMachine = (machineKind: string | undefined | null) =>
  machineKind === "managed" || machineKind === "host";

/**
 * Why a plan of this CLI can't think on that computer, or null when it can. `provider`: the account's (a key or
 * Gemini Enterprise when set); absent, the CLI's own sign-in. OpenCode signs in with its key alone.
 */
export function planSignInRefusal(
  kind: string,
  machineKind: string | undefined | null,
  provider?: string | null,
): { code: "plan_off"; message: string } | null {
  if (kind === "model" || kind === "opencode" || provider) return null;
  if (!hosted && hostedMachine(machineKind)) {
    return {
      code: "plan_off",
      message: "Agents on this server's computers think with an API key. Add one in Settings › AI.",
    };
  }
  if (!claude && kind === "claude_code") {
    return {
      code: "plan_off",
      message: "A Claude subscription can't think for agents here. Add an Anthropic API key in Settings › AI.",
    };
  }
  return null;
}
