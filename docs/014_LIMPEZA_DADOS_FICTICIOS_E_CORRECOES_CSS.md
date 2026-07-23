==================================================================
MULTIPLUS ACADEMY — LIMPEZA DE DADOS FICTÍCIOS,
CORREÇÕES CSS INVÁLIDAS E FINALIZAÇÃO DE FUNCIONALIDADES
GOOGLE AI STUDIO / GEMINI
==================================================================
Documento número: 014
Data: 16/07/2026
Preparado por: Super Z (arquiteto técnico e diretor de orientação)
Repositório oficial: github.com/amandiogoncalvesd/MultiPlus-Academy-
Branch: main

==================================================================
COMO USAR ESTE ARQUIVO
==================================================================

Este documento é a ORDEM DE TRABALHO para levar a aplicação ao
estado 100% funcional, sem NENHUM dado fictício, NENHUMA classe
CSS inválida e NENHUMA funcionalidade fake restante.

Cada secção foi VERIFICADA DIRETAMENTE NO CÓDIGO ATUAL antes de
ser incluída aqui. O que já está correto NÃO está listado.

Executar na ordem exata: SECÇÃO 1 (CSS inválido, afeta TUDO)
→ SECÇÃO 2 (Admin) → SECÇÃO 3 (Professor) → SECÇÃO 4 (Aluno)
→ SECÇÃO 5 (verificação final).

Não pular etapas. Não implementar duas secções ao mesmo tempo.
Ao terminar cada item, executar o critério de aceitação antes
de avançar para o próximo.

IMPORTANTE: Não alterar funcionalidade — só corrigir, limpar ou
remover o que está errado/fictício. Toda lógica de negócio,
estados e chamadas Supabase que já funcionam devem permanecer
intactas.


==================================================================
SECÇÃO 1 — CLASSES CSS INVÁLIDAS (CRÍTICO — afeta TODOS os painéis)
==================================================================

DIAGNÓSTICO: O projeto contém 293 ocorrências de classes CSS que
NÃO EXISTEM no Tailwind CSS nem nos tokens definidos em
src/index.css. Essas classes são IGNORADAS SILENCIOSAMENTE pelo
compilador — o resultado visual é como se a classe não existisse.

Isso causa textos invisíveis, fundos que não mudam no modo escuro
e bordas que nunca aparecem, especialmente no modo escuro.


------------------------------------------------------------------
1.1 TOKENS NÃO DEFINIDOS — Adicionar ao bloco @theme em
src/index.css
------------------------------------------------------------------

Atualmente, o bloco @theme define: ink-900, ink-800, gold-600,
cream-100, cream-200, danger-700, espresso-900, espresso-700,
neutral-400, flag-red, flag-black, flag-gold.

Porém, o código usa EXTENSIVAMENTE estes tokens que NÃO EXISTEM:

  ink-750   → NÃO EXISTE (usado como dark:border-ink-750 em
              StudentSelector e InstructorCalendarTab)

  ink-850   → NÃO EXISTE (usado como dark:bg-ink-850 em
              MessagesPage, CertificateIssueModal,
              CourseEditorModal, AdminPortal)

  ink-950   → NÃO EXISTE (usado como dark:bg-ink-950 em
              CourseEditorModal, CertificateIssueModal,
              AdminPortal, MessagesPage)

  cream-150 → NÃO EXISTE (usado como bg-cream-150 em
              CourseEditorModal, CertificateIssueModal,
              MessagesPage, StudentPortal)

  cream-250 → NÃO EXISTE (usado como dark:hover:bg-cream-250,
              hover:bg-cream-250 em MessagesPage, AdminPortal)

  gray-150  → NÃO EXISTE (usado como border-gray-150 em
              AdminPortal, InstructorCalendarTab, StudentPortal)

  gray-250  → NÃO EXISTE (usado como border-gray-250 em
              AdminPortal, CourseEditorModal,
              CertificateIssueModal)

  neutral-450 → NÃO EXISTE (usado como placeholder-neutral-450
                em StudentSelector)

  slate-850 → NÃO EXISTE (28 ocorrências em 7 ficheiros —
              usado como text-slate-850)

