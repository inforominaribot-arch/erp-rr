interface PageHeaderProps {
  titulo: string
  descripcion?: string
  children?: React.ReactNode
}

export function PageHeader({ titulo, descripcion, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
        {descripcion && (
          <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
