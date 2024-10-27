export function getTodayStartDateTime() {
  const d = new Date()
  d.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
  d.setHours(0, 0, 0, 0)
  return d
}
export function getTodayEndDateTime() {
  const d = new Date()
  d.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
  d.setHours(23, 59, 59, 999)
  return d
}
export function getMonthStartDateTime(month?: number) {
  const d = new Date()
  d.setFullYear(d.getFullYear(), month || d.getMonth(), 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getMonthEndDateTime(month?: number) {
  const d = new Date()
  const m = (month || d.getMonth()) + 1
  d.setFullYear(d.getFullYear(), m, 1)
  d.setHours(0, 0, 0, 0)
  return d
}
