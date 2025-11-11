import { Card } from "@/components/ui/card"
import type { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: string
  subtitle: string
  icon: ReactNode
  trend?: string
}

export function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          {trend && <p className="mt-2 text-sm font-medium text-accent">{trend}</p>}
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
    </Card>
  )
}
