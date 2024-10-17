import mongoose from "mongoose";
import blogModel from "../models/blogModel.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import categoryModel from "../models/categoryModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import attributeModel from "../models/attributeModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import cartModel from "../models/cartModel.js";
import homeModel from "../models/homeModel.js";
import homeLayoutModel from "../models/homeLayoutModel.js";
import ratingModel from "../models/ratingModel.js";
import wishlistModel from "../models/wishlistModel.js";
import compareModel from "../models/compareModel.js";
import zonesModel from "../models/zonesModel.js";
import promoModel from "../models/promoModel.js";
import taxModel from "../models/taxModel.js";
import notificationModel from "../models/notificationModel.js";
import messageModel from "../models/messageModel.js";
import razorpay from "razorpay";
import nodemailer from "nodemailer";
import { createServer } from "http";
import querystring from "querystring";
import https from "https";
import CryptoJS from "crypto-js"; // Import the crypto module
import axios from "axios";
import transactionModel from "../models/transactionModel.js";
import valetModel from "../models/valetModel.js";
import multer from "multer";
import path from "path";
import { profile } from "console";
import valetRideModel from "../models/valetRideModel.js";
import { type } from "os";
import LeadModel from "../models/LeadModel.js";
// import { sendMessage } from "../utils/whatsappClient.js";
import crypto from "crypto";
import paymentModel from "../models/paymentModel.js";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import puppeteer from "puppeteer";
import { OAuth2Client } from "google-auth-library";
import buyModel from "../models/buyModel.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

dotenv.config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define the destination folder where uploaded images will be saved
    cb(null, "public/uploads/new");
  },
  filename: function (req, file, cb) {
    // Define the filename for the uploaded image
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

export const uploadImage = upload.single("image");

// Function to pad the plaintext
function pkcs5_pad(text, blocksize) {
  const padding = blocksize - (text.length % blocksize);
  for (let i = 0; i < padding; i++) {
    text += String.fromCharCode(padding);
  }
  return text;
}

const encrypt = (data, key) => {
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  return ciphertext;
};

// Function to decrypt ciphertext
function decrypt(encryptedText, key) {
  // Convert key to MD5 and then to binary
  const secretKey = CryptoJS.enc.Hex.parse(
    CryptoJS.MD5(key).toString(CryptoJS.enc.Hex)
  );
  // Initialize the initialization vector
  const initVector = CryptoJS.enc.Utf8.parse(
    Array(16)
      .fill(0)
      .map((_, i) => String.fromCharCode(i))
      .join("")
  );
  // Convert the encryptedText from hexadecimal to binary
  const encryptedData = CryptoJS.enc.Hex.parse(encryptedText);
  // Decrypt using AES-128 in CBC mode
  const decryptedText = CryptoJS.AES.decrypt(
    { ciphertext: encryptedData },
    secretKey,
    { iv: initVector, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.NoPadding }
  );
  // Remove PKCS#5 padding
  return decryptedText
    .toString(CryptoJS.enc.Utf8)
    .replace(/[\x00-\x1F\x80-\xFF]+$/g, "");
}

function decryptURL(encryptedText, key) {
  const keyHex = CryptoJS.enc.Hex.parse(md5(key));
  const initVector = CryptoJS.enc.Hex.parse("000102030405060708090a0b0c0d0e0f");
  const encryptedHex = CryptoJS.enc.Hex.parse(encryptedText);
  const decryptedText = CryptoJS.AES.decrypt(
    { ciphertext: encryptedHex },
    keyHex,
    { iv: initVector, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.NoPadding }
  );
  return decryptedText.toString(CryptoJS.enc.Utf8);
}

function md5(input) {
  return CryptoJS.MD5(input).toString(CryptoJS.enc.Hex);
}

const secretKey = process.env.SECRET_KEY;

// signup user

export const SignupUserImage = upload.fields([
  { name: "profile", maxCount: 1 },
  { name: "DLfile", maxCount: 1 },
  { name: "AadhaarFront", maxCount: 1 },
  { name: "AadhaarBack", maxCount: 1 },
  { name: "PoliceVerification", maxCount: 1 },
  { name: "PassPort", maxCount: 1 },
  { name: "Electricity", maxCount: 1 },
  { name: "WaterBill", maxCount: 1 },
]);

export const profileUserImage = upload.fields([
  { name: "profile", maxCount: 1 },
]);

// Utility function to compress and save the image
const compressImage = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .resize({ width: 800 }) // Resize image to a maximum width of 800px
    .jpeg({ quality: 80 }) // Compress to JPEG format with 80% quality
    .toFile(outputPath); // Save the processed image
};

// Middleware function to handle image compression
export const handleImageCompression = async (req, res, next) => {
  try {
    const files = req.files;
    if (!files) return next(); // No files to process, continue to the next middleware

    for (const [fieldname, fileArray] of Object.entries(files)) {
      for (const file of fileArray) {
        const tempPath = file.path;
        const outputPath = tempPath.replace(
          /-(\d+)\.(\w+)$/,
          (match, p1, ext) => `-${p1}-compressed.${ext}`
        );

        // Compress the image
        await compressImage(tempPath, outputPath);

        // Replace the file path with the compressed file path
        file.path = outputPath;

        // Optionally remove the original uncompressed file
        fs.unlinkSync(tempPath);
      }
    }
    next();
  } catch (error) {
    console.error("Error processing images:", error);
    res.status(500).send("Error processing images.");
  }
};

// for Leads

// export const AddAdminLeadController = async (req, res) => {
//   try {
//     const {
//       PickupLocation,
//       DropLocation,
//       startDate,
//       endDate,
//       count,
//       name,
//       email,
//       phone,
//       CPC,
//       type,
//       userId,
//       source,
//     } = req.body;

//     // Validation
//     if (
//       !PickupLocation ||
//       !DropLocation ||
//       !startDate ||
//       !endDate ||
//       !count ||
//       !name ||
//       !email ||
//       !phone ||
//       !CPC ||
//       !type
//     ) {
//       return res.status(400).send({
//         success: false,
//         message: "Please Provide All Fields",
//       });
//     }

//     // Calculate the auto-increment ID
//     const lastLead = await LeadModel.findOne().sort({ _id: -1 }).limit(1);
//     let LeadId;

//     if (lastLead) {
//       // Convert lastOrder.orderId to a number before adding 1
//       const lastOrderId = parseInt(lastLead.LeadId);
//       LeadId = lastOrderId + 1;
//     } else {
//       LeadId = 1;
//     }

//     // Create a new category with the specified parent
//     const newLead = new LeadModel({
//       PickupLocation,
//       DropLocation,
//       startDate,
//       endDate,
//       count,
//       LeadId,
//       name,
//       email,
//       phone,
//       CPC,
//       type,
//       VendorId: userId,
//       source,
//     });
//     await newLead.save();

//     return res.status(200).send({
//       success: true,
//       message: "Leads Creating Successfully!",
//     });
//   } catch (error) {
//     console.error("Error while creating Leads:", error);
//     return res.status(400).send({
//       success: false,
//       message: "Error while creating Leads",
//       error,
//     });
//   }
// };

export const userBuyLeadController = async (req, res) => {
  const { BuyId, leadId } = req.body;

  if (!BuyId || !leadId) {
    return res
      .status(400)
      .json({ message: "BuyId and leadId are required", success: false });
  }

  try {
    // Find the lead by leadId
    const lead = await LeadModel.findById(leadId);

    if (!lead) {
      return res
        .status(404)
        .json({ message: "Lead not found", success: false });
    }

    if (lead.BuyId.includes(BuyId)) {
      return res
        .status(400)
        .json({ message: "Lead already purchased", success: false });
    }

    if (lead.count < lead.BuyId.length + 1) {
      return res.status(400).json({
        message: "Cannot add more BuyIds, limit reached",
        success: false,
      });
    }

    // Update user wallet
    const user = await userModel.findById(BuyId);
    if (user.status === 2) {
      return res.status(400).json({
        message: "Account Suspended",
        success: false,
      });
    }
    console.log(user.wallet, lead.CPC);

    if (user.wallet < lead.CPC || user.wallet === lead.CPC) {
      if (user.wallet === lead.CPC) {
      } else {
        return res.status(400).json({
          message: "You do not have enough funds to accept this lead",
          success: false,
        });
      }
    }

    user.wallet -= lead.CPC;
    user.Leads.push(lead._id);
    lead.BuyId.push(BuyId);

    // for create trasaction id

    const lastTrans = await transactionModel
      .findOne()
      .sort({ _id: -1 })
      .limit(1);
    let lastTransId;

    if (lastTrans) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastTrans.t_no || 0);
      lastTransId = lastOrderId + 1;
    } else {
      lastTransId = 1;
    }

    // Calculate the auto-increment ID
    const t_id = "tt00" + lastTransId;

    // Create a new transaction
    const transaction = new transactionModel({
      userId: BuyId, // Use BuyId instead of lead.BuyId
      type: 1,
      note: `Lead Id #${leadId} Purchase by user`,
      amount: -lead.CPC,
      t_id,
      t_no: lastTransId,
    });

    // Create a new transaction
    const buymodel = new buyModel({
      userId: BuyId,
      leadId,
    });

    await Promise.all([
      lead.save(),
      transaction.save(),
      user.save(),
      buymodel.save(),
    ]);

    return res.status(200).json({
      message: "BuyId successfully added to lead",
      success: true,
      lead,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `Error occurred during processing: ${error.message}`,
      success: false,
      error,
    });
  }
};

// export const userAllLeadController = async (req, res) => {
//   try {
//     // Extract pagination parameters from the request query
//     const {
//       skip = 0,
//       limit = 50,
//       sortOrder,
//       status,
//       type,
//       searchTerm,
//       userId,
//     } = req.query;

//     // Convert skip and limit to integers
//     const skipNumber = parseInt(skip, 10);
//     const limitNumber = parseInt(limit, 10);

//     const query = {};
//     if (searchTerm) {
//       const regex = new RegExp(searchTerm, "i"); // Case-insensitive regex pattern for the search term

//       // Add regex pattern to search both username and email fields for the full name
//       query.$or = [{ PickupLocation: regex }, { DropLocation: regex }];

//       // if (!isNaN(Number(searchTerm))) {
//       //   query.$or.push({ phone: Number(searchTerm) });
//       // }
//       // if (!isNaN(Number(searchTerm))) {
//       //   query.$or.push({ LeadId: Number(searchTerm) });
//       // }
//     }

//     console.log("sortOrder", sortOrder);

//     if (status.length > 0) {
//       if (status === "open") {
//         query.status = { $in: 0 }; // Use $in operator to match any of the values in the array
//       } else if (status === "closed") {
//         query.status = { $in: 1 }; // Use $in operator to match any of the values in the array
//       }
//     }

//     if (type.length > 0) {
//       if (type === "ride") {
//         query.type = { $in: 1 }; // Use $in operator to match any of the values in the array
//       } else if (type === "tour") {
//         query.type = { $in: 0 }; // Use $in operator to match any of the values in the array
//       }
//     }

//     // Add userId filtering
//     if (userId) {
//       query.BuyId = { $nin: [userId] }; // Exclude leads where BuyId contains userId
//     }
//     // Check if count is greater than the length of BuyId
//     query.$expr = {
//       $gt: [
//         { $size: "$BuyId" }, // Size of BuyId array
//         "$count", // Value of count
//       ],
//     };

//     // Logging the constructed query
//     console.log("MongoDB Query:", JSON.stringify(query, null, 2));
//     // // Add date range filtering to the query
//     // if (startDate && endDate) {
//     //   query.createdAt = { $gte: startDate, $lte: endDate };
//     // } else if (startDate) {
//     //   query.createdAt = { $gte: startDate };
//     // } else if (endDate) {
//     //   query.createdAt = { $lte: endDate };
//     // }

//     const sortOptions = {};

//     // Conditionally add price (CPC) sorting
//     if (sortOrder) {
//       if (sortOrder === "highest") {
//         sortOptions["CPC"] = -1; // Sort by CPC in descending order
//       } else if (sortOrder === "lowest") {
//         sortOptions["CPC"] = 1; // Sort by CPC in ascending order
//       } else if (sortOrder === "latest") {
//         sortOptions["_id"] = -1; // Sort by CPC in descending order
//       } else if (sortOrder === "old") {
//         sortOptions["_id"] = 1; // Sort by CPC in descending order
//       }
//     }

//     console.log("sortOptions", sortOptions);

//     // Fetch leads with pagination
//     const leads = await LeadModel.find(query)
//       .sort(sortOptions)
//       .skip(skipNumber)
//       .limit(limitNumber);

//     // Fetch total count of leads for client-side pagination handling
//     const totalLeadsCount = await LeadModel.find(query).countDocuments();

//     return res.status(200).send({
//       success: true,
//       message: "Leads Found Successfully!",
//       data: {
//         leads,
//         totalCount: totalLeadsCount,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({
//       message: `Error Occurred During Fetching Leads ${error}`,
//       success: false,
//       error,
//     });
//   }
// };

export const userAllLeadController = async (req, res) => {
  try {
    // Extract pagination parameters from the request query
    const {
      skip = 0,
      limit = 50,
      sortOrder,
      status,
      type,
      searchTerm,
      userId,
      startDate,
      endDate,
    } = req.query;

    // Convert skip and limit to integers
    const skipNumber = parseInt(skip, 10);
    const limitNumber = parseInt(limit, 10);

    const matchStage = {};

    // Build the match stage
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      matchStage.$or = [{ PickupLocation: regex }, { DropLocation: regex }];
    }

    if (status && status.length > 0) {
      if (status === "open") {
        matchStage.status = 0; // Open leads
      } else if (status === "closed") {
        matchStage.status = 1; // Closed leads
      }
    }

    if (type && type.length > 0) {
      if (type === "ride") {
        matchStage.type = 1; // Ride type
      } else if (type === "tour") {
        matchStage.type = 0; // Tour type
      }
    }

    // Parse startDate and endDate as Date objects
    if (startDate) {
      matchStage.createdAt = { $gte: new Date(startDate) }; // Ensure startDate is a Date object
    }

    if (endDate) {
      matchStage.createdAt = {
        ...matchStage.createdAt,
        $lte: new Date(endDate),
      }; // Ensure endDate is a Date object
    }

    if (userId) {
      const userIdObject = new mongoose.Types.ObjectId(userId); // Correct usage
      matchStage.BuyId = { $nin: [userIdObject] }; // Exclude leads with this userId
    }

    // Create the aggregation pipeline
    const pipeline = [
      {
        $match: matchStage, // Match stage
      },
      {
        $addFields: {
          BuyIdSize: { $size: "$BuyId" }, // Add a field for the size of BuyId
        },
      },
      {
        $match: {
          $expr: { $gt: ["$count", "$BuyIdSize"] }, // Filter where count is greater than BuyId size
        },
      },
      {
        $sort: {
          _id: sortOrder === "latest" ? -1 : 1, // Sort by _id based on sortOrder
        },
      },
      {
        $skip: skipNumber, // Skip for pagination
      },
      {
        $limit: limitNumber, // Limit for pagination
      },
    ];

    // Fetch leads using aggregation
    const leads = await LeadModel.aggregate(pipeline);

    // Fetch total count of leads for client-side pagination handling
    const totalLeadsCount = await LeadModel.countDocuments(matchStage);

    return res.status(200).send({
      success: true,
      message: "Leads Found Successfully!",
      data: {
        leads,
        totalCount: totalLeadsCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: `Error Occurred During Fetching Leads: ${error}`,
      success: false,
      error,
    });
  }
};

export const userByIdLeadController = async (req, res) => {
  // Extract pagination parameters and BuyId from the request query
  const { skip = 0, limit = 50, buyId } = req.query;

  // Convert skip and limit to integers
  const skipNumber = parseInt(skip, 10);
  const limitNumber = parseInt(limit, 10);

  // Ensure buyId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(buyId)) {
    return res.status(400).send({
      message: "Invalid BuyId",
      success: false,
    });
  }

  // Convert buyId to mongoose ObjectId
  const buyIdObjectId = new mongoose.Types.ObjectId(buyId);

  try {
    const totalLeadsCount = await LeadModel.find({
      BuyId: buyIdObjectId,
    }).countDocuments();

    // Query to find leads by BuyId
    const leads = await LeadModel.find({ BuyId: buyIdObjectId })
      .skip(skipNumber)
      .limit(limitNumber);

    // Send the response with the leads
    return res.status(200).json({
      message: "Leads fetched successfully",
      success: true,
      data: {
        leads,
        totalCount: totalLeadsCount,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: `Error occurred while fetching leads: ${error.message}`,
      success: false,
      error,
    });
  }
};

export const userByLeadController = async (req, res) => {
  // Extract pagination parameters and BuyId from the request query
  const { skip = 0, limit = 50, buyId } = req.query;

  // Convert skip and limit to integers
  const skipNumber = parseInt(skip, 10);
  const limitNumber = parseInt(limit, 10);

  // Ensure buyId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(buyId)) {
    return res.status(400).send({
      message: "Invalid BuyId",
      success: false,
    });
  }

  // Convert buyId to mongoose ObjectId
  const buyIdObjectId = new mongoose.Types.ObjectId(buyId);

  try {
    const totalLeadsCount = await buyModel
      .find({ userId: buyIdObjectId })
      .populate("leadId")
      .sort({ createdAt: -1 });

    // Query to find leads by BuyId
    const leads = await buyModel
      .find({ userId: buyIdObjectId })
      .skip(skipNumber)
      .limit(limitNumber)
      .populate("leadId")
      .sort({ createdAt: -1 }); // Sort by creation date in descending order

    // Filter out any leads where leadId could not be populated
    const filteredLeads = leads.filter((lead) => lead.leadId !== null);
    // Filter out any leads where leadId could not be populated
    const totalLeadsCountLength = totalLeadsCount.filter(
      (lead) => lead.leadId !== null
    );
    // Send the response with the leads
    console.log(totalLeadsCount.length);

    return res.status(200).json({
      message: "Leads fetched successfully",
      success: true,
      data: {
        leads: filteredLeads,
        totalCount: totalLeadsCountLength.length,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: `Error occurred while fetching leads: ${error.message}`,
      success: false,
      error,
    });
  }
};

