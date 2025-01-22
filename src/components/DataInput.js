"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BASE_PATH } from "../utils/constants.js"

const DataInput = ({ onDataSubmit }) => {
  const [inputData, setInputData] = useState("")

  useEffect(() => {
    fetch(`${BASE_PATH}/sample.json`)
      .then((response) => response.json())
      .then((data) => {
        setInputData(JSON.stringify(data, null, 2))
      })
      .catch((error) => console.error("Error loading sample.json:", error))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      const parsedData = JSON.parse(inputData)
      onDataSubmit(parsedData)
    } catch (error) {
      console.error("Invalid JSON:", error)
      alert("Invalid JSON. Please check your input.")
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target.result
        setInputData(content)
      }
      reader.readAsText(file)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="matchData">Enter Match Data (JSON format):</Label>
        <Textarea
          id="matchData"
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          rows={10}
          className="font-mono"
        />
      </div>
      <div>
        <Label htmlFor="fileUpload">Or upload a JSON file:</Label>
        <input
          id="fileUpload"
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
      </div>
      <Button type="submit">Submit Data</Button>
    </form>
  )
}

export default DataInput

