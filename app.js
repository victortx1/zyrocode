// app.js - Lobby principal, módulos/cursos e motor de aulas
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { syncLeaderboard } from "./js/leaderboard-sync.js";
import { completeLesson as completeLessonCloud, applyUserPatch } from "./js/game-api.js";

const COURSE_TOPICS = [
  { key: "html-css", icon: "🌐", color: "#f97316", basic: "HTML e CSS básico", advanced: "HTML e CSS avançado", subject: "HTML e CSS" },
  { key: "javascript", icon: "JS", color: "#facc15", basic: "JavaScript básico", advanced: "JavaScript avançado", subject: "JavaScript" },
  { key: "cpp", icon: "C++", color: "#38bdf8", basic: "C++ básico", advanced: "C++ avançado", subject: "C++" },
  { key: "csharp", icon: "C#", color: "#a855f7", basic: "C# básico", advanced: "C# avançado", subject: "C#" },
  { key: "python", icon: "PY", color: "#22c55e", basic: "Python básico", advanced: "Python avançado", subject: "Python" },
  { key: "php", icon: "PHP", color: "#818cf8", basic: "PHP básico", advanced: "PHP avançado", subject: "PHP" },
  { key: "java", icon: "☕", color: "#ef4444", basic: "Java básico", advanced: "Java avançado", subject: "Java" },
  { key: "cyber", icon: "🛡️", color: "#14b8a6", basic: "Cybersegurança básica", advanced: "Cybersegurança avançada", subject: "Cybersegurança" }
];

const TOPIC_DETAILS = {
  "HTML e CSS": {
    basicGoal: "HTML estrutura o conteúdo e CSS cuida do visual",
    basicPractice: "criar uma página simples com títulos, textos, cores e espaçamentos",
    advancedGoal: "semântica, responsividade, acessibilidade e CSS organizado"
  },
  JavaScript: {
    basicGoal: "JavaScript adiciona lógica e interatividade às páginas",
    basicPractice: "usar variáveis, funções e condições simples",
    advancedGoal: "estado, assincronismo, modularização e tratamento de erros"
  },
  "C++": {
    basicGoal: "C++ usa código compilado, tipos e controle direto de memória",
    basicPractice: "usar variáveis, funções, entrada e saída no terminal",
    advancedGoal: "ponteiros, referências, RAII, desempenho e estruturas de dados"
  },
  "C#": {
    basicGoal: "C# organiza programas com tipos, classes e métodos",
    basicPractice: "criar variáveis, métodos e pequenos programas orientados a objetos",
    advancedGoal: "LINQ, async/await, generics, arquitetura e boas práticas .NET"
  },
  Python: {
    basicGoal: "Python prioriza leitura simples e produtividade",
    basicPractice: "usar variáveis, listas, funções e condicionais",
    advancedGoal: "ambientes virtuais, pacotes, testes, APIs e código idiomático"
  },
  PHP: {
    basicGoal: "PHP roda no servidor e gera respostas para a web",
    basicPractice: "trabalhar com variáveis, arrays, formulários e páginas dinâmicas",
    advancedGoal: "PDO, segurança, sessões, arquitetura MVC e APIs"
  },
  Java: {
    basicGoal: "Java usa classes, objetos e roda na JVM",
    basicPractice: "criar classes, métodos, variáveis e programas simples",
    advancedGoal: "coleções, generics, streams, concorrência e arquitetura"
  },
  Cybersegurança: {
    basicGoal: "Cybersegurança protege dados, contas, sistemas e usuários",
    basicPractice: "reconhecer senhas fortes, phishing, permissões e backups",
    advancedGoal: "modelagem de ameaças, criptografia, hardening, logs e resposta a incidentes"
  }
};

const STAGE_TITLES = ["Primeiros passos", "Prática", "Quiz", "Desafio"];
const STAGE_ICONS = ["🚀", "🛠️", "❓", "🏁"];

