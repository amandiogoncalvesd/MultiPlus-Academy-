import { Course, Instructor, BlogPost } from './types';

export const PRINCIPAL_COURSE: Course = {
  id: 'eng-legal-angola',
  slug: 'english-for-legal-field-angola',
  title: 'English for the Legal Field in Angola',
  subtitle: 'Domine o Inglês Jurídico com foco no mercado angolano.',
  summary: 'Eleve o seu perfil profissional através de uma formação desenhada especificamente para juristas, advogados, consultores e profissionais do sector jurídico angolano. O curso aborda a terminologia crucial e os conceitos práticos necessários para transações comerciais internacionais, elaboração de contratos e disputas transfronteiriças.',
  duration: '3 Meses (12 Semanas)',
  hours: '72 Horas de Formação',
  language: 'Inglês / Português',
  modality: 'Híbrido',
  schedule: 'Terças e Quintas, das 18:30 às 20:30 (Sessões online ao vivo + workshops presenciais ao sábado)',
  startDate: 'Outubro de 2026',
  targetAudience: [
    'Advogados e Juristas Associados',
    'Magistrados Judiciais e do Ministério Público',
    'Consultores Jurídicos e de Compliance',
    'Estudantes de Direito em Fase Final de Estudos',
    'Profissionais do Setor Petrolífero e de Minas'
  ],
  modules: [
    {
      number: 'MÊS I',
      title: 'Fundamentos e Sistema Legal',
      topics: [
        'Introdução ao Common Law vs. Civil Law (com enfoque no sistema angolano)',
        'Vocabulário Jurídico Fundamental e Estruturação de Pareceres',
        'Inglês para Correspondência Jurídica Formal e Comunicação Profissional',
        'Terminologia de Direito Constitucional e Administrativo Internacional'
      ]
    },
    {
      number: 'MÊS II',
      title: 'Direito Civil e Contratos',
      topics: [
        'Elaboração de Contratos Comerciais Internacionais (Drafting)',
        'Cláusulas Standard (Boilerplate clauses, Indemnity, Liability, Force Majeure)',
        'Análise de Contratos de Prestação de Serviços e Joint Ventures em Angola',
        'Terminologia Crítica do Direito da Propriedade e Garantias'
      ]
    },
    {
      number: 'MÊS III',
      title: 'Crime, Empresa e Resolução de Conflitos',
      topics: [
        'Direito Societário e Fusões & Aquisições (M&A)',
        'Resolução Alternativa de Litígios (Arbitragem Internacional)',
        'Compliance, Governação Corporativa e Prevenção do Branqueamento de Capitais',
        'Simulação Prática (Mock Arbitration/Negotiation) e Avaliação de Defesa Oral'
      ]
    }
  ]
};

export const COURSES_LIST: Course[] = [
  PRINCIPAL_COURSE,
  {
    id: 'legal-writing',
    slug: 'advanced-legal-writing-contracts',
    title: 'Advanced Legal Writing & Contract Drafting',
    subtitle: 'Técnicas avançadas de redação jurídica internacional e cláusulas comerciais.',
    summary: 'Workshop intensivo focado exclusivamente na arte de redigir peças processuais, contratos internacionais sofisticados e cartas de negociação comercial com precisão técnica absoluta.',
    duration: '4 Semanas',
    hours: '24 Horas de Formação',
    language: 'Inglês',
    modality: 'Online',
    schedule: 'Sábados, das 09:00 às 13:00',
    startDate: 'Novembro de 2026',
    targetAudience: [
      'Juristas de Redação e Redatores de Contratos',
      'Advogados Corporativos Sênior',
      'Compliance Officers'
    ],
    modules: [
      {
        number: 'SEM 1',
        title: 'Precision in Legal Terminology',
        topics: ['Ambiguity and Clarity', 'Active vs. Passive Voice in Law', 'Modernizing Legal English']
      },
      {
        number: 'SEM 2',
        title: 'Drafting Commercial Clauses',
        topics: ['Exclusion of Liability', 'Termination Provisions', 'Governing Law and Jurisdiction']
      }
    ]
  },
  {
    id: 'oil-gas-english',
    slug: 'english-oil-gas-energy-angola',
    title: 'English for Oil, Gas & Energy in Angola',
    subtitle: 'Inglês técnico especializado no setor de hidrocarbonetos e minas de Angola.',
    summary: 'A MultiPlus Academy traz a cobertura perfeita para o mercado angolano de petróleo e gás, focado no inglês para contratos de partilha de produção (PSA), regras regulatórias e termos da concessionária nacional.',
    duration: '6 Semanas',
    hours: '36 Horas de Formação',
    language: 'Inglês',
    modality: 'Híbrido',
    schedule: 'Segundas e Quartas, das 19:00 às 21:00',
    startDate: 'Janeiro de 2027',
    targetAudience: [
      'Juristas de Empresas Petrolíferas e Concessionárias',
      'Geólogos e Engenheiros com atuação contratual',
      'Consultores Aduaneiros e do Ministério da Energia'
    ],
    modules: [
      {
        number: 'MÊS I',
        title: 'Industry Framework & Concessions',
        topics: ['Production Sharing Agreements (PSA)', 'Local Content Regulations and Law 27/21', 'Anadarko/Chevron type Contracts']
      }
    ]
  }
];

