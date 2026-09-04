# PropertyRental

Listing all the real estate property here so that users don't have to look everywhere.

---

## Overview

**PropertyRental** is a full-stack rental marketplace for Nepal, built with Next.js (App
Router). Renters browse and search listings, save the ones they like, message the owner,
book a stay and pay the deposit through a Nepali wallet. Landlords list their properties,
work through booking requests and answer enquiries. Admins moderate every new listing and
manage accounts from a dedicated panel.

Prices are in Nepali rupees (Rs) and every stay is priced by the day.

## Features

### Browsing and search

- Full-text keyword search over name, city, state and description, backed by a weighted
  MongoDB text index
- "Near me" geo search on a 2dsphere index, with an adjustable radius
- Structured filters: property type, price range, minimum beds and baths, amenities
- Sorting by relevance, price, newest, rating or distance
- Paginated results, featured listings and a Nepal-specific property type list
  (House, Flat/Apartment, Studio, Private Room, Hostel/Dorm, Cottage/Cabin, Guesthouse,
  Homestay, Villa/Bungalow)
- PhotoSwipe image gallery, Mapbox maps, availability and status badges

### Accounts and roles

- Google OAuth sign-in through NextAuth, with a custom `/login` screen
- Three roles: `tenant` (default), `landlord` and `admin`
- Self-service upgrade from tenant to landlord; admin is granted by another admin or
  through the `ADMIN_EMAILS` bootstrap variable
- Route protection in `middleware.js`, plus a server-side role re-check on every
  `/api/admin/*` request

### Listings

- Property listing CRUD with multiple image upload to Cloudinary
- Zod-validated forms, geocoded coordinates kept in sync with a GeoJSON point
- Bookmarking / saved properties
- Sharing to social media

### Bookings and payments

- Date-range booking with guest count, blocked-out unavailable dates and a quoted total
- Snapshotted price breakdown, so a later rate edit can never rewrite an agreed price
- Booking lifecycle: `pending` → `confirmed` → `completed`, or `cancelled`
- Confirmed stays are completed lazily once check-out passes (no scheduler needed)
- Deposit payments through **eSewa** and **Khalti**, verified against the gateway's own
  API rather than trusting the redirect

### Reviews

- One review per completed booking, so only people who actually stayed can review
- 1–5 star rating with optional title and body
- Rolling `rating_avg` / `rating_count` kept on the property, so cards and "sort by
  rating" never have to aggregate reviews

### Messaging and notifications

- Internal messages between guest and owner, with threaded replies
- Unread badge in the navbar
- In-app notification centre covering listing moderation, booking requests,
  confirmations, declines, cancellations and completions

### Admin panel (`/admin`)

- Dashboard with site statistics
- Moderation queue: approve, reject, flag, restore or delete a listing, with a note that
  is shown back to the owner
- Featured toggle
- User management and role changes

### Interface

- Light / dark / system theme with no flash on first paint
- A closed-domain help chatbot that only answers a fixed FAQ about the site
- Toast notifications, loading spinners, responsive Tailwind design, custom 404 page

## Technology Stack

