import { SeatType } from "@prisma/client";

interface RouteLike {
  frontSeatPrice: number;
  middleSeatPrice: number;
  backSeatPrice: number;
  parcelPrice: number;
}

/**
 * Calculates the price of a passenger trip.
 * Rule from spec: if passengerCount >= 2, the front seat is unavailable,
 * so pricing always falls back to middle/back seats in that case.
 */
export function calculatePassengerPrice(
  route: RouteLike,
  seatType: SeatType,
  passengerCount: number
): { price: number; seatType: SeatType } {
  let effectiveSeat = seatType;

  if (passengerCount >= 2 && effectiveSeat === "FRONT") {
    effectiveSeat = "MIDDLE";
  }

  const perSeatPrice =
    effectiveSeat === "FRONT"
      ? route.frontSeatPrice
      : effectiveSeat === "MIDDLE"
      ? route.middleSeatPrice
      : route.backSeatPrice;

  return { price: perSeatPrice * Math.max(1, passengerCount), seatType: effectiveSeat };
}

export function calculateParcelPrice(route: RouteLike): number {
  return route.parcelPrice;
}
