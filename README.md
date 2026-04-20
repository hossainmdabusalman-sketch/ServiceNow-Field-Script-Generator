# ServiceNow Field Script Generator

A Python (FastAPI) + React (Vite) tool that reads your **Oracle table definition document** and generates a ServiceNow background script to:

- Set field **labels** (論理名)
- Set field **types** (Oracle / Domain → ServiceNow)
- Set field **default values**

---

## Project Structure

```
sn-tool/
├── backend/
│   ├── main.py            # FastAPI backend
│   └── requirements.txt
├── frontend/
│   ├── index.html         # Vite entry point
│   ├── vite.config.js     # Vite configuration
│   ├── package.json       # Dependencies & Scripts
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   └── App.css        # Styles
├── start.sh               # One-command startup
└── README.md
```

---

## Quick Start

### Option A — One command (both services)

```bash
chmod +x start.sh
./start.sh
```

Then open: **http://localhost:3000**

---

### Option B — Run separately

**Backend (Python):**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API docs available at: http://localhost:8000/docs

**Frontend (React):**
```bash
cd frontend
npm install
npm run dev
```
Opens at: http://localhost:3000

---

## Requirements

| Tool    | Version  |
|---------|----------|
| Python  | 3.10+    |
| Node.js | 16+      |
| npm     | 8+       |

---

## How to Use

### 1. Set Table Name
Enter the ServiceNow table name (e.g. `u_bs_kashidashi_snr`).

### 2. Add Fields

**Manually:** Click `+ Add Row` and fill in:
- 論理名 — field label (Japanese name)
- 物理名 — field name on ServiceNow
- データ型 — Oracle column type OR Domain Name (prefix with `*`)
- Default Value — optional

**From Excel:** Click `Paste from Excel` and paste tab-separated rows:
```
1    年月    YEAR_MONTH    *YYYYMM    Yes    
2    府県コード    AREA_CD    *AREA_CODE    Yes    
```

### 3. Type Resolution (automatic)
The `→ SN Type` column auto-converts as you type:

| Oracle / Domain       | ServiceNow Type |
|-----------------------|-----------------|
| `CHAR(n)`, `VARCHAR2(n)` | String        |
| `NUMBER(≤8, 0)`       | Integer         |
| `NUMBER(9–19, 0)`     | Long            |
| `NUMBER(20+, 0)`      | String          |
| `NUMBER(p, s>0)`      | Decimal         |
| `DATE`                | Date            |
| `*YYYYMM`             | String(6)       |
| `*YEN_TH`             | Long            |
| `*RATE_RATIO_S`       | Decimal(6) s3   |
| `*UPDATE_DATE`        | Date/Time       |
| … (35 domains total)  | …               |

### 4. Generate Script
Click **⚡ Generate Script**. Copy the output and paste it in ServiceNow:

> **System Definition › Scripts – Background**

---

## API Endpoints

| Method | Path                  | Description                        |
|--------|-----------------------|------------------------------------|
| POST   | `/api/resolve-type`   | Resolve a single Oracle/Domain type |
| POST   | `/api/parse-paste`    | Parse tab-separated Excel paste     |
| POST   | `/api/generate`       | Generate the full script            |
| GET    | `/api/domains`        | List all domain name mappings       |
| GET    | `/api/health`         | Health check                        |

### Example: Resolve a type
```bash
curl -X POST http://localhost:8000/api/resolve-type \
  -H "Content-Type: application/json" \
  -d '{"data_type": "*YEN_TH"}'
# → {"type": "Long", "sn_internal_type": "long_integer"}
```

### Example: Generate a script
```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "u_my_table",
    "script_mode": "bg",
    "fields": [
      {"label": "年月", "field_name": "YEAR_MONTH", "data_type": "*YYYYMM", "default_value": "", "not_null": true}
    ]
  }'
```

---

## Adding Custom Domains

Edit `backend/main.py` — add entries to `DOMAIN_MAP`:

```python
DOMAIN_MAP = {
    ...
    "MY_CUSTOM_DOMAIN": {"type": "String", "max_len": 20},
    ...
}
```

---

## Script Modes

| Mode              | Description                                   |
|-------------------|-----------------------------------------------|
| Background Script | Uses `GlideRecord` query + update loop        |
| Update Set Script | Direct property assignment style              |
