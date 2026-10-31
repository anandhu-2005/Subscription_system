# SubFlow — Full-Stack Subscription Management System
> **Built for the Odoo Hackathon 2026**  
> A unified platform managing the complete lifecycle of a subscription business: products, tiered plans, customers, subscriptions, automated recurring billing, invoices, payments, discounts, taxes, and revenue reporting.

---

## 🌟 Key Highlights & Demo Flow

SubFlow implements the complete end-to-end lifecycle requested for the challenge:

```
Admin creates a Product & Variants
               ↓
Admin creates a Subscription Plan (Daily / Weekly / Monthly / Yearly)
               ↓
Customer is added (with billing terms and address)
               ↓
A Subscription is created and activated (Draft → Quotation → Confirmed → Active)
               ↓
Automated Billing Engine detects due date & generates an Invoice
               ↓
Payment is recorded against the Invoice (Full or Partial)
               ↓
Dashboard & Reports update MRR, ARR, revenue charts, and payment logs
```

---

## 👥 User Roles & Access Control

The system implements Role-Based Access Control (RBAC) with 3 roles:

| Role | Permissions & Capabilities | Demo Account |
| :--- | :--- | :--- |
| **Admin** | Full system access: products, plans, taxes, discounts, customers, staff, subscriptions, invoices, payments, and system reports. | `admin@subflow.io` / `Admin@12345` |
| **Staff** | Manage customers, subscriptions, invoices, and payments. View products and plans. | `staff@subflow.io` / `Staff@12345` |
| **Customer** | Self-service subscriber portal: view only their own subscriptions and invoices, and pay outstanding balances. | `sarah.chen@nexusai.com` / `Customer@12345`<br>`marcus.vance@apexcloud.io` / `Customer@12345` |

> ⚡ **Hackathon Quick-Switcher**: A 1-click persona switcher is embedded in the UI navigation bar and login screen so evaluators can switch between Admin, Staff, and Customer views instantly without retyping credentials.

---

## ⚙️ Core Architecture & Features

### 1. Automated Recurring Billing Engine (Core Highlight)
- **Automatic Execution**: A background scheduler (`node-cron`) runs daily at midnight (`0 0 * * *`) to evaluate all active subscriptions where `nextBillingDate <= today`.
- **On-Demand Execution**: Admins and Staff can click **"Run Automated Billing"** anytime from the Dashboard, Invoices, or Sidebar to trigger an immediate billing run.
- **Duplicate Prevention**: Prevents generating multiple invoices for the same subscription billing period.
- **Date Advancement**: Automatically advances the subscription's `nextBillingDate` to the next period (+1 day, +1 week, +1 month, +1 year).
- **Line Items & Calculations**: Computes base plan fees, add-on product quantities, variants, promotional discounts, and applied taxes into an itemized invoice.

### 2. Product Management
- Create, edit, and view products with types: `Service`, `Software License`, `Consumable`, `Storable`.
- Track Sales Price, Cost Price, and profit margin.
- **Product Variants with Additional Pricing**: Define variant options (e.g. Sizing: *Standard [+$0]*, *Pro [+$80]*, *Ultra [+$180]*) that dynamically adjust line item unit prices.

### 3. Subscription Plans
- Recurrence cycles: **Daily**, **Weekly**, **Monthly**, and **Yearly**.
- Configurable trial days, minimum quantities, and feature checklists.
- Support for pausing, early closure, and renewal rules.

### 4. Subscription Lifecycle
State machine transitions:
$$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longleftrightarrow \text{Paused} \longrightarrow \text{Closed} \longrightarrow \text{Renewed}$$
- Tracks start date, expiry date, next billing date, auto-renew flag, payment terms, and itemized lines.

### 5. Discounts & Taxes
- **Discounts**: Percentage or fixed amount coupons with minimum purchase thresholds, validity dates, and usage limits (e.g. `WELCOME20`, `ENTERPRISE100`, `ODOO50`).
- **Taxes**: Multiple tax rates (Sales Tax 8%, VAT 20%, GST 18%) with default rules.

### 6. Payment Settlement & Invoices
- Record payments against invoices with methods: `Credit Card`, `Bank Transfer / ACH`, `PayPal`, `Cash / UPI`, and `Test Simulator`.
- Supports partial and full payment settlement.
- Invoice statuses: `Draft` → `Confirmed` → `Paid` (with `Partially Paid` and `Overdue` handling).
- Printable official invoice layout with print-to-PDF support.

### 7. Modern Dashboard & Analytics
- Key metrics: Active Subscriptions, Total Revenue, MRR (Monthly Recurring Revenue), ARR (Annual Recurring Revenue), Outstanding Receivables, Overdue count.
- **Revenue Timeline Chart** (Chart.js line chart showing monthly revenue collection).
- **Subscription Status Distribution Chart** (Doughnut chart of active, quotation, draft, paused, and closed counts).
- Recent payments and recent invoices audit logs.

---

## 📁 Project Structure

