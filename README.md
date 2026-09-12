# Spotter AI — Commercial Interstate Logistics & FMCSA HOS Engine

A production-ready Full Stack commercial logistics web application built for the **Spotter AI Assessment**. The application takes interstate truck trip inputs, simulates an **FMCSA-compliant route schedule** (strictly enforcing property-carrying Hours of Service rules, mandatory fuel stops, and rest periods), and produces two primary outputs:

1. **Interactive Route Map**: Full-width interactive Leaflet map featuring high-resolution route polylines, custom waypoints, fuel stops, 10-hour sleeper berth resets, 30-minute breaks, pickup, and delivery dropoff with rich data popups.
2. **Official FMCSA/DOT 24-Hour Daily Log Sheets**: Authentic vector SVG 4-duty-line step-graph grids (FMCSA §395.8) partitioned across midnight boundaries (00:00 to 24:00), with line hour totals summing to **exactly 24.0 hours** per day, transition remarks, and 70-hr / 8-day cycle recaps.

---

## 🚚 System Architecture & Tech Stack

```
Spotter assessment/
├── backend/                               # Django 5.1 & Django REST Framework
│   ├── manage.py                          # Django CLI utility
│   ├── requirements.txt                   # Python dependencies
│   ├── spotter_logistics/                 # Core Django project configuration
│   │   ├── settings.py                    # CORS, DRF, and app settings
│   │   ├── urls.py                        # Root URL routing (/api/)
│   │   └── wsgi.py                        # WSGI server entry point
│   ├── hos_engine/                        # Logistics & HOS simulation app
│   │   ├── views.py                       # REST API endpoint (/api/plan-trip/, /api/health/)
│   │   ├── serializers.py                 # Request validation schemas
│   │   ├── urls.py                        # API route mapping
│   │   └── engine/                        # Core algorithmic engine
│   │       ├── hos_calculator.py          # FMCSA 49 CFR Part 395 simulation engine
│   │       ├── log_splitter.py            # 24-Hour midnight boundary partitioner
│   │       ├── routing.py                 # OSRM routing engine with resilient fallback
│   │       └── cities_db.py               # US logistics hubs & coordinates database
│   └── tests/
│       └── test_hos_engine.py             # Automated unit tests (HOS, 24h totals, API)
│
├── frontend/                              # React 18 + Vite SPA
│   ├── index.html                         # Entry HTML with Inter, Outfit & Leaflet CSS
│   ├── vite.config.js                     # Vite build & proxy config
│   ├── tailwind.config.js                 # Dark navy & spotter-cyan design system
│   ├── src/
│   │   ├── main.jsx                       # React DOM mounting
│   │   ├── App.jsx                        # Main application container
│   │   ├── index.css                      # Tailwind base, glassmorphism & print stylesheet
│   │   ├── api/client.js                  # API fetch client for /api/plan-trip/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                 # Branding, health status, and export buttons
│   │   │   ├── PresetSelector.jsx         # 1-click test scenarios (Chicago->LA, etc.)
│   │   │   ├── TripForm.jsx               # Dispatch parameters & cycle slider form
│   │   │   ├── TripSummary.jsx            # KPI cards (Miles, Hours, Duration, Stops, Cycle)
│   │   │   ├── RouteMap.jsx               # Leaflet map with custom icons & popups
│   │   │   ├── DailyLogSheet.jsx          # Official DOT log sheet card & print layout
│   │   │   ├── GridSvg.jsx                # Authentic FMCSA §395.8 4-line vector SVG grid
│   │   │   └── ItineraryTimeline.jsx      # Chronological event timeline
│   │   └── utils/
│   │       └── formatters.js              # Time, duration, and status badge formatters
└── README.md                              # Documentation, setup & evaluation specs
```

---

## ⚖️ FMCSA Regulatory & Trip Simulation Logic (49 CFR Part 395)

The simulation engine (`backend/hos_engine/engine/hos_calculator.py`) adheres strictly to property-carrying commercial motor vehicle regulations:

