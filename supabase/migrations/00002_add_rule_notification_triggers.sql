-- Function to check budget threshold rules and create notifications
CREATE OR REPLACE FUNCTION check_budget_threshold_rules()
RETURNS TRIGGER AS $$
DECLARE
  rule_record RECORD;
  budget_record RECORD;
  category_spend NUMERIC;
  threshold_amount NUMERIC;
  percentage_used NUMERIC;
BEGIN
  -- Loop through active budget_threshold rules for this user
  FOR rule_record IN 
    SELECT * FROM rules 
    WHERE user_id = NEW.user_id 
    AND rule_type = 'budget_threshold'::rule_type
    AND is_active = true
  LOOP
    -- Get the category from rule params
    IF (rule_record.params->>'category') IS NOT NULL THEN
      -- Check specific category
      IF NEW.category = (rule_record.params->>'category') THEN
        -- Get budget for this category
        SELECT * INTO budget_record 
        FROM budgets 
        WHERE user_id = NEW.user_id 
        AND category = NEW.category
        AND period_start <= NEW.date 
        AND period_end >= NEW.date
        LIMIT 1;
        
        IF budget_record.id IS NOT NULL THEN
          -- Calculate current spending for this category
          SELECT COALESCE(SUM(amount), 0) INTO category_spend
          FROM transactions
          WHERE user_id = NEW.user_id
          AND category = NEW.category
          AND type = 'expense'
          AND date >= budget_record.period_start
          AND date <= budget_record.period_end;
          
          -- Calculate threshold amount
          threshold_amount := budget_record.amount * (COALESCE((rule_record.params->>'threshold')::NUMERIC, 80) / 100);
          percentage_used := (category_spend / budget_record.amount) * 100;
          
          -- Create notification if threshold exceeded
          IF category_spend >= threshold_amount THEN
            INSERT INTO notifications (user_id, title, body, level)
            VALUES (
              NEW.user_id,
              'Budget Alert: ' || NEW.category,
              'You have spent ₹' || category_spend || ' (' || ROUND(percentage_used, 0) || '%) of your ₹' || budget_record.amount || ' budget for ' || NEW.category,
              CASE 
                WHEN percentage_used >= 100 THEN 'error'
                WHEN percentage_used >= 90 THEN 'warning'
                ELSE 'info'
              END
            )
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check budget rules after transaction insert
DROP TRIGGER IF EXISTS trigger_check_budget_rules ON transactions;
CREATE TRIGGER trigger_check_budget_rules
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.type = 'expense')
  EXECUTE FUNCTION check_budget_threshold_rules();

-- Function to create notification when goal is completed
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if goal just reached target
  IF NEW.current_amount >= NEW.target_amount AND (OLD.current_amount IS NULL OR OLD.current_amount < OLD.target_amount) THEN
    INSERT INTO notifications (user_id, title, body, level)
    VALUES (
      NEW.user_id,
      '🎉 Goal Completed!',
      'Congratulations! You have reached your goal: ' || NEW.name,
      'success'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for goal completion
DROP TRIGGER IF EXISTS trigger_goal_completion ON goals;
CREATE TRIGGER trigger_goal_completion
  AFTER UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION check_goal_completion();