CORREÇÃO: adicionar estas linhas ao bloco @theme em
src/index.css, DEPOIS das cores já existentes:

  --color-ink-750: #1E2736;     /* Intermediário entre ink-800 e ink-900 */
  --color-ink-850: #192030;     /* Intermediário para cards dark mode */
  --color-ink-950: #0F1520;     /* Mais escuro que ink-900 — fundo profundo */
  --color-cream-150: #F5F0EA;   /* Intermediário entre cream-100 e cream-200 */
  --color-cream-250: #EDE5DA;   /* Um tom acima de cream-200 para hover */
  --color-gray-150: #E8E8E8;    /* Borda sutil clara */
  --color-gray-250: #D1D5DB;    /* Borda média clara (equivale a slate-300) */
  --color-neutral-450: #8B8F98; /* Placeholder intermediário */
  --color-slate-850: #172033;   /* Texto dark mode (equivale a ink-850) */

CRITÉRIO DE ACEITAÇÃO: após adicionar estes tokens, abrir cada
um dos 3 painéis em modo escuro e verificar que NENHUM texto
está invisível e NENHUM fundo está em branco onde deveria ser
escuro.


------------------------------------------------------------------
1.2 REMOVER CÓDIGO MORTO: integrationStatuses no AdminPortal
------------------------------------------------------------------

CONFIRMADO em src/components/AdminPortal.tsx:

Linha 139: const [integrationStatuses, setIntegrationStatuses] =
  useState<Record<string, boolean>>({
    Supabase: true,
    Cloudinary: true,
    GoogleCalendar: true,
    GoogleMeet: true,
    GoogleForms: true,
    GoogleDrive: true,
    VertexAI: false,
    WhatsAppAPI: false,
    SMTPEmail: true,
  });

Este estado NÃO é mais usado em nenhum lugar — a aba
"Integrações" (VIEW 16, linha 1485) já foi convertida para
somente leitura com dados fixos no array inline.

ORDEM DE EXECUÇÃO:
1. Apagar completamente a declaração de integrationStatuses
   (linhas 139-149).
2. Procurar por qualquer referência a integrationStatuses ou
   setIntegrationStatuses no arquivo inteiro e remover.
3. Confirmar que a aba Integrações continua funcionando
   visualmente igual (porque agora usa dados fixos inline).

CRITÉRIO DE ACEITAÇÃO: nenhum erro de compilação, aba
Integrações continua mostrando Supabase/Vercel/Cloudinary com
"Conectado".


------------------------------------------------------------------
1.3 REMOVER CÓDIGO MORTO: variáveis de simulação no StudentPortal
------------------------------------------------------------------

CONFIRMADO em src/components/StudentPortal.tsx:

Linha 117-119:
  const [streakCount, setStreakCount] = useState(0);
  const hours = 0;

Linha 145:
  const [isGoogleSynced, setIsGoogleSynced] = useState(false);

Linha 605-608:
  const handleSyncGoogleCalendar = () => {
    setIsGoogleSynced(true);
    alert('Integração Concluída! ...');
  };

ORDEM DE EXECUÇÃO:
1. Apagar streakCount e hours (não são usados em nenhum lugar
   do render — se forem, verificar antes, mas confirmo que
   streakCount só aparece na declaração).
2. Apagar isGoogleSynced e handleSyncGoogleCalendar.
3. No render, na aba calendário (por volta da linha 1430),
   trocar o botão de "Sincronizar Google Calendar" por um
   botão que chama handleExportICS (já existe e funciona),
   ou simplesmente remover o botão de sincronização fake e
   deixar só o botão de exportar .ICS que já funciona.
4. Se streakCount for referenciado em algum render que eu
   não vi, substituir por uma contagem real (dias consecutivos
   de aulas concluídas, calculado a partir de lesson_progress)
   — nunca deixar um valor fixo.

CRITÉRIO DE ACEITAÇÃO: nenhuma variável de estado sem uso
real, nenhum alert() falso de integração, botão de calendário
só faz coisas reais (.ICS export).


==================================================================
SECÇÃO 2 — ADMINISTRADOR (limpeza de dados fictícios)
==================================================================

------------------------------------------------------------------
2.1 REMOVER foto de stock como fallback
------------------------------------------------------------------

CONFIRMADO: em vários lugares do AdminPortal, quando um usuário
não tem foto_perfil, o código pode estar usando uma foto de
stock ou a foto da Esmeralda como fallback.