const QUESTION_BANK = {
  basic: {
    "html-css": [
      [
        mc("Qual tag HTML representa o conteúdo principal de uma página?", ["<main>", "<style>", "<script>", "<footer>"]),
        tf("A tag <h1> deve indicar o título mais importante da página.", true),
        mc("Qual propriedade CSS altera a cor do texto?", ["color", "background-image", "margin", "display"]),
        fill("Complete: para ligar um CSS externo usamos a tag ____.", "link", "Fica dentro do <head>."),
        mc("Qual seletor CSS escolhe elementos com class=\"card\"?", [".card", "#card", "card()", "<card>"])
      ],
      [
        mc("Qual atributo do <img> descreve a imagem para acessibilidade?", ["alt", "href", "target", "rel"]),
        tf("padding é o espaço interno entre conteúdo e borda.", true),
        mc("Qual display costuma organizar itens em linha ou coluna flexível?", ["flex", "table-caption", "ruby", "hidden"]),
        fill("Complete: a propriedade ____ arredonda cantos.", "border-radius", "Use hífen entre as palavras."),
        mc("Em HTML, links são criados principalmente com qual tag?", ["<a>", "<navlink>", "<url>", "<go>"])
      ]
    ],
    javascript: [
      [
        mc("Qual palavra cria uma variável que pode mudar em JavaScript moderno?", ["let", "fixed", "define", "newvar"]),
        tf("const impede reatribuir a variável, mas objetos ainda podem ter propriedades alteradas.", true),
        mc("Qual método mostra algo no console do navegador?", ["console.log", "print.html", "screen.write", "debug.show"]),
        fill("Complete: uma função pode devolver valor com ____.", "return", "Palavra usada para retornar."),
        mc("Qual operador compara valor e tipo?", ["===", "=", "=>", "!==="])
      ],
      [
        mc("Qual estrutura executa código só se uma condição for verdadeira?", ["if", "loop", "array", "import"]),
        tf("Arrays em JavaScript podem guardar vários valores em uma lista.", true),
        mc("Qual índice acessa o primeiro item de um array?", ["0", "1", "-1", "first"]),
        fill("Complete: document.____ seleciona um elemento por seletor CSS.", "querySelector", "Começa com query."),
        mc("Qual evento costuma disparar quando um botão é pressionado?", ["click", "loadData", "paint", "resizeOnly"])
      ]
    ],
    cpp: [
      [
        mc("Qual biblioteca permite usar cout em C++?", ["iostream", "stdioonly", "vector2", "console.h"]),
        tf("Em C++, int é um tipo usado para números inteiros.", true),
        mc("Qual operador envia texto para cout?", ["<<", ">>", "=>", "::"]),
        fill("Complete: o ponto de entrada comum é int ____().", "main", "Função inicial do programa."),
        mc("Qual símbolo encerra muitas instruções em C++?", [";", ":", ".", ","])
      ],
      [
        mc("Qual tipo guarda verdadeiro ou falso em C++?", ["bool", "truth", "bit", "logic"]),
        tf("cin pode ler dados digitados pelo usuário.", true),
        mc("Qual estrutura repete código enquanto uma condição for verdadeira?", ["while", "case", "using", "namespace"]),
        fill("Complete: std::____ imprime saída quando usado com <<.", "cout", "Objeto de saída padrão."),
        mc("Qual contêiner da STL funciona como lista dinâmica?", ["vector", "integer", "stream", "class"])
      ]
    ],
    csharp: [
      [
        mc("Qual método imprime texto no console em C#?", ["Console.WriteLine", "System.Print", "Echo.Line", "Screen.Log"]),
        tf("C# é uma linguagem fortemente tipada.", true),
        mc("Qual palavra declara uma classe em C#?", ["class", "objectdef", "typeclass", "module"]),
        fill("Complete: public static void ____ costuma iniciar apps console.", "Main", "Nome do método de entrada."),
        mc("Qual tipo guarda texto em C#?", ["string", "textual", "charlist", "sentence"])
      ],
      [
        mc("Qual palavra cria uma nova instância de classe?", ["new", "make", "build", "instance"]),
        tf("bool em C# aceita true ou false.", true),
        mc("Qual estrutura trata escolhas com vários casos?", ["switch", "repeat", "namespace", "using"]),
        fill("Complete: uma lista genérica pode ser List<____> para inteiros.", "int", "Tipo inteiro."),
        mc("Qual palavra permite reutilizar namespaces?", ["using", "include", "require", "take"])
      ]
    ],
    python: [
      [
        mc("Qual função mostra texto no terminal em Python?", ["print", "echo", "console.log", "writeLine"]),
        tf("Python usa indentação para marcar blocos de código.", true),
        mc("Qual tipo representa uma lista mutável?", ["list", "tupleonly", "bag", "arrayfixed"]),
        fill("Complete: para criar função usamos ____ nome():", "def", "Três letras."),
        mc("Qual operador testa igualdade em Python?", ["==", "=", "===", "equals"])
      ],
      [
        mc("Qual estrutura percorre itens de uma lista?", ["for", "scan", "eachonly", "walk"]),
        tf("Dicionários Python guardam pares chave-valor.", true),
        mc("Qual valor representa ausência de valor em Python?", ["None", "null", "empty()", "void"]),
        fill("Complete: para importar módulo usamos ____ math.", "import", "Palavra de importação."),
        mc("Qual método adiciona item ao final de uma lista?", ["append", "pushBack", "addLastOnly", "insertEnd"])
      ]
    ],
    php: [
      [
        mc("Como variáveis normalmente começam em PHP?", ["$", "@", "#", "%"]),
        tf("PHP é muito usado no lado do servidor.", true),
        mc("Qual comando pode exibir texto em PHP?", ["echo", "console.log", "cout", "putshtml"]),
        fill("Complete: arquivos PHP costumam começar com ____.", "<?php", "Abertura da linguagem."),
        mc("Qual superglobal recebe dados enviados por formulário POST?", ["$_POST", "$POSTS", "POST_DATA", "$requestPost"])
      ],
      [
        mc("Qual estrutura guarda vários valores indexados em PHP?", ["array", "vectorOnly", "listFixed", "bag"]),
        tf("PHP pode misturar HTML e trechos de código no mesmo arquivo.", true),
        mc("Qual operador concatena strings em PHP?", [".", "+", "&", "::"]),
        fill("Complete: para verificar condição usamos ____.", "if", "Também existe em várias linguagens."),
        mc("Qual função conta elementos de um array?", ["count", "lengthOf", "sizeOnly", "totalize"])
      ]
    ],
    java: [
      [
        mc("Qual método é ponto de entrada comum em Java?", ["public static void main", "start public app", "Main()", "run static void"]),
        tf("Java roda sobre a JVM.", true),
        mc("Qual palavra cria uma classe em Java?", ["class", "struct", "module", "type"]),
        fill("Complete: para imprimir linha usamos System.out.____.", "println", "Print com quebra de linha."),
        mc("Qual tipo guarda números inteiros comuns em Java?", ["int", "number", "integerOnly", "num"])
      ],
      [
        mc("Qual palavra cria objetos em Java?", ["new", "make", "object", "spawn"]),
        tf("String em Java representa textos.", true),
        mc("Qual modificador torna um membro acessível de fora da classe?", ["public", "outer", "openall", "global"]),
        fill("Complete: uma condição começa com ____.", "if", "Duas letras."),
        mc("Qual coleção representa lista dinâmica comum?", ["ArrayList", "IntBag", "DynamicOnly", "LineList"])
      ]
    ],
    cyber: [
      [
        mc("Qual prática melhora a segurança de uma senha?", ["Usar senha longa e única", "Repetir a mesma senha", "Usar 123456", "Compartilhar no chat"]),
        tf("Phishing tenta enganar pessoas para roubar dados.", true),
        mc("Qual recurso adiciona uma camada extra ao login?", ["Autenticação em dois fatores", "Nome curto", "Tema escuro", "Cache limpo"]),
        fill("Complete: cópia de segurança também é chamada de ____.", "backup", "Ajuda na recuperação."),
        mc("Qual atitude é segura antes de clicar em um link suspeito?", ["Verificar remetente e endereço", "Clicar rápido", "Baixar anexos", "Enviar senha"])
      ],
      [
        mc("Qual dado não deve ser compartilhado em mensagens?", ["Código de verificação", "Cor favorita", "Apelido público", "Tema do app"]),
        tf("Atualizações corrigem falhas de segurança conhecidas.", true),
        mc("Qual conexão é mais arriscada para dados sensíveis?", ["Wi-Fi público sem proteção", "Rede confiável com senha", "VPN corporativa", "Cabo local seguro"]),
        fill("Complete: limitar acesso ao necessário segue o princípio do menor ____.", "privilégio", "Permissão mínima."),
        mc("Qual ação ajuda após suspeita de invasão?", ["Trocar senha e encerrar sessões", "Ignorar alertas", "Reusar senha antiga", "Desativar 2FA"])
      ]
    ]
  },
  advanced: {
    "html-css": [
      [
        mc("Qual escolha melhora semântica e acessibilidade em layouts complexos?", ["Usar landmarks como main, nav e aside", "Trocar tudo por div", "Remover headings", "Usar texto em imagem"]),
        tf("Container queries ajudam componentes a responder ao próprio espaço disponível.", true),
        mc("Qual técnica reduz conflitos em CSS grande?", ["Escopo e nomenclatura consistente", "IDs aleatórios em tudo", "Inline style sempre", "Duplicar regras"]),
        fill("Complete: aria-____ pode conectar um controle ao texto que o descreve.", "describedby", "Atributo ARIA de descrição."),
        mc("Qual métrica visual pode ser afetada por imagens sem dimensões?", ["CLS", "DNS", "JWT", "SQL"])
      ],
      [
        mc("Qual estratégia melhora CSS crítico no carregamento inicial?", ["Priorizar estilos acima da dobra", "Carregar tudo bloqueando", "Remover cache", "Usar seletores gigantes"]),
        tf("Grid é melhor que flex quando há controle simultâneo de linhas e colunas.", true),
        mc("Qual seletor reduz especificidade ao agrupar condições?", [":where()", ":maximum()", ":globalOnly()", ":deepest()"]),
        fill("Complete: prefers-reduced-____ respeita usuários sensíveis a animações.", "motion", "Preferência de movimento."),
        mc("Qual prática ajuda responsividade profissional?", ["Testar breakpoints por conteúdo", "Usar largura fixa sempre", "Ocultar overflow", "Aumentar fonte por vw"])
      ]
    ],
    javascript: [
      [
        mc("Qual recurso evita bloquear a thread enquanto uma Promise resolve?", ["async/await", "while infinito", "alert", "JSON.stringify"]),
        tf("Debounce ajuda a reduzir chamadas repetidas em eventos frequentes.", true),
        mc("Qual padrão separa código em arquivos reutilizáveis?", ["Módulos ES", "Variáveis globais", "eval", "HTML inline"]),
        fill("Complete: try/catch trata ____ em tempo de execução.", "erros", "Falhas capturáveis."),
        mc("Qual API permite cancelar fetch em andamento?", ["AbortController", "StopFetch", "CancelHTTP", "PromiseBreaker"])
      ],
      [
        mc("Qual risco aparece ao inserir HTML vindo do usuário sem sanitização?", ["XSS", "CORS resolvido", "Cache hit", "Tree shaking"]),
        tf("Event delegation pode reduzir listeners em listas grandes.", true),
        mc("Qual estrutura guarda chaves sem impedir garbage collection?", ["WeakMap", "Array", "JSON", "Date"]),
        fill("Complete: import dinâmico retorna uma ____.", "promise", "Objeto assíncrono."),
        mc("Qual prática melhora manutenção de estado complexo?", ["Atualizações previsíveis e imutáveis", "Mutar tudo sem regra", "Esconder estado no DOM", "Duplicar fontes de verdade"])
      ]
    ],
    cpp: [
      [
        mc("Qual princípio libera recurso automaticamente ao sair do escopo?", ["RAII", "AJAX", "MVC", "DOM"]),
        tf("Referências podem evitar cópias desnecessárias de objetos grandes.", true),
        mc("Qual smart pointer expressa posse única?", ["std::unique_ptr", "std::shared_lock", "std::vector_ptr", "std::only_ref"]),
        fill("Complete: move semantics usam std::____ para transferir recursos.", "move", "Movimento explícito."),
        mc("Qual contêiner oferece busca média O(1) por chave?", ["std::unordered_map", "std::list", "std::stack", "std::array"])
      ],
      [
        mc("Qual problema acontece ao acessar memória já liberada?", ["Use-after-free", "Overload seguro", "Const cast", "Inline cache"]),
        tf("const correctness ajuda a documentar e proteger intenção de leitura.", true),
        mc("Qual ferramenta detecta vazamentos e acessos inválidos em C++?", ["Sanitizers", "Minifier", "Bundler", "Transpiler"]),
        fill("Complete: templates permitem programação ____.", "genérica", "Mesmo algoritmo para tipos diferentes."),
        mc("Qual escolha reduz cópias em passagem de objeto grande somente leitura?", ["const T&", "T por valor sempre", "void*", "int"])
      ]
    ],
    csharp: [
      [
        mc("Qual recurso simplifica operações assíncronas em C#?", ["async/await", "goto async", "thread sleep", "static void loop"]),
        tf("LINQ permite consultar coleções com sintaxe expressiva.", true),
        mc("Qual tipo representa ausência controlada em referências modernas?", ["nullable reference types", "dynamic all", "object nuller", "void class"]),
        fill("Complete: interfaces definem um ____ sem fixar implementação.", "contrato", "A classe promete cumprir."),
        mc("Qual recurso injeta dependências em apps .NET modernos?", ["Dependency Injection", "Hardcode global", "Manual static only", "Console.Read"])
      ],
      [
        mc("Qual coleção evita itens duplicados?", ["HashSet<T>", "List<T>", "Queue<T>", "Stack<T>"]),
        tf("Entity Framework pode mapear objetos para tabelas de banco.", true),
        mc("Qual modificador restringe acesso à própria classe?", ["private", "public", "open", "external"]),
        fill("Complete: generics em C# usam parâmetros como <____>.", "T", "Letra comum para tipo."),
        mc("Qual prática melhora APIs em C#?", ["Validar entrada e retornar erros claros", "Engolir exceções", "Usar dynamic sempre", "Ignorar logs"])
      ]
    ],
    python: [
      [
        mc("Qual recurso garante fechamento de arquivo automaticamente?", ["with", "auto close", "finally only", "close maybe"]),
        tf("List comprehensions podem criar listas de forma concisa.", true),
        mc("Qual ferramenta isola dependências por projeto?", ["venv", "pip global obrigatório", "sys.path fixo", "zip only"]),
        fill("Complete: type ____ ajudam ferramentas a encontrar erros antes da execução.", "hints", "Dicas de tipo."),
        mc("Qual biblioteca padrão ajuda a criar testes unitários?", ["unittest", "requests", "pygame", "tkinter"])
      ],
      [
        mc("Qual risco existe em executar eval com texto externo?", ["Execução de código malicioso", "Mais segurança", "Menos permissões", "Cache automático"]),
        tf("Geradores com yield podem economizar memória em sequências grandes.", true),
        mc("Qual estrutura é ideal para chave-valor?", ["dict", "list", "tuple", "set ordenado por chave"]),
        fill("Complete: decoradores usam o símbolo ____ antes do nome.", "@", "Símbolo antes da função."),
        mc("Qual prática melhora pacotes Python?", ["Separar módulos e declarar dependências", "Misturar tudo no main", "Fixar senha no código", "Ignorar exceções"])
      ]
    ],
    php: [
      [
        mc("Qual extensão PHP é recomendada para consultas SQL preparadas?", ["PDO", "echoDB", "HTMLSQL", "FormDB"]),
        tf("Prepared statements ajudam a reduzir risco de SQL injection.", true),
        mc("Qual mecanismo guarda dados entre requisições do mesmo usuário?", ["Sessões", "CSS", "Composer dump", "Header title"]),
        fill("Complete: o gerenciador de dependências PHP mais comum é ____.", "composer", "Instala pacotes."),
        mc("Qual padrão separa Modelo, Visão e Controlador?", ["MVC", "FTP", "DOM", "JWT"])
      ],
      [
        mc("Qual prática evita XSS ao exibir texto do usuário?", ["Escapar saída HTML", "Concatenar cru", "Desativar HTTPS", "Salvar senha pura"]),
        tf("Namespaces ajudam a evitar colisão de nomes em projetos PHP.", true),
        mc("Qual função pode transformar senha em hash seguro?", ["password_hash", "md5_fast", "base64_encode", "plain_save"]),
        fill("Complete: para verificar senha com hash usamos password_____.", "verify", "Verifica hash."),
        mc("Qual cabeçalho indica resposta JSON?", ["Content-Type: application/json", "Accept-Password", "X-HTML-Only", "Cache-Secret"])
      ]
    ],
    java: [
      [
        mc("Qual recurso permite operações funcionais em coleções Java?", ["Streams", "Servlet only", "JVM flag", "Jar lock"]),
        tf("Generics ajudam a reduzir casts e erros de tipo.", true),
        mc("Qual palavra garante execução de limpeza em tratamento de exceção?", ["finally", "finish", "ensureJava", "cleanupOnly"]),
        fill("Complete: uma interface funcional possui um método ____ abstrato.", "único", "Apenas um."),
        mc("Qual coleção associa chaves a valores?", ["HashMap", "ArrayList", "Thread", "StringBuilder"])
      ],
      [
        mc("Qual risco ocorre ao compartilhar estado mutável entre threads sem controle?", ["Condição de corrida", "Compilação mais rápida", "Polimorfismo", "Serialização"]),
        tf("try-with-resources fecha recursos que implementam AutoCloseable.", true),
        mc("Qual ferramenta gerencia build e dependências em muitos projetos Java?", ["Maven", "npm only", "pip", "Composer"]),
        fill("Complete: JVM significa Java Virtual ____.", "Machine", "Máquina virtual."),
        mc("Qual prática melhora manutenção em Java?", ["Separar responsabilidades em classes coesas", "Classe gigante única", "Ignorar exceções", "Usar public em tudo"])
      ]
    ],
    cyber: [
      [
        mc("Qual atividade identifica ativos, riscos e controles antes de um ataque?", ["Modelagem de ameaças", "Trocar tema", "Compressão CSS", "Renderização DOM"]),
        tf("Criptografia em trânsito protege dados durante comunicação.", true),
        mc("Qual cabeçalho ajuda a reduzir XSS em aplicações web?", ["Content-Security-Policy", "X-Pretty-Page", "Cache-Color", "Allow-Password"]),
        fill("Complete: registro de eventos de segurança é chamado de ____.", "log", "Ajuda auditoria."),
        mc("Qual prática reduz impacto de credencial vazada?", ["Privilégio mínimo", "Conta admin para todos", "Senha compartilhada", "Sem MFA"])
      ],
      [
        mc("Qual etapa vem depois de detectar um incidente?", ["Conter, investigar e recuperar", "Apagar evidências", "Ignorar alerta", "Publicar senha"]),
        tf("Hash de senha deve usar algoritmo apropriado com salt.", true),
        mc("Qual teste procura falhas exploráveis de forma controlada?", ["Teste de intrusão", "Teste de cor", "Teste de fonte", "Teste de layout"]),
        fill("Complete: segmentar rede reduz movimento ____ do atacante.", "lateral", "Movimento entre sistemas."),
        mc("Qual item pertence a um plano de resposta a incidentes?", ["Papéis, contatos e procedimentos", "Somente logotipo", "Cores do botão", "Ranking semanal"])
      ]
    ]
  }
};

