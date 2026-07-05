import { Router } from "express";
import prisma from "../utils/prisma";
import { requireAuth } from "../middleware/auth";
import { uploadDriverPhoto } from "../middleware/upload";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.all === "true";
    const drivers = await prisma.driver.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(drivers);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, uploadDriverPhoto, async (req, res, next) => {
  try {
    const { fullName, carName, experience, phone } = req.body;
    const driver = await prisma.driver.create({
      data: {
        fullName,
        carName,
        experience: Number(experience),
        phone,
        photo: req.file ? `/uploads/drivers/${req.file.filename}` : "",
      },
    });
    res.status(201).json(driver);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, uploadDriverPhoto, async (req, res, next) => {
  try {
    const { fullName, carName, experience, phone, isActive } = req.body;
    const data: any = {
      fullName,
      carName,
      experience: experience !== undefined ? Number(experience) : undefined,
      phone,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : undefined,
    };
    if (req.file) data.photo = `/uploads/drivers/${req.file.filename}`;

    const driver = await prisma.driver.update({ where: { id: req.params.id }, data });
    res.json(driver);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ message: "Haydovchi o'chirildi" });
  } catch (err) {
    next(err);
  }
});

export default router;