- **Framework:** [Next.js 15](https://nextjs.org) (App Router, Turbopack)
- **Frontend:** React 19, Tailwind CSS v4, react-icons, react-toastify, react-spinners
- **Backend:** Next.js route handlers and server components
- **Database:** MongoDB with Mongoose
- **Auth:** NextAuth with Google OAuth 2.0
- **Validation:** Zod
- **Media:** Cloudinary, PhotoSwipe
- **Maps:** Mapbox (`react-map-gl`), Google Geocoding
- **Payments:** eSewa ePay v2, Khalti ePayment (KPG-2)

## Project structure

```
app/
  admin/            admin panel pages (dashboard, properties, users)
  api/              route handlers - see the API reference below
  bookings/         a user's bookings and the single-booking view
  properties/       list, detail, add, edit, saved, search results
  login/  messages/  notifications/  profile/
components/         React components (client and server)
config/             database and cloudinary clients
context/            global React context
lib/                zod schemas, property types, theme constants, payment clients
models/             Mongoose models: User, Property, Booking, Review, Message, Notification
scripts/            one-off migrations and backfills
utils/              auth options, availability, pricing, notifications, guards
```

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure the environment

Copy `.env.example` to `.env` and fill it in. Nothing in the example file is a real
credential.

| Variable | What it is for |
| --- | --- |
| `NEXT_PUBLIC_DOMAIN` | Public origin of the app, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_API_DOMAIN` | Public API base, e.g. `http://localhost:3000/api` |
| `MONGODB_URL` | MongoDB connection string |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `NEXTAUTH_URL` / `NEXTAUTH_URL_INTERNAL` | NextAuth base URLs |
| `NEXTAUTH_SECRET` | NextAuth session secret |
| `ADMIN_EMAILS` | Comma-separated emails promoted to admin on sign-in |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image uploads |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox maps |
| `NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY` | Turning an address into coordinates |
| `NEXT_PUBLIC_BOOKING_DEPOSIT_PERCENT` | Deposit share of the stay total, default `20` |
| `ESEWA_ENV` / `ESEWA_PRODUCT_CODE` / `ESEWA_SECRET_KEY` | eSewa deposits |
| `KHALTI_ENV` / `KHALTI_SECRET_KEY` | Khalti deposits |

`ADMIN_EMAILS` is how the very first admin account is created, since only an admin can
promote another one. An account listed there is promoted the next time it signs in.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

```bash
npm run build   # production build
npm start       # serve the production build
```

## Booking deposits (eSewa / Khalti)

Once a landlord accepts a booking request, the guest pays a deposit through a
Nepali wallet to secure it. Both gateways run against their sandbox by default,
so nothing here moves real money.

The deposit is orthogonal to the booking's own status: it is only payable while the
booking is `confirmed`, and the money trail outlives the booking, so a cancelled stay
still remembers what was charged, through which wallet, and against which receipt.

### eSewa

Works out of the box - eSewa publishes a shared test merchant, so no signup is
needed to demo the flow.

- `ESEWA_ENV=` `sandbox` (default) or `production`
- `ESEWA_PRODUCT_CODE=` defaults to `EPAYTEST`
- `ESEWA_SECRET_KEY=` defaults to eSewa's published test secret

Sandbox logins: eSewa ID `9711111111` (through `9711111114`), password
`Nepal@123`, OTP `123456`.

### Khalti

Hidden in the UI until a key is set, because Khalti has no shared sandbox
merchant. Create one at [test-admin.khalti.com](https://test-admin.khalti.com)
and copy its secret key. Khalti also has an Rs 10 floor, so a deposit under that is
refused rather than rounded up.

- `KHALTI_ENV=` `sandbox` (default) or `production`
- `KHALTI_SECRET_KEY=` test secret key

Sandbox logins: Khalti ID `9800000000` (through `9800000005`), MPIN `1111`,
OTP `987654`.

### Deposit size

- `NEXT_PUBLIC_BOOKING_DEPOSIT_PERCENT=` share of the stay total taken up front,
  defaults to `20`. Public because the booking UI quotes the same figure it charges.

Both wallets redirect the guest back to `/api/payments/{esewa,khalti}/callback`,
which is derived from `NEXT_PUBLIC_DOMAIN` - so that value has to be reachable
by the browser (use your tunnel URL, not `localhost`, if you demo from a phone).

## API reference

All routes live under `/api`.

### Properties

| Method | Route | Notes |
| --- | --- | --- |
| `GET` `POST` | `/properties` | Paginated list; create a listing |
| `GET` `PUT` `DELETE` | `/properties/:id` | Read, edit, delete a listing |
| `GET` | `/properties/featured` | Featured listings for the home page |
| `GET` | `/properties/search` | Keyword, geo, filter, sort and paginate |
| `GET` | `/properties/user/:userId` | A user's own listings |
| `GET` | `/properties/:id/reviews` | Reviews on a listing |

### Bookings and payments

| Method | Route | Notes |
| --- | --- | --- |
| `GET` `POST` | `/bookings` | A user's bookings; request a stay |
| `GET` `PUT` | `/bookings/:id` | Single booking; status transitions |
| `GET` | `/bookings/availability` | Dates already taken on a listing |
| `GET` | `/payments/gateways` | Which wallets are configured |
| `POST` | `/payments/initiate` | Start a deposit payment |
| `GET` | `/payments/esewa/callback` | eSewa redirect, verified server-side |
| `GET` | `/payments/khalti/callback` | Khalti redirect, verified server-side |

### Reviews, bookmarks, messages, notifications

| Method | Route | Notes |
| --- | --- | --- |
| `POST` | `/reviews` | Write a review for a completed stay |
| `GET` | `/reviews/eligibility` | Whether the caller may review a listing |
| `GET` `POST` | `/bookmarks` | Saved properties; toggle one |
| `POST` | `/bookmarks/check` | Is this listing bookmarked |
| `GET` `POST` | `/messages` | Inbox; send an enquiry |
| `PUT` `DELETE` | `/messages/:id` | Mark read/unread; delete |
| `POST` | `/messages/:id/reply` | Reply in a thread |
| `GET` | `/messages/unread-count` | Navbar badge |
| `GET` `PUT` | `/notifications` | List; mark all read |
| `PUT` `DELETE` | `/notifications/:id` | Mark read; delete |
| `GET` | `/notifications/unread-count` | Bell badge |

### Account and admin

| Method | Route | Notes |
| --- | --- | --- |
| `GET` `PATCH` | `/users/me` | Own profile; switch between tenant and landlord |
| `GET` | `/admin/stats` | Dashboard counts |
| `GET` | `/admin/properties` | Moderation queue |
| `PATCH` `DELETE` | `/admin/properties/:id` | Approve / reject / flag / feature; delete |
| `GET` | `/admin/users` | User list |
| `PATCH` | `/admin/users/:id` | Change a user's role |

## Moderation

A new listing starts as `pending` and is hidden from every public route until an admin
approves it. The owner can still open their own pending listing and read the moderation
note.

| Status | Meaning |
| --- | --- |
| `pending` | Sitting in the admin queue, visible only to its owner |
| `approved` | Live on the site |
| `rejected` | Refused by an admin; the owner sees the note and can edit |
| `flagged` | Was live, pulled back down by an admin |

Listings created before moderation existed have no `status` at all and are treated as
approved, so nothing disappears when this ships. Run the backfill below to stamp them.

## Maintenance scripts

One-off migrations, all safe to run more than once. Each takes `--dry` to show what it
would do without writing anything.

```bash
node --env-file=.env scripts/backfill-search-fields.mjs      # numeric rates, geo points, indexes
node --env-file=.env scripts/backfill-property-status.js     # stamp Property.status and User.role
node --env-file=.env scripts/migrate-property-types.js       # retired type values -> replacements
node --env-file=.env scripts/migrate-rates-to-daily.js       # nightly/weekly/monthly -> one day rate
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) – learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) – an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) – your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Set every variable from `.env.example` in the project settings, and point
`NEXT_PUBLIC_DOMAIN`, `NEXT_PUBLIC_API_DOMAIN` and `NEXTAUTH_URL` at the deployed origin -
the payment callbacks are derived from them.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for suggestions, fixes, or new features.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Developed by [Sandesh Khadka](https://github.com/sandeshkhadka10)

---

> *Listing all the real estate property here so that users don't have to look everywhere.*
