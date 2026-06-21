import { ArtistOnboardingClient } from './ArtistOnboardingClient'

export default function ArtistOnboardingPage() {
  const bypassAuth = process.env.BYPASS_AUTH === 'true'
  return <ArtistOnboardingClient bypassAuth={bypassAuth} />
}
