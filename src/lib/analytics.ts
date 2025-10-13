export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

declare global {
  interface Window {
    analytics?: {
      track?: (name: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  try {
    if (window.analytics?.track) {
      window.analytics.track(name, properties);
      return;
    }
  } catch (error) {
    // Fallback to console logging if analytics client fails.
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[analytics] ${name}`, properties ?? {});
  }
}
