// Access-checked file download (BACKEND-ARCHITECTURE.md §13.4 Files). The bytes are NEVER
// streamed or exposed via a public URL: we authenticate the session, load the `files` row
// scoped to the caller's org (out-of-org / missing → 404), then 307-redirect to a short-lived
// (60s) signed Storage URL minted with the service-role client. The proxy/middleware matcher
// excludes /api, so this route self-authenticates via the cookie-bound Supabase client.
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/lib/db/client";
import { files } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 1. Authenticate — verify the JWT server-side, then resolve our domain user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Load the file row, scoped to the caller's org. Missing or cross-tenant → 404 (never leak
  //    existence across orgs). `entity_id` is read from the stored row, never trusted from the URL.
  const [file] = await db
    .select({
      storageBucket: files.storageBucket,
      storagePath: files.storagePath,
    })
    .from(files)
    .where(and(eq(files.id, id), eq(files.orgId, session.orgId)))
    .limit(1);

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 3. Mint a short-lived signed download URL with the service-role client and redirect to it.
  const { data, error } = await supabaseAdmin.storage
    .from(file.storageBucket)
    .createSignedUrl(file.storagePath, 60); // 60s TTL

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
