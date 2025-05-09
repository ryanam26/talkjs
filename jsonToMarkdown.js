import fs from 'fs';

const loanData = JSON.parse(fs.readFileSync('loanData.json', 'utf8'));

const fields = [
  { label: 'Loan ID', value: loanData.id },
  { label: 'Borrower', value: loanData.borrowerFullName },
  { label: 'Email', value: loanData.borrowerEmail },
  { label: 'Loan Amount', value: loanData.finalOffer?.amount ? `$${loanData.finalOffer.amount.toLocaleString()}` : 'N/A' },
  { label: 'Interest Rate', value: loanData.finalOffer?.interestRate ? `${(loanData.finalOffer.interestRate * 100).toFixed(2)}%` : 'N/A' },
  { label: 'Property Address', value: loanData.property?.fullAddress || 'N/A' },
  { label: 'Home Valuation', value: loanData.homeValuationVerification?.message || loanData.property?.homeValue || 'N/A' },
  { label: 'Income (annual)', value: loanData.incomeVerification?.annualIncome ? `$${loanData.incomeVerification.annualIncome.toLocaleString()}` : 'N/A' },
  { label: 'Closing Date', value: loanData.scheduleClosingVerification?.date || 'N/A' },
];

let markdown = '| Field | Value |\n|-------|-------|\n';
fields.forEach(f => {
  markdown += `| **${f.label}** | ${f.value} |\n`;
});

fs.writeFileSync('loanData.md', markdown);
console.log(markdown); 