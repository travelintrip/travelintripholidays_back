import mongoose from "mongoose";

const screenSchema = new mongoose.Schema(
    {  image: {
            type: String,
        },
        URL: {
            type: String,
        },
        banners: {
            type: Object,
        },
    },
    { timestamps: true }
);

const screenModel = mongoose.model("Screen", screenSchema);

export default screenModel;