import SliderImage from "../../Models/SliderImage.js";
import cloudinary from "../../Config/cloudinary.js";

const sliderController = {
  // Upload a new slider image
  async uploadImage(req, res) {
    try {
      const { title, subtitle } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: "Image file is required" });
      }

      // Upload to Cloudinary
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "sliderImages",
      });

      const sliderImage = await SliderImage.create({
        url: uploadRes.secure_url,
        title: title || undefined,
        subtitle: subtitle || undefined,
      });

      return res.status(201).json({ success: true, data: sliderImage });
    } catch (error) {
      console.error("Slider upload error", error);
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Get all images (optionally only active)
  async getImages(req, res) {
    try {
      const { active } = req.query;
      const filter = {};
      if (active === "true") filter.isActive = true;
      const images = await SliderImage.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: images });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Delete image
  async deleteImage(req, res) {
    try {
      const { id } = req.params;
      const image = await SliderImage.findByIdAndDelete(id);
      if (!image) return res.status(404).json({ success: false, message: "Image not found" });
      return res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Toggle active status
  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const image = await SliderImage.findById(id);
      if (!image) return res.status(404).json({ success: false, message: "Image not found" });
      image.isActive = !image.isActive;
      await image.save();
      return res.status(200).json({ success: true, data: image });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },
};

export default sliderController;
