export type TripsterBookingRequestView = {
  id: string;
  experienceId: number;
  experienceSlug: string;
  experienceTitle: string;
  experienceCoverImage: string | null;
  userId: string | null;
  eventDate: string;
  eventTime: string;
  personsCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  messageToGuide: string | null;
  tripsterOrderId: number | null;
  tripsterOrderUrl: string | null;
  tripsterStatus: string | null;
  createdAt: string;
};
