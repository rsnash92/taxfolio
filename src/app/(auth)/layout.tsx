export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The individual auth pages now handle their own full-page layout
  return <>{children}</>
}
