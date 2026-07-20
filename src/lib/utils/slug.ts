/**
 * Gera um slug URL-friendly a partir de um título.
 * Adiciona um sufixo numérico aleatório para evitar colisões.
 */
export function generateSlug(title: string): string {
  const base = (title || 'novo-curso')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}
