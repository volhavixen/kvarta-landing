import { Catalog } from '@/components/Catalog';
import { Delivery } from '@/components/Delivery';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { LeadForm } from '@/components/LeadForm';
import { Roasters } from '@/components/Roasters';
import { Subscription } from '@/components/Subscription';
import { ToTop } from '@/components/ToTop';
import { roastLabels } from '@/lib/roast';

export const revalidate = 600;

export default function Page() {
  const roast = roastLabels(new Date());
  return (
    <>
      <Header />
      <main id="top">
        <Hero roast={roast} />
        <Catalog />
        <Subscription />
        <Delivery />
        <Roasters />
        <LeadForm roast={roast} />
      </main>
      <Footer />
      <ToTop />
    </>
  );
}
