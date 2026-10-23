import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { BoardPage } from './pages/BoardPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { NotificationSettingsPage } from './pages/NotificationSettingsPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { WorkspacePage } from './pages/WorkspacePage.jsx'
import { WorkspacesPage } from './pages/WorkspacesPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/workspaces" replace />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/:workspaceId" element={<WorkspacePage />} />
          <Route path="workspaces/:workspaceId/boards/:boardId" element={<BoardPage />} />
          <Route path="settings/notifications" element={<NotificationSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
