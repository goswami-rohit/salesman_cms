# Brixta Salesman CMS

Multi-Tenant SaaS for Brixta Salesman CMS project. This is a comprehensive Sales Force Automation (SFA) and Customer Relationship Management (CRM) platform, appearing to be tailored for the cement industry ("Brixta Bestcement").

It functions as a multi-tenant SaaS application, enabling different companies to manage their sales teams, track field activities, manage dealer networks, and report on sales data. The system is built with a modern web stack and features a sophisticated, multi-layered Role-Based Access Control (RBAC) system for managing permissions.

-----

## Core Features (Based on Database Schema)

The application's functionality is extensive, with the database schema revealing the following core modules:

  * **Multi-Tenancy:** The system is built around `Company` and `User` models, where each user is tied to a specific company, and each company is linked to a WorkOS organization (`workosOrganizationId`) for authentication.
  * **User Hierarchy:** Users have roles (e.g., 'Manager', 'Executive') and a clear reporting structure (`reportsToId`), allowing for managerial oversight.
  * **Dealer Management:** A complex `Dealer` model that supports both dealers and sub-dealers (via a self-referencing `parentDealerId`). It stores extensive details, including:
      * Verification Status (`verificationStatus`)
      * Location & Potential (`latitude`, `longitude`, `totalPotential`)
      * Detailed Godown, Residential, and Bank information
      * Document URLs (Trade License, Shop Pic, etc.)
  * **Field Activity Reporting:**
      * **Daily Visit Reports (DVR):** Salesmen log visits to dealers/sub-dealers, recording check-in/out times, location, order values, collections, and feedback.
      * **Technical Visit Reports (TVR):** For technical staff to log site visits, including site stage, brand in use, quality complaints, and promotional activities.
  * **Planning & Tasking:**
      * **Permanent Journey Plans (PJP):** Managers (`createdById`) can create weekly/monthly visit plans for their team members (`userId`), which can then be verified (`verificationStatus`).
      * **Daily Tasks:** A simpler system for assigning daily tasks from managers to salesmen.
  * **Sales & Operations:**
      * **Sales Orders:** Allows salesmen to place orders, capturing party details, delivery info, payment terms, and item specifics (PPC/OPC, grade).
      * **Competition Reporting:** A dedicated module for logging competitor brand activity, pricing, and schemes.
  * **Salesman Tracking & HR:**
      * **Attendance:** A `SalesmanAttendance` module for daily clock-in/out with location and image capture.
      * **Geo-Tracking:** A `GeoTracking` table logs detailed, time-based location data for users, including speed, altitude, and distance traveled.
      * **Leave Applications:** A standard leave request and approval system.
  * **Promotions:** A gift inventory (`GiftInventory`) and allocation log (`GiftAllocationLog`) to track the distribution of promotional items.

-----

## Technical Stack

This project is built with a modern, type-safe stack:

  * **Framework:** Next.js (v16.0.1)
  * **Language:** TypeScript
  * **Database:** PostgreSQL
  * **ORM:** Prisma (v6.18.0)
  * **Authentication:** WorkOS (using `@workos-inc/authkit-nextjs` and `@workos-inc/node`)
  * **UI Components:** shadcn-ui, built on Radix UI and Tailwind CSS (inferred from dependencies like `@radix-ui/react-dialog`, `clsx`, `tailwind-merge`).
  * **Data Tables:** TanStack Table (`@tanstack/react-table`)
  * **Charts:** Recharts
  * **Maps:** Leaflet & React Leaflet
  * **Deployment:** Docker (see `docker-compose.yaml`)

-----

## Authentication & Multi-Tenancy (WorkOS)

Authentication is handled by **WorkOS**, which is purpose-built for multi-tenant SaaS applications.

1.  **Organizational Link:** The core of the multi-tenant structure lies in the link between the local `Company` model and a WorkOS Organization, using the `workosOrganizationId` field.
2.  **User Identity Link:** Similarly, the local `User` model is linked to a WorkOS User via the `workosUserId` field.
3.  **Auth Flow:**
      * A user logs in via the WorkOS Authkit.
      * Upon successful login, the app receives a set of claims (JWT). The API route `/api/me` uses `getTokenClaims()` to securely read these claims on the server.
      * The app uses the `sub` (subject) claim from the token to find the corresponding user in its own database (`where: { workosUserId: claims.sub }`).
      * This local `User` record contains the `role` and `companyId`, which are then used for all subsequent authorization checks.
