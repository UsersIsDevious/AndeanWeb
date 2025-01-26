import React, { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

const LoadingAnimation = () => {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots.length >= 3 ? "" : prevDots + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-lg font-semibold">Loading{dots}</span>
    </div>
  )
}

export default LoadingAnimation