const MODULES = [
  {
    id: "basic",
    icon: "📚",
    theme: "foundation",
    title: "MÓDULO 1 — BÁSICO DO BÁSICO",
    subtitle: "Fundamentos essenciais para começar do zero com segurança.",
    courses: COURSE_TOPICS.map((topic) => createCourse(topic, "basic"))
  },
  {
    id: "advanced",
    icon: "🔥",
    theme: "fire",
    title: "MÓDULO 2 — AVANÇADO",
    subtitle: "Conceitos mais profundos para evoluir para projetos reais.",
    courses: COURSE_TOPICS.map((topic) => createCourse(topic, "advanced"))
  }
];

let userData = null;
let currentView = "modules";
let selectedModule = null;
let selectedCourse = null;
let currentLesson = null;
let currentQIndex = 0;
let currentCorrectCount = 0;
let livesLeft = 5;
let acertosSeguidosSession = 0;

function createCourse(topic, level) {
  const isAdvanced = level === "advanced";
  const id = `${topic.key}-${level}`;

  return {
    id,
    moduleId: level,
    icon: topic.icon,
    color: topic.color,
    title: isAdvanced ? topic.advanced : topic.basic,
    desc: `Tudo sobre o ${isAdvanced ? "avançado" : "básico"} de ${topic.subject}.`,
    lessons: STAGE_TITLES.map((stageTitle, index) => createLesson(topic, level, index + 1))
  };
}

