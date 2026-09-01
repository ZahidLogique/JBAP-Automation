# JBAP CDMS - E2E Regression Automation

E2E regression test suite for **JBAP CDMS (Car Dealer Management System)** backoffice using Playwright.

## Tech Stack

- **Playwright Test** v1.62 — browser automation & test runner
- **Playwright CLI** v0.1.17 — interactive browser exploration
- **TypeScript** v7
- **Allure** — test reporting
- **dotenv** — environment config

## Project Structure

```
JBAP/
├── .env.example              # Environment variables template
├── .playwright/
│   └── cli.config.json       # Playwright CLI config (headed, httpCredentials)
├── playwright.config.ts      # Playwright Test config (projects, reporters)
├── global-setup.ts           # Clean screenshots, allure-results & test state before run
├── tsconfig.json
├── package.json
│
├── utils/                    # Shared helper functions
│   ├── select2.ts            # Select2 searchable dropdown handler
│   └── dropdown.ts           # Dependent dropdowns (Make→Model→Variant), date pickers, start price
│
├── fixtures/                 # Test data & shared state
│   ├── car-data.ts           # Random car data generator, edit data constants
│   └── test-state.ts         # Cross-file shared state (VCN/VID) via JSON file
│
├── pages/backoffice/         # Page Object Model
│   ├── LoginPage.ts          # CDMS login (username, password, captcha skip)
│   ├── CarListPage.ts        # Car list: search, filter, pagination, actions
│   ├── CarDetailPage.ts      # Car detail: field labels, edit/back buttons
│   └── CarFormPage.ts        # Car form (add/edit): fill fields, dropdowns, submit
│
├── tests/
│   ├── setup/
│   │   └── backoffice.setup.ts   # Auth setup → saves .auth/backoffice.json
│   └── backoffice/cars/          # Spec files run sequentially (01→05)
│       ├── 01-car-list.spec.ts       # CL-001, CL-002, CL-007
│       ├── 02-add-car.spec.ts        # CA-001 to CA-006 (creates car, verifies in list)
│       ├── 03-car-detail.spec.ts     # CD-001 to CD-004 (uses created car)
│       ├── 04-edit-car.spec.ts       # CE-001 to CE-006 (uses created car)
│       └── 05-change-history.spec.ts # CH-001, CH-002, CH-004
│
├── allure-results/           # Generated test results (gitignored)
├── test-results/             # Playwright output (gitignored)
└── .auth/                    # Stored auth state (gitignored)
```

## Authentication

CDMS has **2-layer authentication**:

1. **HTTP Basic Auth** — handled by `httpCredentials` in Playwright config
2. **CDMS Form Login** — username + password (CAPTCHA not validated on staging, skipped)

Auth flow runs once via `backoffice.setup.ts`, saves session to `.auth/backoffice.json`, reused by all tests.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install browsers
npx playwright install chromium

# 3. Copy env file and fill credentials
cp .env.example .env
```

### Environment Variables (.env)

| Variable | Description |
|----------|-------------|
| `BACKOFFICE_URL` | CDMS login page URL |
| `BASIC_AUTH_USER` | HTTP Basic Auth username |
| `BASIC_AUTH_PASS` | HTTP Basic Auth password |
| `ADMIN_USER` | CDMS login username |
| `ADMIN_PASS` | CDMS login password |
| `WEB_URL` | Public web URL (for future web tests) |
| `TEST_SEQUENTIAL` | `true` to run tests sequentially |

## Running Tests

```bash
# Run full regression (all car specs, sequential)
npx playwright test --project=backoffice

# Run specific module only
npx playwright test tests/backoffice/cars/02-add-car.spec.ts --project=backoffice

# Run specific test by name
npx playwright test --project=backoffice -g "CA-004"

