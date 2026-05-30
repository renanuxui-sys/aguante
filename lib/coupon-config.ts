export function cuponsTesteAtivos() {
  return process.env.NEXT_PUBLIC_ENABLE_COUPONS_TEST === 'true'
    || process.env.ENABLE_COUPONS_TEST === 'true'
    || process.env.VERCEL_ENV === 'preview'
}
