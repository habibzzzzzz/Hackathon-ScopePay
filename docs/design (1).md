# ScopePay.ai — Design System & UI/UX Specification

## 1. Product Identity

**Product:** ScopePay.ai  
**Category:** AI-powered commercial intelligence SaaS for freelancers and small agencies  
**Primary Value:** Analyze project scope, detect billable scope changes, recommend fair additional charges, and convert approved work into PayPal payments.

### Brand Positioning

**Primary Tagline:**  
> Know your scope. Know your worth. Get paid.

**Alternative Tagline:**  
> Turn extra work into paid work.

### Product Personality

ScopePay.ai should feel:

- Professional
- Trustworthy
- Financially intelligent
- Calm
- Modern
- Premium
- Precise
- AI-assisted, not “AI gimmicky”

Avoid a design language that feels like:
- Crypto dashboards
- Gaming UI
- Overly futuristic neon interfaces
- Consumer social apps
- Generic admin templates

---

# 2. Design Direction

## Core Visual Concept

Use a **professional glassmorphism interface** with restrained transparency, soft depth, strong typography, and high-contrast financial data.

The visual direction should combine:

- Modern SaaS
- Fintech trust
- AI intelligence
- Premium glass surfaces
- Minimal visual noise

Glassmorphism must be used selectively. Important actions, financial values, warnings, and forms must remain highly readable.

### Design Keywords

`Glassmorphism`  
`Fintech`  
`AI SaaS`  
`Premium`  
`Minimal`  
`Professional`  
`Calm`  
`Trustworthy`  
`Data-focused`

---

# 3. Theme

## Default Theme

Use **Dark Mode as the primary product experience**.

Reason:
- Makes glass surfaces visually stronger.
- Gives ScopePay.ai a premium AI-fintech identity.
- Helps differentiate the product from conventional freelancer marketplaces.
- Works well for dashboards and financial analytics.

A light theme can be added later, but is not required for the hackathon MVP.

For the hackathon design specification, **Dark Mode is the authoritative visual direction**. Any older product document that mentions a light-first interface should be updated to follow this design decision rather than changing this file back to light mode.

---

# 4. Color System

## Base Colors

```css
--bg-primary: #08111F;
--bg-secondary: #0D1828;
--bg-tertiary: #111F32;

--surface-glass: rgba(255, 255, 255, 0.07);
--surface-glass-hover: rgba(255, 255, 255, 0.10);
--surface-glass-strong: rgba(255, 255, 255, 0.13);

--border-glass: rgba(255, 255, 255, 0.12);
--border-glass-hover: rgba(255, 255, 255, 0.20);
```

## Brand Accent

Use a professional blue-indigo accent.

```css
--brand-primary: #6C7CFF;
--brand-secondary: #4DA3FF;
--brand-soft: rgba(108, 124, 255, 0.16);
```

Use gradients only for hero accents, AI states, selected navigation, or limited CTA emphasis.

```css
background: linear-gradient(
  135deg,
  #6C7CFF 0%,
  #4DA3FF 100%
);
```

## Semantic Colors

```css
--success: #32D583;
--success-soft: rgba(50, 213, 131, 0.14);

--warning: #FDB022;
--warning-soft: rgba(253, 176, 34, 0.14);

--danger: #F97066;
--danger-soft: rgba(249, 112, 102, 0.14);

--info: #53B1FD;
--info-soft: rgba(83, 177, 253, 0.14);
```

## Text Colors

```css
--text-primary: #F7F9FC;
--text-secondary: #AAB6C5;
--text-muted: #718096;
--text-disabled: #556070;
```

---

# 5. Typography

## Recommended Font

Primary:
- **Poppins**

Alternative:
- Inter
- Manrope
- Plus Jakarta Sans

Recommended pairing:

- Heading: **Poppins**
- Body/UI: **Inter**

If simplicity is preferred, use Poppins for the entire product.

## Font Scale

```text
Display XL     52px / 60px / 700
Display L      42px / 50px / 700
Heading 1      32px / 40px / 700
Heading 2      26px / 34px / 600
Heading 3      20px / 28px / 600
Body Large     16px / 26px / 400
Body           14px / 22px / 400
Caption        12px / 18px / 400
Label          13px / 18px / 500
```

