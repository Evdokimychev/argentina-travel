import sharp from "sharp";

export const CMS_IMAGE_MAX_WIDTH = 2400;
export const CMS_IMAGE_WEBP_QUALITY = 85;

export type ProcessedCmsImage = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  optimized: boolean;
};

/** GIF and SVG are passed through without re-encoding. */
export function shouldOptimizeCmsImage(mime: string): boolean {
  if (mime === "image/gif" || mime === "image/svg+xml") return false;
  return mime.startsWith("image/");
}

export async function processCmsUploadImage(
  input: Buffer,
  mime: string
): Promise<ProcessedCmsImage | { error: string }> {
  if (!mime.startsWith("image/")) {
    return { error: "Файл не является изображением" };
  }

  if (!shouldOptimizeCmsImage(mime)) {
    try {
      const meta = await sharp(input, { animated: mime === "image/gif" }).metadata();
      const ext = mime === "image/gif" ? "gif" : "svg";
      return {
        buffer: input,
        mimeType: mime,
        extension: ext,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        optimized: false,
      };
    } catch {
      return { error: "Не удалось прочитать изображение" };
    }
  }

  try {
    const pipeline = sharp(input).rotate().resize({
      width: CMS_IMAGE_MAX_WIDTH,
      height: CMS_IMAGE_MAX_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    });

    const buffer = await pipeline.webp({ quality: CMS_IMAGE_WEBP_QUALITY }).toBuffer();
    const meta = await sharp(buffer).metadata();

    return {
      buffer,
      mimeType: "image/webp",
      extension: "webp",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      optimized: true,
    };
  } catch {
    return { error: "Не удалось обработать изображение" };
  }
}
