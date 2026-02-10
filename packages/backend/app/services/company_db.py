"""
Company Verification Database Service

Provides company trustworthiness checking with:
- SQLite database for persistence + caching
- Fortune 500 + known legit companies as seed data
- Fuzzy matching for typo tolerance
- User report system for crowdsourced data
- **API integration** for real-time verification (OpenCorporates, Wikidata)
"""

import sqlite3
import os
import asyncio
import logging
from typing import Optional, Dict, List, Tuple, Mapping
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Try to import rapidfuzz for fuzzy matching
try:
    from rapidfuzz import fuzz, process
    FUZZY_ENABLED = True
except ImportError:
    fuzz = None  # type: ignore
    process = None  # type: ignore
    FUZZY_ENABLED = False

# API verification is optional - will work without it
API_VERIFICATION_ENABLED = True


class CompanyStatus(Enum):
    VERIFIED_LEGIT = "verified_legit"  # Fortune 500, well-known companies
    LIKELY_LEGIT = "likely_legit"      # Positive user reports
    UNKNOWN = "unknown"                 # Not in database
    SUSPICIOUS = "suspicious"           # Some negative reports
    KNOWN_SCAM = "known_scam"          # Confirmed scam


@dataclass
class CompanyCheckResult:
    company_name: str
    status: CompanyStatus
    confidence: float  # 0.0 to 1.0
    match_type: str    # "exact", "fuzzy", "none"
    matched_name: Optional[str] = None  # The name we matched against
    scam_reports: int = 0
    legit_reports: int = 0
    notes: Optional[str] = None


# =============================================================================
# Fortune 500 + Well-Known Companies (Seed Data)
# =============================================================================

