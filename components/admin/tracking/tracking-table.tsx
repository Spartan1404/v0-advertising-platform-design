"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

interface TrackingTableProps {
  data: {
    campaignId: string
    campaignName: string
    impressions: number
    clicks: number
  }[]
}

export function TrackingTable({ data }: TrackingTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No campaign data available</p>
        <p className="text-sm text-muted-foreground">
          Data will appear once ads start serving
        </p>
      </div>
    )
  }

  const maxImpressions = Math.max(...data.map(d => d.impressions))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          <TableHead className="text-right">Impressions</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="w-[200px]">Distribution</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => {
          const ctr = row.impressions > 0 
            ? ((row.clicks / row.impressions) * 100).toFixed(2) 
            : "0.00"
          const progress = maxImpressions > 0 
            ? (row.impressions / maxImpressions) * 100 
            : 0

          return (
            <TableRow key={row.campaignId}>
              <TableCell className="font-medium">{row.campaignName}</TableCell>
              <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.clicks.toLocaleString()}</TableCell>
              <TableCell className="text-right">{ctr}%</TableCell>
              <TableCell>
                <Progress value={progress} className="h-2" />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
