'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FolderOpen, FileText, Image as ImageIcon, File, Trash2,
  Upload, Loader2, Download, Plus, X, ChevronRight, ChevronDown,
  BookOpen, AlertCircle, CheckCircle, Search
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

const FOLDERS = [
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5',
  'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10',
  'Miscellaneous'
]

const ACCEPTED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
  'application/vnd.ms-powerpoint': 'doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'doc',
} as const

function getFileType(mimeType: string): string {
  return (ACCEPTED_TYPES as any)[mimeType] || 'doc'
}

function getFileIcon(fileType: string, size = 'h-5 w-5') {
  if (fileType === 'pdf') return <FileText className={`${size} text-red-500`} />
  if (fileType === 'image') return <ImageIcon className={`${size} text-blue-500`} />
  return <File className={`${size} text-amber-500`} />
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface SyllabusFile {
  id: string
  folder: string
  name: string
  file_url: string
  storage_path: string
  file_type: string
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

interface SyllabusBankProps {
  mode: 'admin' | 'teacher'
}

export default function SyllabusBank({ mode }: SyllabusBankProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<SyllabusFile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState<string>('Year 1')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Year 1']))
  const [searchQuery, setSearchQuery] = useState('')

  // Upload state (admin only)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadForm, setUploadForm] = useState({ name: '', folder: 'Year 1' })
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Delete state (admin only)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchFiles() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch('/api/syllabus', { headers, cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load files')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load syllabus files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFiles() }, [])

  const filesInFolder = (folder: string) =>
    files.filter(f => {
      const matchFolder = f.folder === folder
      const matchSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchFolder && matchSearch
    })

  const toggleFolder = (folder: string) => {
    setActiveFolder(folder)
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folder)) next.delete(folder)
      else next.add(folder)
      return next
    })
  }

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
    return headers
  }

  async function handleUpload() {
    if (!selectedFile) { toast.error('Please select a file'); return }
    if (!uploadForm.name.trim()) { toast.error('Please enter a file name'); return }

    setUploading(true)
    setUploadProgress(0)
    const toastId = toast.loading('Uploading to Syllabus Bank...')

    try {
      const headers = await getAuthHeaders()

      // 1. Get a signed upload URL from our API
      const signedRes = await fetch('/api/admin/syllabus', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fileName: selectedFile.name,
          folder: uploadForm.folder,
          contentType: selectedFile.type,
        })
      })
      const signedData = await signedRes.json()
      if (!signedRes.ok) throw new Error(signedData.error || 'Failed to get upload URL')

      const { signedUrl, storagePath, publicUrl } = signedData

      // 2. Upload file directly to Supabase Storage
      setUploadProgress(30)
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      })
      if (!uploadRes.ok) throw new Error('File upload to storage failed')
      setUploadProgress(70)

      // 3. Save metadata to database
      const saveRes = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: uploadForm.name.trim(),
          folder: uploadForm.folder,
          file_url: publicUrl,
          storage_path: storagePath,
          file_type: getFileType(selectedFile.type),
          file_size: selectedFile.size,
        })
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error || 'Failed to save file record')
      setUploadProgress(100)

      toast.success(`"${uploadForm.name}" uploaded successfully!`, { id: toastId })
      setFiles(prev => [saveData.file, ...prev])
      setShowUploadPanel(false)
      setSelectedFile(null)
      setUploadForm(prev => ({ ...prev, name: '' }))
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleDelete(file: SyllabusFile) {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return
    setDeletingId(file.id)
    const toastId = toast.loading(`Deleting "${file.name}"...`)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admin/syllabus?id=${file.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      setFiles(prev => prev.filter(f => f.id !== file.id))
      toast.success('File deleted.', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Delete failed', { id: toastId })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDownload(file: SyllabusFile) {
    if (file.file_type !== 'pdf' && file.file_type !== 'image') {
      toast.info('Only PDF and image files can be downloaded.')
      return
    }
    try {
      const res = await fetch(file.file_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name + (file.file_type === 'pdf' ? '.pdf' : '')
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloading "${file.name}"`)
    } catch {
      // Fallback: open in new tab
      window.open(file.file_url, '_blank')
    }
  }

  const totalCount = files.filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())).length

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Folder Sidebar */}
      <div className="w-48 sm:w-56 shrink-0 border-r border-border/60 bg-muted/20 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="font-bold text-sm text-foreground">Syllabus Bank</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{totalCount} file{totalCount !== 1 ? 's' : ''} total</p>
        </div>

        <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
          {FOLDERS.map(folder => {
            const count = filesInFolder(folder).length
            const isActive = activeFolder === folder
            const isExpanded = expandedFolders.has(folder)
            return (
              <button
                key={folder}
                type="button"
                onClick={() => toggleFolder(folder)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FolderOpen className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate">{folder}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {count > 0 && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      {count}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-sm font-bold text-foreground">{activeFolder}</span>
              <span className="text-xs text-muted-foreground">· {filesInFolder(activeFolder).length} files</span>
            </div>
          </div>

          {mode === 'admin' && (
            <button
              type="button"
              onClick={() => { setUploadForm(prev => ({ ...prev, folder: activeFolder })); setShowUploadPanel(true) }}
              className="flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload File</span>
            </button>
          )}
        </div>

        {/* Upload Panel (admin only) */}
        <AnimatePresence>
          {mode === 'admin' && showUploadPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-border/60 bg-primary/5"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    Upload New File
                  </h4>
                  <button
                    type="button"
                    onClick={() => { setShowUploadPanel(false); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Display Name *</label>
                    <input
                      type="text"
                      value={uploadForm.name}
                      onChange={e => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Year 3 Tajweed Notes"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Folder *</label>
                    <select
                      value={uploadForm.folder}
                      onChange={e => setUploadForm(prev => ({ ...prev, folder: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                    >
                      {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">File *</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.ppt,.pptx"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:text-xs cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-[10px] text-muted-foreground">
                        {selectedFile.name} · {formatBytes(selectedFile.size)}
                      </p>
                    )}
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{uploadProgress}% — please wait...</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowUploadPanel(false); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    disabled={uploading}
                    className="h-8 px-4 text-xs font-semibold rounded-lg border border-border bg-white hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile || !uploadForm.name.trim()}
                    className="h-8 px-4 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filesInFolder(activeFolder).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">
                {searchQuery ? 'No files match your search' : `No files in ${activeFolder} yet`}
              </p>
              {mode === 'admin' && !searchQuery && (
                <button
                  type="button"
                  onClick={() => { setUploadForm(prev => ({ ...prev, folder: activeFolder })); setShowUploadPanel(true) }}
                  className="mt-3 text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Upload the first file
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filesInFolder(activeFolder).map(file => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/60 hover:border-primary/20 hover:shadow-xs transition-all group"
                >
                  <div className="shrink-0">
                    {getFileIcon(file.file_type, 'h-6 w-6')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        file.file_type === 'pdf' ? 'bg-red-50 text-red-600 border border-red-200/70' :
                        file.file_type === 'image' ? 'bg-blue-50 text-blue-600 border border-blue-200/70' :
                        'bg-amber-50 text-amber-600 border border-amber-200/70'
                      }`}>
                        {file.file_type}
                      </span>
                      {file.file_size && (
                        <span className="text-[10px] text-muted-foreground">{formatBytes(file.file_size)}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(file.created_at), 'dd MMM yyyy')}
                      </span>
                      {file.uploaded_by && mode === 'admin' && (
                        <span className="text-[10px] text-muted-foreground truncate">· {file.uploaded_by}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* View */}
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                    </a>

                    {/* Download (PDF and images) */}
                    {(file.file_type === 'pdf' || file.file_type === 'image') && (
                      <button
                        type="button"
                        title="Download"
                        onClick={() => handleDownload(file)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}

                    {/* Delete (admin only) */}
                    {mode === 'admin' && (
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => handleDelete(file)}
                        disabled={deletingId === file.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === file.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
