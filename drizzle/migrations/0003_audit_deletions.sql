CREATE OR REPLACE FUNCTION public.tg_audit_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log(org_id, actor_id, action, entity_id)
  VALUES (OLD.org_id, auth.uid(), 'deleted ' || TG_TABLE_NAME || ': ' || left(to_jsonb(OLD)::text, 4000), OLD.id);
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS audit_delete ON public.cascades;
CREATE TRIGGER audit_delete BEFORE DELETE ON public.cascades FOR EACH ROW EXECUTE FUNCTION public.tg_audit_delete();
DROP TRIGGER IF EXISTS audit_delete ON public.cascade_responses;
CREATE TRIGGER audit_delete BEFORE DELETE ON public.cascade_responses FOR EACH ROW EXECUTE FUNCTION public.tg_audit_delete();
DROP TRIGGER IF EXISTS audit_delete ON public.org_members;
CREATE TRIGGER audit_delete BEFORE DELETE ON public.org_members FOR EACH ROW EXECUTE FUNCTION public.tg_audit_delete();
DROP TRIGGER IF EXISTS audit_delete ON public.cascade_attachments;
CREATE TRIGGER audit_delete BEFORE DELETE ON public.cascade_attachments FOR EACH ROW EXECUTE FUNCTION public.tg_audit_delete();