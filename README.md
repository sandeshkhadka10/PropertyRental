# PropertyRental

Listing all the real estate property here so that users don't have to look everywhere.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Overview

**PropertyRental** is a full-featured, JavaScript-based web application designed to streamline the process of finding, listing real estate properties and contacting the relevant owners. Whether you're looking to rent, buy, or list properties, this platform serves as a centralized hub, making discovery and management effortless for users.

## Features

- **Comprehensive Property Listings:** Browse curated listings of rental and sale properties.
- **Easy Property Posting:** Users can submit new property listings.
- **User-Friendly Interface:** Modern, intuitive UI built entirely with React inside Next.js.
- **Search & Filter:** Easily find properties by location and property type.
- **Pagination:** Quickly navigate through large numbers of listings with seamless pagination.
- **Bookmark Properties:** Logged-in users can bookmark/save their favorite properties for quick access later.
- **Google Authentication:** Secure, one-click sign-in and sign-up via Google for faster access and improved security.
- **Contact Integration:** Connect directly with property owners or agents.
- **Map Integration:** Visualize property locations on an interactive map.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org) (bootstrapped via `create-next-app`)
- **Frontend:** React inside Next.js
- **Backend:** Node.js via Next.js API routes/ server components
- **Authentication:** Google OAuth 2.0
- **State Management:** Context API—update
- **Styling:** TailwindCSS
- **Fonts:** Uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

### Google Authentication Setup

1. Go to [Google Cloud Console](https://console.developers.google.com/), create a new project, and configure OAuth 2.0 credentials.
2. Whitelist your app's redirect URI(s).
3. Copy your `Client ID` and add it into your project config (via `.env.local` or a dedicated config file).

## Usage

- Browse and filter properties on the homepage.
- Use pagination controls to navigate listings.
- Authenticate using your Google account to post a property or save favorites.
- Bookmark properties you like for future reference.
- Directly contact sellers or agents through the platform.

## Folder Structure

```
PropertyRental/
├── app/
│   ├── page.js
│   └── ...
├── components/
├── public/
├── styles/
├── package.json
└── README.md
```
*(Adjust to your actual structure as needed.)*

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) – learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) – an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) – your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for suggestions, fixes, or new features.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Developed by [Sandesh Khadka](https://github.com/sandeshkhadka10)

---

> *Listing all the real estate property here so that users don't have to look everywhere.*