# EduTribe — Ministry of Tribal Affairs (MoTA) Scholarship & Fellowship Portal

EduTribe is a unified digital platform designed for Scheduled Tribe (ST) students across India. It simplifies the discovery, eligibility evaluation, and application verification of Ministry of Tribal Affairs (MoTA) scholarship and fellowship schemes through an automated rule engine, intuitive dashboards, and a multilingual conversational assistant supporting both Voice and Text in Hindi and English.

---

## 🌟 Key Highlights

- **5 MoTA Schemes Evaluated Simultaneously:** Instant evaluation of applicant profiles against Pre-Matric, Post-Matric, National Top-Class, National Fellowship (NFST), and National Overseas Scholarship (NOS).
- **EduTribe AI Assistant (Text + Voice):** Real-time conversational guidance with speech-to-text recognition and text-to-speech audio feedback in both Hindi (हिंदी) and English.
- **252 Premier Institutes Integrated:** Verified registry of premier Indian institutions (IITs, IIMs, NITs, AIIMS, NLUs, Central Universities) under the National Top-Class Scheme.
- **End-to-End Governance Lifecycle:** Role-based portals for Applicants, Institute Verification Officers, and Ministry Administrators.
- **Bi-Directional Language Support:** Complete platform localization for Hindi and English.

---

## 🏛️ Covered Ministry of Tribal Affairs (MoTA) Schemes

| Scheme Name | Target Levels | Annual Family Income Ceiling | Key Benefits & Scope |
|---|---|---|---|
| **Pre-Matric Scholarship for ST Students** | Class IX & X | ₹2,50,000 / year | Day scholar and hosteller allowances for recognized schools |
| **Post-Matric Scholarship for ST Students** | Class XI, XII, ITI, Diploma, UG, PG | ₹2,50,000 / year | Mandatory fee coverage + monthly maintenance allowance |
| **National Top-Class Education Scheme** | Undergraduate & Postgraduate | ₹6,00,000 / year | Full tuition fees + living allowance (₹3,000/mo) + computer grant (₹45,000) at 252 notified institutes |
| **National Fellowship for ST (NFST)** | M.Phil & Ph.D. Research Scholars | No Income Ceiling | ₹35,000 to ₹38,000/month fellowship + annual contingency grant |
| **National Overseas Scholarship (NOS)** | Master's, Ph.D., Post-Doc Abroad | ₹6,00,000 / year | Full tuition + foreign living allowance for QS World Top 1000 universities |

---

## 🚀 Core Platform Modules

### 1. Multi-Scheme Eligibility Engine (`/eligibility`)
- Dynamic rule-based validation checking education level, family income, age limit, academic marks, and institute notifications.
- Immediate scheme verdict: `Eligible` ✅, `Partially Eligible` ⚠️, or `Not Eligible` ❌.
- Provides actionable breakdown of verified criteria and pending requirements with plain-language recommendations.

### 2. EduTribe Bilingual AI Assistant
- Conversational digital helpdesk accessible across every page of the portal.
- **Voice Interaction:** Spoken voice queries automatically trigger voice audio playback alongside text responses.
- **Text Interaction:** Typed queries receive formatted text explanations.
- **Bilingual Processing:** Automatically detects and answers in natural Devanagari Hindi or supportive English.
- **Collapsible Interface:** Full minimize and collapse system with floating launcher.

### 3. Applicant Dashboard (`/applicant`)
- Multi-stage application status tracker: *Submitted → Institute Verification → State Nodal Review → Ministry Disbursement*.
- Secure document checklist for ST caste certificates, income certificates, marksheets, and fee receipts.

### 4. Institute Verification Portal (`/officer`)
- Dedicated portal for college and university nodal officers to scrutinize enrollment, fee structures, and attendance.

### 5. Ministry Administration Command Center (`/admin`)
- Administrative dashboard with real-time analytics by scheme, state-wise distribution, and disbursement metrics.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, React Router 6, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Python, Django, Django REST Framework
- **Data Engine:** MoTA Eligibility Rules Evaluator, Comprehensive 252-Institute Registry
- **Speech Processing:** Web Speech Recognition (STT) & Speech Synthesis (TTS)
- **Security:** Token-based authentication, role-based access control (RBAC), sanitized data inputs

---

## 📂 Project Structure

```
ai-scholarship-portal/
├── frontend/                     # React + Vite Single-Page Application
│   ├── src/
│   │   ├── components/           # Navbar, Footer, EduTribeAssistant, StatusBadge
│   │   ├── pages/                # Landing, EligibilityChecker, Dashboards
│   │   ├── contexts/             # AuthContext, LanguageContext
│   │   └── data/                 # Translations, Scheme definitions
│   └── package.json
│
├── backend/                      # Django Application
│   ├── config/                   # Django settings, WSGI/ASGI, URLs
│   ├── core/                     # Intelligence and Assistant service
│   ├── rules_engine/             # MoTA Rule evaluation algorithms & models
│   ├── accounts/                 # User authentication & role management
│   ├── applications/             # Application lifecycle management
│   └── manage.py
│
├── institute_list_full_252.json  # 252 Premier MoTA-notified institutes
└── scheme_rules.json             # Statutory criteria and condition trees
```

---

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the backend server
python manage.py runserver 8000
```

### 2. Frontend Setup
```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser to explore the portal.

---

## 🛡️ License

Developed for the Smart India Hackathon (SIH). Distributed under the MIT License.
