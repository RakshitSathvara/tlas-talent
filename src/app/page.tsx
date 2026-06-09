import { redirect } from "next/navigation";

// The product entry point routes straight to the role-branched dashboard.
export default function Home() {
  redirect("/dashboard");
}
