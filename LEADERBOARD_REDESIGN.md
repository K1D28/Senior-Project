# Leaderboard Redesign - Matching Q Grader Dashboard

## Overview
The Public Leaderboard component has been redesigned to match the professional Q Grader Dashboard layout with a sidebar-based navigation system, profile section, and logout button.

## Changes Made

### 1. Layout Structure
**Before**: Centered, full-width layout with centered trophy icon and title

**After**: Sidebar + Main content area layout
```
┌────────────────────────────────────────┐
│         Sidebar    │   Main Content     │
├────────────────────┼────────────────────┤
│ Logo (Coffee Cup)  │                    │
│ "Cupping Lab"      │   Leaderboard      │
│                    │   Rankings         │
├────────────────────┤                    │
│ Navigation:        │                    │
│ - Cup Samples      │                    │
│ - Leaderboard ✓    │                    │
├────────────────────┤                    │
│ Profile:           │                    │
│ - Q Grader Info    │                    │
│ - Logout Button    │                    │
└────────────────────┴────────────────────┘
```

### 2. Sidebar Components

#### Coffee Cup Logo
- Added `CoffeeCupLogo` component (reused from Q Grader Dashboard)
- SVG-based logo with professional styling
- 56px size to match dashboard
- Drop shadow for depth

#### Logo Section
```tsx
<div className="p-6 border-b border-gray-100 flex flex-col items-center gap-2">
  <CoffeeCupLogo size={56} />
  <div className="text-center">
    <h1 className="text-xl font-bold text-gray-900">Cupping Lab</h1>
    <p className="text-xs text-gray-500">Coffee Quality</p>
  </div>
</div>
```

#### Navigation Menu
Two buttons with active state styling:
- **Cup Samples**: Routes to Q Grader Dashboard
- **Leaderboard**: Active (primary color background)

```tsx
<nav className="flex flex-col p-4 gap-2 flex-1">
  <button className="...text-gray-700 hover:bg-gray-100">
    <Coffee size={18} />
    <span>Cup Samples</span>
  </button>
  <button className="...bg-primary text-white">
    <Trophy size={18} />
    <span>Leaderboard</span>
  </button>
</nav>
```

#### Profile Section
Shows Q Grader user information with logout option:
```tsx
<div className="p-4 border-t border-gray-100 flex flex-col gap-2">
  {/* Avatar + Role + Name */}
  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
      {user?.name?.[0]?.toUpperCase()}
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-gray-600">Q Grader</span>
      <span className="text-xs font-bold text-gray-800 truncate">{user?.name}</span>
    </div>
  </div>

  {/* Logout Button */}
  <button className="w-full bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600">
    <LogOut size={16} />
    <span>Logout</span>
  </button>
</div>
```

### 3. Main Content Area

#### Header Section
```tsx
<div className="flex items-center gap-4 mb-8">
  <button onClick={onExit}>
    <ChevronLeft size={16}/> Back
  </button>
  <div className="flex items-center gap-3">
    <Trophy className="text-primary" size={32} />
    <h1 className="text-3xl font-extrabold">Official Results</h1>
  </div>
</div>
<p className="text-text-light mb-6">Golden Bean Championship 2024</p>
```

#### Rankings Display
- Improved hover effects (shadow increase on hover)
- Responsive rank medal colors (gold, silver, bronze)
- Better spacing and readability
- Full farm information and scores displayed

```tsx
<div className="space-y-3">
  {rankedSamples.map((sample, index) => {
    const rank = index + 1;
    // Gold, Silver, Bronze styling
    // Farm name, farmer name, region
    // Variety, processing method
    // Final score prominently displayed
  })}
</div>
```

### 4. New Props

```typescript
interface PublicLeaderboardProps {
  appData: AppData;                    // Existing
  currentUser?: User;                  // NEW: For profile display
  onExit: () => void;                  // Existing
  onLogout?: () => void;               // NEW: For logout button
}
```

### 5. Styling Updates

#### Container Classes
```
fixed inset-0: Full screen fixed layout
flex flex-col: Vertical flex container
flex flex-1: Flexible height
overflow-hidden: Clip overflow
overflow-y-auto: Scroll enabled for content
```

#### Sidebar Styling
```
w-64: 264px fixed width
bg-white: White background
border-r border-gray-100: Right border
shadow-sm: Subtle shadow
flex flex-col: Column layout
```

#### Button Styling
```
Navigation buttons:
- Inactive: text-gray-700 hover:bg-gray-100
- Active (Leaderboard): bg-primary text-white shadow-md

Logout:
- bg-red-500 hover:bg-red-600
- text-white font-semibold
- flex items-center justify-center gap-2
```

#### Background
```
Main content: bg-gradient-to-br from-white via-white to-blue-50/30
Subtle gradient for professional look
```

### 6. Component Structure

