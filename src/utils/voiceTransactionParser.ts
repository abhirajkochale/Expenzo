import { aiService } from '@/services/aiService';

export interface VoiceParsedTransaction {
  amount: number | null;
  type: 'income' | 'expense' | null;
  category: string | null; // Must map to CategoryType later
  merchant: string | null;
  description: string;
  date: string | null; // ISO Date YYYY-MM-DD
  paymentMethod: string | null;
  confidence: number;
}

export async function parseVoiceTransaction(transcript: string): Promise<VoiceParsedTransaction> {
  const currentDate = new Date().toISOString().split('T')[0];

  const formatPrompt = `
You are a financial transaction extraction AI. Extract the details from the user's spoken voice transcript.
The user might speak in English, Hindi, or a mix of both (Hinglish).

Voice Transcript: "${transcript}"
Current Date (today): ${currentDate}

Extract the following data as a pure JSON object WITHOUT markdown blocks:
{
  "amount": number (positive integer/float, or null if not found),
  "type": "expense" | "income" (default to expense if unclear),
  "category": (Pick EXACTLY ONE from: food, rent, shopping, travel, subscriptions, entertainment, healthcare, education, utilities, transport, salary, investment, other),
  "merchant": string (The name of the store, person, or app, e.g. "Swiggy", "Amazon", "Rahul", or null),
  "description": string (A clean, short 3-5 word description of what was bought/earned),
  "date": "YYYY-MM-DD" (Resolve relative dates like "yesterday", "kal", "last Friday" based on the current date provided. Default to current date if no date is mentioned),
  "paymentMethod": "UPI" | "Card" | "NetBanking" | "Cash" | "Other" (or null if not mentioned),
  "confidence": number (1-100 based on how clear the extraction was)
}

Rules:
- Translate Hindi words automatically (e.g. "khana" -> food, "kal" -> yesterday).
- Return ONLY the raw JSON string. Do not use \`\`\`json.
`;

  try {
    const rawResponse = await aiService.generateText(formatPrompt);
    // Strip markdown blocks if Gemini accidentally includes them
    const cleanJson = rawResponse.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    
    const parsed = JSON.parse(cleanJson);
    
    return {
      amount: parsed.amount || 0,
      type: parsed.type || 'expense',
      category: parsed.category || 'other',
      merchant: parsed.merchant || '',
      description: parsed.description || transcript, // Fallback to raw transcript if missing
      date: parsed.date || currentDate,
      paymentMethod: parsed.paymentMethod || 'Other',
      confidence: parsed.confidence || 50,
    };
  } catch (error) {
    console.error("Failed to parse voice transcript with AI:", error);
    throw new Error("Could not understand the transaction details. Please try again.");
  }
}