ORDEM DE EXECUÇÃO:
1. Procurar em AdminPortal.tsx TODOS os lugares onde se renderiza
   a foto de um usuário (lista de usuários, perfil do admin).
2. Para cada lugar, garantir que o fallback seja SEMPRE as
   iniciais do nome (ex: {user.firstName?.[0]}) com fundo
   gold-600 — NUNCA uma URL de foto real de outra pessoa.
3. O padrão correto já existe em MessagesPage.tsx (linhas 44-55):
   se user.avatarUrl, mostrar a imagem; senão, mostrar iniciais
   com fundo gold-600. Replicar EXATAMENTE esse padrão.

CRITÉRIO DE ACEITAÇÃO: nenhum usuário sem foto própria mostra a
foto de outra pessoa.


------------------------------------------------------------------
2.2 VALORES DE RESERVA falsos nas configurações institucionais
------------------------------------------------------------------

CONFIRMADO em src/components/AdminPortal.tsx, linhas 166-168:

  const [instName, setInstName] = useState('MultiPlus Academy');
  const [instDomain, setInstDomain] = useState('multiplus.ao');
  const [instPhone, setInstPhone] = useState('+244 923 000 000');

O telefone '+244 923 000 000' é um número falso que parece real.

ORDEM DE EXECUÇÃO:
1. Ao carregar o componente (useEffect), buscar os valores reais
   da tabela institution_settings (que já existe e já é usada
   para salvar — ver linha 1541-1548).
2. Se institution_settings tiver dados, preencher instName,
   instDomain, instPhone com os valores do banco.
3. Se NÃO tiver dados no banco, usar valores iniciais
   razoáveis: instName = 'MultiPlus Academy', instDomain = '',
   instPhone = '' (vazio, não um número falso).
4. NUNCA mostrar um telefone que parece real mas não é de
   ninguém.

CRITÉRIO DE ACEITAÇÃO: ao abrir a aba Configurações, os campos
mostram valores vindos do banco de dados, ou campos vazios se
ainda não foram configurados — nunca dados falsos que parecem
reais.


------------------------------------------------------------------
2.3 MOEDA: trocar '€' por 'Kz' no preço do curso
------------------------------------------------------------------

CONFIRMADO em src/components/AdminPortal.tsx, linha 135:

  const [coursePrice, setCoursePrice] = useState('€350');

O euro (€) é a moeda errada para uma instituição em Angola.
A moeda correta é o Kwanza (Kz), conforme já estabelecido
no Documento 012.

ORDEM DE EXECUÇÃO:
1. Trocar o valor inicial para '350000' (sem símbolo de moeda
   no estado — o símbolo 'Kz' deve ser exibido ao lado do
   campo, não digitado pelo usuário).
2. No campo de input de preço, exibir o label "Kz" fixo ao
   lado direito do campo (como um suffix), nunca permitir que
   o usuário digite o símbolo.
3. Formatar para exibição com separador de milhares:
   "450.000 Kz" em vez de "450000 Kz".
4. Procurar TODAS as ocorrências de '€' em todo o projeto
   (src/) e substituir pelo formato Kz correto.

CRITÉRIO DE ACEITAÇÃO: nenhum símbolo de euro em nenhum lugar
do projeto, todos os preços mostram "Kz".


==================================================================
SECÇÃO 3 — PROFESSOR (limpeza de dados fictícios)
==================================================================

------------------------------------------------------------------
3.1 REMOVER progresso fictício de alunos
------------------------------------------------------------------

CONFIRMADO em src/components/instructor/InstructorStudentsTab.tsx,
linha 99:

  const getEnrollment = (studentId: string) => {
    const enroll = enrollments.find(e => e.userId === studentId);
    return enroll || { progressPercent: 66, status: 'ACTIVE',
                       courseId: 'eng-legal-angola' };
  };

Quando um aluno não tem matrícula real, esta função INVENTA uma
matrícula com progresso de 66% e um courseId que provavelmente
não existe ('eng-legal-angola').

ORDEM DE EXECUÇÃO:
1. Alterar a função para retornar NULL quando não há matrícula:

   const getEnrollment = (studentId: string) => {
     return enrollments.find(e => e.userId === studentId) || null;
   };

