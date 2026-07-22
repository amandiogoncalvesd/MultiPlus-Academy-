-- =============================================================
-- 006: Segurança por papel, curso e matrícula
--
-- Regras principais:
--   * cadastro público cria somente ALUNO;
--   * aluno não cria/remove matrícula;
--   * professor só gere os próprios cursos e os seus alunos;
--   * dados de utilizadores/perfis deixam de ser públicos;
--   * aulas recebem janela explícita de disponibilidade.
-- =============================================================

-- -----------------------------------------------------------------
-- 1. Helpers de autorização (usados por policies e RPCs)
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_course_manager(p_course_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.get_user_role(p_user_id) = 'ADMIN'
      OR EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = p_course_id
          AND c.teacher_id = p_user_id
      );
$$;

CREATE OR REPLACE FUNCTION public.is_course_student(p_course_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = p_course_id
      AND e.student_id = p_user_id
      AND e.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.teacher_has_student(p_teacher_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.courses c
    JOIN public.enrollments e ON e.course_id = c.id AND e.status = 'ACTIVE'
    WHERE c.teacher_id = p_teacher_id
      AND e.student_id = p_student_id
  );
$$;

-- Impede que um utilizador normal altere o próprio papel ou estado por
-- uma chamada direta ao cliente. Admin e service role continuam com o
-- fluxo administrativo autorizado.
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id
     AND public.get_user_role(auth.uid()) <> 'ADMIN'
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'Não é permitido alterar o próprio papel ou estado da conta';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_privilege_escalation ON public.users;
CREATE TRIGGER trg_prevent_self_privilege_escalation
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_privilege_escalation();

-- O trigger de Auth é a autoridade para perfis recém-criados. Nunca lê
-- `role` de user_metadata enviado pelo browser.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, nome_completo, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'nome_completo'), ''),
      NULLIF(trim(concat_ws(' ', NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'lastName')), ''),
      NEW.email
    ),
    'ALUNO',
    'ACTIVE'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------
-- 2. Janela acadêmica de acesso à aula
-- -----------------------------------------------------------------
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS access_starts_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS access_ends_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS allow_replay_after_end BOOLEAN NOT NULL DEFAULT false;

-- Preserva a semântica de aulas antigas: a antiga data de agendamento se
-- torna a data de início. O fim será definido pelo professor na nova UI.
UPDATE public.lessons
SET access_starts_at = scheduled_at
WHERE access_starts_at IS NULL
  AND scheduled_at IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_access_window_check'
      AND conrelid = 'public.lessons'::regclass
  ) THEN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_access_window_check
      CHECK (
        access_ends_at IS NULL
        OR access_starts_at IS NULL
        OR access_ends_at > access_starts_at
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lessons_access_window
  ON public.lessons(course_id, status, access_starts_at, access_ends_at);

-- -----------------------------------------------------------------
-- 3. Usuários e perfis privados
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir leitura de utilizadores para todos" ON public.users;
DROP POLICY IF EXISTS "Permitir insercao da propria conta auth" ON public.users;
DROP POLICY IF EXISTS "Permitir atualizacao da propria conta ou administrador" ON public.users;
DROP POLICY IF EXISTS "Permitir remocao total para admins" ON public.users;

CREATE POLICY users_select_scoped ON public.users FOR SELECT
USING (
  auth.uid() = id
  OR public.get_user_role(auth.uid()) = 'ADMIN'
  OR public.teacher_has_student(auth.uid(), id)
  OR (
    role = 'PROFESSOR'
    AND EXISTS (
      SELECT 1
      FROM public.courses c
      JOIN public.enrollments e ON e.course_id = c.id AND e.status = 'ACTIVE'
      WHERE c.teacher_id = users.id
        AND e.student_id = auth.uid()
    )
  )
);

CREATE POLICY users_insert_own_student ON public.users FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND role = 'ALUNO'
  AND status = 'ACTIVE'
);

