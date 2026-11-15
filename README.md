# Tiger Market Hub

Design a dark, minimal marketplace website called "Tiger Market" — a marketplace 

where Roblox game developers buy, sell, and hire services (scripting, building, 

UI/GUI design, 3D modeling, GFX, animation, and more).



STYLE DIRECTION:

Inspired by modern bento-grid SaaS/crypto landing pages (Aceternity-style), but 

reinterpreted as mostly black & white / monochrome — NOT a colorful crypto look.

- Background: near-black (#0a0a0a to #111111), not pure black

- Surface/cards: dark charcoal gray (#161616 to #1a1a1a), subtle 1px borders (#2a2a2a)

- Text: off-white (#f0f0f0) primary, gray (#888) muted

- ONE restrained accent color used sparingly: a muted amber/orange (#c97d2c), 

  only for primary buttons, active states, and small highlights — never large 

  blocks of color, never neon/saturated tones

- Typography: modern geometric sans-serif for headings (e.g. Space Grotesk or 

  similar), clean sans (e.g. Inter) for body text, monospace font for prices/IDs

- Subtle micro-interactions: gentle hover lift on cards, smooth transitions, 

  no heavy animation



PAGES/SECTIONS TO DESIGN:



1. Sticky Nav Bar

   - Logo "🐯 Tiger Market" left

   - Right side: "Login with Discord" button (logged out) OR username + logout 

     link (logged in state) — show both states



2. Hero Section

   - Headline about finding Roblox developers / getting hired fast

   - Large functional search bar (search offers by keyword)

   - Below search: small live stat chips, e.g. "1,200 active offers · 340 

     matches today · 4.6★ avg rating" — inline, subtle, not huge numbers



3. Category Bento Grid (signature element)

   - A grid of category tiles (Scripting, Building, UI/GUI Design, 3D Modeling, 

     Graphics/GFX, Animation, Investment, etc.)

   - Tile SIZE varies based on how many active listings exist in that category — 

     bigger tile = more listings (this should look intentional/data-driven, 

     not random)

   - Each tile: icon, category name, small listing count



4. Offer Listing Grid

   - Filter row above: category dropdown, post-type dropdown (Hiring/For 

     Hire/Buying/Selling/Investment), search input

   - Card grid, each card shows:

     - Optional thumbnail image (placeholder tiger icon if none)

     - Small colored left-border strip indicating post type

     - Title (service/item name)

     - Short description excerpt (1-2 lines, truncated)

     - Small badges: category, "Verified ✓" (gold), source badge 

       ("Discord" or "Website")

     - Seller username

     - Price (monospace font, styled like a small price tag/ticket)

   - Card hover: subtle lift + border color shifts to accent

   - Pagination at bottom (Prev/Next + page indicator)

   - Empty state when no results



5. Offer Detail Page

   - Larger version of the card info

   - Scam warning banner (red/muted-red, only shown conditionally) with 

     reason text

   - Rating display (stars)

   - Two contact button variants: "Message on Discord" (if sourced from 

     Discord) OR "Contact Seller" (if sourced from Website)

   - "View Original Post" secondary link



6. Trade Confirmation Page (simple centered card, not part of main site nav)

   - Small centered card: shows offer being confirmed, logged-in user, a 

     "Confirm This Trade Happened" button, and status text ("waiting on 

     other party" / "both confirmed ✓")



Keep every page consistent with the same design tokens (colors, spacing, 

type scale). Mobile responsive. Generate clean, well-structured HTML/CSS 

(Tailwind is fine) — I'll be adapting the markup into a Python/Flask backend 

afterward, so keep class structure/semantic HTML clear and avoid 

framework-specific logic that can't translate (plain HTML/CSS/minimal JS 

preferred over complex React state where possible). 

Backend & Authentication Requirements



Build the website so it can be used in production, not just as a UI mockup.



Backend



- Use Python Flask as the backend.

- Structure the project cleanly using blueprints/routes.

- Keep frontend and backend separated.

- Make all pages compatible with server-side rendering.

- Use semantic HTML and reusable components where possible.



Database



- Use a secure relational database (PostgreSQL preferred, SQLite for local development only).

- Design normalized tables for:

  - Users

  - Offers

  - Categories

  - Reviews

  - Trade Confirmations

  - Favorites

  - Notifications

  - Sessions

- Use UUIDs for public IDs where appropriate.

- Never expose internal database IDs publicly.



Discord Authentication



Implement real Discord OAuth2 authentication.



Requirements:



- Login with Discord

- Logout

- Persistent secure sessions

- Store:

  - Discord ID

  - Username

  - Display Name

  - Avatar

  - Banner (if available)

- Update user information automatically on login.

- Never store Discord passwords.

- Authentication must use Discord OAuth2 only (no mock authentication).



Security



Security is extremely important.



Implement best practices including:



- CSRF protection

- XSS prevention

- SQL injection protection

- Rate limiting

- Secure session cookies

- HttpOnly cookies

- SameSite cookie policy

- Input validation

- Output escaping

- Server-side validation for every form

- Prepared SQL statements/ORM

- Secure password handling if additional accounts are ever added

- Environment variables for all secrets

- Never hardcode API keys or secrets

- Proper authorization checks

- Role-based permissions (User, Verified Seller, Moderator, Admin)

- Secure file upload validation

- Logging for security events

- Graceful error handling without leaking sensitive information



Performance



- Optimized database queries

- Pagination

- Lazy loading for images

- Responsive images

- Fast page loading

- SEO-friendly HTML

- Accessibility (WCAG AA)

- Mobile-first responsive design



Code Quality



Generate clean, maintainable, production-ready code.



The code should be:



- Well organized

- Easy to extend

- Clearly commented where necessary

- REST-friendly

- Flask-compatible

- Ready for deployment

- Avoid unnecessary JavaScript frameworks where plain HTML, CSS and minimal JavaScript are sufficient.



The entire project should look and behave like a polished production marketplace rather than a prototype.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tigerdevmarket.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/94f93ce1-9c75-4249-86d9-8b50995424a1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
