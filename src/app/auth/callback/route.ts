import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { notify } from "@/lib/notify";
import { brand } from "@/lib/brand";

/** Exchanges the email-confirmation / OAuth code for a session, then redirects. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  if (code) {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data?.user;
    if (user) {
      // Deduped by a partial unique index, so repeat callbacks are harmless.
      void notify({
        userId: user.id,
        type: "welcome",
        title: `Welcome to ${brand.name}!`,
        body: "Find real local businesses — food, hair, tires, markets, and more.",
        href: "/us",
        toEmail: user.email ?? undefined,
        email: {
          subject: `Welcome to ${brand.name}`,
          bodyHtml:
            "<p>You're in! Browse real local businesses in every city and state, save your favorites, and leave reviews that help your neighbors.</p>",
          ctaLabel: "Find businesses",
          ctaHref: "/us",
        },
      });
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
