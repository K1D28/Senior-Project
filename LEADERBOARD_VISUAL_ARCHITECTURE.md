# Leaderboard Redesign - Visual Architecture

## Complete Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC LEADERBOARD v2.0                              │
└─────────────────────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║  ┌──────────────────────┐    ┌──────────────────────────────────────────┐  ║
║  │   LEFT SIDEBAR       │    │      MAIN CONTENT AREA                   │  ║
║  │   (264px Fixed)      │    │      (Flexible Width)                    │  ║
║  │                      │    │                                          │  ║
║  ├──────────────────────┤    │  ┌──────────────────────────────────────┐│  ║
║  │  LOGO SECTION        │    │  │  HEADER                              ││  ║
║  │  ┌────────────────┐  │    │  │  ┌──┐  🔙 Back                       ││  ║
║  │  │                │  │    │  │  │  │                                ││  ║
║  │  │  ☕  (SVG)      │  │    │  │  └──┘                                ││  ║
║  │  │   Coffee Cup   │  │    │  │  ☝️  Trophy Icon (32px)              ││  ║
║  │  │   Logo         │  │    │  │  "Official Results" (3xl, bold)      ││  ║
║  │  │                │  │    │  │                                       ││  ║
║  │  └────────────────┘  │    │  └──────────────────────────────────────┘│  ║
║  │  "Cupping Lab"       │    │                                          │  ║
║  │  "Coffee Quality"    │    │  "Golden Bean Championship 2024"         │  ║
║  │                      │    │                                          │  ║
║  ├──────────────────────┤    │  ┌──────────────────────────────────────┐│  ║
║  │  NAVIGATION MENU     │    │  │  RANKING #1                          ││  ║
║  │                      │    │  │  ┌──────────────────────────────┐    ││  ║
║  │  ┌────────────────┐  │    │  │  │ [🏆] "Farm Name"    85.50   │    ││  ║
║  │  │ ☕ Cup Samples │  │    │  │  │       Farmer | Region       │    ││  ║
║  │  │ (Gray/Hover)   │  │    │  │  │       Variety - Method      │    ││  ║
║  │  └────────────────┘  │    │  │  └──────────────────────────────┘    ││  ║
║  │                      │    │  └──────────────────────────────────────┘│  ║
║  │  ┌────────────────┐  │    │                                          │  ║
║  │  │ 🏆 Leaderboard │  │    │  ┌──────────────────────────────────────┐│  ║
║  │  │ (BLUE/ACTIVE)  │  │    │  │  RANKING #2                          ││  ║
║  │  │ (Shadow)       │  │    │  │  ┌──────────────────────────────┐    ││  ║
║  │  └────────────────┘  │    │  │  │ [🥈] "Farm Name"    84.20   │    ││  ║
║  │                      │    │  │  │       Farmer | Region       │    ││  ║
║  ├──────────────────────┤    │  │  │       Variety - Method      │    ││  ║
║  │  PROFILE SECTION     │    │  │  └──────────────────────────────┘    ││  ║
║  │                      │    │  └──────────────────────────────────────┘│  ║
║  │  ┌────────────────┐  │    │                                          │  ║
║  │  │ ┌──────────┐   │  │    │  ┌──────────────────────────────────────┐│  ║
║  │  │ │ 👤[J]    │   │  │    │  │  RANKING #3                          ││  ║
║  │  │ │ Gradient │   │  │    │  │  ┌──────────────────────────────┐    ││  ║
║  │  │ │ Amber    │   │  │    │  │  │ [🥉] "Farm Name"    83.10   │    ││  ║
║  │  │ └──────────┘   │  │    │  │  │       Farmer | Region       │    ││  ║
║  │  │ "Q Grader"     │  │    │  │  │       Variety - Method      │    ││  ║
║  │  │ "John Smith"   │  │    │  │  └──────────────────────────────┘    ││  ║
║  │  └────────────────┘  │    │  └──────────────────────────────────────┘│  ║
║  │                      │    │                                          │  ║
║  │  ┌────────────────┐  │    │  ┌──────────────────────────────────────┐│  ║
║  │  │ 🚪 [Logout]    │  │    │  │  RANKING #4+                         ││  ║
║  │  │ Red Button     │  │    │  │  ┌──────────────────────────────┐    ││  ║
║  │  │ hover:darker   │  │    │  │  │ [  ] "Farm Name"    82.00   │    ││  ║
║  │  └────────────────┘  │    │  │  │       Farmer | Region       │    ││  ║
║  │                      │    │  │  │       Variety - Method      │    ││  ║
║  └──────────────────────┘    │  │  └──────────────────────────────┘    ││  ║
║                              │  └──────────────────────────────────────┘│  ║
║                              │                                          │  ║
║                              └──────────────────────────────────────────┘  ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

