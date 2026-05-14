export type Material = {
  id: string
  name: string
  category: string
  unit: string
  price: number
}

export type QuoteFormData = {
  customerName: string
  customerPhone: string
  customerEmail: string
  customerAddress: string
  streetAddress: string
  city: string
  state: string
  zipcode: string

  materialId: string
  quantity: number | ""

  deliveryNeeded: boolean
  deliveryZip: string
  deliveryDistance: number | ""
  includeTax: boolean

  marketingOptIn: boolean
}

export type QuoteResult = {
  materialSubtotal: number
  deliveryFee: number
  tax: number
  total: number
}