"""Manual demo: skills gap save/retrieve flow.

This is not a unit test (intentionally not named test_*.py) so pytest won't collect it.
Run manually:
  python -m scripts.skills_gap_flow_demo
"""

from app.database import get_user_skill_gaps, init_database, save_user_skill_gaps
from app.services.scorer import true_score_aggregator


USER_ID = "test_user_123"
JOB_TEXT = "We are looking for a software engineer with Python and React."


def main() -> None:
    print("--- Testing Skills Gap Flow ---")

    init_database()

    print(f"1. Analyzing job for user {USER_ID}...")
    result = true_score_aggregator.analyze(job_text=JOB_TEXT, user_skills=[])
    missing = result.skills_gap.missing_skills if result.skills_gap else []
    print(f"   Identified missing skills: {missing}")

    if missing:
        print(f"2. Saving {len(missing)} missing skills to DB...")
        save_user_skill_gaps(USER_ID, missing)
    else:
        print("No missing skills found to save; demo ends.")
        return

    print("3. Retrieving skill gaps from DB...")
    gaps = get_user_skill_gaps(USER_ID)
    print(f"   Retrieved gaps: {gaps}")


if __name__ == "__main__":
    main()
