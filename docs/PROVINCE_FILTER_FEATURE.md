# Implementation Plan: Province & City Location Filtering

## Goal

Add province and city filtering to job search, enabling users to narrow down job listings by Canadian province and specific cities within each province.

## Approach

Since the Adzuna Intelligence API's location taxonomy is primarily UK-focused, we'll use a **static Canadian locations dataset** combined with Adzuna's `locationN` parameters for reliable filtering.

---

## Proposed Changes

### Backend

#### [NEW] `packages/backend/app/data/canada_locations.py`

Static data module containing:

- All 13 Canadian provinces/territories with codes
- Major cities for each province (50+ cities total)
- Mapping for quick province→cities lookup

```python
PROVINCES = [
    {"code": "AB", "name": "Alberta"},
    {"code": "BC", "name": "British Columbia"},
    # ... etc
]

CITIES_BY_PROVINCE = {
    "AB": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", ...],
    "BC": ["Vancouver", "Victoria", "Surrey", "Burnaby", ...],
    "ON": ["Toronto", "Ottawa", "Mississauga", "Brampton", ...],
    # ... etc
}
```

---

#### [MODIFY] `packages/backend/app/services/jobs.py`

Update `search_jobs()` and `search_and_rank_jobs()` to accept:

- `province: Optional[str]` - Province name
- `city: Optional[str]` - City name

Use Adzuna's `location0`, `location1`, `location2` parameters:

```python
if province:
    params["location0"] = "Canada"
    params["location1"] = province
    if city:
        params["location2"] = city
```

---

#### [MODIFY] `packages/backend/app/routes/jobs.py`

Add new endpoint and update existing:

```python
@router.get("/locations")
def get_locations(province: Optional[str] = None):
    """Get provinces list, or cities for a specific province."""

@router.get("/ranked")  # Update existing
async def get_ranked_jobs(
    province: str = Query("", description="Province name"),
    city: str = Query("", description="City name"),
    # ... existing params
)
```

---

### Frontend

#### [MODIFY] `packages/frontend/src/pages/JobsPage.tsx`

1. **State changes**:

```tsx
const [province, setProvince] = useState<string>("");
const [city, setCity] = useState<string>("");
const [provinces, setProvinces] = useState<Province[]>([]);
const [cities, setCities] = useState<string[]>([]);
```

2. **Fetch locations on mount**:

```tsx
useEffect(() => {
  fetch(`${API_URL}/api/jobs/locations`)
    .then((res) => res.json())
    .then((data) => setProvinces(data.provinces));
}, []);
```

3. **Cascading city fetch when province changes**:

```tsx
useEffect(() => {
  if (province) {
    fetch(`${API_URL}/api/jobs/locations?province=${province}`)
      .then((res) => res.json())
      .then((data) => setCities(data.cities));
  } else {
    setCities([]);
    setCity("");
  }
}, [province]);
```

4. **UI changes** - Replace single location input with:

```tsx
{
  /* Province Dropdown */
}
<select value={province} onChange={handleProvinceChange}>
  <option value="">All of Canada</option>
  {provinces.map((p) => (
    <option key={p.code} value={p.name}>
      {p.name}
    </option>
  ))}
</select>;

{
  /* City Dropdown (only shows if province selected) */
}
{
  province && (
    <select value={city} onChange={handleCityChange}>
      <option value="">All cities in {province}</option>
      {cities.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
```

5. **Update API call** to include province and city:

```tsx
async function searchRankedJobs(
  query: string,
  province: string,
  city: string,
  page: number,
  sortBy: string,
  jobType: string
): Promise<JobsResponse>;
```

---

## Canadian Locations Data

### Provinces/Territories (13)

| Code | Name                      |
| ---- | ------------------------- |
| AB   | Alberta                   |
| BC   | British Columbia          |
| MB   | Manitoba                  |
| NB   | New Brunswick             |
| NL   | Newfoundland and Labrador |
| NS   | Nova Scotia               |
| NT   | Northwest Territories     |
| NU   | Nunavut                   |
| ON   | Ontario                   |
| PE   | Prince Edward Island      |
| QC   | Quebec                    |
| SK   | Saskatchewan              |
| YT   | Yukon                     |

### Major Cities (sample)

- **Ontario**: Toronto, Ottawa, Mississauga, Brampton, Hamilton, London, Markham, Vaughan, Kitchener, Windsor
- **British Columbia**: Vancouver, Victoria, Surrey, Burnaby, Richmond, Coquitlam, Kelowna
- **Alberta**: Calgary, Edmonton, Red Deer, Lethbridge, Medicine Hat
- **Quebec**: Montreal, Quebec City, Laval, Gatineau, Longueuil
- _... (50+ cities total)_

---

## Verification Plan

### Automated Tests

- Test `/api/jobs/locations` returns all provinces
- Test `/api/jobs/locations?province=Ontario` returns Ontario cities
- Test `/api/jobs/ranked?province=Ontario&city=Toronto` uses correct locationN params

### Manual Verification

1. Load Jobs page → Province dropdown shows all 13 provinces
2. Select "Ontario" → City dropdown appears with Ontario cities
3. Select "Toronto" → Search returns Toronto-specific jobs
4. Change province → City dropdown updates, city selection clears

---

## Files Summary

| Action     | Path                                            |
| ---------- | ----------------------------------------------- |
| **NEW**    | `packages/backend/app/data/canada_locations.py` |
| **MODIFY** | `packages/backend/app/services/jobs.py`         |
| **MODIFY** | `packages/backend/app/routes/jobs.py`           |
| **MODIFY** | `packages/frontend/src/pages/JobsPage.tsx`      |
