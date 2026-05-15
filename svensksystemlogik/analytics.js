(() => {
  const endpoint = window.SSL_ANALYTICS_ENDPOINT;

  if (!endpoint) return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl) return;

  const startedAt = Date.now();
  const referrer = getReferrer();
  const payloadBase = {
    site: "svensksystemlogik.se",
    path: location.pathname || "/",
    title: document.title,
    referrerOrigin: referrer.origin,
    referrerType: referrer.type,
    viewport: viewportBucket(),
    device: deviceType(),
    language: navigator.language || "",
    connection: connectionType(),
  };

  send("pageview", payloadBase);

  window.addEventListener("load", () => {
    window.setTimeout(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) return;

      send("performance", {
        ...payloadBase,
        ttfb: Math.round(nav.responseStart),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd),
      });
    }, 0);
  }, { once: true });

  let lcpValue = 0;
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1];
        if (last) lcpValue = Math.round(last.startTime);
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden" && lcpValue) {
          send("web-vital", { ...payloadBase, metric: "LCP", value: lcpValue });
        }
      });
    } catch (_error) {
      // Older browsers can skip web-vital reporting.
    }
  }

  function send(type, data) {
    const body = JSON.stringify({
      type,
      at: new Date().toISOString(),
      sessionAgeMs: Date.now() - startedAt,
      ...data,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }

    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  }

  function getReferrer() {
    if (!document.referrer) return { origin: "", type: "direct" };

    try {
      const url = new URL(document.referrer);
      const host = url.hostname.replace(/^www\./, "");
      const searchHosts = ["google.", "bing.", "duckduckgo.", "yahoo.", "ecosia.", "kagi."];
      const type = searchHosts.some((needle) => host.includes(needle)) ? "search" : "referral";
      return { origin: url.origin, type };
    } catch (_error) {
      return { origin: "", type: "unknown" };
    }
  }

  function viewportBucket() {
    const width = window.innerWidth;
    if (width < 480) return "xs";
    if (width < 768) return "sm";
    if (width < 1024) return "md";
    if (width < 1440) return "lg";
    return "xl";
  }

  function deviceType() {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1100) return "tablet";
    return "desktop";
  }

  function connectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || "";
  }
})();
