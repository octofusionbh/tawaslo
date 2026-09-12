import { useSyncExternalStore } from "react";

// Portrait phones and compact landscape use the same browsing-only policy.
export const MOBILE_WEB_QUERY = "(max-width: 767.98px), (max-width: 960px) and (max-height: 500px)";
export const COMPACT_NAV_QUERY = "(max-width: 1023.98px)";
export const mobileWebNow = () => typeof window !== "undefined" && window.matchMedia(MOBILE_WEB_QUERY).matches;
export const canPublishOnWeb = () => !mobileWebNow();
export const mobilePage = (page, mobile) => mobile && page === "publisher" ? "dashboard" : page;

function useMediaQuery(query) {
  const subscribe = callback => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
export const useMobileWeb = () => useMediaQuery(MOBILE_WEB_QUERY);
export const useCompactNavigation = () => useMediaQuery(COMPACT_NAV_QUERY);
export function stopMobilePublishing(event) {
  if (mobileWebNow() && event.target.closest('[data-publishing-action="true"]')) {
    event.preventDefault();
    event.stopPropagation();
  }
}
