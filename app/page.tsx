//app/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'MedLab CRUD — Home',
}

export default function Home() {
  const pages = [
    {
      href: '/uom',
      label: 'Units of Measure',
      desc: 'Manage UOM records (mg/dL, mmol/L, g/dL…)',
      icon: '⚗️',
    },
    {
      href: '/testcategories',
      label: 'Test Categories',
      desc: 'Manage test category records (BCT, CBC, LFT…)',
      icon: '🗂️',
    },
    {
      href: '/medicaltests',
      label: 'Medical Tests',
      desc: 'Manage medical tests with category & unit names',
      icon: '🧪',
    },
  ]

  return (
    <main className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center p-10 font-sans">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
          MedLab CRUDD
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Simple CRUD management for medical test data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
        {pages.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="text-3xl mb-3">{p.icon}</div>
            <h2 className="text-slate-800 font-semibold text-base group-hover:text-blue-600 transition-colors">
              {p.label}
            </h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{p.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}