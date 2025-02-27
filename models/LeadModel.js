import mongoose from "mongoose";

const LeadSchema = mongoose.Schema(
  {
    PickupLocation: {
      type: String,
    },
    DropLocation: {
      type: String,
    },
    LeadId: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },

    EmployeeId: {
      // Changed field name to plural and set type as an array of ObjectIds
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    VendorId: {
      // Changed field name to plural and set type as an array of ObjectIds
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    BuyId: [
      {
        // Changed field name to plural and set type as an array of ObjectIds
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    count: {
      type: Number,
      default: 1,
    },
    CPC: {
      type: Number,
      default: 1,
    },
    name: {
      type: String,
    },
    phone: {
      type: Number,
    },
    email: {
      type: String,
    },
    type: {
      type: Number,
    },
    typeRange: {
      type: Number,
    },
    traveller: {
      type: Number,
    },
    source: {
      type: Number,
    },
    PickupTime: {
      type: String,
    },
    ridetype: {
      type: Number,
    },
    status: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const LeadModel = mongoose.model("Lead", LeadSchema);

export default LeadModel;
