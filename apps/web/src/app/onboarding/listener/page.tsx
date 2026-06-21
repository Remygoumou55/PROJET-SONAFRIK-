import { ListenerOnboardingClient } from './ListenerOnboardingClient'

export default function ListenerOnboardingPage() {
  const bypassAuth = process.env.BYPASS_AUTH === 'true'
  return <ListenerOnboardingClient bypassAuth={bypassAuth} />
}