VERIFIED_LEGIT_COMPANIES = [
    # ========================================================================
    # CANADIAN COMPANIES
    # ========================================================================
    # Canadian Big 5 Banks
    "RBC", "Royal Bank of Canada", "TD", "TD Bank", "TD Canada Trust", "Toronto-Dominion Bank",
    "Scotiabank", "Bank of Nova Scotia", "BMO", "Bank of Montreal", "CIBC", "Canadian Imperial Bank of Commerce",
    "National Bank of Canada", "Desjardins", "Tangerine", "Simplii Financial",
    
    # Canadian Tech Companies
    "Shopify", "Shopify Inc", "BlackBerry", "Research In Motion", "RIM", "OpenText", "Constellation Software",
    "Lightspeed", "Lightspeed Commerce", "Nuvei", "Kinaxis", "Absolute Software", "Ceridian", "D2L", "Desire2Learn",
    "Hootsuite", "Vision Critical", "SAP Canada", "CGI", "CGI Group", "Telus", "Telus Communications",
    "Rogers", "Rogers Communications", "Bell", "Bell Canada", "Bell Media", "Shaw", "Shaw Communications",
    "Cogeco", "Videotron", "Quebecor", "Eastlink", "Wealthsimple", "1Password", "FreshBooks", "Wave",
    
    # Canadian Retail & Consumer
    "Loblaws", "Loblaw Companies", "Metro Inc", "Sobeys", "Empire Company", "Canadian Tire",
    "Hudson's Bay", "HBC", "The Bay", "Holt Renfrew", "Roots", "Lululemon", "Lululemon Athletica",
    "Aritzia", "Canada Goose", "Tim Hortons", "Swiss Chalet", "Harvey's",
    
    # Canadian Airlines & Transportation
    "Air Canada", "WestJet", "Porter Airlines", "VIA Rail", "GO Transit", "TTC", "TransLink",
    
    # Canadian Energy & Resources
    "Enbridge", "TC Energy", "Canadian Natural Resources", "CNRL", "Suncor", "Suncor Energy",
    "Cenovus", "Imperial Oil", "Teck Resources", "Barrick Gold", "Nutrien",
    
    # Canadian Insurance & Financial Services
    "Manulife", "Manulife Financial", "Sun Life", "Sun Life Financial", "Great-West Life",
    "Canada Life", "Intact Financial", "Intact Insurance", "Power Corporation",
    
    # Canadian Healthcare & Pharma
    "Shoppers Drug Mart", "Rexall", "McKesson Canada", "Apotex", "Bausch Health",
    
    # Canadian Media
    "CBC", "Canadian Broadcasting Corporation", "CTV", "Global News", "Bell Media", "Postmedia",
    "The Globe and Mail", "Toronto Star", "National Post",
    
    # Canadian Government & Crown Corporations
    "Canada Post", "Canada Revenue Agency", "CRA", "Service Canada", "IRCC", "CBSA","The City of Brampton",
    
    # ========================================================================
    # U.S. TECHNOLOGY COMPANIES
    # ========================================================================
    # Tech Giants
    "Apple", "Apple Inc", "Microsoft", "Microsoft Corporation", "Google", "Google LLC", "Alphabet", "Alphabet Inc",
    "Amazon", "Amazon.com", "AWS", "Amazon Web Services", "Meta", "Meta Platforms", "Facebook",
    "Netflix", "Tesla", "Tesla Motors", "NVIDIA", "NVIDIA Corporation", "Adobe", "Adobe Systems",
    "Salesforce", "Oracle", "Oracle Corporation", "IBM", "International Business Machines",
    "Intel", "Intel Corporation", "Cisco", "Cisco Systems", "Dell", "Dell Technologies",
    "HP", "Hewlett-Packard", "HP Inc", "HPE", "Hewlett Packard Enterprise", "VMware", "ServiceNow",
    "Workday", "Zoom", "Zoom Video Communications", "Slack", "Slack Technologies", "Dropbox",
    "Twitter", "X Corp", "LinkedIn", "PayPal", "Square", "Block", "Stripe", "Coinbase",
    "Uber", "Uber Technologies", "Lyft", "Airbnb", "DoorDash", "Instacart", "Spotify", "Pinterest",
    "Snap", "Snapchat", "TikTok", "ByteDance", "Reddit", "Discord", "Twitch",
    
    # U.S. Software & SaaS
    "GitHub", "GitLab", "Atlassian", "Jira", "Confluence", "MongoDB", "Databricks", "Snowflake",
    "Palantir", "Splunk", "Tableau", "Elastic", "Cloudflare", "Okta", "CrowdStrike", "Palo Alto Networks",
    "Fortinet", "Zscaler", "SentinelOne", "Datadog", "New Relic", "Dynatrace", "Twilio", "SendGrid",
    "HubSpot", "Zendesk", "Freshworks", "Intercom", "DocuSign", "Adobe Sign", "Box", "Dropbox",
    "Notion", "Asana", "Monday.com", "Airtable", "ClickUp", "Trello", "Basecamp", "Wrike",
    "Figma", "Canva", "InVision", "Sketch", "Miro", "Lucidchart", "Draw.io",
    
    # U.S. Enterprise Tech
    "SAP", "SAP America", "Workday", "Intuit", "QuickBooks", "TurboTax", "ADP", "Paychex", "Paycom",
    "Paylocity", "UKG", "Ultimate Software", "Kronos", "Cornerstone OnDemand", "Ceridian",
    
    # U.S. Semiconductors & Hardware
    "AMD", "Advanced Micro Devices", "Qualcomm", "Broadcom", "Texas Instruments", "Micron",
    "Applied Materials", "Lam Research", "KLA Corporation", "ASML", "Marvell", "Skyworks",
    "Analog Devices", "ON Semiconductor", "Maxim Integrated", "Xilinx", "Lattice Semiconductor",
    
    # U.S. Cybersecurity
    "Norton", "NortonLifeLock", "McAfee", "Symantec", "Trend Micro", "Kaspersky", "Avast",
    "Malwarebytes", "Carbon Black", "FireEye", "Mandiant", "Proofpoint", "Mimecast",
    
    # ========================================================================
    # U.S. CONSULTING & PROFESSIONAL SERVICES
    # ========================================================================
    "McKinsey", "McKinsey & Company", "Bain", "Bain & Company", "BCG", "Boston Consulting Group",
    "Deloitte", "Deloitte Consulting", "PwC", "PricewaterhouseCoopers", "EY", "Ernst & Young",
    "KPMG", "Accenture", "Booz Allen Hamilton", "Oliver Wyman", "A.T. Kearney", "Kearney",
    "Roland Berger", "Strategy&", "L.E.K. Consulting", "Simon-Kucher", "ZS Associates",
    "Analysis Group", "Charles River Associates", "CRA", "Cornerstone Research", "NERA Economic Consulting",
    "Huron Consulting", "FTI Consulting", "Alvarez & Marsal", "AlixPartners",
    
    # U.S. IT Services & Outsourcing
    "Cognizant", "Infosys", "Wipro", "TCS", "Tata Consultancy Services", "HCL Technologies",
    "Tech Mahindra", "DXC Technology", "Capgemini", "Atos", "NTT Data", "Fujitsu",
    "CGI", "EPAM Systems", "Globant", "Thoughtworks", "Slalom", "West Monroe",
    
    # U.S. Staffing & HR Services
    "Robert Half", "Kelly Services", "ManpowerGroup", "Manpower", "Randstad", "Adecco",
    "Hays", "Michael Page", "PageGroup", "Korn Ferry", "Spencer Stuart", "Heidrick & Struggles",
    "Egon Zehnder", "Russell Reynolds", "Mercer", "Towers Watson", "Willis Towers Watson", "Aon Hewitt",
    
    # ========================================================================
    # U.S. FINANCE & BANKING
    # ========================================================================
    # Investment Banks
    "JPMorgan", "JPMorgan Chase", "Goldman Sachs", "Morgan Stanley", "Bank of America", "Merrill Lynch",
    "Wells Fargo", "Citibank", "Citigroup", "Barclays", "Deutsche Bank", "Credit Suisse", "UBS",
    "Lazard", "Evercore", "Moelis", "Centerview Partners", "PJT Partners", "Perella Weinberg",
    "Greenhill", "Houlihan Lokey", "Jefferies", "Piper Sandler", "Raymond James", "Stifel",
    
    # Commercial Banks
    "Chase", "Bank of New York Mellon", "BNY Mellon", "State Street", "Northern Trust",
    "PNC Bank", "PNC Financial", "US Bank", "US Bancorp", "Truist", "BB&T", "SunTrust",
    "Fifth Third Bank", "KeyBank", "Regions Bank", "M&T Bank", "Citizens Bank", "Santander",
    
    # Asset Management & Investment
    "BlackRock", "Vanguard", "Fidelity", "Fidelity Investments", "Charles Schwab", "T. Rowe Price",
    "State Street Global Advisors", "SSGA", "Capital Group", "American Funds", "PIMCO",
    "Wellington Management", "Bridgewater Associates", "Two Sigma", "Citadel", "DE Shaw",
    "Renaissance Technologies", "Point72", "Millennium Management", "AQR Capital", "Baupost Group",
    
    # Private Equity & Venture Capital
    "KKR", "Kohlberg Kravis Roberts", "Blackstone", "Carlyle Group", "Apollo Global Management",
    "TPG", "Texas Pacific Group", "Bain Capital", "Warburg Pincus", "Advent International",
    "Vista Equity Partners", "Silver Lake", "Thoma Bravo", "Francisco Partners", "Insight Partners",
    "General Atlantic", "Sequoia Capital", "Andreessen Horowitz", "a16z", "Kleiner Perkins",
    "Accel", "Benchmark", "Greylock Partners", "Lightspeed Venture Partners", "NEA",
    "Bessemer Venture Partners", "Index Ventures", "GGV Capital", "Tiger Global",
    
    
    # Financial Services
    "American Express", "Visa", "Mastercard", "Capital One", "Capital One Canada", "Capital One Financial",
    "Discover", "Synchrony Financial",
    "Ally Financial", "SoFi", "Chime", "Robinhood", "E*TRADE", "TD Ameritrade", "Interactive Brokers",
    
    # Insurance
    "Berkshire Hathaway", "Progressive", "Allstate", "State Farm", "Liberty Mutual", "Travelers",
    "Chubb", "AIG", "Hartford", "Nationwide", "USAA", "Geico", "MetLife", "Prudential",
    "New York Life", "Northwestern Mutual", "MassMutual", "Lincoln Financial", "Principal Financial",
    
    # ========================================================================
    # U.S. HEALTHCARE & LIFE SCIENCES
    # ========================================================================
    # Pharmaceutical Companies
    "Pfizer", "Johnson & Johnson", "J&J", "Merck", "Merck & Co", "AbbVie", "Bristol-Myers Squibb",
    "Eli Lilly", "Amgen", "Gilead Sciences", "Regeneron", "Vertex Pharmaceuticals", "Biogen",
    "Moderna", "BioNTech", "Alexion", "Illumina", "Genentech", "Takeda",
    
    # Healthcare Providers & Services
    "UnitedHealth", "UnitedHealth Group", "UnitedHealthcare", "CVS Health", "Anthem", "Elevance Health",
    "Cigna", "Humana", "Kaiser Permanente", "Aetna", "Blue Cross Blue Shield", "BCBS",
    "Centene", "Molina Healthcare", "WellCare", "Magellan Health",
    
    # Hospitals & Health Systems
    "HCA Healthcare", "CommonSpirit Health", "Ascension", "Trinity Health", "Providence",
    "Atrium Health", "AdventHealth", "Baylor Scott & White", "Cleveland Clinic", "Mayo Clinic",
    "Johns Hopkins", "Mass General Brigham", "Partners Healthcare", "NYU Langone", "Mount Sinai",
    "UPMC", "Geisinger", "Intermountain Healthcare", "Kaiser Foundation",
    
    # Medical Devices & Equipment
    "Medtronic", "Abbott", "Abbott Laboratories", "Danaher", "Thermo Fisher Scientific",
    "Becton Dickinson", "BD", "Boston Scientific", "Stryker", "Zimmer Biomet", "Edwards Lifesciences",
    "Intuitive Surgical", "ResMed", "Baxter International", "Agilent Technologies",
    
    # Biotech & Research
    "Genentech", "Roche", "Novartis", "Sanofi", "AstraZeneca", "GlaxoSmithKline", "GSK",
    "Bayer", "Boehringer Ingelheim", "Novo Nordisk", "CSL Behring", "BioMarin",
    
    # ========================================================================
    # U.S. RETAIL & CONSUMER GOODS
    # ========================================================================
    # Retail
    "Walmart", "Target", "Costco", "Home Depot", "Lowe's", "Best Buy", "Kroger", "Walgreens",
    "CVS", "Albertsons", "Publix", "Whole Foods", "Trader Joe's", "Aldi", "Lidl",
    "Dollar General", "Dollar Tree", "Family Dollar", "TJX", "TJ Maxx", "Marshalls", "Ross",
    "Nordstrom", "Macy's", "Kohl's", "JCPenney", "Dillard's", "Belk", "Neiman Marcus",
    "Sephora", "Ulta Beauty", "Bath & Body Works", "Victoria's Secret",
    
    # E-commerce
    "Amazon", "eBay", "Etsy", "Wayfair", "Chewy", "Zappos", "Overstock", "Wish",
    
    # Food & Beverage
    "Coca-Cola", "PepsiCo", "Nestle", "Nestlé", "Kraft Heinz", "General Mills", "Kellogg's",
    "Mondelez", "Mars", "Hershey's", "Conagra", "Hormel", "Tyson Foods", "JBS", "Cargill",
    "Archer Daniels Midland", "ADM", "Bunge", "Sysco", "US Foods", "Performance Food Group",
    
    # Consumer Products
    "Procter & Gamble", "P&G", "Unilever", "Colgate-Palmolive", "Estée Lauder", "L'Oréal",
    "Johnson & Johnson Consumer", "Church & Dwight", "Clorox", "Henkel", "SC Johnson",
    
    # Restaurants & Food Service
    "McDonald's", "Starbucks", "Chipotle", "Yum Brands", "Taco Bell", "KFC", "Pizza Hut",
    "Domino's", "Papa John's", "Wendy's", "Burger King", "Restaurant Brands International",
    "Darden Restaurants", "Olive Garden", "LongHorn Steakhouse", "Chili's", "Applebee's",
    
    # Apparel & Fashion
    "Nike", "Adidas", "Under Armour", "Levi Strauss", "VF Corporation", "The North Face",
    "Vans", "Timberland", "PVH", "Calvin Klein", "Tommy Hilfiger", "Ralph Lauren", "Gap",
    "Old Navy", "Banana Republic", "American Eagle", "Abercrombie & Fitch", "Hollister",
    
    # ========================================================================
    # U.S. MANUFACTURING & INDUSTRIAL
    # ========================================================================
    # Industrial Conglomerates
    "General Electric", "GE", "3M", "Honeywell", "Emerson Electric", "Illinois Tool Works", "ITW",
    "Parker Hannifin", "Rockwell Automation", "Dover Corporation", "Fortive", "Danaher",
    
    # Aerospace & Defense
    "Boeing", "Lockheed Martin", "Raytheon", "Raytheon Technologies", "Northrop Grumman",
    "General Dynamics", "L3Harris", "Leidos", "SAIC", "BAE Systems", "Huntington Ingalls",
    "Textron", "Spirit AeroSystems", "TransDigm", "Howmet Aerospace",
    
    # Automotive
    "Ford", "Ford Motor Company", "General Motors", "GM", "Stellantis", "Chrysler", "Jeep", "Dodge",
    "Tesla", "Rivian", "Lucid Motors", "Toyota", "Honda", "Nissan", "BMW", "Mercedes-Benz",
    "Volkswagen", "Audi", "Porsche", "Volvo", "Hyundai", "Kia", "Mazda", "Subaru",
    "BorgWarner", "Aptiv", "Lear Corporation", "Magna International", "Autoliv",
    
    # Heavy Equipment & Machinery
    "Caterpillar", "John Deere", "Deere & Company", "CNH Industrial", "AGCO", "Terex",
    "Paccar", "Cummins", "Navistar", "Oshkosh Corporation",
    
    # Chemicals
    "Dow", "DuPont", "BASF", "LyondellBasell", "Eastman Chemical", "PPG Industries",
    "Sherwin-Williams", "RPM International", "Axalta", "Huntsman", "Celanese", "Westlake",
    
    # ========================================================================
    # U.S. ENERGY & UTILITIES
    # ========================================================================
    # Oil & Gas
    "ExxonMobil", "Chevron", "ConocoPhillips", "EOG Resources", "Pioneer Natural Resources",
    "Occidental Petroleum", "Oxy", "Devon Energy", "Marathon Petroleum", "Valero Energy",
    "Phillips 66", "HollyFrontier", "Kinder Morgan", "Williams Companies", "ONEOK",
    
    # Utilities
    "NextEra Energy", "Duke Energy", "Southern Company", "Dominion Energy", "American Electric Power",
    "Xcel Energy", "Exelon", "Entergy", "FirstEnergy", "PPL Corporation", "Eversource Energy",
    "Consolidated Edison", "Con Edison", "Public Service Enterprise Group", "PSEG", "DTE Energy",
    
    # Renewables
    "First Solar", "SunPower", "Sunrun", "Enphase Energy", "SolarEdge", "Vestas", "Orsted",
    
    # ========================================================================
    # U.S. MEDIA & ENTERTAINMENT
    # ========================================================================
    # Media Conglomerates
    "Disney", "The Walt Disney Company", "Warner Bros Discovery", "Paramount Global", "NBCUniversal",
    "Comcast", "Fox Corporation", "News Corp", "Sony Pictures", "Lionsgate", "MGM",
    
    # Streaming & Digital Media
    "Netflix", "Hulu", "HBO Max", "Max", "Disney+", "Paramount+", "Peacock", "Apple TV+",
    "Amazon Prime Video", "YouTube", "Spotify", "Apple Music", "Pandora", "SiriusXM",
    
    # News & Publishing
    "New York Times", "Washington Post", "Wall Street Journal", "Bloomberg", "Reuters", "AP",
    "Associated Press", "CNN", "MSNBC", "ABC News", "CBS News", "NBC News", "Fox News",
    "NPR", "National Public Radio", "BBC", "The Guardian", "Politico", "The Atlantic", "Axios",
    "Vox Media", "BuzzFeed", "Vice Media", "Business Insider",
    
    # Gaming
    "Activision Blizzard", "Electronic Arts", "EA", "Take-Two Interactive", "Rockstar Games",
    "Epic Games", "Riot Games", "Valve", "Ubisoft", "Roblox", "Unity Technologies",
    
    # ========================================================================
    # U.S. TELECOM & COMMUNICATIONS
    # ========================================================================
    "AT&T", "Verizon", "T-Mobile", "Sprint", "Comcast", "Charter", "Spectrum", "Cox Communications",
    "Dish Network", "DirecTV", "CenturyLink", "Lumen Technologies", "Frontier Communications",
    "Crown Castle", "American Tower", "SBA Communications",
    
    # ========================================================================
    # U.S. TRANSPORTATION & LOGISTICS
    # ========================================================================
    # Airlines
    "American Airlines", "Delta Air Lines", "United Airlines", "Southwest Airlines", "JetBlue",
    "Alaska Airlines", "Spirit Airlines", "Frontier Airlines", "Hawaiian Airlines",
    
    # Shipping & Logistics
    "FedEx", "UPS", "United Parcel Service", "USPS", "DHL", "XPO Logistics", "J.B. Hunt",
    "C.H. Robinson", "Expeditors", "Old Dominion", "Ryder", "Werner Enterprises",
    
    # Ride-sharing & Delivery
    "Uber", "Lyft", "DoorDash", "Grubhub", "Instacart", "Postmates",
    
    # ========================================================================
    # U.S. REAL ESTATE
    # ========================================================================
    "CBRE Group", "CBRE", "JLL", "Jones Lang LaSalle", "Cushman & Wakefield", "Colliers",
    "Marcus & Millichap", "Newmark", "Keller Williams", "RE/MAX", "Coldwell Banker",
    "Century 21", "Realogy", "Zillow", "Redfin", "Compass", "Opendoor",
    "Prologis", "Simon Property Group", "AvalonBay", "Equity Residential", "Digital Realty",
    
    # ========================================================================
    # RESEARCH & SCIENTIFIC ORGANIZATIONS (STEM)
    # ========================================================================
    # U.S. National Labs & Research
    "NASA", "National Aeronautics and Space Administration", "JPL", "Jet Propulsion Laboratory",
    "NIH", "National Institutes of Health", "CDC", "Centers for Disease Control",
    "NSF", "National Science Foundation", "NOAA", "DOE", "Department of Energy",
    "Sandia National Laboratories", "Los Alamos National Laboratory", "Lawrence Livermore",
    "Argonne National Laboratory", "Brookhaven National Laboratory", "Oak Ridge National Laboratory",
    "NIST", "National Institute of Standards and Technology", "FDA", "Food and Drug Administration",
    
    # Research Institutions
    "MIT", "Massachusetts Institute of Technology", "MIT Lincoln Laboratory", "Caltech",
    "Stanford Research Institute", "SRI International", "RAND Corporation", "MITRE Corporation",
    "Battelle", "IDA", "Institute for Defense Analyses", "Aerospace Corporation",
    
    # Scientific & Engineering Services
    "Jacobs Engineering", "AECOM", "KBR", "Parsons Corporation", "Fluor Corporation", "Bechtel",
    "CH2M", "Black & Veatch", "Burns & McDonnell", "HDR Inc", "Stantec", "WSP",
    "Tetra Tech", "Golder Associates", "Arcadis", "Wood Group",
    
    # Biotech Research
    "23andMe", "Foundation Medicine", "Exact Sciences", "Grail", "Tempus", "Flatiron Health",
    "IQVIA", "PPD", "Parexel", "Covance", "Charles River Laboratories", "Eurofins",
    
    # ========================================================================
    # SOCIAL SCIENCES, POLICY & RESEARCH ORGANIZATIONS
    # ========================================================================
    # Think Tanks & Policy Research
    "Brookings Institution", "RAND Corporation", "Urban Institute", "Pew Research Center",
    "Council on Foreign Relations", "CFR", "Carnegie Endowment", "Heritage Foundation",
    "American Enterprise Institute", "AEI", "Cato Institute", "Hoover Institution",
    "Center for American Progress", "CAP", "Peterson Institute", "Atlantic Council",
    "Aspen Institute", "Wilson Center", "New America", "Resources for the Future",
    
    # Market & Social Research
    "Gallup", "Nielsen", "NielsenIQ", "Ipsos", "Kantar", "GfK", "YouGov", "Morning Consult",
    "Qualtrics", "SurveyMonkey", "Medallia", "Forrester Research", "Gartner", "IDC",
    "Frost & Sullivan", "McKinsey Global Institute", "Economist Intelligence Unit", "EIU",
    
    # Economic Research & Analysis
    "Moody's", "Moody's Analytics", "S&P Global", "Standard & Poor's", "Fitch Ratings",
    "MSCI", "FactSet", "Bloomberg LP", "Refinitiv", "IHS Markit", "CoStar Group",
    
    # Public Policy & Government Affairs
    "Booz Allen Hamilton", "ICF International", "Maximus", "ManTech", "CACI International",
    "General Dynamics IT", "Peraton", "GDIT", "Serco", "Amentum",
    
    # ========================================================================
    # EDUCATION & ACADEMIC INSTITUTIONS
    # ========================================================================
    # Major Universities (as employers)
    "Harvard University", "Stanford University", "MIT", "Yale University", "Princeton University",
    "Columbia University", "University of Chicago", "Duke University", "Northwestern University",
    "University of Pennsylvania", "Penn", "Cornell University", "Brown University",
    "UC Berkeley", "UCLA", "University of Michigan", "University of Virginia", "UVA",
    "University of North Carolina", "UNC", "University of Texas", "UT Austin", "NYU",
    "Carnegie Mellon University", "CMU", "Georgia Tech", "Caltech", "Johns Hopkins University",
    "University of Washington", "UW", "University of Wisconsin", "USC", "Boston University",
    
    # Educational Companies
    "Pearson", "McGraw-Hill", "Cengage", "Houghton Mifflin Harcourt", "Scholastic",
    "Kaplan", "The Princeton Review", "Chegg", "Coursera", "Udemy", "edX", "Khan Academy",
    "Duolingo", "Rosetta Stone", "Blackboard", "Canvas", "Instructure", "2U", "PowerSchool",
    
    # ========================================================================
    # NGOs & INTERNATIONAL ORGANIZATIONS
    # ========================================================================
    # International Organizations
    "United Nations", "UN", "World Bank", "IMF", "International Monetary Fund", "WTO",
    "World Trade Organization", "WHO", "World Health Organization", "UNESCO", "UNICEF",
    "UNDP", "IFC", "International Finance Corporation", "OECD", "NATO", "IAEA",
    
    # Major NGOs
    "Red Cross", "American Red Cross", "International Red Cross", "ICRC", "Doctors Without Borders",
    "MSF", "Médecins Sans Frontières", "Oxfam", "Save the Children", "CARE International",
    "World Vision", "Habitat for Humanity", "Gates Foundation", "Bill & Melinda Gates Foundation",
    "Ford Foundation", "Rockefeller Foundation", "Bloomberg Philanthropies", "Open Society",
    "MacArthur Foundation", "Hewlett Foundation", "Packard Foundation", "Mellon Foundation",
    "Clinton Foundation", "Obama Foundation", "Carter Center", "Sierra Club", "WWF",
    "World Wildlife Fund", "Nature Conservancy", "Environmental Defense Fund", "EDF",
    "Greenpeace", "Human Rights Watch", "Amnesty International", "ACLU",
    
    # ========================================================================
    # U.K. COMPANIES
    # ========================================================================
    "HSBC", "Barclays", "Lloyds Banking Group", "NatWest", "Royal Bank of Scotland", "Standard Chartered",
    "BP", "British Petroleum", "Shell", "Royal Dutch Shell", "Unilever", "GlaxoSmithKline", "GSK",
    "AstraZeneca", "RELX", "Reed Elsevier", "Diageo", "British American Tobacco", "BAT",
    "Rio Tinto", "BHP", "Anglo American", "Glencore", "Rolls-Royce", "BAE Systems",
    "Tesco", "Sainsbury's", "Marks & Spencer", "M&S", "Boots", "Vodafone", "BT Group",
    "Sky", "ITV", "BBC", "The Guardian", "Financial Times", "The Economist", "Reuters",
    "WPP", "Publicis", "Dentsu", "ARM Holdings", "ARM", "Dyson", "Burberry", "Aston Martin",
    
    # ========================================================================
    # EUROPEAN COMPANIES
    # ========================================================================
    # Germany
    "SAP", "Siemens", "Volkswagen", "BMW", "Mercedes-Benz", "Daimler", "Bosch", "BASF",
    "Bayer", "Allianz", "Deutsche Bank", "Deutsche Telekom", "Adidas", "Continental", "ThyssenKrupp",
    
    # France
    "LVMH", "Louis Vuitton", "L'Oréal", "TotalEnergies", "Total", "Sanofi", "BNP Paribas",
    "Société Générale", "Crédit Agricole", "Carrefour", "Danone", "Michelin", "Airbus",
    "Capgemini", "Schneider Electric", "Saint-Gobain", "Publicis Groupe", "Renault", "Peugeot",
    
    # Netherlands
    "Shell", "Royal Dutch Shell", "Philips", "ASML", "ING", "Heineken", "Unilever",
    "Booking.com", "Adyen", "NXP Semiconductors",
    
    # Switzerland
    "Nestlé", "Novartis", "Roche", "UBS", "Credit Suisse", "Zurich Insurance", "ABB",
    "Glencore", "Swiss Re", "Swatch", "Rolex",
    
    # Spain
    "Banco Santander", "BBVA", "Telefonica", "Iberdrola", "Repsol", "Inditex", "Zara",
    
    # Italy
    "Eni", "Enel", "Intesa Sanpaolo", "UniCredit", "Generali", "Ferrari", "Fiat", "Luxottica",
    
    # Nordic Countries
    "Ericsson", "Volvo", "IKEA", "H&M", "Spotify", "Klarna", "Skanska", "Scania",
    "Nokia", "Kone", "Neste", "Maersk", "Carlsberg", "Novo Nordisk", "Lego", "Vestas",
    
    # ========================================================================
    # ASIAN COMPANIES
    # ========================================================================
    # Japan
    "Toyota", "Honda", "Sony", "Nintendo", "Panasonic", "Hitachi", "Toshiba", "Canon",
    "Mitsubishi", "Sumitomo", "Mitsui", "SoftBank", "Rakuten", "Fast Retailing", "Uniqlo",
    "Nissan", "Mazda", "Subaru", "Suzuki", "Yamaha", "Fujifilm", "Olympus", "Denso",
    
    # South Korea
    "Samsung", "Samsung Electronics", "LG", "LG Electronics", "Hyundai", "Kia", "SK Hynix",
    "POSCO", "Naver", "Kakao", "Korean Air", "Lotte", "CJ Group",
    
    # China
    "Alibaba", "Tencent", "Huawei", "ByteDance", "TikTok", "JD.com", "Baidu", "Xiaomi",
    "Lenovo", "Haier", "BYD", "NIO", "XPeng", "CATL", "DJI", "SHEIN", "Pinduoduo",
    "Ant Group", "DiDi", "Meituan", "NetEase", "Bilibili", "Trip.com", "Weibo",
    
    # India
    "Tata Group", "Tata Consultancy Services", "TCS", "Reliance Industries", "Infosys",
    "Wipro", "HCL Technologies", "Tech Mahindra", "HDFC Bank", "ICICI Bank", "Axis Bank",
    "Bharti Airtel", "Hindustan Unilever", "ITC Limited", "Larsen & Toubro", "Mahindra",
    "Flipkart", "Paytm", "Ola", "Byju's", "Swiggy", "Zomato", "Razorpay", "Freshworks",
    
    # Singapore
    "DBS Bank", "OCBC", "UOB", "Singapore Airlines", "CapitaLand", "Grab", "Sea Limited",
    "Shopee", "Lazada", "Razer", "Singtel", "Temasek",
    
    # Australia
    "BHP", "Rio Tinto", "Commonwealth Bank", "CBA", "Westpac", "ANZ", "NAB",
    "Woolworths", "Coles", "Telstra", "Qantas", "Macquarie Group", "CSL Limited",
    "Atlassian", "Canva", "Afterpay", "REA Group", "Seek",
    
    # ========================================================================
    # LEGAL & PROFESSIONAL FIRMS
    # ========================================================================
    # Law Firms (Global)
    "Kirkland & Ellis", "Latham & Watkins", "DLA Piper", "Baker McKenzie", "Skadden",
    "White & Case", "Clifford Chance", "Allen & Overy", "Linklaters", "Freshfields",
    "Sullivan & Cromwell", "Simpson Thacher", "Davis Polk", "Cravath", "Wachtell",
    "Gibson Dunn", "Sidley Austin", "Jones Day", "Morgan Lewis", "Hogan Lovells",
    "Norton Rose Fulbright", "Dentons", "Reed Smith", "K&L Gates", "Greenberg Traurig",
    
    # Accounting Firms
    "Deloitte", "PwC", "EY", "KPMG", "BDO", "RSM", "Grant Thornton", "Crowe", "Baker Tilly",
    "Marcum", "CliftonLarsonAllen", "CLA", "Moss Adams", "Plante Moran",
    
    # ========================================================================
    # ARCHITECTURE, ENGINEERING & CONSTRUCTION
    # ========================================================================
    "AECOM", "Jacobs", "Fluor", "Bechtel", "KBR", "Parsons", "HDR", "Stantec", "WSP",
    "Gensler", "HOK", "Perkins&Will", "SOM", "Skidmore Owings & Merrill", "Foster + Partners",
    "Zaha Hadid Architects", "BIG", "Bjarke Ingels Group", "Arup", "Thornton Tomasetti",
    "Turner Construction", "Skanska", "Kiewit", "Granite Construction", "Clark Construction",
    "McCarthy Building Companies", "Mortenson", "Suffolk Construction", "Hensel Phelps",
    
    # ========================================================================
    # ADVERTISING & MARKETING
    # ========================================================================
    "WPP", "Omnicom", "Publicis Groupe", "Interpublic", "IPG", "Dentsu",
    "Ogilvy", "BBDO", "DDB", "McCann", "Grey", "Leo Burnett", "FCB", "TBWA",
    "Havas", "Edelman", "FleishmanHillard", "Weber Shandwick", "Hill+Knowlton", "Burson",
    "Wieden+Kennedy", "R/GA", "Droga5", "72andSunny", "AKQA",
    
    # Digital Marketing & Ad Tech
    "Google Ads", "Facebook Ads", "Criteo", "The Trade Desk", "AppLovin", "Unity Ads",
    "Taboola", "Outbrain", "AdRoll", "DoubleVerify", "Integral Ad Science", "IAS",
    
    # ========================================================================
    # HOSPITALITY & TRAVEL
    # ========================================================================
    # Hotels
    "Marriott", "Marriott International", "Hilton", "Hilton Hotels", "Hyatt", "IHG",
    "InterContinental", "Wyndham", "Choice Hotels", "Best Western", "Radisson",
    "Four Seasons", "Ritz-Carlton", "St. Regis", "W Hotels", "Sheraton", "Westin",
    "Accor", "Fairmont", "Mandarin Oriental", "Shangri-La", "Aman",
    
    # Travel & Booking
    "Booking.com", "Expedia", "Airbnb", "VRBO", "Tripadvisor", "Kayak", "Priceline",
    "Travelport", "Amadeus", "Sabre", "Hopper", "Skyscanner", "Google Flights",
    
    # Cruise & Tourism
    "Carnival", "Royal Caribbean", "Norwegian Cruise Line", "MSC Cruises",
    
    # ========================================================================
    # SPORTS & FITNESS
    # ========================================================================
    "Nike", "Adidas", "Under Armour", "Puma", "New Balance", "Asics", "Reebok",
    "Lululemon", "Peloton", "Planet Fitness", "Equinox", "Life Time Fitness",
    "NFL", "NBA", "MLB", "NHL", "MLS", "FIFA", "UEFA", "ESPN", "Fox Sports",
    
    # ========================================================================
    # U.S. GOVERNMENT AGENCIES (as employers)
    # ========================================================================
    "IRS", "Internal Revenue Service", "FBI", "Federal Bureau of Investigation",
    "CIA", "Central Intelligence Agency", "NSA", "National Security Agency",
    "DHS", "Department of Homeland Security", "TSA", "Border Patrol", "ICE",
    "State Department", "Treasury Department", "DOJ", "Department of Justice",
    "Pentagon", "DOD", "Department of Defense", "Army", "Navy", "Air Force", "Marines",
    "EPA", "Environmental Protection Agency", "FEMA", "SEC", "FTC", "FCC",
    "Social Security Administration", "SSA", "Medicare", "Medicaid", "HUD",
    "Department of Education", "Department of Labor", "DOL", "USDA",
    "Patent and Trademark Office", "USPTO", "Postal Service", "USPS",
]

