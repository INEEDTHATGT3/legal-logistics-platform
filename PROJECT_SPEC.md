# PROJECT_SPEC.md - Unified Legal Consultation & Logistics Platform (MVP)

## 1. The Core Objective
We are building a unified, multi-sided Next.js App Router platform. It connects clients to lawyers for virtual consultations, and provides a physical logistics network for document delivery. 

## 2. The Unified Database Schema (Supabase)
The app shares ONE database. Do not create separate user tables. 

* **Users Table:** `uid` (PK), `name`, `email`, `role` (Enum: 'client', 'lawyer', 'admin').
* **Lawyer_Profiles:** `lawyer_id` (FK -> Users.uid), `specialty`, `hourly_rate` (in INR ₹).
* **Consultations:** `consultation_id` (PK), `client_id`, `lawyer_id`, `status` ('scheduled', 'completed').
* **Deliveries:** `delivery_id` (PK), `client_id`, `document_type`, `tracking_status` ('ordered', 'picked_up', 'in_transit', 'delivered').

## 3. Role-Based Access & Routing (The 3 Views)
The UI changes based on the user's `role`.
* **Role: `client` -> `/dashboard/client`**
  - Features: Lawyer directory, consultation booking UI, document delivery request form, live tracking UI.
* **Role: `lawyer` -> `/dashboard/lawyer`**
  - Features: Manage booked consultations, view client case notes, adjust personal `hourly_rate`.
* **Role: `admin` -> `/dashboard/admin`**
  - Features: Master logistics control panel. Can view all deliveries and mutate `tracking_status`.

## 4. MVP Constraints
* For the initial UI build, use hardcoded mock data arrays that perfectly match the schema above. Do not attempt to write real Supabase fetch calls until the UI is visually approved.