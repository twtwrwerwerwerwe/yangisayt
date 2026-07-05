import { Router } from "express";
import prisma from "../utils/prisma";
import { requireAuth } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";

const router = Router();

// Combined multi-field upload: 3 car photos + receipt image/pdf, all in one submit (step 1+2 merged on submit)
const carsDir = path.join(__dirname, "..", "..", "uploads", "cars");
if (!fs.existsSync(carsDir)) fs.mkdirSync(carsDir, { recursive: true });

const combinedUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, carsDir),
    filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
  }),
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    if (ok) cb(null, true);
    else cb(new Error("Ruxsat etilmagan fayl turi"));
  },
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
}).fields([
  { name: "carPhotos", maxCount: 3 },
  { name: "receiptImage", maxCount: 1 },
  { name: "receiptPdf", maxCount: 1 },
]);

// Public: submit application (step 3 final submit)
router.post("/", combinedUpload, async (req, res, next) => {
  try {
    const { fullName, carName, experience, phone } = req.body;
    const files = req.files as { [field: string]: Express.Multer.File[] };

    const carPhotos = (files.carPhotos || []).map((f) => `/uploads/cars/${f.filename}`);
    const receiptImage = files.receiptImage?.[0]
      ? `/uploads/cars/${files.receiptImage[0].filename}`
      : null;
    const receiptPdf = files.receiptPdf?.[0] ? `/uploads/cars/${files.receiptPdf[0].filename}` : null;

    if (!receiptImage && !receiptPdf) {
      return res.status(400).json({ message: "To'lov kvitansiyasini yuklash majburiy" });
    }

    const application = await prisma.driverApplication.create({
      data: {
        fullName,
        carName,
        experience: Number(experience),
        phone,
        carPhotos,
        receiptImage,
        receiptPdf,
      },
    });

    await prisma.notification.create({
      data: {
        titleUz: `Yangi haydovchi arizasi: ${fullName}`,
        titleRu: `Новая заявка водителя: ${fullName}`,
        titleEn: `New driver application: ${fullName}`,
      },
    });

    res.status(201).json({
      application,
      message: "Arizangiz adminga yuborildi.",
      supportPhone: "+99895287166",
    });
  } catch (err) {
    next(err);
  }
});

// Admin: list all applications
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const applications = await prisma.driverApplication.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// Admin: approve -> creates a Driver record
router.post("/:id/approve", requireAuth, async (req, res, next) => {
  try {
    const application = await prisma.driverApplication.findUnique({ where: { id: req.params.id } });
    if (!application) return res.status(404).json({ message: "Ariza topilmadi" });

    const [, driver] = await prisma.$transaction([
      prisma.driverApplication.update({
        where: { id: application.id },
        data: { status: "APPROVED" },
      }),
      prisma.driver.create({
        data: {
          fullName: application.fullName,
          carName: application.carName,
          experience: application.experience,
          phone: application.phone,
          photo: application.carPhotos[0] || "",
          applicationId: application.id,
        },
      }),
    ]);

    res.json({ message: "Ariza tasdiqlandi va haydovchi qo'shildi", driver });
  } catch (err) {
    next(err);
  }
});

// Admin: reject
router.post("/:id/reject", requireAuth, async (req, res, next) => {
  try {
    const application = await prisma.driverApplication.update({
      where: { id: req.params.id },
      data: { status: "REJECTED" },
    });
    res.json({ message: "Ariza rad etildi", application });
  } catch (err) {
    next(err);
  }
});

export default router;
