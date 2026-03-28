// data-goal-map.js — Goal-to-Card mapping for Gantt Chart
// ─────────────────────────────────────────────────────────────────────────────
// Maps each LLTT Goal ID → array of program card IDs that directly contribute.
//
// METHODOLOGY: Seeded from two sources:
//   1. User direction (Mar 2026): "these programs belong to these goals"
//   2. Logical reasoning from card descriptions + goal keyPrograms text
//
// CONFIDENCE TIERS (documented inline per card):
//   ★★★ = explicitly called out by team or in goal.keyPrograms
//   ★★☆ = strongly implied by card description + goal definition
//   ★☆☆ = reasonable inference — review with team
//
// TO ITERATE: Update arrays below and re-publish. No other files need changing.
// ─────────────────────────────────────────────────────────────────────────────

const GOAL_CARD_MAP = {

  // ── PHASE 1 GOALS ──────────────────────────────────────────────────────────

  '1': [
    // Goal: 90% of Buys on Happy Path
    // Definition: Buys flow AEX end-to-end with ZERO manual workarounds or exits.
    'neo-replatform',         // ★★★ User called out — platform foundation; all future AEX capability requires this
    'aex-stability',          // ★★★ User called out — buys cannot be on happy path if platform is unstable
    'ap-tool-lineplan',       // ★★★ keyProgram: "AP Tool Integration — Replace Line Plan in AEX" = gateway step of the happy path
    'ai-item-repository',     // ★★★ keyProgram: "Item Selection (Repository Connection) — Auto-populate items"
    'size-pack-bq',           // ★★★ keyProgram: "Automated BQ — Eliminate manual Size & Pack steps"
    'enterprise-wave-planning',// ★★★ keyProgram: "New Store PO Automation — Remove manual PO creation"
    'commitment-report-redesign',// ★★☆ Pre-commit screen + lock modules post-bridge = directly enables happy path lock-in
    'auto-item-setup',        // ★★☆ Item creation quality & speed is a required downstream step of the happy path flow
    'fashion-fixture-allocation-buying', // ★☆☆ Visual rack plan connects assortment strategy to fixture execution
  ],

  '2': [
    // Goal: Zero Rekeys Across E2E Workflow
    // Definition: 0 manual re-entry of data from one tool/step to the next.
    // User: AEX Replatform, AEX Stability; Centric + Fit Work; Item Repo + Auto Item Setup

    // — Buying / AEX platform layer —
    'neo-replatform',         // ★★★ User called out — modern backend removes manual data reconciliation
    'aex-stability',          // ★★★ User called out — unstable system forces users to re-enter data manually
    'ap-tool-lineplan',       // ★★★ AP Tool data flows INTO AEX without re-entry — eliminates the LP rekey
    'bam-collab-intent',      // ★★★ keyProgram: Collab replaces email as supplier system of record — eliminates supplier data rekeys
    'commitment-report-redesign', // ★★★ keyPrograms: Item 360 Integration + Intended Item Report Standardization + data flow to markdown/replen
    'auto-item-setup',        // ★★★ User called out — Gen AI enrichment + seamless AEX→Item data flow eliminates manual item setup
    'ai-item-repository',     // ★★★ User: "enter information once" — item data from repository auto-populates downstream

    // — Design layer — user: "Centric + Fit = enter once, no reentry across walmart systems" —
    'design-hub-centric',     // ★★★ User: Centric launch = single system of record for design; eliminates parallel tool entry
    'sample-mgmt-fit-eval',   // ★★★ User: Fit work = structured in-system; eliminates email/spreadsheet tracking of sample status
    'fit-eval-workflow',      // ★★★ User: Fit workflow in Centric = fit feedback in record, not re-entered elsewhere
    'product-specs',          // ★★☆ Single source of truth for product attributes in Centric — eliminates attribute rekeys to sourcing/buying
    'centric-integration',    // ★★☆ Centric↔AEX↔Supplier One integration closes the design-to-execution data loop

    // — Phase 2 extended: shared item repository scales the "enter once" concept enterprise-wide —
    'shared-item-repository', // ★★☆ OneItem as single source of truth across AEX, LP, Supplier Catalog, and item creation
  ],

  '3': [
    // Goal: Happy Path Buying Execution
    // Definition: Bridge → item creation → PO creation complete WITHOUT engineering intervention.
    // This is the EXECUTION LAYER companion to Goal #1 (which is about the flow layer).
    'neo-replatform',         // ★★★ Modern architecture with 700+ automated tests is what makes reliable execution possible
    'aex-stability',          // ★★★ Q1 stability work directly addresses fineline stuck in "Initiation Successful", bridge failures, supplier ID issues
    'commitment-report-redesign', // ★★★ keyPrograms: Re-bridge FLs, Pre-commit screen, item/PO status display, alert/block on missing pre-reqs
    'auto-item-setup',        // ★★☆ Item creation quality is a critical execution step — bad item setup = PO creation failure
    'enterprise-wave-planning', // ★★☆ Wave planning connects committed buy through to store distribution
    'size-pack-bq',           // ★☆☆ Locking pack optimization after CR bridge prevents state drift (Goal #3 keyProgram)
  ],

  '4': [
    // Goal: Reduce Merchant Hours
    // Definition: Directional reduction in time merchants spend on manual, repetitive tasks.
    // keyPrograms: LP Redesign (out of Excel), BQ Redesign, Automated Flow Plan, On-Demand Store Volumes
    'size-pack-bq',           // ★★★ keyProgram: BQ Redesign — eliminates manual sizing run (single biggest time save in buying)
    'bam-collab-intent',      // ★★★ Replaces email round-trips with merchants — significant daily time drain
    'auto-item-setup',        // ★★★ Removes merchant from manual item setup entirely
    'ap-tool-lineplan',       // ★★☆ Merchants use AP Tool instead of manually recreating line plan in AEX
    'commitment-report-redesign', // ★★☆ Streamlined commit workflow reduces merchant time in CR module
    'ai-item-repository',     // ★★☆ Item reuse via repository removes manual item research + re-entry per season
    'design-hub-centric',     // ★★☆ Centric replaces tool toggles; design merchants work in one system
    'line-planning',          // ★★☆ Calendar management in Centric replaces manual Excel-based LP
    'product-specs',          // ★★☆ Collaborative specs in one system eliminates manual handoffs to sourcing
    'strategy-hub',           // ★☆☆ TTP eliminates duplicate strategy documentation across Design/Buying/Allocation
    'unified-planning',       // ★☆☆ Allocation planners in one tool instead of reconciling competing systems
    'bpe-seasonal',           // ★☆☆ Seasonal planning in BPE replaces manual buy quantity reconciliation
  ],

  // ── PHASE 2 GOALS ──────────────────────────────────────────────────────────

  '5': [
    // Goal: Reduce Trapped Inventory
    // Definition: Less inventory committed to the wrong location — enabled by in-season redistribution.
    'tag-based-recommendations', // ★★★ keyProgram: Tag-based In-Season Swaps — core vehicle for redistribution
    'forecast-enterprise-service',// ★★★ keyProgram: Better upfront forecasting reduces initial placement errors
    'bq-enterprise-service',   // ★★★ keyProgram: Shared BQ reduces siloed buy errors that cause trapping
    'assort-product-phase2',   // ★★★ AP Phase 2 includes redistribution + dynamic placement capabilities
    'enterprise-wave-planning', // ★★☆ Wave planning enables committed buy → distribution execution (redistribution enabler)
    'distrib-optimization',    // ★★☆ Distribution planning optimization directly improves store-level placement
    'enterprise-trend-api-inseason', // ★★☆ In-season trend signals identify slow-sellers before they become trapped
    'shared-item-repository',  // ★☆☆ Unified item data enables smarter redistribution targeting
  ],

  '6': [
    // Goal: 85% Shop In-Stock Rate
    // Definition: 85% of trips result in customer finding item in their size/color.
    // Root causes: poor forecasting, manual BQ inaccuracy, wrong product in wrong stores.
    'forecast-enterprise-service',// ★★★ keyProgram: National forecast visibility — replaces manual fineline estimates
    'bq-enterprise-service',   // ★★★ keyProgram: More accurate quantity planning per store cluster
    'tag-based-recommendations', // ★★★ Store-level recommendations and swaps improve placement accuracy
    'assort-product-phase2',   // ★★★ keyProgram: On-demand store volume groups + size curves (DS Store Segmentation)
    'enterprise-trend-api-inseason', // ★★☆ Real-time trend signals inform replenishment and allocation decisions
    'distrib-optimization',    // ★★☆ Better store-level allocation accuracy reduces OOS from under-allocation
    'shared-item-repository',  // ★☆☆ Unified item data improves assortment breadth per store cluster
  ],

  '7': [
    // Goal: 90% PO Redistribution Coverage
    // Definition: 90% of eligible POs covered by dynamic redistribution capability.
    'tag-based-recommendations', // ★★★ keyProgram: Dynamic PO Re-Distribution + Tag-based In-Season Swaps — primary vehicle
    'forecast-enterprise-service',// ★★★ keyProgram: In-season demand signals trigger redistribution decisions
    'bq-enterprise-service',   // ★★★ keyProgram: Shared BQ enables redistribution quantity calculations
    'shared-event-layer',      // ★★★ keyProgram: Shared Event Calendar = coordination layer for redistribution actions
    'assort-product-phase2',   // ★★☆ Fixture preference workflow + redistribution planning in AP Phase 2
    'oneitem-expanded-sources',// ★☆☆ Richer item data (ROM, 3P, Circana) improves redistribution targeting precision
  ],

  '8': [
    // Goal: Increase Sell-Through Rate
    // Definition: More ordered inventory sells at full/near-full price before markdown.
    // This is the OUTCOME metric — if Goals #5/#6/#7 succeed, sell-through follows.
    'tag-based-recommendations', // ★★★ keyProgram: Right product, right store, right time via tag-based dynamic placement
    'forecast-enterprise-service',// ★★★ Accurate demand forecasting reduces over/under buying
    'bq-enterprise-service',   // ★★★ Demand-driven quantities reduce excess ordering that leads to markdown
    'enterprise-trend-api-inseason', // ★★☆ Catch slow-sellers early = reduce markdown exposure
    'assort-product-phase2',   // ★★☆ Assortment optimization engine improves initial selection quality
    'distrib-optimization',    // ★★☆ Better placement = more sell-through at full price
    'fashion-fixture-tagging', // ★★☆ Phase 3 tagging-based assortment = right product on right fixture (sell-through driver)
    'shared-merch-strategy',   // ★☆☆ Strategy encoding powers automated assortment recs that improve sell-through
  ],
};

// Export for gantt.js + any other consumer
window.GOAL_CARD_MAP = GOAL_CARD_MAP;