export const userByIdReportLeadController = async (req, res) => {
  // Extract pagination parameters and BuyId from the request query
  const { buyId } = req.query;

  // Ensure buyId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(buyId)) {
    return res.status(400).send({
      message: "Invalid BuyId",
      success: false,
    });
  }

  // Convert buyId to mongoose ObjectId
  const buyIdObjectId = new mongoose.Types.ObjectId(buyId);

  try {
    const totalLeadsCount = await LeadModel.find({
      BuyId: buyIdObjectId,
    }).countDocuments();

    // Query to find leads by BuyId
    const leads = await LeadModel.find({ BuyId: buyIdObjectId });

    // Send the response with the leads
    return res.status(200).json({
      message: "Leads fetched successfully",
      success: true,
      data: {
        leads,
        totalCount: totalLeadsCount,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: `Error occurred while fetching leads: ${error.message}`,
      success: false,
      error,
    });
  }
};

export const SignupUserType = async (req, res) => {
  try {
    const {
      type,
      username,
      phone,
      email,
      password,
      pincode,
      Gender,
      DOB,
      address,
    } = req.body;

    const {
      profile,
      DLfile,
      AadhaarFront,
      AadhaarBack,
      PoliceVerification,
      PassPort,
      Electricity,
      WaterBill,
    } = req.files;

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

    console.log("Uploaded profile:", profile[0].path);

    // Calculate the auto-increment ID
    const lastUser = await userModel.findOne().sort({ _id: -1 }).limit(1);
    let userId;

    if (lastUser) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastUserId = parseInt(lastUser.userId || 126325);
      userId = lastUserId + 1;
    } else {
      userId = 126325;
    }

    const newUser = new userModel({
      type,
      username,
      phone,
      email,
      password: hashedPassword,
      pincode,
      Gender,
      DOB,
      address,
      profile: profile ? profile[0].path : "",
      DL: DLfile ? DLfile[0].path : "",
      AadhaarFront: AadhaarFront ? AadhaarFront[0].path : "",
      AadhaarBack: AadhaarBack ? AadhaarBack[0].path : "",
      PoliceVerification: PoliceVerification ? PoliceVerification[0].path : "",
      PassPort: PassPort ? PassPort[0].path : "",
      Electricity: Electricity ? Electricity[0].path : "",
      WaterBill: WaterBill ? WaterBill[0].path : "",
      userId,
    });

    await newUser.save();
    res.status(201).json({
      success: true,
      message: "User signed up successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: `Error occurred during user signup ${error}`,
      success: false,
      error,
    });
  }
};

export const SignupUserCarImage = upload.fields([
  { name: "carImage", maxCount: 1 },
]);

export const SignupUserValetType = async (req, res) => {
  try {
    const {
      username,
      phone,
      carNumber,
      carName,
      VendorId,
      driverId,
      Valet_Model,
      mode,
      payment,
    } = req.body;

    const { carImage } = req.files;

    let existingUser = await userModel.findOne({ phone });

    if (existingUser) {
      // Update existing user details
      existingUser.username = username;
      existingUser.carNumber = carNumber;
      existingUser.carName = carName;
      if (carImage && carImage.length > 0) {
        existingUser.carImage = carImage[0].path;
      }
      await existingUser.save();
    } else {
      // Create new user
      existingUser = await userModel.create({
        username,
        phone,
        carImage: carImage && carImage.length > 0 ? carImage[0].path : "",
        carNumber,
        carName,
      });
    }

    const lastvaletRide = await valetRideModel
      .findOne()
      .sort({ ValetRide_Id: -1 })
      .limit(1);
    let ValetRide_Id = 1; // Default to 1 if no orders exist yet

    if (lastvaletRide) {
      ValetRide_Id = lastvaletRide.ValetRide_Id + 1;
    }

    const valetRideData = {
      userId: existingUser._id,
      VendorId,
      driverId,
      Valet_Model,
      ValetRide_Id,
    };

    if (mode !== "") {
      valetRideData.mode = mode; // Add mode if not empty
    }

    if (payment !== "") {
      valetRideData.payment = payment; // Add mode if not empty
    }

    const valetRide = new valetRideModel(valetRideData);

    await valetRide.save();

    await valetModel.findByIdAndUpdate(
      Valet_Model, // Find by Valet_Model _id
      {
        $push: { Valetride_Model: valetRide._id }, // Add valetRide _id to Valetride_Model array
      },
      {
        upsert: true, // Create the document if it doesn't exist
        new: true, // Return the updated document after update
      }
    );

    res.status(201).json({
      success: true,
      message: "User signed up successfully",
    });
  } catch (error) {
    console.error("Error occurred during user signup:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred during user signup: ${error.message}`,
      error: error.message,
    });
  }
};

export const CreateValetRide = async (req, res) => {
  try {
    const {
      username,
      userId,
      email,
      carNumber,
      carName,
      VendorId,
      Valet_Model,
      discount,
      total,
      date,
      time,
      mode,
      // payment
    } = req.body;

    let existingUser = await userModel.findById(userId);

    // Update existing user details
    if (username) {
      existingUser.username = username;
    }
    if (email) {
      existingUser.email = email;
    }

    existingUser.carNumber = carNumber;
    existingUser.carName = carName;

    await existingUser.save();

    const lastvaletRide = await valetRideModel
      .findOne()
      .sort({ ValetRide_Id: -1 })
      .limit(1);
    let ValetRide_Id = 1; // Default to 1 if no orders exist yet

    if (lastvaletRide) {
      ValetRide_Id = lastvaletRide.ValetRide_Id + 1;
    }

    const valetRideData = {
      userId: existingUser._id,
      VendorId,
      Valet_Model,
      ValetRide_Id,
      discount,
      total,
      date,
      time,
      payment: 1,
      type: 1,
    };

    if (mode !== "") {
      valetRideData.mode = mode; // Add mode if not empty
    }

    // Create a new valet ride entry
    const valetRide = new valetRideModel(valetRideData);

    await valetRide.save();

    await valetModel.findByIdAndUpdate(
      Valet_Model, // Find by Valet_Model _id
      {
        $push: { Valetride_Model: valetRide._id }, // Add valetRide _id to Valetride_Model array
      },
      {
        upsert: true, // Create the document if it doesn't exist
        new: true, // Return the updated document after update
      }
    );

    res.status(201).json({
      success: true,
      message: "Create Valet Ride Successfully",
    });
  } catch (error) {
    console.error("Error occurred during creating valet ride", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred during creating valet ride: ${error.message}`,
      error: error.message,
    });
  }
};

export const userAdminValet = async (req, res) => {
  try {
    const valet = await valetModel.find({ type: 1 });
    if (!valet) {
      res.status(400).json({
        success: false,
        message: "Admin Valet Not Found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Admin Valet Not Found",
        valet: valet,
      });
    }
  } catch (error) {
    console.error("Error occurred during user signup:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred during user signup: ${error.message}`,
      error: error.message,
    });
  }
};

export const userAdminValetId = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the provided id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Valet ID",
      });
    }

    const valet = await valetModel.findById(id);

    if (!valet) {
      return res.status(404).json({
        success: false,
        message: "Admin Valet Not Found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin Valet Found",
      valet: valet,
    });
  } catch (error) {
    console.error("Error occurred during user admin valet lookup:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred during user admin valet lookup: ${error.message}`,
      error: error.message,
    });
  }
};

export const UpdateUserValetType = async (req, res) => {
  try {
    const { username, phone, carNumber, carName } = req.body;

    const { carImage } = req.files;

    // Check if the phone number exists in the request body
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required for updating user.",
      });
    }

    // Prepare the update object based on provided fields
    let updateFields = {
      username,
      carNumber,
      carName,
    };

    // Add carImage to updateFields if it exists in the request
    if (carImage) {
      updateFields.carImage = carImage[0].path;
    }

    // Find and update the user based on the phone number
    let updatedUser = await userModel.findOneAndUpdate(
      { phone: phone },
      updateFields,
      { new: true } // To return the updated document
    );

    // Check if user was found and updated
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with the provided phone number.",
      });
    }

    // const sendphone = updatedUser.phone;
    // const whatsappNumber = `91${sendphone}@c.us`;

    // const whastappmsg = `Thankyou ${updatedUser.username}, driver has updated your details  `;

    //  await sendMessage(whatsappNumber, whastappmsg);

    // Success response
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      updatedUser: updatedUser, // Optionally send back the updated user object
    });
  } catch (error) {
    console.error("Error occurred during user update:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred during user update: ${error.message}`,
      error: error,
    });
  }
};

export const userValetRideUserController = async (req, res) => {
  try {
    const { driverId, valetId } = req.params;

    // Assuming you want to find a valet record based on userId and valetId
    const valet = await valetRideModel
      .find({ driverId, Valet_Model: valetId })
      .populate(
        "userId",
        "_id username email phone carImage carNumber carName PickupStartLocation PickupEndLocation DropStartLocation DropEndLocation mode"
      ) // Populate userId with specified fields
      .populate("VendorId", "_id username email phone "); // Populate VendorId with specified fields

    const fixvalet = await valetRideModel
      .find({ Valet_Model: valetId, type: 1 })
      .populate(
        "userId",
        "_id username email phone carImage carNumber carName PickupStartLocation PickupEndLocation DropStartLocation DropEndLocation mode"
      ) // Populate userId with specified fields
      .populate("VendorId", "_id username email phone "); // Populate VendorId with specified fields

    if (!valet) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    return res.status(200).json({
      message: "Single Valet Found By user ID and Order ID",
      success: true,
      valet: valet,
      fixvalet: fixvalet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while getting Valet",
      error: error.message,
    });
  }
};

export const userValetParkingUserController = async (req, res) => {
  try {
    const { userId, valetId } = req.params;

    // Assuming you want to find a valet record based on userId and valetId
    const valet = await valetRideModel
      .find({ userId, Valet_Model: valetId })
      .populate(
        "userId",
        "_id username email phone carImage carNumber carName PickupStartLocation PickupEndLocation DropStartLocation DropEndLocation"
      ) // Populate userId with specified fields
      .populate("VendorId", "_id username email phone "); // Populate VendorId with specified fields

    if (!valet) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    return res.status(200).json({
      message: "Single Valet Found By user ID and Order ID",
      success: true,
      valet: valet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while getting Valet",
      error: error.message,
    });
  }
};

// notification functions

export const AddNotification = async (req, res) => {
  try {
    const { text, userId } = req.body;

    console.log(text, userId, senderId);
    // Create a new Message document
    const notifications = new notificationModel({
      text,
      receiver: userId,
    });

    // Save the message to the database
    await notifications.save();
    await userModel.findByIdAndUpdate(
      userId,
      { $inc: { notifications: 1 } }, // Increment the notifications count by 1
      { new: true } // Return the updated user document
    );

    return res.status(200).send({
      success: true,
      message: "Notifications Send successfully",
    });
  } catch (error) {
    return res.status(500).send({
      message: `error Message Send ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const DeleteNotification = async (req, res) => {
  const notificationId = req.params.id;

  try {
    // Find the notification by ID and delete it
    const deletedNotification = await notificationModel.findByIdAndDelete(
      notificationId
    );

    if (!deletedNotification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    // Return success response
    res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

export const GetUserNotification = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find notifications where the receiver is equal to userId
    const notifications = await notificationModel
      .find({ receiver: userId })
      .lean();
    const user = await userModel.findByIdAndUpdate(
      userId,
      { notifications: 0 }, // Set the notifications count to 0
      { new: true } // Return the updated user document
    );

    return res.status(200).send({
      success: true,
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).send({
      success: false,
      message: `Error fetching notifications: ${error}`,
      error,
    });
  }
};

const instance = new razorpay({
  key_id: process.env.LIVEKEY,
  key_secret: process.env.LIVESECRET,
});
// Wallet functionality

export const CheckoutWallet = async (req, res) => {
  const { amount, userId, note, Local } = req.body;
  const gstRate = 0.18;
  const startAmount = amount * gstRate;
  const finalAmount = amount + startAmount;

  const options = {
    amount: Number(finalAmount * 100),
    currency: "INR",
  };
  const order = await instance.orders.create(options);

  // Calculate the auto-increment ID
  const lastLead = await paymentModel.findOne().sort({ _id: -1 }).limit(1);
  let paymentId;

  if (lastLead) {
    if (lastLead.paymentId === undefined) {
      paymentId = 1;
    } else {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastLead.paymentId);
      paymentId = lastOrderId + 1;
    }
  } else {
    paymentId = 1;
  }

  const payment = await new paymentModel({
    totalAmount: finalAmount,
    userId: userId,
    razorpay_order_id: order.id,
    note: note,
    Local: Local,
    paymentId,
  });
  await payment.save();

  console.log(order, payment);
  res.status(200).json({
    success: true,
    order,
  });
};

export const paymentverification = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedsgnature = crypto
    .createHmac("sha256", process.env.LIVESECRET)
    .update(body.toString())
    .digest("hex");
  const isauth = expectedsgnature === razorpay_signature;
  if (isauth) {
    // await Payment.create({
    //   razorpay_order_id,
    //   razorpay_payment_id,
    //   razorpay_signature,
    // });

    const payment = await paymentModel.findOneAndUpdate(
      { razorpay_order_id: razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        payment: 1,
      },
      { new: true } // This option returns the updated document
    );
    console.log(
      "razorpay_order_id, razorpay_payment_id, razorpay_signature",
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    console.log("razorpay_signature", payment, req.body);

    const gstRate = 0.18; // 18% GST

    // Calculate the base amount before GST
    const baseAmount = payment.totalAmount / (1 + gstRate);

    const finalAmount = baseAmount.toFixed(2);

    await AddWalletPayment(payment.userId, 0, payment.note, finalAmount);

    res.redirect(
      `${process.env.LIVEWEB}paymentsuccess?reference=${razorpay_payment_id}`
    );
  } else {
    await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        payment: 2,
      },
      { new: true } // This option returns the updated document
    );

    res.status(400).json({ success: false });
  }
};

export const WalletKey = async (req, res) => {
  return res
    .status(200)
    .json({ key: encrypt(process.env.LIVEKEY, process.env.APIKEY) });
};

export const AddWallet = async (req, res) => {
  try {
    const { userId, type, note, wallet } = req.body;

    // for create trasaction id

    const lastTrans = await transactionModel
      .findOne()
      .sort({ _id: -1 })
      .limit(1);
    let lastTransId;

    if (lastTrans) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastTrans.t_no || 0);
      lastTransId = lastOrderId + 1;
    } else {
      lastTransId = 1;
    }

    // Calculate the auto-increment ID
    const t_id = "tt00" + lastTransId;

    // Create a new transaction
    const transaction = new transactionModel({
      userId,
      type,
      note,
      amount: wallet,
      t_id,
      t_no: lastTransId,
    });

    await transaction.save();

    // Update user's wallet amount
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    user.wallet += wallet;

    await user.save();

    return res.status(200).send({
      success: true,
      message: "Wallet updated successfully",
    });
  } catch (error) {
    return res.status(500).send({
      message: `Error adding to wallet: ${error}`,
      success: false,
      error,
    });
  }
};

export const AddWalletPayment = async (userId, type, note, wallet) => {
  try {
    // for create trasaction id

    const lastTrans = await transactionModel
      .findOne()
      .sort({ _id: -1 })
      .limit(1);
    let lastTransId;

    if (lastTrans) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastTrans.t_no || 0);
      lastTransId = lastOrderId + 1;
    } else {
      lastTransId = 1;
    }

    // Calculate the auto-increment ID
    const t_id = "tt00" + lastTransId;

    // Create a new transaction
    const transaction = new transactionModel({
      userId,
      type,
      note,
      amount: wallet,
      t_id,
      t_no: lastTransId,
    });

    await transaction.save();

    // Update user's wallet amount
    const user = await userModel.findById(userId);

    if (!user) {
      console.log("User not found");
      return { success: false, message: "User not found" };
    }

    user.wallet += wallet;

    await user.save();
    console.log("Wallet updated successfully");
    return { success: true, message: "Wallet updated successfully" };
  } catch (error) {
    console.log(`Error adding to wallet: ${error}`);

    return {
      success: false,
      message: `Error adding to wallet: ${error}`,
      error,
    };
  }
};

export const AllTransaction = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await transactionModel.find({ userId: userId }).lean();

    return res.status(200).send({
      success: true,
      message: "Transaction fetched successfully",
      transactions,
    });
  } catch (error) {
    return res.status(500).send({
      message: `Error transaction fetched: ${error}`,
      success: false,
      error,
    });
  }
};

export const AllPayment = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await paymentModel.find({ userId: userId }).lean();

    return res.status(200).send({
      success: true,
      message: "payments fetched successfully",
      transactions,
    });
  } catch (error) {
    return res.status(500).send({
      message: `Error payments fetched: ${error}`,
      success: false,
      error,
    });
  }
};

// Message functionality

export const AddMessage = async (req, res) => {
  try {
    const { text, userId, senderId } = req.body;

    console.log(text, userId, senderId);
    // Create a new Message document
    const message = new messageModel({
      text,
      receiver: userId,
      sender: senderId,
    });

    // Save the message to the database
    await message.save();

    return res.status(200).send({
      success: true,
      message: "Message Send successfully",
    });
  } catch (error) {
    return res.status(500).send({
      message: `error Message Send ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const AddMessageOrder = async (req, res) => {
  try {
    const { text, userId, senderId, orderId } = req.body;

    console.log(text, userId, senderId, orderId);
    // Create a new Message document
    const message = new messageModel({
      text,
      receiver: userId,
      sender: senderId,
      orderId: orderId,
    });

    // Save the message to the database
    await message.save();

    return res.status(200).send({
      success: true,
      message: "Message Send successfully",
    });
  } catch (error) {
    return res.status(500).send({
      message: `error Message Send ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const GetUserMessage = async (req, res) => {
  try {
    const userId = req.params.userId;
    const senderId = req.params.senderId;

    // Find messages where the sender is equal to userId and the receiver is equal to senderId
    const messages = await messageModel
      .find({
        $or: [
          { sender: senderId, receiver: userId },
          { sender: userId, receiver: senderId },
        ],
      })
      .lean();

    return res.status(200).send({
      success: true,
      message: "Messages fetched successfully",
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).send({
      success: false,
      message: `Error fetching messages: ${error}`,
      error: error, // Sending error details in the response
    });
  }
};

export const GetUserMessageOrder = async (req, res) => {
  try {
    const userId = req.params.userId;
    const senderId = req.params.senderId;
    const orderId = req.params.orderId;

    console;
    // Find messages where the sender is equal to userId and the receiver is equal to senderId
    const messages = await messageModel
      .find({
        $or: [
          { sender: senderId, receiver: userId, orderId: orderId },
          { sender: userId, receiver: senderId, orderId: orderId },
        ],
      })
      .lean();

    return res.status(200).send({
      success: true,
      message: "Messages fetched successfully",
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).send({
      success: false,
      message: `Error fetching messages: ${error}`,
      error: error, // Sending error details in the response
    });
  }
};

// export const SignupUser = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Validation
//     if (!username || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please fill all fields',
//       });
//     }

//     const existingUser = await userModel.findOne({ email });
//     if (existingUser) {
//       return res.status(401).json({
//         success: false,
//         message: 'User Already Exists',
//       });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create a new user
//     const user = new userModel({ username, email, password: hashedPassword });
//     const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
//     user.token = token; // Update the user's token field with the generated token
//     await user.save();

//     // Generate JWT token

//     res.status(201).json({
//       success: true,
//       message: 'User created successfully',
//       user,
//       token,
//     });
//   } catch (error) {
//     console.error('Error on signup:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error on signup',
//       error: error.message,
//     });
//   }
// }

export const SignupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "User Already Exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new userModel({ username, email, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1h",
    });
    user.token = token; // Update the user's token field with the generated token
    await user.save();

    // Generate JWT token

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("Error on signup:", error);
    res.status(500).json({
      success: false,
      message: "Error on signup",
      error: error.message,
    });
  }
};

function cleanDataString(dataString) {
  // Remove backslashes and other unwanted characters
  return dataString.replace(/\\/g, "").replace(/\u000F/g, "");
}

function constructObjectFromDataString(dataString) {
  const pairs = dataString.split('","').map((pair) => pair.split('":"'));
  const dataObject = {};
  for (const [key, value] of pairs) {
    dataObject[key] = value;
  }
  return dataObject;
}

export const findDistanceApi = async (req, res) => {
  console.log(req.body);

  try {
    const { pickup, dropoff } = req.body;
    const key = "AIzaSyDYsdaR0zrPsBDeuyCKFH_4PuCUyWcQ2mE"; // Replace with your actual API key

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${dropoff}&origins=${pickup}&units=metric&key=${key}`
    );

    // Extracting distance from response
    const distance = response.data.rows[0].elements[0].distance.text;

    res.status(200).json({
      success: true,
      message: "Distance fetched successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching distance:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while processing the request",
      error: error.message, // Sending the error message back to the client
    });
  }
};

export const postman = async (req, res) => {
  const order_id = req.params.id; // Extracting order ID from params
  const merchantJsonData = {
    order_no: order_id,
  };
  const accessCode = process.env.ACCESS_CODE;
  const workingKey = process.env.WORKING_KEY;
  const merchantData = JSON.stringify(merchantJsonData);
  const encryptedData = encrypt(merchantData, workingKey);

  try {
    const response = await axios.post(
      `https://apitest.ccavenue.com/apis/servlet/DoWebTrans?enc_request=${encryptedData}&access_code=${accessCode}&request_type=JSON&response_type=JSON&command=orderStatusTracker&version=1.2`
    );

    const encResponse = response.data.split("&")[1].split("=")[1];

    const finalstatus = encResponse.replace(/\s/g, "").toString();
    console.log("`" + finalstatus + "`");
    const newStatus = await decryptURL(finalstatus, workingKey);

    // Clean the string from unwanted characters
    const cleanedData = cleanDataString(newStatus);

    // Construct an object from the cleaned data string
    const newData = constructObjectFromDataString(cleanedData);

    let paymentStatus;
    let OrderStatus;

    if (newData.order_status === "Awaited") {
      paymentStatus = 2;
      OrderStatus = "1";
    }
    if (newData.order_status === "Shipped") {
      paymentStatus = 1;
      OrderStatus = "1";
    }
    if (newData.order_status === "Aborted") {
      paymentStatus = 0;
      OrderStatus = "0";
    }
    if (newData.order_status === "Initiated") {
      paymentStatus = 0;
      OrderStatus = "0";
    }

    console.log(paymentStatus, OrderStatus);

    let updateFields = {
      payment: paymentStatus,
      status: OrderStatus,
    };

    await orderModel.findOneAndUpdate(
      { orderId: req.params.id }, // Find by orderId
      updateFields,
      { new: true } // To return the updated document
    );

    res.status(200).json({
      success: true,
      message: "Response received successfully",
      data: newData, // Sending the JSON data back to the client
      key: workingKey,
    });
  } catch (error) {
    console.error("Decryption error:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while processing the request",
      error: error.message, // Sending the error message back to the client
    });
  }
};

export const Userlogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "please fill all fields",
      });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "email is not registerd",
        user,
      });
    }
    // password check

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "password is not incorrect",
        user,
      });
    }

    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1h",
    });

    return res.status(200).send({
      success: true,
      message: "login sucesssfully",
      user,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error on login ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, pincode, country, address, token } = req.body;
    console.log(phone, pincode, country, address, token);
    const user = await userModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    return res.status(200).json({
      message: "user Updated!",
      success: true,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating user: ${error}`,
      success: false,
      error,
    });
  }
};

export const getAllBlogsController = async (req, res) => {
  try {
    const blogs = await blogModel.find({}).lean();
    if (!blogs) {
      return res.status(200).send({
        message: "NO Blogs Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All Blogs List ",
      BlogCount: blogs.length,
      success: true,
      blogs,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while getting Blogs ${error}`,
      success: false,
      error,
    });
  }
};

