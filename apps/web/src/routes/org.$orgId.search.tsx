import { createFileRoute } from "@tanstack/react-router";
import { Main } from "@/components/Main";
import { SearchPage } from "@/pages/SearchPage";

/**
 * "Buscar no workspace" (sidebar); `?in={channelId}` opens it scoped to that channel or DM (its header's search), and
 * `?q=` holds the search itself, its filters as typed (`from:@ana in:eng orçamento`), so a link or a reload opens it.
 */
export const Route = createFileRoute("/org/$orgId/search")({
  validateSearch: (search: Record<string, unknown>): { in?: string; q?: string } => ({
    ...(typeof search.in === "string" && search.in ? { in: search.in } : {}),
    ...(typeof search.q === "string" && search.q.trim() ? { q: search.q } : {}),
  }),
  component: function Search() {
    const { in: scope, q } = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <Main>
        <SearchPage
          key={scope}
          scope={scope}
          query={q}
          onQuery={(text) => void navigate({ search: (s) => ({ ...s, q: text || undefined }), replace: true })}
        />
      </Main>
    );
  },
});