function createLesson(topic, level, number) {
  const isAdvanced = level === "advanced";
  const stageLabel = STAGE_TITLES[number - 1];

  return {
    id: `${topic.key}-${level}-aula-${number}`,
    courseId: `${topic.key}-${level}`,
    moduleId: level,
    title: `${topic.subject}: ${stageLabel}`,
    subject: topic.subject,
    topicKey: topic.key,
    icon: topic.icon,
    color: topic.color,
    xp: isAdvanced ? 50 : 30,
    moedas: isAdvanced ? 25 : 15,
    content: buildContent(topic.subject, level, number),
    questions: buildQuestions(topic.subject, level, number)
  };
}

function buildContent(subject, level, number) {
  const isAdvanced = level === "advanced";
  const details = TOPIC_DETAILS[subject];
  const stageLabel = STAGE_TITLES[number - 1];

  if (!isAdvanced) {
    if (number === 1) {
      return [
        `${subject} começa com o básico: ${details.basicGoal}.`,
        `Nesta fase "${stageLabel}", você descobre como o ${subject} funciona e como ele muda sua forma de criar digitalmente.`
      ];
    }

    if (number === 2) {
      return [
        `Agora é hora de praticar ${subject}. ${details.basicPractice}.`,
        "Complete os exercícios com atenção e observe como a lógica se conecta à prática." 
      ];
    }

    if (number === 3) {
      return [
        `Este quiz testa seu entendimento de ${subject} até agora. Responda com cuidado para avançar.`,
        "Use o que aprendeu nas fases anteriores para acertar as perguntas." 
      ];
    }

    return [
      `Agora você enfrenta o desafio de ${subject}. Pense como um desenvolvedor e utilize o que aprendeu.`,
      "A fase de desafio exige foco, raciocínio e persistência. Complete para desbloquear a próxima linguagem." 
    ];
  }

  if (number === 1) {
    return [
      `No avançado de ${subject}, você entra em conceitos mais sólidos: ${details.advancedGoal}.`,
      "Aqui o objetivo é ampliar sua base com práticas profissionais e decisões mais inteligentes." 
    ];
  }

  if (number === 2) {
    return [
      `A prática avançada de ${subject} explora exemplos reais e estruturas robustas.`,
      "Avalie a qualidade do código e veja como melhorar além do básico." 
    ];

  }

  if (number === 3) {
    return [
      `Este quiz avançado verifica se você domina ${subject} em níveis maiores.`,
      "Responda com confiança e use o conhecimento das etapas anteriores." 
    ];
  }

  return [
    `O desafio final de ${subject} aponta para soluções mais completas e seguras.`,
    "Aqui você coloca tudo em prática no modo criativo e estratégico." 
  ];
}

function buildQuestions(subject, level, number) {
  const topic = COURSE_TOPICS.find((item) => item.subject === subject);
  const topicBank = QUESTION_BANK[level]?.[topic.key] || [];
  if (topicBank[number - 1]) return topicBank[number - 1];
  if (topicBank[number - 2]) return topicBank[number - 2];
  return topicBank[0] || [];
}

