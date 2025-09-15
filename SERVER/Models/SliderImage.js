import mongoose from "mongoose";

const SliderImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "FEEL THE RUSH, LIVE THE ACTION",
    },
    subtitle: {
      type: String,
      default: "Sports like never before",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const SliderImage = mongoose.model("sliderImage", SliderImageSchema);
export default SliderImage;
