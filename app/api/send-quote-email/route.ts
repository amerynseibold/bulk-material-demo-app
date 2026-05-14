import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    materialName,
    quantity,
    total,
    deliveryNeeded,
    deliveryDistance,
    deliveryFee,
    estimatedTruckLoads,
    requestDate,
    } = body

    const data = await resend.emails.send({
      from: "quotes@auxiliumbusiness.com",
      to: process.env.QUOTE_NOTIFICATION_EMAIL || "",
      subject: "New Quote Request",
      html: `
        <h2>New Quote Request</h2>

        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Phone:</strong> ${customerPhone}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Address:</strong> ${customerAddress}</p>

        <hr />

        <p><strong>Request Date:</strong> ${requestDate}</p>
        <p><strong>Request Type:</strong> ${deliveryNeeded ? "Delivery" : "Pickup"}</p>

        <p><strong>Material:</strong> ${materialName}</p>
        <p><strong>Quantity:</strong> ${quantity} cubic yards</p>

        ${
        deliveryNeeded
            ? `
            <p><strong>Estimated Truck Loads:</strong> ${estimatedTruckLoads}</p>
            <p><strong>Delivery Distance:</strong> ${Number(deliveryDistance).toFixed(1)} miles</p>
            <p><strong>Delivery Fee:</strong> $${Number(deliveryFee).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                                })}</p>
            `
            : `
            <p><strong>Pickup Note:</strong> Customer selected pickup.</p>
            `
        }

        <p><strong>Total Estimate:</strong> $${Number(total).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                                })}</p>
      `,
    })

    return Response.json(data)
  } catch (error) {
    console.error("Email send error:", error)

    return Response.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}