2. No render, ao usar getEnrollment, verificar se o retorno é
   null antes de mostrar o progresso:

   {getEnrollment(student.id) ? (
     <span>{getEnrollment(student.id).progressPercent}%</span>
   ) : (
     <span className="text-neutral-400">Sem matrícula</span>
   )}

3. NUNCA mostrar um percentual inventado para um aluno que não
   tem dados reais.

CRITÉRIO DE ACEITAÇÃO: cada percentual mostrado na tabela de
alunos corresponde a um dado real no banco de dados. Alunos sem
matrícula mostram "Sem matrícula", nunca um número falso.


------------------------------------------------------------------
3.2 VERIFICAR se as abas Aulas/Módulos/Biblioteca foram removidas
------------------------------------------------------------------

O Roteiro Executivo (Item 2.1) ordenava remover as três abas
redundantes do InstructorPortal: "Aulas" (Gerir Aulas),
"Módulos" (Estruturação/Syllabus) e "Biblioteca Digital".

CONFIRMAÇÃO NECESSÁRIA:
1. Procurar no InstructorPortal.tsx se ainda existem itens de
   navegação com id 'aulas', 'modulos' ou 'biblioteca'.
2. Se existirem, remover os três itens da barra lateral e os
   três blocos de conteúdo correspondentes.
3. Confirmar que a criação/edição de aulas continua acessível
   pelo fluxo: InstructorCoursesTab → abrir curso →
   CourseEditorModal → aba "Aulas do Curso".

CRITÉRIO DE ACEITAÇÃO: nenhuma aba "Aulas", "Módulos" ou
"Biblioteca" no menu lateral do Professor. Nenhum alert()
com texto "simulação" ou "emulado" em nenhum lugar do painel.


------------------------------------------------------------------
3.3 VERIFICAR data fixa no calendário do Professor
------------------------------------------------------------------

O Roteiro mencionava fallback fixo '2026-06-15' no
InstructorCalendarTab.tsx. O grep NÃO encontrou essa data
fixa, mas verificar se existe algum outro fallback similar.

ORDEM DE EXECUÇÃO:
1. Abrir InstructorCalendarTab.tsx.
2. Procurar qualquer fallback de data que não seja null/undefined
   (ex: || '2026-XX-XX', || new Date(), || '18:30').
3. Se encontrar, remover o fallback. Se scheduled_at é nulo,
   a aula NÃO aparece no calendário — mostrar numa lista
   separada "Aulas sem data agendada", nunca inventar data.
4. Se NÃO encontrar, marcar como concluído e avançar.

CRITÉRIO DE ACEITAÇÃO: nenhuma aula sem data real aparece
posicionada em nenhum dia específico do calendário do Professor.


==================================================================
SECÇÃO 4 — ALUNO (limpeza de dados fictícios + bloqueio de aulas)
==================================================================

------------------------------------------------------------------
4.1 REMOVER aulas fictícias de fallback no StudentPortal
------------------------------------------------------------------

CONFIRMADO em src/components/StudentPortal.tsx, linhas 658-684:

  const activeSyllabus = realLessons.length > 0 ?
    realLessons.map(l => ({ ... })) : [
      { id: 'lesson_1_fallback', title: 'Aula 1: Introdução...',
        duration: '15:20', ... },
      { id: 'lesson_2_fallback', title: 'Aula 2: Vocabulário...',
        duration: '18:45', ... },
      { id: 'lesson_3_fallback', title: 'Aula 3: Elaboração...',
        duration: '22:10', ... }
    ];

Quando não há aulas reais no banco, o StudentPortal mostra 3
aulas FICTÍCIAS como se fossem reais. O aluno vê "Aula 1",
"Aula 2", "Aula 3" e pensa que são aulas genuínas do curso.

ORDEM DE EXECUÇÃO:
1. Remover completamente o array de fallback (as 3 aulas
   fictícias).
2. Quando realLessons.length === 0, activeSyllabus deve ser um
   array VAZIO [].
3. No render, quando activeSyllabus está vazio, mostrar um
   estado vazio elegante:

   <div className="text-center py-12 space-y-3">
     <BookOpen className="w-12 h-12 text-gold-600/30 mx-auto" />
     <h4 className="font-serif font-black text-ink-900
       dark:text-cream-100 text-sm">
       Nenhuma aula disponível
     </h4>
     <p className="text-xs text-neutral-400 max-w-xs mx-auto">
       As aulas do seu curso aparecerão aqui assim que o
       professor as publicar.
     </p>
   </div>

