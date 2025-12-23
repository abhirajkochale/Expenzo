-- Function to create welcome notification for new users
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, level)
  VALUES (
    NEW.user_id,
    'Welcome to Spending Guardian! 👋',
    'Start by adding your first transaction or setting up a budget to track your spending.',
    'info'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create welcome notification
DROP TRIGGER IF EXISTS trigger_welcome_notification ON profiles;
CREATE TRIGGER trigger_welcome_notification
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();