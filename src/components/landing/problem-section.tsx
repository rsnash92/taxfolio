import { FileSpreadsheet, Clock, Wallet } from "lucide-react"

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Spreadsheet chaos",
    description: "Rows of receipts, lost data, hours of manual entry every month.",
  },
  {
    icon: Clock,
    title: "January panic",
    description: "Scrambling to find receipts before the deadline, stressed and confused.",
  },
  {
    icon: Wallet,
    title: "Expensive accountants",
    description: "£300+ just to file a simple return. Money you'd rather keep.",
  },
]

export function ProblemSection() {
  return (
    <section className="py-20 px-4 bg-zinc-900/50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Tax returns shouldn&apos;t be this hard.
        </h2>
        <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
          Sound familiar? You&apos;re not alone.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="p-6 rounded-xl bg-zinc-900 border border-zinc-800"
            >
              <problem.icon className="w-10 h-10 text-red-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{problem.title}</h3>
              <p className="text-zinc-400 text-sm">{problem.description}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xl font-medium text-[#15e49e]">
          There&apos;s a better way.
        </p>
      </div>
    </section>
  )
}
