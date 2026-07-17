export type OrganizerBookingEditAvailability = {
  canEdit: boolean;
  notice: string | null;
};

export function getOrganizerBookingEditAvailability(
  remoteMode: boolean
): OrganizerBookingEditAvailability {
  if (!remoteMode) {
    return {
      canEdit: true,
      notice: null,
    };
  }

  return {
    canEdit: false,
    notice:
      "Даты, состав, стоимость и условия оплаты этой заявки защищены от ручного изменения. Статус можно обновить действиями на странице.",
  };
}