CREATE POLICY users_update_self_or_admin ON public.users FOR UPDATE
USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'ADMIN')
WITH CHECK (auth.uid() = id OR public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY users_delete_admin ON public.users FOR DELETE
USING (public.get_user_role(auth.uid()) = 'ADMIN');

DROP POLICY IF EXISTS "Leitura livre de perfis academicos" ON public.profiles;
DROP POLICY IF EXISTS "Insercao de perfil proprio" ON public.profiles;
DROP POLICY IF EXISTS "Atualizacao de perfil de si proprio ou por admin" ON public.profiles;
DROP POLICY IF EXISTS "Remocao de perfis por admin" ON public.profiles;

CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY profiles_insert_own_or_admin ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY profiles_update_own_or_admin ON public.profiles FOR UPDATE
USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'ADMIN')
WITH CHECK (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY profiles_delete_admin ON public.profiles FOR DELETE
USING (public.get_user_role(auth.uid()) = 'ADMIN');

-- -----------------------------------------------------------------
-- 4. Cursos, módulos, aulas e materiais por escopo
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Leitura de cursos para autorizados" ON public.courses;
DROP POLICY IF EXISTS "Professores e admins podem criar cursos" ON public.courses;
DROP POLICY IF EXISTS "Professores editam seus proprios cursos ou admin" ON public.courses;
DROP POLICY IF EXISTS "Professores eliminam seus proprios cursos ou admin" ON public.courses;

CREATE POLICY courses_select_published_or_scoped ON public.courses FOR SELECT
USING (
  status = 'PUBLISHED'
  OR public.is_course_manager(id)
  OR public.is_course_student(id)
);
CREATE POLICY courses_insert_manager ON public.courses FOR INSERT
WITH CHECK (
  public.get_user_role(auth.uid()) = 'ADMIN'
  OR (public.get_user_role(auth.uid()) = 'PROFESSOR' AND teacher_id = auth.uid())
);
CREATE POLICY courses_update_manager ON public.courses FOR UPDATE
USING (public.is_course_manager(id))
WITH CHECK (
  public.get_user_role(auth.uid()) = 'ADMIN'
  OR (public.get_user_role(auth.uid()) = 'PROFESSOR' AND teacher_id = auth.uid())
);
CREATE POLICY courses_delete_manager ON public.courses FOR DELETE
USING (public.is_course_manager(id));

DROP POLICY IF EXISTS "Leitura de modulos por autorizados" ON public.modules;
DROP POLICY IF EXISTS "Professores e administradores gerenciam modulos" ON public.modules;
CREATE POLICY modules_select_scoped ON public.modules FOR SELECT
USING (public.is_course_manager(course_id) OR public.is_course_student(course_id));
CREATE POLICY modules_manage_course ON public.modules FOR ALL
USING (public.is_course_manager(course_id))
WITH CHECK (public.is_course_manager(course_id));

DROP POLICY IF EXISTS "Leitura de aulas para matriculados ou docentes" ON public.lessons;
DROP POLICY IF EXISTS "Docentes ou administradores gerenciam aulas" ON public.lessons;
CREATE POLICY lessons_select_scoped ON public.lessons FOR SELECT
USING (public.is_course_manager(course_id) OR public.is_course_student(course_id));
CREATE POLICY lessons_manage_course ON public.lessons FOR ALL
USING (public.is_course_manager(course_id))
WITH CHECK (public.is_course_manager(course_id));

DROP POLICY IF EXISTS "Leitura de materiais se matriculado na aula ou docente" ON public.materials;
DROP POLICY IF EXISTS "Docentes ou administradores gerenciam materiais" ON public.materials;
CREATE POLICY materials_select_scoped ON public.materials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = materials.lesson_id
      AND (public.is_course_manager(l.course_id) OR public.is_course_student(l.course_id))
  )
);
CREATE POLICY materials_manage_course ON public.materials FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = materials.lesson_id AND public.is_course_manager(l.course_id))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = materials.lesson_id AND public.is_course_manager(l.course_id))
);

-- -----------------------------------------------------------------
-- 5. Matrículas e progresso: aluno não se auto-matricula
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Alunos visualizan suas matriculas, admins/professores tudo" ON public.enrollments;
DROP POLICY IF EXISTS "Controle de matricula por professores, admins ou aluno proprio" ON public.enrollments;

