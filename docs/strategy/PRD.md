# Project Blueprint: PokéTeam Strategist

**Status**: Active / Blueprint Approved
**Stack**: Laravel + Inertia.js + React
**Timeline**: 6-Hour Implementation

---

## 1. Concept & Vision
A single-page dashboard where a user builds a team of 6 Pokémon. The app acts as a **"Consultant,"** highlighting critical vulnerabilities (e.g., "Your team is 4x weak to Stealth Rock!") and suggesting defensive coverage.

## 2. Technical Architecture

### 2.1 The Backend (Laravel Engine)
Instead of the frontend making multiple slow requests to PokéAPI, Laravel acts as a high-performance wrapper.
- **Controller**: `TeamAnalysisController.php`
- **Logic**:
    - Receive 6 names/IDs from React via Inertia.
    - Use `Http::pool()` to fetch datasets concurrently.
    - **Caching**: Cache PokéAPI responses locally to avoid redundant external hits.
    - **Type Engine**: `TypeHelper.php` class containing a hardcoded 18x18 type matrix.
    - **Algorithm**: Sum up weaknesses, calculate "Net Damage," and return a single "Strategy Object."

### 2.2 The Frontend (React Dashboard)
- **Framework**: React + Inertia.js (via Laravel Breeze).
- **Layout**: Clean 3x2 grid for the team.
- **Components**:
    - **Slot System**: 6 cards with silhouettes (Empty States).
    - **Search**: Integrated search/dropdown for 649+ Pokémon.
    - **Visuals**: Gen 5 animated GIFs for the active team.
    - **Report Card**: A sidebar or bottom section that updates dynamically with "Strategy Object" data.

## 3. Functional Requirements (MVP)
- **Real-time Consultant**: Flag "Major Threats" (e.g., "3 members weak to Ice, only 1 resists").
- **Stat Analysis**: Return average team stats (e.g., "Average Speed is 95").
- **Type Badges**: Pill-shaped components for type visualization.
- **Team Saving**: Optional database table `teams` (id, user_id, name, pokemon_ids JSON).

## 4. Database Schema
- **Table**: `teams`
- **Columns**: `id`, `user_id`, `name`, `pokemon_ids` (JSON array).

---

## 5. 6-Hour Implementation Roadmap

### Hour 1: The Foundation
- Install Laravel Breeze (Inertia/React).
- Create `TypeHelper.php` for type advantage logic.

### Hour 2: The API Wrapper
- Create POST route `/analyze-team`.
- Implement `Http::pool()` with Local Caching for PokéAPI data.

### Hour 3: The Logic Algorithm
- Implement the "Team Score" calculation.
- Identify "Top 3 Threats" based on net defensive scores.

### Hour 4: The React Layout
- Build the 3x2 Grid and "Silhouette" empty states.
- Implement the Search/Selection logic.

### Hour 5: Connecting the Dots
- Connect React to Backend via `@inertiajs/react` `useForm`.
- Dynamic "Report Card" updates.

### Hour 6: Polish & Aesthetics
- Integrate Gen 5 Animated GIFs.
- Add "Type Badge" components and "Wow Factor" styling.

