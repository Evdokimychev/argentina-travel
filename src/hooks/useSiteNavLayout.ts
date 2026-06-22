"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  getSiteNavBarSectionsByCount,
  getSiteNavSection,
  SITE_NAV_DESKTOP_PRIORITY_IDS,
} from "@/data/site-nav";

const MIN_PRIMARY_COUNT = 2;
const NAV_ITEM_GAP_PX = 4;
const OVERFLOW_TRIGGER_WIDTH_PX = 52;

function estimateNavItemWidth(sectionId: string, showIndex: boolean): number {
  const section = getSiteNavSection(sectionId);
  const label = section?.label ?? sectionId;
  const textWidth = label.length * 7.1;
  const padding = 10;
  const chevron = section?.columns?.length ? 18 : 0;
  const index = showIndex ? 18 : 0;
  return Math.ceil(textWidth + padding + chevron + index);
}

function computeVisiblePrimaryCount(
  availableWidth: number,
  itemWidths: Map<string, number>,
  showIndex: boolean,
): number {
  const ids = [...SITE_NAV_DESKTOP_PRIORITY_IDS];
  const overflowWidth = itemWidths.get("overflow") ?? OVERFLOW_TRIGGER_WIDTH_PX;

  for (let count = ids.length; count >= MIN_PRIMARY_COUNT; count -= 1) {
    let total = overflowWidth + NAV_ITEM_GAP_PX;

    for (let index = 0; index < count; index += 1) {
      const id = ids[index];
      total +=
        (itemWidths.get(id) ?? estimateNavItemWidth(id, showIndex)) + NAV_ITEM_GAP_PX;
    }

    if (total <= availableWidth) {
      return count;
    }
  }

  return MIN_PRIMARY_COUNT;
}

export function useSiteNavLayout(navRef: RefObject<HTMLElement | null>) {
  const itemWidthsRef = useRef<Map<string, number>>(new Map());
  const [visiblePrimaryCount, setVisiblePrimaryCount] = useState(3);
  const [navWidth, setNavWidth] = useState(0);

  const registerItemRef = useCallback(
    (sectionId: string) => (node: HTMLElement | null) => {
      if (!node) {
        itemWidthsRef.current.delete(sectionId);
        return;
      }
      itemWidthsRef.current.set(sectionId, node.getBoundingClientRect().width);
    },
    [],
  );

  const remeasure = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    const width = nav.clientWidth;
    setNavWidth(width);
    if (width <= 0) return;

    const showIndex = width >= 1080;
    const nextCount = computeVisiblePrimaryCount(
      width,
      itemWidthsRef.current,
      showIndex,
    );

    setVisiblePrimaryCount((current) => (current === nextCount ? current : nextCount));
  }, [navRef]);

  useLayoutEffect(() => {
    remeasure();
  }, [remeasure, visiblePrimaryCount]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(() => remeasure());
    observer.observe(nav);
    return () => observer.disconnect();
  }, [navRef, remeasure]);

  const { primarySections, overflowSections } = useMemo(
    () => getSiteNavBarSectionsByCount(visiblePrimaryCount),
    [visiblePrimaryCount],
  );

  const showNavIndex = navWidth >= 1080 && visiblePrimaryCount >= 5;
  const navCompact = visiblePrimaryCount < 5 || navWidth < 1120;

  return {
    primarySections,
    overflowSections,
    showNavIndex,
    navCompact,
    registerItemRef,
    visiblePrimaryCount,
  };
}
