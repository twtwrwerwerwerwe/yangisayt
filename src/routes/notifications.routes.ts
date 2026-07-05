import { Router } from "express";
import prisma from "../utils/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

router.post("/read-all", requireAuth, async (_req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
    res.json({ message: "Barchasi o'qilgan deb belgilandi" });
  } catch (err) {
    next(err);
  }
});

export default router;
