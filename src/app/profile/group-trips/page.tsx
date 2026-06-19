import type { Metadata } from "next";
import ProfileGroupTripsView from "@/components/group-trips/ProfileGroupTripsView";

export const metadata: Metadata = {
  title: "Совместные поездки — личный кабинет",
};

export default function ProfileGroupTripsPage() {
  return <ProfileGroupTripsView />;
}
