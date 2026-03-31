// data-biz-impact.js — Business Impact Timeline data
// Scope: Q1 + Q2 FY27 only (Feb–Jul 2026)
// Programs: Automated Item Setup, AEX Stability, Centric Visual Board MVP
//
// Philosophy: focus on the PROBLEM being solved, not the "how".
//   type: 'automation' — work REMOVED from the team (they no longer do this)
//   type: 'capability' — new thing the team CAN now do
//
// Organized by business goal (horizontal axis of the impact chart).

const BIZ_IMPACT_GOALS = [
  {
    id: 'zero-rekeys',
    label: 'Zero Rekeys',
    icon: '✏️',
    color: '#0053e2',
    description: 'Stop re-entering data between systems. Every decision captured once, flowing everywhere.',
    capabilities: [
      {
        label: 'Item data flows from AEX decisions directly into item setup — no merchant re-entry',
        program: 'Automated Item Setup',
        programId: 'auto-item-setup',
        type: 'automation',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'Structured AEX intent replaces supplier clarification cycles — data captured once, upstream',
        program: 'Automated Item Setup',
        programId: 'auto-item-setup',
        type: 'automation',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'AI auto-completes missing item attributes — merchants stop filling data gaps manually',
        program: 'Automated Item Setup',
        programId: 'auto-item-setup',
        type: 'automation',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'Size ordering unified across Size & Pack — no more reconciling size discrepancies between tools',
        program: 'AEX Stability',
        programId: 'aex-stability',
        type: 'automation',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'Design data entered once in Centric — no re-entry into Bamboo Rose or Miro',
        program: 'Centric Viz Board MVP',
        programId: 'visual-boards',
        type: 'automation',
        quarter: 'Q2',
        target: 'July 30, 2026',
      },
      {
        label: 'Sample status & fit feedback live in the product record — spreadsheets and email threads retired',
        program: 'Centric Viz Board MVP',
        programId: 'visual-boards',
        type: 'automation',
        quarter: 'Q2',
        target: 'July 30, 2026',
      },
    ],
  },
  {
    id: 'happy-path',
    label: 'Happy Path Buying',
    icon: '🛤️',
    color: '#059669',
    description: 'AEX decisions execute end-to-end — no manual workarounds, no exits, no engineering calls.',
    capabilities: [
      {
        label: 'Items set up automatically once AEX decisions are finalized — buying flows end-to-end without merchant intervention',
        program: 'Automated Item Setup',
        programId: 'auto-item-setup',
        type: 'capability',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'IDC team owns item exceptions — merchants stay in AEX focused on buying, not setup troubleshooting',
        program: 'Automated Item Setup',
        programId: 'auto-item-setup',
        type: 'capability',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'Confirmation required before fineline or style deletions — accidental workflow breaks prevented',
        program: 'AEX Stability',
        programId: 'aex-stability',
        type: 'capability',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'New store POs generated automatically — buying team no longer creates new store orders manually',
        program: 'AEX Stability',
        programId: 'aex-stability',
        type: 'automation',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
    ],
  },
  {
    id: 'reduce-hours',
    label: 'Reduce Merchant Hours',
    icon: '⏱️',
    color: '#b86000',
    description: 'Automate the manual, repetitive work so the team can focus on strategy and decisions.',
    capabilities: [
      {
        label: 'Merchants removed from item setup entirely — estimated hundreds of hours saved per season',
        program: 'Automated Item Setup',
        programId: 'auto-item-setup',
        type: 'automation',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'AI completes item attribute gaps — merchants no longer the quality backstop for item data',
        program: 'Automated Item Setup',
        programId: 'auto-item-setup',
        type: 'automation',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: 'AEX platform issues reduced — buying team spends less time escalating bugs and troubleshooting',
        program: 'AEX Stability',
        programId: 'aex-stability',
        type: 'capability',
        quarter: 'Q1',
        target: 'April 30, 2026',
      },
      {
        label: '5,000+ Miro boards consolidated into Centric — design teams stop managing visual boards manually',
        program: 'Centric Viz Board MVP',
        programId: 'visual-boards',
        type: 'automation',
        quarter: 'Q2',
        target: 'July 30, 2026',
      },
      {
        label: 'Bamboo Rose workflows retired — design merchants work in one system, context-switching eliminated',
        program: 'Centric Viz Board MVP',
        programId: 'visual-boards',
        type: 'automation',
        quarter: 'Q2',
        target: 'July 30, 2026',
      },
      {
        label: 'Visual assortment planning in Centric with live product data — no manual export or sync needed',
        program: 'Centric Viz Board MVP',
        programId: 'visual-boards',
        type: 'capability',
        quarter: 'Q2',
        target: 'July 30, 2026',
      },
    ],
  },
];

// Program → display config (color, short label)
const BIZ_PROGRAM_CONFIG = {
  'auto-item-setup': { label: 'Item Setup',   color: '#f59e0b', textColor: '#1f2937' },
  'aex-stability':   { label: 'AEX Stability', color: '#0053e2', textColor: '#ffffff' },
  'visual-boards':   { label: 'Centric Viz',   color: '#6366f1', textColor: '#ffffff' },
};

window.BIZ_IMPACT_GOALS   = BIZ_IMPACT_GOALS;
window.BIZ_PROGRAM_CONFIG = BIZ_PROGRAM_CONFIG;
