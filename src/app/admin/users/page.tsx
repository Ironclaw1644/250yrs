import { db } from "@/lib/supabase";
import { RoleSelect } from "@/components/admin/RoleSelect";

type Row = {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

export default async function AdminUsers() {
  const { data } = await db()
    .from("profiles")
    .select("id,role,full_name,email,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data as Row[]) ?? [];

  return (
    <div>
      <h1 className="font-heading text-h1">Users</h1>
      <div className="mt-5 overflow-x-auto rounded-md border border-hairline bg-slate-1 shadow-admin-card">
        <table className="w-full min-w-[640px] text-small">
          <thead>
            <tr className="border-b border-hairline text-left font-heading text-xs uppercase tracking-wide text-mist">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-slate-2/50">
                <td className="px-4 py-3 font-semibold text-cloud">
                  {u.full_name ?? "—"}
                </td>
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
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