export const MAIN_INSTRUCTOR: Instructor = {
  id: 'esmeralda-sumbelelo',
  name: 'Esmeralda Bruno Sumbelelo',
  role: 'Diretora Pedagógica & Formadora de Inglês Jurídico',
  credentials: [
    'Licenciada em Linguística / Inglês',
    '15+ Anos de Experiência Docente e Tradução',
    'Especialista em Formação Académica e Profissional Corporativa',
    'Ex-Formadora Sénior na FISK Angola e ISCED',
    'Membro Ativo da ATIA (Associação de Tradutores e Intérpretes de Angola)',
    'Certificações Internacionais de Competência Linguística e Metodologia Avançada'
  ],
  bio: 'A Professora Esmeralda Bruno Sumbelelo é uma das referências do ensino de inglês técnico e tradução jurídica em Angola. Ao longo de mais de 15 anos de atuação profissional, liderou a capacitação linguística e jurídica de quadros juniores e seniores de grandes escritórios de advogados, banca, administração pública e operadoras petrolíferas nacionais e transnacionais. É conhecida pela sua metodologia dinâmica, que cruza os sistemas de Civil Law aplicados em Angola e Common Law usados em transações internacionais.',
  experienceYears: 15,
  specializations: [
    'Legal English Drafting',
    'Comparative Law Terminology',
    'Legal Translation (Português - Inglês)',
    'Professional Advocacy Communication'
  ],
  institutions: [
    'FISK Escolas de Línguas',
    'ISCED (Instituto Superior de Ciências da Educação)',
    'ATIA (Associação de Tradutores e Intérpretes)'
  ],
  photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=700' // Premium look dark suit professional woman
};

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'A Importância do Inglês Jurídico no Contexto do Setor de Petróleos em Angola',
    slug: 'importancia-ingles-juridico-petroleos-angola',
    excerpt: 'Com a nova dinâmica regulatória do Conteúdo Local, o domínio da linguagem técnica contratual em inglês tornou-se um requisito obrigatório de carreira.',
    content: `O mercado de petróleo, gás e biocombustíveis em Angola é inerentemente internacional. Embora a legislação angolana seja redigida e interpretada em Língua Portuguesa, quase todas as negociações de consórcios, acordos de partilha de produção (APPs), contratos de prestação de serviços (JOAs - Joint Operating Agreements) e litígios internacionais ocorrem de forma predominante em Língua Inglesa.

Para o jovem jurista ou mesmo de nível sênior, a falta de familiaridade com o jargão do e-commerce das concessões pode significar a exclusão de oportunidades decisivas. Termos como "Farm-in", "Farm-out", "Lifting Agreement" ou "Decommissioning" trazem consigo uma bagagem conceitual profunda que vai muito além de uma simples tradução literal.

A MultiPlus Academy estruturou o curso de Inglês Jurídico precisamente para que o profissional consiga navegar nas nuances e garantir propostas assertivas sob a égide jurídica vigente em Angola.`,
    category: 'Setor de Petróleo e Gás',
    date: '02 Junho, 2026',
    readTime: '5 min de leitura',
    image: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=800&h=500', // Offshore rig/industrial energy
    author: {
      name: 'Esmeralda Sumbelelo',
      role: 'Formadora MultiPlus',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150'
    }
  },
  {
    id: 'post-2',
    title: 'Drafting: Como Traduzir e Redigir Cláusulas "Boilerplate" sem Erros Críticos',
    slug: 'drafting-clausulas-boilerplate-sem-erros',
    excerpt: 'Análise minuciosa de cláusulas de Força Maior e Resolução de Diferendos na perspetiva comparada.',
    content: `As cláusulas standard, vulgarmente conhecidas como "Boilerplate", muitas vezes recebem pouca atenção por parte de negociadores, sendo copiadas de modelos genéricos ou mal traduzidas de contratos originais americanos ou britânicos.

Esse erro acarreta perigo severo de nulidade ou fragilidade jurídica, especialmente quando a jurisdição do contrato é a República de Angola (onde o Código Civil impõe regras estritas sobre a boa fé contratual e teoria da imprevisão).

Neste artigo, avaliamos os termos em inglês usados para definir:
1. "Force Majeure" (Força Maior e Caso Fortuito)
2. "Severability" (Divisibilidade das Cláusulas)
3. "Governing Law" (Lei Reguladora)

Entender o significado técnico destes termos garante que eventuais imprevistos não impliquem perdas catastróficas nas transações de comércio internacional.`,
    category: 'Redação de Contratos',
    date: '28 Maio, 2026',
    readTime: '7 min de leitura',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800&h=500', // Legal document / pen
    author: {
      name: 'Esmeralda Sumbelelo',
      role: 'Formadora MultiPlus',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150'
    }
  },
  {
    id: 'post-3',
    title: 'Arbitragem Internacional vs. Resolução judicial em Angola',
    slug: 'arbitragem-internacional-vs-judicial-angola',
    excerpt: 'Entenda os termos mais comuns aplicados nas cláusulas arbitrais e na estruturação do tribunal de arbitragem.',
    content: `A Arbitragem Comercial Internacional tem sido o meio preferencial dos parceiros internacionais para dirimir desavenças no mercado angolano, devido à rapidez nos trâmites se comparada com tribunais estaduais.

Neste cenário de arbitragem, todos os articulados, despachos e audiências costumam desenrolar-se inteiramente em inglês, empregando conceitos britânicos e sob regulamentos da ICC ou de outras câmaras internacionais.

Estudar vocabulário prático como "arbitral award" (sentença arbitral), "interim relief" (medidas cautelares) e o funcionamento do "arbitral chamber" é fundamental para qualquer assessor jurídico corporativo no Huambo ou em Luanda.`,
    category: 'Resolução de Conflitos',
    date: '15 Maio, 2026',
    readTime: '6 min de leitura',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800&h=500', // Courtroom / library
    author: {
      name: 'Esmeralda Sumbelelo',
      role: 'Formadora MultiPlus',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150'
    }
  }
];