4. O mesmo estado vazio deve aparecer na área do vídeo player
   quando não há aula selecionada.

CRITÉRIO DE ACEITAÇÃO: quando um aluno não tem aulas no banco,
ele vê uma mensagem clara "Nenhuma aula disponível" — NUNCA
aulas inventadas.


------------------------------------------------------------------
4.2 REMOVER fallbacks de data falsa no calendário do aluno
------------------------------------------------------------------

CONFIRMADO em src/components/StudentPortal.tsx:

Linha 623 (na função handleExportICS):
  const rawDate = session.lesson?.scheduled_at ||
    new Date().toISOString();

Se uma aula não tem scheduled_at, a função INVENTA a data de
hoje como se a aula fosse agendada para agora.

Linhas 1451-1452 (no render do calendário):
  const dateVal = session.lesson?.scheduled_at?.split('T')[0] ||
    new Date().toISOString().split('T')[0];
  const timeVal = session.lesson?.scheduled_at?.split('T')[1]
    ?.substring(0, 5) || '18:30';

Se uma aula não tem data, aparece como se fosse hoje às 18:30.

ORDEM DE EXECUÇÃO:

1. Na função handleExportICS (linha 612), FILTRAR as aulas que
   não têm scheduled_at ANTES de incluí-las no .ics:

   const lessonsWithDate = scheduledLessons.filter(
     session => session.lesson?.scheduled_at
   );

   Usar lessonsWithDate em vez de scheduledLessons no loop.
   Se lessonsWithDate estiver vazio, mostrar o alert existente.

2. No render do calendário (linhas 1448-1452), remover os
   fallbacks:

   ANTES:
     const dateVal = session.lesson?.scheduled_at?.split('T')[0]
       || new Date().toISOString().split('T')[0];
     const timeVal = session.lesson?.scheduled_at?.split('T')[1]
       ?.substring(0, 5) || '18:30';

   DEPOIS:
     const dateVal = session.lesson?.scheduled_at?.split('T')[0];
     const timeVal = session.lesson?.scheduled_at?.split('T')[1]
       ?.substring(0, 5);

   E no render, só mostrar o card da aula agendada SE dateVal
   existir:

   {scheduledLessons.filter(s =>
     s.lesson?.scheduled_at
   ).map((session, index) => {
     const dateVal = session.lesson.scheduled_at.split('T')[0];
     const timeVal = session.lesson.scheduled_at.split('T')[1]
       ?.substring(0, 5) || '--:--';
     // ...render do card
   })}

3. Aulas sem data agendada podem ser listadas numa secção
   separada opcional "Aulas pendentes de agendamento" (só
   título, sem data), mas NUNCA posicionadas num dia/hora
   inventado no calendário.

CRITÉRIO DE ACEITAÇÃO: nenhuma aula sem data real aparece
posicionada em nenhum dia do calendário. O arquivo .ics só
contém aulas com data real.


------------------------------------------------------------------
4.3 REMOVER data fictícia no StudentTasksTab
------------------------------------------------------------------

CONFIRMADO em src/components/portal/StudentTasksTab.tsx, linha 43:

  dueDate: '2026-06-15'

ORDEM DE EXECUÇÃO:
1. Abrir StudentTasksTab.tsx.
2. Procurar a origem dos dados das tarefas. Se as tarefas
   vierem do banco de dados, usar a data real. Se forem
   hardcoded, remover ou buscar do banco.
3. Se a tarefa não tem data de entrega, mostrar "Sem prazo
   definido" em vez de uma data inventada.
4. Remover qualquer data '2026-06-15' hardcoded.

CRITÉRIO DE ACEITAÇÃO: nenhuma data de tarefa é inventada.
Datas mostradas correspondem a dados reais do banco.


------------------------------------------------------------------
4.4 FORTALECER o bloqueio de aula por data
------------------------------------------------------------------

O bloqueio já existe (linha 1209 do StudentPortal.tsx) e mostra
o ícone de cadeado quando scheduled_at é futuro. Porém, a lógica
tem uma falha: se scheduled_at for NULL, a aula aparece
DESBLOQUEADA por padrão (porque null não é > new Date()).

