"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

function getTaxYearOptions(): string[] {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  // Show last 3 tax years plus current
  for (let i = 0; i < 4; i++) {
    const startYear = currentYear - i
    years.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`)
  }
  return years
}

interface TaxYearSelectorProps {
  defaultValue?: string
}

export function TaxYearSelector({ defaultValue }: TaxYearSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTaxYear = searchParams.get("tax_year") || defaultValue || getCurrentTaxYear()
  const taxYearOptions = getTaxYearOptions()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tax_year", value)
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={currentTaxYear} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Tax Year" />
      </SelectTrigger>
      <SelectContent>
        {taxYearOptions.map((year) => (
          <SelectItem key={year} value={year}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { getCurrentTaxYear, getTaxYearOptions }
