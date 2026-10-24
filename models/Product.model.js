const mongoose = require('mongoose');
const slugify = require('slugify');


//    1) Image Sub-Schema
  
const imageSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: [true, 'Image public_id is required'],
    },
    url: {
      type: String,
      required: [true, 'Image url is required'],
    },
  },
  { _id: false } 
);


//    2) Review Sub-Schema
//    { user, rating, comment }

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review user is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Review rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true } 
);


//    3) Product Schema
 
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: [0, 'Discount price cannot be negative'],
    },

    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },

    images: {
      type: [imageSchema],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 1;
        },
        message: 'Product must have at least one image',
      },
      required: [true, 'Product images are required'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
    },

    subcategory: {
      type: String,
      trim: true,
      lowercase: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    reviews: {
      type: [reviewSchema],
      default: [],
    },

    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5'],
    },

    numReviews: {
      type: Number,
      default: 0,
      min: [0, 'Number of reviews cannot be negative'],
    },

    featured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product creator (createdBy) is required'],
    },
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


//    4) Indexes
  

productSchema.index(
  { name: 'text', description: 'text', brand: 'text' },
  { weights: { name: 10, brand: 5, description: 1 } }
);

// Single indexes 
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });


//    5) pre('save') 
   

productSchema.pre('save', async function () {
  if (!this.isModified('name')) return;

  const baseSlug =
    slugify(this.name, { lower: true, strict: true }) || 'product';

  let candidate = baseSlug;

  let exists = await this.constructor.exists({
    slug: candidate,
    _id: { $ne: this._id },
  });

  while (exists) {
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${baseSlug}-${suffix}`;

    exists = await this.constructor.exists({
      slug: candidate,
      _id: { $ne: this._id },
    });
  }

  this.slug = candidate;
});



//    6) Instance Method — calcAverageRating()
 

productSchema.methods.calcAverageRating = function () {
  const reviews = this.reviews || [];
  const count = reviews.length;

  this.numReviews = count;

  if (count === 0) {
    this.averageRating = 0;
    return;
  }

  const sum = reviews.reduce((total, review) => {
    return total + review.rating;
  }, 0);

  this.averageRating = Math.round((sum / count) * 10) / 10;
};


const Product = mongoose.model('Product', productSchema);

module.exports = Product;