import { QuoteBuilder } from "../features/quote-builder/components/QuoteBuilder"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">

      {/* ========================================================
          TOP HEADER
      ======================================================== */}
      <header className="bg-white border-b border-[#dbe3ea]">
        <div className="max-w-6xl mx-auto px-2 py-3 flex items-center justify-between md:px-1 md:py-1">

          {/* Logo / Branding */}
          <div>
            <h1 className="text-[28px] md:text-[42px] font-bold tracking-tight text-[#1f2937]">
              Summit Materials
            </h1>

            <p className="text-[12px] md:text-[16px] text-[#64748b] tracking-[0.25em] uppercase">
              Sand • Gravel • Stone
            </p>
          </div>
        </div>

        {/* ========================================================
            NAVIGATION BAR
        ======================================================== */}
        <nav className="bg-[#1f2937] min-h-[48px] flex items-center border-t border-[#dbe3ea]">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <ul className="flex flex-wrap justify-center items-center text-white text-[12px] md:text-[14px] font-medium gap-1 py-2">
              {[
                "Materials",
                "Pricing",
                "Delivery",
                "Request a Quote",
              ].map((item, index) => (
                <li
                  key={item}
                  className={`px-[18px] py-[10px] rounded-full leading-none transition cursor-pointer ${
                    index === 3
                      ? "bg-[#2563eb] text-white"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* ========================================================
          QUOTE TOOL SECTION
      ======================================================== */}
      <section className="pt-8 pb-20 border-t border-[#dbe3ea] bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4">
          <QuoteBuilder />
        </div>
      </section>

    </main>
  )
}