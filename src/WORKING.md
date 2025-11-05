Here is the hyper-detailed analysis of the `src/app/` directory, with code-level logic explanations for each file and folder.

---

## `src/app/`

This is the core of the Next.js App Router. All routing, UI pages, and backend API endpoints are defined here. The structure is feature-colocated, meaning routes, UI, and the APIs that serve them are grouped together.

### `src/app/layout.tsx`

* **File:** `src/app/layout.tsx`
* **Purpose:** This is the root layout for the *entire* application. It wraps every single page, public or private.
* **Logic:**
    1.  **Metadata:** Defines the base metadata (like `title` and `description`) for the app, which is used for SEO and the browser tab.
    2.  **Providers:** This file is the "Provider" hub. It wraps the `children` (the rest of the app) with essential context providers:
        * **`ThemeProvider`**: Manages the application's light/dark mode, allowing users to toggle.
        * **`AuthKitProvider`**: (Implicitly required by WorkOS) This would wrap the app to provide client-side session context.
        * **`Toaster`**: This component is included at the root level so that "toast" notifications (e.g., "User created!", "Error!") can be triggered from any component and will render correctly.
    3.  **Styles:** It imports the global stylesheet `globals.css` to apply base styles to the entire application.

### `src/app/page.tsx`

* **File:** `src/app/page.tsx`
* **Purpose:** This is the public-facing landing page (the `/` route). It's a **Server Component**.
* **Logic:**
    1.  **Authentication Check:** The page's primary logic is to determine if a user is already authenticated. It calls `getSignInUrl()` from WorkOS AuthKit.
    2.  **Session Fetch:** It also uses `getSSRSession()` to check if a session already exists.
    3.  **Conditional Rendering:**
        * **If Logged In:** It renders the `SignedOutHomePage` component, which is a client component that displays a "Go to Dashboard" button, directing the user to their protected content.
        * **If Not Logged In:** It renders a "Sign In" button. This button is an `<a>` tag whose `href` is set to the `authUrl` obtained from the `getSignInUrl()` function. This is what initiates the WorkOS login flow.

---

Here is the hyper-specific, updated analysis of the `src/app/api/` directory, with detailed logic for every file and sub-folder.

---

### `src/app/api/` (The Backend)

This folder contains all the application's backend API logic, implemented as Next.js Route Handlers. This is the secure, server-side part of the application.

#### Core Security Principle

Every single API route in this folder follows a critical, multi-tenant security pattern:
1.  **Authentication:** The first step in every handler is to call `getTokenClaims()` from WorkOS AuthKit. This validates the user's session cookie.
2.  **Authorization (Tenancy):** If the claims are valid, the user's `companyId` is fetched from the database (using the `workosUserId` from the claims).
3.  **Data Isolation:** This `companyId` is **always** used as a `where` filter in every Prisma database query (e.g., `prisma.user.findMany({ where: { companyId: user.companyId } })`). This is the core of the multi-tenancy and makes it *impossible* for one company to access another company's data.

#### `src/app/api/me/route.ts`

* **File:** `src/app/api/me/route.ts`
* **Purpose:** The single most important route for client-side authentication. It answers the question, "Who am I?"
* **Logic:**
    1.  **`GET` Handler:** Defines a `GET` function.
    2.  **Get Claims:** Calls `getTokenClaims()` to securely read the user's session cookie.
    3.  **Authorize:** If `claims` or `claims.sub` (the WorkOS User ID) are missing, it returns a 401 Unauthorized error.
    4.  **Database Fetch:** It uses the `claims.sub` to query the database: `prisma.user.findUnique({ where: { workosUserId: claims.sub } })`. This links the WorkOS-authenticated user to your internal database user.
    5.  **Return Data:** It returns the found `currentUser` object (id, email, role, companyId) as JSON. This is what the main `dashboardShell.tsx` component calls to get all its data.

#### `src/app/api/users/`

* **Purpose:** Provides the full CRUD (Create, Read, Update, Delete) API for the User Management page.
* **`route.ts` (`/api/users`):**
    * **`GET`:** Fetches all users for the admin's company. It gets the admin's `companyId` via the Core Security Principle and runs `prisma.user.findMany({ where: { companyId } })`.
    * **`POST`:** Creates a new user. This is a complex workflow:
        1.  Validates the incoming `email`, `firstName`, `role` using Zod.
        2.  Performs an **RBAC Check**: It calls `canAssignRole` from `lib/roleHierarchy.ts` to ensure the admin has the authority to assign the requested `role`.
        3.  Generates a random default password and a unique `salesmanLoginId`.
        4.  Hashes the password using `bcryptjs`.
        5.  Calls the WorkOS API (`workos.userManagement.createInvitation()`) to invite the user to the WorkOS organization.
        6.  Saves the new user to the Prisma database, linking them to the `companyId` and storing the `workosUserId` from the invitation.
* **`[userId]/route.ts` (`/api/users/:id`):**
    * **`PUT`:** Updates a user. It gets the `userId` from the URL, validates the request body, and runs `prisma.user.update({ where: { id: userId }, data: { ... } })`/route.ts`].
    * **`DELETE`:** Deletes a user. It finds the user's `workosUserId` and then calls the *internal* `/api/delete-user` route to handle the WorkOS deletion, ensuring the user is removed from both systems/route.ts`, `api/delete-user/route.ts`].
* **`bulk-invite/route.ts`:**
    * **`POST`:** Expects an array of users. It uses the `bulkInviteSchema` from Zod for validation. It then loops over the array, performing the same logic as the single `POST` (inviting to WorkOS, creating in Prisma) for each user.
* **`user-locations/route.ts` & `user-roles/route.ts`:**
    * **`GET`:** These are helper routes for UI filters. They fetch all users for the company, then use `Set` to de-duplicate all `region`/`area` or `role` values, returning unique arrays.

#### `src/app/api/dashboardPagesAPI/`

This folder is a key architectural pattern. It doesn't contain generic CRUD logic. Instead, it holds **specialized `GET`, `POST`, and `PUT` handlers** tailored for specific dashboard pages. This keeps the frontend components "dumb" and fast, as the server handles complex, multi-step logic.

* **`.../reports/` (Folder):**
    * Contains a `route.ts` for each report: `competition-reports`, `daily-visit-reports`, `sales-orders`, `technical-visit-reports`.
    * **Logic:** Each file defines a `GET` handler that reads URL query parameters (`startDate`, `endDate`, `regions`, `areas`, etc.). It dynamically builds a complex Prisma `where` clause based on these filters and the user's `companyId`, then returns the filtered list of records.
* **`.../team-overview/` (Folder):**
    * **`dataFetch/route.ts`:** `GET` handler that fetches all users for the team table.
    * **`editRole/route.ts`:** A critical `POST` mutation route.
        1.  Gets `userId` and `newRole` from the body.
        2.  Gets the *admin's* role (`currentUserRole`) from `getTokenClaims()`.
        3.  **RBAC Check:** Performs the most important security check: `if (!canAssignRole(currentUserRole, newRole))`. If this fails, it returns a 403 Forbidden error.
        4.  **Transaction:** Runs a `prisma.$transaction` to ensure both WorkOS and the local DB are updated.
        5.  Calls `workos.userManagement.updateOrganizationMembership(...)` and `prisma.user.update(...)` to synchronize the role.
    * **`slmLiveLocation/route.ts`:** `GET` handler for the "Live Location" map. It loops through all users and finds their *single most recent* `GeoTracking` record using `prisma.geoTracking.findFirst({ ... orderBy: { recordedAt: 'desc' } })`.
    * **`editMapping/route.ts` & `editDealerMapping/route.ts`:** `PUT` handlers that allow an admin to update a user's `region`/`area` or their associated `dealers`.