function mc(question, options, correct = 0) {
  return { type: "multipla", question, options, correct };
}

function tf(question, correct) {
  return { type: "verdadeiro_falso", question, correct };
}

function fill(question, answer, hint) {
  return { type: "completar", question, answer, hint };
}

function validateQuestionBank() {
  const seen = new Set();
  const duplicates = [];

  MODULES.forEach((module) => {
    module.courses.forEach((course) => {
      course.lessons.forEach((lesson) => {
        lesson.questions.forEach((question) => {
          const key = question.question.trim().toLowerCase();
          if (seen.has(key)) duplicates.push(question.question);
          seen.add(key);
        });
      });
    });
  });

  if (duplicates.length) {
    console.warn("Perguntas repetidas encontradas:", duplicates);
  }
}

validateQuestionBank();

onAuthStateChanged(auth, async (user) => {
  const isGuest = localStorage.getItem("zyroGuest") === "true";

  if (!user && !isGuest) {
    window.location.href = "./login/login.html";
    return;
  }

  if (isGuest) {
    userData = {
      uid: "guest",
      nome: localStorage.getItem("zyroUserName") || "Visitante",
      xp: 0,
      moedas: 100,
      nivel: 1,
      streak: 0,
      vidas: 5,
      aulasConcluidas: [],
      cursosConcluidos: [],
      lessonProgress: {},
      personagemSelecionado: "dev_iniciante",
      inventario: ["dev_iniciante"],
      foto: null
    };
  } else {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      window.location.href = "./login/login.html";
      return;
    }
    userData = { ...snap.data(), uid: user.uid };
    await syncLeaderboard(user.uid, userData);
  }

  renderUI();
  renderLearningView();
});

function normalizeAvatarId(id) {
  if (id === "Astro") return "astro";
  if (id === "avatar_default") return "google";
  return id;
}

function getLobbyAvatarSrc(data) {
  const selectedAvatar = normalizeAvatarId(data.selectedAvatar || data.equippedAvatar || "google");
  const normalizedAvatar = selectedAvatar;
  const photoSource = data.photoURL || data.foto || "";
  if (normalizedAvatar === "google") return photoSource;
  // Return the best available avatar path. We try common extensions when used elsewhere expects a specific file.
  // Prefer explicit filenames used in assets (png, jpg, webp).
  return `../assets/avatars/${normalizedAvatar}`; // extension will be tried by caller
}

function renderUI() {
  document.getElementById("streakVal").textContent = userData.streak || 0;
  document.getElementById("coinsVal").textContent = userData.moedas || 0;
  document.getElementById("heartsVal").textContent = userData.vidas ?? 5;
  document.getElementById("userNivel").textContent = userData.nivel || 1;

  const userAvatar = document.getElementById("userAvatar");
  if (userAvatar) {
    const avatarBase = getLobbyAvatarSrc(userData) || "";
    const setAvatarSrc = (base) => {
      if (!base) { userAvatar.src = ""; return; }
      // If base ends with an extension or is a remote photo URL, use directly
      if (/\.(png|jpg|jpeg|webp)$/.test(base) || /^https?:\/\//.test(base)) {
        userAvatar.src = base;
        return;
      }

      // Try common extensions in order
      const exts = [".png", ".jpg", ".webp", ".jpeg"];
      let tried = 0;
      const tryNext = () => {
        if (tried >= exts.length) { userAvatar.src = ""; return; }
        const candidate = base + exts[tried++];
        const img = new Image();
        img.onload = () => { userAvatar.src = candidate; };
        img.onerror = () => { tryNext(); };
        img.src = candidate;
      };

      // If base looks like a remote image (starts with ../ or / or http), we still try extensions
      if (/^(https?:)?\/\//.test(base) || base.startsWith("../") || base.startsWith("/")) {
        tryNext();
      } else {
        tryNext();
      }
    };

    setAvatarSrc(avatarBase);
    userAvatar.addEventListener("click", () => window.location.href = "./perfil/perfil.html");
  }

  const xpAtual = userData.xp || 0;
  const xpNivel = (userData.nivel || 1) * 200;
  const xpBase = ((userData.nivel || 1) - 1) * 200;
  const xpProgress = xpAtual - xpBase;
  const pct = Math.min(100, Math.max(0, Math.round((xpProgress / 200) * 100)));
  document.getElementById("xpFill").style.width = `${pct}%`;
  document.getElementById("xpLabel").textContent = `${xpAtual} / ${xpNivel} XP`;
}

function renderLearningView() {
  if (currentView === "modules") renderPhaseMap();
  if (currentView === "courses") renderCourses(selectedModule);
  if (currentView === "lessons") renderLessons(selectedModule, selectedCourse);
}

function renderPhaseMap() {
  const map = document.getElementById("phaseMap");
  const allLessons = getAllBasicLessons();
  const currentLessonIndex = allLessons.findIndex((lesson) => getMapLessonState(lesson.id) === "current");
  const nextIndex = currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1;

  renderBreadcrumb([{ view: "modules", label: "Mapa" }]);

  map.innerHTML = `
    <section class="phase-hero">
      <div class="phase-hero-copy">
        <span class="eyebrow">Trilha</span>
        <h2>Mapa vertical gamificado</h2>
        <p>Avance por linguagens em uma trilha laranja e preta, desbloqueie fases e conquiste cada etapa do ZyroCode.</p>
      </div>
      <div class="phase-meta">
        <div class="phase-meta-card">
          <strong>${userData.aulasConcluidas?.length || 0}</strong>
          <span>Aulas concluídas</span>
        </div>
        <div class="phase-meta-card">
          <strong>${nextIndex}</strong>
          <span>Próxima fase</span>
        </div>
      </div>
    </section>

    <div class="phase-track">
      ${COURSE_TOPICS.map((topic, topicIndex) => renderTrackTopic(topic, topicIndex)).join("")}
    </div>
  `;

  map.querySelectorAll(".map-node-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("locked")) return;
      const lessonId = btn.dataset.lesson;
      const lesson = getAllBasicLessons().find((item) => item.id === lessonId);
      if (!lesson) return;
      openLesson(lesson);
    });
  });
}

function getAllBasicLessons() {
  const basicModule = MODULES.find((module) => module.id === "basic");
  if (!basicModule) return [];
  return basicModule.courses.flatMap((course) => course.lessons);
}

function getMapLessonState(lessonId) {
  const allLessons = getAllBasicLessons();
  const currentIndex = allLessons.findIndex((lesson) => lesson.id === lessonId);
  if (currentIndex === -1) return "locked";
  if (isLessonDone(lessonId)) return "completed";
  if (currentIndex === 0) return "current";
  const previous = allLessons[currentIndex - 1];
  return isLessonDone(previous.id) ? "current" : "locked";
}

