'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: number
  name: string
  description: string | null
}

type FormData = {
  name: string
  description: string
}

const emptyForm = (): FormData => ({ name: '', description: '' })

export default function TestCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { document.title = 'Test Categories — MedLab CRUD' }, [])

  const fetchAll = async () => {
    setFetching(true)
    const { data, error } = await supabase.from('testcategories').select('*').order('id')
    if (error) setError(error.message)
    else setRows(data ?? [])
    setFetching(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => {
    setForm(emptyForm())
    setEditingId(null)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (row: Category) => {
    setForm({ name: row.name, description: row.description ?? '' })
    setEditingId(row.id)
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setLoading(true)
    setError(null)

    const payload = { name: form.name.trim(), description: form.description.trim() || null }

    const { error } = editingId
      ? await supabase.from('testcategories').update(payload).eq('id', editingId)
      : await supabase.from('testcategories').insert(payload)

    if (error) { setError(error.message); setLoading(false); return }

    setModalOpen(false)
    await fetchAll()
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? This may affect Medical Tests that reference it.')) return
    const { error } = await supabase.from('testcategories').delete().eq('id', id)
    if (error) alert(error.message)
    else await fetchAll()
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-slate-400 hover:text-blue-500 text-sm transition-colors">
            ← Home
          </Link>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Test Categories</h1>
            <p className="text-slate-400 text-sm mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            + Add Category
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {fetching ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No records yet. Add one!</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium w-10">#</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Description</th>
                  <th className="px-5 py-3 text-slate-500 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{row.id}</td>
                    <td className="px-5 py-3 text-slate-800 font-medium">
                      <span className="inline-block bg-slate-100 text-slate-700 text-xs font-mono px-2 py-0.5 rounded">
                        {row.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{row.description ?? <span className="italic text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 text-right space-x-2">
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

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {editingId ? 'Edit Category' : 'New Test Category'}
            </h2>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. BCT"
                  maxLength={50}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description…"
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
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