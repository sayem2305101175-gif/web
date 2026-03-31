import { readStoredJson, writeStoredJson } from '../lib/storage';

export interface StorefrontTrustItem {
  eyebrow: string;
  title: string;
  body: string;
}

export interface StorefrontFaqItem {
  question: string;
  answer: string;
}

export interface StorefrontContentSnapshot {
  hero: {
    stripText: string;
    eyebrow: string;
    headline: string;
    description: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
  };
  featuredDrop: {
    productId: string;
    fallbackName: string;
    fallbackBody: string;
    actionLabel: string;
  };
  trust: {
    eyebrow: string;
    headline: string;
    items: StorefrontTrustItem[];
  };
  faq: {
    eyebrow: string;
    headline: string;
    items: StorefrontFaqItem[];
  };
  cta: {
    eyebrow: string;
    headline: string;
    buttonLabel: string;
    chips: string[];
  };
  shipping: {
    title: string;
    message: string;
  };
  returns: {
    title: string;
    message: string;
  };
  updatedAt: string | null;
}

interface StorefrontContentStoragePayload {
  snapshot: StorefrontContentSnapshot;
}

export const STOREFRONT_CONTENT_STORAGE_KEY = 'velosnak_storefront_content_v1';

const DEFAULT_FEATURED_PRODUCT_ID = '6';

const DEFAULT_STOREFRONT_CONTENT: StorefrontContentSnapshot = {
  hero: {
    stripText: 'Free shipping over $300 · 14-day size exchange · new arrivals weekly',
    eyebrow: 'Curated sneaker boutique',
    headline: 'Modern sneakers with premium finish and easy everyday wear.',
    description:
      'Explore a tighter edit of standout pairs, from clean runners to bold statement styles. Every product page includes clear sizing, delivery timing, and saved-item support.',
    primaryCtaLabel: 'Shop collection',
    secondaryCtaLabel: 'Why shop here',
  },
  featuredDrop: {
    productId: DEFAULT_FEATURED_PRODUCT_ID,
    fallbackName: 'Next featured drop',
    fallbackBody: 'A new premium pair is arriving soon. Stay tuned for the next release.',
    actionLabel: 'View product',
  },
  trust: {
    eyebrow: 'Why shop here',
    headline: 'Designed to feel clear, calm, and premium from the first click.',
    items: [
      {
        title: 'Curated Selection',
        body: 'A focused edit of modern runners, low tops, and statement pairs chosen for style, comfort, and everyday wear.',
        eyebrow: 'Selection',
      },
      {
        title: 'Clear Delivery',
        body: 'Shipping timelines are easy to understand, with express options available at checkout for the pairs that need to arrive fast.',
        eyebrow: 'Delivery',
      },
      {
        title: 'Easy Support',
        body: 'Size guidance, saved items, and simple post-purchase support make the store feel calm, helpful, and easy to trust.',
        eyebrow: 'Support',
      },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    headline: 'Questions we hear most.',
    items: [
      {
        question: 'How long does shipping take?',
        answer: 'Standard delivery usually arrives in 2 to 4 business days. Express delivery is available at checkout for faster dispatch.',
      },
      {
        question: 'Can I exchange for another size?',
        answer: 'Yes. Eligible pairs include a 14-day size exchange so you can shop with more confidence.',
      },
      {
        question: 'Can I save styles for later?',
        answer: 'Yes. Tap the heart on any product card to save it and review it later in your account area.',
      },
      {
        question: 'What comes with each order?',
        answer: 'Every order includes secure packaging, order tracking, and simple support if you need help after delivery.',
      },
    ],
  },
  cta: {
    eyebrow: 'Ready to choose your pair?',
    headline: 'Clean silhouettes, fast delivery, and easy size support across the full collection.',
    buttonLabel: 'Open bag',
    chips: ['New arrivals', 'Best sellers', 'Shipping', 'Returns', 'Contact'],
  },
  shipping: {
    title: 'Shipping',
    message: 'Standard delivery arrives in 2-4 business days, with express dispatch available at checkout.',
  },
  returns: {
    title: 'Returns',
    message: 'Need a different size? Eligible pairs include a 14-day size exchange window.',
  },
  updatedAt: null,
};

export const BUYING_STEPS = [
  {
    title: 'Find your pair',
    body: 'Browse by brand or new arrivals, then open the product page to see the fit, finish, and delivery details.',
  },
  {
    title: 'Pick your size',
    body: 'Choose the right size, add it to your bag, and update quantities without losing your place in the collection.',
  },
  {
    title: 'Check out',
    body: 'Review your bag, choose standard or express delivery, and confirm the order details in one clear flow.',
  },
];

// Backwards-compatible exports used by existing storefront sections.
export const STORE_PROMISES = DEFAULT_STOREFRONT_CONTENT.trust.items;
export const FAQS = DEFAULT_STOREFRONT_CONTENT.faq.items;
export const FOOTER_LINKS = DEFAULT_STOREFRONT_CONTENT.cta.chips;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);

const cloneStorefrontContent = (snapshot: StorefrontContentSnapshot): StorefrontContentSnapshot => ({
  ...snapshot,
  hero: { ...snapshot.hero },
  featuredDrop: { ...snapshot.featuredDrop },
  trust: {
    ...snapshot.trust,
    items: snapshot.trust.items.map((item) => ({ ...item })),
  },
  faq: {
    ...snapshot.faq,
    items: snapshot.faq.items.map((item) => ({ ...item })),
  },
  cta: {
    ...snapshot.cta,
    chips: [...snapshot.cta.chips],
  },
  shipping: { ...snapshot.shipping },
  returns: { ...snapshot.returns },
});