export const createBlogController = async (req, res) => {
  try {
    const { title, description, image, user } = req.body;
    //validation
    if (!title || !description || !image || !user) {
      return res.status(400).send({
        success: false,
        message: "Please Provide ALl Fields",
      });
    }
    const exisitingUser = await userModel.findById(user);
    //validaton
    if (!exisitingUser) {
      return res.status(404).send({
        success: false,
        message: "unable to find user",
      });
    }

    const newBlog = new blogModel({ title, description, image, user });
    const session = await mongoose.startSession();
    session.startTransaction();
    await newBlog.save({ session });
    exisitingUser.blogs.push(newBlog);
    await exisitingUser.save({ session });
    await session.commitTransaction();
    await newBlog.save();
    return res.status(201).send({
      success: true,
      message: "Blog Created!",
      newBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Creting blog",
      error,
    });
  }
};

export const updateBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image } = req.body;
    const blog = await blogModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    return res.status(200).json({
      message: "Blog Updated!",
      success: true,
      blog,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Blog: ${error}`,
      success: false,
      error,
    });
  }
};

export const getBlogIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(200).send({
        message: "Blog Not Found By Id",
        success: false,
      });
    }
    return res.status(200).json({
      message: "fetch Single Blog!",
      success: true,
      blog,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get Blog: ${error}`,
      success: false,
      error,
    });
  }
};

export const deleteBlogController = async (req, res) => {
  try {
    const blog = await blogModel
      // .findOneAndDelete(req.params.id)
      .findByIdAndDelete(req.params.id)
      .populate("user");
    await blog.user.blogs.pull(blog);
    await blog.user.save();
    return res.status(200).send({
      success: true,
      message: "Blog Deleted!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing BLog",
      error,
    });
  }
};
export const userBlogsController = async (req, res) => {
  try {
    const userBlog = await userModel.findById(req.params.id).populate("blogs");
    if (!userBlog) {
      return res.status(200).send({
        message: "Blog Not Found By user",
        success: false,
      });
    }
    return res.status(200).json({
      message: " user Blog!",
      success: true,
      userBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing BLog",
      error,
    });
  }
};

export const userTokenController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(200).send({
        message: "Token expire",
        success: false,
      });
    }
    return res.status(200).send({
      message: "token Found",
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Token Not Authorise",
      error,
    });
  }
};

export const CreateChatController = async (req, res) => {
  const { firstId, secondId } = req.body;
  try {
    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] },
    });
    if (chat) return res.status(200).json(chat);
    const newChat = new chatModel({
      members: [firstId, secondId],
    });
    const response = await newChat.save();
    res.status(200).send({
      message: "Chat Added",
      success: true,
      response,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Chat Not Upload",
      error,
    });
  }
};

export const findUserschatController = async (req, res) => {
  const userId = req.params.id;

  try {
    const chats = await chatModel.find({
      members: { $in: [userId] },
    });
    return res.status(200).send({
      message: "Chat Added",
      success: true,
      chats,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "User chat Not Found",
      error,
    });
  }
};

export const findchatController = async (req, res) => {
  const { firstId, secondId } = req.params;

  try {
    const chats = await chatModel.find({
      members: { $all: [firstId, secondId] },
    });
    res.status(200).send({
      message: "Chat Added",
      success: true,
      chats,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "User chat Not Found",
      error,
    });
  }
};

export const UsergetAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find(
      { status: "true" },
      "_id title"
    );

    if (!categories) {
      return res.status(200).send({
        message: "NO Category Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All Category List ",
      catCount: categories.length,
      success: true,
      categories,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while All Categories ${error}`,
      success: false,
      error,
    });
  }
};

export const UsergetAllProducts = async (req, res) => {
  try {
    const products = await productModel.find({ status: "true" }, "_id title");

    if (!products) {
      return res.status(200).send({
        message: "NO products Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All products List ",
      proCount: products.length,
      success: true,
      products,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while All products ${error}`,
      success: false,
      error,
    });
  }
};

export const UsergetAllHomeProducts = async (req, res) => {
  try {
    const products = await productModel.find(
      {},
      "_id title pImage regularPrice salePrice stock"
    );

    if (!products) {
      return res.status(200).send({
        message: "NO products Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All products List ",
      proCount: products.length,
      success: true,
      products,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while All products ${error}`,
      success: false,
      error,
    });
  }
};

export const getAllAttributeUser = async (req, res) => {
  try {
    const Attribute = await attributeModel.find({});
    if (!Attribute) {
      return res.status(200).send({
        message: "NO Attribute Found",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All Attribute List ",
      AttributeCount: Attribute.length,
      success: true,
      Attribute,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while getting attribute ${error}`,
      success: false,
      error,
    });
  }
};

export const getProductIdUser = async (req, res) => {
  try {
    const { id } = req.params;
    const Product = await productModel.findById(id);
    if (!Product) {
      return res.status(200).send({
        message: "product Not Found By Id",
        success: false,
      });
    }
    return res.status(200).json({
      message: "fetch Single product!",
      success: true,
      Product,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get product: ${error}`,
      success: false,
      error,
    });
  }
};

// get home data

export const getHomeData = async (req, res) => {
  try {
    const homeData = await homeModel.findOne();

    if (!homeData) {
      return res.status(200).send({
        message: "Home Settings Not Found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Found home settings!",
      success: true,
      homeData,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while getting home settings: ${error}`,
      success: false,
      error,
    });
  }
};

// get home layout data

export const getHomeLayoutData = async (req, res) => {
  try {
    const homeLayout = await homeLayoutModel.findOne();

    if (!homeLayout) {
      return res.status(200).send({
        message: "Home Layout Not Found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Found home Layout Data!",
      success: true,
      homeLayout,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while getting home Layout: ${error}`,
      success: false,
      error,
    });
  }
};

export const createOrderController = async (req, res) => {
  try {
    const { items, status, mode, details, totalAmount, userId } = req.body;
    //validation
    if (!status || !mode || !details || !totalAmount) {
      return res.status(400).send({
        success: false,
        message: "Please Provide ALl Fields",
      });
    }
    const exisitingUser = await userModel.findById(userId);
    //validaton
    if (!exisitingUser) {
      return res.status(404).send({
        success: false,
        message: "unable to find user",
      });
    }

    const newOrder = new orderModel({
      items,
      status,
      mode,
      details,
      totalAmount,
    });
    const session = await mongoose.startSession();
    session.startTransaction();
    await newOrder.save({ session });
    exisitingUser.orders.push(newOrder);
    await exisitingUser.save({ session });
    await session.commitTransaction();
    await newOrder.save();
    return res.status(201).send({
      success: true,
      message: "Order Sucessfully!",
      newBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Creting Order",
      error,
    });
  }
};

export const updateUserAndCreateOrderController_old_old = async (req, res) => {
  let session;
  let transactionInProgress = false;

  const { id } = req.params;
  const {
    username,
    email,
    state,
    phone,
    address,
    pincode,
    details,
    discount,
    items,
    mode,
    payment,
    primary,
    shipping,
    status,
    totalAmount,
    userId,
  } = req.body;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    transactionInProgress = true;

    // Update user
    const user = await userModel.findByIdAndUpdate(
      id,
      { username, email, pincode, address, state },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create order for the updated user
    if (!status || !mode || !details || !totalAmount || !userId || !payment) {
      return res.status(400).json({
        success: false,
        message: "Please provide all fields for the order",
      });
    }

    // Calculate the auto-increment ID

    // Calculate the auto-increment ID
    const lastOrder = await orderModel.findOne().sort({ _id: -1 }).limit(1);
    let order_id;

    if (lastOrder) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastOrder.orderId);
      order_id = lastOrderId + 1;
    } else {
      order_id = 1;
    }

    console.log("order_id", order_id);
    // Create new order
    const newOrder = new orderModel({
      details,
      discount,
      items,
      mode,
      payment: 0,
      primary,
      shipping,
      status,
      totalAmount,
      userId,
      orderId: order_id,
    });

    await newOrder.save({ session });

    // Update user's orders
    user.orders.push(newOrder);
    await user.save({ session });

    // Update stock quantity for each product in the order
    for (const item of items) {
      const product = await productModel.findById(item.id);
      if (product) {
        product.stock -= item.quantity; // Decrement stock by the quantity ordered
        await product.save({ session });
      }
    }

    // Commit transaction
    await session.commitTransaction();
    transactionInProgress = false;

    // // Send order confirmation email
    // await sendOrderConfirmationEmail(email, username, userId, newOrder);
    if (mode === "COD") {
      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        newOrder,
        user,
        Amount: totalAmount,
        online: false,
      });
    } else {
      const tid = Math.floor(Math.random() * 1000000); // Generating random transaction ID
      const order_id = newOrder.orderId; // Generating order ID
      const accessCode = process.env.ACCESS_CODE;
      const merchant_id = process.env.MERCHANT_ID;
      const WORKING_KEY = process.env.WORKING_KEY;
      const redirect_url = process.env.REDIRECT_URL;
      const cancel_url = process.env.CANCEL_URL;

      return res.status(201).json({
        success: true,
        online: true,
        tid,
        order_id,
        accessCode,
        merchant_id,
        WORKING_KEY,
        cancel_url,
        redirect_url,
      });
    }
  } catch (error) {
    if (transactionInProgress) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }
    console.error("Error:", error);
    return res.status(400).json({
      success: false,
      message: "Error while creating order",
      error: error.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const UpdateUserCancelOrder = async (req, res) => {
  try {
    const { cancel, id } = req.body;

    // Check if user was found and updated
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Ride not found",
      });
    }

    const updateFields = {
      status: "0",
      reason: cancel,
    };
    // Find and update the user based on the phone number
    await orderModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true } // To return the updated document
    );

    // Success response
    res.status(200).json({
      success: true,
      message: "Ride updated successfully",
    });
  } catch (error) {
    console.error("Error occurred during Ride update:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred during Ride update: ${error.message}`,
      error: error,
    });
  }
};

export const UpdateUserReviewOrder = async (req, res) => {
  try {
    const { userId, id, comment, rating, reviewDriverId } = req.body;

    if (!userId || !id || !comment || !rating || !reviewDriverId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, id, comment, rating",
      });
    }

    // Check if the order exists
    const existingOrder = await orderModel.findById(id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const newReview = new ratingModel({
      userId,
      orderId: id,
      rating,
      comment,
    });

    await newReview.save();

    const updateFields = {
      ratingId: newReview._id,
    };

    // Find and update the user based on the phone number
    await orderModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true } // To return the updated document
    );

    // Find and update the user based on the phone number
    const userddModel = await userModel.findByIdAndUpdate(
      reviewDriverId,
      { $addToSet: { ratingId: newReview._id } }, // Add to ratingId array if not already present
      { new: true }
    );

    console.log(userId, userddModel);
    // Success response
    res.status(200).json({
      success: true,
      message: "Review added successfully",
      userId: userId,
    });
  } catch (error) {
    console.error("Error occurred during Ride update:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred during Ride update: ${error.message}`,
      error: error,
    });
  }
};

