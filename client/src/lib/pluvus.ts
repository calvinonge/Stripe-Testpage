type Pluvus = {
  getClickId?: () => string | null;
  trackConversion?: (params: { amount: number; currency: string; externalId: string }) => void | Promise<unknown>;
};

declare global {
  interface Window {
    pluvus?: Pluvus;
  }
}

const trackerId = import.meta.env.VITE_PLUVUS_TRACKER_ID?.trim();
const campaignSlug = import.meta.env.VITE_PLUVUS_CAMPAIGN_SLUG?.trim();
export const pluvusTrackerId = trackerId && /^[a-zA-Z0-9-]{1,100}$/.test(trackerId) ? trackerId : undefined;
export const affiliateSignupEndpoint = campaignSlug && /^[a-zA-Z0-9-]{1,100}$/.test(campaignSlug)
  ? `https://pluvus.com/api/join/${campaignSlug}`
  : undefined;

let scriptLoading: Promise<Pluvus | undefined> | undefined;

export function loadPluvus() {
  if (!pluvusTrackerId || window.pluvus) return Promise.resolve(window.pluvus);

  scriptLoading ??= new Promise((resolve) => {
    const script = document.createElement("script");
    const finish = () => {
      window.clearTimeout(timeout);
      resolve(window.pluvus);
    };
    const timeout = window.setTimeout(finish, 4000);
    script.async = true;
    script.src = `https://pluvus.com/api/track/script/${pluvusTrackerId}`;
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", finish, { once: true });
    document.head.append(script);
  });
  return scriptLoading;
}

export function readPluvusClickId() {
  if (!pluvusTrackerId) return undefined;
  try {
    const clickId = window.pluvus?.getClickId?.()?.trim();
    return clickId && clickId.length <= 150 ? clickId : undefined;
  } catch {
    return undefined;
  }
}
