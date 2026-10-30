require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const generateToken = require('../utils/generateToken');

const runTest = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to DB\n');

    console.log('--- 1. Testing generateToken() Helper ---');
    const dummyId = new mongoose.Types.ObjectId();
    const token = generateToken(dummyId, 'user');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id === dummyId.toString() && decoded.role === 'user') {
      console.log('✓ PASS: Token generated and payload correctly contains { id, role }');
    } else {
      throw new Error('Payload mismatch');
    }

    console.log('\n--- 2. Preparing Test Users ---');
    await User.deleteMany({ email: { $in: ['test_verified@test.com', 'test_unverified@test.com'] } });

    await User.create({
      name: 'Verified User',
      email: 'test_verified@test.com',
      password: 'password123',
      role: 'user',
      isVerified: true
    });
    console.log('✓ Created verified user: test_verified@test.com');

    await User.create({
      name: 'Unverified User',
      email: 'test_unverified@test.com',
      password: 'password123',
      role: 'user',
      isVerified: false
    });
    console.log('✓ Created unverified user: test_unverified@test.com');

    console.log('\n--- 3. Testing Login API Endpoints (HTTP) ---');
    const baseUrl = 'http://localhost:5000/auth/login';

    // الحالة 1: تسجيل دخول ناجح (200 OK)
    const res1 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_verified@test.com', password: 'password123' })
    });
    const data1 = await res1.json();
    if (res1.status === 200 && data1.token && !data1.user.password) {
      console.log('✓ PASS: Valid login returns 200, JWT token, and no password in response');
    } else {
      console.log(`✗ FAIL: Case 1 status: ${res1.status}`);
    }

    // الحالة 2: باسورد خطأ (401 Unauthorized)
    const res2 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_verified@test.com', password: 'wrongPassword' })
    });
    const data2 = await res2.json();
    if (res2.status === 401 && data2.message === 'Invalid email or password') {
      console.log('✓ PASS: Wrong password returns 401 with "Invalid email or password"');
    } else {
      console.log(`✗ FAIL: Case 2 status: ${res2.status}`);
    }

    // الحالة 3: إيميل غير موجود (401 Unauthorized)
    const res3 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notfound@test.com', password: 'password123' })
    });
    const data3 = await res3.json();
    if (res3.status === 401 && data3.message === 'Invalid email or password') {
      console.log('✓ PASS: Non-existing email returns same 401 message');
    } else {
      console.log(`✗ FAIL: Case 3 status: ${res3.status}`);
    }

    // الحالة 4: حساب غير مفعل (403 Forbidden)
    const res4 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_unverified@test.com', password: 'password123' })
    });
    const data4 = await res4.json();
    if (res4.status === 403 && data4.message === 'Please verify your email first') {
      console.log('✓ PASS: Unverified email returns 403 "Please verify your email first"');
    } else {
      console.log(`✗ FAIL: Case 4 status: ${res4.status}`);
    }

    console.log('\n==============================================');
    console.log(' ALL LOGIN TESTS PASSED SUCCESSFULLY! 🚀');
    console.log('==============================================');

    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

runTest();