DIMENSIONS:
├─ Sidebar: 264px (fixed width, w-64)
├─ Main Content: Flexible (flex-1)
├─ Rank Medal: 48px (w-12 h-12)
├─ Avatar: 32px (w-8 h-8)
└─ Overall: Full screen (inset-0, fixed)
```

---

## Component Hierarchy

```
PublicLeaderboard (Main Component)
│
├── <CoffeeCupLogo /> (SVG Logo, 56px)
│   └── Renders: Brown coffee cup with handle
│
├── <style>{transitionStyles}</style> (CSS)
│   └── Fade animations
│
└── <div className="fixed inset-0"> (Main Container)
    │
    └── <div className="flex"> (Layout Container)
        │
        ├── ┌────────────────────────────────┐
        │   │ SIDEBAR (w-64)                 │
        │   ├────────────────────────────────┤
        │   │                                │
        │   ├── LOGO SECTION                 │
        │   │   ├── <CoffeeCupLogo />        │
        │   │   ├── <h1>Cupping Lab</h1>    │
        │   │   └── <p>Coffee Quality</p>   │
        │   │                                │
        │   ├── NAVIGATION MENU               │
        │   │   ├── Cup Samples Button        │
        │   │   │   ├── <Coffee /> icon       │
        │   │   │   └── "Cup Samples" text    │
        │   │   │                             │
        │   │   └── Leaderboard Button        │
        │   │       ├── <Trophy /> icon       │
        │   │       └── "Leaderboard" text    │
        │   │                                │
        │   └── PROFILE SECTION (conditional) │
        │       ├── Profile Card              │
        │       │   ├── Avatar Circle         │
        │       │   ├── "Q Grader" label      │
        │       │   └── User name text        │
        │       │                             │
        │       └── Logout Button (conditional)│
        │           ├── <LogOut /> icon       │
        │           └── "Logout" text         │
        │                                │
        └────────────────────────────────┘
        │
        └── ┌────────────────────────────────────────────┐
            │ MAIN CONTENT (flex-1, overflow-y-auto)    │
            ├────────────────────────────────────────────┤
            │                                            │
            ├── <div className="p-6"> (Padding)        │
            │                                            │
            └── <Card> (Container)                       │
                │                                        │
                ├── HEADER SECTION                       │
                │   ├── Back Button                      │
                │   │   ├── <ChevronLeft /> icon         │
                │   │   └── "Back" text                  │
                │   │                                    │
                │   ├── Title Container                  │
                │   │   ├── <Trophy /> icon (32px)       │
                │   │   └── <h1>Official Results</h1>   │
                │   │                                    │
                │   └── <p>Golden Bean Championship</p>  │
                │                                        │
                ├── CONDITIONAL: Rankings Exist          │
                │   └── <div className="space-y-3">     │
                │       ├── Ranking Item 1               │
                │       │   ├── Rank Circle (#1)         │
                │       │   │   └── 🏆 Gold              │
                │       │   ├── Farm Details             │
                │       │   │   ├── Farm Name            │
                │       │   │   ├── Farmer + Region      │
                │       │   │   └── Variety + Method     │
                │       │   └── Final Score              │
                │       │       └── "85.50"              │
                │       │                                │
                │       ├── Ranking Item 2               │
                │       │   ├── Rank Circle (#2)         │
                │       │   │   └── 🥈 Silver            │
                │       │   ├── Farm Details             │
                │       │   └── Final Score              │
                │       │                                │
                │       ├── Ranking Item 3               │
                │       │   ├── Rank Circle (#3)         │
                │       │   │   └── 🥉 Bronze            │
                │       │   ├── Farm Details             │
                │       │   └── Final Score              │
                │       │                                │
                │       └── [Additional Ranking Items]   │
                │                                        │
                └── CONDITIONAL: No Rankings             │
                    └── <div className="py-12">          │
                        └── "No results" message         │
                                                         │
            └────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
PublicLeaderboard Component
│
├── Props Input:
│   ├── appData.samples
│   │   └── filtered & ranked → rankedSamples (useMemo)
│   │
│   ├── appData.users
│   │   └── farmer lookup for ranking details
│   │
│   ├── currentUser
│   │   └── displays in profile card (if provided)
│   │
│   └── Callbacks:
│       ├── onExit → Back button
│       ├── onLogout → Logout button
│       └── navigate → Cup Samples link
│
├── Processing:
│   ├── Filter: adjudicatedFinalScore > 0
│   ├── Filter: not CALIBRATION sample
│   ├── Filter: farmer only
│   ├── Sort: highest score first
│   └── useMemo prevents unnecessary recalculation
│
└── Rendering:
    ├── Sidebar
    │   ├── Logo (SVG)
    │   ├── Navigation (2 buttons)
    │   └── Profile (if currentUser)
    │
    └── Main Content
        ├── Header (Trophy, title)
        ├── Rankings (mapped from rankedSamples)
        └── Empty state (if no rankings)
```

---

## Style Layers

```
LAYER 1: Container
├── Fixed positioning (inset-0)
├── White background
└── Flex layout

LAYER 2: Sidebar
├── Width: 264px (w-64)
├── White background
├── Right border (gray-100)
├── Shadow: small
└── Scrollable (overflow-y-auto)

LAYER 3: Sections (Sidebar)
├── Logo: border-b, padding-6
├── Nav: flex-col, gap-2, flex-1
├── Profile: border-t, flex-col
└── Spacing: consistent gaps

LAYER 4: Main Content
├── Flex-1 (fills remaining)
├── Gradient background
├── Overflow-y-auto (scrollable)
└── Padding: p-6

LAYER 5: Card
├── White background
├── Border: gray-200
├── Border radius
├── Shadow: md
└── Padding: varies

LAYER 6: Typography
├── Headings: bold, large
├── Labels: small, medium
├── Body: regular, small
└── Monospace: for codes

LAYER 7: Colors
├── Primary: blue (#primary)
├── Gray: #f3f4f6 to #1f2937
├── Gold: #fbbf24 (rank 1)
├── Silver: #d1d5db (rank 2)
├── Bronze: #d97706 (rank 3)
├── Red: #ef4444 (logout)
└── Gradients: blue-50 to indigo-50
```

---

## Responsive Behavior

```
DESKTOP (1200px+)
┌──────┬──────────────────────────────┐
│ 264px│        Flexible              │
│      │ Good ratio, optimal layout   │
└──────┴──────────────────────────────┘

TABLET (768px - 1200px)
┌──────┬──────────────────┐
│ 264px│   Compact        │
│      │ All visible      │
└──────┴──────────────────┘

MOBILE (< 768px)
┌──────┬──────────┐
│ 264px│ Narrow   │
│      │ Scroll   │
└──────┴──────────┘
Note: Consider collapsible sidebar for future
```

---

## Color Scheme

```
PRIMARY COLORS:
├── Blue (#primary): Headers, active states, buttons
├── White: Backgrounds
├── Gray-100: Borders
└── Gray-900: Text

ACCENT COLORS:
├── Gold (#fbbf24): Rank 1 medal
├── Silver (#d1d5db): Rank 2 medal
├── Bronze (#b45309): Rank 3 medal
└── Red (#ef4444): Logout button

INTERACTIVE COLORS:
├── Hover state: Enhanced shadow
├── Active state: Primary color + white
├── Disabled: opacity-50
└── Transitions: 200ms ease

GRADIENTS:
├── Sidebar profile: from-blue-50 to-indigo-50
├── Avatar: from-amber-500 to-amber-600
└── Main content: from-white via-white to-blue-50/30
```

---

## Interaction States

```
NAVIGATION BUTTONS:
├── Inactive (Cup Samples)
│   ├── Background: transparent
│   ├── Text: gray-700
│   ├── Hover: bg-gray-100
│   └── Cursor: pointer
│
└── Active (Leaderboard)
    ├── Background: #primary (blue)
    ├── Text: white
    ├── Shadow: md
    └── Cursor: default

RANKING ITEMS:
├── Normal
│   ├── Border: gray-200
│   ├── Shadow: sm
│   └── Cursor: pointer
│
└── Hover
    ├── Border: gray-200 (same)
    ├── Shadow: md (enhanced)
    └── Cursor: pointer

LOGOUT BUTTON:
├── Normal
│   ├── Background: red-500
│   ├── Text: white
│   └── Shadow: none
│
└── Hover
    ├── Background: red-600 (darker)
    ├── Text: white
    └── Shadow: none

BACK BUTTON:
├── Normal
│   ├── Background: gray-100
│   ├── Text: gray-700
│   └── Shadow: none
│
└── Hover
    ├── Background: gray-200
    ├── Text: gray-700
    └── Shadow: none
```

---

## Animation Specifications

```
FADE IN (Main content)
├── Duration: 400ms (0.4s)
├── Easing: ease-in-out
├── From: opacity 0, translateY 4px
├── To: opacity 1, translateY 0
└── Applied to: Card content

TRANSITIONS (All interactive)
├── Property: all
├── Duration: 200ms (0.2s)
├── Timing: ease
└── Applied to: buttons, rankings

HOVER SHADOW
├── Normal: shadow-sm
├── Hover: shadow-md
├── Transition: smooth
└── Duration: 200ms
```

---

## Accessibility Features

```
SEMANTIC HTML:
├── <nav> for navigation
├── <button> for actions
├── <h1>, <p> for text
└── Proper nesting

ARIA ATTRIBUTES:
├── Labels for buttons
├── Icon descriptions
├── Role hints if needed
└── Focus indicators

KEYBOARD NAVIGATION:
├── Tab order: logical
├── Focus visible: yes
├── Enter: activates buttons
└── Escape: could close modals

COLOR CONTRAST:
├── Text on white: sufficient
├── Text on blue: sufficient
├── Text on red: sufficient
└── WCAG AA: compliant
```

---

**Visual Architecture Complete** ✅

This comprehensive visual guide shows every element, its positioning, colors, interactions, and responsive behavior of the redesigned Public Leaderboard component.
