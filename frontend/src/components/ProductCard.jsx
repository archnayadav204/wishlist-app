import { useState, useRef } from 'react'
import { deleteProduct, updateStatus } from '../services/productService'
import ConfirmModal from './ConfirmModal'

const STATUS_CONFIG = {
  wishlist: {
    badge:  'bg-indigo-50 text-indigo-700 border border-indigo-200',
    select: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    label: 'Wishlist',
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  cart: {
    badge:  'bg-amber-50 text-amber-700 border border-amber-200',
    select: 'bg-amber-50 border-amber-200 text-amber-700',
    label: 'In Cart',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  purchased: {
    badge:  'bg-green-50 text-green-700 border border-green-200',
    select: 'bg-green-50 border-green-200 text-green-700',
    label: 'Purchased',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
}

const SOURCE_CONFIG = {
  amazon:   { label: 'Amazon',   style: 'bg-orange-500 text-white' },
  flipkart: { label: 'Flipkart', style: 'bg-blue-600 text-white'   },
}

function ProductCard({ item, onRefresh, onDelete }) {
  const { id, product, status } = item

  const [currentStatus, setCurrentStatus] = useState(status)
  const [updating, setUpdating]           = useState(false)
  const [imgError, setImgError]           = useState(false)
  const [toast, setToast]                 = useState(null)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [deleting, setDeleting]           = useState(false)

  const prevStatusRef = useRef(status)
  const statusCfg     = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.wishlist
  const sourceCfg     = SOURCE_CONFIG[product.source] || { label: product.source, style: 'bg-gray-600 text-white' }

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 2500)
  }

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value
    prevStatusRef.current = currentStatus
    setCurrentStatus(newStatus)
    setUpdating(true)
    try {
      await updateStatus(id, { status: newStatus })
      showToast('success', 'Status updated!')
      onRefresh()
    } catch {
      setCurrentStatus(prevStatusRef.current)
      showToast('error', 'Update failed.')
    } finally {
      setUpdating(false)
    }
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteProduct(id)
      setShowConfirm(false)
      onDelete(id)
    } catch {
      showToast('error', 'Delete failed.')
      setShowConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          title="Remove Product?"
          message={`"${product.title}" will be removed from your wishlist.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}

      {/* ── Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                      hover:shadow-xl hover:-translate-y-1
                      transition-all duration-300 flex flex-col overflow-hidden group">

        {/* ── Image area ── */}
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-48 overflow-hidden">

          {product.image_url && !imgError ? (
            <img
              src={product.image_url}
              alt={product.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-contain p-4
                         group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">No image</span>
            </div>
          )}

          {/* Hover overlay — "View Product" */}
          <a
            href={product.product_url}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 bg-black/0 group-hover:bg-black/30
                       flex items-center justify-center
                       opacity-0 group-hover:opacity-100
                       transition-all duration-300"
          >
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/95 backdrop-blur-sm
                             rounded-full text-xs font-bold text-gray-800 shadow-lg
                             translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on {sourceCfg.label}
            </span>
          </a>

          {/* Source badge — top right */}
          <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5
                            rounded-full shadow-sm ${sourceCfg.style}`}>
            {sourceCfg.label}
          </span>

          {/* Delete button — top left, visible on hover */}
          <button
            onClick={() => setShowConfirm(true)}
            className="absolute top-2.5 left-2.5
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200
                       w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow
                       flex items-center justify-center
                       text-gray-400 hover:text-red-500 hover:bg-white"
            title="Remove product"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col flex-1 p-4 gap-3">

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {/* Price + Status badge (same row) */}
          <div className="flex items-center justify-between">
            <p className="text-xl font-extrabold text-indigo-600 tracking-tight">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>
            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.badge}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
          </div>

          {/* Toast feedback */}
          {toast && (
            <div className={`text-xs px-3 py-2 rounded-xl flex items-center gap-2 font-medium
              ${toast.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'}`}
            >
              {toast.type === 'success'
                ? <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              }
              {toast.msg}
            </div>
          )}

          <div className="flex-1" />

          {/* Status dropdown */}
          <div className="relative">
            <select
              value={currentStatus}
              onChange={handleStatusChange}
              disabled={updating}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold
                         focus:outline-none focus:ring-2 focus:ring-indigo-300
                         disabled:opacity-60 cursor-pointer appearance-none
                         transition ${statusCfg.select}`}
            >
              <option value="wishlist">♥ Move to Wishlist</option>
              <option value="cart">🛒 Move to Cart</option>
              <option value="purchased">✓ Mark as Purchased</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {updating ? (
                <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="h-3 w-3 text-current opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default ProductCard
