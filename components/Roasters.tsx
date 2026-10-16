import Image from 'next/image';

export function Roasters() {
  return (
    <section id="roasters">
      <div className="w roasters-layout">
        <div className="roasters-copy">
          <h2>Кто обжаривает</h2>
          <h3>Аня и Дмитрий</h3>
          <p>Раньше работали бариста и видели, как хороший кофе доезжает до чашки уже уставшим. В 2019-м поставили ростер и стали обжаривать сами.</p>
        </div>
        <div className="roasters-photo">
          <Image src="/roaster.jpg" alt="Двое обжарщиков у ростера пересыпают свежее зерно" fill sizes="(min-width: 840px) 500px, 100vw" style={{ objectFit: 'cover', objectPosition: 'center 30%' }} />
        </div>
      </div>
    </section>
  );
}
