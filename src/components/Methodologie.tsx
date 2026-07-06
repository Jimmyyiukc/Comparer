import { FRANCE } from '../config/france';
import { fmtPct } from '../lib/format';
import { SourceBadge } from './fields';

/** Section méthodologie permanente, en bas de page. */
export function Methodologie() {
  return (
    <section className="card methodo" id="methodologie">
      <h2>Méthodologie</h2>

      <h3>Registre mensuel, pas d'approximation annuelle</h3>
      <p>
        Chaque mois, le simulateur enregistre les sorties réelles des deux chemins — côté achat : mensualité
        (intérêts + capital), assurance emprunteur, taxe foncière/12, charges de copropriété, provision travaux,
        entretien, surcoût d'assurance propriétaire ; côté location : loyer. Le différentiel du mois est investi du
        côté le moins cher au taux de marché composé mensuellement. Le locataire investit dès le départ l'apport et
        tous les frais d'achat évités (notaire, garantie, dossier). Aucune actualisation (NPV) : on compare des
        patrimoines terminaux.
      </p>

      <h3>Règlement terminal</h3>
      <ul>
        <li>
          <strong>Achat</strong> : <code>prix × (1+appréciation)^années − frais d'agence − capital restant dû − IRA
          + restitution FMG (caution)</code>. IRA = min(6 mois d'intérêts, 3 % du CRD), souvent négociées. La
          plus-value est <strong>exonérée</strong> (résidence principale).
        </li>
        <li>
          <strong>Location</strong> : valeur du portefeuille, moins PFU {fmtPct(FRANCE.pfuRate.value, 0)} sur les
          gains si activé (défaut : activé).
        </li>
      </ul>

      <h3>Loyers : modèle à deux régimes</h3>
      <p>
        En cours de bail, le loyer suit l'IRL (palier annuel, plafonné à {fmtPct(FRANCE.irlCap.value, 1)}, référence
        bouclier loyer) ; à chaque relocation (tous les {FRANCE.tenancyYearsDefault.value} ans par défaut), il est
        remis au niveau du marché, qui suit sa propre trajectoire. Les hypothèses de croissance des loyers sont
        volontairement inférieures à l'appréciation immobilière par défaut.
      </p>

      <h3>Taxe foncière</h3>
      <p>
        Sa croissance est modélisée séparément de l'inflation : la base cadastrale est indexée sur l'IPCH depuis
        2018 (+7,1 % en 2023, +3,9 % en 2024), à quoi s'ajoute le risque de hausse des taux communaux.{' '}
        <SourceBadge constant={FRANCE.taxeFonciereGrowthDefault} />
      </p>

      <h3>Ce qui n'est volontairement PAS modélisé (v1)</h3>
      <ul>
        <li>La taxation de la plus-value hors résidence principale (bascule « investissement locatif »).</li>
        <li>Le PTZ et les prêts aidés.</li>
        <li>Le rachat / la renégociation de crédit en cours de route.</li>
        <li>Toute simulation stochastique (Monte Carlo) : le moteur est déterministe.</li>
      </ul>

      <h3>Avertissement sur les paramètres de scénario</h3>
      <p>
        L'appréciation du bien et le rendement des placements sont des <strong>axes de scénario</strong>, pas des
        prévisions. Le long terme parisien est de l'ordre de 3–4 % nominal avec des décennies entières de baisse{' '}
        (<SourceBadge constant={FRANCE.appreciationDefault} />) ; la heatmap de sensibilité est là pour explorer,
        pas pour prédire. Toutes les valeurs par défaut sont sourcées et datées — survolez les annotations.
      </p>
    </section>
  );
}
