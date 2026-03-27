import axios from "axios"
import { AppError } from "../errors/AppError.js"
import { requireEnv } from "../utils/env.js"

const HIGHLEVEL_SEARCH_URL = "https://services.leadconnectorhq.com/contacts/search"
const FIRST_PAYMENT_FIELD_ID = "KRR9RneAdX2BA6kdT60Z"
const MIN_PAYMENT_AMOUNT = 160

type HighLevelCustomField = {
  id: string
  value: string
}

type HighLevelContact = {
  id: string
  customFields: HighLevelCustomField[]
}

type HighLevelSearchResponse = {
  contacts: HighLevelContact[]
}

type VerificationResult = {
  verified: boolean
  highlevel_id: string
}

/**
 * Searches HighLevel CRM for a contact matching the given email and checks
 * whether they have a first_payment custom field value exceeding the minimum threshold.
 *
 * @throws {AppError} 502 `SUBSCRIPTION_CHECK_FAILED` - HighLevel API call failed.
 * @returns {VerificationResult} Whether the user is subscribed and their HL ID
 */
export default async function emailHasOffer(email: string): Promise<VerificationResult> {
  const apiKey = requireEnv("HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN")
  const locationId = requireEnv("HIGHLEVEL_SUBACCOUNT_LOCATION_ID")

  let contacts: HighLevelContact[]

  try {
    const response = await axios.post<HighLevelSearchResponse>(
      HIGHLEVEL_SEARCH_URL,
      { locationId, pageLimit: 10, query: email },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          Version: "2021-07-28",
        },
      },
    )
    contacts = response.data.contacts
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[verifySubscription] HighLevel API request failed:", message)
    throw new AppError({ statusCode: 502, code: "SUBSCRIPTION_CHECK_FAILED", message: "Failed to verify subscription" })
  }

  if (!contacts || contacts.length === 0) {
    console.warn(`No contacts found for ${email}`);
    return { verified: false, highlevel_id: "" }
  }

  for (const contact of contacts) {
    if (!contact.customFields) {
      console.warn(`No custom fields available for contact with email ${email}`);
      continue
    }

    const paymentField = contact.customFields.find((field) => field.id === FIRST_PAYMENT_FIELD_ID)
    if (!paymentField) {
      console.warn(`No first payment field for contact with email ${email}`);
      continue
    }

    const paymentAmount = Number(paymentField.value)
    if (Number.isNaN(paymentAmount)) {
      console.warn(`Value of payment field for email ${email} is not a valid number`);
      continue
    }

    if (paymentAmount > MIN_PAYMENT_AMOUNT) {
      return { verified: true, highlevel_id: contact.id }
    }
    console.warn(`Contact with email ${email} does not pass payment criteria`);
  }

  return { verified: false, highlevel_id: "" }
}
