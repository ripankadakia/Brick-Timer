# Interval Timer App - Design Guidelines

## Design Approach

**Selected Framework:** Apple Human Interface Guidelines
**Justification:** This utility-focused fitness tracking app requires clarity, precision, and native iOS feel. Apple HIG provides the optimal balance of functionality and elegance for timer interfaces and data visualization.

**Core Design Principles:**
- Clarity over decoration: Information hierarchy drives every decision
- Direct manipulation: Touch targets and gestures feel immediate and responsive
- Content-focused: Data and timers are the heroes, chrome is minimal
- Spatial consistency: Predictable layouts reduce cognitive load during workouts

---

## Typography System

**Font Family:** SF Pro (system font via -apple-system, BlinkMacSystemFont)

**Hierarchy:**
- Large Title: 34px/semibold - Screen headers
- Title 1: 28px/bold - Active timer display numbers
- Title 2: 22px/semibold - Section names during workout
- Title 3: 20px/semibold - Card headers, segment names
- Headline: 17px/semibold - List items, buttons
- Body: 17px/regular - Descriptions, secondary info
- Callout: 16px/regular - Metadata, timestamps
- Subheadline: 15px/regular - Supporting text
- Caption 1: 12px/regular - Tiny labels, chart axes

**Number Display (Timer):** Tabular numbers, monospace variant for consistent width during counting

---

## Layout System

**Spacing Units:** Tailwind scale focused on 2, 4, 6, 8, 12, 16, 20, 24 units

**Container Strategy:**
- Edge-to-edge cards with rounded corners (16px radius)
- Safe area insets respected (padding matches iOS notch/home indicator)
- Full-width sections separated by 6-8 units vertical spacing
- Horizontal padding: 4 units on mobile, maintains breathing room

**Grid System:**
- Single column primary layout
- 2-column grids for segment statistics
- 3-column layout for historical workout summaries (date/time/duration)

---

## Component Library

### Active Timer Screen
**Layout:** Full-screen immersive view
- Top third: Current segment name (Title 2) + elapsed time (Title 1, 72px monospace)
- Middle: Progress ring or linear progress showing segment completion
- Lower third: Upcoming segments queue (compact list, Callout size)
- Bottom: Large "Complete Section" button spanning width minus 8 units padding
- Persistent total workout time in top-right corner (Caption, always visible)

### Workout Configuration Screen
**Layout:** Scrollable form interface
- Header with "New Workout" title and save action
- Segment list with reorderable cards:
  - Each card: segment name input + duration estimate (optional reference)
  - Drag handle on left, delete action on right
  - Cards have 4 unit padding, 2 unit gap between
- Floating "Add Segment" button at bottom
- "Start Workout" primary action when 2+ segments configured

### History/Log Screen
**Layout:** List-based navigation
- Grouped by date with section headers (Today, Yesterday, This Week, etc.)
- Each workout card shows:
  - Total duration (Title 3)
  - Segment count badge
  - Date/time stamp (Callout)
  - Tap to expand inline showing segment breakdown
- Pull-to-refresh gesture supported
- Empty state: Illustration + "Start your first workout" CTA

### Trends/Analytics Screen
**Layout:** Dashboard approach
- Segment selector dropdown at top (filters view)
- Primary metric card: Average time for selected segment (Title 1 number display)
- Line chart showing performance over time (full width, 240px height)
- Statistics grid (2-column):
  - Best time
  - Recent performance (last 5 workouts average)
  - Total completions
  - Improvement percentage
- Historical detail list below charts

### Navigation
**Bottom Tab Bar (iOS standard):**
- Timer (home icon)
- History (clock icon)
- Analytics (chart icon)
- Settings (gear icon)
- Tab bar height: 80px (accommodates home indicator)
- Icons: 24px, labels in Caption size

### Forms & Inputs
**Text Inputs:**
- Height: 44px minimum (iOS touch target)
- Rounded corners: 8px
- Border width: 1px
- Padding: 3 units horizontal
- Focus state: 2px border, no shadow

**Buttons:**
- Primary: Full rounded (pill shape), height 50px, Title 2 text
- Secondary: Outlined style, same dimensions
- Destructive: Red treatment for delete actions
- Touch target minimum: 44x44px always

**Switches/Toggles:**
- iOS native switch component
- Placed at right edge of list items
- 51x31px standard size

### Cards & Containers
**Workout Cards:**
- Rounded: 12px
- Padding: 4 units all sides
- Shadow: Subtle elevation (0 2px 8px rgba(0,0,0,0.08))
- Dividers between segments: 1px, 80% opacity

**Stat Cards (Analytics):**
- Rounded: 16px
- Padding: 6 units
- Prominent number display (Title 1)
- Label below (Subheadline)

### Data Visualization
**Charts (for trends):**
- Line charts with smooth curves
- Grid lines: 20% opacity
- Data points: 6px circles
- Axis labels: Caption size
- Full-width, height adapts to content (240-320px range)
- Responsive touch interactions for data point details

### Feedback & States
**Loading:**
- Native iOS spinner (ActivityIndicator)
- Centered in content area
- 20px size for inline, 36px for full screen

**Empty States:**
- Icon/illustration: 120px centered
- Headline + body text below
- Primary CTA button

**Toast Notifications:**
- Slide from top, auto-dismiss (3 seconds)
- Rounded: 12px
- Padding: 4 units
- Position: 2 units from top edge

---

## Animations

**Timing Functions:** iOS standard ease-in-out curves

**Use Cases (sparingly):**
- Timer number increment: Smooth counting animation
- Segment completion: Brief scale pulse (1.0 → 1.05 → 1.0) on Complete button press
- Screen transitions: Standard push/pop navigation (system default)
- Progress indicators: Smooth circular or linear fill

**Forbidden:**
- Gratuitous micro-interactions
- Parallax scrolling effects
- Hover states (touch interface)

---

## Accessibility

**Touch Targets:** 44x44px minimum everywhere
**Contrast:** Maintain 4.5:1 ratio for all text
**VoiceOver:** All interactive elements labeled
**Dynamic Type:** Supports iOS text size preferences
**Reduce Motion:** Respects system preference, disables non-essential animations

---

## Images

**Not Required:** This is a data and functionality-focused app. No hero images or decorative photography needed. All visual interest comes from typography, data visualization, and clean layout execution.