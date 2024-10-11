import mongoose from "mongoose";

const buySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model for the sender
      required: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead", // Reference to the User model for the receiver
      required: true,
    },
  },
  { timestamps: true }
);

const buyModel = mongoose.model("buy", buySchema);

export default buyModel;