Financial values should use a slightly tighter tracking and medium/semi-bold weight.

Example:

```text
$4,820.00
28px / 32px / 600
```

---

# 6. Glassmorphism Rules

## Base Glass Card

```css
.glass-card {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  border-radius: 20px;
}
```

## Glass Hierarchy

Use 3 levels:

### Level 1 — Base Surface
For:
- Layout containers
- Sidebars
- Large sections

Opacity: 4–6%

### Level 2 — Interactive Card
For:
- KPI cards
- Project cards
- AI analysis panels
- Payment cards

Opacity: 7–10%

### Level 3 — Focused Surface
For:
- Modal
- Change order review
- Payment summary
- Critical AI decision

Opacity: 12–15%

Do not stack more than two glass layers visually.

---

# 7. Background Treatment

Use a dark gradient background with subtle radial lighting.

```css
background:
  radial-gradient(circle at 15% 15%, rgba(108,124,255,0.16), transparent 32%),
  radial-gradient(circle at 85% 10%, rgba(77,163,255,0.12), transparent 28%),
  linear-gradient(180deg, #08111F 0%, #0A1422 100%);
```

Optional:
- Very subtle grain/noise
- Large blurred gradient blobs
- Grid pattern at 2–4% opacity

Avoid:
- Bright aurora gradients everywhere
- Excessive neon glows
- Moving backgrounds behind forms

---

# 8. Layout System

## Desktop

```text
Sidebar: 240–260px
Content max width: 1440px
Main content padding: 28–32px
Grid gap: 20–24px
```

## Tablet

```text
Sidebar collapses
Main padding: 20–24px
Cards: 2 columns
```

## Mobile

```text
Bottom navigation or compact header
Main padding: 16px
Cards: 1 column
Primary CTA: full width where appropriate
```

---

# 9. Application Navigation

## Freelancer App Navigation

AI analysis is **contextual to a project**, not a standalone generic chatbot feature.

Primary navigation:

```text
Overview
Projects
Change Orders
Payments
Clients
Settings
```

Recommended sidebar:

```text
[ ScopePay.ai ]

Overview
Projects
Change Orders
Payments
Clients

----------------

Workspace
Help

[ User Profile ]
```

If an AI-focused screen is added later, it should be an **Analysis History** view that summarizes previous project analyses. New analysis must still be initiated from a specific project so the AI always has a valid project baseline.

### Sidebar Style

- Glass panel
- 12–16px margin from screen edges
- Rounded 20px
- Active navigation uses brand-soft background
- Active icon and text use brand-primary
- Keep icons outlined and minimal

Recommended icon library:
- Lucide
- Phosphor
- Heroicons

---

# 10. Landing Page

## Hero Section

### Layout

Desktop:
- Left: copy + CTA
- Right: product dashboard preview

### Copy

**Eyebrow**

```text
AI COMMERCIAL INTELLIGENCE FOR FREELANCERS
```

**Headline**

```text
Know your scope.
Know your worth.
Get paid.
```

**Subheadline**

```text
ScopePay.ai analyzes project scope, detects billable changes,
recommends fair charges, and turns approved work into PayPal payments.
```

### CTA

Primary:

```text
Analyze Your Project
```

Secondary:

```text
See How It Works
```

Avoid CTA such as:
- Start Earning
- Find Work
- Explore Jobs

ScopePay.ai is not a marketplace.

---

# 11. Dashboard / Overview

## Primary Structure

```text
Header
├── Greeting
├── Current date
└── New Project CTA

KPI Cards
├── Total Contracted
├── Collected
├── Outstanding
└── Additional Revenue

Main Area
├── Active Projects
├── Recent AI Decisions
└── Payment Activity
```

## KPI Card

Example:

```text
Outstanding

$1,420.00

3 unpaid charges
↑ 12.5% this month
```

Style:
- Glass Level 2
- Icon in subtle brand container
- Value strongly emphasized
- Supporting text muted

Do not use large colorful charts unless they provide useful information.

---

# 12. Projects Page

## Project Card

Each card contains:

```text
Project Name
Client
Commercial Status
Original Value
Collected
Additional Revenue
Outstanding
```

