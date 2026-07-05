import axios from "axios";

interface OrderTelegramPayload {
  type: "PASSENGER" | "PARCEL";
  routeName: string;
  name: string;
  phone: string;
  seatType?: string | null;
  passengerCount?: number | null;
  luggage?: boolean | null;
  departureTime?: string | null;
  price: number;
  latitude?: number | null;
  longitude?: number | null;
}

const seatLabels: Record<string, string> = {
  FRONT: "Old o'rindiq",
  MIDDLE: "O'rta o'rindiq",
  BACK: "Orqa o'rindiq",
};

export async function sendOrderToTelegram(
  order: OrderTelegramPayload
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[telegram] Bot token yoki chat id topilmadi."
    );
    return;
  }

  const isPassenger = order.type === "PASSENGER";

  let text = `
🚖 <b>YANGI ZAKAZ QABUL QILINDI</b>

━━━━━━━━━━━━━━━
📦 <b>Turi:</b> ${
    isPassenger ? "Yo'lovchi" : "Pochta jo'natmasi"
  }
🛣 <b>Yo'nalish:</b> ${order.routeName}
👤 <b>Mijoz:</b> ${order.name}
📞 <b>Telefon:</b> <code>${order.phone}</code>
`;

  if (isPassenger) {
    text += `
💺 <b>O'rindiq:</b> ${
      seatLabels[order.seatType || "BACK"]
    }
👥 <b>Yo'lovchilar soni:</b> ${
      order.passengerCount ?? 1
    }
🧳 <b>Yuk:</b> ${
      order.luggage ? "Bor" : "Yo'q"
    }
🕒 <b>Jo'nash vaqti:</b> ${
      order.departureTime || "-"
    }
`;
  }

  text += `
💰 <b>Narxi:</b> <b>${order.price.toLocaleString(
    "ru-RU"
  )} so'm</b>
━━━━━━━━━━━━━━━
`;

  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };

  if (order.latitude && order.longitude) {
    payload.reply_markup = {
      inline_keyboard: [
        [
          {
            text: "📍 Lokatsiyani ochish",
            url: `https://maps.google.com/?q=${order.latitude},${order.longitude}`,
          },
        ],
      ],
    };
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      payload
    );
  } catch (err) {
    console.error(
      "[telegram] Xabar yuborishda xatolik:",
      (err as Error).message
    );
  }
}