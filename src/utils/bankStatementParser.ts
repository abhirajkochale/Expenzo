import * as XLSX from 'xlsx';
import { CategoryType } from '@/types/types';
import { extractTextFromPDF } from './pdfUtils';
import { aiService } from '@/services/aiService';

/* ===================== TYPES ===================== */

export interface ParsedBankTransaction {
  date: string; // ISO format YYYY-MM-DD
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
  method?: 'regex' | 'ai';
}

/* ===================== HELPER FUNCTIONS ===================== */

// Helper: Split long text into smaller chunks (avoids AI output limits)
function chunkTextByLines(text: string, linesPerChunk: number = 80): string[] {
  const lines = text.split('\n');
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += linesPerChunk) {
    chunks.push(lines.slice(i, i + linesPerChunk).join('\n'));
  }
  return chunks;
}

// Helper: The "Firewall" to clean AI garbage
function validateAndCleanAIOutput(rawTransactions: any[]): ParsedBankTransaction[] {
  if (!Array.isArray(rawTransactions)) return [];

  return rawTransactions
    .map((txn): ParsedBankTransaction | null => {
      // 1. Clean Amount
      let amount = typeof txn.amount === 'string' 
        ? parseFloat(txn.amount.replace(/[^0-9.-]/g, '')) 
        : txn.amount;
      
      // 2. Clean Date (DD-MM-YYYY)
      let date = txn.date;
      const indDateMatch = typeof date === 'string' && date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      
      if (indDateMatch) {
        // Convert to YYYY-MM-DD
        const day = indDateMatch[1].padStart(2, '0');
        const month = indDateMatch[2].padStart(2, '0');
        const year = indDateMatch[3];
        date = `${year}-${month}-${day}`;
      } else if (!date || isNaN(Date.parse(date))) {
        return null; // Skip invalid dates
      }

      // 3. Determine Type (STRICT FIX FOR PDF)
      let rawType = (txn.type || '').toLowerCase().trim();
      let type: 'income' | 'expense';

      // Explicitly map common "Debit" words to "expense"
      if (['debit', 'dr', 'withdrawal', 'expense', 'out', 'payment'].includes(rawType)) {
        type = 'expense';
      } 
      // Explicitly map common "Credit" words to "income"
      else if (['credit', 'cr', 'deposit', 'income', 'in', 'salary'].includes(rawType)) {
        type = 'income';
      } 
      // Fallback: If AI didn't give a clear type, check if amount is negative
      else {
        type = amount < 0 ? 'expense' : 'income';
      }
      
      // Ensure amount is always positive for the database (type handles logic)
      amount = Math.abs(amount);

      // 4. Return strictly typed object
      return {
        date: date, 
        description: txn.description || "Unknown",
        amount: amount || 0,
        type: type,
        merchant: txn.merchant || "Unknown",
        category: (txn.category || "other") as any, 
        debug: { original: txn }
      };
    })
    .filter((t): t is ParsedBankTransaction => t !== null && t.amount > 0);
}

/* ===================== AI PARSER (CHUNKED) ===================== */

async function parseWithAI(rawText: string): Promise<BankStatementParseResult> {
  try {
    const chunks = chunkTextByLines(rawText, 80); 
    console.log(`Splitting file into ${chunks.length} chunks to ensure 100% accuracy...`);

    let allTransactions: ParsedBankTransaction[] = [];
    
    const promises = chunks.map(async (chunk, index) => {
        // UPDATED PROMPT: Explicit instructions for Type
        const prompt = `
          You are a strict data extraction engine.
          Extract transactions from this partial bank statement text.
          
          RULES:
          1. Return JSON Array ONLY.
          2. Date format: DD-MM-YYYY.
          3. Amount: Number only.
          4. Type: MUST be either "income" or "expense".
             - If text says "Debit", "Dr", "Withdrawal" -> Type is "expense".
             - If text says "Credit", "Cr", "Deposit" -> Type is "income".
          5. Ignore headers/footers.
          
          RAW TEXT PART (${index + 1}/${chunks.length}):
          ${chunk}
        `;

        try {
            const response = await aiService.generateText(prompt);
            const cleanJson = response.replace(/```json|```/g, '').trim();
            
            let data;
            try { 
                data = JSON.parse(cleanJson); 
            } catch (e) {
                const arrayMatch = cleanJson.match(/\[.*\]/s);
                if (arrayMatch) data = JSON.parse(arrayMatch[0]);
            }

            if (Array.isArray(data) || (data && Array.isArray(data.transactions))) {
                const rawList = Array.isArray(data) ? data : data.transactions;
                return validateAndCleanAIOutput(rawList);
            }
            return [];
        } catch (err) {
            console.warn(`Chunk ${index} failed:`, err);
            return [];
        }
    });

    const results = await Promise.all(promises);
    results.forEach(chunkTxns => allTransactions.push(...chunkTxns));

    return {
      transactions: allTransactions,
      success: allTransactions.length > 0,
      totalTransactions: allTransactions.length,
      method: 'ai'
    };

  } catch (error: any) {
    console.error("AI Parse Critical Error", error);
    return { transactions: [], success: false, error: error.message, totalTransactions: 0 };
  }
}