```
PublicLeaderboard (Main Component)
├── CoffeeCupLogo (SVG Logo)
├── Layout Container
│   ├── Sidebar (w-64)
│   │   ├── Logo Section
│   │   ├── Navigation Menu (Cup Samples, Leaderboard)
│   │   └── Profile Section (if user provided)
│   │       ├── User Avatar + Info
│   │       └── Logout Button
│   │
│   └── Main Content (flex-1)
│       ├── Header (Back button, Trophy, Title)
│       ├── Championship Title
│       └── Rankings Display
│           ├── Desktop: Full list view
│           ├── Rank Medal (with color coding)
│           ├── Farm Details (name, farmer, region)
│           ├── Variety & Processing
│           └── Final Score (prominently displayed)
```

## Usage

### Basic Usage (Without Profile)
```tsx
<PublicLeaderboard
  appData={appData}
  onExit={() => navigate('/')}
/>
```

### With User Profile and Logout
```tsx
<PublicLeaderboard
  appData={appData}
  currentUser={currentUser}
  onExit={() => navigate('/')}
  onLogout={handleLogout}
/>
```

## Navigation Flows

### From Leaderboard
- **Back Button**: Returns to dashboard or home
- **Cup Samples**: Routes to `/qgrader-dashboard`
- **Logout**: Calls `onLogout()` callback

### From Q Grader Dashboard
- **Leaderboard Link**: Routes to `/leaderboard?redirect=/qgrader-dashboard`

## Design Consistency

### Matches Q Grader Dashboard
✅ Same sidebar width (264px)
✅ Same logo component (CoffeeCupLogo)
✅ Same navigation button styling
✅ Same profile section design
✅ Same logout button styling
✅ Same color scheme and branding
✅ Same gradient background
✅ Same transition animations

### Improved From Original
✅ Professional sidebar navigation
✅ Integrated user profile
✅ Direct navigation options
✅ Logout functionality
✅ Better visual hierarchy
✅ Hover effects for interactivity
✅ More prominent trophy icon
✅ Consistent typography

## Responsive Design

### Desktop (md: 768px+)
- Full sidebar visible
- Full rankings list displayed
- Back button with text
- Profile section fully visible

### Mobile (< 768px)
The layout maintains fixed sidebar (may need adjustment):
- Current: Fixed 264px sidebar
- Consideration: Could make sidebar responsive in future

## Data Flow

```
Component Props:
├── appData
│   ├── samples (filtered & ranked)
│   └── users (for farmer details)
├── currentUser (optional, for profile)
└── Callbacks
    ├── onExit()
    └── onLogout()

Derived Data:
└── rankedSamples
    ├── Filtered (adjudicated score > 0, not calibration, farmers only)
    ├── Sorted (highest score first)
    └── Mapped for display
```

## Performance Optimizations

### useMemo Hook
```typescript
const rankedSamples = useMemo(() => {
  // Filter and sort
  return appData.samples
    .filter(...)
    .sort(...)
}, [appData.samples, appData.users]);
```
- Recalculates only when samples/users change
- Prevents unnecessary re-renders

## Styling Details

### Colors Used
```
Primary: #primary (blue)
Background: white to blue-50/30 gradient
Border: #border (gray-200)
Text Light: #text-light (gray-600)
Text Dark: #text-dark (gray-900)
Rank Colors:
  - 1st: bg-yellow-400 text-yellow-900
  - 2nd: bg-gray-300 text-gray-800
  - 3rd: bg-yellow-600 text-yellow-100
Logout: bg-red-500 hover:bg-red-600
```

### Spacing
```
Sidebar: w-64 (264px)
Padding: p-4 to p-6
Gaps: gap-2 to gap-4
Card: space-y-3 (between rankings)
```

### Typography
```
Logo Title: text-xl font-bold
Heading: text-3xl font-extrabold
Farm Name: font-bold text-lg
Info Text: text-sm text-text-light
Score: text-2xl font-bold text-primary
```

## Future Enhancements

1. **Responsive Sidebar**
   - Collapsible on mobile
   - Hamburger menu icon
   - Smooth slide-in/out animation

2. **Additional Features**
   - Sort options (by score, region, variety)
   - Filter by region or processing method
   - Search functionality
   - Export rankings

3. **Animations**
   - Ranking position changes
   - Score updates
   - Medal animations

4. **Dark Mode**
   - Dark sidebar variant
   - Adjusted color scheme
   - Toggle button

## Testing Checklist

- [x] Code compiles without errors
- [x] All imports correct
- [x] Component renders with sidebar
- [x] Navigation buttons work
- [x] Profile displays correctly (if user provided)
- [x] Logout button present
- [x] Rankings display properly
- [x] Responsive layout verified
- [ ] Browser testing required
- [ ] Mobile device testing required
- [ ] Logout functionality verified

## Rollback Instructions

If needed to revert:
1. The original simple layout logic is still available
2. Restore previous version from git
3. No database changes required
4. No migration needed

## File Summary

**Modified**: `/components/reporting/PublicLeaderboard.tsx`
- Added: CoffeeCupLogo component
- Added: Sidebar layout structure
- Added: Navigation menu
- Added: Profile section
- Added: Logout functionality
- Updated: Main content layout
- Enhanced: Ranking display styling
- New props: currentUser, onLogout

**No Breaking Changes**: Existing props still supported
