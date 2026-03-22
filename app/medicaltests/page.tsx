'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

// ── Types ─────────────────────────────────────────────────────────────────────

type MedicalTest = {
  id: number
  name: string
  description: string | null
  normalmin: number | null
  normalmax: number | null
  // Supabase relational aliases
  uom: { id: number; name: string } | null
  testcategories: { id: number; name: string } | null
}

type UOM = { id: number; name: string }
type Category = { id: number; name: string }

type FormData = {
  name: string
  description: string
  iduom: string
  idcategory: string
  normalmin: string
  normalmax: string
}

const emptyForm = (): FormData => ({
  name: '',
  description: '',
  iduom: '',
  idcategory: '',
  normalmin: '',
  normalmax: '',
})

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MedicalTestsPage() {
  const [rows, setRows] = useState<MedicalTest[]>([])
  const [uomList, setUomList] = useState<UOM[]>([])
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { document.title = 'Medical Tests — MedLab CRUD' }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    setFetching(true)
    // JOIN: Supabase resolves foreign keys to nested objects
    // Equivalent to:
    //   SELECT mt.*, tc.name AS category, u.name AS unit
    //   FROM medicaltests mt
    //   JOIN testcategories tc ON mt.idcategory = tc.id
    //   JOIN uom u ON mt.iduom = u.id
    const { data, error } = await supabase
      .from('medicaltests')
      .select(`
        id, name, description, normalmin, normalmax,
        uom:iduom ( id, name ),
        testcategories:idcategory ( id, name )
      `)
      .order('id')

    if (error) setError(error.message)
    else setRows((data as unknown as MedicalTest[]) ?? [])
    setFetching(false)
  }

  const fetchDropdowns = async () => {
    const [{ data: uomData }, { data: catData }] = await Promise.all([
      supabase.from('uom').select('id, name').order('name'),
      supabase.from('testcategories').select('id, name').order('name'),
    ])
    setUomList(uomData ?? [])
    setCategoryList(catData ?? [])
  }

  useEffect(() => {
    fetchAll()
    fetchDropdowns()
  }, [])

  // ── Modal handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(emptyForm())
    setEditingId(null)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (row: MedicalTest) => {
    setForm({
      name: row.name,
      description: row.description ?? '',
      iduom: row.uom?.id.toString() ?? '',
      idcategory: row.testcategories?.id.toString() ?? '',
      normalmin: row.normalmin?.toString() ?? '',
      normalmax: row.normalmax?.toString() ?? '',
    })
    setEditingId(row.id)
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setError(null)
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Test name is required.'); return }
    if (!form.iduom) { setError('Unit of Measure is required.'); return }
    if (!form.idcategory) { setError('Category is required.'); return }

    setLoading(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      iduom: parseInt(form.iduom),
      idcategory: parseInt(form.idcategory),
      normalmin: form.normalmin !== '' ? parseFloat(form.normalmin) : null,
      normalmax: form.normalmax !== '' ? parseFloat(form.normalmax) : null,
    }

    const { error } = editingId
      ? await supabase.from('medicaltests').update(payload).eq('id', editingId)
      : await supabase.from('medicaltests').insert(payload)

    if (error) { setError(error.message); setLoading(false); return }

    setModalOpen(false)
    await fetchAll()
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this medical test?')) return
    const { error } = await supabase.from('medicaltests').delete().eq('id', id)
    if (error) alert(error.message)
    else await fetchAll()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-slate-400 hover:text-blue-500 text-sm transition-colors">
            ← Home
          </Link>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Medical Tests</h1>
            <p className="text-slate-400 text-sm mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            + Add Test
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {fetching ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No records yet. Add one!</div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium w-10">#</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Test Name</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Normal Range</th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{row.id}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      {row.testcategories ? (
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded border border-blue-100">
                          {row.testcategories.name}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.uom ? (
                        <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-mono px-2 py-0.5 rounded border border-emerald-100">
                          {row.uom.name}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {row.normalmin != null && row.normalmax != null
                        ? `${row.normalmin} – ${row.normalmax}`
                        : <span className="italic text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEdit(row)}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {editingId ? 'Edit Medical Test' : 'New Medical Test'}
            </h2>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="space-y-4">
              {/* Test Name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Test Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Fasting Blood Glucose"
                  maxLength={50}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description…"
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Category + UOM selects */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.idcategory}
                    onChange={(e) => setForm({ ...form, idcategory: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select…</option>
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Unit of Measure <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.iduom}
                    onChange={(e) => setForm({ ...form, iduom: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select…</option>
                    {uomList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Normal Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Normal Min</label>
                  <input
                    type="number"
                    step="any"
                    value={form.normalmin}
                    onChange={(e) => setForm({ ...form, normalmin: e.target.value })}
                    placeholder="e.g. 70"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Normal Max</label>
                  <input
                    type="number"
                    step="any"
                    value={form.normalmax}
                    onChange={(e) => setForm({ ...form, normalmax: e.target.value })}
                    placeholder="e.g. 99"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}