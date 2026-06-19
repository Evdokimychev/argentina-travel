(function () {
  "use strict";

  var SCRIPT = document.currentScript;
  var BASE = SCRIPT && SCRIPT.src ? new URL(SCRIPT.src).origin : window.location.origin;

  function readAttr(el, name) {
    var value = el.getAttribute(name);
    return value && value.trim() ? value.trim() : "";
  }

  function buildEmbedUrl(el) {
    var params = new URLSearchParams();
    var variant = readAttr(el, "data-variant");
    var title = readAttr(el, "data-title");
    var subtitle = readAttr(el, "data-subtitle");
    var limit = readAttr(el, "data-limit");
    var organizer = readAttr(el, "data-organizer");
    var theme = readAttr(el, "data-theme");
    var destination = readAttr(el, "data-destination");
    var region = readAttr(el, "data-region");
    var query = readAttr(el, "data-query");
    var preset = readAttr(el, "data-preset");
    var slugs = readAttr(el, "data-slugs");
    var catalog = readAttr(el, "data-catalog");
    var catalogLabel = readAttr(el, "data-catalog-label");

    if (variant) params.set("variant", variant);
    if (title) params.set("title", title);
    if (subtitle) params.set("subtitle", subtitle);
    if (limit) params.set("limit", limit);
    if (organizer) params.set("organizer", organizer);
    if (theme === "dark" || theme === "light") params.set("theme", theme);
    if (destination) params.set("destination", destination);
    if (region) params.set("region", region);
    if (query) params.set("query", query);
    if (preset) params.set("preset", preset);
    if (slugs) params.set("slugs", slugs);
    if (catalog) params.set("catalog", catalog);
    if (catalogLabel) params.set("catalogLabel", catalogLabel);

    params.set("tone", "inline");
    return BASE + "/embed/tours?" + params.toString();
  }

  function mount(el) {
    if (el.getAttribute("data-pva-mounted") === "true") return;
    el.setAttribute("data-pva-mounted", "true");

    var iframe = document.createElement("iframe");
    iframe.src = buildEmbedUrl(el);
    iframe.title = readAttr(el, "data-title") || "Туры по Аргентине";
    iframe.loading = "lazy";
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    );
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.minHeight = readAttr(el, "data-height") || "420px";
    iframe.style.display = "block";
    iframe.style.borderRadius = readAttr(el, "data-radius") || "16px";

    el.innerHTML = "";
    el.appendChild(iframe);
  }

  function init() {
    var nodes = document.querySelectorAll("[data-pva-tours]");
    for (var i = 0; i < nodes.length; i += 1) {
      mount(nodes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.PvaToursEmbed = {
    mount: mount,
    refresh: init,
  };
})();