function renderTrackTopic(topic, topicIndex) {
  const module = MODULES.find((mod) => mod.id === "basic");
  const course = module?.courses.find((course) => course.id === `${topic.key}-basic`);
  if (!course) return "";
  let nodeIndex = topicIndex * 4;

  return `
    <div class="track-topic-group">
      <div class="topic-badge">${escHtml(topic.basic)}</div>
      ${course.lessons.map((lesson, stepIndex) => {
        const state = getMapLessonState(lesson.id);
        const sideClass = nodeIndex % 2 === 0 ? "left" : "right";
        const nodeHtml = renderTrackNode(lesson, topic, stepIndex, state, nodeIndex);
        nodeIndex += 1;
        return `<div class="map-node-row ${sideClass} ${state}">${nodeHtml}</div>`;
      }).join("")}
    </div>
  `;
}

function renderTrackNode(lesson, topic, stepIndex, state, nodeIndex) {
  const icon = state === "completed" ? "✓" : state === "locked" ? "🔒" : STAGE_ICONS[stepIndex] || "●";
  const infoHtml = `
    <div class="map-node-info">
      <span class="map-node-title">${escHtml(STAGE_TITLES[stepIndex])}</span>
      <small>${escHtml(topic.basic)}</small>
    </div>
  `;
  const buttonHtml = `
    <button type="button" class="map-node-button ${state}" data-lesson="${lesson.id}" ${state === "locked" ? "disabled" : ""} aria-label="${escHtml(topic.subject)} - ${escHtml(STAGE_TITLES[stepIndex])}">
      <span class="map-node ${state}">${icon}</span>
    </button>
  `;

  return nodeIndex % 2 === 0 ? `${infoHtml}${buttonHtml}` : `${buttonHtml}${infoHtml}`;
}

function renderBreadcrumb(items = []) {
  const crumb = document.getElementById("learningBreadcrumb");
  crumb.innerHTML = `
    <button class="crumb-btn" data-view="modules">Módulos</button>
    ${items.map((item) => `<span>/</span><button class="crumb-btn" data-view="${item.view}">${escHtml(item.label)}</button>`).join("")}
  `;

  crumb.querySelectorAll(".crumb-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.view;
      if (currentView === "modules") {
        selectedModule = null;
        selectedCourse = null;
      }
      if (currentView === "courses") selectedCourse = null;
      renderLearningView();
    });
  });
}

function renderModules() {
  renderBreadcrumb();
  const map = document.getElementById("phaseMap");

  map.innerHTML = MODULES.map((module) => {
    const completed = getModuleCompletedCount(module);
    const total = module.courses.reduce((sum, course) => sum + course.lessons.length, 0);

    return `
      <button class="module-card theme-${module.theme}" data-module="${module.id}">
        <span class="module-card-icon">${module.icon}</span>
        <span class="module-card-copy">
          <strong>${escHtml(module.title)}</strong>
          <small>${escHtml(module.subtitle)}</small>
          <em>${completed}/${total} aulas concluídas</em>
        </span>
        <span class="module-card-arrow">›</span>
      </button>
    `;
  }).join("");

  map.querySelectorAll(".module-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedModule = MODULES.find((module) => module.id === card.dataset.module);
      currentView = "courses";
      renderLearningView();
    });
  });
}

function renderCourses(module) {
  renderBreadcrumb([{ view: "courses", label: module.title.replace("MÓDULO ", "") }]);
  const map = document.getElementById("phaseMap");
  const lessons = getModuleLessons(module);
  const completed = lessons.filter((lesson) => isLessonDone(lesson.id)).length;

  map.innerHTML = `
    <section class="duo-module theme-${module.theme}">
      <div class="duo-module-head">
        <span class="duo-module-icon">${module.icon}</span>
        <div>
          <h2>${escHtml(module.title)}</h2>
          <p>${escHtml(module.subtitle)}</p>
          <strong>${completed}/${lessons.length} aulas concluídas</strong>
        </div>
      </div>

      <div class="duo-trail">
        ${module.courses.map((course) => {
          const courseDone = isCourseDone(course);

          return `
            <section class="trail-course" style="--course-color:${course.color}">
              <div class="trail-course-head">
                <span class="course-icon">${course.icon}</span>
                <div>
                  <h3>${escHtml(course.title)}</h3>
                  <p>${escHtml(course.desc)}</p>
                </div>
                <span class="course-status">${courseDone ? "✓" : ""}</span>
              </div>

              <div class="trail-nodes">
                ${course.lessons.map((lesson) => renderTrailNode(module, lesson)).join("")}
              </div>
            </section>
          `;
        }).join("")}
      </div>
    </section>
  `;

  map.querySelectorAll(".trail-node").forEach((node) => {
    node.addEventListener("click", () => {
      const lesson = lessons.find((item) => item.id === node.dataset.lesson);
      if (!lesson) return;

      if (node.classList.contains("locked")) {
        showToast("Conclua a aula anterior primeiro.");
        return;
      }

      openLesson(lesson);
    });
  });
}

function renderTrailNode(module, lesson) {
  const state = getLessonState(module, lesson);
  const progress = isLessonDone(lesson.id) ? 5 : getSavedProgress(lesson.id).correctCount || 0;

  return `
    <button class="trail-node ${state}" data-lesson="${lesson.id}" style="--course-color:${lesson.color}">
      <span class="trail-node-core">
        <span class="trail-node-icon">${state === "completed" ? "★" : state === "locked" ? "🔒" : lesson.icon}</span>
      </span>
      <span class="trail-node-copy">
        <strong>${escHtml(lesson.title)}</strong>
        <small>${progress}/5 concluídas</small>
      </span>
    </button>
  `;
}

function renderLessons(module, course) {
  renderBreadcrumb([
    { view: "courses", label: module.title.replace("MÓDULO ", "") },
    { view: "lessons", label: course.title }
  ]);

  const map = document.getElementById("phaseMap");

  map.innerHTML = `
    <div class="lessons-panel">
      <div class="lessons-panel-head">
        <span class="course-icon">${course.icon}</span>
        <div>
          <h2>${escHtml(course.title)}</h2>
          <p>${escHtml(course.desc)}</p>
        </div>
      </div>

      <div class="lesson-list">
        ${course.lessons.map((lesson, index) => {
          const done = isLessonDone(lesson.id);
          const unlocked = index === 0 || isLessonDone(course.lessons[index - 1].id);
          const saved = getSavedProgress(lesson.id);
          const progress = done ? 5 : saved.correctCount || 0;

          return `
            <button class="lesson-row ${done ? "completed" : unlocked ? "unlocked" : "locked"}" data-lesson="${lesson.id}" ${unlocked || done ? "" : "disabled"}>
              <span class="lesson-number">${done ? "✓" : unlocked ? index + 1 : "🔒"}</span>
              <span class="lesson-copy">
                <strong>${escHtml(lesson.title)}</strong>
                <small>${progress}/5 concluídas</small>
              </span>
              <span class="lesson-xp">+${lesson.xp} XP</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;

  map.querySelectorAll(".lesson-row").forEach((row) => {
    row.addEventListener("click", () => {
      const lesson = course.lessons.find((item) => item.id === row.dataset.lesson);
      if (lesson) openLesson(lesson);
    });
  });
}