const sanitizeTrustItem = (item: unknown, fallback: StorefrontTrustItem): StorefrontTrustItem => {
  if (!isRecord(item)) {
    return { ...fallback };
  }
  return {
    eyebrow: asString(item['eyebrow'], fallback.eyebrow),
    title: asString(item['title'], fallback.title),
    body: asString(item['body'], fallback.body),
  };
};

const sanitizeFaqItem = (item: unknown, fallback: StorefrontFaqItem): StorefrontFaqItem => {
  if (!isRecord(item)) {
    return { ...fallback };
  }
  return {
    question: asString(item['question'], fallback.question),
    answer: asString(item['answer'], fallback.answer),
  };
};

export const sanitizeStorefrontContentSnapshot = (value: unknown): StorefrontContentSnapshot => {
  const fallback = cloneStorefrontContent(DEFAULT_STOREFRONT_CONTENT);
  if (!isRecord(value)) {
    return fallback;
  }

  const rawHero = isRecord(value['hero']) ? value['hero'] : {};
  const rawFeaturedDrop = isRecord(value['featuredDrop']) ? value['featuredDrop'] : {};
  const rawTrust = isRecord(value['trust']) ? value['trust'] : {};
  const rawFaq = isRecord(value['faq']) ? value['faq'] : {};
  const rawCta = isRecord(value['cta']) ? value['cta'] : {};
  const rawShipping = isRecord(value['shipping']) ? value['shipping'] : {};
  const rawReturns = isRecord(value['returns']) ? value['returns'] : {};

  const trustItems = Array.isArray(rawTrust['items']) ? rawTrust['items'] : [];
  const faqItems = Array.isArray(rawFaq['items']) ? rawFaq['items'] : [];
  const ctaChips = Array.isArray(rawCta['chips']) ? rawCta['chips'] : [];

  return {
    hero: {
      stripText: asString(rawHero['stripText'], fallback.hero.stripText),
      eyebrow: asString(rawHero['eyebrow'], fallback.hero.eyebrow),
      headline: asString(rawHero['headline'], fallback.hero.headline),
      description: asString(rawHero['description'], fallback.hero.description),
      primaryCtaLabel: asString(rawHero['primaryCtaLabel'], fallback.hero.primaryCtaLabel),
      secondaryCtaLabel: asString(rawHero['secondaryCtaLabel'], fallback.hero.secondaryCtaLabel),
    },
    featuredDrop: {
      productId: asString(rawFeaturedDrop['productId'], fallback.featuredDrop.productId),
      fallbackName: asString(rawFeaturedDrop['fallbackName'], fallback.featuredDrop.fallbackName),
      fallbackBody: asString(rawFeaturedDrop['fallbackBody'], fallback.featuredDrop.fallbackBody),
      actionLabel: asString(rawFeaturedDrop['actionLabel'], fallback.featuredDrop.actionLabel),
    },
    trust: {
      eyebrow: asString(rawTrust['eyebrow'], fallback.trust.eyebrow),
      headline: asString(rawTrust['headline'], fallback.trust.headline),
      items: fallback.trust.items.map((item, index) => sanitizeTrustItem(trustItems[index], item)),
    },
    faq: {
      eyebrow: asString(rawFaq['eyebrow'], fallback.faq.eyebrow),
      headline: asString(rawFaq['headline'], fallback.faq.headline),
      items: fallback.faq.items.map((item, index) => sanitizeFaqItem(faqItems[index], item)),
    },
    cta: {
      eyebrow: asString(rawCta['eyebrow'], fallback.cta.eyebrow),
      headline: asString(rawCta['headline'], fallback.cta.headline),
      buttonLabel: asString(rawCta['buttonLabel'], fallback.cta.buttonLabel),
      chips: fallback.cta.chips.map((chip, index) => asString(ctaChips[index], chip)),
    },
    shipping: {
      title: asString(rawShipping['title'], fallback.shipping.title),
      message: asString(rawShipping['message'], fallback.shipping.message),
    },
    returns: {
      title: asString(rawReturns['title'], fallback.returns.title),
      message: asString(rawReturns['message'], fallback.returns.message),
    },
    updatedAt: typeof value['updatedAt'] === 'string' ? value['updatedAt'] : fallback.updatedAt,
  };
};

export const getDefaultStorefrontContentSnapshot = (): StorefrontContentSnapshot =>
  cloneStorefrontContent(DEFAULT_STOREFRONT_CONTENT);

export const getStorefrontContentSnapshot = (): StorefrontContentSnapshot => {
  const stored = readStoredJson<StorefrontContentStoragePayload | StorefrontContentSnapshot | null>(
    STOREFRONT_CONTENT_STORAGE_KEY,
    null
  );

  if (!stored) {
    return getDefaultStorefrontContentSnapshot();
  }

  if (isRecord(stored) && isRecord(stored['snapshot'])) {
    return sanitizeStorefrontContentSnapshot(stored['snapshot']);
  }

  return sanitizeStorefrontContentSnapshot(stored);
};

export const saveStorefrontContentSnapshot = (snapshot: StorefrontContentSnapshot): StorefrontContentSnapshot => {
  const now = new Date().toISOString();
  const sanitizedSnapshot = sanitizeStorefrontContentSnapshot(snapshot);
  const nextSnapshot: StorefrontContentSnapshot = {
    ...sanitizedSnapshot,
    updatedAt: now,
  };

  writeStoredJson(STOREFRONT_CONTENT_STORAGE_KEY, { snapshot: nextSnapshot });
  return nextSnapshot;
};
