import { db } from "@/lib/supabase";

type Row = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  diff: Record<string, unknown>;
  created_at: string;
  actor: { full_name: string | null; email: string | null } | null;
};

export default async function AdminAudit() {
  const { data } = await db()
    .from("audit_log")
    .select("id,action,entity,entity_id,diff,created_at,actor:profiles(full_name,email)")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data as unknown as Row[]) ?? [];

  return (
    <div>
      <h1 className="font-heading text-h1">Audit Log</h1>
      <div className="mt-5 overflow-x-auto rounded-md border border-hairline bg-slate-1 shadow-admin-card">
        <table className="w-full min-w-[720px] text-small">
          <thead>
            <tr className="border-b border-hairline text-left font-heading text-xs uppercase tracking-wide text-mist">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
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
                  {Object.keys(r.diff ?? {}).length > 0 && (
                    <details className="text-xs text-mist">
                      <summary className="cursor-pointer text-gold">diff</summary>
                      <pre className="mt-1 max-w-md overflow-x-auto rounded bg-night p-2">
                        {JSON.stringify(r.diff, null, 2)}
                      </pre>
                    </details>
                  )}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