function isLessonDone(lessonId) {
  return (userData.aulasConcluidas || []).includes(lessonId);
}

function isCourseDone(course) {
  return course.lessons.every((lesson) => isLessonDone(lesson.id));
}

function getModuleLessons(module) {
  return module.courses.flatMap((course) => course.lessons);
}

function getLessonState(module, lesson) {
  if (isLessonDone(lesson.id)) return "completed";

  const lessons = getModuleLessons(module);
  const index = lessons.findIndex((item) => item.id === lesson.id);
  const unlocked = index === 0 || isLessonDone(lessons[index - 1].id);

  if (!unlocked) return "locked";
  return "current";
}

function getModuleCompletedCount(module) {
  return module.courses
    .flatMap((course) => course.lessons)
    .filter((lesson) => isLessonDone(lesson.id)).length;
}

function getSavedProgress(lessonId) {
  return userData.lessonProgress?.[lessonId] || {};
}

function showToast(message) {
  let toast = document.getElementById("appToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function openLesson(lesson) {
  currentLesson = lesson;
  const saved = getSavedProgress(lesson.id);
  livesLeft = userData.vidas ?? 5;
  currentCorrectCount = isLessonDone(lesson.id) ? 0 : saved.correctCount || 0;

  if (!isLessonDone(lesson.id) && currentCorrectCount >= lesson.questions.length) {
    finishLesson();
    return;
  }

  currentQIndex = currentCorrectCount;
  document.getElementById("lessonModal").classList.remove("hidden");
  renderQuestion();
}

function closeLesson() {
  document.getElementById("lessonModal").classList.add("hidden");
}

function renderQuestion() {
  const q = currentLesson.questions[currentQIndex];
  const total = currentLesson.questions.length;
  const pct = Math.round((currentCorrectCount / total) * 100);
  const content = document.getElementById("lessonContent");

  content.innerHTML = `
    <div class="lesson-top">
      <div>
        <span class="question-counter">${currentCorrectCount}/${total} concluídas</span>
        <h3>${escHtml(currentLesson.title)}</h3>
      </div>
      <button class="lesson-close" id="btnClose">✕</button>
    </div>

    <div class="lesson-copy-block">
      ${currentLesson.content.map((paragraph) => `<p>${escHtml(paragraph)}</p>`).join("")}
    </div>

    <div class="progress-bar-wrap">
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>

    <div class="lives-row">${renderHearts(livesLeft)}</div>

    <div class="question-card">
      <div class="question-type-badge">${getTypeLabel(q.type)}</div>
      <div class="question-text">${escHtml(q.question)}</div>
      ${q.code ? `<div class="code-block">${escHtml(q.code)}</div>` : ""}
      <div id="questionBody"></div>
    </div>

    <div class="feedback-bar" id="feedbackBar"></div>
    <button class="btn-next hidden" id="btnNext">${currentCorrectCount + 1 >= total ? "Próxima aula" : "Próxima pergunta"} →</button>
  `;

  document.getElementById("btnClose").addEventListener("click", closeLesson);
  document.getElementById("btnNext").addEventListener("click", nextQuestion);

  const body = document.getElementById("questionBody");
  if (q.type === "multipla") renderMultipla(q, body);
  if (q.type === "verdadeiro_falso") renderVF(q, body);
  if (q.type === "completar") renderCompletar(q, body);
}

function renderHearts(lives) {
  let html = "";
  for (let i = 0; i < 5; i++) html += `<span class="heart${i >= lives ? " empty" : ""}">❤️</span>`;
  return html;
}

function getTypeLabel(type) {
  const map = {
    multipla: "Múltipla escolha",
    verdadeiro_falso: "Verdadeiro ou falso",
    completar: "Complete"
  };
  return map[type] || type;
}

function escHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMultipla(q, body) {
  const letters = ["A", "B", "C", "D"];
  body.innerHTML = `<div class="options-grid">${q.options.map((opt, i) =>
    `<button class="option-btn" data-i="${i}"><span class="option-letter">${letters[i]}</span>${escHtml(opt)}</button>`
  ).join("")}</div>`;

  body.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chosen = Number(btn.dataset.i);
      if (chosen === q.correct) {
        btn.classList.add("correct");
        lockOptions(body);
        handleCorrectAnswer("Correto. Pode avançar.");
      } else {
        btn.classList.add("wrong");
        handleWrongAnswer("Ainda não. Leia o feedback e tente novamente.");
        setTimeout(() => btn.classList.remove("wrong"), 700);
      }
    });
  });
}

function renderVF(q, body) {
  body.innerHTML = `
    <div class="options-grid">
      <button class="option-btn" data-val="true"><span class="option-letter">V</span>Verdadeiro</button>
      <button class="option-btn" data-val="false"><span class="option-letter">F</span>Falso</button>
    </div>
  `;

  body.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chosen = btn.dataset.val === "true";
      if (chosen === q.correct) {
        btn.classList.add("correct");
        lockOptions(body);
        handleCorrectAnswer("Correto. Pode avançar.");
      } else {
        btn.classList.add("wrong");
        handleWrongAnswer(`Ainda não. A resposta não é ${chosen ? "verdadeiro" : "falso"}.`);
        setTimeout(() => btn.classList.remove("wrong"), 700);
      }
    });
  });
}

function renderCompletar(q, body) {
  body.innerHTML = `
    <input class="fill-input" id="fillInput" placeholder="Digite sua resposta..." autocomplete="off" spellcheck="false" />
    <p class="question-hint">Dica: ${escHtml(q.hint)}</p>
    <button class="btn-next" id="btnCheck" style="margin-top:12px;">Verificar</button>
  `;

  document.getElementById("btnCheck").addEventListener("click", () => {
    const input = document.getElementById("fillInput");
    const value = input.value.trim().toLowerCase();
    const correct = q.answer.toLowerCase();

    if (value === correct) {
      input.disabled = true;
      document.getElementById("btnCheck").style.display = "none";
      handleCorrectAnswer("Correto. Pode avançar.");
    } else {
      handleWrongAnswer("Ainda não. Revise a dica e tente de novo.");
      input.focus();
    }
  });
}

function lockOptions(body) {
  body.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
}

async function handleCorrectAnswer(message) {
  showFeedback(true, message);
  currentCorrectCount++;
  acertosSeguidosSession++;
  await saveLessonProgress();
  document.getElementById("btnNext").classList.remove("hidden");
}

function handleWrongAnswer(message) {
  showFeedback(false, message);
  loseHeart();
  acertosSeguidosSession = 0;
}

function showFeedback(correct, msg) {
  const bar = document.getElementById("feedbackBar");
  bar.className = `feedback-bar show ${correct ? "correct-fb" : "wrong-fb"}`;
  bar.textContent = `${correct ? "✓" : "✕"} ${msg}`;
}

