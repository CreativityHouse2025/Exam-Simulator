export type SubscriptionResult = {
  verified: boolean
  highlevel_id: string
}

export default async function verifySubscription(email: string): Promise<SubscriptionResult> {
  // verify user subscription from HL API
  return {
    verified: true,
    highlevel_id: "contact001",
  }
}