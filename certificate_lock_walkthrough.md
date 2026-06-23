# Walkthrough: One-Time Certificate Download & Logo Branding

We have successfully integrated the one-time certificate download enforcement and added the Catalyst Smart Classroom branding logo to the certificate template.

## Key Changes Made

### 1. One-Time Download Enforcement (Database-Locked)
- Added `certificate_issued` (boolean) and `certificate_name` (text) to the `registrations` table in [supabase_migration.sql](file:///e:/Websites/smart-classroom/supabase_migration.sql) at the root of the workspace:
  ```sql
  ALTER TABLE registrations 
  ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS certificate_name TEXT;
  ```
- **Security Logic**:
  - Once the user clicks "Download JPG" or "Download PDF", the app immediately writes the custom name and sets `certificate_issued = true` on the database record.
  - The UI immediately updates and permanently displays a locked block (Alert) stating:
    > **Certificate Issued**
    > The certificate has already been issued under the name "Pritom Bhowmik". To ensure security and credential integrity, certificates can only be generated and downloaded once.
  - All download buttons and name inputs are completely removed/hidden once issued.

### 2. Catalyst Smart Classroom Logo Branding
- Integrated your custom branding logo `/iconi.png` directly into the certificate template header.
- Placed next to the "CATALYST SMART CLASSROOM" title, replacing the placeholder trophy icon with the official platform icon.

---

## Visual Verification

Below is the verified screenshot of the dashboard certificate panel in its locked state after the initial download:

![Locked Certificate Panel](file:///C:/Users/User/.gemini/antigravity/brain/2285a911-910e-4059-b797-30b99aa4d4f7/locked_certificate_panel_1782181806084.png)
