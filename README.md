# SEF Commerce API

A full-featured RESTful e-commerce API built with Node.js, Express and MongoDB. It covers the whole life of an online store: user registration with email OTP, product management with image uploads, a smart shopping cart with coupons and stock handling, orders with online payments, and an admin dashboard with real statistics.

It is built by an 11-member team as part of the **SEF Academy** 4-week backend training program.

## About the Project

The goal is to build a production-style backend from scratch and practice the tools and patterns used in real Node.js projects: REST API design, MongoDB schema design, authentication and authorization, file uploads, atomic database operations, online payments, automated emails and aggregation-based analytics.

## What the API Does

- **Authentication and roles:** JWT login, bcrypt password hashing, email verification by OTP, password reset, and role-based access (`customer` and `admin`).
- **Products:** full CRUD with image upload to Cloudinary, auto-generated slugs, reviews with an automatic average rating, and advanced search, filtering and sorting.
- **Smart cart:** stock is reserved when an item is added and returned when it is removed. Totals are computed on the fly, and coupons are supported.
- **Wishlist:** one wishlist per user with full product details.
- **Orders and payments:** orders are created inside a Mongoose transaction, so a failed step rolls everything back. Payment is cash or online through Stripe, with webhooks.
- **Automated emails:** OTP, order confirmation and order status updates through Nodemailer.
- **Admin dashboard:** revenue, order counts, top products, daily revenue and customer totals using MongoDB aggregation pipelines.

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Server-side JavaScript runtime |
| Express | Routing, middleware and error handling |
| MongoDB and Mongoose | Database, schemas, validation, hooks and methods |
| JWT and bcryptjs | Authentication tokens and password hashing |
| Cloudinary and Multer | Image storage and file uploads |
| Stripe | Online payments and webhooks |
| Nodemailer | Transactional emails |
| Joi | Request validation |
| Slugify | URL-friendly product slugs |
| dotenv, cors, cookie-parser, morgan | Configuration, CORS, cookies and request logging |
| Vercel | Deployment |

## Architecture

The project follows the MVC pattern with a clear separation between layers.

```
SEF-Commerce-API/
├── DB/               # MongoDB connection
├── config/           # Cloudinary setup
├── controllers/      # Business logic for every resource
├── middleware/       # Auth guard, role check, upload, error handler, validation
├── models/           # User, Product, Order, Cart, Wishlist, OTP
├── routes/           # Express route definitions
├── utils/            # Email sending, Cloudinary upload, Joi schemas
├── docs/             # Postman collection
└── index.js          # App entry point
```

### Database Models

| Model | What it stores |
|---|---|
| User | Customers and admins, with hashed passwords, addresses and email verification status |
| OTP | Temporary verification codes that expire automatically |
| Product | Product details, images, reviews, average rating and an auto-generated slug |
| Cart | One cart per user, with items, an applied coupon and totals computed on the fly |
| Wishlist | One wishlist per user with the saved products |
| Order | A purchase with a snapshot of the items, shipping address, payment details and status |

### API Groups

| Group | Base path | What it covers |
|---|---|---|
| Authentication | `/auth` | Register with OTP, verify OTP, login, logout, forgot and reset password, current user |
| Users | `/users` | Admin user management and profile updates |
| Products | `/products` | List, search, create, update and delete products, plus reviews |
| Cart | `/carts` | View cart, add, update and remove items, apply and remove coupons, clear cart |
| Wishlist | `/wishlists` | View, add, remove and clear saved products |
| Orders | `/orders` | Place, list, view and cancel orders |
| Admin | `/admin` | Dashboard statistics, order management, carts and wishlist analytics |

## Project Phases

The project is split into four phases, one per week. Each phase builds on the previous one.

| Phase | Focus | What it delivers |
|---|---|---|
| 1 | Foundation (Week 1) | Project setup, MongoDB connection, error handling, validation, the six models, a README and a Postman collection |
| 2 | Authentication (Week 2) | Register with OTP email, verify OTP, login with JWT, protect and admin middleware, forgot and reset password, profile endpoints |
| 3 | Products, Cart and Wishlist (Week 3) | Product CRUD with Cloudinary uploads, search and filters, cart with stock management and coupons, wishlist endpoints |
| 4 | Orders, Payments and Admin (Week 4) | Order creation with transactions, Stripe payments and webhook, automated emails, admin order management and dashboard |


## Team

| Member | GitHub |
|---|---|
| Tasneem Mohamed Eid Hassan (تسنيم محمد عيد حسن) | [@tasneem-muhammad](https://github.com/tasneem-muhammad) |
| Manal Fathy Mongod Mahgoub (منال فتحي منجود محجوب) | [@manalfathy620](https://github.com/manalfathy620) |
| Fatma Heshmat Shtewy Mohamed (فاطمة حشمت شتيوي محمد) | [@fatma-heshmat](https://github.com/fatma-heshmat) |
| Adel Mohamed Adel Ahmed (عادل محمد عادل احمد) | [@adelmhmd77](https://github.com/adelmhmd77) |
| Osama Ahmed El-Saeed El-Nady (اسامه احمد السعيد النادي) | [@OsamaAhmed444](https://github.com/OsamaAhmed444) |
| Kerolos Adel Aziz (كيرلس عادل عزيز) | [@keroadel14](https://github.com/keroadel14) |
| Ahmed Nagah El-Sayed Sharaf (احمد نجاح السيد شرف) | [@ahmednagahms-dot](https://github.com/ahmednagahms-dot) |
| Donia Mohamed Abu El-Saud (دنيا محمد ابو السعود) | [@mohammed-donia](https://github.com/mohammed-donia) |
| Jomana Hesham Abu Zarifa (جومانا هشام ابوظريفة) | [@hzjumana27-star](https://github.com/hzjumana27-star) |
| Shahd El-Hussein Mohamed Mostafa (شهد الحسين محمد مصطفى) | [@shahd-alhoussen](https://github.com/shahd-alhoussen) |
| Safaa Ahmed Fahmy Abdallah (صفاء احمد فهمي عبدللا) | [@safaaa2024](https://github.com/safaaa2024) |

---

Training program by **SEF Academy**.
