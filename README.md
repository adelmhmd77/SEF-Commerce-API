# SEF-Commerce-API
A Back-End RESTFUL API bulit for E-Commerce platform using Node.js , Express.js , MongoDB , Mongoose , JWT , bcryptjs , Cloudinary , Multer 

- 

## TECH Stack

**runtime environment** Node.js
**Web framework**Express.js 
**NoSQL document database**MongoDB
**Stateless authentication tokens**JWT
**object document mapper**Mongoose
**Secure password hashing**bcryptjs
**Cloud-based image storage and delivery** Cloudinary
**Middleware for handling multipart/form-data (file uploads)**Multer
**Email sendin**Nodemailer
**Auto-generate URL-friendly slugs from product names**Slugify
**Load environment variables from .env file**dotenv
**Cross-Origin Resource Sharing middleware**cors
**For make validation**JOI
**For manage the all requests**Morgan
-

### Folder structure
///
SEF-Commerce-API/
├── config/          →  Cloudinary setup 
├──models/    →  Mongoose schemas and models 
  ├──Cart.model.js
  ├──Order.model.js
  ├──OTP.model.js
  ├──Product.model.js
  ├──User.model.js
  ├──Wishlist.model.js
├──node_modules
├── validation/           →  using joi create the files 
├──.env        →  all environment variables 
├──index.js     →  App entry point 
├──README.md
├──vercel.json      →   handle the api deploy to vercel 
├── controllers/     →  Business logic for every resource 
├── DB/     →  Database connection 
├── routes/          →  Express route definitions 
├── middleware/       →  Auth guard, role check, upload, error handler , validate
 ├── utils/           →  sendEmail, uploadToCloudinary, 
 ├── validation/           →  using joi create the files 
 
-

## Getting Started
1. git clone https://github.com/adelmhmd77/SEF-Commerce-API.git
2. cd SEF-Commerce-API
3. git checkout dev
4. git pull origin dev
5. npm install
6. cp .env.example .env
7. npm run dev

-

## Available Scripts

- npm run dev
- npm start

-
 
## Environment Variables 

The project uses the following environment variables:

- `PORT`: The port number on which the Express server runs.
- `MONGO_URI`: The connection string for the MongoDB database.
- `JWT_SECRET`: Secret key used to sign and verify JWT tokens.
- `JWT_EXPIRES_IN`: Expiration timeframe for JWT tokens.

-

## postman connection

* The Postman collection file is located at `docs/postman_collection.json`.
* **How to import:**
  1. Open Postman.
  2. Click on **Import** in the top left corner.
  3. Choose the file located at `docs/postman_collection.json`.
  4. Ensure the `baseUrl` collection variable is set to match your local server running address.

-

## Project Phases Overvie
**Week 1**
 1. Initialize the project (npm init, .env setup, folder structure)
 2. Connect to MongoDB Atlas and handle connection errors 
 3. Build the User Schema with the pre-save password hashing hook
 4. Build the Product Schema with the pre-save slug hook and calcAverageRating method
 5. Build the Cart, Order, Wishlist, and OTP schemas 

**Week 2**
 6. Implement Register with OTP generation and email sending
 7. Implement Verify OTP to activate the user account  
 8. Implement Login with JWT generation
 9. Write the protect middleware (verify JWT) and adminOnly middleware 
10. Implement the full Forgot Password and Reset Password flow 
11. Build the Profile GET, UPDATE, and change-password endpoints
 
**Week 3**
 12. Implement all Product endpoints with Cloudinary upload via Multer 
 13. Implement the Search endpoint with all filter and sort options
 14. Build the complete Cart system with real-time stock management
 15. Add the coupon system with apply and remove endpoints 
 16. Build all Wishlist endpoints
 
 **Week 4**
  17. Implement createOrder using a Mongoose Transaction
  18. Add Stripe PaymentIntent creation for online payments
  19. Integrate Nodemailer for all transactional emails
  20. Build the Admin Dashboard with Aggregation Pipeline queries 
  21. Build Admin CRUD for Users and Admin Order management endpoints 

  -

  # Team Workflow
   
   **Branch Naming:** `feature/phase1-Foundation: Setup, Database & Models`
                      `feature/phase2-Authentication: Register, OTP, Login & Roles`
                      `feature/phase3-Products, Cart & Wishliss`
                      `feature/phase4-Orders, Payment & Admin Dashboard`

 **Commit Style:** Clear and descriptive commit messages explaining the exact changes.
 **Pull Requests (PR):** Submit one PR per task targeting the `dev` branch.
 **Code Review:** Every PR requires at least 1 team member review and approval before merging into `dev`.                    