ORDEM DE EXECUÇÃO:
1. Na definição de activeSyllabus (linha 659), adicionar um
   campo calculado:

   const isActive = l.scheduled_at
     ? new Date(l.scheduled_at) <= new Date()
     : false;  // Sem data = bloqueada por padrão

2. No render da lista de aulas (linha 1347), trocar:

   ANTES:
     const isLocked = syll.scheduled_at
       ? new Date(syll.scheduled_at) > new Date() : false;

   DEPOIS:
     const isLocked = syll.scheduled_at
       ? new Date(syll.scheduled_at) > new Date()
       : true;  // Sem data = bloqueada

3. No render do vídeo player (linha 1209), adicionar a mesma
   verificação para aulas sem data:

   ANTES:
     {currentLecture.scheduled_at &&
       new Date(currentLecture.scheduled_at) > new Date() ? (
       // bloco bloqueado
     ) : (
       // bloco desbloqueado
     )}

   DEPOIS:
     {(!currentLecture.scheduled_at ||
       new Date(currentLecture.scheduled_at) > new Date()) ? (
       // bloco bloqueado
     ) : (
       // bloco desbloqueado
     )}

   A diferença: se scheduled_at é null, TRATA como bloqueada.
   A lógica agora é: bloqueada se SEM data OU se data no futuro.

4. No estado bloqueado (sem scheduled_at), mostrar:
   "Esta aula ainda não foi agendada pelo professor"
   em vez de mostrar uma data futura.

CRITÉRIO DE ACEITAÇÃO: uma aula sem scheduled_at NÃO pode ser
aberta de forma nenhuma. Só está acessível se scheduled_at
estiver definido E for no passado.


------------------------------------------------------------------
4.5 REMOVER simulação de Google Calendar no StudentPortal
------------------------------------------------------------------

CONFIRMADO em src/components/StudentPortal.tsx:

