import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Professional: cool gradient, subtle border, shadow, no overlay
      'rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 shadow-lg hover:shadow-xl transition-shadow duration-200 relative overflow-hidden',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Slightly tinted header for separation
      'flex flex-col space-y-2 p-7 pb-3 border-b border-slate-100 bg-gradient-to-r from-white/95 via-blue-50/80 to-white/95 z-10 relative',
      className
    )}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Neutral, bold, readable
      'font-bold leading-tight tracking-tight text-xl text-slate-800',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-base text-slate-500 font-medium', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Remove background, border radius, and z-index to prevent overlap with charts
      'p-7 pt-4',
      className
    )}
    {...props}
  />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Slightly tinted footer for separation
      'flex items-center p-7 pt-0 border-t border-slate-100 bg-gradient-to-r from-white/95 via-blue-50/80 to-white/95 z-10 relative',
      className
    )}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