function loseHeart() {
  if (livesLeft > 0) livesLeft--;
  const livesRow = document.querySelector(".lives-row");
  if (livesRow) livesRow.innerHTML = renderHearts(livesLeft);

  if (livesLeft === 0) {
    setTimeout(() => {
      closeLesson();
      alert("Você ficou sem vidas. Compre mais na loja ou aguarde.");
    }, 700);
  }
}

function nextQuestion() {
  if (livesLeft === 0) {
    closeLesson();
    return;
  }

  if (currentCorrectCount >= currentLesson.questions.length) {
    finishLesson();
    return;
  }

  currentQIndex = currentCorrectCount;
  saveLessonProgress();
  renderQuestion();
}

async function saveLessonProgress() {
  const progress = {
    correctCount: currentCorrectCount,
    currentQIndex: currentCorrectCount,
    total: currentLesson.questions.length,
    updatedAt: new Date().toISOString()
  };

  userData.lessonProgress = {
    ...(userData.lessonProgress || {}),
    [currentLesson.id]: progress
  };

  if (userData.uid === "guest") return;

  await updateDoc(doc(db, "users", userData.uid), {
    [`lessonProgress.${currentLesson.id}`]: progress,
    vidas: Math.max(0, livesLeft),
    ultimoAcesso: serverTimestamp()
  });
}

async function finishLesson() {
  closeLesson();

  let cloudResult = null;
  const alreadyDone = isLessonDone(currentLesson.id);
  const xpGain = alreadyDone ? 0 : currentLesson.xp;
  const coinGain = alreadyDone ? 0 : currentLesson.moedas;
  const course = findCourse(currentLesson.courseId);
  const completedCourseNow = course && course.lessons.every((lesson) => {
    return lesson.id === currentLesson.id || isLessonDone(lesson.id);
  });

  if (userData.uid !== "guest") {
    try {
      cloudResult = await completeLessonCloud({
        lessonId: currentLesson.id,
        courseId: currentLesson.courseId,
        livesLeft,
        acertosSeguidosSession
      });
    } catch (error) {
      console.warn("completeLesson (cloud) falhou, tentando fluxo legado:", error);
    }

    if (cloudResult?.user) {
      applyUserPatch(userData, cloudResult.user);
      userData.vidas = Math.max(0, livesLeft);
      userData.lessonProgress = {
        ...(userData.lessonProgress || {}),
        [currentLesson.id]: {
          correctCount: 5,
          currentQIndex: 5,
          total: 5,
          completed: true
        }
      };
    } else {
      const ref = doc(db, "users", userData.uid);
      const updates = {
        [`lessonProgress.${currentLesson.id}.correctCount`]: 5,
        [`lessonProgress.${currentLesson.id}.currentQIndex`]: 5,
        [`lessonProgress.${currentLesson.id}.completed`]: true,
        vidas: Math.max(0, livesLeft),
        ultimoAcesso: serverTimestamp()
      };

      if (!alreadyDone) {
        updates.xp = increment(xpGain);
        updates.moedas = increment(coinGain);
        updates.aulasConcluidas = arrayUnion(currentLesson.id);
      }

      if (completedCourseNow) {
        updates.cursosConcluidos = arrayUnion(currentLesson.courseId);
        updates[`achievements.${getAchievementIdForCourse(currentLesson.courseId)}`] = true;
      }

      await updateDoc(ref, updates);

      const newXP = (userData.xp || 0) + xpGain;
      const newNivel = Math.floor(newXP / 200) + 1;
      if (newNivel > (userData.nivel || 1)) {
        await updateDoc(ref, { nivel: newNivel });
        userData.nivel = newNivel;
      }

      await syncLeaderboard(userData.uid, userData);
      await updateMissions(xpGain);
    }
  }

  const resolvedAlreadyDone = cloudResult?.alreadyDone ?? alreadyDone;
  const resolvedXpGain = cloudResult?.xpGain ?? (resolvedAlreadyDone ? 0 : currentLesson.xp);
  const resolvedCoinGain = cloudResult?.coinGain ?? (resolvedAlreadyDone ? 0 : currentLesson.moedas);
  const resolvedCourseDone = cloudResult?.completedCourseNow ?? completedCourseNow;

  if (!resolvedAlreadyDone && !cloudResult?.user) {
    userData.xp = (userData.xp || 0) + resolvedXpGain;
    userData.moedas = (userData.moedas || 0) + resolvedCoinGain;
    userData.aulasConcluidas = [...(userData.aulasConcluidas || []), currentLesson.id];
  }

  if (resolvedCourseDone && !cloudResult?.user) {
    userData.cursosConcluidos = [...new Set([...(userData.cursosConcluidos || []), currentLesson.courseId])];
    userData.achievements = {
      ...(userData.achievements || {}),
      [getAchievementIdForCourse(currentLesson.courseId)]: true
    };
  }

  userData.vidas = Math.max(0, livesLeft);
  userData.lessonProgress = {
    ...(userData.lessonProgress || {}),
    [currentLesson.id]: {
      correctCount: 5,
      currentQIndex: 5,
      total: 5,
      completed: true
    }
  };

  renderUI();
  renderLearningView();
  showVictory(resolvedXpGain, resolvedCoinGain, resolvedCourseDone);
}

function findCourse(courseId) {
  return MODULES.flatMap((module) => module.courses).find((course) => course.id === courseId);
}

function getAchievementIdForCourse(courseId) {
  if (courseId === "html-css-basic") return "html_master";
  if (courseId === "javascript-basic") return "js_spark";
  return `course_${courseId.replace(/-/g, "_")}_completed`;
}

async function updateMissions(xpGain) {
  try {
    const ref = doc(db, "missions", userData.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const d = data.daily || {};
    const updates = {};

    if (!d.completeLesson?.done) updates["daily.completeLesson.progress"] = 1;
    if (!d.gainXP?.done) updates["daily.gainXP.progress"] = (d.gainXP?.progress || 0) + xpGain;
    if (!d.login?.done) updates["daily.login.progress"] = 1;
    if (acertosSeguidosSession >= 5 && !d.streak5?.done) updates["daily.streak5.progress"] = 5;
    if (currentLesson.courseId.includes("html-css") && !d.htmlLesson?.done) updates["daily.htmlLesson.progress"] = 1;

    if (Object.keys(updates).length) await updateDoc(ref, updates);
  } catch (error) {
    console.warn("Não foi possível atualizar missões:", error);
  }
}

function showVictory(xp, coins, completedCourseNow) {
  document.getElementById("victoryMsg").textContent = completedCourseNow
    ? `Curso concluído: ${findCourse(currentLesson.courseId)?.title || currentLesson.title}`
    : `Você concluiu: ${currentLesson.title}`;

  document.getElementById("victoryRewards").innerHTML =
    xp > 0
      ? `<div class="reward-chip">+${xp} XP ⚡</div><div class="reward-chip">+${coins} 🪙</div>`
      : `<div class="reward-chip">Aula já concluída</div>`;

  document.getElementById("victoryScreen").classList.remove("hidden");
  document.getElementById("btnContinue").addEventListener("click", () => {
    document.getElementById("victoryScreen").classList.add("hidden");
  }, { once: true });
}