import { Router } from "express";
import prisma from "../utils/prisma";
import { requireAuth } from "../middleware/auth";
import { calculatePassengerPrice, calculateParcelPrice } from "../utils/pricing";
import { sendOrderToTelegram } from "../services/telegram";

const router = Router();

// Live price preview while the user fills the order form
router.post("/price-preview", async (req, res, next) => {
  try {
    const { type, routeId, seatType, passengerCount } = req.body;
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) return res.status(404).json({ message: "Marshrut topilmadi" });

    if (type === "PARCEL") {
      return res.json({ price: calculateParcelPrice(route) });
    }

    const count = Number(passengerCount) || 1;
    const result = calculatePassengerPrice(route, seatType, count);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create order -> forward to Telegram -> delete from DB to avoid overflow
router.post("/", async (req, res, next) => {
  try {
    const {
      type,
      routeId,
      seatType,
      passengerCount,
      luggage,
      departureTime,
      name,
      phone,
      latitude,
      longitude,
    } = req.body;

    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) return res.status(404).json({ message: "Marshrut topilmadi" });

    let price: number;
    let finalSeatType: string | undefined;

    if (type === "PARCEL") {
      price = calculateParcelPrice(route);
    } else {
      const count = Number(passengerCount) || 1;
      const result = calculatePassengerPrice(route, seatType, count);
      price = result.price;
      finalSeatType = result.seatType;
    }

    const order = await prisma.order.create({
      data: {
        type,
        routeId,
        seatType: type === "PASSENGER" ? (finalSeatType as any) : null,
        passengerCount: type === "PASSENGER" ? Number(passengerCount) : null,
        luggage: type === "PASSENGER" ? Boolean(luggage) : null,
        departureTime: type === "PASSENGER" ? departureTime : null,
        name,
        phone,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        price,
      },
    });

    await prisma.notification.create({
      data: {
        titleUz: `Yangi zakaz: ${name} (${route.nameUz})`,
        titleRu: `Новый заказ: ${name} (${route.nameRu})`,
        titleEn: `New order: ${name} (${route.nameEn})`,
      },
    });

    // Fire-and-forget to Telegram, then remove from DB per spec (avoid overflow)
    await sendOrderToTelegram({
      type: order.type,
      routeName: route.nameUz,
      name: order.name,
      phone: order.phone,
      seatType: order.seatType,
      passengerCount: order.passengerCount,
      luggage: order.luggage,
      departureTime: order.departureTime,
      price: order.price,
      latitude: order.latitude,
      longitude: order.longitude,
    });

    const responsePayload = { ...order };
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.counter.upsert({
      where: { id: "global" },
      update: { totalOrders: { increment: 1 } },
      create: { id: "global", totalOrders: 1 },
    });

    res.status(201).json({
      order: responsePayload,
      message: "Zakazingiz qabul qilindi.",
    });
  } catch (err) {
    next(err);
  }
});

// Admin: recent orders count comes from stats endpoint since orders are deleted after forwarding.
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

export default router;