export const EmailVerify = async (req, res) => {
  const { email } = req.body;

  // Generate a random OTP
  const OTP = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit numeric OTP

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    // SMTP configuration
    host: process.env.MAIL_HOST, // Update with your SMTP host
    port: process.env.MAIL_PORT, // Update with your SMTP port
    secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
    auth: {
      user: process.env.MAIL_USERNAME, // Update with your email address
      pass: process.env.MAIL_PASSWORD, // Update with your email password
    },
  });

  // Email message
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
    to: email, // Update with your email address
    subject: "OTP Verification cayroshop.com",
    text: `OTP: ${OTP}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Failed to send email");
    } else {
      console.log("Email sent: " + info.response);
      // If email sending is successful, return a success response
      res.status(201).json({
        success: true,
        message: "Email sent successfully",
        OTP: OTP, // Include OTP in the response if needed
      });
    }
  });
};

export const updateUserAndCreateOrderController = async (req, res) => {
  let session;
  let transactionInProgress = false;

  const { id } = req.params;
  const {
    username,
    email,
    state,
    pickupTime,
    pickupDate,
    bookingTyp,
    rideTyp,
    PickupLocation,
    DestinationLocation,
    BookingDistance,
    totalAmount,
    userId,
    mode,
    CarType,
    details,
    DriveHR,
    FinalDriveKM,
  } = req.body;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    transactionInProgress = true;

    // Update user
    const user = await userModel.findByIdAndUpdate(
      id,
      { username, email, state },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create order for the updated user
    if (
      !pickupTime ||
      !bookingTyp ||
      !rideTyp ||
      !PickupLocation ||
      !DestinationLocation ||
      !totalAmount ||
      !userId ||
      !CarType
    ) {
      console.log("userId", userId);
      return res.status(400).json({
        success: false,
        message: "Please provide all fields for the Booking",
        body: req.body,
      });
    }

    // Calculate the auto-increment ID
    const lastOrder = await orderModel.findOne().sort({ _id: -1 }).limit(1);
    let orderId;

    if (lastOrder) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastOrder.orderId);
      orderId = lastOrderId + 1;
    } else {
      orderId = 1;
    }
    console.log("order_id", orderId, lastOrder);
    // Create new order
    const newOrder = new orderModel({
      payment: 0,
      pickupTime,
      pickupDate,
      bookingTyp,
      rideTyp,
      PickupLocation,
      DestinationLocation,
      BookingDistance,
      totalAmount,
      userId,
      mode,
      CarType,
      details,
      orderId,
      DriveHR,
      FinalDriveKM,
    });

    await newOrder.save({ session });

    // Update user's orders
    user.orders.push(newOrder);

    // Save updated user data
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    transactionInProgress = false;

    // Sending the response after order creation
    res.status(200).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
      user: user, // Include updated user data in the response
    });

    console.log("username", username, email);
  } catch (error) {
    if (transactionInProgress) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }
    console.error("Error:", error);
    return res.status(400).json({
      success: false,
      message: "Error while creating order",
      error: error.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const updateUserAndCreateValetController = async (req, res) => {
  let session;
  let transactionInProgress = false;

  const {
    username,
    email,
    state,
    ValetTime,
    ValetDate,
    ValetLocation,
    ValetAddress,
    mode,
    details,
    totalAmount,
    userId,
    ValetCount,
  } = req.body;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    transactionInProgress = true;

    // Update user
    const user = await userModel.findByIdAndUpdate(
      userId,
      { username, email, state },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Create order for the updated user
    if (
      !ValetTime ||
      !ValetDate ||
      !ValetLocation ||
      !ValetAddress ||
      !mode ||
      isNaN(totalAmount) ||
      !userId ||
      isNaN(ValetCount)
    ) {
      console.log("userId", userId);
      return res.status(400).json({
        success: false,
        message: "Please provide all fields for the Booking",
        body: req.body,
      });
    }

    // Calculate the auto-increment ID
    const lastOrder = await valetModel.findOne().sort({ _id: -1 }).limit(1);
    let Valet_Id;
    console.log("lastOrder", lastOrder);
    if (lastOrder) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastOrder.Valet_Id);
      Valet_Id = lastOrderId + 1;
    } else {
      Valet_Id = 1;
    }
    console.log("order_id", Valet_Id, lastOrder);
    // Create new order
    const newOrder = new valetModel({
      payment: 0,
      ValetTime,
      ValetDate,
      ValetLocation,
      ValetAddress,
      mode,
      details,
      totalAmount,
      userId,
      Valet_Id,
      ValetCount,
    });

    await newOrder.save({ session });

    // Update user's orders
    user.valets.push(newOrder);

    // Save updated user data
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    transactionInProgress = false;

    // Sending the response after order creation
    res.status(200).json({
      success: true,
      message: "valet order created successfully",
      order: newOrder,
      user: user, // Include updated user data in the response
    });

    console.log("username", username, email);
  } catch (error) {
    if (transactionInProgress) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error while creating valet order",
      error: error.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const PaymentRequest = async (req, res) => {
  try {
    const tid = Math.floor(Math.random() * 1000000); // Generating random transaction ID
    const order_id = Math.floor(Math.random() * 1000000); // Generating random order ID
    const accessCode = process.env.ACCESS_CODE;
    const merchant_id = process.env.MERCHANT_ID;
    const WORKING_KEY = process.env.WORKING_KEY;
    const redirect_url = process.env.REDIRECT_URL;
    const cancel_url = process.env.CANCEL_URL;
    // Send the data as JSON response
    res.json({
      tid,
      order_id,
      accessCode,
      merchant_id,
      WORKING_KEY,
      cancel_url,
      redirect_url,
    });
  } catch (error) {
    console.error("Error generating payment data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const PaymentResponse = async (req, res) => {
  const decryptdata = decrypt(req.body.encResp, process.env.WORKING_KEY);
  console.log(decryptdata);

  // Split the decrypted data into key-value pairs
  const keyValuePairs = decryptdata.split("&");

  // Create an object to store the key-value pairs
  const data = {};
  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    data[key] = value;
  });

  // Extract order_id and order_status
  const orderId = data["order_id"];
  const orderStatus = data["order_status"];

  console.log("Order ID:", orderId);
  console.log("Order Status:", orderStatus);

  const order = await orderModel.findOne({ orderId });

  if (!order) {
    console.log("order not found");
  }

  if (orderStatus === "Success") {
    // Update payment details
    // Update payment details
    order.payment = 1;
  } else {
    // Update payment details
    order.payment = 0;
  }

  // Save the order details
  await order.save();

  if (orderStatus === "Success") {
    // Redirect after saving data
    res.redirect(process.env.COMPLETE_STATUS);
  } else {
    res.redirect(process.env.CANCEL_STATUS);
  }
};

async function sendOrderConfirmationEmail(email, username, userId, newOrder) {
  try {
    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      // SMTP configuration
      host: process.env.MAIL_HOST, // Update with your SMTP host
      port: process.env.MAIL_PORT, // Update with your SMTP port
      secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
      auth: {
        user: process.env.MAIL_USERNAME, // Update with your email address
        pass: process.env.MAIL_PASSWORD, // Update with your email password
      },
    });

    // Email message
    const mailOptions = {
      from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
      to: email, // Update with your email address
      cc: process.env.MAIL_FROM_ADDRESS,
      subject: "www.cayroshop.com Order Confirmation",

      //   html: `

      //   <div class="bg-light w-100 h-100" style="background-color:#f8f9fa!important;width: 90%;font-family:sans-serif;padding:20px;border-radius:10px;padding: 100px 0px;margin: auto;">
      //   <div class="modal d-block" style="
      //      width: 500px;
      //      background: white;
      //      padding: 20px;
      //      margin: auto;
      //      border: 2px solid #8080802e;
      //      border-radius: 10px;
      //  ">
      //    <div class="modal-dialog">
      //      <div class="modal-content" style="
      //      text-align: center;
      //  ">
      //        <div class="modal-header">
      //  <h1 style="color:black;"> cayroshop <h1>
      //        </div>
      //        <div class="modal-body text-center">
      //          <h5 style="
      //      margin: 0px;
      //      margin-top: 14px;
      //      font-size: 20px;color:black;
      //  "> Order Id : #${newOrder.orderId} </h5>
      //         <p style="color:black;" >Hey ${username},</p>
      //        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#47ca00" stroke-width="2" stroke-linecap="square" stroke-linejoin="arcs"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      //         <h2 style="color:black;"> Your Order Is Confirmed! </h2>

      //         <p style="color:black;" > We'll send you a shipping confirmation email
      //  as soon as your order ships. </p>
      //        </div>
      //        <div class="modal-footer">

      //        <a href="https://cayroshop.com/account/order/${userId}/${newOrder._id}"  style="
      //      background: green;
      //      color: white;
      //      padding: 10px;
      //      display: block;
      //      margin: auto;
      //      border-radius: 6px;
      //      text-decoration: none;
      //  "> Track Order</a>
      //        </div>
      //      </div>
      //    </div>
      //  </div> </div>
      //   `

      html: `  <table style="margin:50px auto 10px;background-color:white;border: 2px solid #858585;padding:50px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);-moz-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);     font-family: sans-serif; border-top: solid 10px #ff8800;">
    <thead>
      <tr> 
      <th style="text-align:left;"> 
      <img width="200" src="https://backend-9mwl.onrender.com/uploads/image-1712229850358.PNG" />
 </th>
        <th style="text-align:right;font-weight:400;"> ${new Date(
          newOrder.createdAt
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })} </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td colspan="2" style="border: solid 1px #ddd; padding:10px 20px;">
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:150px">Order status</span><b style="color:green;font-weight:normal;margin:0">Placed</b></p>
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Order ID</span> ${
            newOrder.orderId
          }</p>
          <p style="font-size:14px;margin:0 0 0 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Order amount</span> Rs. ${
            newOrder.totalAmount
          }</p>
          <p style="font-size:14px;margin:0 0 0 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Payment Mode</span> ${
            newOrder.mode
          }</p>
        </td>
      </tr>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td  style="width:50%;padding:20px;vertical-align:top">
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px">Name</span> ${
            newOrder.details[0].username
          } </p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Email</span>  ${
            newOrder.details[0].email
          }  </p>
      
          
        </td>
        <td style="width:50%;padding:20px;vertical-align:top">
            <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Phone</span> +91-${
              newOrder.details[0].phone
            }</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Address</span> ${
            newOrder.details[0].address
          } </p>
           
          
        </td>
      </tr>
      
      <tr>
<td colspan="2" > 

<table class="table table-borderless" style="border-collapse: collapse; width: 100%;">
    <tbody>
    <tr>
        <td  style="padding: 10px;font-weight:bold;">Items</td>
        <td   style="padding: 10px;font-weight:bold;">GST</td>

        <td   style="padding: 10px;font-weight:bold;">Quantity</td>
             <td  style="padding: 10px;text-align:right;font-weight:bold;">Price</td>
      </tr>

      ${newOrder.items
        .map(
          (Pro) => `
        <tr>
          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;" >
            <div className="d-flex mb-2">
              <div className="flex-shrink-0">
                <img
                  src="${Pro.image}"
                  alt=""
                  width="35"
                  className="img-fluid"
                />
              </div>
              <div className="flex-lg-grow-1 ms-3">
                <h6 className="small mb-0">
                  <a href="https://cayroshop.com/product/${Pro.id}" style="font-size:10px;">
                    ${Pro.title}  
                  </a>
                </h6>

              </div>
            </div>
          </td>
          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;"> ${Pro.gst}% </td>

          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;"> ${Pro.quantity} </td>

          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;" >₹ ${Pro.price}</td>
        </tr>
        `
        )
        .join("")}

    </tbody>
    <tfoot>
        <tr>
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">Subtotal</td>
            <td  colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${
              newOrder.items.reduce(
                (total, item) => total + item.quantity * item.price,
                0
              ) -
              Math.floor(
                newOrder.items.reduce((acc, item) => {
                  const itemPrice = item.quantity * item.price;
                  const itemGST = (itemPrice * item.gst) / 100;
                  return acc + itemGST;
                }, 0)
              )
            }</td>
        </tr>

       
      
        <tr>
        <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">GST </td>
        <td colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${Math.floor(
          newOrder.items.reduce((acc, item) => {
            const itemPrice = item.quantity * item.price;
            const itemGST = (itemPrice * item.gst) / 100;
            return acc + itemGST;
          }, 0)
        )}</td>
    </tr>

        <tr>
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">Shipping</td>
            <td colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${
              newOrder.shipping
            }</td>
        </tr>
        <tr>
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">Discount</td>
            <td colspan="2"  class="text-danger text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6; text-align: right;">
           - ${
             newOrder.items.reduce(
               (total, item) => total + item.quantity * item.price,
               0
             ) -
               Math.abs(newOrder.discount) ===
             0
               ? "0"
               : Math.abs(newOrder.discount)
           }
          </td>
        </tr>
        <tr class="fw-bold">
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">TOTAL</td>
            <td colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${
              newOrder.totalAmount
            }</td>
        </tr>
    </tfoot>
</table>
</td>

      </tr>
    </tbody>
    <tfooter>
      <tr>
        <td colspan="2" style="font-size:14px;padding:50px 15px 0 15px;">
        
        
          <strong style="display:block;margin:0 0 10px 0;">Regards</strong> 
          
          <address><strong class="mb-2"> CAYRO ENTERPRISES </strong><br><b title="Phone" class="mb-2">GST:</b>  06AAPFC7640H1Z9<br><b title="Phone" class="mb-2">Address:</b> Unit no. DCG-0104, DLF Corporate Greens, Sector 74A, Gurugram, Haryana - 122001<br><b title="Phone" class="mb-2">Email:</b> info@cayroshop.com <br><b title="Phone" class="mb-2">Web:</b>www.cayroshop.com <br></address>
         
        </td>
      </tr>
    </tfooter>
  </table> `,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Transfer-Encoding": "quoted-printable",
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}

export const contactSendEnquire = async (req, res) => {
  const { name, email, message } = req.body;

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    // SMTP configuration
    host: process.env.MAIL_HOST, // Update with your SMTP host
    port: process.env.MAIL_PORT, // Update with your SMTP port
    secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
    auth: {
      user: process.env.MAIL_USERNAME, // Update with your email address
      pass: process.env.MAIL_PASSWORD, // Update with your email password
    },
  });

  // Email message
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
    to: process.env.MAIL_TO_ADDRESS, // Update with your email address
    subject: "New Contact Us Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Failed to send email");
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).send("Email sent successfully");
    }
  });
};

