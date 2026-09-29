import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { Dashboard } from '../pages/Dashboard'
import { Kanban } from '../pages/Kanban'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { Tasks } from '../pages/Tasks'

export function AppRoutes() { return <Routes><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route path="/" element={<Dashboard />} /><Route path="/tasks" element={<Tasks />} /><Route path="/kanban" element={<Kanban />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes> }
