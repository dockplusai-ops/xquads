# 0221. Editing and deleting a message

- Status: Accepted
- Date: 2026-11-27
- Code: engine `message-edits.ts` (`editMessage`, `deleteMessage`, `DeletedMark`), `messages.ts` (`MessageView.editedAt`),
  `events.ts` (`message.edited`, `message.deleted`), `search.ts` (a deleted mark leaves the index); server
  `routes/app/chat.ts` (`PATCH` and `DELETE …/messages/{messageId}`); client `api` (`chat.editMessage`,
  `chat.deleteMessage`), `queries.ts` (`useEditMessage`, `useDeleteMessage`, `cacheMessageEdited`,
  `cacheMessageDeleted`); web `MessageEdits.tsx`, `MessageMore.tsx` (Editar mensagem, Apagar mensagem),
  `ChannelPage.tsx` ("(editada)", "Mensagem apagada"), `realtime/context.tsx`; phone `sheets.tsx` (the menu),
  `screen/useChatSend.tsx` (editing in the field, the delete alert), `QuoteLine.tsx` (`EditBar`), `MessageRow.tsx`,
  `chat/live.ts`

## Context

People could not fix a typo or take back a message: every chat they use (Slack, WhatsApp, Teams) lets them. The
messages table already had `edited_at` and `deleted_at`, and lists already left deleted rows out, but nothing set them.

## Decision

1. **Editing.** Only a person's own message with words (a GIF or a file alone has none to edit). The text changes,
   `edited_at` says when, and "(editada)" shows beside its time (the phone puts it after the words). Nothing runs
   again: no agent is woken and nobody mentioned is told again (the mentions stay as they were). The search index
   reads the new words. Live: `message.edited`.
2. **Deleting.** A person's own message, or anyone's for an administrator (moderation; recorded in the audit log as
   `message.deleted`). A message nobody replied to goes (`deleted_at`). A thread's root with replies stays as
   "Mensagem apagada" (`meta.deleted`, its words and files taken off it) so the replies keep their place. The files
   it carried stay in the Drive. Asked once before, with no undo. Live: `message.deleted` (`kept` for the mark).
3. **Agents' messages** are neither edited nor deleted here.
4. **Web**: Editar mensagem opens a box with the words (Salvar, ⌘/Ctrl+Enter); Apagar mensagem asks in a dialog that
   says when it is someone else's. **Phone**: Editar puts the words back in the field under "Editando mensagem" (its ×
   leaves it as it was) and sending saves them; Apagar asks in the system's alert. Only one's own on the phone.

## Consequences

- An agent already working on a message reads the words it started with; an edit does not restart it.
- An agent's reply that quoted a deleted message keeps its own words.