export const updateUserAndCreateOrderController_old = async (req, res) => {
  let session;
  let transactionInProgress = false;
  const { id } = req.params;
  const {
    username,
    email,
    address,
    pincode,
    details,
    discount,
    items,
    mode,
    payment,
    primary,
    shipping,
    status,
    totalAmount,
    userId,
  } = req.body;

  const options = {
    amount: totalAmount * 100, // amount in smallest currency unit (e.g., paisa for INR)
    currency: "INR",
    receipt: "order_rcptid_" + Math.floor(Math.random() * 1000),
  };

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    transactionInProgress = true;

    // Update user
    const user = await userModel.findByIdAndUpdate(
      id,
      { username, email, pincode, address },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create order for the updated user
    if (!status || !mode || !details || !totalAmount || !userId || !payment) {
      console.log("status:", status);
      console.log("mode:", mode);
      console.log("details:", details);
      console.log("totalAmount:", totalAmount);
      console.log("userId:", userId);
      console.log("payment:", payment);
      console.log("shipping:", shipping);

      return res.status(400).json({
        success: false,
        message: "Please provide all fields for the order",
      });
    }

    const order = await razorpay.orders.create(options);
    const apiKey = process.env.RAZORPAY_API_KEY;

    const newOrder = new orderModel({
      details,
      discount,
      items,
      mode,
      payment: 0,
      primary,
      shipping,
      status,
      totalAmount,
      userId,
      orderId: order.id,
    });

    await newOrder.save({ session });
    user.orders.push(newOrder);
    await user.save({ session });

    // Update stock quantity for each product in the order
    for (const item of items) {
      const product = await productModel.findById(item.id);
      if (product) {
        product.stock -= item.quantity; // Decrement stock by the quantity ordered
        await product.save({ session });
      }
    }

    await session.commitTransaction();
    transactionInProgress = false;

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      newOrder,
      order,
      apiKey,
      user,
      Amount: totalAmount,
    });
  } catch (error) {
    if (transactionInProgress) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }
    console.error("Error:", error);
    return res.status(400).json({
      success: false,
      message: "Error while creating order",
      error: error.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const razorpayCallback = async (req, res) => {
  const { payment_id, order_id, status } = req.body;

  try {
    if (status === "paid") {
      // Payment successful, update order status to paid
      await orderModel.findOneAndUpdate({ orderId: order_id }, { payment: 1 });
    } else if (status === "failed") {
      // Payment failed, update order status to unpaid
      await orderModel.findOneAndUpdate({ orderId: order_id }, { payment: 2 });
    }
    res.status(200).send("Order status updated successfully.");
  } catch (error) {
    res.status(500).send("Error updating order status: " + error.message);
  }
};

//category fillter

export const GetAllCategoriesByParentIdController_old = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { filter, price, page = 1, perPage = 2 } = req.query; // Extract filter, price, page, and perPage query parameters

    // Check if parentId is undefined or null
    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid parent ID.",
      });
    }

    // Call the recursive function to get all categories
    const categories = await getAllCategoriesByParentId(parentId);
    const MainCat = await categoryModel
      .findById(parentId)
      .select("title")
      .lean();

    const filters = { Category: parentId }; // Initialize filters with parent category filter

    if (filter) {
      // Parse the filter parameter
      const filterParams = JSON.parse(filter);

      // Iterate through each parameter in the filter
      Object.keys(filterParams).forEach((param) => {
        // Split parameter values by comma if present
        const paramValues = filterParams[param].split(",");

        // Check if there are multiple values for the parameter
        if (paramValues.length > 1) {
          filters[`variations.${param}.${param}`] = { $all: paramValues };
        } else {
          // If only one value, handle it as a single filter
          filters[`variations.${param}.${param}`] = { $in: paramValues };
        }
      });
    }

    // Check if price parameter is provided and not blank
    if (price && price.trim() !== "") {
      const priceRanges = price.split(","); // Split multiple price ranges by comma
      const priceFilters = priceRanges.map((range) => {
        const [minPrice, maxPrice] = range.split("-"); // Split each range into min and max prices
        return {
          salePrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
        };
      });

      // Add price filters to the existing filters
      filters.$or = priceFilters;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * perPage;

    // Fetch products based on filters with pagination
    const products = await productModel
      .find(filters)
      .select("_id title regularPrice salePrice pImage variations")
      .skip(skip)
      .limit(perPage)
      .lean();

    const Procat = { Category: parentId }; // Initialize filters with parent category filter
    const productsFilter = await productModel
      .find(Procat)
      .select("_id regularPrice salePrice")
      .lean();

    const proLength = products.length;
    return res.status(200).json({
      success: true,
      categories,
      MainCat,
      products,
      proLength,
      productsFilter,
    });
  } catch (error) {
    console.error("Error in GetAllCategoriesByParentIdController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const GetAllCategoriesByParentIdController = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { filter, price, page = 1, perPage = 2 } = req.query; // Extract filter, price, page, and perPage query parameters

    // Check if parentId is undefined or null
    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid parent ID.",
      });
    }

    // Call the recursive function to get all categories
    const categories = await getAllCategoriesByParentId(parentId);
    const MainCat = await categoryModel
      .findById(parentId)
      .select("title metaTitle metaDescription metaKeywords")
      .lean();

    const filters = { Category: parentId }; // Initialize filters with parent category filter

    if (filter) {
      // Parse the filter parameter
      const filterParams = JSON.parse(filter);

      // Iterate through each parameter in the filter
      Object.keys(filterParams).forEach((param) => {
        // Split parameter values by comma if present
        const paramValues = filterParams[param].split(",");
        const variationsKey = `variations.${param}.${param}`;

        // Handle multiple values for the parameter
        filters[variationsKey] = { $in: paramValues };
      });
    }

    // Check if price parameter is provided and not blank
    if (price && price.trim() !== "") {
      const priceRanges = price.split(","); // Split multiple price ranges by comma
      const priceFilters = priceRanges.map((range) => {
        const [minPrice, maxPrice] = range.split("-"); // Split each range into min and max prices
        return {
          salePrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
        };
      });

      // Add price filters to the existing filters
      filters.$or = priceFilters;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * perPage;

    // Fetch products based on filters with pagination
    const products = await productModel
      .find(filters)
      .select("_id title regularPrice salePrice pImage variations")
      .skip(skip)
      .limit(perPage)
      .lean();

    const Procat = { Category: parentId }; // Initialize filters with parent category filter
    const productsFilter = await productModel
      .find(Procat)
      .select("_id regularPrice salePrice variations")
      .lean();

    const proLength = products.length;
    return res.status(200).json({
      success: true,
      categories,
      MainCat,
      products,
      proLength,
      productsFilter,
    });
  } catch (error) {
    console.error("Error in GetAllCategoriesByParentIdController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllCategoriesByParentId = async (parentId) => {
  try {
    const categories = await categoryModel.find({ parent: parentId }).lean();

    if (!categories || categories.length === 0) {
      return [];
    }

    const result = [];

    for (const category of categories) {
      const { _id, title, image /* other fields */ } = category;

      const categoryData = {
        _id,
        title,
        image,
        subcategories: await getAllCategoriesByParentId(_id), // Recursive call
      };

      result.push(categoryData);
    }

    return result;
  } catch (error) {
    console.error("Error while fetching categories:", error);
    throw error;
  }
};

export const userOrdersController = async (req, res) => {
  const userId = req.params.id;

  try {
    const userOrder = await userModel.findById(userId).populate({
      path: "orders",
      select:
        "_id createdAt totalAmount status mode orderId PickupLocation DestinationLocation CarType details pickupTime pickupDate rideTyp bookingTyp startStatusOTP endStatusOTP ratingId", // Include the driverId field
      options: {
        sort: { createdAt: -1 },
      },
      populate: {
        path: "driverId",
        select: "_id username email phone ratingId", // Include fields from the driver
        // populate: {
        //   path: 'ratingId',
        //   select: 'rating comment' // Include fields from the rating
        // }
      },
    });
    if (!userOrder) {
      return res.status(200).send({
        message: "Order Not Found By user",
        success: false,
      });
    }
    return res.status(200).json({
      message: " user Orders!",
      success: true,
      userOrder,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Getting Orders",
      error,
    });
  }
};

export const userOrdersViewController = async (req, res) => {
  try {
    const { userId, orderId } = req.params;

    // Find the user by ID and populate their orders
    const userOrder = await userModel.findById(userId).populate({
      path: "orders",
      match: { _id: orderId }, // Match the order ID
      populate: {
        path: "driverId", // Populate the driverId
        select: "_id username email phone", // Select the fields you want to include from the driver
      },
    });
    // If user or order not found, return appropriate response
    if (!userOrder || !userOrder.orders) {
      return res.status(404).json({
        message: "Order Not Found By user or Order ID",
        success: false,
      });
    }

    // If user order found, return success response with the single order
    return res.status(200).json({
      message: "Single Order Found By user ID and Order ID",
      success: true,
      userOrder: userOrder.orders, // Assuming there's only one order per user
    });
  } catch (error) {
    // If any error occurs during the process, log it and return error response
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Error while getting order",
      error,
    });
  }
};

export const DriverOrdersViewController = async (req, res) => {
  try {
    const { userId, orderId } = req.params;

    // Find the user by ID and populate their orders
    const userOrder = await userModel.findById(userId).populate({
      path: "orders",
      match: { _id: orderId }, // Match the order ID
    });

    // If user or order not found, return appropriate response
    if (!userOrder || !userOrder.orders) {
      return res.status(404).json({
        message: "Order Not Found By user or Order ID",
        success: false,
      });
    }

    // If user order found, return success response with the single order
    return res.status(200).json({
      message: "Single Order Found By user ID and Order ID",
      success: true,
      userOrder: userOrder.orders, // Assuming there's only one order per user
    });
  } catch (error) {
    // If any error occurs during the process, log it and return error response
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Error while getting order",
      error,
    });
  }
};

export const GetUsernameById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user by ID and populate their orders
    const user = await userModel.findById(id);

    // If user or order not found, return appropriate response
    if (!user) {
      return res.status(404).json({
        message: "User Not Found By ID",
        success: false,
      });
    }

    // If user order found, return success response with the single order
    return res.status(200).json({
      message: "User Found By ID",
      success: true,
      user,
    });
  } catch (error) {
    // If any error occurs during the process, log it and return error response
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Error while getting user",
      error,
    });
  }
};

export const AddCart = async (req, res) => {
  try {
    const { items, isEmpty, totalItems, totalUniqueItems, cartTotal } =
      req.body;

    const Cart = new cartModel({
      items,
      isEmpty,
      totalItems,
      totalUniqueItems,
      cartTotal,
    });
    await Cart.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      Cart,
    });
  } catch (error) {
    console.error("Error on signup:", error);
    res.status(500).json({
      success: false,
      message: "Error on signup",
      error: error.message,
    });
  }
};

export const UpdateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, isEmpty, totalItems, totalUniqueItems, cartTotal } =
      req.body;
    const Cart = await cartModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    return res.status(200).json({
      message: "Cart Updated!",
      success: true,
      Cart,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating cart: ${error}`,
      success: false,
      error,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const { id } = req.params;
    const Cart = await cartModel.findById(id);
    if (!Cart) {
      return res.status(200).send({
        message: "Cart Not Found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Cart Found successfully!",
      success: true,
      Cart,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get cart: ${error}`,
      success: false,
      error,
    });
  }
};

export const AddRating = async (req, res) => {
  try {
    const { userId, rating, comment, productId } = req.body;

    // Validation
    if (!userId || !rating || !comment || !productId) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    } else {
      // Create a new user rating instance
      const newUserRating = new ratingModel({
        userId,
        rating,
        comment,
        productId,
      });

      // Save the user rating to the database
      await newUserRating.save();

      return res.status(200).json({
        message: "User rating created successfully!",
        success: true,
        newUserRating,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: `Error while add rating: ${error}`,
      success: false,
      error,
    });
  }
};

export const ViewProductRating = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find all ratings for a specific product
    const productRatings = await ratingModel.find({ productId, status: 1 });

    // Fetch user details for each rating
    const ratingsWithUserDetails = await Promise.all(
      productRatings.map(async (rating) => {
        const user = await userModel.findById(rating.userId);
        return {
          rating: rating.rating,
          comment: rating.comment,
          username: user ? user.username : "Unknown",
          createdAt: rating.createdAt,
          userId: user ? user._id : "Unknown",
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Getting product ratings successfully!",
      productRatings: ratingsWithUserDetails,
    });
  } catch (error) {
    console.error("Error getting product ratings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const ViewCategoryRating = async (req, res) => {
  try {
    // Query the database for all ratings where status is 1
    const ratings = await ratingModel.find({ status: 1 });

    res.status(200).json({ success: true, ratings });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// add Wishlist by user
export const AddWishListByUser = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validation
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Please provide both userId & productId",
      });
    }

    // Check if the wishlist item already exists for the user
    const existingWishlistItem = await wishlistModel.findOne({
      userId,
      productId,
    });

    if (existingWishlistItem) {
      return res.status(400).json({
        success: false,
        message: "Wishlist item already exists",
      });
    }

    // Create a new wishlist item
    const newWishlistItem = new wishlistModel({
      userId,
      productId,
    });

    // Save the wishlist item to the database
    await newWishlistItem.save();

    return res.status(200).json({
      message: "Wishlist item created successfully!",
      success: true,
      newWishlistItem,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while adding wishlist item: ${error}`,
      success: false,
      error,
    });
  }
};

export const ViewWishListByUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find wishlist items for the specified user ID
    const wishlistItems = await wishlistModel.find({ userId });

    // Extract product IDs from wishlist items
    const productIds = wishlistItems.map((item) => item.productId);

    // Fetch product details for each product ID
    const productDetails = await productModel
      .find({ _id: { $in: productIds } })
      .select("_id pImage regularPrice salePrice title");

    // Combine wishlist items with product details
    const wishlistWithProductDetails = wishlistItems.map((item) => {
      const productDetail = productDetails.find(
        (product) => product._id.toString() === item.productId.toString()
      );
      return {
        _id: item._id,
        userId: item.userId,
        productId: item.productId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        productDetail: productDetail, // Add product details to wishlist item
      };
    });

    return res.status(200).json({
      success: true,
      message: "Getting wishlist successfully!",
      wishlist: wishlistWithProductDetails,
    });
  } catch (error) {
    console.error("Error getting wishlist:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteWishListByUser = async (req, res) => {
  try {
    await wishlistModel.findByIdAndDelete(req.params.id);

    return res.status(200).send({
      success: true,
      message: "Wishlist Deleted!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing Wishlist",
      error,
    });
  }
};

export const AddCompareByUser = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validation
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Please fill userId & productId",
      });
    } else {
      // Check if the wishlist item already exists for the user
      const existingWishlistItem = await compareModel.findOne({
        userId,
        productId,
      });

      if (existingWishlistItem) {
        return res.status(400).json({
          success: false,
          message: "Comparsion item already exists",
        });
      }
      const entryCount = await compareModel.countDocuments({ userId });

      if (entryCount >= 3) {
        return res.status(400).json({
          success: false,
          message: "Sorry You Can't Add More Than 3 Products",
        });
      }

      // Create a new user rating instance
      const newUserCompare = new compareModel({
        userId,
        productId,
      });

      // Save the user rating to the database
      await newUserCompare.save();

      return res.status(200).json({
        message: "User comparsion created successfully!",
        success: true,
        newUserCompare,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: `Error while add comparsion: ${error}`,
      success: false,
      error,
    });
  }
};

export const ViewCompareByUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find wishlist items for the specified user ID
    const CompareItems = await compareModel.find({ userId });

    // Extract product IDs from wishlist items
    const productIds = CompareItems.map((item) => item.productId);

    // Fetch product details for each product ID
    const productDetails = await productModel
      .find({ _id: { $in: productIds } })
      .select("_id pImage regularPrice salePrice title specifications");

    // Combine wishlist items with product details
    const CompareWithProductDetails = CompareItems.map((item) => {
      const productDetail = productDetails.find(
        (product) => product._id.toString() === item.productId.toString()
      );
      return {
        _id: item._id,
        userId: item.userId,
        productId: item.productId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        productDetail: productDetail, // Add product details to wishlist item
      };
    });

    return res.status(200).json({
      success: true,
      message: "Getting Compare successfully!",
      comparsion: CompareWithProductDetails,
    });
  } catch (error) {
    console.error("Error getting Compare:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteCompareByUser = async (req, res) => {
  try {
    await compareModel.findByIdAndDelete(req.params.id);

    return res.status(200).send({
      success: true,
      message: "Compare Deleted!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing Compare",
      error,
    });
  }
};

export const ViewOrderByUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find userItems items for the specified user ID
    const userItems = await userModel.find({ userId });

    // Extract product IDs from userItems items
    const productIds = userItems.map((item) => item.productId);

    // Fetch product details for each product ID
    const productDetails = await orderModel
      .find({ _id: { $in: productIds } })
      .select("_id username email phone pincode country address status");

    // Combine userItems items with product details
    const UsertWithProductDetails = userItems.map((item) => {
      const productDetail = productDetails.find(
        (product) => product._id.toString() === item.productId.toString()
      );
      return {
        _id: item._id,
        userId: item.userId,
        productId: item.productId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        productDetail: productDetail, // Add product details to wishlist item
      };
    });

    return res.status(200).json({
      success: true,
      message: "Getting wishlist successfully!",
      wishlist: wishlistWithProductDetails,
    });
  } catch (error) {
    console.error("Error getting wishlist:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// for zones

export const ViewAllZones = async (req, res) => {
  try {
    // Query the database for all ratings where status is 1
    const Zones = await zonesModel.find({ status: 1 });

    res.status(200).json({ success: true, Zones });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const ViewAllUserTaxes = async (req, res) => {
  try {
    // Query the database for all ratings where status is 1
    const taxes = await taxModel.find({ status: "true" });

    res.status(200).json({ success: true, taxes });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getTaxIdUser = async (req, res) => {
  try {
    const { id } = req.params;
    const taxes = await taxModel.find({ zoneId: id });
    if (!taxes || taxes.length === 0) {
      return res.status(200).send({
        message: "No taxes found for the specified zoneId",
        success: false,
      });
    }
    // Get the last element from the taxes array
    const lastTax = taxes[taxes.length - 1];
    return res.status(200).json({
      message: "Fetched last tax by zoneId successfully",
      success: true,
      tax: lastTax,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while getting taxes: ${error}`,
      success: false,
      error,
    });
  }
};

export const applyPromoCode = async (req, res) => {
  try {
    const { promoCode } = req.body;
    console.log("promoCode", req.body.promoCode);
    // Find the promo code in the database
    const promo = await promoModel.findOne({ name: promoCode });

    if (!promo) {
      return res.status(400).json({ message: "Promo code not found" });
    }

    // Check if the promo code is valid and active
    if (promo.status !== "true") {
      return res.status(400).json({ message: "Promo code is not active" });
    }

    // Apply the promo code based on its type
    let discount = 0;
    let type = "";

    if (promo.type === 1) {
      // Percentage
      // Calculate discount percentage
      discount = parseFloat(promo.rate) / 100;
      type = "percentage";
    } else if (promo.type === 2) {
      // Fixed Amount
      // Assume type is 'value', calculate discount value
      discount = parseFloat(promo.rate);
      type = "fixed";
    } else {
      return res.status(400).json({ message: "Invalid promo code type" });
    }

    // Return the discount and type to the client
    return res.status(200).json({ discount, type });
  } catch (error) {
    console.error("Error applying promo code:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const sendRegOTP = async (phone, otp) => {
  try {
    // Construct the request URL with query parameters
    const queryParams = querystring.stringify({
      username: "cayro.trans",
      password: "CsgUK",
      unicode: false,
      from: "CAYROE",
      to: phone,
      text: `Here is your OTP ${otp} for registering your account on cayroshop.com`,
    });
    const url = `https://pgapi.smartping.ai/fe/api/v1/send?${queryParams}`;

    // Make the GET request to send OTP
    https
      .get(url, (res) => {
        console.log(`OTP API response status code: ${res.statusCode}`);
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          console.log(`Response body: ${chunk}`);
        });
      })
      .on("error", (error) => {
        // console.log('url', url)
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
      });

    console.log("OTP request sent successfully", otp);
  } catch (error) {
    // Handle errors
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

const sendLogOTP = async (phone, otp) => {
  try {
    // Construct the request URL with query parameters
    const queryParams = querystring.stringify({
      username: "cayro.trans",
      password: "CsgUK",
      unicode: false,
      from: "CAYROE",
      to: phone,
      text: `Here is OTP ${otp} for mobile no verification in website cayroshop.com`,
    });
    const url = `https://pgapi.smartping.ai/fe/api/v1/send?${queryParams}`;

    console.log(url);
    // Make the GET request to send OTP
    https
      .get(url, (res) => {
        console.log(`OTP API response status code: ${res.statusCode}`);
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          console.log(`Response body: ${chunk}`);
        });
      })
      .on("error", (error) => {
        // console.log('url', url)
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
      });
    console.log("OTP request sent successfully", otp);
  } catch (error) {
    // Handle errors
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

const sendOrderOTP = async (phone, order_id) => {
  try {
    // Construct the request URL with query parameters
    const queryParams = querystring.stringify({
      username: "cayro.trans",
      password: "CsgUK",
      unicode: false,
      from: "CAYROE",
      to: phone,
      text: `Thank you for your order. Your order id is ${order_id} cayroshop.com`,
    });
    const url = `https://pgapi.smartping.ai/fe/api/v1/send?${queryParams}`;

    console.log(url);
    // Make the GET request to send OTP
    https
      .get(url, (res) => {
        console.log(`OTP API response status code: ${res.statusCode}`);
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          console.log(`Response body: ${chunk}`);
        });
      })
      .on("error", (error) => {
        // console.log('url', url)
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
      });

    console.log("OTP request sent successfully", otp);
  } catch (error) {
    // Handle errors
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

export const SendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // Send OTP via Phone
    await sendOTP(phone, otp);

    res
      .status(200)
      .json({ success: true, message: "OTP sent successfully", OTP: otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const sendAisensyOTP = async (req, res) => {
  try {
    const { phone } = req.params;
    const otp = Math.floor(1000 + Math.random() * 9000);

    const data = {
      apiKey: process.env.AisensyAPIKEY,
      campaignName: "Signup otp",
      destination: `91${phone}`,
      userName: "Travelin Trip Holidays",
      templateParams: [`${otp}`],
      source: "new-landing-page form",
      media: {},
      buttons: [
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            {
              type: "text",
              text: "TESTCODE20",
            },
          ],
        },
      ],
      carouselCards: [],
      location: {},
      paramsFallbackValue: {
        FirstName: "user",
      },
    };
    axios
      .post("https://backend.aisensy.com/campaign/t1/api/v2", data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log("Response:", response.data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    console.log(`Aisensy otp ${otp} for ${phone}`);

    return res.status(200).json({
      message: "Send OTP Successfully",
      success: true,
      otp: encrypt(otp, process.env.APIKEY),
    });
  } catch (error) {
    console.error("Error On Send OTP:", error);
    res.status(500).json({
      success: false,
      message: "Error On Send OTP:",
      error: error.message,
    });
  }
};

export const sendAisensyLoginOTP = async (phone, otp) => {
  const data = {
    apiKey: process.env.AisensyAPIKEY,
    campaignName: "Signup otp",
    destination: `91${phone}`,
    userName: "Travelin Trip Holidays",
    templateParams: [`${otp}`],
    source: "new-landing-page form",
    media: {},
    buttons: [
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [
          {
            type: "text",
            text: "TESTCODE20",
          },
        ],
      },
    ],
    carouselCards: [],
    location: {},
    paramsFallbackValue: {
      FirstName: "user",
    },
  };
  axios
    .post("https://backend.aisensy.com/campaign/t1/api/v2", data, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("Response:", response.data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  console.log(`Aisensy otp ${otp} for ${phone}`);
};

export const SignupLoginUser = async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone
    //  await sendRegOTP(phone, otp);

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await userModel.findOne({ phone });

    if (existingUser) {
      if (
        existingUser.password !== undefined &&
        existingUser.status !== 0 &&
        existingUser.status !== 2
      ) {
        return res.status(201).json({
          success: true,
          message: "User found with password",
          password: true,
        });
      } else {
        if (existingUser.status === 0) {
          return res.status(400).json({
            success: false,
            message: "Your account status is pending. Please contact support.",
          });
        } else if (existingUser.status === 2) {
          return res.status(400).json({
            success: false,
            message: "Your Account has been suspended ",
          });
        }
        // await sendLogOTP(phone, otp);
        await sendAisensyLoginOTP(phone, otp);

        console.log(otp);
        return res.status(201).json({
          success: true,
          message: "User found",
          existingUser: {
            _id: existingUser._id,
            username: existingUser.username,
            phone: existingUser.phone,
            email: existingUser.email,
            type: existingUser.type,
            profile: existingUser.profile,
          },
          token: existingUser.token,
          otp: otp,
        });
      }
    } else {
      // await sendLogOTP(phone, otp);
      await sendAisensyLoginOTP(phone, otp);
      return res.status(200).json({
        success: true,
        message: "New User found",
        newUser: true,
        otp: otp,
      });
    }
  } catch (error) {
    console.error("Error on login:", error);
    return res.status(500).json({
      success: false,
      message: "Error on login",
      error: error.message,
    });
  }
};

export const SignupNewUser = async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone
    // await sendOTP(phone, otp);
    await sendAisensyLoginOTP(phone, otp);

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    // Calculate the auto-increment ID
    const lastUser = await userModel.findOne().sort({ _id: -1 }).limit(1);
    let userId;

    if (lastUser) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastUserId = parseInt(lastUser.userId || 126325);
      userId = lastUserId + 1;
    } else {
      userId = 126325;
    }
    // Create a new user
    const user = new userModel({ phone, userId, status: 1 });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      existingUser: {
        _id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        type: user.type,
        profile: user.profile,
        status: 1,
      },
      otp: otp,
    });
  } catch (error) {
    console.error("Error on signup:", error);
    res.status(500).json({
      success: false,
      message: "Error on signup",
      error: error.message,
    });
  }
};

