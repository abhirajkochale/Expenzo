import * as XLSX from 'xlsx';
import { CategoryType } from '@/types/types';
import { extractTextFromPDF } from './pdfUtils';
import { aiService } from '@/services/aiService'; // Assuming you have this from the Chatbot

/* ===================== TYPES ===================== */

export interface ParsedBankTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  merchant?: string;
  category?: CategoryType;
  debug?: Record<string, unknown>;
}

export interface BankStatementParseResult {
  transactions: ParsedBankTransaction[];
  success: boolean;
  error?: string;
  totalTransactions: number;
  method?: 'regex' | 'ai'; // To let UI know how it was parsed
}

/* ===================== AI PARSER ===================== */

async function parseWithAI(rawText: string): Promise<BankStatementParseResult> {
  try {
    const prompt = `
      You are a financial data extraction engine. I will provide raw text from a bank statement (PDF/CSV).
      
      YOUR TASK:
      Extract every financial transaction into a JSON array.
      
      RULES:
      1. Ignore headers, footers, page numbers, and opening/closing balances.
      2. For 'date', use YYYY-MM-DD format.
      3. For 'amount', return a positive number.
      4. For 'type', determine 'income' (credit/deposit) or 'expense' (debit/withdrawal).
      5. For 'category', choose from: food, transport, shopping, utilities, rent, healthcare, investment, salary, other.
      6. For 'merchant', extract the clean name (e.g., "UPI-SWIGGY-123" -> "Swiggy").
      
      OUTPUT FORMAT:
      Return ONLY a valid JSON string. No markdown formatting.
      [
        { "date": "2023-10-01", "description": "UPI Swiggy", "amount": 450, "type": "expense", "category": "food", "merchant": "Swiggy" }
      ]

      RAW TEXT:
      ${rawText.slice(0, 30000)} // Limit context to avoid errors
    `;

    // Call your AI Service (assuming it returns a string response)
    // You might need to adjust this call based on your actual aiService implementation
    const response = await aiService.generateText(prompt); 
    
    // Clean potential markdown code blocks
    const cleanJson = response.replace(/```json|```/g, '').trim();
    const transactions = JSON.parse(cleanJson);

    return {
      transactions,
      success: true,
      totalTransactions: transactions.length,
      method: 'ai'
    };

  } catch (error) {
    console.error("AI Parse Error", error);
    return { transactions: [], success: false, error: 'AI Parsing failed', totalTransactions: 0 };
  }
}

/* ===================== STANDARD PARSERS (Your existing logic) ===================== */

const normalize = (s: string) => s.toLowerCase().trim().replace(/[_\s]+/g, ' ');

const parseDate = (value: string): string => {
  if (!value) return new Date().toISOString().split('T')[0];
  const d = new Date(value);
  return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
};

const parseAmount = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  let clean = String(value).replace(/[₹,$\s]/g, '');
  if (clean.includes('(') && clean.includes(')')) {
    clean = '-' + clean.replace(/[()]/g, '');
  }
  return parseFloat(clean.replace(/,/g, '')) || 0; 
};

function splitCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

function autoCategorize(description: string): CategoryType {
  const d = description.toLowerCase();
  if (/salary|freelance|interest|credit|deposit|refund|dividend|profit/.test(d)) return 'salary';
  if (/swiggy|zomato|food|restaurant|cafe|mcdonalds|starbucks|dominos|pizza|burger/.test(d)) return 'food';
  if (/uber|ola|petrol|fuel|transport|metro|rail|flight|irctc|fastag/.test(d)) return 'transport';
  if (/amazon|flipkart|shopping|store|mart|myntra|zudio|uniqlo|blinkit|zepto/.test(d)) return 'shopping';
  if (/electricity|water|internet|mobile|jio|airtel|bsnl|broadband|netflix|spotify/.test(d)) return 'utilities';
  if (/rent|emi|loan|housing|landlord|broker/.test(d)) return 'rent';
  if (/hospital|medical|pharmacy|doctor|clinic|lab|health|1mg|apollo/.test(d)) return 'healthcare';
  if (/sip|zerodha|groww|stocks|mutual fund|investment|gold/.test(d)) return 'investment';
  return 'other';
}

