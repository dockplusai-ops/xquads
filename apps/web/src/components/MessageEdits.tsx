import type { Message } from "@agenteschat/client";
import { useDeleteMessage, useEditMessage } from "@agenteschat/client";
import { Button, Dialog, DialogBody, DialogFooter, Field, Locked, Textarea } from "@agenteschat/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/lib/toast";
import { useOrg } from "./org-context";

/** "Editar mensagem" (ADR 0221): my own message's words, in a box; Salvar sends them, ⌘/Ctrl+Enter too. */
export function EditMessageDialog({ message, onClose }: { message: Message; onClose: () => void }) {
  const { t } = useTranslation();
  const { org } = useOrg();
  const toast = useToast();
  const edit = useEditMessage(org.id, message.channelId);
  const [text, setText] = useState(message.body);
  const changed = text.trim() !== "" && text.trim() !== message.body.trim();
  const save = () => {
    if (!changed) return onClose();
    edit.mutate(
      { messageId: message.id, body: text, before: message.body, beforeEditedAt: message.editedAt },
      { onError: () => toast.show(t("channel.editMessageFailed"), "error") },
    );
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={t("channel.editMessageTitle")}
      closeLabel={t("common.close")}
      unsaved={changed}
      width={520}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Locked when={edit.isPending}>
          <DialogBody>
            <Field label={t("channel.editMessageLabel")} id={`edit-${message.id}`}>
              <Textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    save();
                  }
                }}
                autoFocus
              />
            </Field>
          </DialogBody>
        </Locked>
        <DialogFooter>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" variant="primary" disabled={!text.trim()}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

/** "Apagar mensagem" (ADR 0221): asked once, gone for everyone. */
export function DeleteMessageDialog({
  message,
  mine,
  onClose,
}: {
  message: Message;
  mine: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { org } = useOrg();
  const toast = useToast();
  const remove = useDeleteMessage(org.id, message.channelId);
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={t("channel.deleteMessageTitle")}
      closeLabel={t("common.close")}
      width={420}
    >
      <DialogBody>
        <p>{t(mine ? "channel.deleteMessageBody" : "channel.deleteMessageBodyOther")}</p>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          variant="danger"
          loading={remove.isPending}
          onClick={() =>
            remove.mutate(message.id, {
              onSuccess: onClose,
              onError: () => toast.show(t("channel.deleteMessageFailed"), "error"),
            })
          }
        >
          {t("channel.deleteMessageAction")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
