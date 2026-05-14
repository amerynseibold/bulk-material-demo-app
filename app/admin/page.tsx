"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsUnlocked(true)
      fetchQuoteRequests()
    } else {
      alert("Incorrect password")
    }
  }
  const fetchQuoteRequests = async () => {
  setIsLoading(true)

  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching quote requests:", error)
    setIsLoading(false)
    return
  }

  setQuoteRequests(data || [])
  setIsLoading(false)
}

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Login
          </h1>

          <p className="text-sm text-gray-600 mb-6">
            Enter the internal password to view quote requests.
          </p>

          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 mb-4"
          />

          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-lg bg-[#25204f] px-4 py-3 font-semibold text-white hover:bg-[#1d193f]"
          >
            View Requests
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Quote Requests
        </h1>

        {isLoading ? (
            <p className="mt-6 text-gray-600">Loading quote requests...</p>
            ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    </tr>
                </thead>

                <tbody>
                    {quoteRequests.map((request) => (
                    <tr key={request.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-700">
                        {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                        {request.customer_name}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                        {request.customer_phone}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                        {request.material_name}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                        {request.quantity}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                        {request.delivery_needed ? "Delivery" : "Pickup"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                        ${Number(request.total).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                        {request.status}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
      </div>
    </main>
  )
}