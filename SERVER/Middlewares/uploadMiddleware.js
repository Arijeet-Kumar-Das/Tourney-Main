import multer from "multer";
import path from "path";
import fs from "fs";

// ensure tmp folder exists
const ensureTmp = () => {
  if (!fs.existsSync("./tmp")) {
    fs.mkdirSync("./tmp");
  }
};

// Store file temporarily in /tmp before Cloudinary upload
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    ensureTmp();
    cb(null, "./tmp");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.fieldname}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

export default upload;