export function parseCSV(csv: string): BankStatementParseResult {
  try {
    let rows = csv.split(/\r?\n/).filter(Boolean);
    if (rows.length < 2) return { transactions: [], success: false, error: 'Empty file', totalTransactions: 0 };

    rows = rows.map(row => {
      let clean = row.trim().replace(/,+$/, ''); 
      if (clean.startsWith('"') && clean.endsWith('"') && !clean.slice(1, -1).includes('"')) {
         return clean.slice(1, -1);
      }
      return clean;
    });

    const headers = splitCSVRow(rows[0]).map(h => normalize(h));
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('description') || h.includes('particulars') || h.includes('narration'));
    const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('txn amt'));
    const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal'));
    const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit'));

    // If regex parser can't find basic headers, fail immediately so we can fallback to AI
    if (dateIdx === -1) {
      return { transactions: [], success: false, totalTransactions: 0 };
    }

    const transactions: ParsedBankTransaction[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = splitCSVRow(rows[i]);
      if (cols.length < 2) continue;

      let amount = 0;
      let type: 'income' | 'expense' = 'expense';

      if (debitIdx !== -1 && creditIdx !== -1) {
        const d = parseAmount(cols[debitIdx]);
        const c = parseAmount(cols[creditIdx]);
        if (c > 0) { amount = c; type = 'income'; }
        else if (d > 0) { amount = d; type = 'expense'; }
      } else if (amtIdx !== -1) {
        amount = Math.abs(parseAmount(cols[amtIdx]));
        // Simplified heuristic
        type = parseAmount(cols[amtIdx]) < 0 ? 'expense' : 'income';
      }

      if (amount === 0) continue;

      transactions.push({
        date: parseDate(cols[dateIdx]),
        description: cols[descIdx] || 'Transaction',
        amount,
        type,
        category: autoCategorize(cols[descIdx] || ''),
        merchant: cols[descIdx]?.split('/')[0] || 'Unknown',
        debug: { raw: rows[i] }
      });
    }

    return { transactions, success: true, totalTransactions: transactions.length, method: 'regex' };
  } catch (e: any) {
    return { transactions: [], success: false, error: e.message, totalTransactions: 0 };
  }
}

export function parseExcel(file: File): Promise<BankStatementParseResult> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = e.target?.result;
      if (!data) return resolve({ transactions: [], success: false, totalTransactions: 0 });
      try {
        const wb = XLSX.read(data, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        resolve(parseCSV(csv));
      } catch {
        resolve({ transactions: [], success: false, totalTransactions: 0 });
      }
    };
    reader.readAsBinaryString(file);
  });
}

/* ===================== MAIN PARSE FUNCTION ===================== */

export async function parseBankStatement(file: File): Promise<BankStatementParseResult> {
  let result: BankStatementParseResult = { transactions: [], success: false, totalTransactions: 0 };
  let rawText = '';

  // 1. Attempt standard parsing based on extension
  if (file.name.endsWith('.csv')) {
    rawText = await file.text();
    result = parseCSV(rawText);
  } 
  else if (file.name.match(/\.xlsx?$/)) {
    result = await parseExcel(file);
    // If Excel parse failed to get transactions, we might want to try extracting text for AI, 
    // but Excel binary to text is hard without library. We assume XLSX parser is usually good.
  }
  else if (file.type === 'application/pdf') {
    // 2. Handle PDF
    console.log("PDF Detected. Extracting text...");
    rawText = await extractTextFromPDF(file);
    // Skip regex, go straight to AI for PDFs
  }

  // 3. AI Fallback Logic
  // If it was a PDF, or if CSV/Excel parser returned 0 transactions (complex layout), use AI.
  if (file.type === 'application/pdf' || (result.totalTransactions === 0 && rawText.length > 0)) {
    console.log("Standard parser failed or PDF detected. Attempting AI parse...");
    
    // If we haven't extracted text yet (e.g. it was a CSV that failed Regex), ensure we have text
    if (!rawText && file.name.endsWith('.csv')) {
       rawText = await file.text();
    }

    if (rawText) {
      const aiResult = await parseWithAI(rawText);
      if (aiResult.success && aiResult.totalTransactions > 0) {
        return aiResult;
      }
    }
  }

  return result;
}