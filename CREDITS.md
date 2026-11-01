# CREDITS & ATTRIBUTIONS — NO FIXED STARS

## Original Art Direction, Code & Sound Design
- **Game Direction, Astrometric Puzzle Design & Frontend Engineering**: Built for *NO FIXED STARS* (Master Milestone 02 — *The Living World*).
- **Original Painted Environmental & Character Artwork**: Generated specifically for *NO FIXED STARS* via `gemini-3.1-flash-image-preview` and composited into the 12-layer `LivingSkyCanvas` engine:
  - `master_nadir_observatory_1793506260866.jpg` — Master exterior painting of Nadir Observatory (West Deck, copper dome, brass equatorial refractor, mountain plateau).
  - `painted_sky_nebula_1793506262807.jpg` — Seamless deep-space nocturnal sky and Cygnus dust rift painting.
  - `east_cliffside_pier_1793506265480.jpg` — East Cliffside Baseline Pier (+250 m) painting with brass transit instrument and distant West Dome beacon.
  - `dr_vance_character_sheet_1793506265433.jpg` — Dr. E. Vance 1926 astronomer character sprite sheet (idle, lantern-holding, inspecting, and 5-frame side-profile walking cycle).
  - `cosmic_revelation_sky_1793506266973.jpg` — Stage IV Cosmic Revelation painted sky with pale verdigris cloud rift and non-Euclidean celestial rings.
  - `chart_room_desk_1793502243466.jpg` — Astrometric Chart Room drafting table and stone arch window painting.
  - `plate_1894_eclipse_1793502240047.jpg` — 1894 dry-gelatin silver negative archival plate (#1894-B).
  - `plate_1924_vane_1793502242444.jpg` — 1924 long-exposure warped star-trail glass plate (#1924-X).

## Historical & Public Domain Astronomical References
- **Johann Elert Bode**, *Uranographia* (Berlin, 1801) — Public Domain (via Wikimedia Commons). Used for authentic 19th/early-20th-century star catalog coordinates in Cygnus and Lacerta.
- **Alexander Jamieson**, *A Celestial Atlas* Plate 11: *Cygnus, Vulpecula et Anser, Lacerta* (London, 1822) — Public Domain (via Wikimedia Commons). Used as cartographic reference for the Blink Comparator overlay in the Chart Room.
- **Friedrich Wilhelm Bessel**, *Bestimmung der Entfernung des 61sten Sterns des Schwans* (*Astronomische Nachrichten*, 1838) — Historical scientific basis for the 61 Cygni heliocentric parallax lore note (`DOC_VANE_NOTE_1`).

## Audio Engine
- Synthesized in real time via the browser's native **Web Audio API** (`src/game/soundEngine.ts`):
  - High-altitude mountain plateau wind (bandpass-filtered brown noise with slow LFO gust modulation).
  - Cosmic Stage harmonic drone (Stage I pure fifth `73.42 Hz / 110.0 Hz` → Stage II suspended fourth → Stage III tritone beating → Stage IV sub-audible abyssal dissonance `55.0 Hz / 58.27 Hz`).
  - Crunching stone/gravel footsteps synchronized to Dr. E. Vance's walking animation frames.
  - Mechanical brass vernier clicks, leaf-shutter clacks, glass plate harmonic chimes, and cosmic revelation bass stings.
