import type { ReactNode } from "react";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import LeadBlock from "@/editorial/blocks/LeadBlock";
import ArticleSummary from "@/editorial/blocks/ArticleSummary";
import SourcesBlock from "@/editorial/blocks/SourcesBlock";
import CountryTip from "@/editorial/blocks/CountryTip";
import Phrasebook from "@/editorial/blocks/Phrasebook";
import OptionSelector from "@/editorial/blocks/OptionSelector";
import ProsCons from "@/editorial/blocks/ProsCons";
import PhotoBlock from "@/editorial/media/PhotoBlock";
import FallbackBlock from "@/editorial/renderers/FallbackBlock";
import { getEditorialRegistryEntry } from "@/editorial/registry/definitions";

type LegacyRenderer = (block: BlogBodyBlock, index: number, linkifyText?: boolean) => ReactNode;

type Props = {
  block: BlogBodyBlock;
  index: number;
  linkifyText?: boolean;
  /** Existing BlogSectionBody switch for stable/legacy types */
  renderLegacy: LegacyRenderer;
};

/** Renders new editorial blocks; delegates known legacy types to existing renderer. */
export function renderEditorialBlock({
  block,
  index,
  linkifyText,
  renderLegacy,
}: Props): ReactNode {
  const entry = getEditorialRegistryEntry(block.type);
  if (!entry && process.env.NODE_ENV === "development") {
    console.warn(`[editorial] unknown block type: ${block.type}`);
  }

  try {
    switch (block.type) {
      case "lead":
        return (
          <LeadBlock
            key={index}
            text={block.text}
            variant={block.variant}
            density={block.density}
          />
        );
      case "photo":
        return (
          <PhotoBlock
            key={index}
            src={block.src}
            alt={block.alt}
            caption={block.caption}
            author={block.author}
            sourceUrl={block.sourceUrl}
            license={block.license}
            width={block.width}
            height={block.height}
            priority={block.priority}
            variant={block.variant}
            density={block.density}
          />
        );
      case "article-summary":
        return (
          <ArticleSummary
            key={index}
            title={block.title}
            variant={block.variant}
            items={block.items}
            density={block.density}
          />
        );
      case "sources":
        return (
          <SourcesBlock
            key={index}
            title={block.title}
            variant={block.variant}
            items={block.items}
            density={block.density}
          />
        );
      case "country-tip":
        return (
          <CountryTip
            key={index}
            variant={block.variant}
            title={block.title}
            body={block.body}
            density={block.density}
          />
        );
      case "phrasebook":
        return (
          <Phrasebook
            key={index}
            title={block.title}
            category={block.category}
            items={block.items}
            density={block.density}
          />
        );
      case "option-selector":
        return (
          <OptionSelector
            key={index}
            title={block.title}
            description={block.description}
            options={block.options}
            density={block.density}
          />
        );
      case "pros-cons":
        return (
          <ProsCons
            key={index}
            title={block.title}
            pros={block.pros}
            cons={block.cons}
            recommendation={block.recommendation}
            density={block.density}
          />
        );
      default:
        return renderLegacy(block, index, linkifyText) ?? (
          <FallbackBlock key={index} type={block.type} />
        );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[editorial] failed to render ${block.type}`, error);
    }
    return (
      <FallbackBlock
        key={index}
        type={block.type}
        message={`Ошибка рендера блока «${block.type}»`}
      />
    );
  }
}
