# 0220. The next message, suggested

- Status: Accepted
- Date: 2026-11-27
- Extends: ADR 0207 addendum of 2026-11-21 (the working line written by the workspace's small model), ADR 0091 (the
  chat's media settings)
- Code: db `packages/db/src/schema/agents.ts` (`organization_settings.next_prompts`, migration `0342_next_prompts`);
  engine `next-prompt.ts` (`suggestNextPrompt`, `createLlmNextPromptWriter`, `nextPromptText`, `NEXT_PROMPT_MAX`),
  `executor.ts` (called when a run is done), `context/summaries.ts` (`ContextDeps.nextPrompts`), `events.ts`
  (`message.suggestion`), `management.ts` (`nextPrompts`); server `engine.ts`, `routes/app/management.ts`; client
  `lib/next-prompt.ts` (`nextPromptOf`, `composerSuggestion`); ui `Composer` (`suggestion`); web `ChannelPage.tsx`,
  `realtime/context.tsx`, `MediaSettings.tsx`; phone `features/chat/SuggestionBar.tsx`, `ChatScreen.tsx`, `live.ts`,
  `MediaSettingsScreen.tsx`

## Context

Claude Code shows the prompt a person would likely send next as grey text in the empty box, taken with Tab. People
asked for the same in their DMs with agents: after "Montei a proposta. Quer que eu envie?", "Pode enviar para o
cliente" is one key away instead of typed.

## Decision

1. **When.** Once a run that is not in the background, long work or a confidential thread is done, and its reply is
   the newest message of a DM with an agent (a person who already wrote again gets none). Nothing when the reply
   carries a card (an approval, a question, a choice card or a poll among its files): its options are the next step.
   Nothing in channels and threads for now: a reply there is read by many people.
2. **How.** The workspace's small model (`smallModelFor`, usage kind `router`, like the working line), with the
   conversation's last 6 messages and the person's app language, answers JSON `{"prompt": "…"}`: at most 100
   characters, in the person's voice, concrete, empty when no next step is clear (the agent asked something only the
   person can answer, the topic closed, small talk). 8 seconds at most; any failure leaves the reply as it was.
3. **Kept and told.** On the reply as `meta.nextPrompt` `{ text, forUserId }` (so a reload shows it) and told to the
   apps as `message.suggestion`. Only the person in that DM sees it.
4. **Web.** In the empty composer the suggestion stands in the placeholder's place with its key (" · Tab", the tip
   that drops in a narrow box). Tab or → puts it in the box to edit or send; Shift+Tab still leaves the box; typing
   anything brings the placeholder back.
5. **Phone.** No Tab: a bar over the field where "Respondendo a" sits; a tap puts it in the field (the composer
   request every "Falar com" uses) and the bar goes.
6. **Off.** Configurações › GIFs e figurinhas › "Sugerir a próxima mensagem", for who configures the workspace (on by
   default). Off, no model call is made. No per-person switch in v1: a suggestion nobody takes costs a key never
   pressed.

## Consequences

- One small-model call per agent reply in a DM, billed like the router's calls, well under the reply's own cost.
- The suggestion may be wrong or bland; it is only ever grey text until the person takes it, and sends nothing alone.
