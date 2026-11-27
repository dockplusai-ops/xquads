ALTER TABLE "search_documents" drop column "tsv";--> statement-breakpoint
ALTER TABLE "search_documents" ADD COLUMN "tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', translate(coalesce(title, '') || ' ' || coalesce(body, ''), 'áàâãäåéèêëíìîïóòôõöúùûüçñýÿÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ', 'aaaaaaeeeeiiiiooooouuuucnyyAAAAAAEEEEIIIIOOOOOUUUUCNY'))) STORED;--> statement-breakpoint
CREATE INDEX "search_documents_tsv_idx" ON "search_documents" USING gin ("tsv");
