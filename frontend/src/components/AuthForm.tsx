import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const loginSchema = z.object({ email: z.string().email('Email không hợp lệ'), password: z.string().min(1, 'Vui lòng nhập mật khẩu') })
const registerSchema = loginSchema.extend({ fullName: z.string().min(2, 'Họ tên cần ít nhất 2 ký tự'), password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'), confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại chưa khớp' })
export type AuthValues = z.infer<typeof registerSchema>

export function AuthForm({ mode, onSubmit }: { mode: 'login' | 'register'; onSubmit: (values: AuthValues) => Promise<void> }) {
  const form = useForm<AuthValues>({ resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema), defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' } })
  const submit = form.handleSubmit(async (values) => { try { await onSubmit(values) } catch (error) { form.setError('root', { message: error instanceof Error ? error.message : 'Không thể thực hiện thao tác' }) } })
  const field = (name: keyof AuthValues, label: string, type = 'text') => <div><label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">{label}</label><input id={name} type={type} autoComplete={type === 'password' ? 'current-password' : undefined} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...form.register(name)} /><p className="mt-1 min-h-5 text-xs text-red-600">{form.formState.errors[name]?.message}</p></div>
  return <form onSubmit={submit} className="space-y-2" noValidate>{mode === 'register' && field('fullName', 'Họ và tên')}{field('email', 'Email', 'email')}{field('password', 'Mật khẩu', 'password')}{mode === 'register' && field('confirmPassword', 'Nhập lại mật khẩu', 'password')}{form.formState.errors.root && <p role="alert" className="text-sm text-red-600">{form.formState.errors.root.message}</p>}<button disabled={form.formState.isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button></form>
}
