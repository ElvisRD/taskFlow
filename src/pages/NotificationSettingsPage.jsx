import { Link } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer.jsx'
import { IconChevronLeft } from '../components/icons.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { Toggle } from '../components/ui/Toggle.jsx'
import { notificationPreferenceMeta } from '../features/notifications/notificationMeta.js'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences.js'

const MUTE_LABELS = {
  workspace: 'Workspace',
  board: 'Tablero',
}

const MUTE_BADGES = {
  workspace:
    'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30',
  board:
    'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30',
}

function PreferenceRow({ preference, savingKey, onToggle }) {
  const { Icon, tone, description } = notificationPreferenceMeta(preference.type)
  const disabled = !preference.in_app && !preference.email
  const savingInApp = savingKey === `${preference.type}:in_app`
  const savingEmail = savingKey === `${preference.type}:email`

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">
              {preference.label}
            </p>
            {disabled ? (
              <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
                Desactivada
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{description}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-5 pl-11 sm:pl-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
            En la app
          </span>
          <Toggle
            checked={preference.in_app}
            disabled={savingInApp}
            label={`${preference.label} en la app`}
            onChange={(value) => onToggle(preference.type, 'in_app', value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Email</span>
          <Toggle
            checked={preference.email}
            disabled={savingEmail}
            label={`${preference.label} por email`}
            onChange={(value) => onToggle(preference.type, 'email', value)}
          />
        </div>
      </div>
    </li>
  )
}

export function NotificationSettingsPage() {
  const {
    preferences,
    mutes,
    loading,
    error,
    savingKey,
    savingMute,
    reload,
    updateChannel,
    unmuteTarget,
  } = useNotificationPreferences()

  return (
    <PageContainer>
      <Link
        to="/workspaces"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <IconChevronLeft className="h-4 w-4" />
        Workspaces
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">
          Notificaciones
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">
          Elige cómo quieres recibir cada aviso. Puedes activar los avisos en la app, por
          email o ambos.
        </p>
      </div>

      {error ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Alert className="flex-1">{error}</Alert>
          <Button variant="secondary" size="sm" onClick={() => reload()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading ? (
        <PageLoader label="Cargando preferencias…" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <header className="border-b border-slate-200 px-4 py-4 dark:border-zinc-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                  Tipos de notificación
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Los cambios se guardan automáticamente.
                </p>
              </header>

              <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                {preferences.map((preference) => (
                  <PreferenceRow
                    key={preference.type}
                    preference={preference}
                    savingKey={savingKey}
                    onToggle={updateChannel}
                  />
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <header className="border-b border-slate-200 px-4 py-4 dark:border-zinc-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                  Silenciados
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  No recibirás avisos de estos workspaces ni tableros.
                </p>
              </header>

              {mutes.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500 dark:text-zinc-400">
                  No has silenciado ningún workspace ni tablero. Puedes hacerlo desde sus
                  páginas.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {mutes.map((mute) => (
                    <li
                      key={mute.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-zinc-100">
                          {mute.name ?? `#${mute.target_id}`}
                        </p>
                        <Badge className={`mt-1 ${MUTE_BADGES[mute.type] ?? ''}`}>
                          {MUTE_LABELS[mute.type] ?? 'Elemento'}
                        </Badge>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        loading={savingMute}
                        aria-label={`Reactivar notificaciones de ${mute.name ?? mute.target_id}`}
                        onClick={() => unmuteTarget(mute)}
                      >
                        Reactivar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </PageContainer>
  )
}