| Regulation / Rule | Description & Simulation Implementation |
| :--- | :--- |
| **70-Hour / 8-Day Rule** | Cumulative On-Duty time (Driving + On-Duty Not Driving) cannot exceed 70.0 hours. If remaining capacity reaches 0 hours, a **mandatory 34-hour restart** is scheduled (resetting cycle used to 0.0h). |
| **11-Hour Driving Limit** | Driver may drive a maximum of 11.0 cumulative hours following 10 consecutive hours off-duty/sleeper berth. |
| **14-Hour Driving Window** | Driver cannot drive beyond the 14th consecutive hour coming on duty. Off-duty breaks do not extend this 14-hour window. |
| **30-Minute Rest Break** | Required after 8 cumulative hours of driving without an interruption. Under the 2020 FMCSA rule, satisfied by 30 consecutive minutes Off-Duty, Sleeper Berth, or On-Duty Not Driving (such as fueling). |
| **10-Hour Off-Duty Reset** | Mandatory 10 consecutive hours Sleeper Berth / Off-Duty to reset the 11-hour driving and 14-hour window clocks. |
| **1,000-Mile Fueling Stops** | Triggered at least once every 1,000 miles. Takes 30 minutes (0.5 hrs) logged as **On-Duty (Not Driving)**. |
| **Pickup & Drop-off Loading** | Exactly 1.0 hour at Pickup origin logged as **On-Duty (Not Driving)**; Exactly 1.0 hour at Dropoff destination logged as **On-Duty (Not Driving)**. |
| **Commercial Highway Speed** | Simulated at 55 mph highway average for commercial freight tractors. |

---

## 📐 24-Hour Midnight Log Partitioning & Vector Grid

According to FMCSA §395.8:
- Multi-day trips must be divided into sequential calendar days (**Midnight 00:00 to Midnight 24:00**).
- Any event spanning midnight (e.g. a 10-hour sleeper berth from 20:00 to 06:00) is sliced at 24:00 into Day 1 (4.0 hrs) and Day 2 (6.0 hrs).
- Pre-trip off-duty time (00:00 to trip departure on Day 1) and post-trip off-duty time (delivery completion to 24:00 on the final day) are automatically padded.
- **Guarantee**: Daily Line Totals (Line 1: Off Duty + Line 2: Sleeper Berth + Line 3: Driving + Line 4: On Duty ND) **sum to EXACTLY 24.0 hours for every single day**.
- **Vector Grid**: High-precision SVG rendering 24 hourly columns with 15-minute sub-ticks (¼, ½, ¾ hr), line totals on the right, and continuous step-lines connecting duty transitions with vertical steps.
- **Exporting**: Click **Print / Export PDF** on any log sheet to generate high-resolution print-ready documents formatted for DOT compliance inspection.

---

## 🚀 Quickstart & Local Setup Instructions

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**

### 1. Backend Setup (Django REST Framework)
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows:
python -m venv venv
venv\Scripts\activate

# macOS / Linux:
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Run automated tests to verify HOS rules and 24-hour log partitioning
python manage.py test tests

# Start backend development server (Runs on http://localhost:8000)
python manage.py runserver 127.0.0.1:8000
```

---

## ⚡ Direct Supabase (PostgreSQL) Connection Guide

This application is fully equipped to connect directly to **Supabase** via PostgreSQL (`psycopg2-binary`, `dj-database-url`, and `python-dotenv`).

### Step 1: Copy Your Supabase Connection String
1. Log in to [supabase.com](https://supabase.com/dashboard) and select your project.
2. Click on **Project Settings** (gear icon) → **Database**.
3. Under **Connection string**, select the **URI** tab.
4. Copy the connection string. It will look like:
   - **Direct connection**:
     ```text
     postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
     ```
   - **Transaction Pooler (IPv4 / recommended)**:
     ```text
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```

### Step 2: Create `.env` in `backend/`
Inside the `backend/` folder, create a `.env` file (you can copy `.env.example`):
```bash
cp .env.example .env
```
Paste your Supabase URI into `.env`:
```ini
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```
*(Remember to replace `[YOUR-PASSWORD]` with your real Supabase database password).*

### Step 3: Run Migrations against Supabase
With your virtual environment activated, run:
```bash
python manage.py migrate
```
Django will immediately connect to your Supabase PostgreSQL instance and create:
- All Django authentication & session tables
- The `hos_engine_tripplanrecord` table for storing calculated commercial trip plans!

### Step 4: Verify in Supabase
1. In your Supabase Dashboard, open **Table Editor**.
2. Plan a trip in the web application or via API.
3. You will see newly planned trips automatically recorded in the `hos_engine_tripplanrecord` table with distance, duration, driver name, carrier, and full summary data!

---

### 2. Frontend Setup (React Vite + Tailwind CSS)
```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite frontend server (Runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`** to access the dashboard.

---

## 🧪 Sample Evaluation Scenarios

The UI provides instant 1-click preset scenario buttons at the top of the dashboard:

### Scenario 1: Primary Assessment Benchmark (Chicago, IL → Los Angeles, CA)
- **Current Location**: Chicago, IL
- **Freight Pickup**: Gary, IN
- **Final Dropoff**: Los Angeles, CA
- **Current Cycle Used**: 15.0 hrs
- **Expected Results**:
  - Distance: `~2,064 miles`
  - Driving Time: `37.5 hrs` | Total Trip Duration: `72.0 hrs`
  - Fuel Stops: `2 stops` (every ~1,000 miles)
  - 10-Hr Rests: `3 resets` | 30-min breaks: `3 breaks`
  - Generates **4 Daily ELD Log Sheets**, each summing to **exactly 24.0 hours**.

### Scenario 2: High Cycle Used Triggering 34-Hour Restart (Atlanta, GA → Seattle, WA)
- **Current Location**: Atlanta, GA
- **Freight Pickup**: Atlanta, GA
- **Final Dropoff**: Seattle, WA
- **Current Cycle Used**: 42.0 hrs (High starting cycle)
- **Expected Results**:
  - Distance: `~2,642 miles`
  - Triggers automatic **34-hour restart** when the 70-hour cycle is reached.
  - Generates **6 Daily ELD Log Sheets** with restart logged on Day 2/Day 3.

### Scenario 3: Regional Short-Haul (Detroit, MI → Chicago, IL)
- **Current Location**: Detroit, MI
- **Freight Pickup**: Detroit, MI
- **Final Dropoff**: Chicago, IL
- **Current Cycle Used**: 2.0 hrs
- **Expected Results**:
  - Distance: `~280 miles`
  - Completed within a single shift and within the 14-hour window on **Day 1 (24.0 hrs total)**.

---

## 🌐 Free Cloud Deployment Instructions

### Frontend (Vercel)
1. Push the repository to GitHub.
2. In Vercel, click **Add New Project** and select the repository.
3. Configure the Root Directory as `frontend`.
4. Build Command: `npm run build`, Output Directory: `dist`.
5. Set Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://spotter-backend.onrender.com`).
6. Deploy!

