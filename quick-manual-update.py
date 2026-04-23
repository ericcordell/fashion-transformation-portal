#!/usr/bin/env python3
"""
quick-manual-update.py — Manually update AEX Stability Q1/Q2 with provided numbers

This is a quick fix script to update the portal with the exact breakdown
provided by the team member, bypassing JIRA sync.

Numbers provided:
Q1 (18 total):
  - 10 delivered to production
  - 8 in QE Testing/UAT (still in progress)

Q2 (18 total):
  - 13 sized and committed for delivery (in progress or ready to start)
  - 2 pending sizing (with ETA for end of this week)
  - 2 in product discovery
  - 1 cannot be committed
"""
import re
from pathlib import Path

BASE = Path(__file__).parent
DATA_FILE = BASE / "data-buying.js"

# The exact numbers from the team member
Q1_DATA = {
    "total": 18,
    "delivered_to_production": 10,
    "in_qe_testing": 8,
}

Q2_DATA = {
    "total": 18,
    "sized_and_committed": 13,
    "pending_sizing": 2,
    "product_discovery": 2,
    "cannot_commit": 1,
}


def update_q1_card(content: str) -> str:
    """Update Q1 card description with correct numbers."""
    new_desc = (
        f"{Q1_DATA['total']} total projects — "
        f"✅ {Q1_DATA['delivered_to_production']} Delivered to Production · "
        f"🧪 {Q1_DATA['in_qe_testing']} In QE Testing/UAT (still in progress). "
        f"Platform reliability improvements across AEX: bridge/rebridge execution safeguards, "
        f"Financial Review data accuracy (Streams 4, 6), size cluster reset improvements, "
        f"systematic discard from Supplier One, and BQ/CR week allocation consistency."
    )
    
    # Find and replace Q1 description
    pattern = r"(id: 'aex-stability-q1'.*?description: ')[^']*(')"
    new_content = re.sub(pattern, rf"\g<1>{new_desc}\g<2>", content, flags=re.DOTALL)
    
    # Also update ragDist
    ragdist_pattern = r"(id: 'aex-stability-q1'.*?ragDist: \{)[^}]*(\})"
    new_ragdist = f" green: {Q1_DATA['delivered_to_production']}, yellow: {Q1_DATA['in_qe_testing']}, red: 0 "
    new_content = re.sub(ragdist_pattern, rf"\g<1>{new_ragdist}\g<2>", new_content, flags=re.DOTALL)
    
    return new_content


def update_q2_card(content: str) -> str:
    """Update Q2 card description with correct numbers."""
    new_desc = (
        f"{Q2_DATA['total']} total projects — "
        f"🟢 {Q2_DATA['sized_and_committed']} Sized & Committed for Delivery (in progress or ready to start) · "
        f"🟡 {Q2_DATA['pending_sizing']} Pending Sizing (ETA end of week) · "
        f"🔵 {Q2_DATA['product_discovery']} In Product Discovery · "
        f"🔴 {Q2_DATA['cannot_commit']} Cannot Be Committed. "
        f"Q2 builds on Q1 stability foundation to deliver merchant productivity gains and quarterly DS model refresh. "
        f"Active work includes AP Tool Phase 2 Enhancements (60 pts, in progress), multi-select modular categories "
        f"for allocation outputs (150 pts), persisting size overrides, online buy quantity override, and DS model improvements."
    )
    
    # Find and replace Q2 description
    pattern = r"(id: 'aex-stability-q2'.*?description: ')[^']*(')"
    new_content = re.sub(pattern, rf"\g<1>{new_desc}\g<2>", content, flags=re.DOTALL)
    
    # Also update ragDist
    ragdist_pattern = r"(id: 'aex-stability-q2'.*?ragDist: \{)[^}]*(\})"
    new_ragdist = (
        f" green: {Q2_DATA['sized_and_committed']}, "
        f"yellow: {Q2_DATA['pending_sizing']}, "
        f"blue: {Q2_DATA['product_discovery']}, "
        f"red: {Q2_DATA['cannot_commit']} "
    )
    new_content = re.sub(ragdist_pattern, rf"\g<1>{new_ragdist}\g<2>", new_content, flags=re.DOTALL)
    
    return new_content


def main():
    print("\n🐶 Quick Manual Update - AEX Stability Q1 & Q2")
    print("━" * 60)
    
    if not DATA_FILE.exists():
        print(f"❌ File not found: {DATA_FILE}")
        return 1
    
    print(f"\n📂 Reading {DATA_FILE.name}...")
    content = DATA_FILE.read_text()
    
    print("\n📝 Updating Q1 card...")
    print(f"   Total: {Q1_DATA['total']}")
    print(f"   ✅ Delivered to Production: {Q1_DATA['delivered_to_production']}")
    print(f"   🧪 In QE Testing/UAT: {Q1_DATA['in_qe_testing']}")
    content = update_q1_card(content)
    
    print("\n📝 Updating Q2 card...")
    print(f"   Total: {Q2_DATA['total']}")
    print(f"   🟢 Sized & Committed: {Q2_DATA['sized_and_committed']}")
    print(f"   🟡 Pending Sizing: {Q2_DATA['pending_sizing']}")
    print(f"   🔵 Product Discovery: {Q2_DATA['product_discovery']}")
    print(f"   🔴 Cannot Commit: {Q2_DATA['cannot_commit']}")
    content = update_q2_card(content)
    
    print(f"\n💾 Writing updated content to {DATA_FILE.name}...")
    DATA_FILE.write_text(content)
    
    print("\n✅ Update complete!")
    print("\n📋 Next steps:")
    print("   1. Review changes: git diff data-buying.js")
    print("   2. Rebuild portal: python3 build-inlined.py")
    print("   3. Test publish: python3 publish-portal.py --test")
    print("   4. Verify at TEST URL, then: python3 publish-portal.py --prod")
    
    return 0


if __name__ == "__main__":
    exit(main())
