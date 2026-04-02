# Visual Review Plan

Use this after major UI changes, before deployment, or before asking for another redesign pass.

## Goal

Verify that the storefront looks intentional, stable, and complete across the main routes and breakpoints.

## Review Order

1. Home
2. Collection
3. Product detail
4. Wishlist
5. Checkout
6. Not found
7. Admin login gate

## Breakpoints

Check each route at:

- Mobile: `375x812`
- Tablet: `768x1024`
- Desktop: `1440x900`

## Review Rules

- Check with normal motion
- Check once with reduced motion enabled
- Check once with keyboard only
- Check once with slow network or delayed content loading
- Capture screenshots only for failures or uncertain cases

## Route Checklist

### 1. Home

Review:

- hero spacing, hierarchy, and first-screen clarity
- reveal animations entering cleanly without jank
- section spacing consistency
- CTA visibility and contrast
- product cards alignment and hover states
- footer density and readability

Pass if:

- the page feels premium and readable at first glance
- no section feels cramped, empty, or visually broken
- animation supports the layout instead of distracting from it

### 2. Collection

Review:

- filter, sort, and pagination layout
- product card rhythm and spacing
- empty-state clarity
- clear-filters CTA visibility
- pagination usability on mobile

Pass if:

- controls are understandable without explanation
- cards stay aligned across rows
- no layout shift makes browsing feel unstable

### 3. Product Detail

Review:

- image area balance and zoom behavior
- breadcrumb visibility
- price, badges, stock tone, and CTA grouping
- size selection clarity
- related products section
- reviews placeholder block styling

Pass if:

- the primary buying actions are obvious
- media and purchase controls feel like one coherent surface
- related products do not look like an afterthought

### 4. Wishlist

Review:

- saved-item card spacing
- empty state quality
- action clarity for removing or revisiting items

Pass if:

- the page still feels designed even with zero items
- saved items are easy to scan quickly

### 5. Checkout

Review:

- page-mode cart drawer layout
- order summary readability
- form field spacing and focus states
- validation visibility
- submit-state clarity

Pass if:

- checkout reads as trustworthy and calm
- form completion feels guided, not cramped

### 6. Not Found

Review:

- headline clarity
- route recovery CTA
- visual consistency with the rest of the storefront

Pass if:

- it feels like part of the product, not a default error page

### 7. Admin Gate

Review:

- password form alignment
- error message visibility
- focus order
- mobile usability

Pass if:

- the gate feels intentional and not broken or placeholder-like

## Cross-Route Checks

### Navigation

- navbar does not jump between pages
- mobile nav opens and closes cleanly
- active route context is understandable

### Loading States

- skeletons look related to the final layout
- lazy-loaded routes do not flash broken content
- transitions feel controlled

### Accessibility

- skip link is visible on keyboard focus
- focus does not get trapped incorrectly
- contrast is acceptable on primary actions and key text

### Visual Consistency

- buttons feel like one system
- cards use a consistent surface language
- headings follow one hierarchy
- spacing scale feels deliberate across pages

## Output Format

When reviewing, record results like this:

### Route

- `Home / Desktop`: pass
- `Collection / Mobile`: fail — pagination wraps awkwardly
- `Checkout / Tablet`: fail — summary card too dense

### Severity

- `High`: blocks trust, usability, or readability
- `Medium`: feels unpolished or inconsistent
- `Low`: minor spacing or polish issue

## Finish Criteria

The visual review is complete when:

- all main routes are checked at all three breakpoints
- all high-severity issues are fixed
- medium issues are either fixed or intentionally deferred
- screenshots exist for any remaining unresolved visual problems
