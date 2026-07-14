import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-heading text-2xl font-bold text-charcoal">Ссылка больше не действует</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">Ссылка могла устареть или уже использоваться. Запросите новое письмо, и мы отправим свежую ссылку.</p>
        <Link href="/?auth=sign-in&step=forgot-password" className="mt-6 flex h-11 items-center justify-center rounded-button bg-sky px-5 text-sm font-semibold text-white hover:bg-sky-dark">Запросить новое письмо</Link>
        <Link href="/" className="mt-4 block text-center text-sm font-medium text-sky hover:underline">На главную</Link>
      </div>
    </main>
  );
}