/* ===================== STANDARD PARSERS (CSV/Excel) ===================== */

const normalize = (s: string) => s.toLowerCase().trim().replace(/[_\s]+/g, ' ');

const parseDate = (value: string): string => {
  if (!value) return new Date().toISOString().split('T')[0];

  const indDateMatch = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (indDateMatch) {
    const day = indDateMatch[1].padStart(2, '0');
    const month = indDateMatch[2].padStart(2, '0');
    const year = indDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  const d = new Date(value);
  return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
};

const parseAmount = (value: string | number): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  
  let clean = String(value).replace(/[₹,$\s]/g, '');
  if (clean.includes('(') && clean.includes(')')) {
    clean = '-' + clean.replace(/[()]/g, '');
  }
  
  const parsed = parseFloat(clean.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed; 
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
  if (/swiggy|zomato|food|restaurant|cafe|mcdonalds|starbucks|dominos|pizza|burger|tea|canteen/.test(d)) return 'food';
  if (/uber|ola|petrol|fuel|transport|metro|rail|flight|irctc|fastag|bus|auto|fare/.test(d)) return 'transport';
  if (/amazon|flipkart|shopping|store|mart|myntra|zudio|uniqlo|blinkit|zepto|stationery|book/.test(d)) return 'shopping';
  if (/electricity|water|internet|mobile|jio|airtel|bsnl|broadband|netflix|spotify|recharge/.test(d)) return 'utilities';
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

        if (c > 0) { 
            amount = c; 
            type = 'income'; 
        } else if (d > 0) { 
            amount = d; 
            type = 'expense'; 
        }
      } 
      else if (amtIdx !== -1) {
        amount = Math.abs(parseAmount(cols[amtIdx]));
        type = parseAmount(cols[amtIdx]) < 0 ? 'expense' : 'income';
      }

      if (amount === 0) continue;

      transactions.push({
        date: parseDate(cols[dateIdx]),
        description: cols[descIdx] || 'Transaction',
        amount,
        type,
        category: autoCategorize(cols[descIdx] || ''),
        merchant: cols[descIdx]?.split(/[-/]/)[0]?.trim() || 'Unknown',
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

  if (file.name.endsWith('.csv')) {
    rawText = await file.text();
    result = parseCSV(rawText);
  } 
  else if (file.name.match(/\.xlsx?$/)) {
    result = await parseExcel(file);
  }
  else if (file.type === 'application/pdf') {
    console.log("PDF Detected. Extracting text...");
    try {
        rawText = await extractTextFromPDF(file);
    } catch (e) {
        console.error("PDF text extraction failed", e);
    }
  }

  // AI Fallback
  if (file.type === 'application/pdf' || (result.totalTransactions === 0)) {
    console.log("Standard parser failed or PDF detected. Attempting AI parse...");
    
    if (!rawText && file.name.endsWith('.csv')) {
       rawText = await file.text();
    }

    if (rawText && rawText.length > 50) {
      const aiResult = await parseWithAI(rawText);
      if (aiResult.success && aiResult.totalTransactions > 0) {
        return aiResult;
      }
    }
  }

  return result;
}