import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { BoardPage } from './pages/BoardPage.jsx'
import { EmailVerifiedPage } from './pages/EmailVerifiedPage.jsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx'
import { InvitationAcceptPage } from './pages/InvitationAcceptPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { NotificationSettingsPage } from './pages/NotificationSettingsPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx'
import { SecurityPage } from './pages/SecurityPage.jsx'
import { VerifyEmailPage } from './pages/VerifyEmailPage.jsx'
import { WorkspacePage } from './pages/WorkspacePage.jsx'
import { WorkspacesPage } from './pages/WorkspacesPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/email/verified" element={<EmailVerifiedPage />} />
      <Route path="/invitations/:token" element={<InvitationAcceptPage />} />

      <Route element={<ProtectedRoute requireVerified={false} />}>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/workspaces" replace />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/:workspaceId" element={<WorkspacePage />} />
          <Route path="workspaces/:workspaceId/boards/:boardId" element={<BoardPage />} />
          <Route path="settings/notifications" element={<NotificationSettingsPage />} />
          <Route path="settings/security" element={<SecurityPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
