/** Russian alt-text patterns for media (E64). */

export function tourCoverAlt(title: string): string {
  return `Обложка тура «${title}»`;
}

export function excursionCoverAlt(title: string): string {
  return `Обложка экскурсии «${title}»`;
}

export function destinationHeroAlt(name: string): string {
  return `Панорама направления «${name}»`;
}

export function destinationGalleryAlt(name: string, index: number, total?: number): string {
  if (total != null && total > 1) {
    return `«${name}» — фото ${index + 1} из ${total}`;
  }
  return `«${name}» — фото ${index + 1}`;
}

export function avatarAlt(name: string): string {
  return `Аватар: ${name}`;
}

export function placeCoverAlt(name: string): string {
  return `Обложка места «${name}»`;
}
