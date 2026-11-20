// app/(auth)/login/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#F4F6F9] text-slate-900">
      {children}
    </div>
  )
}