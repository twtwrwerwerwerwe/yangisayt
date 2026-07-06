import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "akramjonov777";
  const password = process.env.ADMIN_PASSWORD || "952871666";
  const hashed = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    update: { password: hashed },
    create: { username, password: hashed },
  });

  await prisma.counter.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", totalOrders: 0 },
  });

  const heroSlidesData = [
    {
      titleUz: "Toshkent - Samarqand",
      titleRu: "Ташкент - Самарканд",
      titleEn: "Tashkent - Samarkand",
      image: "https://images.unsplash.com/photo-1591802370680-e6f6d3b8c0c8?q=80&w=1600&auto=format&fit=crop",
      order: 0,
    },
    {
      titleUz: "Toshkent - Buxoro",
      titleRu: "Ташкент - Бухара",
      titleEn: "Tashkent - Bukhara",
      image: "https://images.unsplash.com/photo-1596395463232-c65de10a5b23?q=80&w=1600&auto=format&fit=crop",
      order: 1,
    },
    {
      titleUz: "Toshkent - Farg'ona",
      titleRu: "Ташкент - Фергана",
      titleEn: "Tashkent - Fergana",
      image: "https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?q=80&w=1600&auto=format&fit=crop",
      order: 2,
    },
  ];

  for (const s of heroSlidesData) {
    const existing = await prisma.heroSlide.findFirst({ where: { titleUz: s.titleUz } });
    if (!existing) await prisma.heroSlide.create({ data: s });
  }

  const routesData = [
    {
      nameUz: "Toshkent - Samarqand",
      nameRu: "Ташкент - Самарканд",
      nameEn: "Tashkent - Samarkand",
      travelTime: "3 soat 30 daqiqa",
      frontSeatPrice: 120000,
      middleSeatPrice: 100000,
      backSeatPrice: 90000,
      parcelPrice: 50000,
    },
    {
      nameUz: "Toshkent - Buxoro",
      nameRu: "Ташкент - Бухара",
      nameEn: "Tashkent - Bukhara",
      travelTime: "6 soat",
      frontSeatPrice: 180000,
      middleSeatPrice: 150000,
      backSeatPrice: 140000,
      parcelPrice: 70000,
    },
    {
      nameUz: "Toshkent - Farg'ona",
      nameRu: "Ташкент - Фергана",
      nameEn: "Tashkent - Fergana",
      travelTime: "4 soat",
      frontSeatPrice: 100000,
      middleSeatPrice: 85000,
      backSeatPrice: 75000,
      parcelPrice: 40000,
    },
    {
      nameUz: "Toshkent - Andijon",
      nameRu: "Ташкент - Андижан",
      nameEn: "Tashkent - Andijan",
      travelTime: "4 soat 30 daqiqa",
      frontSeatPrice: 110000,
      middleSeatPrice: 95000,
      backSeatPrice: 85000,
      parcelPrice: 45000,
    },
  ];

  for (const r of routesData) {
    const existing = await prisma.route.findFirst({ where: { nameUz: r.nameUz } });
    if (!existing) await prisma.route.create({ data: r });
  }

  const driversData = [
    {
      fullName: "Sardor Aliyev",
      photo: "/uploads/drivers/sample-driver-1.jpg",
      carName: "Chevrolet Cobalt",
      experience: 5,
      phone: "+998901234567",
      rating: 5,
    },
    {
      fullName: "Jasur Karimov",
      photo: "/uploads/drivers/sample-driver-2.jpg",
      carName: "Chevrolet Malibu",
      experience: 8,
      phone: "+998901234568",
      rating: 4,
    },
    {
      fullName: "Bekzod Yusupov",
      photo: "/uploads/drivers/sample-driver-3.jpg",
      carName: "Chevrolet Nexia",
      experience: 3,
      phone: "+998901234569",
      rating: 5,
    },
  ];

  for (const d of driversData) {
    const existing = await prisma.driver.findFirst({ where: { fullName: d.fullName } });
    if (!existing) await prisma.driver.create({ data: d });
  }

  const promoData = {
    titleUz: "Birinchi buyurtmaga 10% chegirma",
    titleRu: "Скидка 10% на первый заказ",
    titleEn: "10% off your first order",
    descriptionUz: "Ilovadan birinchi marta foydalanuvchilar uchun maxsus taklif.",
    descriptionRu: "Специальное предложение для новых пользователей.",
    descriptionEn: "A special offer for first-time users.",
    image: "/uploads/routes/sample-promo.jpg",
  };
  const existingPromo = await prisma.promotion.findFirst({ where: { titleUz: promoData.titleUz } });
  if (!existingPromo) await prisma.promotion.create({ data: promoData });

  console.log("Seed muvaffaqiyatli yakunlandi.");
  console.log(`Admin login: ${username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
