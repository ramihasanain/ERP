# ERP Frontend Project Structure and Reuse Standards

This document defines a reusable project structure for ERP frontends based on this codebase.

It is designed so you can clone the same structure into other ERP products (trading, manufacturing, logistics, finance, clinics, etc.) with minimal UI rework.

---

## 1) Recommended Structure

```text
src/
  components/
    Layout/
      Layout.tsx
      Sidebar.tsx
      Navbar.tsx
      NotificationsDropdown.tsx
      UserMenuDropdown.tsx

    Dashboard/
    Clients/
    Products/
    Manufacturers/
    Invoices/
    Users/
    Shared/
      ImageWithFallback.tsx

  routes/
    appRoutes.tsx
    ProtectedRoute.tsx

  services/
    auth.ts

  core/
    ScrollToTop.tsx
    Pagination.tsx
    Spinner.tsx

  styles/
    index.css
    tailwind.css
```

---

## 2) Architectural Principles

### Feature-first components

Each ERP module owns its own UI and local logic.

- `src/components/Clients/*`
- `src/components/Products/*`
- `src/components/Invoices/*`

Do not place module-specific UI in global folders.

### Layout as platform shell

`Layout`, `Sidebar`, and `Navbar` are treated as a shell shared by all modules.

### Keep shared parts minimal

Only move components to `Shared` when reused by at least 2 modules.

---

## 3) Module Blueprint (Copy this for new ERP domains)

For each new domain module, follow this folder-first pattern:

```text
src/components/<Module>/
  <FeatureName>/               # feature folder (recommended for large modules)
    index.jsx                  # orchestrator: state + handlers + composition
    use<FeatureName>Data.js    # React Query reads/writes and API mutations
    <FeatureName>Header.jsx    # title/actions + filters/search
    <FeatureName>Form.jsx      # create/edit form UI
    <FeatureName>List.jsx      # table/list cards and row actions
    <FeatureName>Modal.jsx     # focused modal(s) like assign/confirm
    utils.js                   # mappers, constants, view helpers
```

### Real example from this repo

```text
src/components/hr/ProjectsManagement/
  index.jsx
  useProjectsManagementData.js
  ProjectsHeaderFilters.jsx
  ProjectFormCard.jsx
  ProjectsList.jsx
  AssignEmployeeModal.jsx
  utils.js
```

This is now the reference implementation for splitting large ERP feature components.

Example replacements for another ERP:

- `Clients` -> `Vendors`
- `Products` -> `SKUs`
- `Manufacturers` -> `Factories`
- `Invoices` -> `Billing`

---

## 4) UI Standards (Portable Across ERPs)

### Typography and controls

- Buttons: `font-medium`
- Inputs/selects/textarea: `font-normal`
- Labels: `font-medium`
- All clickable buttons: `cursor-pointer`

### Modal standard

- Use centered overlay modal (`fixed inset-0 ... backdrop-blur-sm`)
- Header with title + close button
- Footer with 2 actions (cancel + submit)

### Table standard

- Sticky-like visual header style
- Row action icon buttons
- Hover state on rows
- Overflow wrapper for horizontal safety

---

## 5) Responsive Behavior Standard

### Navbar + Sidebar split (important for mobile ERP usability)

On `sm` and below:

- Move `Notifications` + `Theme Toggle` into sidebar bottom area
- Hide those controls in navbar
- Keep only essential top controls in navbar (search + user)
- Reduce control sizes:
  - user dropdown trigger
  - theme toggle
  - search input text

This pattern avoids crowded top bars on mobile.

---

## 6) Routing Standard

Add each module route through `routes/appRoutes.tsx` and render inside `Layout`.

Suggested route naming:

- `/dashboard`
- `/customers`
- `/products`
- `/manufacturers`
- `/purchase-orders`
- `/invoices`
- `/accounts`
- `/users`

For other ERPs, keep same shape and swap labels/paths only.

---

## 7) Naming Conventions

- Component files: PascalCase (`UserManager.tsx`)
- Hooks/utils: camelCase (`useInvoiceTotals.ts`)
- Types: `<Feature>Types.ts` or local `type` declarations
- Boolean state:
  - `isOpen`
  - `showModal`
  - `isLoading`

---

## 8) Implementation Checklist for New ERP Project

1. Copy `Layout` shell and route protection
2. Keep sidebar/nav interaction model
3. Port UI standards (non-bold buttons, normal-weight fields, cursor-pointer)
4. Create modules using blueprint folder structure
5. Replace domain names and fields only
6. Validate responsive behavior under `sm`
7. Run lint and remove unused imports immediately

---

## 9) What to Keep vs What to Replace

### Keep

- Layout components
- Interaction patterns
- Modal/table/search patterns
- Responsive strategy
- Naming conventions

### Replace

- Domain entities and forms
- Menu labels and route names
- API integration layer (if backend differs)
- Business rules in modules

---

## 10) Minimal Port Plan (1-2 days)

Day 1:

- Clone shell (`Layout`, `Navbar`, `Sidebar`)
- Configure routes
- Build first 2 ERP modules using existing manager+modal pattern

Day 2:

- Build remaining modules
- Apply typography/cursor standards
- Validate mobile behavior
- Final lint and cleanup

---

## 11) Maintenance Rules

- Do not introduce mixed button font weights (`font-bold` in one module, `font-medium` in another)
- Do not leave clickable elements without `cursor-pointer`
- Keep mobile-first control sizing consistent
- Keep module code inside module folders

These rules keep the UI consistent and easier to port between ERP projects.

