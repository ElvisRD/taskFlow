import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { Button } from '../components/ui/Button.jsx'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4 text-center dark:bg-zinc-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Error 404</p>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">
        Página no encontrada
      </h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-zinc-400">
        La página que buscas no existe o fue movida.
      </p>
      <Button as={Link} to="/workspaces">
        Volver a los workspaces
      </Button>
    </div>
  )
}
