# ASSET MANIFEST — NO FIXED STARS (Master Milestone 02)

This manifest documents every visual, character, historical plate, and cinematic asset created, researched, and integrated into **NO FIXED STARS**.

## 1. Local Generated Painterly Assets (`/src/assets/images/`)

| Asset ID | Local File Path | Resolution / Aspect | Generation Method | Target Scene / Layer | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `master_nadir_observatory` | `/src/assets/images/master_nadir_observatory_1793506260866.jpg` | `16:9` HD | `generate_image` (`gemini-3.1-flash-image-preview`) | Layer 5–9: Nadir Observatory West Deck, Copper Dome, Brass Refractor, Stone Walkway & Mountains | **Integrated** (`LivingSkyCanvas.tsx`, `CinematicDirectorModal.tsx`) |
| `painted_sky_nebula` | `/src/assets/images/painted_sky_nebula_1793506262807.jpg` | `16:9` HD | `generate_image` (`gemini-3.1-flash-image-preview`) | Layer 1–2: Seamless Gouache Deep-Space Night Sky & Cygnus Dust Rift | **Integrated** (`LivingSkyCanvas.tsx`, `CinematicDirectorModal.tsx`) |
| `east_cliffside_pier` | `/src/assets/images/east_cliffside_pier_1793506265480.jpg` | `16:9` HD | `generate_image` (`gemini-3.1-flash-image-preview`) | Layer 5–9: East Cliffside Baseline Pier (+250 m), Transit Instrument, Iron Railing & Distant West Dome | **Integrated** (`LivingSkyCanvas.tsx`, `CinematicDirectorModal.tsx`) |
| `dr_vance_character_sheet` | `/src/assets/images/dr_vance_character_sheet_1793506265433.jpg` | `1:1` HD Sprite Atlas | `generate_image` (`gemini-3.1-flash-image-preview`) + Offscreen Canvas Alpha Chroma-Keying | Layer 11: Playable Protagonist Dr. E. Vance (4 Idle/Lantern/Interact frames + 5-frame Walk Cycle) | **Integrated** (`LivingSkyCanvas.tsx`) |
| `cosmic_revelation_sky` | `/src/assets/images/cosmic_revelation_sky_1793506266973.jpg` | `16:9` HD | `generate_image` (`gemini-3.1-flash-image-preview`) | Layer 1–4 & 12: Stage IV Cosmic Revelation Non-Euclidean Double-Ringed Sky & Verdigris Cloud Rift | **Integrated** (`LivingSkyCanvas.tsx`, `CinematicDirectorModal.tsx`) |
| `chart_room_desk` | `/src/assets/images/chart_room_desk_1793502243466.jpg` | `16:9` HD | `generate_image` (`gemini-3.1-flash-image-preview`) | Chart Room Interior Drafting Table, Blink Comparator, Brass Verniers & Stone Arch Window | **Integrated** (`ChartRoomView.tsx`, `CinematicDirectorModal.tsx`) |
| `plate_1894_eclipse` | `/src/assets/images/plate_1894_eclipse_1793502240047.jpg` | `1:1` HD | `generate_image` (`gemini-3.1-flash-image-preview`) | Archival Glass Plate #1894-B (Founding Survey Concentric Double-Ring Anomaly) | **Integrated** (`FieldJournalModal.tsx`) |
| `plate_1924_vane` | `/src/assets/images/plate_1924_vane_1793502242444.jpg` | `1:1` HD | `generate_image` (`gemini-3.1-flash-image-preview`) | Archival Glass Plate #1924-X (Director Vane's 6-Hour Occultation Star-Trail Plate) | **Integrated** (`FieldJournalModal.tsx`) |

---

## 2. Cinematic & Video Sequences (`CinematicDirectorModal.tsx`)

> **Technical Note on Runtime Video Generation**: The container build environment provides `generate_image` (`gemini-3.1-flash-image-preview`) for local raster asset generation; `gemini-omni-1.1-flash` MP4 file generation is not exposed as a build-time tool in this workspace. To deliver authentic, zero-stutter cinematic sequences with full poster fallbacks and skippable playback, **NO FIXED STARS** implements a dedicated multi-plane pan-and-scan **Cinematic Director Engine** (`CinematicDirectorModal.tsx`) over the high-resolution painted plates with live atmospheric particle/cloud layers and synchronized Web Audio sound design:

| Sequence ID | Category | Painted Source Plates | Trigger Condition | Skippable |
| :--- | :--- | :--- | :--- | :--- |
| `PROLOGUE_1926` | `opening` | `painted_sky_nebula`, `master_nadir_observatory`, `east_cliffside_pier`, `chart_room_desk` | Clicking **Begin Observation** on Title Screen (or replaying from Journal/Title) | Yes (`[Esc]` / `[Space]` / Skip Button) |
| `ANOMALY_STAGE_2` | `anomalies` | `painted_sky_nebula`, `master_nadir_observatory` | Recording first photographic plate of **Object Nadir-IX** (`Stage II`) | Yes |
| `ANOMALY_STAGE_3` | `anomalies` | `east_cliffside_pier`, `cosmic_revelation_sky` | Recording both West & East baseline plates of **Object Nadir-IX** (`Stage III`) | Yes |
| `REVELATION_STAGE_4` | `revelations` | `chart_room_desk`, `cosmic_revelation_sky`, `master_nadir_observatory` | Solving the Negative Parallax Triangulation in the Chart Room (`Stage IV`) | Yes |

---

## 3. Online Public-Domain & CC0 Astronomical References Audited

| Source / Archive | Work / Asset Title | Author / Year | License | Usage in Project |
| :--- | :--- | :--- | :--- | :--- |
| Wikimedia Commons | *Uranographia: Cygnus Plate* | Johann Elert Bode (1801) | Public Domain | Historical reference for Cygnus-Lacerta Sector IV right ascension / declination grid and star designations (`Deneb`, `Sadr`, `Fawaris`, `Gienah`, `61 Cygni`). |
| Wikimedia Commons | *A Celestial Atlas: Plate 11 (Cygnus, Vulpecula, Lacerta)* | Alexander Jamieson (1822) | Public Domain | Reference for 19th-century engraved astrometric chart typography and sightline geometry in `ChartRoomView.tsx`. |
| OpenGameArt.org | *Seamless Starfield & Night Sky Layers* | Public Domain / CC0 Contributors | CC0 1.0 | Compositional reference for multi-plane parallax wrap ratios and nocturnal horizon haze stops. |
