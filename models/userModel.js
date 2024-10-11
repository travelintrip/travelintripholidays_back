import mongoose from "mongoose";
import autopopulate from "mongoose-autopopulate"; // Import autopopulate plugin
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
      required: [true, "phone is required"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allow null values to be considered unique
    },
    password: {
      type: String,
    },
    token: {
      type: String,
    },
    pincode: {
      type: String,
    },
    state: {
      type: String,
    },
    statename: {
      type: String,
    },
    city: {
      type: String,
      default: "",
    },
    Gender: {
      type: Number,
    },
    DOB: {
      type: Date,
    },
    c_address: {
      type: String,
    },
    address: {
      type: String,
    },
    SelectAddress: {
      type: String,
    },
    userId: {
      type: Number,
    },
    carNumber: {
      type: String,
      default: "",
    },
    c_name: {
      type: String,
      default: "",
    },
    gstin: {
      type: String,
      default: "",
    },
    carName: {
      type: String,
      default: "",
    },
    carImage: {
      type: String,
      default: "",
    },
    Leads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
      },
    ],

    // ratingId: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Rating",
    //     autopopulate: true, // Enable autopopulate for this field

    //   },
    // ],

    status: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Number,
      default: 0,
    },
    type: {
      type: Number,
      default: 0,
    },
    messages: {
      type: Number,
      default: 0,
    },
    notifications: {
      type: Number,
      default: 0,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    LocalCommission: {
      type: Number,
      default: 13,
    },
    OutstationCommission: {
      type: Number,
      default: 13,
    },
    profile: {
      type: String,
      default: "",
    },
    DL: {
      type: String,
      default: "",
    },
    AadhaarFront: {
      type: String,
      default: "",
    },
    AadhaarBack: {
      type: String,
      default: "",
    },
    PoliceVerification: {
      type: String,
      default: "",
    },
    PassPort: {
      type: String,
      default: "",
    },
    Electricity: {
      type: String,
      default: "",
    },
    WaterBill: {
      type: String,
      default: "",
    },
    parentId: {
      // Changed field name to plural and set type as an array of ObjectIds
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    longitude: {
      type: String,
      default: "",
    },
    latitude: {
      type: String,
      default: "",
    },
    Local: {
      type: Number,
    },
    loginCount: {
      type: Number,
    },
  },
  { timestamps: true }
);

userSchema.plugin(autopopulate); // Apply autopopulate plugin to the schema

const userModel = mongoose.model("User", userSchema);

// Check if data exists, if not, create a new document with default values
const checkOrCreateDefaultData = async () => {
  try {
    const result = await userModel.findOne({ type: 2 });
    if (!result) {
      const hashedPassword = await bcrypt.hash("admin@987", 10);
      const admin = new userModel({
        username: "Administrator",
        email: "admin@gmail.com",
        phone: "9876543210",
        password: hashedPassword,
        token: hashedPassword,
        type: "2",
      });
      await admin.save();
      console.log("Admin created successfully.");
    }
  } catch (error) {
    console.error("Error checking or creating admin:", error);
  }
};

checkOrCreateDefaultData();

export default userModel;
