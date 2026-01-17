# Quick Reference: Using Theme Colors

## Common Pattern Replacements

### Backgrounds
```tsx
// ❌ Before
className="bg-white"
className="bg-gray-100"
className="bg-gray-50"
className="bg-pink-50"
className="bg-[#f6f2ff]"

// ✅ After
className="bg-card"
className="bg-muted"
className="bg-accent/30"
className="bg-accent"
className="bg-background"
```

### Text Colors
```tsx
// ❌ Before
className="text-gray-900"
className="text-gray-600"
className="text-gray-500"
className="text-pink-500"

// ✅ After
className="text-card-foreground"
className="text-muted-foreground"
className="text-muted-foreground"
className="text-primary"
```

### Borders
```tsx
// ❌ Before
className="border-gray-200"
className="border-gray-300"
className="border-pink-200"
className="border-pink-500"

// ✅ After
className="border-border"
className="border-border"
className="border-accent"
className="border-primary"
```

### Buttons & Interactive Elements
```tsx
// ❌ Before
className="bg-pink-500 hover:bg-pink-600 text-white"
className="hover:bg-gray-100"
className="focus:ring-pink-500"

// ✅ After
className="bg-primary hover:bg-primary/90 text-primary-foreground"
className="hover:bg-accent"
className="focus:ring-ring"
```

### Badges
```tsx
// ❌ Before
className="bg-pink-500 text-white"
className="bg-gray-100 text-gray-700"
className="bg-pink-100 text-pink-700"

// ✅ After
className="bg-primary text-primary-foreground"
className="bg-muted text-muted-foreground"
className="bg-accent text-accent-foreground"
```

### Icons
```tsx
// ❌ Before
<Home className="text-pink-500" />
<MapPin className="text-pink-500" />
<User className="text-gray-600" />

// ✅ After
<Home className="text-primary" />
<MapPin className="text-primary" />
<User className="text-muted-foreground" />
```

## Complete Color Mapping

| Old Value | New Value | Use Case |
|-----------|-----------|----------|
| `bg-white` | `bg-card` | Cards, panels |
| `bg-gray-50` | `bg-accent/30` | Subtle highlights |
| `bg-gray-100` | `bg-muted` | Muted backgrounds |
| `bg-gray-200` | `bg-muted` | Loading states |
| `bg-pink-50` | `bg-accent` | Light pink backgrounds |
| `bg-pink-100` | `bg-accent` | Pink highlights |
| `bg-pink-500` | `bg-primary` | Primary actions |
| `bg-pink-600` | `bg-primary/90` | Hover states |
| `bg-[#f6f2ff]` | `bg-background` | Page backgrounds |
| `text-gray-900` | `text-card-foreground` | Headings, strong text |
| `text-gray-700` | `text-card-foreground` | Body text |
| `text-gray-600` | `text-muted-foreground` | Secondary text |
| `text-gray-500` | `text-muted-foreground` | Tertiary text |
| `text-pink-500` | `text-primary` | Brand colored text |
| `text-pink-600` | `text-primary` | Active states |
| `text-pink-700` | `text-primary` | Dark pink text |
| `text-white` | `text-primary-foreground` | Text on primary |
| `border-gray-200` | `border-border` | Subtle borders |
| `border-gray-300` | `border-border` | Standard borders |
| `border-pink-200` | `border-accent` | Pink borders |
| `border-pink-500` | `border-primary` | Primary borders |

## Dynamic Colors (CSS Variables)

For components that need to read colors at runtime (like Mapbox markers):

```javascript
// Get theme color from CSS variable
const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--pink-500').trim();

// Convert HSL to usable format
const hslValues = primaryColor.split(' ');
const color = hslValues.length === 3 
    ? `hsl(${hslValues[0]}, ${hslValues[1]}, ${hslValues[2]})`
    : "hsl(358, 100%, 68%)"; // Fallback
```

## Shadows

```tsx
// ❌ Before
className="shadow-md"
className="shadow-lg"
className="shadow-xl"

// ✅ After (when using custom shadows)
className="shadow-soft"
className="shadow-card"
className="shadow-card"
```

## Gradients

```tsx
// ❌ Before
style={{ background: 'linear-gradient(135deg, #ff5a5f, #e8444a)' }}

// ✅ After
className="bg-gradient-primary"
// or
style={{ backgroundImage: 'var(--gradient-primary)' }}
```

## Complete Theme Variable List

### Color Variables
- `--pink-50` through `--pink-900`
- `--white`, `--off-white`, `--cream`, `--snow`
- `--black`, `--charcoal`, `--dark-gray`, `--medium-gray`, `--light-gray`, `--pale-gray`, `--whisper`

### Semantic Variables
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--primary`, `--primary-foreground`, `--primary-glow`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### Other Variables
- `--radius`: Border radius (0.5rem)
- `--gradient-primary`: Primary gradient
- `--gradient-soft`: Soft gradient
- `--gradient-card`: Card gradient
- `--shadow-soft`: Soft shadow
- `--shadow-card`: Card shadow

---

**Pro Tip**: Use semantic names (primary, accent, muted) instead of color names (pink, gray) for better maintainability!
