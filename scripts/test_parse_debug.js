// Self-contained parser to avoid importing TypeScript module in Node ESM environment
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
	if (typeof amountStr === 'number') return amountStr;
	if (!amountStr) return 0;
	const cleaned = String(amountStr).replace(/[₹$€£,\s]/g, '').replace(/\(/g, '-').replace(/\)/g, '').trim();
	const a = parseFloat(cleaned);
	return isNaN(a) ? 0 : a;
}

const lines = csv.split(/\r?\n/).filter(l => l.trim());
const headers = splitCSVLine(lines[0]);
const findIndex = (col) => {
	const n = headers.map(h => h.toLowerCase().trim());
	for (let i=0;i<n.length;i++) if (n[i].includes(col)) return i;
	return -1;
}

const dateIdx = findIndex('date');
const descIdx = findIndex('description');
const debitIdx = findIndex('debit');
const creditIdx = findIndex('credit');
const typeIdx = findIndex('type');
const amountIdx = findIndex('amount');

const transactions = [];
for (let i = 1; i < lines.length; i++) {
	const vals = splitCSVLine(lines[i]);
	const dateStr = vals[dateIdx];
	const description = vals[descIdx];
	if (!dateStr || !description) continue;

	let amount = 0;
	let type = 'expense';

	if (debitIdx !== -1 || creditIdx !== -1) {
		const debitAmount = debitIdx !== -1 ? Math.abs(parseAmount(vals[debitIdx])) : 0;
		const creditAmount = creditIdx !== -1 ? Math.abs(parseAmount(vals[creditIdx])) : 0;
		if (debitAmount > 0 && creditAmount > 0) {
			if (debitAmount >= creditAmount) { amount = debitAmount; type = 'expense'; }
			else { amount = creditAmount; type = 'income'; }
		} else if (debitAmount > 0) { amount = debitAmount; type = 'expense'; }
		else if (creditAmount > 0) { amount = creditAmount; type = 'income'; }
	} else if (amountIdx !== -1) {
		const raw = vals[amountIdx];
		const signed = parseAmount(raw);
		amount = Math.abs(signed);
		if (signed > 0) type = 'income';
		else if (signed < 0) type = 'expense';
		else {
			// fallback heuristics
			if (/salary|credit|deposit|received|refund|interest|payment|freelance|invoice|commission|receipt|credited/i.test(description)) type = 'income';
			else type = 'expense';
		}
	}

	transactions.push({ date: dateStr, description, amount, type, raw: vals });
}

console.log('Total transactions:', transactions.length);
const salaryRows = transactions.filter(t => /salary/i.test(t.description));
console.log('Salary rows debug:');
salaryRows.forEach(r => console.log({ date: r.date, description: r.description, amount: r.amount, type: r.type }));
console.log('\nFirst 8 rows:');
transactions.slice(0,8).forEach(r => console.log({d:r.date,desc:r.description,amt:r.amount,type:r.type}));
