import { pricingConfig } from "../config/pricingConfig"
import type { QuoteFormData, QuoteResult } from "../types"

export function calculateQuote(formData: QuoteFormData): QuoteResult {
  const selectedMaterial = pricingConfig.materials.find(
    (material) => material.id === formData.materialId
  )

  const quantity = Number(formData.quantity) || 0

  const MAX_YARDS_PER_LOAD = 14

  const estimatedTruckLoads =
    quantity > 0 ? Math.ceil(quantity / MAX_YARDS_PER_LOAD) : 1

  const materialSubtotal = selectedMaterial
    ? selectedMaterial.price * quantity
    : 0

  const deliveryDistance =
    formData.deliveryDistance === "" ? null : Number(formData.deliveryDistance)

  let singleLoadDeliveryFee = 0

  if (formData.deliveryNeeded && deliveryDistance !== null) {
    const matchingTier = pricingConfig.deliveryTiers.find(
      (tier) => deliveryDistance <= tier.maxMiles
    )

    singleLoadDeliveryFee = matchingTier ? matchingTier.fee : 0
  }

  const deliveryFee = formData.deliveryNeeded
    ? singleLoadDeliveryFee * estimatedTruckLoads
    : 0

  const taxableSubtotal = materialSubtotal + deliveryFee

  const tax = formData.includeTax
    ? taxableSubtotal * pricingConfig.taxRate
    : 0

  const total = taxableSubtotal + tax

  return {
    materialSubtotal,
    deliveryFee,
    tax,
    total,
  }
}