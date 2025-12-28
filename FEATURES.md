# STRIDE v2.1 - Complete Feature & Function Reference

## 📋 Table of Contents
1. [Core Modules](#core-modules)
2. [Authentication & Authorization](#authentication--authorization)
3. [Hall Pass System](#hall-pass-system)
4. [Behavior Management (MTSS)](#behavior-management-mtss)
5. [Incentive & House System](#incentive--house-system)
6. [Safety & Emergency](#safety--emergency)
7. [Communication](#communication)
8. [Analytics & Reporting](#analytics--reporting)
9. [Records & Audit Trail](#records--audit-trail)
10. [Administration](#administration)
11. [StrideBot AI Companion](#stridebot-ai-companion)
12. [Special Modes](#special-modes)
13. [UI/UX Features](#uiux-features)
14. [Security Features](#security-features)
15. [Technical Infrastructure](#technical-infrastructure)

---

## Core Modules

### Dashboard Panels (7 Total)
| Panel | Purpose | Access Level |
|-------|---------|--------------|
| Hall Pass | Issue/manage student passes | Teacher+ |
| Infractions | Log behavior issues, MTSS tracking | Teacher+ |
| Incentives | Award points, view house standings | Teacher+ |
| Safety | Lockdown control, conflict groups | Teacher+ (view) / Admin (control) |
| Communication | School-wide broadcasts | Admin only |
| Analytics | Charts, reports, data visualization | Teacher+ |
| Records | Search student history, audit logs | Teacher+ |
| Admin* | Configuration, roster upload | Admin only |

*Admin panel appears as a button, not a tab

---

## Authentication & Authorization

### Login System
- **Google OAuth** via Firebase Authentication
- **Domain restriction**: `@dadeschools.net` only (configurable)
- **SuperAdmin bypass**: Configurable email bypasses domain check
- **AUP Gate**: Acceptable Use Policy must be accepted before access
- **Session persistence**: Firebase handles token refresh

### Role Hierarchy (5 Levels)
```
Role             Level   Capabilities
─────────────────────────────────────────────────────────────
SUPER_ADMIN      100     Full system access, create schools, manage all
SCHOOL_ADMIN      80     School config, lockdown, user management
TEACHER           50     Issue passes, log behavior, award points
HALL_MONITOR      30     Verify passes, return students
KIOSK             10     Tardy logging only (self-service)
```

### Exported Auth Functions
```javascript
user              // Current Firebase user object
userData          // User document from Firestore
isSchoolAdmin     // Boolean: is admin or above
isSuperAdmin      // Boolean: is super admin
userGreeting      // { firstName, fullName, email }
employeeId        // User's employee ID
signOutUser()     // Sign out and redirect
```

---

## Hall Pass System

### Core Features
- **Student search** with autocomplete (name or ID)
- **Destination selection** with customizable options
- **Origin room** tracking (optional)
- **Estimated duration** per destination type
- **Real-time pass timer** with overtime warnings
- **Conflict detection** before issuing pass

### Pass Workflow
```
1. Search student → 2. Check conflicts → 3. Select destination
→ 4. Issue pass → 5. Timer starts → 6. Return student → 7. Log created
```

### Pass States
| State | Description |
|-------|-------------|
| ACTIVE | Student currently out |
| ENDED | Student returned |

### Exported Functions
```javascript
issuePass(student, destination, originRoom)   // Create new pass
returnStudent(pass)                           // End active pass
returnAllStudents()                           // Batch return all
hasActivePass(studentId)                      // Check if student has pass
isDestinationFull(destination)                // Check capacity
getWaitlistPosition(studentId, destination)   // Queue position
destinationCounts()                           // Current counts per destination
```

### Capacity & Waitlist
- **Max capacity** per destination (configurable, default: 5)
- **Automatic waitlist** when destination full
- **3-minute hold** when spot opens
- **StrideBot notification** for waitlist updates

---

## Behavior Management (MTSS)

### Infraction Logging
- **Quick buttons**: Disruption, Defiance, Tech Misuse, Profanity (customizable)
- **Auto-increment** MTSS score on log
- **Detention document** generation
- **Parent contact** logging

### MTSS Tier System
| Tier | Score Range | Label | Interventions |
|------|-------------|-------|---------------|
| 1 | 0-2 | Universal | Standard monitoring |
| 2 | 3-5 | Targeted | Check-In/Check-Out, behavior contract, parent conference |
| 3 | 6-9 | Intensive | SST meeting, FBA, BIP |
| 4 | 10+ | Critical | Immediate admin referral, emergency SST |

### Parent Contact Log
- **Intervention checklist**: Verbal warning, seat change, conference, etc.
- **Contact made** toggle
- **Contact method**: Phone, email, in-person, letter
- **Date/time** tracking
- **Notes** field
- **Immutable** for audit purposes (no edits/deletes)

### Exported Functions
```javascript
logInfraction(student, label)     // Log behavior issue
onSaveParentContact(contactData)  // Save parent contact
getStudentInfractions(studentId)  // Get infraction history
getMTSSTier(score)                // Calculate tier from score
```

### Documents Generated
- **Detention Document**: Printable discipline notice with student info, infraction details, signatures
- **MTSS Report**: Hidden print document with tier status, intervention recommendations, history

---

## Incentive & House System

### Point System
- **40/60 split** (configurable): 40% to student, 60% to house
- **Quick award buttons**: Helping Others, Participation, Excellence, Leadership, Kindness (customizable)
- **Running totals** per student and house

### House System
- **4 default houses**: Phoenix, Wolf, Hawk, Panther
- **Custom mascots**: Animated SVG with independent body parts
- **House colors**: Customizable hex values
- **Live standings**: Real-time score updates
- **Victory dance**: Mascot animation on point award

### House Mascot Animations
| Mascot | Idle Animation | Victory Animation |
|--------|----------------|-------------------|
| Phoenix | Wing flap, flame turbulence | Full wing span + flame burst |
| Wolf | Ear twitch, tail wag | Howl pose |
| Hawk | Head turn, wing ruffle | Wing span + screech |
| Panther | Eye glow, tail curl | Pounce stance |

### Exported Functions
```javascript
awardPoints(student, label, amount)  // Award points to student/house
houses                               // Array of house objects
housesSorted                         // Houses sorted by score (descending)
updateHouses(housesArray)            // Admin: update house config
```

---

## Safety & Emergency

### Lockdown System
- **Global lockdown** toggle (admin only)
- **Instant propagation** to all connected clients
- **Pass freeze**: All active passes suspended
- **StrideBot siren** mode with emergency messaging
- **Lockdown report** generation: List of students currently out

### Conflict Groups ("No-Fly Lists")
- **Create groups** of students who shouldn't be in hall together
- **Automatic detection** when issuing passes
- **Alert before** pass issuance
- **Admin-managed** group membership

### Exported Functions
```javascript
lockdown                      // Boolean: is lockdown active
lockdownMeta                  // { activatedBy, activatedAt }
toggleLockdown()              // Activate/deactivate lockdown
generateLockdownReport()      // Export current status
checkConflict(studentId)      // Check for conflicts
addConflictGroup(name, members)
removeConflictGroup(groupId)
conflictGroups                // Array of conflict groups
```

---

## Communication

### Broadcast System
- **School-wide messages** to all staff
- **Priority levels**: Normal, Important (yellow), Urgent (red)
- **Target audience**: All Staff, Teachers Only, Admins Only
- **Pin/unpin** functionality
- **StrideBot announcement** on new broadcast

### Exported Functions
```javascript
sendBroadcast(message, priority, audience)
deleteBroadcast(broadcastId)
pinBroadcast(broadcastId, pinned)
broadcasts                    // Array of broadcasts
```

---

## Analytics & Reporting

### Dashboard Charts
- **Pass volume** over time (line chart)
- **Infractions vs Incentives** comparison (bar chart)
- **Destination usage** breakdown (pie chart)
- **Peak hours** analysis
- **House standings** visualization

### MTSS Reports
- **Students by tier** summary
- **Trending up/down** indicators
- **Intervention effectiveness** tracking

### Data Exports
- **Lockdown report**: PDF-ready student location list
- **MTSS report**: Print-optimized intervention document

### Exported Data
```javascript
analyticsData    // Computed analytics object
logs             // Last 200 log entries
```

---

## Records & Audit Trail

### Search & Filter
- **Student search** with full history
- **Filter by type**: Passes, Infractions, Incentives, Tardies
- **Date range** filtering
- **Teacher/issuer** filtering

### Log Entry Types
| Type | Description | Data Captured |
|------|-------------|---------------|
| PASS | Hall pass issued | destination, duration, teacher |
| RETURN | Student returned | duration elapsed, teacher |
| INFRACTION | Behavior logged | type, MTSS impact |
| INCENTIVE | Points awarded | amount, reason, house impact |
| TARDY | Late arrival | time, period, streak |

### Immutable Audit Trail
- **No edits or deletes** allowed on logs
- **Firestore rules** enforce immutability
- **Timestamp** on every entry
- **User attribution** (email, employee ID)

---

## Administration

### The Box (Admin Panel)
- **Roster upload**: Excel/CSV import with merge
- **Labels config**: Custom button labels
- **Economy config**: Point split ratios
- **Kiosk config**: Tardy kiosk settings
- **Bell schedule**: Period times for tardy calculation
- **Houses config**: Names, colors, mascots

### School Management
- **Create school** (SuperAdmin only)
- **Switch school** (SuperAdmin only)
- **School isolation**: Data sharded by school ID

### Exported Functions
```javascript
createSchool(name)            // SuperAdmin: create new school
switchSchool(schoolId)        // SuperAdmin: change active school
updateConfig(type, data)      // Update configuration
handleFileUpload(file, type)  // Process roster upload
allSchools                    // Array of all schools (SuperAdmin)
currentSchoolId               // Active school ID
schoolData                    // Current school document
```

---

## StrideBot AI Companion

### Personality & Behavior
- **Context-aware** messaging based on actions
- **Time-aware** greetings and check-ins
- **Wellness reminders** every 7-12 minutes
- **After-hours detection** with appropriate messaging

### Mood States (11 Total)
| Mood | Trigger | Visual |
|------|---------|--------|
| happy | Default/idle | Calm eyes |
| party | Points awarded | Bouncing + particles |
| high5 | Student returned | Celebration |
| scan | Pass issued | ID badge icon |
| wellness | Timer (7-12 min) | Water drop icon |
| warn | Pass overtime | Warning icon |
| sad | Infraction logged | Subdued |
| siren | Lockdown active | Red pulse + ring |
| alert | Broadcast received | Orange pulse |
| guide | Sandbox hint | Question mark |
| waitlist | Destination full | Queue icon |

### Animations
- **Mouse tracking**: Pupils follow cursor
- **Blinking**: Random blink with micro-saccades
- **Teleportation**: Moves to random corner every 45-90 seconds (anti-burn-in)
- **Squash & stretch**: Physics-based landing animation
- **Theme adaptation**: Colors match Aero/Obsidian/Eclipse

### Interaction
- **Click**: Trigger new message
- **Double-click**: Minimize to icon
- **Action buttons**: Context-specific actions in bubble

### Exported Methods (via ref)
```javascript
botRef.current.push(mood, context)     // Trigger mood with context
botRef.current.showHint(buttonId)      // Show panel hint
botRef.current.showBroadcast(broadcast) // Announce broadcast
```

---

## Special Modes

### Sandbox Mode (Training)
- **Fake data**: Pre-populated students, passes, logs
- **Zero Firestore cost**: All listeners unsubscribed
- **Guide orbs**: Contextual help on each panel
- **StrideBot training** messages
- **No data persistence**: Resets on refresh

### Tardy Kiosk Mode
- **Self-service** student check-in
- **QR code scan** or manual ID entry
- **Auto-detect period** from bell schedule
- **Tardy streak tracking** with thresholds
- **Camera consent** pre-prompt

### Hall Monitor Mode
- **Full-screen** pass verification
- **QR scanner** integration
- **Quick return** buttons
- **Pass validity** display

### Command Center (SuperAdmin)
- **Multi-school** dashboard
- **School switching** dropdown
- **Aggregate analytics**
- **Cross-school management**

---

## UI/UX Features

### Themes (3 Options)
| Theme | Description | Best For |
|-------|-------------|----------|
| Aero | Light mode, soft gradients | Bright environments |
| Obsidian | Dark mode, blue accents | Low light, default |
| Eclipse | OLED black, high contrast | OLED screens, battery saving |

### Design System
- **44px touch targets**: Apple HIG compliance
- **Safe area insets**: iPhone notch support
- **Hidden scrollbars**: Native app feel
- **Glass morphism**: Frosted glass cards
- **Inter font**: Variable weight UI font
- **Noise texture**: Subtle film grain overlay

### Accessibility
- **Keyboard navigation**: Full tab support
- **Focus indicators**: Visible focus rings
- **Skip links**: Jump to main content
- **ARIA labels**: Screen reader support
- **Reduced motion**: Respects `prefers-reduced-motion`
- **High contrast**: Enhanced for `prefers-contrast: high`

### Responsive Breakpoints
- Mobile: < 640px (single column)
- Tablet: 640-1024px (2 columns)
- Desktop: > 1024px (3 columns)

---

## Security Features

### Input Validation & Sanitization
- **XSS prevention**: All user inputs sanitized
- **HTML escaping**: Script tags removed
- **Name validation**: Letters, spaces, hyphens only
- **ID validation**: Alphanumeric only

### Rate Limiting
| Action | Limit | Window |
|--------|-------|--------|
| Issue pass | 10 | 1 minute |
| Log infraction | 20 | 1 minute |
| Award points | 30 | 1 minute |
| Send broadcast | 5 | 1 minute |
| Create school | 3 | 5 minutes |

### Security Headers (via Netlify)
- Content-Security-Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Permissions-Policy: camera=(self)

### Firestore Security Rules
- **Domain validation** on login
- **Role-based access** control
- **School isolation**: Users only access assigned school
- **Log immutability**: No updates/deletes on audit trail
- **Field-level validation**: Type checking in rules

---

## Technical Infrastructure

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14.2.3 (App Router) |
| Hosting | Netlify |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google OAuth) |
| Styling | Tailwind CSS 3.4.3 |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Spreadsheets | SheetJS (xlsx) |
| Icons | Lucide React |

### Database Collections
```
users/{uid}                           # User profiles
schools/{schoolId}/
  ├── students/{studentId}            # Student roster
  ├── active_passes/{passId}          # Currently active passes
  ├── logs/{logId}                    # Immutable audit trail
  ├── houses/{houseId}                # House configuration
  ├── conflictGroups/{groupId}        # Conflict lists
  ├── broadcasts/{broadcastId}        # Communication
  ├── parentContacts/{contactId}      # Parent contact logs
  ├── waitlist/{itemId}               # Destination queue
  ├── box_queue/{itemId}              # Pending approvals
  └── school_configs/                 # Configuration docs
      ├── labels                      # Button labels
      ├── bell_schedule               # Period times
      ├── economy                     # Point ratios
      ├── kiosk                       # Kiosk settings
      ├── settings                    # General settings
      └── houses_config               # House setup
```

### Real-Time Subscriptions (16 Active)
1. User document
2. School document
3. Students collection
4. Active passes
5. Logs (limit 200)
6. Houses
7. Conflict groups
8. Broadcasts
9. Parent contacts
10. Waitlist
11. Box queue
12. Labels config
13. Bell schedule
14. Economy config
15. Kiosk config
16. Settings config

### File Structure
```
stride-netlify/
├── app/
│   ├── page.js                 # Login page
│   ├── layout.js               # Root layout
│   ├── globals.css             # Themes + animations
│   ├── firebase.js             # Firebase init
│   ├── components/             # Shared components
│   │   ├── ErrorBoundary.js
│   │   └── Accessibility.js
│   └── dashboard/
│       ├── page.js             # Main dashboard
│       └── components/         # 25 panel components
├── hooks/
│   └── useStrideState.js       # Central state hook (1000+ lines)
├── utils/
│   ├── sanitize.js             # XSS prevention
│   └── validators.js           # Data validation
├── constants/
│   ├── collections.js          # Firestore paths
│   ├── roles.js                # Role definitions
│   └── defaults.js             # Default configs
├── config/
│   └── sandbox.js              # Sandbox mode data
├── types/
│   └── index.js                # JSDoc type definitions
├── firestore.rules             # Security rules
├── firestore.indexes.json      # Query indexes
├── netlify.toml                # Deployment config
└── package.json                # Dependencies
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Dashboard Panels | 7 |
| React Components | 27 |
| Exported Functions | 62 |
| User Roles | 5 |
| StrideBot Moods | 11 |
| Themes | 3 |
| Firestore Collections | 16 |
| Security Headers | 8 |
| MTSS Tiers | 4 |

---

*STRIDE v2.1 - Built for Miami-Dade County Public Schools*
*Last updated: December 2024*
