import { CONTACT } from '@/lib/content';

export function Footer() {
  return (
    <div className="w">
      <footer>
        <span>Кварта · обжарка в Минске</span>
        <span>Короля, 9 · {CONTACT.phone}</span>
      </footer>
    </div>
  );
}
