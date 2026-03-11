// exec-narratives.js — Scope-level editorial narratives for the Executive Status modal.
// Each entry maps a scope key to a short, human-readable summary of the work.
// Kept separate to stay under the 600-line rule and make content updates easy.
// To update a narrative, just edit the paragraph strings below.

/* global PHASE_DEFS */

const EXEC_NARRATIVES = {

  overall: [
    'The E2E Fashion Transformation is modernizing how Walmart designs, buys, and ' +
    'allocates Fashion merchandise. We are connecting previously siloed tools — Centric PLM, ' +
    'AEX, AP Tool, BPE/DBP, and TTP — into a single integrated ecosystem where decisions in ' +
    'one system cascade automatically downstream, eliminating manual re-entry and sequential handoffs.',

    'The program runs across three phases: Phase 1 Setup & Integration (now through Oct 2026) ' +
    'lays the data and tool foundation; Phase 2 Recommend & Optimize (Aug 2026–Apr 2027) activates ' +
    'intelligent recommendations and dynamic redistribution; Phase 3 Automate (Feb–Oct 2027) shifts ' +
    'merchants from executing decisions to encoding strategy and letting the system generate scenarios.',

    'Key FY27 commitments include 90% of buys on the happy path, zero rekeys across the E2E ' +
    'workflow, and happy-path buying execution. The primary watchpoint is the Centric Visual Boards ' +
    'contract — a contract signature unlocks the 12-week onboarding window needed for the May 2026 pilot.',
  ],

  strategy: [
    'The Strategy workstream is the connective tissue of the entire E2E program, operating through ' +
    'the TTP (Trend-to-Product) hub. All financial targets, category priorities, and seasonal ' +
    'guardrails originate here and cascade automatically to Design, Buying, and Allocation.',

    'Active Q1 deliverables include the Strategy Hub as the shared source of truth for seasonal ' +
    'targets, the Trend API delivering macro trend signals into Centric and AEX, V1 Trend-to-Packaging ' +
    'Redesign workflow (in production), and the V1 Synthetic Consumer Panel (live with WMT Data ' +
    'Ventures) simulating customer response before production commitment.',

    'Looking ahead, the roadmap includes Forecast as Enterprise Service (Q2) — a single, trusted ' +
    'demand signal shared across Buying and Allocation — and a Shared Merch Strategy repository (Phase 3) ' +
    'that will power automated scenario generation and conceptual line plan creation.',
  ],

  design: [
    'The Design workstream is building the connected product creation lifecycle within Centric PLM, ' +
    'replacing fragmented tools (Bamboo Rose, Miro, Excel) with a single system of record for all ' +
    'Fashion product design, specification, sample management, and line planning.',

    'Active Q1 priorities include launching Centric as Design Hub, migrating line planning from AEX ' +
    'to the AP Tool Assortment List (eliminating Excel permanently), activating line planning and ' +
    'calendar management, and building product specifications natively in Centric. A 2-week ' +
    'spike (due Mar 16) will confirm scope and timeline for the AP Tool line plan migration.',

    'The primary watchpoint is Centric Visual Boards — a contract signature is required to secure ' +
    'the 12-week onboarding window needed for the May 2026 pilot. This is the critical path item ' +
    'for Phase 1 Design execution.',
  ],

  buying: [
    'The Buying workstream is the largest in scope — spanning AEX platform stability, automated ' +
    'item setup, buy quantity automation, AP Tool line plan integration, and visual rack planning. ' +
    'The goal is to move 90% of buys onto a fully automated happy path by the end of Phase 1.',

    'Active priorities include AEX Stability improvements through April, Auto Item Setup (3 pillars: ' +
    'Gen AI Data Enrichment, Parent Anchored Variant Groups, and Seamless AEX→Item Data Flow), ' +
    'Long-Term Buying execution, and the Item Repository / AI Item discovery work in active discovery. ' +
    'All active Buying items are currently Green.',

    'Q2 and Q3 priorities include Visual Rack Plan, BAM / Collaboration integration, Size & Pack BQ ' +
    'automation, and the AP Tool Line Plan integration — the latter being a critical Phase 1 ' +
    'deliverable connecting assortment decisions directly to buy execution without manual re-entry.',
  ],

  allocation: [
    'The Allocation workstream is building the planning and tagging foundations that power all ' +
    'downstream automation in Phase 2 and Phase 3. Without the tagging taxonomy in place, ' +
    'fixture-level recommendations, in-season swaps, and dynamic redistribution cannot activate.',

    'Active Q1 work includes Unified Planning Workflow (BPE as single source of truth for all ' +
    'planning decisions), BPE Seasonal Planning for 5 Fashion departments, and the Tagging & ' +
    'Affinity Graph pilot — using product tagging and affinity models to identify assortment gaps ' +
    'before in-season signals surface. The tagging pilot is the most strategically critical Q2 item.',

    'Upcoming roadmap work (Q2–Q3) includes Enterprise Wave Planning, Distrib Optimization, ' +
    'Tag-Based Recommendations for line and in-season swaps, and Dynamic PO Re-Distribution. ' +
    'These capabilities are dependent on the tagging foundation being validated in the Q2 pilot.',
  ],

  phase1: [
    'Phase 1 — Setup & Integration (Q1–Q3 FY27, Feb–Oct 2026) — is the foundation of the entire ' +
    'LLTT program. Every Phase 2 recommendation and Phase 3 automation depends on the integrations ' +
    'and data pipelines being built now.',

    'Phase 1 connects the core Fashion systems into a single workflow: AP Tool becomes the Fashion ' +
    'Line Plan (replacing Excel in AEX), Centric PLM becomes the Design Hub, BPE becomes the ' +
    'unified planning system of record, and the tagging taxonomy is built as the foundation for ' +
    'all future recommendation and automation capabilities.',

    'Key Phase 1 success metrics: 90% of buys on the happy path, zero rekeys across E2E workflow, ' +
    'and happy-path buying execution fully in place by Oct 2026.',
  ],

  phase2: [
    'Phase 2 — Recommend & Optimize (Q3 FY27–Q1 FY28, Aug 2026–Apr 2027) — activates intelligent ' +
    'recommendations across every workstream, powered by the integrations and tagging taxonomy ' +
    'built in Phase 1.',

    'Phase 2 deliverables include Forecast and Buy Quantification delivered as enterprise services ' +
    '(single, shared signals across all workstreams), Tag-Based Line Recommendations, Tag-Based ' +
    'In-Season Swaps, Dynamic PO Re-Distribution, and a Shared Event Calendar connecting all ' +
    'workstream timelines.',

    'Phase 2 goals: reduce trapped inventory, achieve 85% shop in-stock rate, achieve 90% PO ' +
    'redistribution coverage, and increase sell-through rate. All Phase 2 items are currently ' +
    'on the roadmap and scheduled to begin Q3 FY27.',
  ],

  phase3: [
    'Phase 3 — Automate (Q1–Q3 FY28, Feb–Oct 2027) — is the full vision of the LLTT program. ' +
    'Merchants shift from manually executing decisions to encoding strategy and goals, and the ' +
    'system generates, evaluates, and executes scenarios automatically.',

    'Phase 3 deliverables include a Strategy Repository (capturing strategic intent in structured ' +
    'form), Strategy-Based Conceptual Line Plan creation (generated from encoded strategy), ' +
    'Scenario Generation and Selection, and Tag-Based In-Season Dynamic Placement ' +
    '(fully automated in-season redistribution).',

    'Phase 3 goals align to the Phase 2 outcomes — further reducing trapped inventory, increasing ' +
    'sell-through, and achieving the full merchant hours reduction target (Goal #4) through automation. ' +
    'Phase 3 items are on the long-range roadmap, dependent on Phase 2 completion.',
  ],
};