### Backend (Render / Railway / Fly.io)
1. On **Render.com**, click **New Web Service** and connect the repository.
2. Root Directory: `backend`.
3. Environment: `Python 3`.
4. Build Command: `pip install -r requirements.txt && python manage.py migrate`.
5. Start Command: `gunicorn spotter_logistics.wsgi:application --bind 0.0.0.0:$PORT`.
6. Add Environment Variables:
   - `DJANGO_SECRET_KEY`: (Generate a secure secret key)
   - `PYTHON_VERSION`: `3.11.0`

---

## 📡 REST API Documentation

### `POST /api/plan-trip/`
Calculates route schedule, simulated HOS events, and generates 24-hour log sheets.

#### Request Body:
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Gary, IN",
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_used": 15.0,
  "carrier_name": "Spotter Logistics LLC",
  "driver_name": "Kavankumar",
  "driver_signature": "Kavankumar",
  "tractor_number": "TRK-408",
  "trailer_number": "TRL-992",
  "shipping_doc": "BOL #48291-SP",
  "commodity": "Commercial Freight #48291",
  "trip_start_time": "2026-09-12T06:00:00"
}
```

#### Response Summary:
```json
{
  "success": true,
  "summary": {
    "total_distance_miles": 2064.0,
    "total_driving_hours": 37.5,
    "total_trip_duration_hours": 72.0,
    "fuel_stops_count": 2,
    "rest_stops_count": 6,
    "remaining_cycle_hours": 14.0,
    "total_days": 4
  },
  "locations": { ... },
  "route_geometry": { "polyline": [[41.878, -87.629], ...] },
  "stops": [ ... ],
  "timeline": [ ... ],
  "daily_logs": [
    {
      "day_number": 1,
      "date": "2026-09-12",
      "line_totals": {
        "line_1_off_duty": 6.5,
        "line_2_sleeper_berth": 5.25,
        "line_3_driving": 11.0,
        "line_4_on_duty": 1.25,
        "total_hours": 24.0
      },
      "grid_segments": [ ... ],
      "duty_transitions": [ ... ],
      "recap": {
        "on_duty_today": 12.25,
        "cycle_hours_used": 27.25,
        "cycle_hours_remaining": 42.75
      }
    }
  ]
}
```

### `GET /api/health/`
Checks backend service operational status.
```json
{
  "status": "online",
  "service": "Spotter AI Logistics & FMCSA HOS Engine",
  "version": "1.0.0"
}
```

---

## 🛡️ License & Commercial Assessment
Created for the **Spotter AI Logistics Technical Assessment**. All rights reserved.
