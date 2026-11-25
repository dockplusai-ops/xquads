import type { AppLocale } from "./locale";

/**
 * Where the help pages live: xquads Cloud's own web app (`/help/<slug>`, `HelpPage`), the same for every edition and
 * app, self-hosted servers included.
 */
export const DOCS_SITE = "https://agents.xquads.com";

/** The project xquads is based on, credited in About (`settings.about.basedOn`). */
export const UPSTREAM_SITE = "https://agentes.chat";

/** A help page (the installation guide without `slug`) in `locale`, at a section. */
export const docsUrl = (locale: AppLocale, slug?: string, section?: string) =>
  `${DOCS_SITE}/help/${slug ?? "install-on-a-server"}?lang=${locale}${section ? `#${section}` : ""}`;

/** The desktop app's download page on xquads Cloud. */
export const DOWNLOAD_URL = `${DOCS_SITE}/download`;