CREATE POLICY enrollments_select_scoped ON public.enrollments FOR SELECT
USING (auth.uid() = student_id OR public.is_course_manager(course_id));
CREATE POLICY enrollments_insert_course_manager ON public.enrollments FOR INSERT
WITH CHECK (public.is_course_manager(course_id));
CREATE POLICY enrollments_update_course_manager ON public.enrollments FOR UPDATE
USING (public.is_course_manager(course_id))
WITH CHECK (public.is_course_manager(course_id));
CREATE POLICY enrollments_delete_course_manager ON public.enrollments FOR DELETE
USING (public.is_course_manager(course_id));

DROP POLICY IF EXISTS "Leitura do proprio progresso ou docentes/admin" ON public.lesson_progress;
DROP POLICY IF EXISTS "Estudantes visualizam proprio progresso" ON public.lesson_progress;
DROP POLICY IF EXISTS "Estudantes atualizam proprio progresso" ON public.lesson_progress;
DROP POLICY IF EXISTS "Estudantes marcam o proprio progresso" ON public.lesson_progress;

CREATE POLICY lesson_progress_select_scoped ON public.lesson_progress FOR SELECT
USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_progress.lesson_id AND public.is_course_manager(l.course_id))
);
CREATE POLICY lesson_progress_insert_own_enrolled ON public.lesson_progress FOR INSERT
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_progress.lesson_id AND public.is_course_student(l.course_id))
);
CREATE POLICY lesson_progress_update_own_enrolled ON public.lesson_progress FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_progress.lesson_id AND public.is_course_student(l.course_id))
);

-- -----------------------------------------------------------------
-- 6. Certificados, tarefas e dados acadêmicos de professor
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Ver certificados do proprio formando, professores, adm" ON public.certificates;
DROP POLICY IF EXISTS "Criar certificados por professores, adm" ON public.certificates;
CREATE POLICY certificates_select_scoped ON public.certificates FOR SELECT
USING (auth.uid() = student_id OR public.is_course_manager(course_id));
CREATE POLICY certificates_manage_course ON public.certificates FOR ALL
USING (public.is_course_manager(course_id))
WITH CHECK (public.is_course_manager(course_id));

DROP POLICY IF EXISTS "assignments_select_published" ON public.assignments;
DROP POLICY IF EXISTS "assignments_manage_staff" ON public.assignments;
CREATE POLICY assignments_select_scoped ON public.assignments FOR SELECT
USING (public.is_course_manager(course_id) OR (status = 'PUBLISHED' AND public.is_course_student(course_id)));
CREATE POLICY assignments_manage_course ON public.assignments FOR ALL
USING (public.is_course_manager(course_id))
WITH CHECK (public.is_course_manager(course_id));

DROP POLICY IF EXISTS "assignment_submissions_select_own" ON public.assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_insert_own" ON public.assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_update_own" ON public.assignment_submissions;
CREATE POLICY assignment_submissions_select_scoped ON public.assignment_submissions FOR SELECT
USING (
  auth.uid() = student_id
  OR EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.is_course_manager(a.course_id)
  )
);
CREATE POLICY assignment_submissions_insert_own_enrolled ON public.assignment_submissions FOR INSERT
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND a.status = 'PUBLISHED'
      AND public.is_course_student(a.course_id)
  )
);
CREATE POLICY assignment_submissions_update_scoped ON public.assignment_submissions FOR UPDATE
USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_submissions.assignment_id AND public.is_course_manager(a.course_id))
)
WITH CHECK (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_submissions.assignment_id AND public.is_course_manager(a.course_id))
);

