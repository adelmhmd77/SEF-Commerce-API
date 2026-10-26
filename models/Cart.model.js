const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true //(Unique Index)
    },
    items: [cartItemSchema],
    coupon: {
        code: { type: String, uppercase: true },
        discountType: { type: String, enum: ['percentage', 'fixed'] },
        discountValue: { type: Number }
    }
}, {
    timestamps: true, 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});

// 1.Subtotal 
cartSchema.virtual('subtotal').get(function() {
    const sum = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return Number(sum.toFixed(2));
});

// 2.Discount Amount
cartSchema.virtual('discountAmount').get(function() {
    const subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (!this.coupon || !this.coupon.discountValue) return 0;

    let discount = 0;
    if (this.coupon.discountType === 'percentage') {
        discount = (subtotal * this.coupon.discountValue) / 100;
    } else if (this.coupon.discountType === 'fixed') {
        discount = this.coupon.discountValue;
    }

    if (discount > subtotal) discount = subtotal;
    return Number(discount.toFixed(2));
});

// 3.Total 
cartSchema.virtual('total').get(function() {
    const subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let discount = 0;

    if (this.coupon && this.coupon.discountValue) {
        if (this.coupon.discountType === 'percentage') {
            discount = (subtotal * this.coupon.discountValue) / 100;
        } else if (this.coupon.discountType === 'fixed') {
            discount = this.coupon.discountValue;
        }
    }

    let total = subtotal - discount;
    if (total < 0) total = 0; 
    return Number(total.toFixed(2));
});

// 4.itemCount
cartSchema.virtual('itemCount').get(function() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);