import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import fs from "fs";

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");

function ensureDir(dir: string) {
  const full = path.join(UPLOAD_ROOT, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  return full;
}

function makeStorage(subfolder: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, ensureDir(subfolder));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuid()}${ext}`);
    },
  });
}

const imageFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Faqat rasm fayllarga ruxsat berilgan"));
};

const receiptFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Faqat rasm yoki PDF fayllarga ruxsat berilgan"));
  }
};

const maxSize = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

export const uploadRouteImage = multer({
  storage: makeStorage("routes"),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
}).single("image");

export const uploadHeroImage = multer({
  storage: makeStorage("hero"),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
}).single("image");

export const uploadDriverPhoto = multer({
  storage: makeStorage("drivers"),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
}).single("photo");

export const uploadCarPhotos = multer({
  storage: makeStorage("cars"),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
}).array("carPhotos", 3);

export const uploadReceipt = multer({
  storage: makeStorage("receipts"),
  fileFilter: receiptFilter,
  limits: { fileSize: maxSize },
}).fields([
  { name: "receiptImage", maxCount: 1 },
  { name: "receiptPdf", maxCount: 1 },
]);