* **`.../dealerManagement/` (Folder):**
    * **`route.ts`:** `GET` handler to list all dealers, with support for filtering by `regions`, `areas`, and `verificationStatus` from URL params.
    * **`dealer-verify/route.ts`:** `PUT` handler that takes a `dealerId` and `status` ("VERIFIED" or "REJECTED") to approve or reject a new dealer.
    * **`dealer-brand-mapping/route.ts`:** `GET` and `POST` handlers to manage the `DealerBrandMapping` table (what brands a dealer sells).
    * **`dealer-locations/route.ts` & `dealer-types/route.ts`:** `GET` helpers to provide unique lists of locations and types for UI filters.
* **`.../permanent-journey-plan/` (Folder):**
    * **`route.ts`:** `GET` (list PJPs with filters) and `POST` (create a new PJP).
    * **`pjp-verification/route.ts`:** `GET` handler that lists *only* PJPs with `status: 'PENDING'`.
    * **`pjp-verification/[id]/route.ts`:** `PUT` handler that takes the PJP `id` from the URL and a `status` ("APPROVED" or "REJECTED") from the body to update it/route.ts`].
* **`.../slm-geotracking/route.ts`:**
    * **`POST`:** Powers the "GeoTracking History" page. It (must be `POST` as it has a body) expects a `userId` and `date`. It builds a `where` clause to find all `GeoTracking` records for that user *on that specific day* and returns the full array of coordinates.
* **`.../slm-leaves/route.ts`:**
    * **`GET`:** Fetches leave applications with filters.
    * **`PUT`:** Approves or rejects a leave. Takes `leaveId`, `status`, and `adminRemarks` in the body and updates the `SalesmanLeaveApplication`.
* **`.../assign-tasks/route.ts`:**
    * **`GET`:** Lists all `DailyTask` records.
    * **`POST`:** Creates a new `DailyTask`, linking `assignedToUserId` (the salesman) and `assignedByUserId` (the admin).
* **`.../slm-attendance/route.ts`:**
    * **`GET`:** Fetches all `SalesmanAttendance` records, supporting date range filters.
* **`.../scores-ratings/route.ts`:**
    * **`GET`:** Fetches all `Rating` records.
    * **`POST`:** Creates or updates a salesman's rating (likely a `prisma.rating.upsert` operation).

#### `src/app/api/custom-report-generator/route.ts`

* **`GET`:** The backend for the custom report builder.
* **Logic:** This is a generic, dynamic query builder.
    1.  It reads query parameters: `table`, `columns`, `startDate`, `endDate`, etc.
    2.  It uses a `switch (table)` statement to select the correct Prisma model (e.g., `prisma.dailyVisitReport`, `prisma.salesOrder`).
    3.  It dynamically builds the `where` clause for date ranges and filters.
    4.  It dynamically builds a `select` clause based on the `columns` parameter.
    5.  It runs the query: `prisma[model].findMany({ where, select })` and returns the flat data.

#### Other Root API Routes

* **`src/app/api/company/route.ts`:**
    * **`GET`:** A simple helper that gets the current user's `companyId` (via `getTokenClaims`) and returns their `prisma.company.findUnique(...)` details.
* **`src/app/api/delete-user/route.ts`:**
    * **`POST`:** An *internal* route called by `api/users/[userId]`. It exists to encapsulate the WorkOS SDK call (`workos.userManagement.deleteUser(workosUserId)`) and keep the main `DELETE` logic cleaner.
* **`src/app/api/send-query/route.ts`:**
    * **`POST`:** Powers the "Raise a Query" form. It takes `subject` and `message` from the body. It uses `nodemailer` to create an email transporter and send the query to a hardcoded admin email address.
* **`src/app/api/setup-company/route.ts`:**
    * **`POST`:** The main endpoint for the company onboarding flow.
    * **Logic:** It calls the `createCompanyAndAdmin` function from `lib/company-service.ts`. This single function handles the complex transaction of:
        1.  Calling WorkOS to `createOrganization`.
        2.  Calling WorkOS to `createInvitation` for the admin.
        3.  Creating the `Company` and `User` (admin) in the local Prisma database, linking them all together.
* **`src/app/api/chatbot/chatHistory/route.ts`:**
    * **`POST`:** This is *not* the chat AI endpoint (that's handled by the Vercel AI SDK). This is for *saving* the conversation. It takes the `messages` array and the `chatId` and saves them to the database.

---

### `src/app/auth/`

* **Purpose:** Handles the core authentication redirects from WorkOS.
* **`callback/route.ts`:**
    * **Logic:** This is where WorkOS sends the user back after they log in.
    * It handles the complex logic of running behind a reverse proxy (like Nginx) by checking `x-forwarded-host` headers to build the `correctBaseUrl`.
    * It passes this corrected URL to `handleAuth`, which exchanges the auth `code` for a session cookie and redirects the user to `/dashboard`.
* **`refresh/route.ts`:**
    * **Logic:** An API route used by WorkOS AuthKit to refresh a user's session in the background without requiring a re-login.

---

You are absolutely right. My apologies. I was mixing up the API routes (which are *part* of the `src/app` directory) with the frontend UI pages.

You are correct: the files in `src/app/dashboard/` are the **frontend UI pages and components**. Let's do a hyper-specific analysis of this `dashboard` folder, focusing on the client-side logic, state, and how it functions as the UI.

Here is the updated, highly detailed section.

---

### `src/app/dashboard/` (The Protected Frontend)

This folder contains all the **frontend UI pages and components** that are only accessible after logging in. It leverages the "Server Page, Client Component" pattern, where the `page.tsx` file is a Server Component that handles initial auth and data loading, and it renders an interactive Client Component (e.g., `userManagement.tsx`) which contains all the state, event handlers, and client-side data fetching.

* **`layout.tsx`:**
    * **Purpose:** The root layout for the *entire* protected dashboard. This is the main security gate.
    * **Logic:** This is a **Server Component**.
    * It calls `getSSRSession()` on the server to check for a valid session cookie.
    * **Security:** If `!session.isAuthenticated`, it immediately calls `redirect('/')`, preventing any unauthenticated access to the dashboard. This is the primary server-side gatekeeper.
    * If authenticated, it renders the `DashboardShell` client component and passes the server-fetched user/company data as initial props.

* **`dashboardShell.tsx`:**
    * **Purpose:** The interactive client-side wrapper for the entire dashboard. This is what provides the persistent sidebar and header.
    * **Logic:** This is a **Client Component** (`'use client'`).
    * **Client-Side Data:** It uses `useSWR` to make a client-side call to `/api/me`. This ensures the user's data (especially their role) is always fresh, even if changed in another tab (stale-while-revalidate).
    * **State:** It manages the mobile sidebar state (`isSidebarOpen`) using `useState`.
    * **Rendering:** It renders the `AppSidebar` and `SiteHeader` components, passing them the `user` object from `useSWR`. This is how the sidebar gets the user's `role` for its RBAC checks.
    * It renders the `children` prop (the actual page content, e.g., `users/page.tsx`).

* **`page.tsx` (`/dashboard`):**
    * **Purpose:** The main dashboard landing page with graphs and stats.
    * **Logic:** This is a **Server Component**. It performs all initial data fetching on the server for speed.
    * It calls `getTokenClaims` and makes direct `prisma` calls to fetch aggregate data (e.g., `dealerCount`, `dvrCount`, `tvrCount`).
    * It passes this pre-fetched data (e.g., `dvrData`, `tvrData`) as props to the `DashboardGraphs` client component.

* **`dashboardGraphs.tsx`:**
    * **Purpose:** The interactive client component that displays the graphs and stats on the main dashboard page.
    * **Logic:** This is a **Client Component** (`'use client'`).
    * **Props:** It receives all its data (e.g., `dvrData`, `tvrData`) as props from `page.tsx`. It contains no data-fetching logic itself.
    * **State:** It uses `useState` to manage the date range filter for the graphs.
    * **Calculation:** It contains client-side logic (e.g., `calculateTotal`, `calculatePercentageChange`) to process the prop data based on the selected date range.
    * **Rendering:** It renders the `data-comparison-calculation.tsx` and `chart-area-reusable.tsx` components, passing them the newly calculated stats.

* **`data-format.ts`:**
    * **Purpose:** A simple utility file defining TypeScript interfaces for the data shapes used in the dashboard, like `DataPoint` and `ComparisonData`.

---

#### `src/app/dashboard/assignTasks/`

* **`page.tsx`:**
    * **Purpose:** The "Assign Tasks" page.
    * **Logic:** This is a **Client Component** (`'use client'`).
    * **State:** Manages `tasks`, `users`, `dealers`, `loading`, and form state (`newTask`) for creating a new task.
    * **Data Fetching:** In `useEffect`, it makes multiple `fetch` calls to get data for the dropdowns (e.g., `/api/users`, `/api/dashboardPagesAPI/dealerManagement`) and to get the list of existing tasks (`/api/dashboardPagesAPI/assign-tasks`).
    * **Mutation:** The `handleCreateTask` function makes a `POST` request to `/api/dashboardPagesAPI/assign-tasks` with the `newTask` state. On success, it shows a toast and re-fetches the tasks.
    * **Rendering:** Renders a `<Dialog>` for the creation form and `DataTableReusable` to display the list of tasks.

---

#### `src/app/dashboard/dealerManagement/`

* **`page.tsx`:**
    * **Purpose:** The main container for the "Dealer Management" section.
    * **Logic:** This is a **Server Component**.
    * **RBAC:** This is the key. It fetches the user's `role` on the server. It then uses shadcn's `<Tabs>` component.
    * It *conditionally renders* the `<TabsTrigger>` and `<TabsContent>` for each sub-page based on `hasPermission(user.role, '...')`.
    * **Example:** A user without the `dealerManagement.verifyDealers` permission will not even see the "Verify Dealers" tab rendered in the HTML.
    * It renders the client components for each tab (e.g., `<ListDealers />`, `<VerifyDealers />`).

* **`listDealers.tsx`:**
    * **Purpose:** The client component for the "List Dealers" tab.
    * **Logic:** This is a **Client Component** (`'use client'`).
    * **State:** Manages `data` (the list of dealers), `loading`, and filter states (`regionFilter`, `areaFilter`, `statusFilter`) using `useState`.
    * **Data Fetching:** It has a `fetchData` function that builds a URL with query parameters from the filter state (e.g., `/api/dashboardPagesAPI/dealerManagement?regions=${regionFilter.join(',')}`). This is called inside a `useEffect` hook.
    * **Filtering:** The `useEffect` hook has the filter states in its dependency array, so `fetchData` is automatically re-run whenever a filter changes.
    * **Rendering:** Renders `DataTableReusable` with the `data`.

* **`verifyDealers.tsx`:**
    * **Purpose:** The client component for the "Verify Dealers" tab.
    * **Logic:** A **Client Component**. It is almost identical to `listDealers.tsx`, but with two key differences:
        1.  **Data Fetching:** Its `fetchData` function *hardcodes* a query parameter `&verificationStatus=PENDING` to ensure it only ever fetches unverified dealers.
        2.  **Mutation:** Its `columns` definition for the table includes "Approve" and "Reject" buttons. The `handleVerify` function makes a `PUT` request to `/api/dashboardPagesAPI/dealerManagement/dealer-verify`, sending the `dealerId` and the new `status`. It re-fetches data on success.

* **`dealerBrandMapping.tsx`:**
    * **Purpose:** The client component for the "Brand Mapping" tab.
    * **Logic:** A **Client Component**. Manages state for `brands`, `dealers`, `mappings`, and a form for creating new mappings.
    * **Data Fetching:** Fetches from `/api/dashboardPagesAPI/dealerManagement` (for dealers) and `/api/dashboardPagesAPI/dealerManagement/dealer-brand-mapping` (for mappings).
    * **Mutation:** `handleCreateMapping` makes a `POST` request to `/api/dashboardPagesAPI/dealerManagement/dealer-brand-mapping` to create a new link.

---

#### `src/app/dashboard/permanentJourneyPlan/`

* **`page.tsx`:**
    * **Purpose:** A `<Tabs>` layout container for the PJP section.
    * **Logic:** This is a **Server Component** that performs RBAC checks.
    * It conditionally renders the "PJP List" tab and the "PJP Verify" tab based on `hasPermission(user.role, 'permanentJourneyPlan.pjpList')` and `hasPermission(user.role, 'permanentJourneyPlan.pjpVerify')`.

* **`pjpList.tsx`:**
    * **Purpose:** Client component to list, filter, and create PJPs.
    * **Logic:** A **Client Component**.
    * **State:** Manages `pjps`, `users`, `dealers`, `loading`, filters, and a `newPjp` object for the creation form.
    * **Data Fetching:** Fetches from `/api/dashboardPagesAPI/permanent-journey-plan` with filters.
    * **Mutation:** `handleCreatePjp` opens a `<Dialog>` and makes a `POST` request to `/api/dashboardPagesAPI/permanent-journey-plan` with the `newPjp` data.

* **`pjpVerify.tsx`:**
    * **Purpose:** Client component for managers to approve or reject PJP submissions.
    * **Logic:** A **Client Component**.
    * **Data Fetching:** Fetches *only* pending PJPs from `/api/dashboardPagesAPI/permanent-journey-plan/pjp-verification`.
    * **Mutation:** The `columns` definition includes "Approve" and "Reject" buttons. The `handleVerification` function makes a `PUT` request to the dynamic API route `/api/dashboardPagesAPI/permanent-journey-plan/pjp-verification/${pjpId}` with the new `status` in the body.

---

#### `src/app/dashboard/reports/`

* **`page.tsx`:**
    * **Purpose:** The main `<Tabs>` layout for all reports.
    * **Logic:** A **Server Component** that performs heavy RBAC checks.
    * It renders a `<TabsTrigger>` and `<TabsContent>` for each report *only if* the user has the specific permission for it (e.g., `hasPermission(user.role, 'reports.dailyVisitReports')`).

* **`dailyVisitReports.tsx` / `salesOrders.tsx` / `technicalVisitReports.tsx` / `competitionReports.tsx`:**
    * **Purpose:** These are the client components for each respective report tab.
    * **Logic:** They all follow the *exact same pattern*:
        1.  **Client Component** (`'use client'`).
        2.  **State:** Manage `data: any[]`, `loading`, and filter states (`dateRange`, `regions`, `areas`).
        3.  **Data Fetching:** `useEffect` calls `fetchData`.
        4.  `fetchData` is an `async` function that builds a URL with query params from the filter state (e.g., `/api/dashboardPagesAPI/reports/sales-orders?startDate=...&regions=...`).
        5.  `useEffect` has the filter states in its dependency array, so it re-fetches automatically when a filter changes.
        6.  **Rendering:** They render `DataTableReusable` and pass it the `data`.

* **`dvrVpjp.tsx` & `salesVdvr.tsx`:**
    * **Purpose:** These are *analytical* reports that show ratios.
    * **Logic:** They follow the same pattern as other reports, but they call their own unique API endpoints (e.g., `/api/dashboardPagesAPI/reports/dvr-v-pjp`) which return pre-calculated, transformed data from the server (via `reports-transformer.ts`).

---

#### `src/app/dashboard/scoresAndRatings/`

* **`page.tsx`:**
    * **Purpose:** A `<Tabs>` layout for "Dealer Scores" and "Salesman Ratings".
    * **Logic:** A **Server Component** that uses `hasPermission` to conditionally render the tabs.

* **`salesmanRatings.tsx`:**
    * **Purpose:** Client component to view and set ratings for salesmen.
    * **Logic:** A **Client Component**.
    * **Data Fetching:** Fetches from `/api/dashboardPagesAPI/scores-ratings`.
    * **Mutation:** Renders a "Set Rating" button in the table. This opens a `<Dialog>` where an admin can set a 1-5 star rating.
    * `handleRatingSubmit` makes a `POST` request to `/api/dashboardPagesAPI/scores-ratings` with the `userId` and new `rating`.
* **`dealerScores.tsx`:**
    * **Purpose:** (Inferred) A client component to display dealer scores.
    * **Logic:** A **Client Component**. It likely fetches from an endpoint like `/api/dashboardPagesAPI/dealer-scores` and displays the read-only scores in a `DataTableReusable`.

---

#### `src/app/dashboard/slmAttendance/`

* **`page.tsx`:**
    * **Purpose:** The "Salesman Attendance" report page.
    * **Logic:** A **Client Component** (`'use client'`).
    * **Pattern:** It follows the standard report pattern: `useState` for `data` and `dateRange` filter.
    * **Data Fetching:** `useEffect` calls `fetchData` which fetches from `/api/dashboardPagesAPI/slm-attendance` with the date range as query params.
    * **Rendering:** Renders `DataTableReusable`.

---

#### `src/app/dashboard/slmGeotracking/`

* **`page.tsx`:**
    * **Purpose:** The "Salesman Journey" tracking page with a map.
    * **Logic:** This is a complex **Client Component** (`'use client'`).
    * **State:** Manages `selectedUser`, `selectedDate`, `coordinates: LatLngTuple[]`, and `loading`.
    * **Dynamic Import:** It uses `dynamic(() => import('react-leaflet'), { ssr: false })` to load the Leaflet map components *only on the client side*, as they do not support Server-Side Rendering.
    * **Data Fetching:** The `handleFetchTrack` function makes a `POST` request to `/api/dashboardPagesAPI/slm-geotracking` with the `userId` and `date` in the body.
    * **Rendering:** When the API returns an array of coordinates, the `coordinates` state is updated. This triggers the map to re-render, drawing a `<Polyline>` using the new `coordinates` state. It also uses a custom `<FitBounds />` component to automatically zoom the map to fit the drawn path.

---

#### `src/app/dashboard/slmLeaves/`

* **`page.tsx`:**
    * **Purpose:** The "Salesman Leave" approval page.
    * **Logic:** A **Client Component** (`'use client'`).
    * **Data Fetching:** Fetches from `/api/dashboardPagesAPI/slm-leaves` with filters.
    * **Mutation:** The `DataTableReusable` has an "Actions" button that opens a `<Dialog>`. This dialog contains radio buttons for "Approve"/"Reject" and an input for `adminRemarks`.
    * The `handleUpdateLeave` function makes a `PUT` request to `/api/dashboardPagesAPI/slm-leaves`, sending the `leaveId`, new `status`, and `adminRemarks`. It re-fetches the data on success.

---

#### `src/app/dashboard/teamOverview/`

* **`page.tsx`:**
    * **Purpose:** A `<Tabs>` layout container for the "Team Overview" section.
    * **Logic:** A **Server Component** that performs RBAC checks.
    * It conditionally renders the "Team" tab and the "Salesman Live Location" tab based on `hasPermission(user.role, 'teamOverview.teamTabContent')` and `hasPermission(user.role, 'teamOverview.salesmanLiveLocation')` respectively.

* **`teamTabContent.tsx`:**
    * **Purpose:** The client component for the main "Team" tab.
    * **Logic:** A **Client Component**.
    * **Data Fetching:** Fetches data from `/api/dashboardPagesAPI/team-overview/dataFetch`.
    * **Mutation (Edit Role):** The "Actions" column has a button that opens a dialog to "Change Role". The "Save" button in this dialog makes a `POST` request to the *specialized, secure* endpoint `/api/dashboardPagesAPI/team-overview/editRole`, which contains the `canAssignRole` RBAC check.
    * **Mutation (Edit Mapping):** It has similar dialogs and handlers (`handleEditMapping`, `handleEditDealerMapping`) that call their own specific `PUT` API endpoints (`/api/dashboardPagesAPI/team-overview/editMapping`, etc.).

* **`salesmanLiveLocation.tsx`:**
    * **Purpose:** The client component for the "Live Location" tab.
    * **Logic:** A **Client Component**.
    * **Data Fetching:** `useEffect` fetches from `/api/dashboardPagesAPI/team-overview/slmLiveLocation` to get the *last known location* of all users.
    * **Dynamic Import:** It uses `dynamic(() => import('react-leaflet'), { ssr: false })` to load the Leaflet map.
    * **Rendering:** It renders the `<MapContainer>` and then maps over the fetched `locations` to render a `<Marker>` for each user's last known location.

---

#### `src/app/dashboard/users/`

* **`page.tsx`:**
    * **Purpose:** The Server Component wrapper for the User Management page.
    * **Logic:** A **Server Component**.
    * It fetches the `adminUser`'s data (needed for prop passing) on the server.
    * It renders the main client component: `<UsersManagement adminUser={adminUser} />`.

* **`userManagement.tsx`:**
    * **Purpose:** The main interactive client component for managing users.
    * **Logic:** A **Client Component** (`'use client'`).
    * **State:** Manages `users: User[]`, `loading`, `error`, `formData` (for the create/edit modal), and `editingUser: User | null`.
    * **Data Fetching:** `useEffect` on mount calls `fetchUsers()`. `fetchUsers` is an `async` function that does `fetch('/api/users')`, gets the JSON, and calls `setUsers(data.users)`.
    * **Mutations:**
        * `handleCreateUser`: `POST`s the `formData` to `/api/users`.
        * `handleUpdateUser`: `PUT`s the `formData` to `/api/users/${editingUser.id}`.
        * `handleDeleteUser`: `DELETE`s from `/api/users/${userId}`.
        * All mutation handlers call `fetchUsers()` on success to refresh the table.
    * **Rendering:** It renders the `DataTableReusable` component, passing it the `users` state and a `columns` definition that includes the "Edit" and "Delete" buttons.

* **`bulkInvite.tsx`:**
    * **Purpose:** A client component (rendered as a `<Dialog>`) for bulk-inviting users via file upload.
    * **Logic:** A **Client Component**.
    * **State:** Manages the parsed data from the uploaded file (`parsedData`).
    * **File Parsing:** It uses `read-excel-file` library to parse the contents of an uploaded Excel file into a JSON array.
    * **Mutation:** The `handleSubmit` function makes a `POST` request, sending the `parsedData` array to the `/api/users/bulk-invite` endpoint.

---

#### `src/app/dashboard/welcome/`

* **`page.tsx`:**
    * **Purpose:** A simple "Welcome" page, likely for new users.
    * **Logic:** A simple **Server Component** that renders static welcome text and a button/link directing the user to `/setup-company` if their company isn't set up, or to the main dashboard.

---

### `src/app/home/`

* **Purpose:** A secondary "home" area for logged-in users, for tools *outside* the main admin dashboard.
* **`layout.tsx` & `homeShell.tsx`:**
    * **Logic:** This defines a *different* layout. Instead of the main `app-sidebar`, it renders the `conditionalSidebar.tsx`, which has static links to "Cemtem Chat" and "Report Generator".
* **`page.tsx`:**
    * **Purpose:** The `/home` landing page.
    * **Logic:** A Server Component that fetches the `user` and passes it to the `section-cards.tsx` component. `section-cards` then uses `hasPermission` to conditionally render the large clickable cards (e.g., showing the "Custom Report Generator" card only if the user has the permission).
* **`home/cemtemChat/page.tsx`:**
    * **Purpose:** The frontend UI for the chatbot.
    * **Logic:** A **Client Component** (`'use client'`).
    * It uses the `useChat` hook from the `ai` package (Vercel AI SDK).
    * It renders an `<Input>` and a "Send" button, with `onSubmit` handled by the `handleSubmit` function from `useChat`.
    * It maps over the `messages` array from the `useChat` hook to display the conversation history.
* **`home/customReportGenerator/page.tsx`:**
    * **Purpose:** The UI for building custom reports.
    * **Logic:** A highly interactive **Client Component**.
    1.  It uses `useState` to manage all user selections: `selectedTable`, `selectedHeaders`, `dateRange`, `filters`.
    2.  It uses the `CUSTOM_TABLE_HEADERS` constant to populate the header `MultiSelect` component dynamically when `selectedTable` changes.
    3.  `handleGenerateReport`: This function constructs a `URLSearchParams` object from all the state variables.
    4.  It makes a `fetch` call to the generic API endpoint: `/api/custom-report-generator?${queryParams.toString()}`.
    5.  The `reportData` state is updated with the JSON response, which causes the `DataTableReusable` component to re-render, displaying the custom report.

---

### `src/app/setup-company/`

* **Purpose:** The one-time company onboarding flow for the *first* admin of a new organization.
* **`page.tsx`:**
    * **Logic:** A Server Component that fetches the user's email from their session (`getTokenClaims`) and passes it as a prop to the main form.
* **`setupCompanyForm.tsx`:**
    * **Purpose:** The main interactive, multi-step form.
    * **Logic:** A **Client Component**.
    1.  It uses `useState` to manage the form state (`companyName`, `adminFirstName`, etc.) and the current step (`step`).
    2.  It renders different form parts based on the `step`. Step 2 renders the `CompanyLocations` component.
    3.  **`handleSubmit`:** The final "Submit" button makes a `POST` request to `/api/setup-company`. This API route then calls the `company-service.ts` logic to create the `Company` in WorkOS, create the `Company` in Prisma, and create the `User` (admin) in Prisma, all in one transaction.
    4.  On success, it uses `router.push('/dashboard')` to send the user to their new dashboard.

---

## `src/components/`

This folder contains your custom, reusable React components, which are built using the primitives from `src/components/ui/`. These are the "smart" components that contain most of the application's frontend logic.

### `src/components/app-sidebar.tsx`

* **File:** `src/components/app-sidebar.tsx`
* **Purpose:** Renders the main navigation sidebar for the entire `/dashboard` layout. This component is the **core of the client-side RBAC (Role-Based Access Control)**.
* **Logic:**
    1.  **Props:** It receives the `user` object (which contains their `role`) and the `company` object.
    2.  **Hooks:** It uses `usePathname()` to get the current URL path, which is used to apply "active" styling to the correct link. It also uses the custom `useMobile()` hook to determine if it should render in mobile (`<Sheet>`) or desktop (`<div class="hidden...">`) mode.
    3.  **Core RBAC Logic:** The component defines a `sidebarSections` array. This array's `items` are *dynamically generated*. Each link is wrapped in a conditional check using `hasPermission` from `lib/permissions.ts`.
        * **Example:** `hasPermission(user.role, 'users') && { title: 'User Management', href: '/dashboard/users', icon: Users }`
        * This line means the "User Management" link will *not even exist in the array* if the user's role does not have the `'users'` permission.
    4.  **Rendering:** The component maps over this filtered `sidebarSections` array to render the links. This ensures that a user **never even sees a link** to a page they are not authorized to access.

### `src/components/site-header.tsx`

* **File:** `src/components/site-header.tsx`
* **Purpose:** Renders the persistent top navigation bar (header) for the `/dashboard` layout.
* **Logic:**
    1.  **Props:** It receives the `user`, `company`, and `onSidebarToggle` (a function from the `dashboardShell.tsx` to open the mobile sidebar).
    2.  **Mobile Toggle:** It renders a `<Button>` that is only visible on mobile. Its `onClick` handler calls the `onSidebarToggle` prop, which sets the state in the parent `dashboardShell` to open the mobile `<Sheet>`.
    3.  **User Menu:** It renders the user's name and an `Avatar`. This is wrapped in a `DropdownMenu`.
    4.  **Logout Action:** The dropdown menu contains a "Log out" item. This is a simple `<a>` tag: `<a href="/account/logout/route">Log out</a>`. Clicking this link navigates the user to the `/account/logout` API route, which destroys their session cookie and redirects them to the public home page.

### `src/components/data-table-reusable.tsx`

* **File:** `src/components/data-table-reusable.tsx`
* **Purpose:** A single, generic component to render all data tables in the app (e.g., Users, Dealers, Reports). It uses TanStack Table (`@tanstack/react-table`).
* **Logic:**
    1.  **Generics:** It uses TypeScript generics (`<TData, TValue>`) so it can accept any data shape (`TData`) and any column value type (`TValue`), making it completely reusable.
    2.  **Props:** It takes `columns` (the table definition) and `data` (the array of records). It also optionally takes a `filterColumn` string (e.g., "email") and `filterColumnName` (e.g., "Email") to enable a search box.
    3.  **State Management:** It uses `useState` to manage all of TanStack Table's internal states: `sorting`, `columnFilters`, `pagination`, and `rowSelection`.
    4.  **`useReactTable` Hook:** This is the core of the component. It initializes the table by passing the `data`, `columns`, and all the state handlers (e.g., `onSortingChange: setSorting`).
    5.  **Client-Side Filtering:** If the `filterColumn` prop is provided, it renders an `<Input>` component. Its `onChange` handler calls `table.getColumn(filterColumn)?.setFilterValue(event.target.value)`, which triggers the table to filter its data *in the browser*.
    6.  **Rendering:** It programmatically renders the table using the `table` instance:
        * `table.getHeaderGroups().map(...)` renders the `<thead>` and `<th>`.
        * `table.getRowModel().rows.map(...)` renders the `<tbody>`, `<tr>`, and `<td>` for the current page.
    7.  **Pagination:** It renders "Previous" and "Next" buttons, using `table.getCanPreviousPage()` and `table.getCanNextPage()` to disable them appropriately, and `table.previousPage()` / `table.nextPage()` for their `onClick` handlers.

### `src/components/reusable-user-locations.tsx`

* **File:** `src/components/reusable-user-locations.tsx`
* **Purpose:** This is a custom React hook (`useUserLocations`) to fetch and cache the list of unique regions and areas associated with users.
* **Logic:**
    1.  **State:** It uses `useState` to store `locations` (an object with `regions: string[]` and `areas: string[]`), `loading`, and `error`.
    2.  **`useEffect`:** On component mount, it fires a `fetch` request to the `/api/users/user-locations` endpoint.
    3.  **Data Fetching:** When the API returns the data (e.g., `{ regions: ['North', 'South'], areas: ['Area1', 'Area2'] }`), it updates the `locations` state.
    4.  **Return Value:** The hook returns `{ locations, loading, error }`.
    5.  **Usage:** This allows any component (like a report filter) to call `const { locations } = useUserLocations()` to easily get the data needed to populate region and area filter dropdowns, without duplicating fetch logic.

### `src/components/reusable-dealer-locations.tsx`

* **File:** `src/components/reusable-dealer-locations.tsx`
* **Purpose:** Identical in pattern to `useUserLocations`, but for dealer-specific locations.
* **Logic:**
    1.  It's a custom hook named `useDealerLocations`.
    2.  It fetches data from a different API endpoint: `/api/dashboardPagesAPI/dealerManagement/dealer-locations`.
    3.  It returns a richer `locations` object, including `regions`, `areas`, `pinCodes`, and `dealerNames`, as this data is specific to the `Dealer` model.

### `src/components/multi-select.tsx`

* **File:** `src/components/multi-select.tsx`
* **Purpose:** A reusable component to create a multi-select dropdown with search, built from shadcn's primitive components.
* **Logic:**
    1.  **Props:** `options` (the full list of strings), `selected` (the array of currently selected strings), `onChange` (a callback function to update the parent's `selected` state), and `placeholder`.
    2.  **State:** Uses `useState` to manage `inputValue` (the search text) and `open` (whether the popover is visible).
    3.  **Rendering Badges:** It maps over the `selected` prop to render a list of `<Badge>` components, each with an "x" button to remove it. Clicking the "x" calls `onChange` with that item filtered out.
    4.  **Dropdown Logic:**
        * It uses a `<Popover>` that contains a `<Command>` component.
        * The `<CommandInput>` updates the `inputValue` state on every keystroke.
        * It filters the `options` prop based on the `inputValue` *before* mapping them to `<CommandItem>`s, creating the search functionality.
        * **`onSelect`**: When a `CommandItem` is clicked, its `onSelect` handler calls an internal `handleSelect` function.
        * **`handleSelect`**: This function checks if the item is already in the `selected` prop. If it is, it calls `onChange` to *remove* it. If it isn't, it calls `onChange` to *add* it.

### `src/components/chart-area-reusable.tsx`

* **File:** `src/components/chart-area-reusable.tsx`
* **Purpose:** A simple, reusable wrapper for `recharts` to render a standardized Area Chart.
* **Logic:**
    1.  **Props:** It's a "dumb" component. It accepts `data` (the array of objects to plot), `xAxisDataKey` (the object key for the x-axis), and `areaDataKey` (the object key for the y-axis).
    2.  **`recharts` Implementation:** It uses `ResponsiveContainer` to make the chart fluid.
    3.  It maps the props directly to the `recharts` components:
        * `<XAxis dataKey={xAxisDataKey} />`
        * `<YAxis />`
        * `<Area dataKey={areaDataKey} />`
    4.  This allows you to quickly create a consistent-looking area chart anywhere in the app by just providing the data and keys.

### `src/components/conditionalSidebar.tsx`

* **File:** `src/components/conditionalSidebar.tsx`
* **Purpose:** An alternative, context-specific sidebar used for the `/home` section of the app (Cemtem Chat, Report Generator).
* **Logic:**
    1.  Unlike `app-sidebar.tsx`, this component's links are **static and not based on RBAC**.
    2.  It defines a fixed list of links: "Cemtem Chat", "Custom Report Generator", and "Back to Dashboard".
    3.  It's a simple, non-permissioned navigation for a specific sub-section of the application, separate from the main dashboard.

### `src/components/section-cards.tsx`

* **File:** `src/components/section-cards.tsx`
* **Purpose:** Renders the large, clickable navigation cards on the `/home` page.
* **Logic:**
    1.  **Props:** Takes the `user` object to perform RBAC checks.
    2.  **Core RBAC Logic:** Similar to `app-sidebar.tsx`, it defines a `sections` array. Each object in this array is conditionally added based on a `hasPermission` check.
        * **Example:** `hasPermission(user.role, 'customReportGenerator') && { ... }`.
    3.  **Rendering:** It maps over this *filtered* `sections` array and renders a `<Card>` component for each. The entire card is wrapped in a Next.js `<Link>` component, making the whole card a single navigation target.
    4.  This ensures that a user only sees a card for a feature (like "Custom Report Generator") if their role permits it.

### `src/components/data-comparison-calculation.tsx`

* **File:** `src/components/data-comparison-calculation.tsx`
* **Purpose:** A small, reusable component for displaying a key statistic along with its percentage change from a previous period (e.g., "1,250 | +15.2% from last month").
* **Logic:**
    1.  **Props:** `title` (e.g., "Total Visits"), `currentValue` (e.g., 1250), `previousValue` (e.g., 1000).
    2.  **Calculation:** The core logic is the percentage change calculation:
        * `const percentageChange = ((currentValue - previousValue) / previousValue) * 100`.
        * It includes a crucial check: `if (previousValue === 0) { ... }` to handle divide-by-zero errors, showing `0%` change in that case.
    3.  **Conditional Styling:** It uses the `cn` utility to conditionally apply text colors based on the result:
        * `'text-green-600'` if `percentageChange > 0`.
        * `'text-red-600'` if `percentageChange < 0`.
        * `'text-gray-500'` if `percentageChange === 0`.
    4.  It renders the `title`, the formatted `currentValue`, and the formatted `percentageChange` string with its conditional coloring.

---

## `src/lib/`

This is the "brain" of the application, containing shared business logic, database instances, and utility functions.

### `src/lib/prisma.ts`

* **File:** `src/lib/prisma.ts`
* **Purpose:** To instantiate and export a single, shared instance of the Prisma Client for database access.
* **Logic:**
    1.  **Singleton Pattern:** It implements a "singleton" pattern specifically to handle the Next.js development environment's "hot reload" feature.
    2.  **The Code:** `const prisma = globalThis.prisma ?? new PrismaClient()`.
    3.  **How it works:**
        * It checks a global variable `globalThis.prisma`.
        * **On first run:** `globalThis.prisma` is undefined, so `new PrismaClient()` is called, creating a new database connection pool.
        * **In Development:** The line `if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma` then saves this new instance to the `globalThis` object.
        * **On Hot Reload:** When the code re-runs, `globalThis.prisma` is *no longer* undefined. The `??` operator returns the *existing* instance instead of creating a new one.
    4.  **Result:** This prevents the application from creating a new `PrismaClient` (and a new connection pool) on every single file save, which would quickly exhaust the database's connection limit.

### `src/lib/permissions.ts`

* **File:** `src/lib/permissions.ts`
* **Purpose:** This file defines the **Feature-Based Access Control** (RBAC) system. It answers the question, "What can a user *do*?".
* **Logic:**
    1.  **`WorkOSRole` Type:** Defines all possible roles in the system as a TypeScript type (e.g., `'president'`, `'manager'`, `'junior-executive'`).
    2.  **`DashboardPermissions` Interface:** A deeply nested *interface* that acts as a blueprint for every single permission-gated feature in the app. For example: `teamOverview: { teamTabContent: boolean, salesmanLiveLocation: boolean }`.
    3.  **`WORKOS_ROLE_PERMISSIONS` Object:** This is the "permission matrix." It's a massive `Record` that maps each `WorkOSRole` to a fully implemented `DashboardPermissions` object, setting `true` or `false` for every feature. For example, a `'junior-executive'` has `teamOverview.salesmanLiveLocation: false`, while a `'manager'` has it set to `true`.
    4.  **`PermPath` Type:** A clever utility type that "flattens" the nested `DashboardPermissions` interface into a union of dot-notation strings (e.g., `"teamOverview.salesmanLiveLocation"`, `"reports.dailyVisitReports"`). This provides strong type-checking when calling the `hasPermission` function.
    5.  **`hasPermission` Function:** This is the key utility used by frontend components (like the sidebar).
        * It takes the user's `role` and a `feature` path (like `'reports.dailyVisitReports'`).
        * It looks up the permissions object for that `role` from the `WORKOS_ROLE_PERMISSIONS` matrix.
        * It uses a helper function `getByPath` which splits the feature path by `.` (e.g., `['reports', 'dailyVisitReports']`) and uses `.reduce()` to safely "walk" down the nested permission object to find the final `boolean` value.
        * This function is what allows the UI to hide or show links/buttons based on the user's role.

### `src/lib/roleHierarchy.ts`

* **File:** `src/lib/roleHierarchy.ts`
* **Purpose:** This file defines the **Hierarchical Access Control** system. It answers the question, "Who can a user *manage*?". This is separate from *feature* permissions.
* **Logic:**
    1.  **`ROLE_HIERARCHY` Array:** A simple string array, which is the *single source of truth* for authority. It's ordered from most powerful (`'president'`) to least powerful (`'junior-executive'`).
    2.  **`getVisibleRoles` Function:** This is a UI helper function.
        * It finds the index of the `currentUserRole` in the `ROLE_HIERARCHY` array.
        * It returns `ROLE_HIERARCHY.slice(userRoleIndex + 1)`. This provides the frontend (e.g., the User Management modal) with a list of *only* the roles that are junior to the current user.
    3.  **`canAssignRole` Function:** This is the critical *server-side security function* used in API routes.
        * It gets the `currentUserIndex` and the `targetRoleIndex` from the `ROLE_HIERARCHY` array.
        * **The Logic:** It returns `true` *only if* `currentUserIndex !== -1 && targetRoleIndex !== -1 && currentUserIndex < targetRoleIndex`.
        * This simple, robust check prevents any user from assigning a role that is equal to or higher than their own.

### `src/lib/utils.ts`

* **File:** `src/lib/utils.ts`
* **Purpose:** A collection of general utility functions, primarily for styling.
* **Logic:**
    1.  **`cn` Function:** This is the most important function in the file, essential for using `shadcn-ui`.
    2.  **The Code:** `export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }`.
    3.  **How it works:**
        * **`clsx`:** This utility (from `clsx`) intelligently combines class names. It's great for conditional classes, e.g., `clsx('p-4', { 'font-bold': isBold })`.
        * **`twMerge`:** This utility (from `tailwind-merge`) solves a common Tailwind problem. If you have classes `p-4` and `p-6` on the same element, `twMerge` intelligently removes the `p-4` and keeps only the last, overriding class (`p-6`).
        * **Together:** `cn` allows developers to pass conditional classes *and* overriding classes to components without worrying about style conflicts.

### `src/lib/download-utils.ts`

* **File:** `src/lib/download-utils.ts`
* **Purpose:** Provides client-side functions for exporting data from UI tables into downloadable files (CSV, Excel).
* **Logic:**
    1.  **`exportToCsv`:**
        * **Input:** `data` (an array of JSON objects) and a `filename`.
        * **Conversion:** It uses the `csv-stringify` library. The `stringify(data, { header: true }, ...)` call converts the array of objects into a single, large CSV-formatted string, including the object keys as the header row.
        * **Blob Creation:** It creates a `new Blob([csv], { type: 'text/csv;charset=utf-8;' })`. A Blob is a file-like object that exists in the browser's memory.
        * **DOM Hack:** This is the standard "file download" trick in browsers.
            * It creates a temporary `<a>` (link) element in memory: `document.createElement('a')`.
            * It creates a temporary URL for the Blob: `url = URL.createObjectURL(blob)`.
            * It sets the link's `href` to this `url` and `download` attribute to the `filename`.
            * It programmatically "clicks" the hidden link: `link.click()`. This triggers the browser's download prompt.
            * **Cleanup:** It removes the temporary URL: `URL.revokeObjectURL(url)`.
    2.  **`exportToExcel`:** The logic is almost identical, but it uses the `exceljs` library.
        * It creates a `new ExcelJS.Workbook()`.
        * It adds a worksheet: `workbook.addWorksheet('Sheet1')`.
        * It adds headers and then iterates `data` using `worksheet.addRow()` for each object.
        * It generates an `ArrayBuffer` from the workbook: `workbook.xlsx.writeBuffer()`.
        * It creates a Blob with the Excel-specific MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
        * It performs the same DOM "download" trick with the `<a>` tag.

### `src/lib/company-service.ts`

* **File:** `src/lib/company-service.ts`
* **Purpose:** A server-side-only service class that encapsulates all business logic related to the initial company setup and onboarding.
* **Logic:**
    1.  **`'server-only'`:** This import ensures that this file can *never* be accidentally imported into a client component, which would leak server secrets (like the WorkOS API key).
    2.  **`createCompanyAndAdmin` Method:** This is the core logic for the onboarding flow.
        * **Input:** Takes `companyName`, `userEmail`, `userFirstName`, etc.
        * **External API Call:** It first calls the WorkOS API to create a new organization: `workos.organizations.createOrganization({ name: companyName })`.
        * **External API Call 2:** It then immediately invites the new admin to this organization: `workos.userManagement.createInvitation({ email: userEmail, ... })`.
        * **Database Transaction:** It wraps the database logic in `prisma.$transaction`. This ensures that if *any* database step fails, *all* steps are rolled back, preventing partial data.
        * **Create Company:** `prisma.company.create({ ... })`. It saves the `companyName` and, crucially, the `workosOrganizationId` returned from the API call.
        * **Create Admin User:** `prisma.user.create({ ... })`. It creates the user, gives them the `'senior-manager'` role (the default admin role), and links them to the new `companyId`. It also saves the `workosUserId` from the invitation response.
        * **Return:** It returns the newly created company and user.

### `src/lib/shared-zod-schema.ts`

* **File:** `src/lib/shared-zod-schema.ts`
* **Purpose:** To define reusable Zod schemas for validating data. This ensures that data is valid *both* on the client-side (before sending) and on the server-side (before processing).
* **Logic:**
    1.  **`emailSchema`:** Defines a reusable schema for emails: `z.string().email({ message: "Invalid email address." })`. This checks that a string is not empty and is formatted like an email.
    2.  **`bulkInviteSchema`:** This is a more complex schema used by the "Bulk Invite" feature.
        * `z.array(z.object({ email: emailSchema, ... }))`: It defines that the expected input is an *array* of objects.
        * Each object in the array *must* have an `email` field that *must* validate against the `emailSchema` defined above.
    3.  **How it's used:** These schemas are used in API routes (e.g., `/api/users/bulk-invite`) to validate incoming data. `bulkInviteSchema.safeParse(body)` is called, and if it fails, the API returns a 400 Bad Request error *before* even attempting to call WorkOS or the database, making the backend more secure and robust.

### `src/lib/reports-transformer.ts`

* **File:** `src/lib/reports-transformer.ts`
* **Purpose:** A server-side utility to transform raw, nested data from Prisma into a "flattened" format that is ready for the frontend's charts and tables.
* **Logic:**
    1.  **`transformDvrVpjpData`:** This function takes the raw data for the "DVR vs PJP" report. The raw data is likely a list of PJP records, each with a *list* of associated DVRs (`_count: { dailyVisitReports: number }`).
    2.  **Data Aggregation & Flattening:** The function iterates over this raw data using `.map()`. For each PJP record, it creates a new, simple object.
    3.  **Example Transformation:**
        * **Raw:** `{ id: 'pjp1', planDate: '...', user: { firstName: 'John' }, _count: { dailyVisitReports: 5 } }`
        * **Transformed:** `{ pjpDate: '...', salesmanName: 'John', pjpId: 'pjp1', totalVisits: 5, status: '...' }`
    4.  **Why?** This keeps the frontend component (`dvrVpjp.tsx`) "dumb" and clean. All complex data aggregation and shaping are handled on the server, and the frontend component just receives the simple, flat array it needs to render.

### `src/lib/Reusable-constants.ts`

* **File:** `src/lib/Reusable-constants.ts`
* **Purpose:** To store application-wide constant values, primarily for populating UI dropdowns and filters.
* **Logic:**
    1.  It exports simple, hardcoded string arrays.
    2.  **`regionsList`**: `['North', 'South', 'East', 'West', 'Central']`.
    3.  **`areaList`**: `['Area1', 'Area2', 'Area3', ...]`.
    4.  **`visitTypes`**: `['Dealer', 'Sub-Dealer', 'Project', ...]`.
    5.  **How they are used:** These constants are imported by frontend components (e.g., `listDealers.tsx`, `dailyVisitReports.tsx`) to populate filter dropdowns (`<Select>`) and multi-select components (`<MultiSelect>`). This ensures consistency, avoids typos, and centralizes UI-facing data.

---

## `src/hooks/`

This folder contains custom React hooks, which are reusable, stateful logic functions that can be shared across multiple components.

### `src/hooks/use-mobile.ts`

* **File:** `src/hooks/use-mobile.ts`
* **Purpose:** This is a client-side hook used to determine if the user's device is currently in a "mobile" viewport (i.e., has a small screen width). This is critical for making components responsive.
* **Logic:**
    1.  **State:** It defines a single piece of state using `useState`: `const [isMobile, setIsMobile] = useState(false);`.
    2.  **`useEffect` Hook:** The core logic is wrapped in a `useEffect` hook that runs *only once* when the component first mounts, thanks to the empty dependency array `[]`.
    3.  **Event Listener:**
        * Inside the `useEffect`, it defines a function `handleResize`. This function checks the window's width: `setIsMobile(window.innerWidth < 768);`. The `768px` threshold (corresponding to Tailwind's `md` breakpoint) is the hardcoded definition of "mobile" for this app.
        * It adds an event listener to the browser's `window` object: `window.addEventListener('resize', handleResize);`. This makes the `handleResize` function execute every time the user resizes their browser.
    4.  **Initial Check:** After adding the listener, it *immediately* calls `handleResize()` to set the initial state (mobile or desktop) when the component first loads.
    5.  **Cleanup Function:** The `useEffect` hook returns a cleanup function: `return () => window.removeEventListener('resize', handleResize);`. This is critical for performance. When the component unmounts, this function runs, removing the event listener so it doesn't continue to run in the background.
    6.  **Return Value:** The hook returns the `isMobile` boolean value.
* **Usage:** Components like `app-sidebar.tsx` use this hook: `const isMobile = useMobile();`. They can then use this boolean to conditionally render different JSX, for example:
    * **If `isMobile` is true:** Render the sidebar as a slide-out `<Sheet>`.
    * **If `isMobile` is false:** Render the sidebar as a permanent, visible `<div>` on the left.

---

## `src/proxy.ts`

* **File:** `src/proxy.ts`
* **Purpose:** This file is intended to set up a custom development proxy, but it is currently empty.
* **Logic:**
    * **As-is:** The file is empty. It performs no logic.
    * **Intended Purpose:** In a Next.js project, this file (often used with `next-http-proxy-middleware`) would be used to proxy API requests during development. For example, it could forward all requests from `/api/` to a separate, already running backend (e.g., `http://api.example.com`). In this project, the API routes are *part of* the Next.js app itself (in `src/app/api/`), so a custom proxy is not strictly necessary.