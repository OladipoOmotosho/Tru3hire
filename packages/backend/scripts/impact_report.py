"""
Impact report — the operator's weekly funnel pulse (Task 13).

Prints count-only funnel aggregates over a date range. Internal tool: defaults
to NO k-anonymity suppression (--min 1) so you see real early numbers. The
*public* data note (Task 23) must use a floor of >=5.

Run from packages/backend:
    python -m scripts.impact_report            # last 30 days
    python -m scripts.impact_report --days 7
    python -m scripts.impact_report --min 5    # apply k-anonymity floor
"""

import argparse
from datetime import datetime, timedelta

from dotenv import load_dotenv

load_dotenv()  # pick up DATABASE_URL like the app does

from app.services.analytics import ALLOWED_EVENTS, aggregate_counts  # noqa: E402


def _rate(n: int, d: int) -> str:
    return f"{(100 * n / d):.0f}%" if d else "—"


def main() -> None:
    parser = argparse.ArgumentParser(description="Funnel impact report")
    parser.add_argument("--days", type=int, default=30, help="look-back window (days)")
    parser.add_argument("--min", type=int, default=1, help="k-anonymity floor (public note: >=5)")
    args = parser.parse_args()

    since = datetime.utcnow() - timedelta(days=args.days)
    counts = aggregate_counts(since=since, k_anon_floor=args.min)

    print(f"\n# Impact report — last {args.days} days")
    print(f"_since {since:%Y-%m-%d} • k-anon floor {args.min}_\n")

    print("| Event | Count |")
    print("| --- | ---: |")
    for event in sorted(ALLOWED_EVENTS):
        if event in counts:
            print(f"| {event} | {counts[event]} |")
        elif args.min <= 1:
            print(f"| {event} | 0 |")

    # Simple funnel rates (activation = the core value actions).
    activations = counts.get("check_run", 0) + counts.get("search_run", 0)
    viewed = counts.get("result_viewed", 0)
    print("\n## Funnel")
    print(f"- Activations (check_run + search_run): **{activations}**")
    print(f"- Reasons expanded / viewed: {_rate(counts.get('reasons_expanded', 0), viewed)}")
    print(f"- Share rate (shared / activations): {_rate(counts.get('shared', 0), activations)}")
    print(f"- Signups: {counts.get('signup', 0)}  •  Returns: {counts.get('return', 0)}")
    print()


if __name__ == "__main__":
    main()
