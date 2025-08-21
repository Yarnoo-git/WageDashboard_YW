'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BandsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/simulation')
  }, [router])
  
  return null
}