"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface DateRangeFilterProps {
  fromDate: string
  toDate: string
}

export function DateRangeFilter({ fromDate, toDate }: DateRangeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [from, setFrom] = useState<Date>(new Date(fromDate))
  const [to, setTo] = useState<Date>(new Date(toDate))
  const [open, setOpen] = useState(false)

  function applyFilter() {
    const params = new URLSearchParams(searchParams.toString())
    params.set("from", format(from, "yyyy-MM-dd"))
    params.set("to", format(to, "yyyy-MM-dd"))
    router.push(`/admin/tracking?${params.toString()}`)
    setOpen(false)
  }

  function setQuickRange(days: number) {
    const now = new Date()
    const newFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    setFrom(newFrom)
    setTo(now)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          {format(from, "MMM d, yyyy")} - {format(to, "MMM d, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
              Last 7 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
              Last 30 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>
              Last 90 days
            </Button>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="mb-2 text-sm font-medium">From</p>
              <Calendar
                mode="single"
                selected={from}
                onSelect={(date) => date && setFrom(date)}
                disabled={(date) => date > new Date() || date > to}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">To</p>
              <Calendar
                mode="single"
                selected={to}
                onSelect={(date) => date && setTo(date)}
                disabled={(date) => date > new Date() || date < from}
              />
            </div>
          </div>
          <Button onClick={applyFilter}>Apply Filter</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
