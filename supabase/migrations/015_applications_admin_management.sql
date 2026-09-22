-- =================================================================
-- 015 · Gestão administrativa de candidaturas (applications)
-- -----------------------------------------------------------------
-- O formulário público de inscrição já insere em public.applications
-- (política applications_public_insert). A administração precisa de
-- atualizar o estado de tratamento (PENDING → CONTACTED/APPROVED...)
-- e remover registos duplicados. Leitura administrativa já existe
-- (applications_admin_select).
-- =================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'applications_admin_update'
  ) THEN
    CREATE POLICY applications_admin_update ON public.applications
      FOR UPDATE
      USING (public.get_user_role(auth.uid()) = 'ADMIN')
      WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'applications_admin_delete'
  ) THEN
    CREATE POLICY applications_admin_delete ON public.applications
      FOR DELETE
      USING (public.get_user_role(auth.uid()) = 'ADMIN');
  END IF;
END $$;
