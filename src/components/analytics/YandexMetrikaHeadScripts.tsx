import {
  getYandexMetrikaCounterId,
  isYandexMetrikaEnabled,
} from "@/lib/analytics/yandex-metrika-config";
import {
  buildYandexMetrikaBootstrapScript,
  parseYandexMetrikaCounterId,
} from "@/lib/analytics/yandex-metrika";

/** SSR loader + init — must be in initial HTML for Yandex counter verification. */
export default function YandexMetrikaHeadScripts() {
  if (!isYandexMetrikaEnabled()) return null;

  const counterId = parseYandexMetrikaCounterId(getYandexMetrikaCounterId());
  if (counterId === null) return null;

  return (
    <>
      <script
        id="yandex-metrika-bootstrap"
        dangerouslySetInnerHTML={{ __html: buildYandexMetrikaBootstrapScript(counterId) }}
      />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${counterId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
