interface PageHeaderProps {
  titulo: string
  descripcion?: string
  children?: React.ReactNode
}

export function PageHeader({ titulo, descripcion, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">{titulo}</h1>
        {descripcion && (
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">{descripcion}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