export const LoginUserWithOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    console.log(phone);
    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone
    // await sendLogOTP(phone, otp);
    await sendAisensyLoginOTP(phone, otp);

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await userModel.findOne({ phone });

    if (existingUser) {
      if (existingUser.status === 1) {
        await sendLogOTP(phone, otp);

        return res.status(200).json({
          success: true,
          message: "User found",
          existingUser: {
            _id: existingUser._id,
            username: existingUser.username,
            phone: existingUser.phone,
            email: existingUser.email,
            type: existingUser.type,
            profile: existingUser.profile,
          },
          token: existingUser.token,
          otp: otp,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Waiting For Approval",
        });
      }
    } else {
      console.log();
      return res.status(400).json({
        success: false,
        message: "User Not found",
      });
    }
  } catch (error) {
    console.error("Error on signup:", error);
    res.status(500).json({
      success: false,
      message: "Error on signup",
      error: error.message,
    });
  }
};

export const LoginUserWithPass = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    if (!phone || !password) {
      return res.status(400).send({
        success: false,
        message: "please fill all fields",
      });
    }
    const user = await userModel.findOne({ phone });

    // password check

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "password is not incorrect",
        user,
      });
    }

    // const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    return res.status(200).json({
      success: true,
      message: "login sucesssfully with password",
      existingUser: {
        _id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        type: user.type,
        profile: user.profile,
      },
      token: user.token,
      checkpass: true,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error on login ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const LoginAndVerifyOTP = async (req, res) => {
  try {
    const { OTP, HASHOTP } = req.body;
    console.log(OTP, HASHOTP);
    const isMatch = OTP === HASHOTP;
    if (isMatch) {
      return res.status(200).json({
        success: true,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "OTP Not Verified",
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: `error on login ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const updatePromoAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, rate, type, status } = req.body;

    let updateFields = {
      name,
      rate,
      type,
      status,
    };

    const Promo = await promoModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return res.status(200).json({
      message: "Promo code Updated!",
      success: true,
      Promo,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Promo code: ${error}`,
      success: false,
      error,
    });
  }
};
export const AuthUserByID = async (req, res) => {
  try {
    const { id } = req.body;
    console.log(req.body.id);
    const existingUser = await userModel.findById(id);

    if (existingUser) {
      if (existingUser.status === 2) {
        return res.status(200).send({
          success: false,
          message: "Account Suspended",
        });
      }
      // Increment the login count
      existingUser.loginCount = (existingUser.loginCount || 0) + 1; // Initialize if undefined
      await existingUser.save(); // Save the updated user document

      return res.status(200).json({
        success: true,
        message: "login sucesssfully with password",
        existingUser: {
          _id: existingUser._id,
          username: existingUser.username,
          phone: existingUser.phone,
          email: existingUser.email,
          address: existingUser.address,
          pincode: existingUser.pincode,
          state: existingUser.state,
          messages: existingUser.messages,
          notifications: existingUser.notifications,
          wallet: existingUser.wallet,
          profile: existingUser.profile,
          status: existingUser?.status,
          verified: existingUser?.verified,
          c_name: existingUser?.c_name,
          gstin: existingUser?.gstin,
          city: existingUser?.city,
          DL: existingUser?.DL,
          PoliceVerification: existingUser?.PoliceVerification,
          AadhaarBack: existingUser?.AadhaarBack,
          AadhaarFront: existingUser?.AadhaarFront,
          Local: existingUser?.Local,
        },
      });

      // return res.status(401).send({
    } else {
      return res.status(401).send({
        success: false,
        message: "user Not found",
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: `error on Auth ${error}`,
      sucesss: false,
      error,
    });
  }
};
export const AuthUserByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const existingUser = await userModel.findOne({ phone });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User Found",
        existingUser: {
          _id: existingUser._id,
          username: existingUser.username,
          carName: existingUser.username,
          carNumber: existingUser.carNumber,
          carImage: existingUser.carImage,
        },
      });

      // return res.status(401).send({
    } else {
      return res.status(401).send({
        success: false,
        message: "user Not found",
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: `error on phone ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const updateProfileUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;
    const profile = req.files ? req.files.profile : undefined;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    // Prepare update fields
    let updateFields = {
      username,
      email,
    };

    if (profile && profile[0]) {
      updateFields.profile = profile[0].path; // Assumes profile[0] is the uploaded file
    }

    // Update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    // Perform database update
    const updatedUser = await userModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return success message based on the operation performed
    const successMessage = password ? "Password updated!" : "Profile updated!";
    return res.status(200).json({
      success: true,
      message: successMessage,
      updatedUser,
    });
  } catch (error) {
    console.error("Error while updating profile:", error);
    return res.status(400).json({
      success: false,
      message: `Error while updating profile: ${error.message}`,
      error: error.message,
    });
  }
};

export const updateCompanyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { c_name, address, city, state, pincode, gstin } = req.body;

    console.log(c_name, address, city, state, pincode, gstin);
    console.log(req.body);
    let statetax = 0;
    const mystate = await zonesModel.findById(state);
    if (mystate && mystate.primary === 1) {
      statetax = 1;
    }
    if (!c_name || !address || !city || !state || !pincode || !gstin) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    // Prepare update fields
    let updateFields = {
      c_name,
      address,
      city,
      state,
      pincode,
      gstin,
      Local: statetax,
    };

    // Perform database update
    const updatedUser = await userModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      updatedUser,
    });
  } catch (error) {
    console.error("Error while updating profile:", error);
    return res.status(400).json({
      success: false,
      message: `Error while updating profile: ${error.message}`,
      error: error.message,
    });
  }
};

export const updatePasswordUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Prepare update fields
    let updateFields = {
      password: hashedPassword,
    };

    // Perform database update
    const updatedUser = await userModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      updatedUser,
      message: "Password Updated Sucessfully",
    });
  } catch (error) {
    console.error("Error while updating profile:", error);
    return res.status(400).json({
      success: false,
      message: `Error while updating profile: ${error.message}`,
      error: error.message,
    });
  }
};

// signup user

export const UpdateKycImage = upload.fields([
  { name: "DLfile", maxCount: 1 },
  { name: "AadhaarFront", maxCount: 1 },
  { name: "AadhaarBack", maxCount: 1 },
  { name: "PoliceVerification", maxCount: 1 },
]);

export const updateKycUser = async (req, res) => {
  try {
    const { id } = req.params;

    const files = req.files || {};
    console.log(" req.files", req.files);
    // Extract files safely
    const DLfile = files.DLfile ? files.DLfile[0] : undefined;
    const PoliceVerification = files.PoliceVerification
      ? files.PoliceVerification[0]
      : undefined;
    const AadhaarBack = files.AadhaarBack ? files.AadhaarBack[0] : undefined;
    const AadhaarFront = files.AadhaarFront ? files.AadhaarFront[0] : undefined;

    // Validate that all required files are present
    if (!DLfile || !PoliceVerification || !AadhaarBack || !AadhaarFront) {
      return res.status(400).json({
        success: false,
        message:
          "All required files (DLfile, PoliceVerification, AadhaarBack, AadhaarFront) must be provided.",
      });
    }

    // Prepare update fields
    let updateFields = {};

    // Ensure that file paths are set correctly
    if (DLfile) {
      updateFields.DL = DLfile.path
        .replace(/\\/g, "/")
        .replace(/^public\//, ""); // Normalize path
    }
    if (PoliceVerification) {
      updateFields.PoliceVerification = PoliceVerification.path
        .replace(/\\/g, "/")
        .replace(/^public\//, ""); // Normalize path
    }
    if (AadhaarBack) {
      updateFields.AadhaarBack = AadhaarBack.path
        .replace(/\\/g, "/")
        .replace(/^public\//, ""); // Normalize path
    }
    if (AadhaarFront) {
      updateFields.AadhaarFront = AadhaarFront.path
        .replace(/\\/g, "/")
        .replace(/^public\//, ""); // Normalize path
    }
    console.log("updateFields", updateFields); // This should now display the correct updateFields object

    const updatedUser = await userModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      updatedUser,
    });
  } catch (error) {
    console.error("Error while updating profile:", error);
    return res.status(400).json({
      success: false,
      message: `Error while updating profile: ${error.message}`,
      error: error.message,
    });
  }
};

export const contactEnquire = async (req, res) => {
  const { name, email, message } = req.body;

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    // SMTP configuration
    host: process.env.MAIL_HOST, // Update with your SMTP host
    port: process.env.MAIL_PORT, // Update with your SMTP port
    secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
    auth: {
      user: process.env.MAIL_USERNAME, // Update with your email address
      pass: process.env.MAIL_PASSWORD, // Update with your email password
    },
  });

  // Email message
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
    to: process.env.MAIL_TO_ADDRESS, // Update with your email address
    subject: "New Contact Us Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Failed to send email");
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).send("Email sent successfully");
    }
  });
};

export const getProductsByHSN = async (req, res) => {
  try {
    const { id } = req.params;

    const products = await productModel
      .find({ hsn: id })
      .select("variations")
      .exec();
    if (!products) {
      return res.status(401).send({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product found",
      products,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error on Auth ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const getProductsByFilterUser = async (req, res) => {
  try {
    const { title, value, hsn } = req.query; // Destructure title, value, and hsn

    // Construct the filter object
    const filter = {};
    if (title && value) {
      filter[`variations.${title}.0.${title}`] = value;
    }
    if (hsn) {
      filter.hsn = hsn;
    }

    // Find products based on the filter
    const products = await productModel.find(filter);

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// for cancel order

export const cancelOrderUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, reason } = req.body;

    let updateFields = {
      status: "0",
      comment,
      reason,
    };

    await orderModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return res.status(200).json({
      message: "Order Cancel!",
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Rating: ${error}`,
      success: false,
      error,
    });
  }
};

export const AllValetByUser = async (req, res) => {
  try {
    const id = req.params.id;

    const valetList = await valetModel
      .find({ userId: id })
      .populate("driverId")
      .populate("VendorId")
      .lean();

    console.log("Found valetList:", valetList);

    if (!valetList || valetList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valet found for the specified User",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Valet accepted by the User retrieved successfully",
      Valet: valetList,
    });
  } catch (error) {
    console.error("Error retrieving valet accepted by User:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving valet accepted by User",
      error: error.message,
    });
  }
};

export const AllValetServiceByUser = async (req, res) => {
  try {
    const id = req.params.id;

    const valetList = await valetRideModel
      .find({ userId: id })
      .populate("driverId")
      .populate("VendorId")
      .populate("userId")
      .populate("Valet_Model")
      .lean();

    console.log("Found valetList:", valetList);

    if (!valetList || valetList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valet found for the specified User",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Valet accepted by the User retrieved successfully",
      Valet: valetList,
    });
  } catch (error) {
    console.error("Error retrieving valet accepted by User:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving valet accepted by User",
      error: error.message,
    });
  }
};

// for driver

export const getAllBookRide = async (req, res) => {
  try {
    const cancelId = req.params.id;

    const Bookings = await orderModel
      .find({
        $or: [{ driverId: { $exists: false } }, { driverId: { $eq: null } }],
        CancelId: { $ne: cancelId }, // Exclude bookings where CancelId matches
      })
      .populate("userId")
      .lean();

    if (!Bookings || Bookings.length === 0) {
      return res.status(200).send({
        message: "No Bookings Found",
        success: false,
      });
    }

    return res.status(200).send({
      message: "All Bookings List ",
      BookingCount: Bookings.length,
      success: true,
      Bookings,
    });
  } catch (error) {
    return res.status(500).send({
      message: `Error while getting Bookings: ${error}`,
      success: false,
      error,
    });
  }
};

export const RejectOrderDriver = async (req, res) => {
  try {
    const { orderId, driverId } = req.body; // Changed to camelCase orderId

    // Validation
    if (!orderId || !driverId) {
      return res.status(400).json({
        success: false,
        message: "Please provide both orderId & driverId",
      });
    }

    // Check if the order exists
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if the order already has a driver assigned
    if (order.CancelId.length !== 0) {
      return res.status(400).json({
        success: false,
        message: "This booking has already been Cancel by another driver",
      });
    }

    // Update the order with the provided driverId
    order.CancelId = driverId;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancel by the driver successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while cancel booking: ${error}`,
      success: false,
      error,
    });
  }
};

export const AllBookingsByDriver = async (req, res) => {
  try {
    const driverId = req.params.id; // Assuming the driverId is passed as a parameter in the request

    // Find bookings accepted by the specified driver and populate user data
    const bookings = await orderModel
      .find({ driverId: driverId })
      .populate("userId")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Bookings accepted by the driver retrieved successfully",
      bookings: bookings,
    });
  } catch (error) {
    console.error("Error retrieving bookings accepted by driver:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving bookings accepted by driver",
      error: error.message,
    });
  }
};

// Accept Booking By driver
export const AcceptOrderDriver = async (req, res) => {
  try {
    const { orderId, driverId } = req.body; // Changed to camelCase orderId

    // Validation
    if (!orderId || !driverId) {
      return res.status(400).json({
        success: false,
        message: "Please provide both orderId & driverId",
      });
    }

    // Check if the order exists
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if the order already has a driver assigned
    if (order.driverId) {
      return res.status(400).json({
        success: false,
        message: "This booking has already been accepted by another driver",
      });
    }

    // Check if the driver has already started another order
    const activeOrders = await orderModel.find({
      driverId: driverId,
      startStatusOTP: 1,
      endStatusOTP: 0,
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: "The driver has already started another Ride",
      });
    }

    const user = await userModel.findById(driverId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Calculate the commission and the amount to deduct from the user's wallet
    const orderAmount = order.totalAmount;
    const commissionRate = user.LocalCommission / 100;
    const commissionAmount = orderAmount * commissionRate;

    console.log("amountToDeduct", commissionAmount);

    if (user.wallet >= commissionAmount) {
      //  Update the order with the provided driverId
      order.driverId = driverId;
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Booking accepted by the driver successfully",
        order,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "You do not have enough funds to accept this ride",
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: `Error while accepting booking: ${error}`,
      success: false,
      error,
    });
  }
};

// Start ride
export const StartOrderRide = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(orderId);
    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Please Provide orderId ",
      });
    }

    // Check if the order exists
    const order = await orderModel.findById(orderId);
    // Generate 4-digit random OTP
    const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

    // Create two different OTPs
    const startOTP = generateOTP();
    //  const endOTP = generateOTP();
    order.startOTP = startOTP;
    //  order.endOTP = endOTP;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Start Ride OTP Genrated successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error While Start Ride OTP Genrated ${error}`,
      success: false,
      error,
    });
  }
};

