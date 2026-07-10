import { db } from "@/lib/supabase";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { Icon } from "@/components/Icon";
import { PageHeader, DataTable, PaginationControls } from "@/components/admin/ui";

type Row = {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

const PAGE_SIZE = 50;

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = db()
    .from("profiles")
    .select("id,role,full_name,email,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ").trim();
    query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`);
  }
  const { data, count } = await query;
  const rows = (data as Row[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Everyone with an account — customers, owners, and staff."
        actions={
          <form className="flex items-center gap-2" action="/admin/users" method="get">
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search name or email…"
              className="h-9 rounded-md border border-hairline bg-slate-1 px-3 text-small text-cloud placeholder:text-mist/60 focus:border-gold focus:outline-none"
            />
            <button type="submit" className="btn btn-gold !min-h-9 px-3 text-small">
              <Icon name="magnifying-glass" />
            </button>
          </form>
        }
      />

      <DataTable
        minWidth={640}
        columns={[{ label: "Name" }, { label: "Email" }, { label: "Joined" }, { label: "Role" }]}
      >
        {rows.map((u) => (
          <tr key={u.id} className="hover:bg-slate-2/50">
            <td className="px-4 py-3 font-semibold text-cloud">{u.full_name ?? "—"}</td>
            <td className="px-4 py-3 text-mist">{u.email ?? "—"}</td>
            <td className="px-4 py-3 text-mist">
              {new Date(u.created_at).toLocaleDateString("en-US")}
            </td>
            <td className="px-4 py-3">
              <RoleSelect userId={u.id} role={u.role} />
            </td>
          </tr>
        ))}
        {!rows.length && (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-mist">
              {q ? "No users match your search." : "No users yet."}
            </td>
          </tr>
        )}
      </DataTable>

      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
        basePath="/admin/users"
        params={{ q }}
      />
    </div>
  );
}
