import { Router } from "express";
import prisma from "../utils/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Public: list active routes
router.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.all === "true";
    const routes = await prisma.route.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(routes);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const route = await prisma.route.findUnique({ where: { id: req.params.id } });
    if (!route) return res.status(404).json({ message: "Marshrut topilmadi" });
    res.json(route);
  } catch (err) {
    next(err);
  }
});

// Admin: create
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { nameUz, nameRu, nameEn, travelTime, frontSeatPrice, middleSeatPrice, backSeatPrice, parcelPrice } =
      req.body;

    const route = await prisma.route.create({
      data: {
        nameUz,
        nameRu,
        nameEn,
        travelTime,
        frontSeatPrice: Number(frontSeatPrice),
        middleSeatPrice: Number(middleSeatPrice),
        backSeatPrice: Number(backSeatPrice),
        parcelPrice: Number(parcelPrice),
      },
    });

    res.status(201).json(route);
  } catch (err) {
    next(err);
  }
});

// Admin: update
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const {
      nameUz,
      nameRu,
      nameEn,
      travelTime,
      frontSeatPrice,
      middleSeatPrice,
      backSeatPrice,
      parcelPrice,
      isActive,
    } = req.body;

    const data: any = {
      nameUz,
      nameRu,
      nameEn,
      travelTime,
      frontSeatPrice: frontSeatPrice !== undefined ? Number(frontSeatPrice) : undefined,
      middleSeatPrice: middleSeatPrice !== undefined ? Number(middleSeatPrice) : undefined,
      backSeatPrice: backSeatPrice !== undefined ? Number(backSeatPrice) : undefined,
      parcelPrice: parcelPrice !== undefined ? Number(parcelPrice) : undefined,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : undefined,
    };

    const route = await prisma.route.update({ where: { id: req.params.id }, data });
    res.json(route);
  } catch (err) {
    next(err);
  }
});

// Admin: delete
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await prisma.route.delete({ where: { id: req.params.id } });
    res.json({ message: "Marshrut o'chirildi" });
  } catch (err) {
    next(err);
  }
});

export default router;
