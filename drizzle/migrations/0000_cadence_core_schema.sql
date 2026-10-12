CREATE TYPE public.org_role AS ENUM ('owner','admin','manager','member');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  reminder_days_before int NOT NULL DEFAULT 2,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  full_name text,
  title text,
  department text,
  manager_email text,
  role public.org_role NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);
CREATE INDEX idx_org_members_user ON public.org_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_members TO authenticated;
GRANT ALL ON public.org_members TO service_role;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_members WHERE org_id=_org AND user_id=_uid)
$$;
CREATE OR REPLACE FUNCTION public.is_org_admin(_org uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_members WHERE org_id=_org AND user_id=_uid AND role IN ('owner','admin'))
$$;
CREATE OR REPLACE FUNCTION public.my_member_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.org_members WHERE user_id = auth.uid()
$$;

CREATE POLICY "org read" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id, auth.uid()));
CREATE POLICY "org update" ON public.organizations FOR UPDATE TO authenticated USING (public.is_org_admin(id, auth.uid())) WITH CHECK (public.is_org_admin(id, auth.uid()));

CREATE POLICY "members read" ON public.org_members FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "members admin insert" ON public.org_members FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(org_id, auth.uid()) AND role <> 'owner');
CREATE POLICY "members admin update" ON public.org_members FOR UPDATE TO authenticated USING (public.is_org_admin(org_id, auth.uid())) WITH CHECK (public.is_org_admin(org_id, auth.uid()));
CREATE POLICY "members admin delete" ON public.org_members FOR DELETE TO authenticated USING (public.is_org_admin(org_id, auth.uid()) AND role <> 'owner');

CREATE TABLE public.cascades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  talking_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  deadline date,
  status text NOT NULL DEFAULT 'draft',
  audience_departments text[],
  ai_summary jsonb,
  ai_generated_at timestamptz,
  created_by uuid,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cascades_org ON public.cascades(org_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cascades TO authenticated;
GRANT ALL ON public.cascades TO service_role;
ALTER TABLE public.cascades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cascades read" ON public.cascades FOR SELECT TO authenticated USING (
  public.is_org_admin(org_id, auth.uid()) OR (status <> 'draft' AND public.is_org_member(org_id, auth.uid()))
);
CREATE POLICY "cascades admin write" ON public.cascades FOR ALL TO authenticated USING (public.is_org_admin(org_id, auth.uid())) WITH CHECK (public.is_org_admin(org_id, auth.uid()));

CREATE TABLE public.cascade_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cascade_id uuid NOT NULL REFERENCES public.cascades(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.org_members(id) ON DELETE CASCADE,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  shared_at timestamptz,
  share_method text,
  last_nudged_at timestamptz,
  reminder_sent_at timestamptz,
  overdue_sent_at timestamptz,
  UNIQUE (cascade_id, member_id)
);
CREATE INDEX idx_recipients_cascade ON public.cascade_recipients(cascade_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cascade_recipients TO authenticated;
GRANT ALL ON public.cascade_recipients TO service_role;
ALTER TABLE public.cascade_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipients read" ON public.cascade_recipients FOR SELECT TO authenticated USING (
  public.is_org_admin(org_id, auth.uid()) OR member_id IN (SELECT public.my_member_ids())
);
CREATE POLICY "recipients admin write" ON public.cascade_recipients FOR ALL TO authenticated USING (public.is_org_admin(org_id, auth.uid())) WITH CHECK (public.is_org_admin(org_id, auth.uid()));
CREATE POLICY "recipients own update" ON public.cascade_recipients FOR UPDATE TO authenticated USING (member_id IN (SELECT public.my_member_ids())) WITH CHECK (member_id IN (SELECT public.my_member_ids()));

CREATE TABLE public.cascade_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cascade_id uuid NOT NULL REFERENCES public.cascades(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.org_members(id) ON DELETE CASCADE,
  feedback text NOT NULL,
  questions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_responses_cascade ON public.cascade_responses(cascade_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cascade_responses TO authenticated;
GRANT ALL ON public.cascade_responses TO service_role;
ALTER TABLE public.cascade_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responses read" ON public.cascade_responses FOR SELECT TO authenticated USING (
  public.is_org_admin(org_id, auth.uid()) OR member_id IN (SELECT public.my_member_ids())
);
CREATE POLICY "responses insert own" ON public.cascade_responses FOR INSERT TO authenticated WITH CHECK (
  member_id IN (SELECT public.my_member_ids())
  AND EXISTS (SELECT 1 FROM public.cascade_recipients r WHERE r.cascade_id = cascade_responses.cascade_id AND r.member_id = cascade_responses.member_id)
);
CREATE POLICY "responses delete admin" ON public.cascade_responses FOR DELETE TO authenticated USING (public.is_org_admin(org_id, auth.uid()));

CREATE TABLE public.cascade_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cascade_id uuid NOT NULL REFERENCES public.cascades(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cascade_attachments TO authenticated;
GRANT ALL ON public.cascade_attachments TO service_role;
ALTER TABLE public.cascade_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments read" ON public.cascade_attachments FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "attachments admin write" ON public.cascade_attachments FOR ALL TO authenticated USING (public.is_org_admin(org_id, auth.uid())) WITH CHECK (public.is_org_admin(org_id, auth.uid()));

CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  cascade_id uuid REFERENCES public.cascades(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email log admin read" ON public.email_log FOR SELECT TO authenticated USING (public.is_org_admin(org_id, auth.uid()));

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT TO authenticated USING (public.is_org_admin(org_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER tg_cascades_updated BEFORE UPDATE ON public.cascades FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  UPDATE public.org_members SET user_id = NEW.id, status = 'active'
  WHERE user_id IS NULL AND lower(email) = lower(NEW.email);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.claim_my_invites() RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int; e text;
BEGIN
  SELECT email INTO e FROM auth.users WHERE id = auth.uid();
  IF e IS NULL THEN RETURN 0; END IF;
  UPDATE public.org_members SET user_id = auth.uid(), status = 'active'
  WHERE user_id IS NULL AND lower(email) = lower(e);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_my_invites() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_my_invites() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_organization(_name text, _full_name text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid; e text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF length(trim(coalesce(_name,''))) = 0 THEN RAISE EXCEPTION 'Name required'; END IF;
  SELECT email INTO e FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.organizations (name, created_by) VALUES (trim(_name), auth.uid()) RETURNING id INTO new_id;
  INSERT INTO public.org_members (org_id, user_id, email, full_name, role, status)
  VALUES (new_id, auth.uid(), lower(e), _full_name, 'owner', 'active');
  RETURN new_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_organization(text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;

CREATE POLICY "attachments obj read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'attachments' AND public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid())
);
CREATE POLICY "attachments obj write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'attachments' AND public.is_org_admin(((storage.foldername(name))[1])::uuid, auth.uid())
);
CREATE POLICY "attachments obj delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'attachments' AND public.is_org_admin(((storage.foldername(name))[1])::uuid, auth.uid())
);