// models/Order.js
import mongoose from "mongoose";
import crypto from "crypto";

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    amount: { type: Number, required: true }, // بعملة Pi
    userUid: { type: String, required: true }, // معرف مستخدم Pi Network

    paymentId: { type: String, default: null, index: true },
    txid: { type: String, default: null },

    status: {
      type: String,
      enum: ["pending", "approved", "completed", "cancelled"],
      default: "pending",
    },

    approvedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
