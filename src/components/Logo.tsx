export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return <img src="/logo-mark.png" alt="UPATH" className={`${className} object-contain`} />
}
