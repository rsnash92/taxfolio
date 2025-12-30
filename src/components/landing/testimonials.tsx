import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "I used to spend a whole weekend on my tax return. With TaxFolio, I review transactions for 10 minutes on my phone each week. Done.",
    author: "Sarah K.",
    role: "Freelance Designer",
  },
  {
    quote: "Finally, something simpler than Xero that actually understands my transactions. The AI is scarily good at knowing what's business vs personal.",
    author: "Marcus T.",
    role: "IT Contractor",
  },
  {
    quote: "The MTD quarterly view is brilliant. I can see exactly what I owe each quarter instead of panicking in January. Worth every penny.",
    author: "Emma R.",
    role: "Property Landlord",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 px-4 bg-zinc-900/50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Trusted by UK freelancers
        </h2>
        <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
          Join thousands who&apos;ve made self-assessment simple.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="p-6 rounded-xl bg-zinc-900 border border-zinc-800"
            >
              <Quote className="w-8 h-8 text-[#15e49e]/30 mb-4" />
              <p className="text-zinc-300 mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <p className="font-medium">{testimonial.author}</p>
                <p className="text-zinc-500 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
