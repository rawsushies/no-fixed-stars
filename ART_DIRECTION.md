# ART DIRECTION BIBLE — NO FIXED STARS

## 1. Visual Identity & Core Premise
**NO FIXED STARS** (*"A star should not move when you move."*) is an illustrated 2D cosmic horror exploration and astrometric puzzle adventure set on October 28, 1926 at **Nadir Observatory** (Elevation 4,120 m).

### Compositional Law: The 75% Sky Ratio
- The night sky is the primary character of the game. Across both exterior exploration stations (**West Observation Deck** and **East Cliffside Pier**), the sky occupies **72–78%** of the vertical composition, while the painted observatory architecture, mountain ridges, and stone walkway occupy the lower **22–28%**.
- The playable astronomer, **Dr. E. Vance**, stands approximately **6–8%** of the viewport height—small and solitary beneath an incomprehensibly vast firmament, yet immediately readable thanks to his warm amber brass lantern halo (`#d4a359`) against the cold midnight stone (`#070d1c`).

---

## 2. Color Palette & Atmospheric Progression

| Token / Role | Hex Code | Usage |
| :--- | :--- | :--- |
| **Abyssal Zenith** | `#03060e` | Uppermost deep-space sky stop |
| **Nocturnal Indigo** | `#070d1c` | Primary sky body & dark granite shadow tone |
| **Moonlit Slate** | `#162338` | Horizon atmospheric mist & distant mountain rim |
| **Tarnished Brass / Lantern Amber** | `#d4a359` | Instrument bezels, Chart Room window glow, Dr. Vance's hand lantern |
| **Illuminated Parchment** | `#f3e5ab` | Starlight highlights, primary display typography, focused reticle |
| **Anomaly Violet** | `#b388eb` | Reserved strictly for **Object Nadir-IX** and Stage III–IV distortion |
| **Supernatural Verdigris** | `#82d2b9` | Reserved strictly for Stage IV cloud-parting aperture rings |

---

## 3. 12-Layer Scene Compositing Order (`LivingSkyCanvas.tsx`)

Every frame of the exterior world is constructed from 12 independent depth planes that respond to Dr. Vance's position and camera panning:

1. **Layer 1 — Painted Sky Foundation**: Seamless deep-space painting (`painted_sky_nebula_1793506262807.jpg`), cross-fading with the non-Euclidean revelation painting (`cosmic_revelation_sky_1793506266973.jpg`) as `CosmicStage` progresses from `1` to `4`.
2. **Layer 2 — Nebula Formations**: Slowly drifting gouache dust veils and radial atmospheric washes.
3. **Layer 3 — Multi-Plane Starfield & Catalog Stars**: 420 background stars across 3 parallax depths with unsynchronized scintillation, plus the 8 interactive `CATALOG_STARS`. In Stages 2–3, `NADIR_IX` exhibits inverted parallax; in Stage 4, `NADIR_IX` locks dead-still in the viewport while the entire universe shifts around it.
4. **Layer 4 — Distant High-Altitude Clouds**: Slow organic nocturnal cloud bands drifting across the lower constellations.
5. **Layer 5 — Distant Mountain Silhouettes**: Far alpine peaks with pale moonlight rim highlights.
6. **Layer 6 — Middle Mountain Ridges**: Mid-plane granite crags separating the plateau from the valley floor.
7. **Layer 7 — Foreground Mountain & Valley Mist**: Rising cold mountain fog blending the horizon into the painted plateau.
8. **Layer 8 — Painted Observatory Architecture**: High-resolution painted environment (`master_nadir_observatory_1793506260866.jpg` on the West Deck; `east_cliffside_pier_1793506265480.jpg` on the East Pier) blended into the lower scene with atmospheric luminance masking so the painted copper dome, stone masonry, and brass telescopes sit naturally beneath the live animated sky.
9. **Layer 9 — Walkable Stone Terrace & Ridge Path**: Textured granite flagstone deck with subtle perspective guides where Dr. E. Vance walks.
10. **Layer 10 — Interactive World Props & Proximity Beacons**: In-world astronomical instruments (West Pier Refractor, Meridian Plumb-Line Pillar, Chart Room Door, East Ridge Walkway, East Transit Instrument, Baseline Theodolite) with diegetic brass markers and `[E]` proximity prompts when Dr. Vance approaches.
11. **Layer 11 — Playable Protagonist (Dr. E. Vance)**: Chroma-keyed painterly sprite sheet (`dr_vance_character_sheet_1793506265433.jpg`) featuring idle breathing, lantern-raising inspection, and a 5-frame walking cycle with a dynamic warm lantern light pool cast onto the stone underfoot.
12. **Layer 12 — Dynamic Celestial Effects & High-Altitude Frost**: Floating mountain frost particles and Stage IV ocular aperture rings.