-- -----------------------------------------------------------------
-- 7. Comunicação limitada por relação acadêmica
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_send_message(p_sender_id UUID, p_receiver_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  sender_role TEXT := public.get_user_role(p_sender_id);
  receiver_role TEXT := public.get_user_role(p_receiver_id);
BEGIN
  IF sender_role = 'ADMIN' THEN
    RETURN TRUE;
  ELSIF sender_role = 'PROFESSOR' THEN
    RETURN receiver_role = 'ADMIN' OR public.teacher_has_student(p_sender_id, p_receiver_id);
  ELSIF sender_role = 'ALUNO' THEN
    RETURN receiver_role = 'PROFESSOR' AND public.teacher_has_student(p_receiver_id, p_sender_id);
  END IF;
  RETURN FALSE;
END;
$$;

-- A policy de INSERT existente usa a função acima; ela passa a aplicar a
-- relação curso-professor-aluno sem ampliar acesso a conversas antigas.

-- -----------------------------------------------------------------
-- 8. RPCs com retorno mínimo para casos que não podem expor tabelas
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_enrollment_candidates(p_course_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome_completo TEXT,
  foto_perfil TEXT,
  telefone TEXT,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.id, u.email, u.nome_completo, u.foto_perfil, u.telefone, u.status
  FROM public.users u
  WHERE u.role = 'ALUNO'
    AND u.status = 'ACTIVE'
    AND public.is_course_manager(p_course_id)
  ORDER BY u.nome_completo ASC;
$$;

CREATE OR REPLACE FUNCTION public.verify_certificate_public(p_codigo TEXT)
RETURNS TABLE (
  codigo_validacao TEXT,
  emitido_em TIMESTAMP WITH TIME ZONE,
  final_grade NUMERIC,
  student_name TEXT,
  course_title TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT c.codigo_validacao, c.emitido_em, c.final_grade, u.nome_completo, co.title
  FROM public.certificates c
  JOIN public.users u ON u.id = c.student_id
  JOIN public.courses co ON co.id = c.course_id
  WHERE upper(c.codigo_validacao) = upper(trim(p_codigo))
    AND c.revoked_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_enrollment_candidates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_certificate_public(TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------
-- 9. Alvos, quizzes e apontamentos também seguem o curso responsável
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "lesson_targets_select_own_or_staff" ON public.lesson_targets;
DROP POLICY IF EXISTS "lesson_targets_manage_staff" ON public.lesson_targets;
CREATE POLICY lesson_targets_select_scoped ON public.lesson_targets FOR SELECT
USING (auth.uid() = student_id OR public.is_course_manager(course_id));
CREATE POLICY lesson_targets_manage_course ON public.lesson_targets FOR ALL
USING (public.is_course_manager(course_id))
WITH CHECK (public.is_course_manager(course_id));

DROP POLICY IF EXISTS "quiz_submissions_select_own_or_staff" ON public.quiz_submissions;
DROP POLICY IF EXISTS "quiz_submissions_insert_own" ON public.quiz_submissions;
DROP POLICY IF EXISTS "quiz_submissions_update_own" ON public.quiz_submissions;
CREATE POLICY quiz_submissions_select_scoped ON public.quiz_submissions FOR SELECT
USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = quiz_submissions.lesson_id AND public.is_course_manager(l.course_id))
);
CREATE POLICY quiz_submissions_insert_own_enrolled ON public.quiz_submissions FOR INSERT
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = quiz_submissions.lesson_id AND public.is_course_student(l.course_id))
);
CREATE POLICY quiz_submissions_update_own_enrolled ON public.quiz_submissions FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = quiz_submissions.lesson_id AND public.is_course_student(l.course_id))
);

DROP POLICY IF EXISTS "lesson_notes_select_own" ON public.lesson_notes;
DROP POLICY IF EXISTS "lesson_notes_insert_own" ON public.lesson_notes;
DROP POLICY IF EXISTS "lesson_notes_update_own" ON public.lesson_notes;
DROP POLICY IF EXISTS "lesson_notes_delete_own" ON public.lesson_notes;
CREATE POLICY lesson_notes_select_scoped ON public.lesson_notes FOR SELECT
USING (auth.uid() = student_id OR public.is_course_manager(course_id));
CREATE POLICY lesson_notes_insert_own_enrolled ON public.lesson_notes FOR INSERT
WITH CHECK (auth.uid() = student_id AND public.is_course_student(course_id));
CREATE POLICY lesson_notes_update_own_enrolled ON public.lesson_notes FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id AND public.is_course_student(course_id));
CREATE POLICY lesson_notes_delete_own ON public.lesson_notes FOR DELETE
USING (auth.uid() = student_id);
