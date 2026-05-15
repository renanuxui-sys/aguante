import HomeClient from './home-client'
import { carregarHomeDataServidor } from '@/lib/home-data'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const initialData = await carregarHomeDataServidor()
  return <HomeClient initialData={initialData} />
}
