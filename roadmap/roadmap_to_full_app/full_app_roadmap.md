# TrueHire Full App: High Level Roadmap

## 1. Overview

Post-MVP, TrueHire transforms from a tool into a platform. The focus shifts to **retention**, **personalization**, and **community**.

## 2. Key Features

### A. User Accounts & Profiles

- **Authentication**: Login/Signup (Google Auth).
- **Profile**: Store resume, verified skills, and job preferences.
- **History**: Track all analyzed jobs and their scores over time.

### B. "The TrueList" (Community)

- **Crowdsourcing**: Users can flag jobs as "Fake" or "Good".
- **Leaderboard**: "Top Authenticated Employers" vs "Hall of Shame".

### C. Advanced Intelligence

- **Real Data Pipes**: Replace scrapers with official APIs (LinkedIn/Glassdoor Enterprise).
- **Fine-tuned Models**: Train custom BERT models on the gathered dataset of fake vs real jobs.
- **Interview Prep**: Generative AI chat bot to roleplay interviews based on the specific job description.

## 3. Technology Upgrades

- **Database**: PostgreSQL (Supabase) for user data.
- **Caching**: Redis for expensive ML scores.
- **Deployment**: Vercel (Frontend) + Render/Railway (Backend Docker).
