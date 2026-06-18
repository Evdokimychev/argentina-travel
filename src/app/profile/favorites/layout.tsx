import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Избранное — личный кабинет",
};

export default function ProfileFavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
