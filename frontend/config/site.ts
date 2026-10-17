export const site = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Ghormu',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3010',
  description: 'A reusable foundation for your next project.',
} as const
