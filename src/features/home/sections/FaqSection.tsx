import React from 'react';
import type { StorefrontContentSnapshot } from '../../../content/storefront';
import { useScrollReveal } from '../../shared/hooks/useScrollReveal';

interface FaqSectionProps {
  faqContent: StorefrontContentSnapshot['faq'];
}

const FaqSection: React.FC<FaqSectionProps> = ({ faqContent }) => {
  const { revealClassName, targetRef } = useScrollReveal<HTMLElement>('0px 0px -8% 0px');

  return (
    <section id="faq" ref={targetRef} className={`mx-auto mt-20 max-w-7xl ${revealClassName}`}>
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{faqContent.eyebrow}</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">{faqContent.headline}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {faqContent.items.map((item) => (
          <div key={item.question} className="rounded-[2rem] border border-zinc-200 bg-white p-6">
            <h3 className="text-xl font-black tracking-tight text-zinc-950">{item.question}</h3>
            <p className="mt-4 text-sm leading-7 text-zinc-600">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;
