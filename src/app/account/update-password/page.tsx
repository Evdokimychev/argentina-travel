import { cookies } from "next/headers";
import { RECOVERY_FLOW_COOKIE } from "@/lib/auth-flow";
import UpdatePasswordView from "./UpdatePasswordView";

export default async function UpdatePasswordPage() {
  const recoveryReady = (await cookies()).get(RECOVERY_FLOW_COOKIE)?.value === "active";
  return <main className="flex min-h-[70vh] items-center justify-center px-4 py-12"><UpdatePasswordView recoveryReady={recoveryReady} /></main>;
}
