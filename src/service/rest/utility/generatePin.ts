export const generatePIN = () => {
  const str = parseInt(String(1000000 * Math.random()), 10).toString() + "0000"
  return Number(str.substring(0, 4))
}
