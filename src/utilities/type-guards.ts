export function isNullOrUndefined(val: any): val is null | undefined {
  return val === undefined || val === null
}

export function isVoid(val: any): val is void {
  return val === undefined || val === null
}

export function isObject(val: any) {
  return val !== null && typeof val === "object"
}
