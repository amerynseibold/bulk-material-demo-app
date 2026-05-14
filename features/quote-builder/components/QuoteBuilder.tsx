"use client"

import { useEffect, useState } from "react"
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api"
import type { Libraries } from "@react-google-maps/api"
import { pricingConfig } from "../config/pricingConfig"
import { calculateQuote } from "../utils/calculateQuote"
import type { QuoteFormData } from "../types"
import { supabase } from "../../../lib/supabaseClient"
import { colors } from "../config/colors"

const googleMapsLibraries: Libraries = ["places"]
const BUSINESS_ADDRESS = "891 E Princeton Dr, Princeton, TX 75407"

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 10)

  if (numbers.length < 4) return numbers

  if (numbers.length < 7) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
  }

  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`
}

// utils/formatCurrency.ts

export function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}


export function QuoteBuilder() {
  /* ========================================================
     FORM STATE
  ======================================================== */
  const [formData, setFormData] = useState<QuoteFormData>({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    streetAddress: "",
    city: "",
    state: "",
    zipcode: "",
    customerEmail: "",
    deliveryZip: "",
    materialId: "",
    quantity: "",
    deliveryNeeded: false,
    deliveryDistance: "",
    includeTax: true,
    marketingOptIn: false, 
  })

  const [addressAutocomplete, setAddressAutocomplete] = useState<any>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: googleMapsLibraries,
  })

  const [requestSubmitted, setRequestSubmitted] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ========================================================
     DELIVERY DISTANCE CALCULATION
  ======================================================== */
  const calculateDeliveryDistance = (destinationAddress: string) => {
    if (!window.google || destinationAddress.trim() === "") return

    const service = new window.google.maps.DistanceMatrixService()

    service.getDistanceMatrix(
      {
        origins: [BUSINESS_ADDRESS],
        destinations: [destinationAddress],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
      },
      (response, status) => {
        if (status !== "OK") return

        const result = response?.rows[0]?.elements[0]

        if (!result || result.status !== "OK") return

        const miles = result.distance.value / 1609.344

        setFormData((prev) => ({
          ...prev,
          deliveryDistance: Number(miles.toFixed(1)),
        }))
      }
    )
  }

  useEffect(() => {
    if (
      formData.deliveryNeeded &&
      typeof formData.customerAddress === "string" &&
      formData.customerAddress.trim() !== ""
    ) {
      calculateDeliveryDistance(formData.customerAddress)
    }
  }, [formData.customerAddress, formData.deliveryNeeded])

  useEffect(() => {
    if (requestSubmitted) {
      setRequestSubmitted(false)
    }
  }, [formData])

  /* ========================================================
     LIVE QUOTE CALCULATION
  ======================================================== */
  const quote = calculateQuote(formData)

  /* ========================================================
     DELIVERY RANGE WARNING
  ======================================================== */
  const showDeliveryRangeWarning =
    formData.deliveryNeeded &&
    formData.deliveryDistance !== "" &&
    Number(formData.deliveryDistance) > pricingConfig.maxDeliveryMiles

  /* ========================================================
     FORM VALIDATION
  ======================================================== */
  const phoneDigits = formData.customerPhone.replace(/\D/g, "")

  const hasRequiredCustomerInfo =
    formData.customerName.trim() !== "" && phoneDigits.length === 10

  const hasRequiredMaterialInfo =
    formData.materialId !== "" &&
    formData.quantity !== "" &&
    Number(formData.quantity) > 0

  const hasRequiredDeliveryInfo =
    !formData.deliveryNeeded ||
    (formData.customerAddress.trim() !== "" && formData.deliveryDistance !== "")

  const canRequestEstimate =
    hasRequiredCustomerInfo &&
    hasRequiredMaterialInfo &&
    hasRequiredDeliveryInfo &&
    !showDeliveryRangeWarning

  const MAX_YARDS_PER_LOAD = 14

  const estimatedTruckLoads =
    typeof formData.quantity === "number" && formData.quantity > 0
      ? Math.ceil(formData.quantity / MAX_YARDS_PER_LOAD)
      : 0

  /* ========================================================
    SUBMIT QUOTE REQUEST
  ======================================================== */
  const handleRequestEstimate = async () => {
    if (isSubmitting || requestSubmitted) return

    setIsSubmitting(true)

    const selectedMaterial = pricingConfig.materials.find(
      (material) => material.id === formData.materialId
    )

    console.log("Quote payload:", {
      quantity: Number(formData.quantity) || 0,
      estimated_truck_loads: Number(estimatedTruckLoads) || 0,
      delivery_distance: Number(formData.deliveryDistance) || 0,
      delivery_fee: Number(quote.deliveryFee) || 0,
      material_subtotal: Number(quote.materialSubtotal) || 0,
      tax: Number(quote.tax) || 0,
      total: Number(quote.total) || 0,
    })

    const { data, error } = await supabase
      .from("quote_requests")
      .insert([
        {
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail,
          customer_address: formData.customerAddress,
          street_address: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipcode,
          marketing_opt_in: formData.marketingOptIn,
          material_id: formData.materialId,
          material_name: selectedMaterial?.name || "",
          quantity: Number(formData.quantity) || 0,
          estimated_truck_loads: Number(estimatedTruckLoads) || 0,
          delivery_needed: formData.deliveryNeeded,
          delivery_distance: Number(formData.deliveryDistance) || 0,
          delivery_fee: Number(quote.deliveryFee) || 0,
          material_subtotal: Number(quote.materialSubtotal) || 0,
          tax: Number(quote.tax) || 0,
          total: Number(quote.total) || 0,

          status: "new",
        },
      ])
      .select()

      if (error) {
        console.log("Full Supabase error:", JSON.stringify(error, null, 2))

        setIsSubmitting(false)

        return
      }

      console.log("Inserted quote request:", data)

      setRequestSubmitted(true)

      await fetch("/api/send-quote-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          customerAddress: formData.customerAddress,

          materialName: selectedMaterial?.name || "",
          quantity: formData.quantity,
          total: quote.total,

          deliveryNeeded: formData.deliveryNeeded,
          deliveryDistance: Number(formData.deliveryDistance) || 0,
          deliveryFee: quote.deliveryFee,
          estimatedTruckLoads,
          requestDate: new Date().toLocaleString(),
        }),
      })

      setIsSubmitting(false)
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ========================================================
          ESTIMATE FORM
      ======================================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Get a fast estimate for sand, gravel, stone, and delivery.
        </h2>

        <div className="mt-6 space-y-6">
          {/* ========================================================
              DELIVERY METHOD
          ======================================================== */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Delivery Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRequestSubmitted(false)

                  setFormData((prev) => ({
                    ...prev,
                    deliveryNeeded: false,
                    customerAddress: "",
                    deliveryZip: "",
                    deliveryDistance: "",
                  }))
                }}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  !formData.deliveryNeeded
                    ? "border-[#25204f] bg-[#2563eb] text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Pickup</div>
                <div className="text-sm opacity-80">
                  Customer picks up material
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequestSubmitted(false)

                  setFormData((prev) => ({
                    ...prev,
                    deliveryNeeded: true,
                  }))
                }}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  formData.deliveryNeeded
                    ? "border-[#25204f] bg-[#2563eb] text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Delivery</div>
                <div className="text-sm opacity-80">
                  Deliver material to customer
                </div>
              </button>
            </div>
          </div>

          {/* ========================================================
              CONTACT INFORMATION
          ======================================================== */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Contact Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Enter customer name"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerName: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Phone
              </label>
              <input
                type="tel"
                placeholder="Customer phone"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerPhone: formatPhoneNumber(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter Email Address"
                value={formData.customerEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerEmail: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.marketingOptIn}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    marketingOptIn: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />

              <label className="text-sm text-gray-600">
                I agree to receive occasional promotions, updates, and special offers.
              </label>
            </div>
          </div>

          {/* ========================================================
              MATERIAL DETAILS
          ======================================================== */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Material Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <select
                value={formData.materialId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    materialId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              >
                <option value="">Select material</option>
                {["Sand", "Rock & Gravel", "Soil", "Other"].map((category) => (
                  <optgroup key={category} label={category}>
                    {pricingConfig.materials
                      .filter((material) => material.category === category)
                      .map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name} - ${material.price}/{material.unit}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Cubic Yards)
              </label>

              <input
                type="number"
                placeholder="Quantity"
                min={1}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity:
                      e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />

              {/* Delivery Load Warning */}
              {formData.deliveryNeeded &&
                typeof formData.quantity === "number" &&
                formData.quantity > 14 && (
                  <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800 font-medium">
                      Large Order Notice
                    </p>

                    <p className="text-sm text-amber-700 mt-1">
                      Orders over 14 cubic yards may require multiple truck loads
                      and additional delivery charges.
                    </p>
                  </div>
                )}

                {!formData.deliveryNeeded &&
                  typeof formData.quantity === "number" &&
                  formData.quantity > 14 && (
                    <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
                      <p className="text-sm font-medium text-amber-800">
                        Large Pickup Order
                      </p>

                      <p className="mt-1 text-sm text-amber-700">
                        Large pickup orders may require multiple trips or a suitable trailer capacity.
                      </p>
                    </div>
                )}

                {/* Estimated Truck Loads */}
                {formData.deliveryNeeded &&
                  estimatedTruckLoads >= 2 && (
                  <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-800">
                      Estimated Truck Loads
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      This order may require{" "}
                      <span className="font-semibold text-gray-900">
                        {estimatedTruckLoads}
                      </span>{" "}
                      truck load{estimatedTruckLoads > 1 ? "s" : ""}.
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* ========================================================
              DELIVERY INFORMATION
          ======================================================== */}
          {formData.deliveryNeeded && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Delivery Information
              </h3>

              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) =>
                    setAddressAutocomplete(autocomplete)
                  }
                  onPlaceChanged={() => {
                    const place = addressAutocomplete?.getPlace()
                    const selectedAddress = place?.formatted_address || ""

                    const selectedZip =
                      place?.address_components?.find((component: any) =>
                        component.types.includes("postal_code")
                      )?.long_name || ""

                    const streetNumber =
                      place?.address_components?.find((component: any) =>
                        component.types.includes("street_number")
                      )?.long_name || ""

                    const route =
                      place?.address_components?.find((component: any) =>
                        component.types.includes("route")
                      )?.long_name || ""

                    const selectedCity =
                      place?.address_components?.find((component: any) =>
                        component.types.includes("locality")
                      )?.long_name || ""

                    const selectedState =
                      place?.address_components?.find((component: any) =>
                        component.types.includes("administrative_area_level_1")
                      )?.short_name || ""

                    const streetAddress =
                      `${streetNumber} ${route}`.trim()

                    setFormData((prev) => ({
                      ...prev,
                      customerAddress: selectedAddress,
                      streetAddress,
                      city: selectedCity,
                      state: selectedState,
                      zipcode: selectedZip,
                      deliveryZip: selectedZip,
                      deliveryDistance: "",
                    }))

                    if (selectedAddress.trim() !== "") {
                      calculateDeliveryDistance(selectedAddress)
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder="Start typing delivery address"
                    value={formData.customerAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerAddress: e.target.value,
                        deliveryZip: "",
                        deliveryDistance: "",
                      }))
                    }
                    onBlur={() => {
                      if (formData.customerAddress.trim().length > 8) {
                        calculateDeliveryDistance(formData.customerAddress)
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  placeholder="Enter delivery address"
                  value={formData.customerAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerAddress: e.target.value,
                      deliveryZip: "",
                      deliveryDistance: "",
                    }))
                  }
                  onBlur={() => {
                    if (formData.customerAddress.trim().length > 8) {
                      calculateDeliveryDistance(formData.customerAddress)
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
                />
              )}
            </div>
          )}

          {showDeliveryRangeWarning && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {pricingConfig.outsideDeliveryMessage}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          ESTIMATE OUTPUT
      ======================================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 h-fit lg:sticky lg:top-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Estimate Summary
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Estimated material and delivery pricing
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Estimate
          </span>
        </div>

        <div className="mt-6 space-y-3 text-gray-700">
          <div className="flex justify-between">
            <span>Material subtotal</span>
            <span>{formatCurrency(quote.materialSubtotal)}</span>
          </div>

          {formData.deliveryNeeded && (
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{formatCurrency(quote.deliveryFee)}</span>
            </div>
          )}

          {formData.deliveryNeeded &&
            formData.deliveryDistance !== "" && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Estimated delivery distance</span>
                <span>{formData.deliveryDistance} miles</span>
              </div>
          )}

          <div className="flex justify-between">
            <span>Tax (8.25%)</span>
            <span>{formatCurrency(quote.tax)}</span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="bg-[#2563eb] rounded-2xl p-6 text-white">
            <div className="text-sm uppercase tracking-wide text-gray-400">
              Estimated Total
            </div>

            <div className="text-4xl font-bold mt-2">
              {formatCurrency(quote.total)}
            </div>

            <p className="text-sm text-gray-400 mt-3">
              Pricing shown is an estimate and may vary based on delivery
              location, material availability, and final load requirements.
            </p>
          </div>
        </div>

        <button
          disabled={!canRequestEstimate || isSubmitting || requestSubmitted}
          type="button"
          onClick={handleRequestEstimate}
          className={`mt-6 mx-auto block w-auto rounded-xl px-10 py-4 text-white font-semibold transition ${
            canRequestEstimate
              ? "bg-[#2563eb] hover:bg-[#1d4ed8]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting
            ? "Submitting..."
            : requestSubmitted
            ? "Request Received"
            : "Request This Estimate"}
        </button>
        {requestSubmitted && (
          <div className="mt-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            Estimate request received. A team member will contact you to confirm pricing, availability, and delivery details.
          </div>
        )}
      </div>
    </section>
  )
}