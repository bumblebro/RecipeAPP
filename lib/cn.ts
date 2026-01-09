/**
 * Utility function to conditionally join classNames
 * Similar to clsx or classnames but for NativeWind
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