Do not show generic project-management progress bars or task-completion percentages unless milestone tracking is explicitly implemented. ScopePay is a commercial intelligence product, not a Jira/Trello replacement.

Example:

```text
HAVN Coffee Website
HAVN Coffee

In Progress

Original Value     $1,500
Collected          $1,100
Extra Revenue        $220
Outstanding          $620
```

Commercial status chips:

```text
Active
Completed
Awaiting Payment
Needs Review
```

Status should describe the project's commercial state. Avoid adding generic delivery-progress percentages unless they directly support billing or milestone payment context.

---

# 13. Project Detail Page

This is one of the most important pages.

## Layout

Desktop:

```text
┌─────────────────────────────────────────────┐
│ Project Header                              │
├───────────────────────┬─────────────────────┤
│ Scope / Contract      │ AI Commercial       │
│ Details               │ Assistant           │
│                       │                     │
├───────────────────────┴─────────────────────┤
│ Change Orders / Payments / Timeline         │
└─────────────────────────────────────────────┘
```

## Project Header

Include:

```text
Project Name
Client
Project Status
Original Contract Value
Start Date
Deadline
```

Primary action:

```text
Analyze New Request
```

Secondary actions:

```text
View Contract
Create Change Order
```

---

# 14. AI Commercial Assistant

This is the hero product feature.

Avoid making it look like a generic chatbot.

## Input Section

Title:

```text
Analyze a Client Request
```

Description:

```text
Paste the latest client request and ScopePay will compare it
with your agreed project scope.
```

Input:

```text
"Can we also add Google login and PDF export?"
```

CTA:

```text
Analyze Scope
```

Optional:
- Upload client brief
- Paste email/message
- Attach PDF

---

# 15. AI Analysis Result

AI results must use structured cards rather than long chat bubbles.

Example:

```text
Scope Assessment

PARTIALLY OUT OF SCOPE
```

Then:

```text
Google Authentication
Status: Out of Scope
Estimated effort: 5–8 hours

PDF Export
Status: Out of Scope
Estimated effort: 4–6 hours
```

### Financial Recommendation

```text
Recommended Additional Charge

$180 – $250

Recommended Price
$220
```

### Explanation

```text
Both requested features introduce functionality not described
in the original scope and require additional implementation,
testing, and authentication handling.
```

Actions:

```text
Create $220 Change Order
Adjust Price
Dismiss
```

## AI Confidence

Optional:

```text
Confidence: 92%
```

Do not over-emphasize confidence.

---

# 16. AI Status Visual Language

Use clear semantic states.

### Within Scope

```text
✓ WITHIN SCOPE
```

Color:
Success

### Partially Out of Scope

```text
◐ PARTIALLY OUT OF SCOPE
```

Color:
Warning

### Out of Scope

```text
⚠ OUT OF SCOPE
```

Color:
Danger / warm warning

### Needs Human Review

```text
? REVIEW REQUIRED
```

Color:
Info

---

# 17. Change Order Page

## Header

```text
Change Order #CHG-001
HAVN Coffee Website
```

## Content

```text
Requested Changes

Google Authentication
PDF Report Export

Additional Effort
12–18 hours

Timeline Impact
+3 working days

Original Contract
$1,500

Additional Charge
$220
```

### Main CTA

```text
Send to Client
```

Secondary:

```text
Edit Change Order
Save Draft
```

---

# 18. Client Approval Page

This page must be extremely simple.

Access route:

```text
/c/[token]
```

The token must be random, unguessable, revocable, and optionally expiring. Never expose a sequential/raw change-order ID as the public authorization mechanism.

No application sidebar.

## Structure

```text
ScopePay.ai Logo

Freelancer / Agency Name
Project Name

Change Order Summary

Requested Changes
Timeline Impact
Additional Charge

$220.00

[ Accept & Pay with PayPal ]

Secured payment powered by PayPal
```

Client should not be required to create a ScopePay account.

The single CTA may remain:

```text
Accept & Pay with PayPal
```

but the underlying flow must be:

```text
Client clicks CTA
↓
Change Order → APPROVED
↓
ScopePay creates PayPal Invoice
↓
Change Order → INVOICED
↓
Client is redirected to PayPal payer view
↓
PayPal payment succeeds
↓
Webhook received
↓
Change Order → PAID
```

