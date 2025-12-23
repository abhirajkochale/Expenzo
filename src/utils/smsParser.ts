import { CategoryType } from '@/types/types';
import { aiService } from '@/services/aiService';

export interface ParsedSMSData {
  amount: number;
  merchant: string;
  paymentMethod: string;
  transactionType: 'income' | 'expense';
  category: CategoryType;
  description: string;
  confidence: number;
  date?: string;
}

// --- 1. AI PARSER ---
export async function parseSMSWithAI(smsText: string): Promise<ParsedSMSData> {
  const prompt = `
    Analyze this Indian banking/UPI SMS and extract transaction details into JSON.
    
    SMS: "${smsText}"
    
    RULES:
    1. Extract 'amount' (number). Remove ₹/Rs/INR.
    2. Identify 'merchant'. If unknown, use "Unknown".
    3. Determine 'transactionType' ("income" or "expense").
    4. 'category': food, transport, shopping, entertainment, utilities, healthcare, rent, education, salary, freelance, investment, other.
    5. 'paymentMethod': UPI, Card, NetBanking, ATM, or Other.
    6. 'date': Extract date as YYYY-MM-DD. If strictly not found, return null.
    7. 'confidence': 0-100 score.

    Example JSON:
    { "amount": 450, "merchant": "Swiggy", "transactionType": "expense", "category": "food", "paymentMethod": "UPI", "date": "2025-12-25", "confidence": 95 }
  `;

  try {
    const jsonStr = await aiService.generateText(prompt);
    const cleanJson = jsonStr.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      amount: Number(parsed.amount) || 0,
      merchant: parsed.merchant || 'Unknown',
      paymentMethod: parsed.paymentMethod || 'Other',
      transactionType: parsed.transactionType || 'expense',
      category: (parsed.category as CategoryType) || 'other',
      description: parsed.description || `${parsed.merchant} (${parsed.category})`,
      confidence: parsed.confidence || 0,
      date: parsed.date || undefined
    };
  } catch (error) {
    console.error('AI SMS Parse Failed:', error);
    throw error;
  }
}

// --- 2. FALLBACK PARSER ---
export function parseSMSFallback(smsText: string): ParsedSMSData {
  const text = smsText.toLowerCase();
  
  let amount = 0;
  const amountMatch = text.match(/(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) || 
                      text.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i);
  
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  let transactionType: 'income' | 'expense' = 'expense';
  if (/credited|received|deposited|refund|salary/.test(text)) {
    transactionType = 'income';
  }

  let merchant = 'Unknown';
  const merchantMatch = text.match(/(?:at|to|from|via)\s+([A-Za-z0-9\s]+?)(?:\s+(?:on|using|for|txn)|\.|$)/i);
  if (merchantMatch) merchant = merchantMatch[1].trim();

  let category: CategoryType = 'other';
  if (/swiggy|zomato|food/.test(text)) category = 'food';
  else if (/uber|ola|transport/.test(text)) category = 'transport';

  return {
    amount,
    merchant,
    paymentMethod: text.includes('upi') ? 'UPI' : 'Card',
    transactionType,
    category,
    description: merchant !== 'Unknown' ? merchant : 'Transaction',
    confidence: amount > 0 ? 40 : 0,
    date: undefined
  };
}

// --- 3. MAIN FUNCTION ---
export async function parseSMS(text: string): Promise<ParsedSMSData> {
  try {
    const aiResult = await parseSMSWithAI(text);
    if (aiResult.amount > 0 && aiResult.merchant !== 'Unknown') {
      return aiResult;
    }
  } catch (e) {
    // Silent fail
  }
  return parseSMSFallback(text);
}