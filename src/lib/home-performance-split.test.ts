import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const componentRoot = join(process.cwd(), "src/components/marketplace");

describe("homepage client bundle boundaries", () => {
  it("keeps the primary tour search eager and lazy-loads alternative search engines", () => {
    const source = readFileSync(join(componentRoot, "HomeMultiSearch.tsx"), "utf8");

    expect(source).toContain('import SearchBlock from "./SearchBlock"');
    expect(source).toContain('dynamic(() => import("./HomeFlightSearchBlock")');
    expect(source).toContain('dynamic(() => import("./HomeExcursionSearchBlock")');
    expect(source).toContain('dynamic(() => import("./HomeFlightPopularRoutes")');
    expect(source).not.toContain('import HomeFlightSearchBlock from "./HomeFlightSearchBlock"');
  });

  it("splits conditional and below-fold marketplace widgets from the page entry", () => {
    const source = readFileSync(join(componentRoot, "MarketplaceHome.tsx"), "utf8");

    expect(source).toContain('dynamic(() => import("./MarketplaceTourCard")');
    expect(source).toContain('dynamic(() => import("@/components/embed/TourEmbedSection")');
    expect(source).toContain('dynamic(() => import("./PlatformStatsBlock")');
    expect(source).toContain('dynamic(() => import("./HomeTestimonialsSection")');
    expect(source).not.toContain('import MarketplaceTourCard from "./MarketplaceTourCard"');
  });

  it("flushes one permanent hero before request-bound marketplace data", () => {
    const page = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const home = readFileSync(join(componentRoot, "MarketplaceHome.tsx"), "utf8");
    const hero = readFileSync(join(componentRoot, "MarketplaceHomeHero.tsx"), "utf8");
    const collage = readFileSync(join(componentRoot, "HomeHeroCollage.tsx"), "utf8");
    const nextConfig = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");

    expect(page).toContain("const actorPromise = resolveInteractionActor()");
    expect(page).toContain("const toursPromise = fetchMarketplaceTours()");
    expect(page).toContain("const catalogData = loadMarketplaceHomeCatalogData(");
    expect(page).toContain("const testimonials = loadMarketplaceHomeTestimonials()");
    expect(page).toContain("const excursionCities = fetchExcursionCitiesServer()");
    expect(page).not.toContain("export default async function HomePage");
    expect(home).toContain("catalogData: Promise<MarketplaceHomeCatalogData>");
    expect(home).toContain("testimonials: Promise<Testimonial[]>");
    expect(home).toContain("excursionCities: Promise<ExcursionCity[]>");
    expect(home).toContain("<MarketplaceHomeHero");
    expect(home).toContain("<Suspense fallback={<HomeSearchFallback />}");
    expect(home).toContain('className="min-h-screen border-b border-gray-100 bg-surface-elevated"');
    expect(hero).toContain("Static first-screen frame");
    expect(collage).toContain('const MOBILE_HERO_SRC = "/media/home/hero-mobile.webp"');
    expect(hero.match(/prefetch=\{false\}/g)).toHaveLength(2);
    expect(nextConfig).toContain("qualities: [60, 75]");
    expect(hero.match(/<h1/g)).toHaveLength(1);
    expect(home).not.toContain("<h1");
  });

  it("does not make the default tour search wait for excursion cities", () => {
    const search = readFileSync(join(componentRoot, "HomeMultiSearch.tsx"), "utf8");

    expect(search).toContain("excursionCities: Promise<ExcursionCity[]>");
    expect(search).toContain("function HomeExcursionSearchData(");
    expect(search).toContain("cities={use(cities)}");
    expect(search).toContain("<Suspense fallback={<SearchPanelSkeleton />}>");
  });

  it("allows the home search grid item to shrink to a mobile viewport", () => {
    const search = readFileSync(join(componentRoot, "HomeMultiSearch.tsx"), "utf8");
    const hero = readFileSync(join(componentRoot, "MarketplaceHomeHero.tsx"), "utf8");
    const flights = readFileSync(join(componentRoot, "HomeFlightSearchBlock.tsx"), "utf8");

    expect(hero).toContain("order-2 min-w-0 w-full max-w-full");
    expect(search).toContain("min-w-0 w-full max-w-full space-y-3");
    expect(search).toContain("overflow-x-hidden rounded-3xl");
    expect(flights).toContain("flex min-w-0 w-full max-w-full flex-col");
  });

  it("loads independent excursion city sources in parallel", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/excursion-server.ts"),
      "utf8",
    );

    expect(source).toContain("const nativePromise = fetchNativeExcursionListings(supabase)");
    expect(source).toContain("const [tripsterFallback, sputnik8Fallback] = await Promise.all([");
    expect(source).toContain("const native = await nativePromise");
  });

  it("keeps repository seeds and the media manifest out of homepage client helpers", () => {
    const home = readFileSync(join(componentRoot, "MarketplaceHome.tsx"), "utf8");
    const card = readFileSync(join(componentRoot, "MarketplaceTourCard.tsx"), "utf8");
    const ranking = readFileSync(
      join(process.cwd(), "src/lib/tour-listing-ranking.ts"),
      "utf8",
    );
    const organizerRouting = readFileSync(
      join(process.cwd(), "src/lib/organizer-public-routing.ts"),
      "utf8",
    );

    expect(home).toContain('from "@/lib/tour-listing-ranking"');
    expect(home).not.toContain('from "@/lib/tour-recommendations"');
    expect(card).toContain('from "@/lib/organizer-public-routing"');
    expect(ranking).not.toContain("tour-repository");
    expect(ranking).not.toContain("marketplace-tours");
    expect(organizerRouting).not.toContain("tour-repository");
    expect(organizerRouting).not.toContain("media-resolver");
  });

  it("does not pull the complete blog dataset into each public article card", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/blog/BlogCard.tsx"),
      "utf8",
    );

    expect(source).toContain("formatBlogDate");
    expect(source).not.toContain('from "@/data/blog"');
  });

  it("projects homepage blog cards before crossing the client boundary", () => {
    const page = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(page).toContain('from "@/lib/blog-index-payload"');
    expect(page).toContain("blogPosts={toBlogIndexCatalog(blogPosts.slice(0, 3))}");
    expect(page).not.toContain("blogPosts={blogPosts.slice(0, 3)}");
  });

  it("mounts the global search index only after an explicit open request", () => {
    const onDemand = readFileSync(
      join(process.cwd(), "src/components/OnDemandPublicDialogs.tsx"),
      "utf8",
    );
    const search = readFileSync(
      join(process.cwd(), "src/components/SiteSearch.tsx"),
      "utf8",
    );

    expect(onDemand).toContain("SITE_SEARCH_OPEN_EVENT");
    expect(onDemand).toContain('dynamic(() => import("@/components/SiteSearch")');
    expect(onDemand).toContain("searchMounted ? <SiteSearch initialOpen={searchInitiallyOpen} /> : null");
    expect(search).toContain("initialOpen = false");
    expect(search).toContain("const [open, setOpen] = useState(false)");
    expect(search).toContain("if (initialOpen) setOpen(true)");
  });

  it("mounts the MapLibre quick map only after an explicit open request", () => {
    const onDemand = readFileSync(
      join(process.cwd(), "src/components/OnDemandPublicDialogs.tsx"),
      "utf8",
    );
    const mapDialog = readFileSync(
      join(process.cwd(), "src/components/quick-explore/QuickExploreMapDialog.tsx"),
      "utf8",
    );
    const quickExploreProvider = readFileSync(
      join(process.cwd(), "src/context/QuickExploreContext.tsx"),
      "utf8",
    );

    expect(onDemand).toContain("SITE_MAP_OPEN_EVENT");
    expect(onDemand).toContain('import("@/components/quick-explore/QuickExploreDialogHost")');
    expect(onDemand).toContain("mapMounted ? <QuickExploreDialogHost initialOpen={mapInitiallyOpen} /> : null");
    expect(mapDialog).toContain("const [open, setOpen] = useState(false)");
    expect(mapDialog).toContain("if (initialOpen) setOpen(true)");
    expect(quickExploreProvider).not.toContain("scheduleQuickExplorePrefetch");
  });

  it("keeps the blog-backed navigation catalog behind the server layout boundary", () => {
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const header = readFileSync(join(process.cwd(), "src/components/Header.tsx"), "utf8");
    const overflow = readFileSync(
      join(process.cwd(), "src/components/navigation/NavOverflowMegaMenuTrigger.tsx"),
      "utf8",
    );
    const services = readFileSync(
      join(process.cwd(), "src/components/navigation/MegaMenuServicesFooter.tsx"),
      "utf8",
    );
    const layoutHook = readFileSync(
      join(process.cwd(), "src/hooks/useSiteNavLayout.ts"),
      "utf8",
    );
    const mobileNav = readFileSync(
      join(process.cwd(), "src/data/site-nav-mobile.ts"),
      "utf8",
    );
    const staticServices = readFileSync(
      join(process.cwd(), "src/data/site-nav-client-static.ts"),
      "utf8",
    );

    expect(layout).toContain('from "@/data/site-nav"');
    expect(layout).toContain("const publicNavSections = filterSiteNavSections(");
    expect(layout).toContain("siteNavSections={publicNavSections}");
    expect(header).not.toContain('from "@/data/site-nav"');
    expect(overflow).not.toContain('from "@/data/site-nav"');
    expect(services).not.toContain('from "@/data/site-nav"');
    expect(layoutHook).not.toContain('from "@/data/site-nav"');
    expect(mobileNav).not.toContain('from "@/data/site-nav"');
    expect(staticServices).not.toContain('href: "/transfers"');
  });

  it("fails closed before rendering the homepage transfer teaser", () => {
    const travelPrep = readFileSync(
      join(process.cwd(), "src/components/flights/TravelPrepStrip.tsx"),
      "utf8",
    );

    expect(travelPrep).toContain("evaluatePublicModuleAccess(");
    expect(travelPrep).toContain('"transfers",');
    expect(travelPrep).toContain('"public_read",');
  });
});
