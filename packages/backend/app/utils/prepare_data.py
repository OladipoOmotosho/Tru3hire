import pandas as pd

df = pd.read_csv("../../data/raw/fake_job_postings.csv")

# Keep useful text fields
df["text"] = (
    (df["title"].fillna("") + " " +
     df["company_profile"].fillna("") + " " +
     df["description"].fillna("") + " " +
     df["requirements"].fillna("") + " " +
     df["benefits"].fillna(""))
)

# Keep only the final fields
clean_df = df[["text", "fraudulent"]].dropna().reset_index(drop=True)

# Save processed dataset
clean_df.to_csv("../../data/processed/clean_fake_jobs.csv", index=False)

print(clean_df.head())
print(clean_df["fraudulent"].value_counts())
