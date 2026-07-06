import { FRANCE } from '../config/france';
import type { Copy } from '../i18n';
import { SourceBadge } from './fields';

/** Section méthodologie permanente, en bas de page. */
export function Methodologie({ t }: { t: Copy['method'] }) {
  return (
    <section className="card methodo" id="methodologie">
      <h2>{t.title}</h2>

      <h3>{t.h1}</h3>
      <p>{t.p1}</p>

      <h3>{t.h2}</h3>
      <ul>
        <li>
          {t.buySettle}
        </li>
        <li>
          {t.rentSettle}
        </li>
      </ul>

      <h3>{t.h3}</h3>
      <p>{t.p3}</p>

      <h3>{t.h4}</h3>
      <p>
        {t.p4} <SourceBadge constant={FRANCE.taxeFonciereGrowthDefault} />
      </p>

      <h3>{t.h5}</h3>
      <ul>
        {t.exclusions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3>{t.h6}</h3>
      <p>
        {t.p6a} (<SourceBadge constant={FRANCE.appreciationDefault} />){t.p6b}
      </p>
    </section>
  );
}
