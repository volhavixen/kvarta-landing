export function Header() {
  return (
    <div className="w">
      <header className="top">
        <a className="logo" href="#top">КВАРТА</a>
        <nav className="nav" aria-label="Основная навигация">
          <a href="#coffee">Кофе</a>
          <a href="#subscription">Подписка</a>
          <a href="#delivery">Доставка</a>
          <a className="cta" href="#form" data-pick-type="subscription">Оставить заявку</a>
        </nav>
      </header>
    </div>
  );
}