# View Allure report
npm run report
```

## Regression Test Cases

Tests run **sequentially** across 5 spec files (numbered 01-05). Add Car (02) creates a car with random data and saves VCN/VID to `.test-state.json`. Detail (03) and Edit (04) read that state to test the created car.

| # | ID | Test Case | Section |
|---|------|-----------|---------|
| 1 | CL-001 | Car list page loads correctly | Car List |
| 2 | CL-002 | Filter by keyword | Car List |
| 3 | CL-007 | Pagination works | Car List |
| 4 | CA-001 | Add car form loads correctly | Add Car |
| 5 | CA-002 | VCN is auto-generated | Add Car |
| 6 | CA-003 | Mandatory field validation prevents empty submit | Add Car |
| 7 | CA-004 | Fill and submit add car form | Add Car |
| 8 | CA-006 | Verify created car appears in car list | Add Car |
| 9 | CA-005 | Dependent dropdowns Make > Model > Variant | Add Car |
| 10 | CD-001 | Detail page displays car information | Car Detail |
| 11 | CD-002 | Car grade scores are displayed | Car Detail |
| 12 | CD-003 | Car photos section is visible | Car Detail |
| 13 | CD-004 | Edit car and back buttons work | Car Detail |
| 14 | CE-001 | Edit form loads with existing car data | Edit Car |
| 15 | CE-002 | Edit fields and submit successfully | Edit Car |
| 16 | CE-003 | Required field validation on edit | Edit Car |
| 17 | CE-004 | Cancel edit without saving | Edit Car |
| 18 | CE-006 | Dependent dropdown make to model | Edit Car |
| 19 | CH-001 | Change history modal opens from car list | Change History |
| 20 | CH-002 | History displays change details | Change History |
| 21 | CH-004 | Modal can be closed | Change History |

## Key Technical Notes

### Shared Helpers (`utils/`)
- **`select2.ts`** — `selectSelect2(page, fieldId, searchText)` handles Select2 searchable dropdowns (Location, Seller, Storage/Pool, Year Model)
- **`dropdown.ts`** — `selectMakeModelVariant(page)` handles Make→Model→Variant AJAX chain with jQuery trigger; `setDateField()` and `fillStartPrice()` for special fields

### Test Data (`fixtures/`)
- **`car-data.ts`** — `generateCarData(rnd)` creates random car data per run using `Date.now()` suffix
- **`test-state.ts`** — `saveState()`/`loadState()` shares VCN/VID between spec files via `.test-state.json`

### AJAX Dependent Dropdowns (Make > Model > Variant)
Make selection loads Model options via AJAX. Must trigger jQuery change event manually — Playwright's `selectOption` alone does NOT trigger jQuery events:
```typescript
import { selectMakeModelVariant } from "../../../utils/dropdown";
await selectMakeModelVariant(page, "TOYOTA");
```

### Special Fields
- **Date pickers** — use `setDateField(page, "date_last_registration", "01/01/2025")` (sets via `page.evaluate` with change event)
- **Start Price** — use `fillStartPrice(page, "100000")` (uses `pressSequentially` due to custom JS validation)
- **Random data** — `generateCarData()` creates unique plate, chassis, engine numbers per run

## Playwright CLI (Interactive Exploration)

Playwright CLI is used to manually explore the CDMS site in a browser with authentication pre-configured.

### CLI Config (`.playwright/cli.config.json`)
```json
{
  "browser": "chrome",
  "headed": true,
  "viewport": { "width": 1920, "height": 1080 },
  "httpCredentials": {
    "username": "...",
    "password": "..."
  }
}
```

### Usage
```bash
# Open browser with CLI for exploration
npx playwright cli open https://cdms-staging.jbap.com.ph/wp-admin/car/add-car

# Record actions
npx playwright cli codegen https://cdms-staging.jbap.com.ph
```

The CLI config handles HTTP Basic Auth automatically so you don't need to enter credentials in the browser dialog. Use this to:
- Explore page structure and field IDs
- Test selectors before writing them in code
- Inspect Select2 dropdowns, AJAX behavior, form validation
- Debug failing tests by replaying steps manually

## Reporters

Configured in `playwright.config.ts`:
- **list** — console output
- **html** — `playwright-report/` (run `npx playwright show-report`)
- **json** — `test-results.json`
- **allure** — `allure-results/` (run `npm run report`)
