import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image
          src="/taxfolio.png"
          alt="TaxFolio"
          width={160}
          height={40}
          className="h-10 w-auto"
        />
      </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
