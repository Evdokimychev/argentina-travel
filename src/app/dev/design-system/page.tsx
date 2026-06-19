import DesignSystemShowcase from "@/components/about/DesignSystemShowcase";
import { privatePageMetadata } from "@/lib/private-page-metadata";

export const metadata = privatePageMetadata(
  "Design System",
  "Внутренняя витрина UI-компонентов и токенов платформы.",
);

export default function DevDesignSystemPage() {
  return <DesignSystemShowcase />;
}