# Known scam patterns (companies that don't exist or are fake)
KNOWN_SCAM_PATTERNS = [
    "easy money", "work from home guaranteed", "no experience needed $$$",
    "unlimited income", "be your own boss", "make money fast",
]


class CompanyDatabase:
    """SQLite-backed company verification database."""
    
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # Use same directory as main database
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            db_path = os.path.join(base_dir, "companies.db")
        
        self.db_path = db_path
        self._init_database()
        self._seed_verified_companies()
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get a database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _init_database(self):
        """Initialize the companies table."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                name_normalized TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'unknown',
                scam_reports INTEGER DEFAULT 0,
                legit_reports INTEGER DEFAULT 0,
                source TEXT DEFAULT 'seed',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name_normalized)
            )
        """)
        
        # Create index for fast lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_companies_normalized 
            ON companies(name_normalized)
        """)
        
        conn.commit()
        conn.close()
    
    def _normalize_name(self, name: str) -> str:
        """Normalize company name for matching."""
        # Lowercase, strip whitespace, remove common suffixes
        normalized = name.lower().strip()
        suffixes = [" inc", " inc.", " llc", " ltd", " corp", " corporation", 
                    " co", " company", " technologies", " tech", " solutions"]
        for suffix in suffixes:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)]
        return normalized.strip()
    
    def _seed_verified_companies(self):
        """Seed database with Fortune 500 and known legit companies."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        for company in VERIFIED_LEGIT_COMPANIES:
            normalized = self._normalize_name(company)
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO companies 
                    (name, name_normalized, status, source, notes)
                    VALUES (?, ?, ?, ?, ?)
                """, (company, normalized, CompanyStatus.VERIFIED_LEGIT.value, 
                      "fortune500", "Pre-seeded verified company"))
            except sqlite3.IntegrityError:
                pass  # Already exists
        
        conn.commit()
        conn.close()
    
    def check_company(self, company_name: str, use_api: bool = False) -> CompanyCheckResult:
        """
        Check if a company is known and trustworthy.
        
        Args:
            company_name: Name of company to check
            use_api: If True, will query external APIs for unknown companies
        
        Returns CompanyCheckResult with status and confidence.
        """
        if not company_name or len(company_name.strip()) < 2:
            return CompanyCheckResult(
                company_name=company_name,
                status=CompanyStatus.UNKNOWN,
                confidence=0.0,
                match_type="none",
                notes="Company name too short or empty"
            )
        
        normalized = self._normalize_name(company_name)
        
        # Step 1: Exact match in local database
        result = self._exact_match(normalized, company_name)
        if result:
            return result
        
        # Step 2: Fuzzy match (if rapidfuzz available)
        if FUZZY_ENABLED:
            result = self._fuzzy_match(normalized, company_name)
            if result:
                return result
        
        # Step 3: Check for scam patterns
        if self._contains_scam_pattern(company_name):
            return CompanyCheckResult(
                company_name=company_name,
                status=CompanyStatus.SUSPICIOUS,
                confidence=0.7,
                match_type="pattern",
                notes="Company name contains suspicious patterns"
            )
        
        # Step 4: API verification (if enabled and requested)
        if use_api and API_VERIFICATION_ENABLED:
            api_result = self._check_company_via_api(company_name)
            if api_result:
                return api_result
        
        # Not found
        return CompanyCheckResult(
            company_name=company_name,
            status=CompanyStatus.UNKNOWN,
            confidence=0.0,
            match_type="none",
            notes="Company not found in database. Enable API verification for real-time lookup."
        )
    
    async def check_company_async(self, company_name: str, use_api: bool = True) -> CompanyCheckResult:
        """
        Async version of check_company with API verification.
        
        This is the recommended method for API-based verification as it won't block.
        """
        # First check local database (fast)
        result = self.check_company(company_name, use_api=False)
        if result.status != CompanyStatus.UNKNOWN:
            return result
        
        # If unknown, try API verification
        if use_api and API_VERIFICATION_ENABLED:
            try:
                from app.services.company_api import verify_company_async, VerificationSource
                
                api_result = await verify_company_async(company_name)
                
                if api_result.is_verified and api_result.confidence >= 0.7:
                    # Cache the result in our database
                    self._cache_api_result(company_name, api_result)
                    
                    return CompanyCheckResult(
                        company_name=company_name,
                        status=CompanyStatus.LIKELY_LEGIT,
                        confidence=api_result.confidence,
                        match_type="api",
                        matched_name=company_name,
                        notes=f"Verified via {api_result.source.value}. "
                              f"Jurisdiction: {api_result.jurisdiction or 'Unknown'}"
                    )
            except Exception as e:
                logger.warning(f"API verification failed for '{company_name}': {e}")
        
        return result
    
    def _check_company_via_api(self, company_name: str) -> Optional[CompanyCheckResult]:
        """
        Synchronous API verification (blocking).
        Use check_company_async for non-blocking verification.
        """
        try:
            from app.services.company_api import verify_company_sync
            
            api_result = verify_company_sync(company_name)
            
            if api_result.is_verified and api_result.confidence >= 0.7:
                # Cache the result
                self._cache_api_result(company_name, api_result)
                
                return CompanyCheckResult(
                    company_name=company_name,
                    status=CompanyStatus.LIKELY_LEGIT,
                    confidence=api_result.confidence,
                    match_type="api",
                    matched_name=company_name,
                    notes=f"Verified via {api_result.source.value}"
                )
        except Exception:
            logger.warning(f"Sync API verification failed for '{company_name}'", exc_info=True)
        
        return None
    
    def _cache_api_result(self, company_name: str, api_result) -> None:
        """Cache API verification result in local database."""
        try:
            normalized = self._normalize_name(company_name)
            conn = self._get_connection()
            cursor = conn.cursor()
            
            notes = f"API verified via {api_result.source.value}"
            if api_result.jurisdiction:
                notes += f", Jurisdiction: {api_result.jurisdiction}"
            if api_result.industry:
                notes += f", Industry: {api_result.industry}"
            
            cursor.execute("""
                INSERT OR REPLACE INTO companies 
                (name, name_normalized, status, source, notes, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                company_name, 
                normalized, 
                CompanyStatus.LIKELY_LEGIT.value,
                f"api_{api_result.source.value}",
                notes
            ))
            
            conn.commit()
            conn.close()
        except Exception:
            logger.debug(f"Failed to cache API result for '{company_name}'", exc_info=True)
    
    def _exact_match(self, normalized: str, original: str) -> Optional[CompanyCheckResult]:
        """Try exact match in database."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name, status, scam_reports, legit_reports, notes
            FROM companies WHERE name_normalized = ?
        """, (normalized,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return CompanyCheckResult(
                company_name=original,
                status=CompanyStatus(row["status"]),
                confidence=1.0,
                match_type="exact",
                matched_name=row["name"],
                scam_reports=row["scam_reports"],
                legit_reports=row["legit_reports"],
                notes=row["notes"]
            )
        
        return None
    
    def _fuzzy_match(self, normalized: str, original: str) -> Optional[CompanyCheckResult]:
        """Try fuzzy matching against known companies."""
        if not FUZZY_ENABLED:
            return None
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT name, name_normalized, status FROM companies")
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return None
        
        if process is None or fuzz is None:
            return None
        
        # Get all normalized names
        company_names = [(row["name"], row["name_normalized"], row["status"]) for row in rows]
        normalized_names = [c[1] for c in company_names]
        
        # Find best match
        match = process.extractOne(normalized, normalized_names, scorer=fuzz.ratio)
        
        if match and match[1] >= 85:  # 85% similarity threshold
            matched_normalized = match[0]
            # Find the original entry
            for name, norm, status in company_names:
                if norm == matched_normalized:
                    return CompanyCheckResult(
                        company_name=original,
                        status=CompanyStatus(status),
                        confidence=match[1] / 100.0,
                        match_type="fuzzy",
                        matched_name=name,
                        notes=f"Fuzzy match ({match[1]}% similarity)"
                    )
        
        return None
    
    def _contains_scam_pattern(self, name: str) -> bool:
        """Check if name contains known scam patterns."""
        name_lower = name.lower()
        return any(pattern in name_lower for pattern in KNOWN_SCAM_PATTERNS)
    
    def report_company(self, company_name: str, is_scam: bool, notes: Optional[str] = None) -> bool:
        """
        Submit a user report about a company.
        
        Args:
            company_name: Name of the company
            is_scam: True if reporting as scam, False if reporting as legit
            notes: Optional notes about the report
        
        Returns:
            True if report was recorded successfully
        """
        normalized = self._normalize_name(company_name)
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Check if company exists
        cursor.execute(
            "SELECT id, scam_reports, legit_reports FROM companies WHERE name_normalized = ?",
            (normalized,)
        )
        row = cursor.fetchone()
        
        if row:
            # Update existing
            if is_scam:
                cursor.execute("""
                    UPDATE companies 
                    SET scam_reports = scam_reports + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (row["id"],))
            else:
                cursor.execute("""
                    UPDATE companies 
                    SET legit_reports = legit_reports + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (row["id"],))
            
            # Update status based on reports
            new_scam = row["scam_reports"] + (1 if is_scam else 0)
            new_legit = row["legit_reports"] + (0 if is_scam else 1)
            new_status = self._calculate_status(new_scam, new_legit)
            
            cursor.execute(
                "UPDATE companies SET status = ? WHERE id = ?",
                (new_status.value, row["id"])
            )
        else:
            # Insert new
            status = CompanyStatus.SUSPICIOUS if is_scam else CompanyStatus.LIKELY_LEGIT
            cursor.execute("""
                INSERT INTO companies 
                (name, name_normalized, status, scam_reports, legit_reports, source, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (company_name, normalized, status.value, 
                  1 if is_scam else 0, 0 if is_scam else 1, "user_report", notes))
        
        conn.commit()
        conn.close()
        return True
    
    def _calculate_status(self, scam_reports: int, legit_reports: int) -> CompanyStatus:
        """Calculate status based on report counts."""
        total = scam_reports + legit_reports
        if total == 0:
            return CompanyStatus.UNKNOWN
        
        scam_ratio = scam_reports / total
        
        if scam_ratio >= 0.8 and scam_reports >= 3:
            return CompanyStatus.KNOWN_SCAM
        elif scam_ratio >= 0.5:
            return CompanyStatus.SUSPICIOUS
        elif scam_ratio <= 0.2 and legit_reports >= 3:
            return CompanyStatus.LIKELY_LEGIT
        else:
            return CompanyStatus.UNKNOWN
    
    def bulk_import_companies(
        self, 
        companies: List[str], 
        status: CompanyStatus = CompanyStatus.VERIFIED_LEGIT,
        source: str = "bulk_import",
        notes: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Bulk import companies into the database.
        
        Args:
            companies: List of company names to import
            status: Status to assign to imported companies
            source: Source identifier for the import
            notes: Optional notes about the import
            
        Returns:
            Dict with 'imported' (count of new companies) and 'skipped' (count of duplicates)
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        imported = 0
        skipped = 0
        
        for company in companies:
            if not company or len(company.strip()) < 2:
                skipped += 1
                continue
                
            normalized = self._normalize_name(company.strip())
            
            try:
                cursor.execute("""
                    INSERT INTO companies 
                    (name, name_normalized, status, source, notes)
                    VALUES (?, ?, ?, ?, ?)
                """, (company.strip(), normalized, status.value, source, notes))
                imported += 1
            except sqlite3.IntegrityError:
                skipped += 1  # Already exists
                continue
        
        conn.commit()
        conn.close()
        
        return {
            "imported": imported,
            "skipped": skipped,
            "total_processed": len(companies)
        }
    
    def import_from_file(
        self,
        file_path: str,
        status: CompanyStatus = CompanyStatus.VERIFIED_LEGIT
    ) -> Mapping[str, int | str]:
        """
        Import companies from a text file (one company per line).
        
        Args:
            file_path: Path to the text file
            status: Status to assign to imported companies
            
        Returns:
            Dict with import statistics
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                companies = [line.strip() for line in f if line.strip()]
            
            return self.bulk_import_companies(
                companies, 
                status=status, 
                source="file_import",
                notes=f"Imported from {file_path}"
            )
        except FileNotFoundError:
            return {"error": f"File not found: {file_path}", "imported": 0, "skipped": 0}
        except Exception as e:
            return {"error": str(e), "imported": 0, "skipped": 0}
    
    def get_stats(self) -> Dict:
        """Get database statistics."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as total FROM companies")
        total = cursor.fetchone()["total"]
        
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM companies GROUP BY status
        """)
        by_status = {row["status"]: row["count"] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            "total_companies": total,
            "by_status": by_status,
            "fuzzy_matching_enabled": FUZZY_ENABLED
        }


# Global instance
_company_db: Optional[CompanyDatabase] = None


def get_company_db() -> CompanyDatabase:
    """Get or create the global CompanyDatabase instance."""
    global _company_db
    if _company_db is None:
        _company_db = CompanyDatabase()
    return _company_db


def check_company(company_name: str) -> CompanyCheckResult:
    """Convenience function to check a company."""
    return get_company_db().check_company(company_name)


def report_company(company_name: str, is_scam: bool, notes: Optional[str] = None) -> bool:
    """Convenience function to report a company."""
    return get_company_db().report_company(company_name, is_scam, notes)
