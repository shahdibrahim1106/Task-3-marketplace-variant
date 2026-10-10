import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', price: 0, category: 'other', condition: 'used', status: 'active' }

const CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other']
const CONDITIONS = ['new', 'like-new', 'used', 'worn']
const STATUSES = ['active', 'sold']

// Prefer the server's `message`, fall back to something generic.
function errorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong'
}

export default function ListingForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the listing and fill the form.
     useEffect(() => {
    if (!id) {
      setForm(defaults)
      return
    }
    let cancelled = false
    api.get(`/listings/${id}`)
      .then((res) => {
        if (cancelled) return
        const l = res.data?.listing ?? res.data
        setForm({
          title: l.title ?? '',
          description: l.description ?? '',
          price: Number(l.price) || 0,
          category: l.category ?? 'other',
          condition: l.condition ?? 'used',
          status: l.status ?? 'active',
        })
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
    return () => { cancelled = true }
  }, [id])

  function onChange(e) {
    const { name, value, type } = e.target
    setForm((f) => ({
      ...f,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    // Only the form fields: no `seller`, the server reads it from the token.
    const payload = { ...form, price: Number(form.price) || 0 }
    try {
      if (id) {
        await api.patch(`/listings/${id}`, payload)
      } else {
        delete payload.status // not shown when creating; server defaults it
        await api.post('/listings', payload)
      }
      nav('/listings')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'New'} Listing</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            className="input w-full"
            placeholder="Calculus textbook"
            value={form.title}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">Price</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="any"
            className="input w-full"
            value={form.price}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
          <select
            id="category"
            name="category"
            className="input w-full"
            value={form.category}
            onChange={onChange}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="condition" className="block text-sm font-medium mb-1">Condition</label>
          <select
            id="condition"
            name="condition"
            className="input w-full"
            value={form.condition}
            onChange={onChange}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {id && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
            <select
              id="status"
              name="status"
              className="input w-full"
              value={form.status}
              onChange={onChange}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="input w-full"
            value={form.description}
            onChange={onChange}
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}