/**
 * Keeps the language-dependent parts of <head> in sync with the active locale.
 *
 * index.html ships the English metadata so a crawler that never runs the script
 * still gets a complete head; this only rewrites it when the visitor (or a
 * `?lang=` link) selects the other language.
 *
 * The canonical URL is derived from the locale rather than from location.href:
 * `?lang=en`, a stray UTM tag or a `#about` fragment all describe the same
 * English page, and only the two canonical forms below should be indexed.
 */

import { getLocale, t, type Locale } from './i18n';

const SITE = 'https://svg.xiaohan.dev/';

/** The one indexable URL for a locale — English lives at the bare origin. */
function pageUrl(locale: Locale): string {
  return locale === 'zh' ? `${SITE}?lang=zh` : SITE;
}

const OG_LOCALE: Record<Locale, string> = { zh: 'zh_CN', en: 'en_US' };

function setContent(selector: string, value: string): void {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', value);
}

export function syncHeadMeta(): void {
  const locale = getLocale();
  const title = t('docTitle');
  const description = t('metaDescription');
  const url = pageUrl(locale);

  document.querySelector<HTMLLinkElement>('#canonicalLink')?.setAttribute('href', url);

  setContent('meta[name="description"]', description);
  setContent('#ogUrl', url);
  setContent('#ogTitle', title);
  setContent('#ogDescription', description);
  setContent('#ogLocale', OG_LOCALE[locale]);
  setContent('#twitterTitle', title);
  setContent('#twitterDescription', description);
}
