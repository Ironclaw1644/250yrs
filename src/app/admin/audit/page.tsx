import { db } from "@/lib/supabase";
import { PageHeader, DataTable, PaginationControls } from "@/components/admin/ui";

type Row = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  diff: Record<string, unknown>;
  created_at: string;
  actor: { full_name: string | null; email: string | null } | null;
};

const PAGE_SIZE = 50;

/** Human-readable diff: `key: old → new` lines, JSON fallback for objects. */
function DiffView({ diff }: { diff: Record<string, unknown> }) {
  const entries = Object.entries(diff ?? {});
  if (!entries.length) return null;
  const simple = entries.every(
    ([, v]) => v === null || ["string", "number", "boolean"].includes(typeof v),
  );
  if (simple) {
    return (
      <dl className="space-y-0.5 text-xs">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-mist">{k}:</dt>
            <dd className="min-w-0 break-all text-cloud">{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <details className="text-xs text-mist">
      <summary className="cursor-pointer text-gold">diff</summary>
      <pre className="mt-1 max-w-md overflow-x-auto rounded bg-night p-2">
        {JSON.stringify(diff, null, 2)}
      </pre>
    </details>
  );
}

export default async function AdminAudit({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data, count } = await db()
    .from("audit_log")
    .select("id,action,entity,entity_id,diff,created_at,actor:profiles(full_name,email)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const rows = (data as unknown as Row[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Every admin and moderation action, permanently recorded."
      />
      <DataTable
        minWidth={720}
        columns={[
          { label: "When" },
          { label: "Actor" },
          { label: "Action" },
          { label: "Entity" },
          { label: "Detail" },
        ]}
      >
        {rows.map((r) => (
          <tr key={r.id} className="align-top hover:bg-slate-2/50">
            <td className="whitespace-nowrap px-4 py-3 text-mist">
              {new Date(r.created_at).toLocaleString("en-US")}
            </td>
            <td className="px-4 py-3 text-mist">
              {r.actor?.full_name ?? r.actor?.email ?? "system"}
            </td>
            <td className="px-4 py-3 font-semibold text-cloud">{r.action}</td>
            <td className="px-4 py-3 text-mist">
              {r.entity}
              {r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}
            </td>
            <td className="px-4 py-3">
              <DiffView diff={r.diff} />
            </td>
          </tr>
        ))}
        {!rows.length && (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-mist">
              Nothing logged yet.
            </td>
          </tr>
        )}
      </DataTable>

      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
        basePath="/admin/audit"
      />
    </div>
  );
}