ScopePay must never present the action as an automatic direct charge. The client explicitly approves the change order and completes payment through PayPal.

Use a focused, centered glass card.

Maximum width:

```text
680px
```

---

# 19. PayPal Integration UI

PayPal should appear as the trusted execution layer.

Use copy such as:

```text
Payment handled securely through PayPal.
```

Invoice / payment lifecycle status:

```text
Draft
Sent
Unpaid
Partially Paid
Paid
Refunded
Cancelled
```

Do **not** use `Failed` as a financial status for an invoice simply because an API call or webhook handler fails.

System errors must be displayed separately, for example:

```text
Invoice Creation Failed
Webhook Processing Failed
Payment Sync Error
```

These are application errors, not invoice lifecycle states.

After successful webhook:

```text
Payment Received

$220.00

Change Order #CHG-001

Paid via PayPal
```

Do not visually imitate PayPal branding excessively. Respect PayPal brand guidelines for official assets/buttons.

---

# 20. Payments Page

## Summary

```text
Collected
$4,820

Outstanding
$1,420

Additional Revenue
$760
```

## Table

Columns:

```text
Invoice
Client
Project
Type
Amount
Status
Due Date
Action
```

Example:

```text
INV-1024
HAVN Coffee
Website
Change Order
$220
Paid
Oct 14
View
```

Desktop:
Use a glass data table.

Mobile:
Transform table rows into cards.

---

# 21. Payment Intelligence

**Priority: P1 / Stretch for Hackathon**

This feature is useful for the long-term SaaS product, but it must not block the hackathon golden path:

```text
Project
→ AI Scope Detection
→ Pricing Recommendation
→ Change Order
→ Client Approval
→ PayPal Invoice
→ Webhook
→ PAID
```

Use AI to summarize payment information only after the core payment flow is stable.

Example panel:

```text
AI Payment Insight

You currently have $1,420 outstanding across 3 clients.

Highest Priority

ABC Studio
$500 overdue by 8 days

Recommended action:
Send a payment reminder today.
```

Actions:

```text
Create Reminder
View Invoice
```

---

# 22. Client Page

Client profile should contain only the commercial context needed to support project and payment decisions.

### P0 / Hackathon MVP

```text
Client Name
Email
Active Projects
Total Contract Value
Additional Revenue
Collected
Outstanding
Change Orders
```

### P1 / Post-Core

```text
Average Payment Time
```

Average Payment Time can be derived from invoice history such as `paid_at - sent_at`, but it must not be prioritized ahead of the core PayPal flow.

Avoid creating a large CRM.

This page exists only to support project/payment context.

---

# 23. Components

## Buttons

### Primary

- Brand gradient or solid brand-primary
- 44–48px height
- 12px radius
- Medium font weight

### Secondary

- Glass background
- Border glass
- No strong glow

### Destructive

- Danger soft background
- Danger text

---

# 24. Inputs

Inputs should be darker than cards.

```css
background: rgba(4, 10, 20, 0.45);
border: 1px solid rgba(255,255,255,0.10);
border-radius: 12px;
```

Focus:

```css
border-color: rgba(108,124,255,0.75);
box-shadow: 0 0 0 3px rgba(108,124,255,0.12);
```

---

# 25. Cards

Recommended radius:

```text
16px compact
20px standard
24px hero
```

Avoid:
- excessive nested cards
- strong drop shadows
- 30px+ radius everywhere

---

# 26. Modals

Use:

```text
Backdrop:
rgba(0, 0, 0, 0.55)

Modal:
Glass Level 3
Blur 24px
Max width 600–720px
```

Example use:
- Confirm change order
- Approve AI recommendation
- Connect PayPal
- Delete project

---

# 27. Empty States

Example Projects:

```text
No projects yet

Add your first client project and let ScopePay analyze
whether the scope and pricing make sense.

[ Add Project ]
```

Avoid playful illustrations that undermine fintech professionalism.

Use:
- simple icon
- subtle gradient orb
- minimal line artwork

---

# 28. Loading States

AI analysis should have meaningful status feedback:

```text
Reading project scope...
Comparing new request...
Estimating effort...
Preparing commercial recommendation...
```

