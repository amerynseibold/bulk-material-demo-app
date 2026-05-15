"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

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
    setLastUpdated(new Date().toLocaleString())
    setIsLoading(false)
  }

  const formatCurrency = (value: number | string | null) =>
    Number(value || 0).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    })

  const totalRequests = quoteRequests.length
  const newRequests = quoteRequests.filter((r) => r.status === "new").length
  const quotedRequests = quoteRequests.filter((r) => r.status === "quoted").length
  const completedRequests = quoteRequests.filter((r) => r.status === "completed").length
  const estimatedRevenue = quoteRequests.reduce(
    (sum, request) => sum + Number(request.total || 0),
    0
  )

  const getStatusClasses = (status: string) => {
    if (status === "completed") {
      return "bg-green-100 text-green-700"
    }

    if (status === "quoted") {
      return "bg-blue-100 text-blue-700"
    }

    return "bg-yellow-100 text-yellow-800"
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin()
            }}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quote Requests
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Review recent pickup and delivery quote requests.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            {lastUpdated && (
              <p className="text-xs text-gray-500">
                Last updated: {lastUpdated}
              </p>
            )}

            <button
              type="button"
              onClick={fetchQuoteRequests}
              className="rounded-lg bg-[#25204f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d193f]"
            >
              Refresh
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{totalRequests}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">New</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{newRequests}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Quoted</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{quotedRequests}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{completedRequests}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Estimated Total</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(estimatedRevenue)}
            </p>
          </div>
        </section>

        {isLoading ? (
          <p className="mt-6 text-gray-600">Loading quote requests...</p>
        ) : quoteRequests.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-gray-900">No quote requests yet</p>
            <p className="mt-1 text-sm text-gray-600">
              Submitted requests will appear here.
            </p>
          </div>
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
                      {formatCurrency(request.total)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
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