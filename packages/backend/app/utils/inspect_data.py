import pandas as pd
df = pd.read_csv("./../../data/raw/fake_job_postings.csv")
df.info()
print(df['fraudulent'].value_counts())
