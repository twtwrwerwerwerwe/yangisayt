import { Router } from "express";
import prisma from "../utils/prisma";
import { requireAuth } from "../middleware/auth";
import { uploadRouteImage } from "../middleware/upload";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.all === "true";
    const promotions = await prisma.promotion.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(promotions);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, uploadRouteImage, async (req, res, next) => {
  try {
    const { titleUz, titleRu, titleEn, descriptionUz, descriptionRu, descriptionEn } = req.body;
    const promotion = await prisma.promotion.create({
      data: {
        titleUz,
        titleRu,
        titleEn,
        descriptionUz,
        descriptionRu,
        descriptionEn,
        image: req.file ? `/uploads/routes/${req.file.filename}` : "",
      },
    });
    res.status(201).json(promotion);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, uploadRouteImage, async (req, res, next) => {
  try {
    const { titleUz, titleRu, titleEn, descriptionUz, descriptionRu, descriptionEn, isActive } =
      req.body;
    const data: any = {
      titleUz,
      titleRu,
      titleEn,
      descriptionUz,
      descriptionRu,
      descriptionEn,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : undefined,
    };
    if (req.file) data.image = `/uploads/routes/${req.file.filename}`;
    const promotion = await prisma.promotion.update({ where: { id: req.params.id }, data });
    res.json(promotion);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await prisma.promotion.delete({ where: { id: req.params.id } });
    res.json({ message: "Aksiya o'chirildi" });
  } catch (err) {
    next(err);
  }
});

export default router;