export const EndOrderRide = async (req, res) => {
  try {
    const orderId = req.params.id;
    //console.log(orderId);
    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Please Provide orderId ",
      });
    }

    // Check if the order exists
    const order = await orderModel.findById(orderId);
    // Generate 4-digit random OTP
    const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

    // Create two different OTPs

    const endOTP = generateOTP();
    order.endOTP = endOTP;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Start Ride OTP Genrated successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error While Start Ride OTP Genrated ${error}`,
      success: false,
      error,
    });
  }
};

export const StartOrderVerifyRide = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Please Provide orderId ",
      });
    }

    // Check if the order exists
    const order = await orderModel.findById(orderId);

    order.startStatusOTP = 1;
    order.otpStartDate = new Date(); // Update otpStartDate to the current date and time
    //  order.endOTP = endOTP;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Start Ride OTP Verified successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error While Start Ride OTP Verified ${error}`,
      success: false,
      error,
    });
  }
};

const calculateTimeDuration = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);

  const difference = endTime - startTime;
  const hours = Math.floor(difference / 1000 / 60 / 60);
  const minutes = Math.floor((difference / 1000 / 60) % 60);

  return { hours, minutes };
};

const calculateDaysDuration = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);

  // Calculate the total difference in milliseconds
  const difference = endTime - startTime;

  // Calculate the number of days
  const days = Math.floor(difference / 1000 / 60 / 60 / 24);

  // Calculate the number of night changes
  let nightChanges = 0;
  let currentTime = new Date(startTime);

  // Iterate from start to end, checking each night period
  while (currentTime < endTime) {
    // Define the night period for the current date
    const currentNightStart = new Date(currentTime);
    currentNightStart.setHours(23, 0, 0, 0); // 11 PM of the current day
    const currentNightEnd = new Date(currentTime);
    currentNightEnd.setDate(currentNightEnd.getDate() + 1);
    currentNightEnd.setHours(5, 0, 0, 0); // 5 AM of the next day

    // Check if the interval overlaps with the night period
    if (
      (startTime < currentNightEnd && endTime > currentNightStart) ||
      (startTime < currentNightEnd && endTime > currentNightStart)
    ) {
      nightChanges++;
    }

    // Move to the next day
    currentTime.setDate(currentTime.getDate() + 1);
  }

  return { days, nightChanges };
};

export const EndOrderVerifyRide = async (req, res) => {
  const { FinalDriveKM } = req.body; // Changed to camelCase orderId

  try {
    const orderId = req.params.id;

    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Please Provide orderId ",
      });
    }

    // Check if the order exists
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const caldata = await homeModel.findOne();

    // Check if caldata exists
    if (!caldata) {
      return res.status(404).json({
        success: false,
        message: "calulation data not found.",
      });
    }

    order.endStatusOTP = 1;
    const EndDate = new Date(); // Update otpEndDate to the current date and time
    order.otpEndDate = EndDate;
    let TotalCost = 0;

    const Totaltime = calculateDaysDuration(order.otpStartDate, EndDate);
    let { days, nightChanges } = Totaltime;

    if (order.bookingTyp === "Outstation") {
      if (order.rideTyp === "One Way") {
        console.log(`FinalDriveKM: ${FinalDriveKM}`);

        TotalCost = Number(FinalDriveKM) * caldata.OutstationOneWayChargesKm;
        console.log(`TotalCost One Way: ${TotalCost} ${FinalDriveKM}`);
      } else {
        if (days === 0) {
          days = 1;
        }

        TotalCost =
          days * caldata.outstationChargesRoundTripDay +
          nightChanges * caldata.OutstationNightCharges;

        console.log(`nightChanges: ${nightChanges} `);

        console.log(`days: ${days} `);
        console.log(`TotalCost: ${TotalCost} `);
      }
    } else {
      const Totaltime = calculateTimeDuration(order.otpStartDate, EndDate);
      const { hours, minutes } = Totaltime;

      // Calculate total cost based on time duration
      if (hours <= 4) {
        TotalCost = caldata.localCharges13;
        if (hours === 4) {
          if (minutes > 0) {
            TotalCost += minutes * caldata.localBeyond3hrsMinute;
          }
        }
      } else {
        TotalCost =
          (hours - 4) * 60 * caldata.localBeyond3hrsMinute +
          caldata.localCharges13;
        if (minutes > 0) {
          TotalCost += minutes * caldata.localBeyond3hrsMinute;
        }
      }
      TotalCost = TotalCost + nightChanges * caldata.localNightChargesHour;
    }

    const roundedTotalCost = Math.round(TotalCost);

    if (TotalCost === undefined && TotalCost === 0) {
      return res.status(404).json({
        success: false,
        message: "Total Cost Undefined",
      });
    }

    order.totalAmount = roundedTotalCost;

    // Find the user by driverId
    const user = await userModel.findById(order.driverId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Calculate the commission and the amount to deduct from the user's wallet
    const orderAmount = roundedTotalCost;
    const commissionRate = user.LocalCommission / 100;
    const commissionAmount = Math.round(orderAmount * commissionRate);

    console.log("amountToDeduct", commissionAmount);

    if (user.wallet >= commissionAmount) {
      user.wallet -= commissionAmount; // Deduct the amount from the user's wallet
      await user.save();

      // for create trasaction id

      const lastTrans = await transactionModel
        .findOne()
        .sort({ _id: -1 })
        .limit(1);
      let lastTransId;

      if (lastTrans) {
        // Convert lastOrder.orderId to a number before adding 1
        const lastOrderId = parseInt(lastTrans.t_no || 0);
        lastTransId = lastOrderId + 1;
      } else {
        lastTransId = 1;
      }

      // Calculate the auto-increment ID
      const t_id = "tt00" + lastTransId;

      const transaction = new transactionModel({
        userId: order.driverId,
        type: 1,
        note:
          "Commission deducted and ride completed Booking ID #" + order.orderId,
        amount: -commissionAmount,
        t_id,
        t_no: lastTransId,
      });

      await transaction.save();
    } else {
      return res.status(400).json({
        success: false,
        message: "You do not have enough funds to end this ride",
      });
    }

    console.log("order", order.driverId, user);

    await order.save();

    return res.status(200).json({
      success: true,
      message: "End Ride OTP Verified successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error While Start Ride OTP Verified ${error}`,
      success: false,
      error,
    });
  }
};

export const AllValetByDriver = async (req, res) => {
  try {
    const id = req.params.id;
    const type = req.params.type;

    const valetList = await valetModel
      .find({ driverId: id, type })
      .populate("userId")
      .populate("VendorId")
      .lean();

    console.log("Found valetList:", valetList);

    if (!valetList || valetList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valet found for the specified driver",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Valet accepted by the driver retrieved successfully",
      Valet: valetList,
    });
  } catch (error) {
    console.error("Error retrieving valet accepted by driver:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving valet accepted by driver",
      error: error.message,
    });
  }
};

export const AddDriverValetRide = async (req, res) => {
  try {
    const {
      PickupStartLocation,
      PickupEndLocation,
      DropStartLocation,
      DropEndLocation,
      userId,
      VendorId,
      driverId,
      Valet_Model,
    } = req.body;

    const valetRide = new valetRideModel({
      PickupStartLocation,
      PickupEndLocation,
      DropStartLocation,
      DropEndLocation,
      userId,
      VendorId,
      driverId,
      Valet_Model,
    });

    await valetRide.save();
    res.status(201).json({
      success: true,
      message: "Valet Ride Created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: `Error occurred during Valet Ride Creating: ${error}`,
      success: false,
      error,
    });
  }
};

export const driverValeRideViewController = async (req, res) => {
  try {
    const { valetId } = req.params;

    // Assuming you want to find a valet record based on userId and valetId
    const valet = await valetRideModel
      .findOne({ _id: valetId })
      .populate(
        "userId",
        "_id username email phone carNumber carName carImage "
      ) // Populate userId with specified fields
      .populate("VendorId", "_id username email phone") // Populate VendorId with specified fields
      .populate("Valet_Model", "_id"); // Populate VendorId with specified fields

    if (!valet) {
      return res.status(404).json({
        success: false,
        message: "Valet Ride not found",
      });
    }

    return res.status(200).json({
      message: "Single Valet Ride Found By driver ID and valet ID",
      success: true,
      valet: valet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while getting Valet ride",
      error: error.message,
    });
  }
};

// for Vendor
// for Vendor
// for Vendor
// for Vendor

export const getAllBookValet = async (req, res) => {
  try {
    const cancelId = req.params.id;

    const Valet = await valetModel
      .find({
        $or: [
          { VendorId: { $exists: false } }, // Matches documents where VendorId does not exist
          { VendorId: null }, // Matches documents where VendorId is null
          { VendorId: [] }, // Matches documents where VendorId is an empty string
        ],
        CancelId: { $ne: cancelId }, // Exclude bookings where CancelId matches
      })
      .populate("userId")
      .lean();
    console.log("Valet", Valet);

    if (!Valet || Valet.length === 0) {
      return res.status(200).send({
        message: "No Valet Found",
        success: false,
      });
    }

    return res.status(200).send({
      message: "All Valet List ",
      BookingCount: Valet.length,
      success: true,
      Valet,
    });
  } catch (error) {
    return res.status(500).send({
      message: `Error while getting Valet: ${error}`,
      success: false,
      error,
    });
  }
};

// Accept Valet By Vendor
export const AcceptValetVendor = async (req, res) => {
  try {
    const { valetId, vendorId } = req.body; // Changed to camelCase orderId

    // Validation
    if (!valetId || !vendorId) {
      return res.status(400).json({
        success: false,
        message: "Please provide both valet & vendor",
      });
    }

    // Check if the order exists
    const valet = await valetModel.findById(valetId);

    if (!valet) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    // Check if the order already has a driver assigned
    if (valet.VendorId && valet.VendorId.length !== 0) {
      return res.status(400).json({
        success: false,
        message: "This valet has already been accepted by another vendor",
      });
    }

    const user = await userModel.findById(vendorId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Calculate the commission and the amount to deduct from the user's wallet
    const orderAmount = valet.totalAmount;
    const commissionRate = user.LocalCommission / 100;
    const commissionAmount = orderAmount * commissionRate;

    console.log("amountToDeduct", commissionAmount);

    if (user.wallet >= commissionAmount) {
      //  Update the order with the provided driverId
      valet.VendorId = vendorId;
      await valet.save();

      return res.status(200).json({
        success: true,
        message: "Booking accepted by the driver successfully",
        valet,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "You do not have enough funds to accept this valet",
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: `Error while accepting booking: ${error}`,
      success: false,
      error,
    });
  }
};

export const AllValetByVendor = async (req, res) => {
  try {
    const id = req.params.id;
    const type = req.params.type;
    console.log("Searching for valet with VendorId:", id);

    const valetList = await valetModel
      .find({ VendorId: id, type })
      .populate("userId")
      .lean();

    console.log("Found valetList:", valetList);

    if (!valetList || valetList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valet found for the specified vendor",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Valet accepted by the vendor retrieved successfully",
      Valet: valetList,
    });
  } catch (error) {
    console.error("Error retrieving valet accepted by vendor:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving valet accepted by vendor",
      error: error.message,
    });
  }
};

export const userValetViewController_old = async (req, res) => {
  try {
    const { userId, valetId } = req.params;

    // Find the user by ID and populate their orders
    const userOrder = await userModel.findById(userId).populate({
      path: "valets",
      match: { _id: valetId }, // Match the order ID
      populate: [
        {
          path: "VendorId", // Populate the VendorId
          select: "_id username email phone", // Select the fields you want to include from the VendorId
        },
        {
          path: "Valetride_Model", // Populate the Valetride_Model array
          select:
            "_id driverId PickupStartLocation PickupEndLocation DropStartLocation DropEndLocation",
        },
      ],
    });

    // If user or order not found, return appropriate response
    if (!userOrder || !userOrder.orders) {
      return res.status(404).json({
        message: "Valet Not Found By user or Order ID",
        success: false,
      });
    }
    console.log(userOrder);
    const valet = await valetModel.findById(valetId);
    console.log("ValetId", valetId);
    // If user order found, return success response with the single order
    return res.status(200).json({
      message: "Single Valet Found By user ID and Order ID",
      success: true,
      userOrder: userOrder, // Assuming there's only one order per user
      drivers: valet,
    });
  } catch (error) {
    // If any error occurs during the process, log it and return error response
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Error while getting Valet",
      error,
    });
  }
};

export const userValetViewController = async (req, res) => {
  try {
    const { valetId } = req.params;

    // Assuming you want to find a valet record based on userId and valetId
    const valet = await valetModel
      .findOne({ _id: valetId })
      .populate("userId", "_id username email phone") // Populate userId with specified fields
      .populate("VendorId", "_id username email phone"); // Populate VendorId with specified fields

    if (!valet) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    return res.status(200).json({
      message: "Single Valet Found By user ID and Order ID",
      success: true,
      valet: valet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while getting Valet",
      error: error.message,
    });
  }
};

export const UserAllValtRides = async (req, res) => {
  const { valetId } = req.params;

  try {
    const Rides = await valetRideModel.find({ Valet_Model: valetId });

    if (!Rides) {
      return res.status(200).send({
        message: "NO Rides Found",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All Rides List ",
      proCount: Rides.length,
      success: true,
      Rides,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while All Rides ${error}`,
      success: false,
      error,
    });
  }
};

export const driverValetViewController = async (req, res) => {
  try {
    const { driverId, valetId } = req.params;

    // Assuming you want to find a valet record based on userId and valetId
    const valet = await valetModel
      .findOne({ driverId, _id: valetId })
      .populate("userId", "_id username email phone") // Populate userId with specified fields
      .populate("VendorId", "_id username email phone"); // Populate VendorId with specified fields

    if (!valet) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    return res.status(200).json({
      message: "Single Valet Found By user ID and Order ID",
      success: true,
      valet: valet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while getting Valet",
      error: error.message,
    });
  }
};

export const AddDriverVendor = async (req, res) => {
  try {
    const {
      type,
      username,
      phone,
      email,
      password,
      pincode,
      Gender,
      DOB,
      address,
      parentId,
    } = req.body;

    const {
      profile,
      DLfile,
      AadhaarFront,
      AadhaarBack,
      PoliceVerification,
      PassPort,
      Electricity,
      WaterBill,
    } = req.files;

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

    console.log("Uploaded profile:", profile[0].path);
    const newUser = new userModel({
      type,
      username,
      phone,
      email,
      password: hashedPassword,
      pincode,
      Gender,
      DOB,
      address,
      parentId,
      profile: profile ? profile[0].path : "",
      DL: DLfile ? DLfile[0].path : "",
      AadhaarFront: AadhaarFront ? AadhaarFront[0].path : "",
      AadhaarBack: AadhaarBack ? AadhaarBack[0].path : "",
      PoliceVerification: PoliceVerification ? PoliceVerification[0].path : "",
      PassPort: PassPort ? PassPort[0].path : "",
      Electricity: Electricity ? Electricity[0].path : "",
      WaterBill: WaterBill ? WaterBill[0].path : "",
    });

    await newUser.save();
    res.status(201).json({
      success: true,
      message: "User signed up successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: `Error occurred during user signup ${error}`,
      success: false,
      error,
    });
  }
};

export const AllDriversByVendor = async (req, res) => {
  try {
    const id = req.params.id; // Assuming the driverId is passed as a parameter in the request

    // Find bookings accepted by the specified driver and populate user data
    const DriverList = await userModel.find({ parentId: id }).lean();

    return res.status(200).json({
      success: true,
      message: "All drivers by vendor",
      Driver: DriverList,
    });
  } catch (error) {
    console.error("Error getting All drivers by vendor:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting All drivers by vendor",
      error: error.message,
    });
  }
};

export const AssignedDriverValet = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverIds } = req.body;

    console.log(driverIds);
    // Check if driverIds is an array of valid ObjectId (24 hex characters)
    if (
      !Array.isArray(driverIds) ||
      !driverIds.every((id) => /^[0-9a-fA-F]{24}$/.test(id))
    ) {
      return res.status(400).json({
        message: "Invalid driverIds array",
        success: false,
      });
    }

    const order = await valetModel.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }

    for (const driverId of driverIds) {
      const driverIndex = order.driverId.findIndex(
        (driver) => driver.toString() === driverId
      );

      if (driverIndex !== -1) {
        // Remove the driverId if it's already assigned
        order.driverId.splice(driverIndex, 1);

        const text = `Valet Id #${order.Valet_Id} Removed By Vendor`;
        const notification = new notificationModel({
          text,
          receiver: driverId,
        });

        await notification.save();

        console.log("Driver removed success!", driverId);
      } else {
        const text = `Valet Id #${order.Valet_Id} Assigned By Vendor`;
        const notification = new notificationModel({
          text,
          receiver: driverId,
        });

        await notification.save();

        const user = await userModel.findById(driverId);
        if (user) {
          user.notifications += 1;
          await user.save();
        }

        order.driverId.push(driverId);

        console.log(`Driver assigned: ${driverId}`);
      }
    }

    await order.save();

    return res.status(200).json({
      message: "Drivers updated successfully!",
      success: true,
    });
  } catch (error) {
    console.error(`Error while updating Order: ${error}`);
    return res.status(500).json({
      message: `Error while updating Order: ${error}`,
      success: false,
      error,
    });
  }
};

export const UnAssignedDriverValet = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    // Check if driverId is a valid ObjectId (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(driverId)) {
      return res.status(400).json({
        message: "Invalid driverId",
        success: false,
      });
    }

    const order = await valetModel.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }

    const driverIndex = order.driverId.findIndex(
      (driver) => driver.toString() === driverId
    );

    if (driverIndex !== -1) {
      // Remove the driverId if it's already assigned
      order.driverId.splice(driverIndex, 1);

      const text = `Valet Id #${order.Valet_Id} Removed By Vendor`;
      const notification = new notificationModel({
        text,
        receiver: driverId,
      });

      await notification.save();

      await order.save();

      console.log("Driver remove success!", driverId);

      return res.status(200).json({
        message: "Driver removed successfully!",
        success: false,
      });
    } else {
      const text = `Valet Id #${order.Valet_Id} Assigned By Vendor`;
      const notification = new notificationModel({
        text,
        receiver: driverId,
      });

      await notification.save();

      const user = await userModel.findById(driverId);
      if (user) {
        user.notifications += 1;
        await user.save();
      }

      order.driverId.push(driverId);

      await order.save();

      console.log(`Driver assigned: ${driverId}`);

      return res.status(200).json({
        message: "Driver assigned successfully!",
        success: true,
      });
    }
  } catch (error) {
    console.error(`Error while updating Order: ${error}`);
    return res.status(500).json({
      message: `Error while updating Order: ${error}`,
      success: false,
      error,
    });
  }
};

