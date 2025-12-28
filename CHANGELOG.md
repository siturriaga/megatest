# Changelog

All notable changes to STRIDE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2024-12-27

### Added

#### Mobile Support
- **SwipeablePassRow**: Swipe-left-to-return gesture on mobile devices
  - Touch and mouse event support
  - Visual feedback with green "Return" action
  - Overtime indicator with red styling
  - Smooth animations and haptic-like feedback

#### SuperAdmin Panel
- **School Management UI**: Full interface for creating and switching schools
  - Create new schools with name input
  - Visual list of all schools with active indicator
  - One-click school switching
- **Bulk QR Code Generation**
  - Download all student QR codes as ZIP file
  - Progress indicator during generation
  - Printable ID card sheet generator (8 cards per page)
  - Professional ID card design with school branding

#### PWA Support
- **Service Worker** (`public/sw.js`)
  - Offline page caching
  - Static asset caching
  - Network-first strategy for pages
  - Background sync preparation for offline actions
  - Push notification support
- **Web App Manifest** (`public/manifest.json`)
  - Installable on home screen
  - App shortcuts (Issue Pass, Sandbox Mode)
  - Theme colors matching STRIDE branding
- **Offline Page** (`public/offline.html`)
  - Graceful offline fallback
  - Auto-reconnect detection
  - Branded design matching app

#### Admin Panel (Complete Rewrite)
- **Labels Tab**: Edit infraction, incentive, and destination buttons
- **Bell Schedule Tab**: Configure periods with start/end times
- **Economy Tab**: Slider controls for point split ratios
- **Houses Tab**: Edit name, mascot emoji, and colors
- **Settings Tab**: Overtime warnings, capacity limits, conflict alerts
- **Roster Tab**: Excel/CSV file upload with actual parsing

### Fixed

#### Bug Fixes
- **"Invisible Staff" Bug**: School Admins can now see users in their school
  - Updated Firestore rules to allow school-scoped reads
  - Added `list` permission for staff queries
- **File Upload**: Actually parses Excel/CSV files now
  - Uses SheetJS for file parsing
  - Validates required columns (name, ID)
  - Batched writes for efficiency (500 per batch)
  - Merges with existing students (preserves scores)
- **Box Queue Actions**: Approval now performs the requested action
  - ADD_DESTINATION → Adds to config
  - REMOVE_DESTINATION → Removes from config
  - PROMOTE_USER → Updates user role

### Changed
- Mobile view now uses swipeable rows instead of grid cards
- SuperAdmin button (amber) appears in header for super admins
- Service worker registers automatically on page load
- Layout includes PWA manifest and theme-color meta tags

### Dependencies
- Added `jszip` for ZIP file generation
- Added `qrcode` for server-side QR generation

---

## [2.1.0] - 2024-12-27

### Added

#### Security Enhancements
- **Input Sanitization**: Added XSS protection via `utils/sanitize.js`
  - `sanitizeText()` - Removes script tags and event handlers
  - `sanitizeStudentName()` - Validates names (letters, spaces, hyphens only)
  - `sanitizeStudentId()` - Alphanumeric only, uppercase
  - `sanitizeBroadcastMessage()` - 500 char limit with XSS prevention
- **Rate Limiting**: Client-side rate limiters for abuse prevention
  - 10 passes per minute
  - 20 infractions per minute
  - 30 point awards per minute
  - 5 broadcasts per minute
  - 3 school creations per 5 minutes
- **Data Validation**: Comprehensive validators in `utils/validators.js`
  - `validateStudent()`, `validatePass()`, `validateLogEntry()`
  - `validateBroadcast()`, `validateConflictGroup()`, `validateParentContact()`
  - `validateSchool()`, `validateConfig()`
- **Enhanced Security Headers** (netlify.toml)
  - Content-Security-Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options, X-Content-Type-Options
  - Permissions-Policy
  - Cross-Origin policies
- **Enhanced Firestore Rules**
  - Input validation in security rules
  - Stricter type checking
  - Field-level access control

#### Accessibility
- **ARIA Support**: Full screen reader compatibility
  - Skip links for keyboard navigation
  - Live regions for announcements
  - Focus trapping in modals
  - Focus restoration on modal close
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **High Contrast**: Enhanced visibility for high contrast mode
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Only**: `.sr-only` utility class

#### Code Quality
- **ESLint Configuration**: Comprehensive linting rules
  - React hooks rules
  - Accessibility rules (jsx-a11y)
  - Security rules (no-eval, no-implied-eval)
- **Prettier Configuration**: Consistent code formatting
- **Type Definitions**: JSDoc types in `types/index.js`
- **Error Boundaries**: Graceful error handling with recovery UI

#### Database
- **Firestore Indexes**: Optimized query performance
- **Transactions**: Atomic updates for pass issuance
- **Firebase Configuration**: Proper `firebase.json`

### Changed
- SuperAdmin email now configurable via environment variable
- Pass creation uses transactions for data consistency
- Improved validation error messages
- Updated dependencies with security patches

### Fixed
- Removed duplicate code in `useStrideState.js`
- Fixed potential XSS vulnerabilities in user input display
- Fixed race conditions in concurrent pass operations

### Security
- All user inputs are now sanitized before display
- Rate limiting prevents abuse of API calls
- CSP prevents inline script injection
- HSTS enforces HTTPS connections

---

## [2.0.0] - 2024-12-27

### Added

#### Core Features
- **7 Dashboard Panels**: Hall Pass, Infractions, Incentives, Safety, Communication, Analytics, Records
- **StrideBot AI Companion**
  - 11 mood states with context-aware responses
  - Mouse tracking (pupils follow cursor)
  - Teleportation (anti-burn-in, moves every 45-90s)
  - Theme adaptation (Aero/Obsidian/Eclipse)
  - Squash & stretch physics animations
  - Micro-saccades (living eye effect)
- **House System**
  - Animated SVG mascots (Phoenix, Wolf, Hawk, Panther)
  - 40/60 point split (student/team)
  - House standings with progress bars
- **MTSS Integration**
  - Automatic tier calculation (1-4)
  - Intervention recommendations
  - Hidden print document for reports
- **Safety Features**
  - Global lockdown with instant propagation
  - Conflict groups ("no-fly lists")
  - Lockdown report generation
- **Communication**
  - School-wide broadcasts
  - Priority levels (normal/important/urgent)
  - Pin/unpin functionality

#### Special Modes
- **Tardy Kiosk**: Self-service student check-in
- **Hall Monitor**: Full-screen pass verification
- **QR Scanner**: Camera-based student lookup
- **Sandbox Mode**: Training environment ($0 cost)
- **Command Center**: Multi-school management (SuperAdmin)

#### UI/UX
- **3 Themes**: Aero (light), Obsidian (dark), Eclipse (OLED)
- **44px Touch Targets**: Apple HIG compliance
- **Safe Area Insets**: iPhone notch support
- **Hidden Scrollbars**: Native app feel
- **Inter Font**: Variable font for UI legibility
- **Noise Texture**: Premium film grain effect

#### Documents
- **Digital ID**: QR code generation for students
- **Detention Document**: Printable discipline notice
- **MTSS Report**: Hidden print-only document
- **Parent Contact Log**: Intervention documentation

### Technical
- **Sharded Collections**: School-isolated data for cost efficiency
- **Real-time Listeners**: 10+ Firestore subscriptions
- **Optimistic UI**: Instant feedback, masked latency
- **Domain Restriction**: `@dadeschools.net` only
- **Role-Based Access**: 5-tier hierarchy

---

## [1.0.0] - Initial Release

- Basic hall pass functionality
- Student management
- Simple theme support
