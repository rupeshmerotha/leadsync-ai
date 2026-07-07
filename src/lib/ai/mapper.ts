import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY || "PLACEHOLDER_API_KEY";

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

const SYSTEM_INSTRUCTION = `
You are an expert AI data mapper. Your task is to receive an array of arbitrary JSON objects (representing rows parsed from a CSV file) and map them intelligently into a strict CRM schema.

The input data will have arbitrary and unpredictable keys. You must infer the semantic meaning of each column name and its value to map it to the target fields. 
For example: 'Full Name', 'Customer', 'Client Name', 'Prospect', 'Lead Name' should map to 'name'.
'Phone', 'Mobile', 'Cell', 'Contact' should map to 'mobile' (split into country_code and mobile_without_country_code if possible).
'Email Address', 'Mail', 'Email ID' should map to 'email'.
'Comments', 'Remarks', 'Notes' should map to 'crm_note'.
'Sales Owner', 'Assigned To', 'Owner' should map to 'lead_owner'.

CRITICAL RULES:
1. Extract as many fields as possible. Leave missing fields empty string "". Never hallucinate or invent data.
2. CRM Status Values: Only use one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE. If unknown, leave it blank "".
3. Data Source Values: Only use one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. If none match confidently, leave it blank "".
4. Date Format: 'created_at' must be convertible using JavaScript: new Date(created_at). If none exists, leave empty.
5. CRM Notes ('crm_note'): Use for Remarks, Follow-up notes, Additional comments, Extra phone numbers, Extra email addresses, and any useful information that doesn't fit another field.
6. Multiple Emails or Mobile Numbers: If multiple emails exist, use the first email for 'email' and append remaining emails into 'crm_note'. If multiple mobile numbers exist, use the first mobile and append remaining numbers into 'crm_note'.
7. Escape Line Breaks: Each record's string values must avoid unintended line breaks. If line breaks are necessary, escape them appropriately (e.g. \n) so the output data remains perfectly valid on a single CSV row when exported later.
8. Structure: The output MUST be a valid JSON array of objects following the strict CRM schema exactly. The length of the output array MUST exactly match the length of the input array.
9. Return ONLY a JSON object containing a "records" array. No markdown wrapping or other text.

The exact keys every record MUST contain are:
"created_at", "name", "email", "country_code", "mobile_without_country_code", "company", "city", "state", "country", "lead_owner", "crm_status", "crm_note", "data_source", "possession_time", "description"

Example structure to return: { "records": [ { "created_at": "", "name": "", "email": "", "country_code": "", "mobile_without_country_code": "", "company": "", "city": "", "state": "", "country": "", "lead_owner": "", "crm_status": "", "crm_note": "", "data_source": "", "possession_time": "", "description": "" } ] }
`;

export async function processBatch(batch: Record<string, string>[]): Promise<CRMRecord[]> {
  if (apiKey === "PLACEHOLDER_API_KEY") {
    // Simulated fallback if no API key is provided
    console.warn("Using placeholder API key. Simulating OpenAI AI response.");
    return batch.map(row => {
      const getVal = (keys: string[]) => {
        const found = Object.keys(row).find(k => keys.some(key => k.toLowerCase().includes(key)));
        return found ? row[found] : "";
      };

      const email = getVal(["email", "mail"]);
      const mobile = getVal(["phone", "mobile", "cell", "contact"]);

      return {
        created_at: new Date().toISOString(),
        name: getVal(["name", "customer", "client", "prospect"]),
        email: email,
        country_code: "",
        mobile_without_country_code: mobile,
        company: getVal(["company", "org"]),
        city: getVal(["city"]),
        state: getVal(["state"]),
        country: getVal(["country"]),
        lead_owner: getVal(["owner", "assigned", "sales"]),
        crm_status: "",
        crm_note: getVal(["note", "comment", "remark"]),
        data_source: "",
        possession_time: "",
        description: getVal(["desc"])
      };
    });
  }

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Groq's fast Llama 3.3 model
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: JSON.stringify(batch) }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const resultText = response.choices[0]?.message?.content;
      if (!resultText) {
        throw new Error("Empty response from AI");
      }

      const parsed = JSON.parse(resultText);
      return parsed.records as CRMRecord[];
    } catch (error) {
      attempt++;
      console.error(`Error calling API (Attempt ${attempt}/${MAX_RETRIES}):`, error);
      if (attempt >= MAX_RETRIES) {
        throw error;
      }
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error("Batch processing failed after maximum retries.");
}