export const StartValetRide = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(orderId);
    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Please Provide valetId ",
      });
    }

    // Check if the order exists
    const order = await valetModel.findById(orderId);
    // Generate 4-digit random OTP
    const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

    // Create two different OTPs
    const startOTP = generateOTP();
    //  const endOTP = generateOTP();
    order.startOTP = startOTP;
    //  order.endOTP = endOTP;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Start Ride OTP Genrated successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error While Start Valet OTP Genrated ${error}`,
      success: false,
      error,
    });
  }
};

export const EndValetRide = async (req, res) => {
  try {
    const orderId = req.params.id;
    //console.log(orderId);
    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Please Provide valetId ",
      });
    }

    // Check if the order exists
    const order = await valetModel.findById(orderId);
    // Generate 4-digit random OTP
    const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

    // Create two different OTPs

    const endOTP = generateOTP();
    order.endOTP = endOTP;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Start Valet OTP Genrated successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error While Start Valet OTP Genrated ${error}`,
      success: false,
      error,
    });
  }
};

export const StartValetVerifyRide = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Please Provide ValtId ",
      });
    }

    // Check if the order exists
    const order = await valetModel.findById(orderId);

    order.startStatusOTP = 1;
    order.otpStartDate = new Date(); // Update otpStartDate to the current date and time
    //  order.endOTP = endOTP;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Start Valet OTP Verified successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error While Start Valet OTP Verified ${error}`,
      success: false,
      error,
    });
  }
};

export const valetUpdateDailyCost = async (req, res) => {
  try {
    const { id } = req.params;

    const { dailyCost } = req.body;

    let updateFields = {
      dailyCost,
    };

    const valet = await valetModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return res.status(200).json({
      message: "Valet Updated!",
      success: true,
      valet,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Valet: ${error}`,
      success: false,
      error,
    });
  }
};

export const EndValetVerifyRide = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Please Provide orderId ",
      });
    }

    // Check if the order exists
    const order = await valetModel.findById(orderId);

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order not found",
      });
    }

    order.endStatusOTP = 1;
    const EndDate = new Date(); // Update otpEndDate to the current date and time
    order.otpEndDate = EndDate;
    const orderAmount = order.totalAmount;

    console.log(order.VendorId);
    // Find the user by driverId
    const vendorIds = order.VendorId; // Assuming VendorId is an array of ObjectIds
    const user = await userModel.findOne({ _id: order.VendorId });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Driver not found",
      });
    }

    const commissionRate = user.LocalCommission / 100;
    const commissionAmount = Math.round(orderAmount * commissionRate);

    console.log("amountToDeduct", user.LocalCommission);

    if (user.wallet >= commissionAmount) {
      user.wallet -= commissionAmount; // Deduct the amount from the user's wallet
      await user.save();

      // for create trasaction id
      const lastTrans = await transactionModel
        .findOne()
        .sort({ _id: -1 })
        .limit(1);
      let lastTransId;

      if (lastTrans) {
        // Convert lastOrder.orderId to a number before adding 1
        const lastOrderId = parseInt(lastTrans.t_no || 0);
        lastTransId = lastOrderId + 1;
      } else {
        lastTransId = 1;
      }

      // Calculate the auto-increment ID
      const t_id = "tt00" + lastTransId;

      const transaction = new transactionModel({
        userId: order.VendorId,
        type: 1,
        note:
          "Commission deducted and Valet completed Booking ID #" +
          order.orderId,
        amount: -commissionAmount,
        t_id,
        t_no: lastTransId,
      });

      await transaction.save();
    } else {
      return res.status(400).json({
        success: false,
        message: "You do not have enough funds to end this Valet",
      });
    }

    // console.log("order", order.driverId, user);

    await order.save();

    return res.status(200).json({
      success: true,
      message: "End Valet OTP Verified successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error While Start Ride OTP Verified ${error}`,
      success: false,
      error,
    });
  }
};

export const UpdateUserValetRide = async (req, res) => {
  try {
    const {
      PickupStartLocation,
      PickupEndLocation,
      DropStartLocation,
      DropEndLocation,
      driverId,
    } = req.body;

    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Valet id is required",
      });
    }

    const updateFields = {};

    // Ensure that each location object is properly structured with `location`, `longitude`, and `latitude`
    if (PickupStartLocation) {
      if (
        PickupStartLocation.location &&
        PickupStartLocation.longitude &&
        PickupStartLocation.latitude
      ) {
        updateFields.PickupStartLocation = {
          location: PickupStartLocation.location,
          longitude: PickupStartLocation.longitude,
          latitude: PickupStartLocation.latitude,
        };
      } else {
        return res.status(400).json({
          success: false,
          message:
            "PickupStartLocation must include location, longitude, and latitude",
        });
      }
    }

    if (PickupEndLocation) {
      if (
        PickupEndLocation.location &&
        PickupEndLocation.longitude &&
        PickupEndLocation.latitude
      ) {
        updateFields.PickupEndLocation = {
          location: PickupEndLocation.location,
          longitude: PickupEndLocation.longitude,
          latitude: PickupEndLocation.latitude,
        };
      } else {
        return res.status(400).json({
          success: false,
          message:
            "PickupEndLocation must include location, longitude, and latitude",
        });
      }
    }

    if (DropStartLocation) {
      if (
        DropStartLocation.location &&
        DropStartLocation.longitude &&
        DropStartLocation.latitude
      ) {
        updateFields.DropStartLocation = {
          location: DropStartLocation.location,
          longitude: DropStartLocation.longitude,
          latitude: DropStartLocation.latitude,
        };
      } else {
        return res.status(400).json({
          success: false,
          message:
            "DropStartLocation must include location, longitude, and latitude",
        });
      }
    }

    if (DropEndLocation) {
      if (
        DropEndLocation.location &&
        DropEndLocation.longitude &&
        DropEndLocation.latitude
      ) {
        updateFields.DropEndLocation = {
          location: DropEndLocation.location,
          longitude: DropEndLocation.longitude,
          latitude: DropEndLocation.latitude,
        };
      } else {
        return res.status(400).json({
          success: false,
          message:
            "DropEndLocation must include location, longitude, and latitude",
        });
      }
    }

    if (driverId) {
      updateFields.driverId = driverId;
    }

    const updatedValet = await valetRideModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedValet) {
      return res.status(404).json({
        success: false,
        message: "Valet not found",
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: "Valet updated successfully",
      data: updatedValet,
    });
  } catch (error) {
    console.error("Error occurred during Valet update:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred during Valet update: ${error.message}`,
      error: error,
    });
  }
};

export const editValetRidePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment } = req.body;

    const updateFields = {
      payment,
    };

    await valetRideModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return res.status(200).json({
      message: "Valet Ride Status Updated!",
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Valet Ride: ${error}`,
      success: false,
      error,
    });
  }
};

///////  for whatsapp api

export const SignupUserValetTypeViaAPI = async (
  phone,
  VendorId,
  driverId,
  Valet_Model,
  phoneId
) => {
  try {
    const newUser = new userModel({
      phone,
      verified: 1,
    });

    await newUser.save();

    const valetRide = new valetRideModel({
      userId: newUser._id,
      VendorId,
      driverId,
      Valet_Model,
    });

    await valetRide.save();

    await sendMessage(
      phoneId,
      "Thankyou your account created successfully for valet booking service, Now Driver Will Update Further Details "
    );
  } catch (error) {
    console.log(error);
    await sendMessage(
      phoneId,
      "Hey, user something is missing please try again later "
    );
  }
};

// for Leads

export const AddUserLeadController = async (req, res) => {
  try {
    const {
      PickupLocation,
      DropLocation,
      startDate,
      endDate,
      count,
      name,
      email,
      phone,
      CPC,
      type,
      typeRange,
      traveller,
      source,
      PickupTime,
      ridetype,
    } = req.body;

    // Validation
    if (
      !PickupLocation ||
      !DropLocation ||
      !startDate ||
      !endDate ||
      !count ||
      !name ||
      !email ||
      !phone ||
      !CPC ||
      !traveller
    ) {
      console.log(req.body);
      return res.status(400).send({
        success: false,
        message: "Please Provide All Fields",
      });
    }

    // Calculate the auto-increment ID
    const lastLead = await LeadModel.findOne().sort({ _id: -1 }).limit(1);
    let LeadId;

    if (lastLead) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastLead.LeadId);
      LeadId = lastOrderId + 1;
    } else {
      LeadId = 1;
    }

    // Create a new category with the specified parent
    const newLead = new LeadModel({
      PickupLocation,
      DropLocation,
      startDate,
      endDate,
      count,
      LeadId,
      name,
      email,
      phone,
      CPC,
      type,
      typeRange,
      traveller,
      source,
      PickupTime,
      ridetype,
    });
    await newLead.save();

    return res.status(200).send({
      success: true,
      message: "Leads Creating Successfully!",
    });
  } catch (error) {
    console.error("Error while creating Leads:", error);
    return res.status(400).send({
      success: false,
      message: "Error while creating Leads",
      error,
    });
  }
};

// for Employee

export const AddEmployeeLeadController = async (req, res) => {
  try {
    const {
      PickupLocation,
      DropLocation,
      startDate,
      endDate,
      count,
      name,
      email,
      phone,
      CPC,
      type,
      typeRange,
      traveller,
      EmployeeId,
      source,
    } = req.body;

    // Validation
    if (
      !PickupLocation ||
      !DropLocation ||
      !startDate ||
      !endDate ||
      !count ||
      !name ||
      !email ||
      !phone ||
      !CPC ||
      !type ||
      !traveller
    ) {
      return res.status(400).send({
        success: false,
        message: "Please Provide All Fields",
      });
    }

    // Calculate the auto-increment ID
    const lastLead = await LeadModel.findOne().sort({ _id: -1 }).limit(1);
    let LeadId;

    if (lastLead) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastLead.LeadId);
      LeadId = lastOrderId + 1;
    } else {
      LeadId = 1;
    }

    // Create a new category with the specified parent
    const newLead = new LeadModel({
      PickupLocation,
      DropLocation,
      startDate,
      endDate,
      count,
      LeadId,
      name,
      email,
      phone,
      CPC,
      type,
      typeRange,
      traveller,
      EmployeeId,
      source,
    });

    await newLead.save();

    return res.status(200).send({
      success: true,
      message: "Leads Creating Successfully!",
    });
  } catch (error) {
    console.error("Error while creating Leads:", error);
    return res.status(400).send({
      success: false,
      message: "Error while creating Leads",
      error,
    });
  }
};

export const getAllLeadsEmployee = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
    const searchTerm = req.query.search || ""; // Get search term from the query parameters

    // Get startDate and endDate from query parameters
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const status = req.query.status || ""; // Get search term from the query parameters
    const EmployeeId = req.query.EmployeeId || ""; // Get search term from the query parameters

    const skip = (page - 1) * limit;

    const query = {};
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i"); // Case-insensitive regex pattern for the search term

      // Add regex pattern to search both username and email fields for the full name
      query.$or = [{ name: regex }, { email: regex }];

      if (!isNaN(Number(searchTerm))) {
        query.$or.push({ phone: Number(searchTerm) });
      }
      if (!isNaN(Number(searchTerm))) {
        query.$or.push({ LeadId: Number(searchTerm) });
      }
    }

    if (status.length > 0) {
      query.status = { $in: status }; // Use $in operator to match any of the values in the array
    }

    if (EmployeeId.length > 0) {
      query.EmployeeId = { $in: EmployeeId }; // Use $in operator to match any of the values in the array
    }

    // Add date range filtering to the query
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.createdAt = { $gte: startDate };
    } else if (endDate) {
      query.createdAt = { $lte: endDate };
    }

    const totalData = await LeadModel.countDocuments(query); // Count total documents matching the query

    const leads = await LeadModel.find(query)
      .sort({ _id: -1 }) // Sort by _id in descending order
      .skip(skip)
      .limit(limit)
      .lean(); // Convert documents to plain JavaScript objects

    if (!leads || leads.length === 0) {
      // Check if no users found
      return res.status(400).send({
        // Send 404 Not Found response
        message: "No leads found",
        success: false,
      });
    }

    return res.status(200).send({
      // Send successful response
      message: "All leads list",
      Count: leads.length,
      currentPage: page,
      totalPages: Math.ceil(totalData / limit),
      success: true,
      leads: encrypt(leads, process.env.APIKEY), // Return users array
    });
  } catch (error) {
    return res.status(500).send({
      // Send 500 Internal Server Error response
      message: `Error while getting zones: ${error.message}`,
      success: false,
      error,
    });
  }
};

const generateUserInvoicePDF = async (invoiceData) => {
  // console.log(invoiceData);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const gstRate = 0.18;

  const totalWithGST = invoiceData.totalAmount;
  const amountWithoutGST = totalWithGST / (1 + gstRate);

  const CSGT = invoiceData.totalAmount - amountWithoutGST.toFixed(2);

  const TotalLocal = CSGT / 2;

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  // Define the HTML content
  const htmlContent = `
    <div class="invoice">
      <div class="invoice-header">
        <div class="invoice-header-left">
          <img src="https://www.travelintrip.com/assets/images/logo.png" alt="Company Logo" width="150">
          
          <p>Mig-38, Defence Colony, Karguan Ji,Jhansi</p>
          <p>Email: info@travelintrip.com</p>
          <p>Phone: +91 8076864876</p>
        </div>
        <div class="invoice-header-right">
          <h2>Invoice</h2>
          <p   >Invoice Number: #${invoiceData?.paymentId}</p>
          <p>Date: ${formatDate(invoiceData?.createdAt)}     </p>
           <p>Full Name: ${invoiceData.userId?.username}</p>
            <p>Email Id: ${invoiceData.userId?.email}</p>
            <p>Phone No.: ${invoiceData.userId?.phone}</p>

          <p style=" color:${(() => {
            if (invoiceData.payment === 0) {
              return "orange";
            } else if (invoiceData.payment === 1) {
              return "green";
            } else if (invoiceData.payment === 2) {
              return "red";
            }
          })()}"
          > Payment Status : 
          ${(() => {
            if (invoiceData.payment === 0) {
              return "Pending";
            } else if (invoiceData.payment === 1) {
              return "Success";
            } else if (invoiceData.payment === 2) {
              return "failed";
            }
          })()}
          
         </p> 
                         
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr >
            <th >Item</th>
           
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
 
            <tr>
              <td> IT Service Fees</td>
             
              <td> ₹${parseFloat(amountWithoutGST.toFixed(2))}</td>
            </tr>
          
            
        </tbody>
      </table>

      <div class="invoice-total">
        <p>Subtotal: ₹${parseFloat(amountWithoutGST.toFixed(2))}</p>
        ${(() => {
          if (invoiceData.Local === 1) {
            return `<p>
                CGST:  ₹${TotalLocal}
              </p><p>
                SGST:  ₹${TotalLocal}
              </p>`;
          } else if (invoiceData.Local === 0) {
            return `<p>
            IGST: ₹${invoiceData?.totalAmount - amountWithoutGST.toFixed(2)}
          </p>`;
          }
        })()}
        <p>Total: ₹${invoiceData?.totalAmount}</p>
      </div>

      <div class="invoice-footer">
        <div class="text-center mt-3">
          <p>Thank you for your support</p>
        </div>
      </div>
    </div>
    <style>
      body {
        font-family: Arial, sans-serif;
      }
      h2 {
        font-weight: 800;
      }
      .invoice {
        width: 95%;
        margin: 10px auto;
        padding: 20px;
      }
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .invoice-header-left {
        flex: 1;
      }
      .invoice-header-right {
        flex: 1;
        text-align: right;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10%;
      }
      .invoice-table th,
      .invoice-table td {
        border: 1px solid #000;
        padding: 10px;
        text-align: center;
      }
      .invoice-table th {
      
        color:green;
    
      }
      .invoice-total {
        float: right;
      }
    </style>
  `;

  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: "A4" });

  await browser.close();

  return pdfBuffer;
};

export const downloadUserInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body; // Assuming invoiceData is sent in the request body
    if (!invoiceId) {
      return res.status(400).send("Invoice ID is required");
    }
    // Fetch invoice data from the database
    const invoiceData = await paymentModel
      .findById(invoiceId)
      .populate("userId");

    const pdfBuffer = await generateUserInvoicePDF(invoiceData);

    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const loginwithgoogle = async (req, res) => {
  const { idToken } = req.body;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
  });

  const { sub: googleId, email, name } = ticket.getPayload();

  try {
    let user = await userModel.findOne({ googleId });
    if (!user) {
      user = await userModel.create({
        googleId,
        email,
        name,
      });
    }

    // Generate token for the session (optional)
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1h",
    });

    return res.status(200).send({
      success: true,
      message: "Login successfully",
      user,
      token,
    });
  } catch (error) {
    return res.status(500).send({
      message: `Error on Google login: ${error.message}`,
      success: false,
    });
  }
};
