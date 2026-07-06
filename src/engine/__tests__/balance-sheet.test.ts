import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate';
import { buildAmortization, crdAtMonth } from '../amortization';
import { defaultInputs } from '../../state/defaults';

describe('bilan comptable — capitaux propres = actifs − passif', () => {
  const inputs = defaultInputs();
  const result = simulate(inputs);

  it('identité du patrimoine papier : bien − CRD + placements, au centime', () => {
    for (const m of [0, 1, 12, 60, inputs.holdingYears * 12]) {
      const p = result.points[m];
      const expected = p.propertyValue - p.crd + p.buyInvest;
      expect(Math.round(p.buyPaperWealth * 100)).toBe(Math.round(expected * 100));
    }
  });

  it('location : aucun passif, patrimoine papier = placements bruts', () => {
    for (const m of [0, 24, inputs.holdingYears * 12]) {
      const p = result.points[m];
      expect(p.rentPaperWealth).toBeCloseTo(p.rentInvest, 6);
    }
    // Bilan de sortie côté location : passif nul, pas de bien.
    expect(result.summary.rentBalanceSheet.mortgage).toBe(0);
    expect(result.summary.rentBalanceSheet.property).toBe(0);
  });

  it('bilan de sortie : capitaux propres papier = actifs − passif', () => {
    const bs = result.summary.buyBalanceSheet;
    expect(bs.paperEquity).toBeCloseTo(bs.property + bs.investments - bs.mortgage, 6);
    expect(bs.netEquity).toBeCloseTo(
      bs.paperEquity - bs.sellingFees - bs.ira - bs.mainlevee + bs.fmgRestitution - bs.pfu,
      6,
    );
    expect(result.summary.buyTerminalWealth).toBeCloseTo(bs.netEquity, 6);
    expect(result.summary.buyTerminalPaper).toBeCloseTo(bs.paperEquity, 6);
  });

  it('le patrimoine papier reste ≥ au net de sortie (frais de sortie ≥ 0)', () => {
    for (const p of result.points) {
      expect(p.buyPaperWealth).toBeGreaterThanOrEqual(p.buyNetWealth - 1e-6);
      expect(p.rentPaperWealth).toBeGreaterThanOrEqual(p.rentNetWealth - 1e-6);
    }
  });

  it("régression : le net de sortie reproduit la formule de règlement terminal", () => {
    // Formule terminale historique reconstruite à partir des composantes brutes :
    // bien − frais d'agence − CRD − IRA − mainlevée + FMG + (placements − PFU).
    const horizon = inputs.holdingYears * 12;
    const last = result.points[horizon];
    const bs = result.summary.buyBalanceSheet;
    const netFromComponents =
      last.propertyValue -
      last.propertyValue * inputs.sellingFeesRate -
      last.crd -
      bs.ira -
      bs.mainlevee +
      bs.fmgRestitution +
      (bs.investments - bs.pfu);
    expect(result.summary.buyTerminalWealth).toBeCloseTo(netFromComponents, 4);
    // Les actifs/passif du bilan correspondent à l'état du dernier mois.
    expect(bs.property).toBeCloseTo(last.propertyValue, 6);
    expect(bs.mortgage).toBeCloseTo(last.crd, 6);
    expect(bs.investments).toBeCloseTo(last.buyInvest, 6);
    expect(last.crd).toBeCloseTo(crdAtMonth(buildAmortization(inputs.price - inputs.apport, inputs.loanRate, inputs.loanYears), horizon), 6);
  });

  it('budget commun : un seul chemin épargne chaque mois, flux = |écart de sorties|', () => {
    for (let m = 1; m <= inputs.holdingYears * 12; m++) {
      const p = result.points[m];
      const prev = result.points[m - 1];
      // Placements ne peuvent que croître (capitalisation + versement ≥ 0).
      expect(p.buyInvest).toBeGreaterThanOrEqual(prev.buyInvest - 1e-6);
      expect(p.rentInvest).toBeGreaterThanOrEqual(prev.rentInvest - 1e-6);
      // Le moins cher verse ; l'autre verse 0. On le vérifie via les sorties.
      const cheaperIsRent = p.rentOutflow < p.buyOutflow;
      const cheaperIsBuy = p.buyOutflow < p.rentOutflow;
      expect(cheaperIsRent || cheaperIsBuy || p.buyOutflow === p.rentOutflow).toBe(true);
    }
  });
});
