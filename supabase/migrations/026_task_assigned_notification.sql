-- Create a "task_assigned" notification whenever a task is assigned to someone,
-- regardless of which UI created it (Task Management, Board, Projects, or the AI
-- assistant). That notification row then fires the existing send-mobile-push
-- trigger, so the assignee gets a push on their phone.

CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_due TEXT;
BEGIN
  -- Only when there is an assignee, and (on update) only when the assignee changed.
  IF NEW.assignee_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.assignee_id IS NOT DISTINCT FROM OLD.assignee_id THEN
    RETURN NEW;
  END IF;

  -- Don't notify people about tasks they assigned to themselves.
  IF NEW.assignee_id = NEW.created_by THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_sender_name FROM public.profiles WHERE id = NEW.created_by;
  v_sender_name := COALESCE(v_sender_name, 'Your admin');
  v_due := CASE WHEN NEW.deadline IS NOT NULL THEN ' (due ' || NEW.deadline || ')' ELSE '' END;

  INSERT INTO public.notifications (
    recipient_id, sender_id, sender_name, type, title, message,
    task_id, task_title, read
  )
  VALUES (
    NEW.assignee_id,
    NEW.created_by,
    v_sender_name,
    'task_assigned',
    'New Task Assigned',
    v_sender_name || ' assigned you a task: "' || COALESCE(NEW.title, 'Untitled') || '"' || v_due || '.',
    NEW.id,
    NEW.title,
    FALSE
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_assigned_notify ON public.tasks;
CREATE TRIGGER task_assigned_notify
  AFTER INSERT OR UPDATE OF assignee_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned();
