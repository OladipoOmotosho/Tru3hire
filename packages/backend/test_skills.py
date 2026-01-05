import asyncio
from app.services.scorer import true_score_aggregator
from app.database import save_user_skill_gaps, get_user_skill_gaps, init_database

# Ensure DB is ready
init_database()

USER_ID = "test_user_123"
JOB_TEXT = "We are looking for a software engineer with generic_skill_A and generic_skill_B."

async def test_skills_gap_flow():
    print("--- Testing Skills Gap Flow ---")
    
    # 1. Analyze Job (simulate missing skills)
    # user_skills is empty, so generic_skill_A/B should be missing
    print(f"1. Analyzing job for user {USER_ID}...")
    
    # Manually simulating what the route does:
    result = true_score_aggregator.analyze(job_text=JOB_TEXT, user_skills=[])
    
    print(f"   Analysis result skills gap: {result.breakdown.skills_gap if hasattr(result.breakdown, 'skills_gap') else 'N/A'}")
    
    # Note: result.breakdown might not have skills_gap, let's check result object
    # In scorer.py: result is AnalysisResult. it has .skills_gap field (added in recent edit)
    missing = result.skills_gap.missing_skills if result.skills_gap else []
    print(f"   Identified missing skills: {missing}")
    
    if not missing:
        # If scorer didn't find skills (maybe because it uses a predefined list?), let's force some
        # The extraction logic uses a keyword list. 'generic_skill_A' won't be found.
        # Let's use real keywords that are likely in the list: "Python", "React"
        print("   (Retrying with real skills)")
        real_job_text = "Must have Python and React experience."
        result = true_score_aggregator.analyze(job_text=real_job_text, user_skills=[])
        missing = result.skills_gap.missing_skills if result.skills_gap else []
        print(f"   Identified missing skills (Retry): {missing}")

    if missing:
        # 2. Save using database function
        print(f"2. Saving {len(missing)} missing skills to DB...")
        save_user_skill_gaps(USER_ID, missing)
    else:
        print("❌ No missing skills found to save.")
        return

    # 3. Retrieve
    print("3. Retrieving skill gaps from DB...")
    gaps = get_user_skill_gaps(USER_ID)
    print(f"   Retrieved gaps: {gaps}")
    
    if len(gaps) > 0:
        print("✅ SUCCESS: Skills saved and retrieved.")
    else:
        print("❌ FAILURE: No skills retrieved.")

if __name__ == "__main__":
    asyncio.run(test_skills_gap_flow())
