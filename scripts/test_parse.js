const csv = `Date,Description,Amount
2024-01-01,Salary Credit - IT Company,150000
2024-01-03,Freelance Payment,15000
2024-01-06,Interest Credit,1200
2024-01-20,Shopping - Amazon/Flipkart,-1266
2024-01-07,Internet Bill,-995
2024-01-22,Electricity Bill,-2447
2024-01-12,Mobile Recharge,-533
2024-01-22,Grocery Store,-2632
2024-01-14,Petrol Pump,-1111
2024-01-08,Rent,-30917
2024-01-11,ATM Cash Withdrawal,-9046
2024-01-19,Shopping - Amazon/Flipkart,-3908
2024-01-28,ATM Cash Withdrawal,-4323
2024-01-12,Mobile Recharge,-432
2024-01-28,Home EMI,-14483
2024-01-21,Petrol Pump,-1344
2024-01-14,School Fees,-11045
2024-01-19,Internet Bill,-1014
2024-01-07,Grocery Store,-2887
2024-01-13,Electricity Bill,-1774
2024-01-18,Mobile Recharge,-473
2024-01-14,School Fees,-11358
2024-01-21,Petrol Pump,-3048
2024-01-09,ATM Cash Withdrawal,-5850
2024-01-17,Home EMI,-16788
2024-01-14,Medical Expenses,-940
2024-01-08,ATM Cash Withdrawal,-3952
2024-01-16,Grocery Store,-2534
2024-01-09,Shopping - Amazon/Flipkart,-6389
2024-01-09,Medical Expenses,-3802
2024-01-25,UPI - Zomato,-593
2024-01-11,Petrol Pump,-3262
2024-01-21,UPI - Swiggy,-298
2024-01-18,UPI - Zomato,-395
2024-01-20,ATM Cash Withdrawal,-9950
2024-01-28,Internet Bill,-825
2024-01-26,Mobile Recharge,-272
2024-01-10,Medical Expenses,-1030
2024-01-16,Mobile Recharge,-432
2024-01-27,UPI - Zomato,-876
2024-01-22,UPI - Zomato,-380
2024-01-17,School Fees,-6847
2024-01-07,ATM Cash Withdrawal,-3832
2024-01-31,Salary Credit - IT Company,150000
2024-02-02,Freelance Payment,15000
2024-02-05,Interest Credit,1200
2024-02-07,Medical Expenses,-3218
2024-02-13,Petrol Pump,-2108
2024-02-20,UPI - Swiggy,-468
2024-02-11,ATM Cash Withdrawal,-6774
2024-02-21,ATM Cash Withdrawal,-9541
2024-02-22,Home EMI,-13977
2024-02-21,Mobile Recharge,-465
2024-02-08,Shopping - Amazon/Flipkart,-5095
2024-02-27,UPI - Zomato,-701
2024-02-18,Internet Bill,-1159
2024-02-23,UPI - Zomato,-630
2024-02-23,Shopping - Amazon/Flipkart,-3860
2024-02-11,ATM Cash Withdrawal,-6013
2024-02-09,Medical Expenses,-2107`;

function splitCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) { fields.push(cur); cur = ''; } else { cur += char; }
  }
  fields.push(cur);
  return fields.map(f => f.replace(/['"]/g, '').trim());
}

function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const cleaned = String(amountStr).replace(/[₹$€£,\s]/g, '').replace(/\(/g, '-').replace(/\)/g, '').trim();
  const a = parseFloat(cleaned);
  return isNaN(a) ? 0 : Math.abs(a);
}

const lines = csv.split(/\r?\n/).filter(l => l.trim());
const headers = splitCSVLine(lines[0]);
console.log('Headers:', headers);

const findIndex = (col) => {
  const n = headers.map(h => h.toLowerCase().trim());
  for (let i=0;i<n.length;i++) if (n[i].includes(col)) return i;
  return -1;
}

const dateIdx = findIndex('date');
const descIdx = findIndex('description');
const debitIdx = findIndex('debit');
const creditIdx = findIndex('credit');
const amountIdx = findIndex('amount');
console.log({dateIdx, descIdx, debitIdx, creditIdx, amountIdx});

for (let i = 1; i < lines.length; i++) {
  const vals = splitCSVLine(lines[i]);
  const date = vals[dateIdx];
  const desc = vals[descIdx];
  const debit = debitIdx!==-1?parseAmount(vals[debitIdx]):0;
  const credit = creditIdx!==-1?parseAmount(vals[creditIdx]):0;
  let type='expense'; let amount=0;
  if (debit>0 && credit>0) { if (debit>=credit){ amount=debit; type='expense'; } else { amount=credit; type='income'; } }
  else if (debit>0) { amount=debit; type='expense'; }
  else if (credit>0) { amount=credit; type='income'; }
  else { // fallback
    const a = parseAmount(vals[amountIdx]||'');
    amount=a;
    // look for income indicators in description
    if (/salary|credit|deposit|received|refund|interest|payment|freelance|invoice|commission|receipt|credited/i.test(desc)) type='income';
    else type='expense';
  }

  console.log(i, date, desc, '=>', type, amount, `raw debit:'${vals[debitIdx]}' raw credit:'${vals[creditIdx]}'`);
}
