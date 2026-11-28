import type { LegalDocument } from "./types";

export const termsPtBR: LegalDocument = {
  title: "Termos de uso",
  summary: "O acordo para usar o xquads: o seu workspace, os seus agentes e pelo que cada lado responde.",
  updated: "2026-11-28",
  sections: [
    {
      id: "agreement",
      heading: "1. Acordo",
      blocks: [
        'Estes Termos de uso (os "Termos") são um acordo vinculante entre a Carvalho-Karsten Tecnologia Ltda, empresa brasileira que atua sob o nome DockPlus AI (CNPJ 40.402.200/0001-95, "nós"), e a pessoa ou entidade que cria uma conta ou um workspace ("você"). Ao criar uma conta, entrar num workspace ou usar de outra forma o xquads na web em https://agents.xquads.com, no app de Mac ou nos apps de celular para iPhone e Android (o "Serviço"), você aceita estes Termos e a nossa Política de privacidade. Se você usa o Serviço em nome de uma empresa ou outra entidade, declara que tem poderes para obrigá-la.',
        "Para usar o Serviço, você precisa ter pelo menos 18 anos e capacidade para firmar contratos.",
      ],
    },
    {
      id: "service",
      heading: "2. O Serviço",
      blocks: [
        "O Serviço é um workspace onde pessoas e agentes de IA trabalham juntos. Ele inclui canais, threads e mensagens diretas, e agentes com função, instruções, memória e orçamento próprios. Inclui também tarefas, wiki, Drive, calendário e rotinas, aprovações, conectores com outros serviços e a opção de conectar computadores em que os agentes podem trabalhar.",
        "O Serviço é novo e continua evoluindo: os recursos podem mudar, ser limitados ou removidos. Podemos abrir contas novas só por convite durante um tempo, ou para qualquer pessoa que se cadastrar. Quando possível, avisaremos antes de remover algo de que você dependa.",
      ],
    },
    {
      id: "accounts",
      heading: "3. Contas e workspaces",
      blocks: [
        "Você responde pela exatidão dos dados da sua conta, pela segurança das suas credenciais e por toda atividade na sua conta. Os donos e administradores de um workspace decidem quem entra nele, com quais cargos, quais agentes existem e o que esses agentes podem fazer. Quando estes Termos dizem que um workspace é dono de algo, decide algo ou responde por algo, falam da pessoa ou entidade que o criou, ou em nome de quem ele foi criado, agindo pelos donos e administradores dele. Avise-nos logo em support@xquads.com se achar que uma conta, uma chave ou um computador conectado foi comprometido.",
      ],
    },
    {
      id: "agents",
      heading: "4. Os agentes e o que eles fazem",
      blocks: [
        "Os agentes agem conforme as instruções, permissões, conectores, orçamentos e computadores que você e o seu workspace dão a eles. O que um agente faz dentro dessas permissões, incluindo mensagens que envia, código que altera, dados que lê, escreve ou apaga e comandos que roda num computador, é feito em nome do seu workspace, e o seu workspace responde por isso nestes Termos. Cada agente tem uma pessoa responsável por ele.",
        "Ações difíceis de desfazer viram um pedido de aprovação para uma pessoa antes de acontecer, a não ser que o seu workspace tenha configurado esse agente para agir sem perguntar. Aprovar é decisão sua. O Serviço mostra o que será feito, mas cabe a você conferir.",
        "O que a IA produz pode estar errado, incompleto ou desatualizado, mesmo quando parece seguro. Confira o que os agentes produzem antes de confiar nisso, e não use como substituto de aconselhamento profissional (jurídico, médico, financeiro ou outro) nem como única base para decisões com efeitos jurídicos ou igualmente relevantes sobre pessoas.",
      ],
    },
    {
      id: "acceptable-use",
      heading: "5. Uso aceitável",
      blocks: [
        "Você concorda em não usar o Serviço, nem deixar que agentes sejam usados, para:",
        {
          list: [
            "violar a lei, infringir direitos de terceiros ou tratar dados pessoais sem base legal",
            "enviar spam ou mensagens não solicitadas, ou assediar, ameaçar, enganar ou se passar por alguém",
            "criar ou distribuir malware, phishing, conteúdo que sexualize menores, que promova violência ou que seja ilegal de outra forma",
            "contornar os limites e as proteções do Serviço, como orçamentos, limites de uso, aprovações, permissões ou as verificações em computadores conectados e bancos de dados",
            "atacar o Serviço ou terceiros por meio dele, incluindo procurar vulnerabilidades, sobrecarregá-lo ou plantar instruções para tomar o controle dos agentes de outras pessoas",
            "acessar um serviço, computador ou dado que você não está autorizado a usar, ou usar um serviço conectado contra os termos dele",
            "violar as políticas de uso dos provedores de modelos de IA que rodam os seus agentes.",
          ],
        },
        "Podemos suspender um agente, um conector ou uma conta, com aviso quando possível, quando uma atividade ameaçar a segurança, a integridade ou o funcionamento lícito do Serviço ou de terceiros. Podemos investigar suspeitas de violação desta seção, inclusive lendo o Conteúdo do Workspace, como a Política de privacidade descreve.",
      ],
    },
    {
      id: "content",
      heading: "6. O seu conteúdo",
      blocks: [
        '"Conteúdo do Workspace" é o que você e as outras pessoas do seu workspace colocam no Serviço e o que os seus agentes produzem nele. O seu workspace é dono do Conteúdo do Workspace dele e, entre você e nós, o que os agentes produzem para você é seu, sujeito aos termos do provedor de modelo que o produziu. O que um modelo produz pode ser parecido com o que ele produz para outras pessoas.',
        "Você nos concede os direitos limitados necessários para operar o Serviço: armazenar, tratar, transmitir e exibir o Conteúdo do Workspace para fazer funcionar o seu workspace e os seus agentes, enviá-lo aos provedores que os seus agentes usam e às empresas que o tratam para nós, conforme a Política de privacidade, prestar suporte, manter o Serviço funcionando e seguro, fazer cumprir estes Termos e cumprir a lei. Não vendemos o Conteúdo do Workspace e não o usamos para treinar modelos de aprendizado de máquina.",
        "O seu workspace é o controlador dos dados pessoais no Conteúdo do Workspace dele, e nós tratamos esses dados conforme as instruções dele, como operador, nos termos da Política de privacidade. Para confiança e segurança, para a segurança do Serviço e para o que a lei exige de nós, agimos como controlador por conta própria, como descreve a Seção 7 da Política de privacidade.",
      ],
    },
    {
      id: "third-parties",
      heading: "7. Provedores de modelo, conectores e as suas próprias contas",
      blocks: [
        "Os agentes rodam em modelos de IA de terceiros. Os modelos próprios da plataforma são da OpenAI, e um serviço de roteamento, a TypeSafe, lê um trecho curto de cada mensagem nova para decidir qual agente responde. Para produzir as respostas, o Serviço envia a esses provedores o que as pessoas escrevem aos agentes, e os arquivos e o contexto de que os agentes precisam. A Seção 2 da Política de privacidade descreve isso por completo.",
        "Um workspace também pode conectar a própria chave de API ou o próprio plano de IA com outro provedor, por exemplo a Anthropic, que faz o Claude, a OpenAI, o Google ou a DeepSeek. O uso dessa chave ou desse plano também segue o seu contrato com o provedor dele, e você responde por seguir os termos dele e pelas cobranças dele.",
        "Os conectores dão aos agentes acesso a outros serviços (como GitHub, Google ou uma caixa de e-mail). Esses serviços são prestados por terceiros sob os próprios termos. A disponibilidade deles e o que fazem com os dados estão fora do nosso controle.",
      ],
    },
    {
      id: "computers",
      heading: "8. Computadores conectados",
      blocks: [
        "Se você conecta um computador, instala um programa que deixa os agentes rodarem comandos e usarem um navegador nele, dentro das pastas e permissões que você define nesse computador. Você responde pelo computador, pelo que permite nele e por manter cópias de segurança do que importa. As permissões só podem ser ampliadas no próprio computador, e você pode desconectá-lo a qualquer momento.",
      ],
    },
    {
      id: "data-protection",
      heading: "9. Proteção de dados",
      blocks: [
        "Cada parte cumprirá as suas obrigações pela LGPD quanto aos dados pessoais no seu Conteúdo do Workspace, e pelo GDPR ou pelo UK GDPR quando eles também se aplicarem. Um workspace pode pedir um Acordo de Tratamento de Dados (DPA) em support@xquads.com. A lista atual das empresas que tratam dados para nós está na Política de privacidade. Um pedido de suporte que um membro do seu workspace nos envia é a instrução do seu workspace para lermos aquilo de que o pedido trata.",
      ],
    },
    {
      id: "fees",
      heading: "10. Sem cobrança, uso justo e orçamentos",
      blocks: [
        "O Serviço não tem plano pago, e não cobramos pelo uso dele. Valem estas regras:",
        {
          list: [
            "**Uso justo.** Alguns recursos rodam em serviços de IA que oferecemos sem custo, como os modelos próprios da plataforma e a escolha de qual agente responde. Podemos limitá-los num workspace cujo uso esteja muito acima do normal.",
            "**Orçamentos.** Os orçamentos definidos por workspace e por agente param o uso de modelos pelos agentes quando são atingidos. Eles fazem parte do Serviço, não são um defeito dele. O que um provedor cobra pela sua própria chave ou plano de IA é entre você e esse provedor.",
          ],
        },
      ],
    },
    {
      id: "ip",
      heading: "11. Propriedade intelectual e sugestões",
      blocks: [
        "O software do Serviço é de código aberto, sob a GNU Affero General Public License, versão 3 (AGPL-3.0), que rege os seus direitos sobre esse código. Exceto pelo seu Conteúdo do Workspace e pelos direitos que essa licença concede, nós e os nossos licenciantes mantemos todos os direitos sobre o Serviço, incluindo o nome e as marcas xquads. Sugestões que você decidir nos enviar podem ser usadas sem obrigação com você.",
      ],
    },
    {
      id: "termination",
      heading: "12. Vigência e encerramento",
      blocks: [
        "Você pode parar de usar o Serviço e excluir a sua conta a qualquer momento no app. Ela é apagada 7 dias depois, e você pode restaurá-la até lá. Podemos suspender ou encerrar o seu acesso por violação relevante destes Termos, quando a lei exigir, ou com 30 dias de aviso se descontinuarmos o Serviço. Quando encerrarmos o Serviço por motivo que não seja violação sua, deixaremos o seu Conteúdo do Workspace disponível para exportação por 30 dias e depois o apagaremos como descrito na Política de privacidade. As seções que, por natureza, sobrevivem ao encerramento (incluindo 6, 9, 11, 13, 14 e 15) continuam valendo.",
      ],
    },
    {
      id: "disclaimers",
      heading: "13. Isenções",
      blocks: [
        'O Serviço, incluindo tudo o que os agentes produzem e fazem, é fornecido "no estado em que se encontra" e "conforme disponível". Não garantimos que o Serviço ou os agentes funcionarão sem interrupções, sem erros, com exatidão ou de forma adequada aos seus fins. Na medida em que a lei permite, não damos garantias além das que estes Termos preveem.',
      ],
    },
    {
      id: "liability",
      heading: "14. Limitação de responsabilidade",
      blocks: [
        "Na medida em que a lei permite, nenhuma das partes responde por danos indiretos, nem por lucros cessantes, perda de receita ou de dados. Na mesma medida, a nossa responsabilidade total decorrente do Serviço fica limitada ao que você nos pagou pelo Serviço nos doze meses anteriores ao fato que deu origem ao pedido. Esses limites não se aplicam à sua violação da Seção 5 nem à responsabilidade que a lei não permite limitar, inclusive pelo Código de Defesa do Consumidor (Lei 8.078/1990), quando ele se aplica.",
      ],
    },
    {
      id: "indemnification",
      heading: "15. Indenização",
      blocks: [
        "Você nos defenderá e indenizará contra pedidos de terceiros decorrentes do seu Conteúdo do Workspace, do que os seus agentes fizeram dentro das permissões que você deu a eles ou da sua violação da Seção 5.",
      ],
    },
    {
      id: "law",
      heading: "16. Lei aplicável",
      blocks: [
        "Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro da comarca de São João Batista, Santa Catarina, Brasil, para qualquer disputa sobre eles, exceto quando a lei dá ao consumidor o direito de propor a ação no foro do próprio domicílio.",
      ],
    },
    {
      id: "changes",
      heading: "17. Mudanças nestes Termos",
      blocks: [
        "Podemos atualizar estes Termos. Mudanças relevantes serão anunciadas por e-mail ou no app pelo menos 14 dias antes de entrarem em vigor. Continuar usando depois dessa data significa aceitá-las. A versão atual fica sempre nesta página. Estes Termos são escritos em português. Se a versão em inglês divergir, prevalece a versão em português.",
      ],
    },
    {
      id: "contact",
      heading: "18. Contato",
      blocks: [
        "Carvalho-Karsten Tecnologia Ltda (DockPlus AI), CNPJ 40.402.200/0001-95, Rua Leoberto Leal, 243, Sala 02, Escritório 22, Centro, São João Batista/SC, Brasil. Para notificações legais, ajuda com o Serviço ou qualquer outro assunto, escreva para support@xquads.com. Site público: https://xquads.com.",
      ],
    },
  ],
};
