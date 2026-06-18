import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои отзывы — личный кабинет",
};

export default function ProfileReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
