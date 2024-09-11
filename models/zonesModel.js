import mongoose from "mongoose";

const zonesSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: [true, "Name is required"],
        },
        primary: {
            type: Number,
            default: 0,
        },

        status: {
            type: Number,
            default: 1,
        }
    },
    { timestamps: true }
);

const zonesModel = mongoose.model("Zone", zonesSchema);

export default zonesModel;