4.  **Callback Handling:** The route `/auth/callback` properly handles the OAuth redirect from WorkOS, correctly reconstructing the URL in a proxied environment before passing it to the WorkOS `handleAuth` function.

-----

## Advanced Role-Based Access Control (RBAC) System

The project features a sophisticated, dual-layer RBAC system that is both powerful and secure. It separates the concepts of *hierarchical authority* (who can manage whom) from *feature permissions* (what a user can do).

### Layer 1: Role Hierarchy (Hierarchical Authority)

This layer, defined in `src/lib/roleHierarchy.ts`, governs the organizational structure and limits the scope of managerial actions.

  * **Fixed Hierarchy:** It defines a single, authoritative list of roles in order of seniority, from `president` (highest) to `junior-executive` (lowest).
  * **Purpose:** To control *who can manage whom*.
  * **Key Functions:**
      * `getVisibleRoles(currentUserRole)`: Used by the frontend to populate dropdowns, ensuring a manager can only see and assign roles that are *junior* to their own.
      * `canAssignRole(currentUserRole, targetRole)`: A critical server-side validation function that checks if a user has the authority to assign a specific role (i.e., their role index is *less than* the target role's index).

### Layer 2: Feature Permissions (Feature Access)

This layer, defined in `src/lib/permissions.ts`, controls access to specific features, pages, and data within the application.

  * **Granular Permissions:** It defines a `DashboardPermissions` interface, which is a detailed tree structure mapping out every single feature of the application (e.g., `dealerManagement.verifyDealers`, `reports.salesOrders`, `teamOverview.salesmanLiveLocation`).
  * **Permission Matrix:** The `WORKOS_ROLE_PERMISSIONS` object acts as a giant matrix, mapping each defined `WorkOSRole` to a specific `DashboardPermissions` object, which sets `true` or `false` for every feature.
  * **Purpose:** To control *what a user can see and do*.
  * **Key Function:**
      * `hasPermission(role, feature)`: A utility function used (primarily by the frontend) to check if the current user's role has access to a specific feature path. This is used to conditionally render sidebar links, buttons, and entire pages.

### System in Action: Role Synchronization

The API endpoint `/api/dashboardPagesAPI/team-overview/editRole` provides a perfect example of this dual-layer system working together. When a manager changes another user's role:

1.  **Authentication:** The server first gets the *manager's* role from their WorkOS token claims.
2.  **Layer 1 Check (Hierarchy):** It calls `canAssignRole(currentUserRole, newRole)`. If the manager is trying to assign a role equal or senior to their own, the request is rejected with a 403 Forbidden error. This check is performed on the server, not the client.
3.  **Synchronization Transaction:** If the hierarchy check passes, the server executes a transaction:
    a.  It updates the user's `roleSlug` in WorkOS using the WorkOS Node SDK (`workos.userManagement.updateOrganizationMembership`).
    b.  It updates the `role` in the local Prisma `User` table.

This ensures that the role is consistent between the authentication provider (WorkOS) and the application database (Prisma), and that all actions respect the strict organizational hierarchy.

-----

## Deployment

The project is configured for deployment using Docker. The `docker-compose.yaml` file defines a service named `slmcmsdashboard` using the `goswamirohit/slmcmsdashboard:vX` image. It maps port `4000` on the host to port `3000` inside the container and injects environment variables from `.env` and `.env.local` files.

### Example: Deploying to Ubuntu with Nginx Reverse Proxy

This guide outlines the steps to deploy the application on a standard Ubuntu server (e.g., an AWS EC2 instance) using Docker Compose and Nginx as a reverse proxy.

**1. Prerequisites**

  * **Server:** A running Ubuntu 22.04 (or later) server with SSH access and a non-root user with `sudo` privileges.
  * **Domain:** A registered domain name (e.g., `cms.yourcompany.com`) with its DNS "A" record pointed to your server's public IP address.
  * **Firewall:** A firewall (like `ufw`) configured to allow SSH (port 22), HTTP (port 80), and HTTPS (port 443).

**2. Install Docker and Docker Compose**

Follow the official instructions to set up Docker's repository and install Docker Engine and the Docker Compose plugin.

```bash
# 1. Uninstall old versions
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done

# 2. Set up Docker's apt repository
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Install Docker Engine and Compose
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**OR refer to the official DOCS at [https://docs.docker.com/engine/install/ubuntu/](https://docs.docker.com/engine/install/ubuntu/)**

**3. Install Nginx**

```bash
sudo apt-get update
sudo apt-get install nginx
```

**4. Prepare Application Files**

1.  Clone your repository or upload the project files (`docker-compose.yaml`, `.env`, `.env.local`) to a directory on your server (e.g., `/home/youruser/slmcms`).

    ```bash
    git clone <your-repo-url> /home/youruser/slmcms
    cd /home/youruser/slmcms
    ```

2.  Create your production environment files. This is crucial for security and functionality.

    ```bash
    # Create and add your DATABASE_URL, WORKOS_API_KEY, etc.
    nano .env

    # Create and add your NEXT_PUBLIC_APP_URL
    nano .env.local
    ```

    **IMPORTANT:** Your `.env.local` file **must** contain the correct public URL for WorkOS authentication to function, e.g.:
    `NEXT_PUBLIC_APP_URL=https://cms.yourcompany.com`

**5. Configure Nginx as a Reverse Proxy**

1.  Create a new Nginx configuration file for your site:

    ```bash
    sudo nano /etc/nginx/sites-available/slmcms
    ```

2.  Paste the following configuration, replacing `cms.yourcompany.com` with your domain. This forwards web traffic to the Docker container's exposed port `4000`.

    ```nginx
    server {
        listen 80;
        server_name cms.yourcompany.com;

        location / {
            # Forward requests to the local port 4000 mapped by Docker
            proxy_pass http://127.0.0.1:4000; 
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Support for WebSockets (if needed)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
    ```

3.  Enable this site by creating a symbolic link and test the Nginx configuration:

    ```bash
    sudo ln -s /etc/nginx/sites-available/slmcms /etc/nginx/sites-enabled/
    sudo nginx -t
    ```

4.  If the test is successful (`syntax is ok`), restart Nginx to apply the changes:

    ```bash
    sudo systemctl restart nginx
    ```

**6. Run the Application**

Navigate to your project directory and start the application using Docker Compose in detached (`-d`) mode.

```bash
cd /home/youruser/slmcms
docker compose up -d
```

This command will pull the `goswamirohit/slmcmsdashboard` image, create the network, and start the container in the background. Your application is now accessible via `http://cms.yourcompany.com`.

**7. (Recommended) Enable HTTPS with Certbot**

For a production environment, you must use HTTPS. The easiest way is with Certbot, which provides free SSL certificates from Let's Encrypt.

```bash
# Install Certbot and the Nginx plugin
sudo apt-get install certbot python3-certbot-nginx

# Run Certbot and follow the on-screen prompts
sudo certbot --nginx -d cms.yourcompany.com
```

Certbot will automatically obtain an SSL certificate, update your Nginx configuration to use it, and set up a renewal service. Your site will now be secure and accessible via `https://cms.yourcompany.com`.

-----

## Getting Started (Local Development)

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd salesman_cms
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root. Based on the schema and API files, you will need:

      * `DATABASE_URL`: Your PostgreSQL connection string.
      * `WORKOS_API_KEY`: Your WorkOS API Key.
      * `WORKOS_CLIENT_ID`: Your WorkOS Client ID.
      * `WORKOS_REDIRECT_URI`: e.g., `http://localhost:3000/auth/callback`
      * `NEXT_PUBLIC_APP_URL`: e.g., `http://localhost:3000`

4.  **Run database migrations:**
    This will set up your local PostgreSQL database with the schema from `prisma/schema.prisma`.

    ```bash
    npx prisma migrate dev
    ```

5.  **Generate Prisma Client:**
    The build script handles this, but you can run it manually:

    ```bash
    npx prisma generate
    ```

6.  **Run the development server:**

    ```bash
    npm run dev
    ```

The application should now be running on `http://localhost:3000`.