-- Add payment_mode column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_mode TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN transactions.payment_mode IS 'Payment method used for the transaction (e.g., UPI, Card, Cash, Net Banking)';