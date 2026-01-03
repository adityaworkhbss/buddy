import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "../lib/session";

export default async function Home() {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  
  if (sessionToken) {
    const session = await getSession(sessionToken);
    if (session) {
      redirect("/dashboard");
      return;
    }
  }
  
  redirect("/login");
}
