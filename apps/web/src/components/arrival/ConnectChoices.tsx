import { joinNames } from "@agenteschat/client/lib/format";
import { type AiChoice, offeredPlans, type PlanChoice, planLabel, planMark } from "@agenteschat/client/lib/no-ai";
import { Icon, ProviderLogo } from "@agenteschat/ui";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

/** OpenCode's free models last, as the way in without a plan. */
const FREE: PlanChoice = "zen";

/**
 * Which AI, as the first thing a new workspace's owner is asked (ADR 0160): one card each, in words, instead of the
 * picker's two controls. A pick opens that plan's own steps (`PlanPanel`, `KeyPanel`), unchanged.
 */
export function ConnectChoices({
  onPick,
  dims,
  mayAddKey,
  perAgent,
}: {
  onPick: (choice: AiChoice) => void;
  /** A plan that can't sign in now: its mark dims, and its steps say why. */
  dims: (choice: PlanChoice) => boolean;
  mayAddKey: boolean;
  /**
   * For several agents: a plan that will ask for one login per agent there ends its card saying so, quietly, before
   * it is picked (ADR 0160, addendum).
   */
  perAgent?: (choice: PlanChoice) => boolean;
}) {
  const { t } = useTranslation();
  const [others, setOthers] = useState(false);
  // The two plans most people have on top (Claude's only where it's offered, `offeredPlans`).
  const offered = offeredPlans().filter((c) => c !== FREE);
  const firstPlans = offered.slice(0, 2);
  const otherPlans = offered.slice(2);
  const card = (choice: AiChoice, lead: ReactNode, title: string, text: string, end?: ReactNode) => (
    <button key={choice} type="button" className="ac-option" onClick={() => onPick(choice)}>
      {lead}
      <span className="ac-option__text">
        <span className="ac-option__title">{title}</span>
        <span className="ac-option__desc">{text}</span>
      </span>
      {end ?? <Icon name="chevronRight" className="arrival-opts__end" />}
    </button>
  );
  const plan = (c: PlanChoice) =>
    card(
      c,
      <ProviderLogo id={planMark(c)} size="tile" off={dims(c)} />,
      planLabel(t, c),
      t(`connectAi.plan.${c}.tiers`),
      perAgent?.(c) ? (
        <span className="arrival-opts__tag arrival-opts__tag--quiet">{t("connectAi.team.perAgent")}</span>
      ) : undefined,
    );
  return (
    <div className="arrival-opts">
      {firstPlans.map(plan)}
      {others ? (
        otherPlans.map(plan)
      ) : (
        <button type="button" className="ac-option" aria-expanded={false} onClick={() => setOthers(true)}>
          <span className="arrival-opts__tile arrival-opts__tile--four" aria-hidden="true">
            {otherPlans.slice(0, 4).map((c) => (
              <ProviderLogo key={c} id={planMark(c)} size="xs" />
            ))}
          </span>
          <span className="ac-option__text">
            <span className="ac-option__title">{t("arrival.connect.others")}</span>
            <span className="ac-option__desc">
              {joinNames(
                otherPlans.map((c) => planLabel(t, c)),
                t,
              )}
            </span>
          </span>
          <Icon name="chevronDown" className="arrival-opts__end" />
        </button>
      )}
      {mayAddKey &&
        card(
          "key",
          <span className="arrival-opts__tile" aria-hidden="true">
            <Icon name="key" />
          </span>,
          t("connectAi.key.title"),
          t("connectAi.key.sub"),
        )}
      {card(
        FREE,
        <ProviderLogo id={planMark(FREE)} size="tile" off={dims(FREE)} />,
        t("arrival.connect.free"),
        t("arrival.connect.freeText"),
        <span className="arrival-opts__tag">{t("arrival.connect.noPlan")}</span>,
      )}
    </div>
  );
}
