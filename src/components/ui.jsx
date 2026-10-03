import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils.js'
export { Button } from './primitives/button.jsx'
export { Input } from './primitives/input.jsx'
export { Textarea } from './primitives/textarea.jsx'
export { Card, CardContent, CardHeader, CardTitle, CardDescription } from './primitives/card.jsx'
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './primitives/dialog.jsx'
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut } from './primitives/dropdown-menu.jsx'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './primitives/tabs.jsx'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './primitives/tooltip.jsx'

export const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', {
  variants: { tone: {
    default: 'border-border bg-secondary/50 text-muted-foreground',
    indigo: 'border-blue-400/25 bg-blue-400/10 text-blue-300',
    green: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    rose: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
  } }, defaultVariants: { tone: 'default' },
})
export function Badge({ children, tone, className, ...props }) { return <span className={cn(badgeVariants({ tone }), className)} {...props}>{children}</span> }
export function SectionHeader({ eyebrow, title, desc, align = 'left', action }) {
  return <div className={cn('flex flex-wrap items-end justify-between gap-5', align === 'center' && 'justify-center text-center')}><div className="max-w-3xl">{eyebrow && <p className="text-xs font-medium uppercase tracking-[.12em] text-primary">{eyebrow}</p>}<h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{desc && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{desc}</p>}</div>{action}</div>
}
export function EmptyState({ icon, title, desc, action }) { return <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-14 text-center"><div className="text-2xl text-muted-foreground">{icon}</div><h2 className="mt-4 text-lg font-medium">{title}</h2>{desc && <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{desc}</p>}{action && <div className="mt-5">{action}</div>}</div> }
export function Stat({ label, value }) { return <div className="rounded-lg border bg-card px-5 py-4"><p className="text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div> }
