import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { roastLabels } from '@/lib/roast';

export const revalidate = 600;

export default function Page() {
  const roast = roastLabels(new Date());
  return (
    <>
      <Header />
      <main id="top">
        <Hero roast={roast} />
      </main>
      <Footer />
    </>
  );
}
