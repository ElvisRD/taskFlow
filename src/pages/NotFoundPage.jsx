import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4 text-center">
      <p className="text-sm font-semibold text-indigo-600">Error 404</p>
      <h1 className="text-2xl font-semibold text-slate-900">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-slate-500">
        La página que buscas no existe o fue movida.
      </p>
      <Button as={Link} to="/workspaces">
        Volver a los workspaces
      </Button>
    </div>
  )
}
