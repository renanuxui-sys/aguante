import HomeClient from './home-client'
import { carregarHomeDataServidor } from '@/lib/home-data'

export const revalidate = 300

export default async function HomePage() {
  const initialData = await carregarHomeDataServidor()
  return <HomeClient initialData={initialData} />
}