```
subscription/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js       # Axios client with JWT interceptor & API endpoints
│   │   ├── components/
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Layout.jsx      # Navigation sidebar, role switcher, top bar
│   │   │   ├── MetricCard.jsx  # KPI metrics with trend badges
│   │   │   ├── Modal.jsx       # Reusable responsive modal
│   │   │   ├── StatusBadge.jsx # Color-coded status pills
│   │   │   └── Toast.jsx       # Floating notifications
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx # Auth state, JWT storage, role helpers
│   │   ├── pages/
│   │   │   ├── CustomerPortal.jsx # Dedicated self-service subscriber portal
│   │   │   ├── Customers.jsx   # Customer directory & contact management
│   │   │   ├── Dashboard.jsx   # Analytics, charts, and billing trigger
│   │   │   ├── DiscountsTaxes.jsx # Promo codes and tax configuration
│   │   │   ├── Invoices.jsx    # Invoices table, printable view, pay modal
│   │   │   ├── Login.jsx       # Auth page with 1-click persona logins
│   │   │   ├── Payments.jsx    # Payment audit records
│   │   │   ├── Plans.jsx       # Plan catalog & feature builder
│   │   │   ├── Products.jsx    # Product catalog & variant pricing
│   │   │   └── Subscriptions.jsx # Subscription wizard & lifecycle actions
│   │   ├── App.jsx             # Root layout & route switcher
│   │   ├── index.css           # Tailwind CSS directives & print styling
│   │   └── main.jsx            # Entry point with AuthProvider
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Node.js + Express backend
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── dashboardController.js
│   │   ├── discountController.js
│   │   ├── invoiceController.js
│   │   ├── paymentController.js
│   │   ├── planController.js
│   │   ├── productController.js
│   │   ├── subscriptionController.js
│   │   └── taxController.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification & RBAC authorization
│   ├── models/
│   │   ├── Customer.js
│   │   ├── Discount.js
│   │   ├── Invoice.js
│   │   ├── Payment.js
│   │   ├── Plan.js
│   │   ├── Product.js
│   │   ├── Subscription.js
│   │   ├── Tax.js
│   │   └── User.js
│   ├── routes/                 # Express API routes
│   ├── services/
│   │   └── billingEngine.js    # Automated billing & recurrence engine
│   ├── utils/
│   │   └── seedData.js         # Realistic seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Express server entry point & cron scheduler
├── .gitignore
├── package.json                # Root package.json with concurrent run scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local daemon or free MongoDB Atlas cluster)

### 1. Installation
Clone the repository and install dependencies:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `server` directory (a pre-configured `.env` is already provided):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/subscription_system
JWT_SECRET=super_secret_jwt_key_subscription_management_2026_odoo
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Seed Realistic Demo Data
Populate the database with realistic products, plans, customers, subscriptions, invoices, and payments:
```bash
cd server
npm run seed
```

### 4. Start the Application
Start both the backend server and frontend client:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Running on http://localhost:3000
```

Open your browser at `http://localhost:3000`.

---

## 🧪 Testing the Main Demo Workflow

1. **Log in as Admin**: Click the **"Alexander (Admin)"** demo button on the login screen.
2. **Product & Variants**: Navigate to **Products & Variants** and create a product (e.g. `Cloud Container Engine`) with variants (e.g. `Standard`, `Pro (+$80)`).
3. **Subscription Plan**: Navigate to **Subscription Plans** and create a Monthly or Yearly plan (e.g. `Pro Cloud Tier` at `$199/month`).
4. **Customer**: Go to **Customers** and add a new subscriber (e.g. `Acme Dynamics`).
5. **Create Subscription**:
   - Go to **Subscriptions** → click **"Create Subscription"**.
   - Select Customer, Plan, add-on products, and enter coupon code `WELCOME20`.
   - Submit to create in **Draft** status.
   - Click **"Confirm"** → then click **"Activate"**.
6. **Trigger Automated Billing Engine**:
   - Click the **"Run Automated Billing"** button in the sidebar or dashboard.
   - The billing engine will detect active due subscriptions, create an invoice, advance the next billing date, and display a completion toast notification.
7. **Inspect the Invoice**:
   - Go to **Invoices** → click the **Eye icon** on the generated invoice to see the line items, applied discount, taxes, and printable receipt.
8. **Record Payment**:
   - Click **"Pay"** on the invoice, select a payment method (e.g. Credit Card), and confirm.
   - The invoice updates to **Paid** status.
9. **Verify Dashboard**:
   - Return to **Dashboard & Reports** to verify that Total Revenue, MRR, and the Revenue Chart reflect the new payment!
10. **Test Customer Portal View**:
    - Use the top role switcher to switch to **"Sarah Chen (Customer)"**.
    - Notice that Sarah only sees her own subscriptions and invoices, and can pay balances directly via the customer portal!

---

## 🌐 Deployment Plan

### 1. React Frontend (Vercel)
- Set root directory to `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### 2. Node.js Backend (Render)
- Set root directory to `server`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables:
  - `PORT=5000`
  - `MONGODB_URI=<your MongoDB Atlas connection string>`
  - `JWT_SECRET=<secure secret>`
  - `NODE_ENV=production`

### 3. Database (MongoDB Atlas)
- Create a free M0 cluster on MongoDB Atlas.
- Add Network Access IP `0.0.0.0/0`.
- Obtain the connection URI (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/subscription_system?retryWrites=true&w=majority`).

---

## 📄 License
MIT License. Created for the Odoo Hackathon 2026.

