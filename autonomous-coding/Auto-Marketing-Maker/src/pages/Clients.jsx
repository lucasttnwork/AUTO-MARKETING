import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SkeletonClientCard, Skeleton } from '../components/Skeleton'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [archivedClients, setArchivedClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showArchived, setShowArchived] = useState(false) // Toggle between active and archived
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    custom_instructions: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({
    website_url: ''
  })
  const [uploadedFiles, setUploadedFiles] = useState([])

  useEffect(() => {
    fetchClients()
    fetchArchivedClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchArchivedClients = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clients/archived/list')
      const data = await response.json()
      setArchivedClients(data)
    } catch (error) {
      console.error('Failed to fetch archived clients:', error)
    }
  }

  const handleRestore = async (clientId) => {
    if (!confirm('Are you sure you want to restore this client?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/clients/${clientId}/restore`, {
        method: 'PATCH'
      })
      if (response.ok) {
        // Refresh both lists
        await fetchClients()
        await fetchArchivedClients()
        alert('Client restored successfully!')
      }
    } catch (error) {
      console.error('Error restoring client:', error)
      alert('Failed to restore client')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate URL before submitting
    const urlError = validateUrl(formData.website_url)
    if (urlError) {
      setErrors({ ...errors, website_url: urlError })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('http://localhost:3001/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchClients()
        setShowModal(false)
        setFormData({ name: '', website_url: '', custom_instructions: '' })
        setErrors({ website_url: '' })
        setUploadedFiles([])
      }
    } catch (error) {
      console.error('Failed to create client:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const validateUrl = (url) => {
    if (!url) {
      return '' // Empty URL is allowed
    }

    // Check if URL starts with http:// or https://
    if (!url.match(/^https?:\/\//)) {
      return 'URL must start with http:// or https://'
    }

    // Try to parse the URL
    try {
      new URL(url)
      return ''
    } catch (error) {
      return 'Please enter a valid URL (e.g., https://example.com)'
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    // Validate URL field
    if (name === 'website_url') {
      const error = validateUrl(value)
      setErrors({
        ...errors,
        website_url: error
      })
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      // Accept PDFs and images (PNG, JPG, JPEG)
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      return validTypes.includes(file.type)
    })

    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="p-8" role="status" aria-label="Loading clients">
        <div className="mb-8 flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="w-32 h-8" />
            <Skeleton className="w-48 h-4" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-48 h-10 rounded-lg" />
            <Skeleton className="w-32 h-10 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonClientCard />
          <SkeletonClientCard />
          <SkeletonClientCard />
        </div>
        <span className="sr-only">Loading clients, please wait...</span>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Clients</h1>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Manage your client portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Active/Archived Toggle */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showArchived
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Active ({clients.length})
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showArchived
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Archived ({archivedClients.length})
            </button>
          </div>

          {/* View Toggle */}
          {!showArchived && clients.length > 0 && (
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            + Add Client
          </button>
        </div>
      </div>

      {showArchived ? (
        // Archived Clients View
        archivedClients.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold tracking-tight mb-2">No archived clients</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Archived clients will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedClients.map((client) => (
              <div
                key={client.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow opacity-75"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium">
                    archived
                  </span>
                </div>

                <h3 className="text-lg font-bold tracking-tight mb-2">{client.name}</h3>

                {client.website_url && (
                  <a
                    href={client.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 block"
                  >
                    {client.website_url}
                  </a>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleRestore(client.id)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 text-sm font-medium transition-all"
                  >
                    🔄 Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : clients.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-xl font-bold tracking-tight mb-2">No clients yet</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Start by adding your first client to get started
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            Add First Client
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                  {client.status}
                </span>
              </div>

              <h3 className="text-lg font-bold tracking-tight mb-2">{client.name}</h3>

              {client.website_url && (
                <a
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 block"
                >
                  {client.website_url}
                </a>
              )}

              {client.custom_instructions && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                  {client.custom_instructions}
                </p>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Link
                  to={`/clients/${client.id}`}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors text-center"
                >
                  View Details
                </Link>
                <Link
                  to="/campaigns"
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm font-medium transition-colors"
                >
                  Campaigns
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Website
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {client.name}
                        </div>
                        {client.custom_instructions && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {client.custom_instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {client.website_url ? (
                      <a
                        href={client.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {client.website_url.replace(/^https?:\/\//, '').substring(0, 30)}
                        {client.website_url.length > 35 ? '...' : ''}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(client.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/clients/${client.id}`}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
                      >
                        Details
                      </Link>
                      <Link
                        to="/campaigns"
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm font-medium transition-colors"
                      >
                        Campaigns
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold tracking-tight">Add New Client</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Create a new client profile
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label htmlFor="client-name" className="block text-sm font-medium mb-2">
                  Client Name <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  type="text"
                  id="client-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Acme Corporation"
                  aria-required="true"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="client-website" className="block text-sm font-medium mb-2">
                  Website URL
                </label>
                <input
                  type="text"
                  id="client-website"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  aria-invalid={errors.website_url ? 'true' : 'false'}
                  aria-describedby={errors.website_url ? 'website-error' : undefined}
                  className={`w-full px-4 py-2 bg-white dark:bg-slate-900 border ${
                    errors.website_url
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                  } rounded-lg focus:ring-2 focus:border-transparent outline-none`}
                />
                {errors.website_url && (
                  <div
                    id="website-error"
                    role="alert"
                    aria-live="assertive"
                    className="mt-2 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <span className="text-red-500 flex-shrink-0" aria-hidden="true">⚠️</span>
                    <span className="text-sm text-red-700 dark:text-red-300">{errors.website_url}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="client-instructions" className="block text-sm font-medium mb-2">
                  Custom Instructions
                </label>
                <textarea
                  id="client-instructions"
                  name="custom_instructions"
                  value={formData.custom_instructions}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Special notes or instructions for this client..."
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Brand Assets
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Upload PDFs or images (PNG, JPG) for brand analysis
                </p>

                {/* Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 transition-colors font-medium text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose Files
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            {file.type === 'application/pdf' ? (
                              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0 ml-3 p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Remove file"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({ name: '', website_url: '', custom_instructions: '' })
                    setErrors({ website_url: '' })
                    setUploadedFiles([])
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
