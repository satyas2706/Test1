# Business Requirements Document (BRD)
## Project: Bharat Bridge - Global Logistics Platform
**Version:** 1.0  
**Date:** March 5, 2026  
**Status:** Final

---

### 1. Project Overview
Bharat Bridge is a specialized international logistics platform designed to bridge the gap between Indian products and global destinations. The platform allows users to consolidate items from various sources—online shopping, local purchases, or home collections—into a single international shipment, significantly reducing costs and complexity.

### 2. Objectives
- To provide a seamless interface for customers to manage international shipments.
- To automate the scheduling and tracking of agent pickups.
- To provide administrators with a centralized dashboard for operational oversight.
- To ensure high transparency through real-time shipment tracking.

---

### 3. User Roles & Permissions

#### 3.1 Customer
- **Access:** Public & Private (after login).
- **Capabilities:**
    - View shipping schedules and announcements.
    - Calculate estimated shipping rates.
    - Add items via Warehouse Delivery, Agent Pickup, or BB Store.
    - Manage shipment cart and track item statuses.
    - Complete checkout and make payments.
    - Track orders and view history.

#### 3.2 Agent
- **Access:** Private (Agent Login).
- **Capabilities:**
    - View assigned pickup work orders.
    - Update work order status (e.g., mark as Collected).
    - Add items to a customer's shipment during on-site collection.

#### 3.3 Admin
- **Access:** Private (Admin Login).
- **Capabilities:**
    - Monitor platform performance (Revenue, Orders, Agents).
    - Manage the agent workforce (Add/Edit/Status).
    - Oversee all customer orders and update global shipment statuses.

---

### 4. Functional Requirements

#### 4.1 Home & Discovery
- **Shipping Announcements:** Display high-visibility banners for upcoming international shipping dates (e.g., "Next Shipping to USA: 15-Mar-2026").
- **Rate Calculator:** Interactive tool to calculate costs based on weight (kg) and destination country.

#### 4.2 Shipment Collection (The "Cart")
- **Warehouse Mode:** 
    - Provision for customers to send items directly to the Bharat Bridge warehouse.
    - **Copy Address Feature:** One-click copy of the warehouse address for use on e-commerce sites.
- **Agent Pickup Mode:**
    - Scheduling interface for home collection.
    - Selection of Date and Time slots.
    - Collection of pickup address and contact details.
- **BB Store Integration:**
    - Browse curated Indian products (Pooja items, gifts, etc.).
    - "Quick Add" functionality to include store items directly in the shipment.

#### 4.3 Order Management & Validation
- **Item Status Tracking:** Each item in a shipment must track its own status (Pending vs. Received at Warehouse).
- **Checkout Validation:** The system **must block checkout** if any item is in "Pending" status. All items must be physically received at the warehouse before payment.
- **Order ID Generation:** Unique reference numbers (e.g., BB-XXXXX) for every consolidated shipment.

#### 4.4 Payment System
- **Methods:** Support for Credit/Debit Cards and UPI (PhonePe).
- **Process:** Secure checkout flow with immediate order confirmation upon successful payment.

#### 4.5 Tracking & History
- **Live Tracker:** Visual progress bar showing milestones: Received -> Consolidated -> In Transit -> Out for Delivery -> Delivered.
- **History Log:** Comprehensive list of past orders with detailed item breakdowns and payment status.

---

### 5. Non-Functional Requirements

- **UI/UX Design:**
    - Responsive layout (Mobile, Tablet, Desktop).
    - Modern aesthetic using Tailwind CSS.
    - Smooth animations and transitions (Framer Motion).
    - Automatic "Scroll to Top" on navigation.
- **Performance:** Optimized for low latency in status updates and calculations.
- **Security:** Role-based access control to ensure data privacy between customers, agents, and admins.

---

### 6. Business Rules & Logic
- **Weight Calculation:** Shipping rates are applied per kg, varying by destination country.
- **Consolidation:** Multiple items (from different sources) are grouped under a single Order ID for shipping.
- **Shipping Windows:** Orders are consolidated and dispatched on pre-defined dates to optimize logistics costs.

---

### 7. Future Scope
- Integration with real-time GPS tracking for agents.
- Automated WhatsApp/SMS notifications for status changes.
- Multi-currency support for international payments.
- AI-based weight estimation using item photos.
