import { priorityMeta } from '../lib/constants.js'
import { Badge } from './ui/Badge.jsx'

export function PriorityBadge({ value }) {
  const meta = priorityMeta(value)

  return (
    <Badge className={meta.badge}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </Badge>
  )
}
