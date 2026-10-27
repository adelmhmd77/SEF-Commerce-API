'use strict';

try {
  require('dotenv').config();
} catch (_) {}

const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Product = require('../models/Product.model');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URL;
if (!mongoUri) {
  console.error(' Error: Mongo URI is missing in .env');
  process.exit(1);
}

const runId = Date.now();
const dummyUser = new mongoose.Types.ObjectId();

const baseProduct = {
  name: 'Gaming Mouse',
  shortDescription: 'High precision optical gaming mouse',
  description: 'Ergonomic gaming mouse with customizable RGB and up to 16000 DPI sensor.',
  price: 49.99,
  discountPrice: 39.99,
  stock: 100,
  category: 'electronics',
  brand: 'Logitech',
  images: [{ public_id: `img_${runId}`, url: 'https://example.com/mouse.jpg' }],
  createdBy: dummyUser,
};

async function run() {
  console.log('='.repeat(60));
  console.log('🧪 Starting Product Model Tests');
  console.log('='.repeat(60));

  // الاتصال بـ Database مؤقتة للاختبار
  await mongoose.connect(mongoUri, { dbName: `test_product_${runId}` });
  await Product.init();

  // 1. Slug Generation & Duplicate Collision
  console.log('\n--- 1. Testing Slug Hook & Collision Handling ---');
  const p1 = await Product.create({ ...baseProduct, name: 'Gaming Mouse' });
  console.log(`✓ Product 1 created: "${p1.name}" -> slug: "${p1.slug}"`);
  assert.equal(p1.slug, 'gaming-mouse', 'Expected slug to be "gaming-mouse"');

  const p2 = await Product.create({ ...baseProduct, name: 'Gaming Mouse' });
  console.log(`✓ Product 2 (duplicate name) created: "${p2.name}" -> slug: "${p2.slug}"`);
  assert.notEqual(p2.slug, p1.slug, 'Duplicate name must produce a different slug');
  assert.ok(p2.slug.startsWith('gaming-mouse-'), 'Duplicate slug should have a random suffix');
  console.log('PASS: Slugs generated correctly and collisions resolved.');

  // 2. Validations: Zero images, Negative price, Negative stock
  console.log('\n--- 2. Testing Validation Constraints ---');

  // 2a. Zero images
  try {
    const invalidDoc = new Product({ ...baseProduct, images: [] });
    await invalidDoc.validate();
    assert.fail('Expected zero images to fail validation');
  } catch (err) {
    assert.ok(err.errors?.images, 'Expected zero images to fail validation');
    console.log(`✓ Zero images failed validation: "${err.errors?.images?.message || err.message}"`);
  }

  // 2b. Negative price
  try {
    const invalidDoc = new Product({ ...baseProduct, price: -10 });
    await invalidDoc.validate();
    assert.fail('Expected negative price to fail validation');
  } catch (err) {
    assert.ok(err.errors?.price, 'Expected negative price to fail validation');
    console.log(`✓ Negative price failed validation: "${err.errors?.price?.message || err.message}"`);
  }

  // 2c. Negative stock
  try {
    const invalidDoc = new Product({ ...baseProduct, stock: -5 });
    await invalidDoc.validate();
    assert.fail('Expected negative stock to fail validation');
  } catch (err) {
    assert.ok(err.errors?.stock, 'Expected negative stock to fail validation');
    console.log(`✓ Negative stock failed validation: "${err.errors?.stock?.message || err.message}"`);
  }
  console.log('PASS: All invalid inputs rejected by schema validations.');

  // 3. calcAverageRating() Method
  console.log('\n--- 3. Testing calcAverageRating() Method ---');
  const ratingDoc = new Product({ ...baseProduct, name: 'Rating Test Product' });

  // 0 reviews
  ratingDoc.reviews = [];
  ratingDoc.calcAverageRating();
  console.log(`✓ 0 reviews -> numReviews: ${ratingDoc.numReviews}, averageRating: ${ratingDoc.averageRating}`);
  assert.equal(ratingDoc.numReviews, 0);
  assert.equal(ratingDoc.averageRating, 0);

  // 1 review
  ratingDoc.reviews.push({ user: dummyUser, rating: 4, comment: 'Great!' });
  ratingDoc.calcAverageRating();
  console.log(`✓ 1 review (rating: 4) -> numReviews: ${ratingDoc.numReviews}, averageRating: ${ratingDoc.averageRating}`);
  assert.equal(ratingDoc.numReviews, 1);
  assert.equal(ratingDoc.averageRating, 4);

  // Several reviews: [4, 5, 2] -> 11/3 = 3.666 -> rounded to 3.7
  ratingDoc.reviews.push(
    { user: new mongoose.Types.ObjectId(), rating: 5, comment: 'Awesome' },
    { user: new mongoose.Types.ObjectId(), rating: 2, comment: 'Okay' }
  );
  ratingDoc.calcAverageRating();
  console.log(`✓ Several reviews [4, 5, 2] -> numReviews: ${ratingDoc.numReviews}, averageRating: ${ratingDoc.averageRating}`);
  assert.equal(ratingDoc.numReviews, 3);
  assert.equal(ratingDoc.averageRating, 3.7);
  console.log('PASS: calcAverageRating() calculates and rounds correctly.');

  // 4. Indexes Check
  console.log('\n--- 4. Checking Collection Indexes ---');
  const indexes = await Product.collection.getIndexes();
  console.log('Actual indexes on collection:');
  console.dir(indexes, { depth: null });

  const requiredFields = ['category', 'brand', 'price', 'averageRating', 'createdAt'];
  for (const field of requiredFields) {
    const exists = Object.keys(indexes).some(
      (idx) => idx.includes(field) || JSON.stringify(indexes[idx]).includes(field)
    );
    assert.ok(exists, `Missing required index for ${field}`);
    console.log(`✓ Verified index for: ${field}`);
  }

  const hasTextIndex = Object.keys(indexes).some(
    (idx) => indexes[idx]._fts === 'text' || idx.includes('text')
  );
  assert.ok(hasTextIndex, 'Missing text index on name/description/brand');
  console.log('✓ Verified text index (name, brand, description)');
  console.log('PASS: All required indexes are registered.');

  console.log('\n' + '='.repeat(60));
  console.log(' ALL TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(60));
}

run()
  .catch((err) => {
    console.error('\n Tests failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });
