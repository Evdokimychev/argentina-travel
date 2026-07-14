import { redirect } from "next/navigation";

export default function LegacyResetPasswordPage() {
  redirect("/account/update-password");
}