export const TESTIMONIALS_PLACEHOLDERS = [
  {
    id: 't-1',
    authorName: 'Dr. Francisco K. Costa',
    authorRole: 'Advogado Associado Sénior - Gabinete de Luanda',
    testimonyFeedback: 'Espaço reservado para o testemunho oficial do aluno MultiPlus Academy. A recolha e validação académica do feedback real dos juristas angolanos que frequentam este curso está a ser processada pela nossa equipe pedagógica.'
  },
  {
    id: 't-2',
    authorName: 'Dra. Maria Celeste Ngola',
    authorRole: 'Consultora de Compliance de Petróleo e Gás no Huambo',
    testimonyFeedback: 'Espaço reservado para o testemunho oficial do aluno MultiPlus Academy. A experiência de formação corporativa sobre regulação aduaneira e conteúdo local em Angola será refletida neste canal de avaliações estruturadas.'
  },
  {
    id: 't-3',
    authorName: 'Dr. André Tomás Luvualo',
    authorRole: 'Diretor Jurídico Interno - Setor de Logística e Portos',
    testimonyFeedback: 'Espaço reservado para o testemunho oficial do aluno MultiPlus Academy. Depoimento académico focado no impacto prático duma formação em inglês jurídico na negociação de contratos de transporte marítimo.'
  }
];
