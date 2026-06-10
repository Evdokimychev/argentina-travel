import Link from "next/link";
import ArgentinaLogo from "@/components/ArgentinaLogo";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex">
              <ArgentinaLogo size="sm" />
            </Link>
            <p className="mt-4 max-w-md text-sm text-gray-400">
              Откройте для себя Аргентину — от ледников Патагонии до танго
              Буэнос-Айреса. Авторские туры с русскоязычными гидами.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sun">
              Навигация
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                { href: "/", label: "Главная" },
                { href: "/tours", label: "Каталог туров" },
                { href: "/about", label: "О нас" },
                { href: "/join", label: "Авторам" },
                { href: "/blog", label: "Блог" },
                { href: "/contacts", label: "Контакты" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sun">
              Контакты
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/contacts" className="transition-colors hover:text-white">
                  Написать нам
                </Link>
              </li>
              <li>
                <Link href="/join" className="transition-colors hover:text-white">
                  Стать организатором
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Пора в Аргентину. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
