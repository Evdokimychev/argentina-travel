import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme-storage";

export default function ThemeScript() {
  return (
    <script
      id="theme-bootstrap"
      dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
    />
  );
}
