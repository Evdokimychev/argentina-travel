import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "src/components/tour-detail");
const sharedRoot = join(process.cwd(), "src/components/shared");

function source(fileName: string): string {
  return readFileSync(join(root, fileName), "utf8");
}

describe("tour detail on-demand mobile boundaries", () => {
  it("keeps closed booking dialogs outside the initial route graph", () => {
    const detail = source("TourDetailView.tsx");
    const dialogs = source("OnDemandTourBookingDialogs.tsx");

    expect(detail).toContain('import OnDemandTourBookingDialogs from "./OnDemandTourBookingDialogs"');
    expect(detail).not.toMatch(/^import .*TourCheckoutModal/m);
    expect(detail).not.toMatch(/^import .*PartnerTourBookingModal/m);
    expect(dialogs).toContain('dynamic(() => import("./checkout/TourCheckoutModal")');
    expect(dialogs).toContain("checkoutOpen && !tour.priceOnRequest");
    expect(dialogs).toContain("partnerPreviewOpen ? <PartnerTourBookingModal");
  });

  it("loads review eligibility and authoring only near an explicit review journey", () => {
    const prompt = source("OnDemandReviewPromptBanner.tsx");
    const reviewBoundary = source("OnDemandTourReviewPanel.tsx");
    const detail = source("TourDetailView.tsx");

    expect(prompt).toContain('searchParams.get("review") !== "1"');
    expect(prompt).toContain('dynamic(() => import("./ReviewPromptBanner")');
    expect(reviewBoundary).toContain('window.location.hash === "#leave-review"');
    expect(reviewBoundary).toContain("IntersectionObserver");
    expect(reviewBoundary).toContain('rootMargin: "700px 0px"');
    expect(reviewBoundary).toContain('id="leave-review"');
    expect(detail).not.toContain('from "./TourReviewPanel"');
  });

  it("loads photo upload and lightbox implementations only after user intent", () => {
    const reviewForm = source("TourReviewForm.tsx");
    const gallery = source("TourDetailGallery.tsx");
    const destinationGallery = readFileSync(join(sharedRoot, "DetailPhotoGallery.tsx"), "utf8");
    const partnerGallery = readFileSync(
      join(sharedRoot, "PartnerInfoAutoplayGallery.tsx"),
      "utf8",
    );

    expect(reviewForm).toContain('import("@/components/tour-detail/ReviewPhotoUpload")');
    expect(reviewForm).toContain("photoUploadOpen || photos.length > 0");
    expect(reviewForm).toContain("Добавить фотографии");
    expect(gallery).toContain('import("@/components/shared/DetailGalleryLightbox")');
    expect(gallery).toContain("{lightbox ? (");
    expect(destinationGallery).toContain(
      'import("@/components/shared/DetailGalleryLightbox")',
    );
    expect(partnerGallery).toContain(
      'import("@/components/shared/DetailGalleryLightbox")',
    );
  });
});
