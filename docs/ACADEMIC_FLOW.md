# Fluxo acadêmico implementado

## Professor/Admin

1. Cria um curso e define professor responsável.
2. Abre o curso e matricula alunos pela aba **Alunos**.
3. Cria uma aula na aba **Aulas** do curso.
4. Para publicar, informa obrigatoriamente:
   - início do acesso;
   - fim do acesso;
   - vídeo e/ou link de reunião, quando aplicável.
5. A aula publicada é associada aos alunos matriculados e fica no calendário da turma.
6. Em **Métricas & Progresso**, seleciona um curso e acompanha cada aluno por aula: conclusão, minutos assistidos e janela agendada.

## Aluno

- **Minhas aulas** contém apenas aulas com janela aberta: `access_starts_at <= agora < access_ends_at`.
- Aulas futuras aparecem no **Calendário** como bloqueadas.
- Após `access_ends_at`, saem de Minhas aulas e continuam no calendário como histórico encerrado.
- A conclusão e o tempo de vídeo são gravados em `lesson_progress` por aluno e aula.

## Compatibilidade

`scheduled_at` continua preenchido com o início para manter calendários legados enquanto as telas são migradas. A regra oficial é definida por `access_starts_at` e `access_ends_at`.

## Limite atual de segurança de vídeo

A interface bloqueia o player fora da janela. Links de vídeo Cloudinary já existentes podem ser públicos; para proteção criptográfica completa do conteúdo, a próxima etapa migrará vídeos/materiais sensíveis para fornecedor com URL/token temporário ou Storage privado.
