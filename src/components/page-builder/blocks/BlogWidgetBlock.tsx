import TravelWidgetRenderer from "@/components/travel/TravelWidgetRenderer";

type Props = {
  widgetKey: string;
  title?: string;
  config?: Record<string, string>;
};

export default function BlogWidgetBlock({ widgetKey, title }: Props) {
  return <TravelWidgetRenderer widgetKey={widgetKey} title={title} className="my-6" />;
}
