import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts } from '../services/productService'
import { isLoggedIn } from '../services/authService'
import ProductCard from '../components/ProductCard'

const STATS_CONFIG = [
  {
    key: 'total', label: 'Total Saved',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    iconBg: 'bg-indigo-100 text-indigo-600',
    border: 'border-l-indigo-500',
    value: 'text-indigo-700',
  },
  {
    key: 'wishlist', label: 'Wishlist',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    iconBg: 'bg-purple-100 text-purple-600',
    border: 'border-l-purple-500',
    value: 'text-purple-700',
  },
  {
    key: 'cart', label: 'In Cart',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    iconBg: 'bg-amber-100 text-amber-600',
    border: 'border-l-amber-500',
    value: 'text-amber-700',
  },
  {
    key: 'purchased', label: 'Purchased',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-green-100 text-green-600',
    border: 'border-l-green-500',
    value: 'text-green-700',
  },
]

const FILTER_CONFIG = [
  { key: 'all',       label: 'All',       dot: 'bg-indigo-500' },
  { key: 'wishlist',  label: 'Wishlist',  dot: 'bg-purple-500' },
  { key: 'cart',      label: 'Cart',      dot: 'bg-amber-500'  },
  { key: 'purchased', label: 'Purchased', dot: 'bg-green-500'  },
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse shadow-sm">
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-48 w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3.5 bg-gray-200 rounded-full w-4/5" />
        <div className="h-3 bg-gray-200 rounded-full w-3/5" />
        <div className="h-6 bg-gray-200 rounded-full w-1/3 mt-1" />
        <div className="h-8 bg-gray-100 rounded-xl w-full mt-2" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      </div>
    </div>
  )
}

function EmptyState({ filter }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border-2 border-gray-100 flex items-center justify-center text-lg">
          {filter === 'cart' ? '🛒' : filter === 'purchased' ? '✅' : '💜'}
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {filter === 'all' ? 'Your wishlist is empty' : `No ${filter} items yet`}
      </h3>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
        {filter === 'all'
          ? 'Use the Chrome extension to save products from Amazon directly to your dashboard.'
          : `Products you mark as "${filter}" will appear here.`}
      </p>
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [products, setProducts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await getProducts()
      setProducts(res.data)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (deletedId) =>
    setProducts((prev) => prev.filter((p) => p.id !== deletedId))

  const stats = {
    total:     products.length,
    wishlist:  products.filter(p => p.status === 'wishlist').length,
    cart:      products.filter(p => p.status === 'cart').length,
    purchased: products.filter(p => p.status === 'purchased').length,
  }

  const filtered = activeFilter === 'all'
    ? products
    : products.filter(p => p.status === activeFilter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              My Wishlist
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {loading ? 'Loading your products…' : `${stats.total} product${stats.total !== 1 ? 's' : ''} saved`}
            </p>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STATS_CONFIG.map(({ key, label, icon, iconBg, border, value }) => (
            <div key={key}
              className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${border}
                          px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                {icon}
              </div>
              <div>
                <p className={`text-2xl font-extrabold leading-none ${value}`}>
                  {loading ? '–' : stats[key]}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_CONFIG.map(({ key, label, dot }) => {
            const count = key === 'all' ? stats.total : stats[key]
            const active = activeFilter === key
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/70' : dot}`} />
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Product Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
              ? <EmptyState filter={activeFilter} />
              : filtered.map((item) => (
                  <ProductCard key={item.id} item={item} onRefresh={fetchProducts} onDelete={handleDelete} />
                ))
          }
        </div>

      </div>
    </div>
  )
}

export default HomePage
