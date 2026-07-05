import { Router } from "express";
import prisma from "../utils/prisma";
import { requireAuth } from "../middleware/auth";
import { uploadHeroImage } from "../middleware/upload";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.all === "true";
    const slides = await prisma.heroSlide.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { order: "asc" },
    });
    res.json(slides);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, uploadHeroImage, async (req, res, next) => {
  try {
    const { titleUz, titleRu, titleEn, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Slayd uchun rasm yuklash shart" });
    }

    const slide = await prisma.heroSlide.create({
      data: {
        titleUz,
        titleRu,
        titleEn,
        image: `/uploads/hero/${req.file.filename}`,
        order: order ? Number(order) : 0,
      },
    });

    res.status(201).json(slide);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, uploadHeroImage, async (req, res, next) => {
  try {
    const { titleUz, titleRu, titleEn, order, isActive } = req.body;

    const data: any = {
      titleUz,
      titleRu,
      titleEn,
      order: order !== undefined ? Number(order) : undefined,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : undefined,
    };

    if (req.file) data.image = `/uploads/hero/${req.file.filename}`;

    const slide = await prisma.heroSlide.update({ where: { id: req.params.id }, data });
    res.json(slide);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await prisma.heroSlide.delete({ where: { id: req.params.id } });
    res.json({ message: "Slayd o'chirildi" });
  } catch (err) {
    next(err);
  }
});

export default router;