Use a subtle animated gradient line or small processing indicator.

Do not fake human-like “thinking” messages.

---

# 29. Microinteractions

Allowed:
- 150–220ms hover transitions
- Soft scale 1.01 on cards
- Border brightening
- Gradient shift on primary button
- Smooth number transitions
- AI analysis result reveal

Avoid:
- bouncing UI
- aggressive parallax
- glowing cursor
- excessive particles

---

# 30. Motion Guidelines

```text
Fast interaction: 120–160ms
Standard transition: 180–220ms
Modal / drawer: 220–280ms
Page transition: max 300ms
```

Use:

```css
transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
```

---

# 31. Responsive Behavior

## Desktop

Primary working environment.

- Full sidebar
- Split project / AI layout
- Data tables
- Rich financial overview

## Tablet

- Collapsible sidebar
- Two-column cards
- AI panel moves below scope content when necessary

## Mobile

Focus on:
- Project overview
- AI analysis
- Change order approval
- Payment status

Navigation:

```text
Overview
Projects
AI
Payments
More
```

---

# 32. Accessibility

Minimum requirements:

- WCAG AA contrast
- Visible keyboard focus
- Semantic HTML
- Button labels must be descriptive
- Never rely on color alone for status
- Minimum interactive target: 44x44px
- Respect `prefers-reduced-motion`
- Financial figures must remain readable at 200% zoom

Glassmorphism must never reduce text readability.

---

# 33. Recommended Page Structure

```text
/
├── Landing
├── Features
├── Pricing
├── Login
├── Register
│
├── app/
│   ├── overview
│   ├── projects
│   │   ├── [projectId]
│   │   │   └── analyze
│   │   └── new
│   ├── change-orders
│   ├── payments
│   ├── clients
│   └── settings
│
└── c/
    └── [token]
        ├── Review
        ├── Approval
        └── PayPal Redirect
```

The public client route must use a **cryptographically strong, unguessable, revocable token**, not the raw `changeOrderId`.

Recommended data fields:

```text
public_token
token_expires_at
```

Example:

```text
scopepay.ai/c/q7BxA9mK2p...
```

not:

```text
scopepay.ai/c/123
```

---

# 34. MVP Screens for Hackathon

## P0 — Must Be Stable for Demo

Prioritize these screens:

1. Landing Page
2. Login / Demo Login
3. Dashboard
4. Create Project
5. Project Detail
6. AI Scope Analysis
7. AI Pricing Recommendation
8. Change Order Preview
9. Client Approval Page
10. PayPal Payment Flow
11. Payment Success
12. Updated Project Revenue Dashboard

Do not spend hackathon time on:
- Advanced CRM
- Marketplace
- Complex settings
- Internal chat
- Full accounting
- Native mobile app
- Payment Intelligence before the core PayPal flow is stable
- Average Payment Time analytics before the core PayPal flow is stable

## P1 — Add Only After P0 Is Stable

```text
Payment Intelligence
AI Payment Reminder
Average Payment Time
Analysis History
Advanced Client Analytics
```

---

# 35. Demo Flow

The UI should support this 3-minute story:

```text
1. Freelancer opens project.

2. Original scope:
   Website + Menu + Reservation.

3. Client asks:
   "Can you also add Google Login and PDF export?"

4. Freelancer pastes request into ScopePay.

5. AI detects:
   OUT OF SCOPE

6. AI recommends:
   Additional Charge $220

7. Freelancer creates Change Order.

8. Client opens public ScopePay link.

9. Client approves and pays with PayPal.

10. PayPal webhook marks charge PAID.

11. Dashboard updates:
    Additional Revenue +$220.
```

The user should understand the product without explanation after seeing this flow.

---

# 36. Final Visual Principle

Every screen should answer at least one of these questions:

```text
What work was agreed?

What changed?

What is that change worth?

What has been paid?

What is still owed?
```

If a UI element does not support one of these questions, reconsider whether it belongs in the hackathon MVP.

---

# 37. Design Summary

ScopePay.ai should visually communicate:

**AI understands the work.**  
**ScopePay protects the commercial scope.**  
**PayPal executes the payment.**

The final experience should feel like a premium financial workspace for independent professionals rather than a freelancer marketplace or generic project-management tool.
