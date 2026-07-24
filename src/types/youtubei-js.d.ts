declare module "youtubei.js" {
  export const Innertube: {
    create(options?: Record<string, unknown>): Promise<unknown>;
  };
}
