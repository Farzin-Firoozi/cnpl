import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type ButtonVariant = 'digit' | 'function' | 'operator'

interface CalculatorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant
  active?: boolean
  wide?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  digit: 'bg-zinc-700 text-white hover:bg-zinc-600 active:bg-zinc-500',
  function: 'bg-zinc-400 text-black hover:bg-zinc-300 active:bg-zinc-200',
  operator: 'bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-300',
}

const ACTIVE_OPERATOR_CLASSES = 'bg-white text-orange-500 hover:bg-zinc-100'

export function CalculatorButton({
  variant,
  active = false,
  wide = false,
  className,
  ...props
}: CalculatorButtonProps) {
  const variantClass =
    variant === 'operator' && active
      ? ACTIVE_OPERATOR_CLASSES
      : VARIANT_CLASSES[variant]

  return (
    <button
      type="button"
      className={cn(
        'flex h-18 cursor-pointer items-center text-3xl font-medium leading-none transition-all duration-100',
        'active:scale-95 select-none disabled:opacity-50',
        wide
          ? 'col-span-2 justify-start rounded-full pl-7'
          : 'aspect-square justify-center rounded-full',
        variantClass,
        className,
      )}
      {...props}
    />
  )
}
