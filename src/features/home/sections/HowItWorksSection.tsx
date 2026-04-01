import React from 'react';
import { BUYING_STEPS } from '../../../content/storefront';
import { useScrollReveal } from '../../shared/hooks/useScrollReveal';

const HowItWorksSection: React.FC = () => {
  const { revealClassName, targetRef } = useScrollReveal<HTMLElement>('0px 0px -8% 0px');

  return (
    <section ref={targetRef} className={`mx-auto mt-20 max-w-7xl ${revealClassName}`}>
      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[3rem] border border-zinc-200 bg-zinc-950 p-8 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">How it works</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">A simple path from product page to checkout.</h2>
          <p className="mt-5 text-sm leading-7 text-zinc-300">
            Browse the collection, choose your size, and check out with delivery details in one place. The flow is
            made to feel simple from start to finish.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {BUYING_STEPS.map((step, index) => (
            <div key={step.title} className="rounded-[2.25rem] border border-zinc-200 bg-white p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Step {index + 1}</p>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-950">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-600">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