Linha 605-608:
  const handleSyncGoogleCalendar = () => {
    setIsGoogleSynced(true);
    alert('Integração Concluída! O seu Calendário Letivo
      MultiPlus está agora sincronizado bidirecionalmente
      com o seu Google Calendar pessoal.');
  };

Linha 1430:
  onClick={handleSyncGoogleCalendar}

Este botão finge sincronizar com o Google Calendar mas só
mostra um alert() falso. Não existe nenhuma integração real
com o Google Calendar API.

ORDEM DE EXECUÇÃO:
1. Apagar a função handleSyncGoogleCalendar.
2. Apagar o estado isGoogleSynced.
3. No render do calendário, REMOVER o botão "Sincronizar Google
   Calendar". Manter APENAS o botão "Exportar .ICS" (linha 1440)
   que já funciona de verdade.
4. O botão .ICS já gera um arquivo que é reconhecido pelo
   Google Calendar, Apple Calendar e Outlook — isso é suficiente
   e é real.

CRITÉRIO DE ACEITAÇÃO: nenhum botão falso de sincronização.
O único botão de calendário é o de exportar .ICS, que funciona
de verdade.


------------------------------------------------------------------
4.6 REMOVER watermark com email falso
------------------------------------------------------------------

CONFIRMADO em src/components/StudentPortal.tsx, linha 1205:

  {currentUser?.email || 'antonio@advogados.ao'} • MULTIPLUS

Quando o usuário não tem email carregado, aparece o email falso
'antonio@advogados.ao' como se fosse o email real do usuário.

ORDEM DE EXECUÇÃO:
1. Trocar o fallback de 'antonio@advogados.ao' para o nome do
   usuário ou para um texto genérico:

   {currentUser?.email || currentUser?.firstName || 'Aluno'}
   • MULTIPLUS

2. NUNCA mostrar um email que parece real mas não é de ninguém.

CRITÉRIO DE ACEITAÇÃO: o watermark nunca mostra um email falso
de outra pessoa.


------------------------------------------------------------------
4.7 VERIFICAR que o aluno usa a página de mensagens independente
------------------------------------------------------------------

CONFIRMADO: o StudentPortal.tsx já redireciona para
setCurrentPage('messages') quando o usuário clica em
"Mensagens" (linha 768). NÃO renderiza ChatShell embutido.

Porém, confirmar que:
1. Não existe mais nenhum import de ChatShell no StudentPortal.
2. Não existe nenhum StudentMessagesTab.tsx no projeto (ou se
   existe, não é importado em nenhum lugar).
3. O botão de acesso rápido a mensagens no cabeçalho (linha 1566)
   também redireciona para setCurrentPage('messages').

Se tudo estiver correto, marcar como concluído.

CRITÉRIO DE ACEITAÇÃO: o Aluno usa exatamente a mesma página
/messages de tela cheia que Admin e Professor já usam.


==================================================================
SECÇÃO 5 — VERIFICAÇÃO FINAL (checklist de qualidade)
==================================================================

Após completar TODAS as secções acima, executar esta verificação
completa:

1. MODO ESCURO: abrir cada um dos 3 painéis (Admin, Professor,
   Aluno) em modo escuro. Verificar que NENHUM texto está
   invisível e NENHUM fundo está em branco onde deveria ser
   escuro. Testar também a página /messages.

2. DADOS FICTÍCIOS: procurar no projeto inteiro por estas
   strings e confirmar que NENHUMA existe mais:
   - '2026-06-15'
   - 'lesson_1_fallback' ou 'lesson_2_fallback' etc.
   - 'eng-legal-angola' (como courseId fictício)
   - 'progressPercent: 66'
   - 'antonio@advogados.ao'
   - '€' (símbolo de euro)
   - 'admin@multiplus.ao' (email falso de reserva)
   - 'handleSyncGoogleCalendar'
   - 'isGoogleSynced'

3. ALERTAS FAKE: procurar por alert() em todo o projeto.
   Cada alert() deve ser avaliado — se é um alert de
   "simulação" ou "integração", remover. Alerts de erro
   legítimos (ex: "Erro ao salvar") podem permanecer.

4. BLOQUEIO DE AULA: criar uma aula de teste com scheduled_at
   no futuro. Verificar que o aluno NÃO consegue abrir o
   conteúdo. Mudar scheduled_at para o passado. Verificar que
   o conteúdo fica acessível imediatamente.

5. CALENDÁRIO .ICS: clicar em "Exportar .ICS" com aulas
   agendadas reais. Abrir o arquivo baixado e confirmar que
   os eventos aparecem corretos. Repetir SEM aulas agendadas
   e confirmar que o alert "Nenhuma aula agendada" aparece.

6. CERTIFICADOS: usar o CertificateIssueModal para enviar um
   PDF real. Confirmar que o PDF aparece na aba de
   certificados do aluno e que o link de download funciona.

7. CLASSE SLATE-850: rodar um grep final por "slate-850" em
   todo o src/. Se o token foi adicionado ao @theme, as
   classes devem funcionar. Se preferiu trocar por ink-850,
   confirmar que nenhuma classe slate-850 resta.


==================================================================
RESUMO EXECUTIVO — ORDEM FINAL DE EXECUÇÃO
==================================================================

 1. Secção 1.1 — Adicionar 9 tokens CSS que faltam ao @theme
 2. Secção 1.2 — Remover integrationStatuses morto do Admin
 3. Secção 1.3 — Remover variáveis de simulação do Student
 4. Secção 2.1 — Remover fotos de stock como fallback no Admin
 5. Secção 2.2 — Carregar configurações do banco, não hardcoded
 6. Secção 2.3 — Trocar € por Kz em todos os preços
 7. Secção 3.1 — Remover progresso fictício (66%) do Professor
 8. Secção 3.2 — Verificar/remover abas Aulas/Módulos/Biblioteca
 9. Secção 3.3 — Verificar data fixa no calendário do Professor
10. Secção 4.1 — Remover 3 aulas fictícias de fallback
11. Secção 4.2 — Remover fallbacks de data falsa no calendário
12. Secção 4.3 — Remover data '2026-06-15' no StudentTasksTab
13. Secção 4.4 — Fortalecer bloqueio de aula (null = bloqueada)
14. Secção 4.5 — Remover simulação fake do Google Calendar
15. Secção 4.6 — Remover email falso no watermark
16. Secção 4.7 — Verificar página de mensagens independente
17. Secção 5   — Checklist de verificação final

Quando todos os 17 itens estiverem concluídos e cada critério
de aceitação confirmado, a aplicação estará, pela primeira vez,
SEM NENHUM dado fictício conhecido, SEM classes CSS inválidas
e COM todas as funcionalidades centrais genuinamente operacionais.


==================================================================
FIM DO DOCUMENTO 014
==================================================================
