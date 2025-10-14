'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Image as ImageIcon, Upload, X } from 'lucide-react'

interface ImageUploadProps {
  onImageUpload: (imageData: string) => void
}

export default function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        onImageUpload(result)
      }
      reader.readAsDataURL(file)
    }
  }, [onImageUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div
      {...getRootProps()}
      className={`flex items-center justify-center p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        isDragActive
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-dark-600 hover:border-primary-500 hover:bg-primary-500/5'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center gap-2 text-gray-400">
        {isDragActive ? (
          <>
            <Upload className="h-4 w-4" />
            <span className="text-sm">Drop image here...</span>
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">Upload</span>
          </>
        )}
      </div>
    </div>
  )
}
