import { Router } from "express";
import prisma from "../utils/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const [totalRoutes, totalDrivers, totalApplications, totalPromotions, counter, pendingApplications, totalHeroSlides] =
      await Promise.all([
        prisma.route.count(),
        prisma.driver.count(),
        prisma.driverApplication.count(),
        prisma.promotion.count(),
        prisma.counter.findUnique({ where: { id: "global" } }),
        prisma.driverApplication.count({ where: { status: "PENDING" } }),
        prisma.heroSlide.count(),
      ]);

    res.json({
      totalRoutes,
      totalDrivers,
      totalOrders: counter?.totalOrders || 0,
      totalApplications,
      totalPromotions,
      pendingApplications,
      totalHeroSlides,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
