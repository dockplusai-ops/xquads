import type { LegalDocument } from "./types";

export const privacyPtBR: LegalDocument = {
  title: "Política de privacidade",
  summary:
    "O que coletamos, quais provedores de IA recebem o seu conteúdo, quem pode ver o seu workspace e os seus direitos.",
  updated: "2026-11-28",
  sections: [
    {
      id: "overview",
      heading: "1. Visão geral",
      blocks: [
        'A Carvalho-Karsten Tecnologia Ltda, empresa brasileira que atua sob o nome DockPlus AI (CNPJ 40.402.200/0001-95, "nós"), opera o xquads: um workspace onde pessoas e agentes de IA trabalham juntos. O xquads está disponível na web em https://agents.xquads.com, como app de Mac e como app de celular para iPhone e Android (o "Serviço"). Esta política distingue três papéis:',
        {
          list: [
            "Para os **dados de conta**, as informações que as pessoas nos dão para criar e usar uma conta, somos o controlador.",
            "Para o **Conteúdo do Workspace**, tudo o que as pessoas e os agentes de um workspace colocam ou produzem nele, somos operador e agimos conforme as instruções do workspace. O workspace é o controlador, ou seja, a pessoa ou entidade que o criou ou em nome de quem ele foi criado.",
            "Nos poucos casos da Seção 7 em que agimos por conta própria (confiança e segurança, a segurança do Serviço e o que a lei exige de nós), somos o controlador dos dados pessoais no Conteúdo do Workspace que lemos para isso.",
          ],
        },
        "**Provedores de IA.** O que você escreve aos agentes, e os arquivos e o contexto de que eles precisam, é enviado a provedores de modelos de IA de terceiros para que os agentes possam responder. A Seção 2 diz quais são.",
      ],
    },
    {
      id: "ai-providers",
      heading: "2. Provedores de IA que recebem o seu conteúdo",
      blocks: [
        "Os agentes são modelos de IA operados por outras empresas. Para produzir uma resposta, o Serviço envia o que as pessoas escrevem aos agentes, e os arquivos e o contexto de que os agentes precisam, a um provedor de modelos de IA. Estas empresas recebem esse conteúdo:",
        {
          list: [
            "**OpenAI.** Os modelos próprios da plataforma são da OpenAI. Quando um agente trabalha com eles, a OpenAI recebe as instruções do agente, a conversa, os arquivos e o contexto de que o agente precisa para responder.",
            "**TypeSafe.** Um serviço de roteamento. Ele lê um trecho curto de cada mensagem nova para decidir qual agente responde. O Serviço também o usa para verificações curtas, como decidir se algo vale ser guardado na memória de um agente ou se uma ação deve esperar por uma pessoa.",
            "**Provedores que um workspace conecta.** Um workspace pode conectar as próprias chaves ou contas com outros provedores, por exemplo a Anthropic, que faz o Claude, a OpenAI, o Google ou a DeepSeek. Esses provedores recebem o conteúdo desse workspace sob o contrato do próprio workspace com eles.",
          ],
        },
        "Cada provedor trata esse conteúdo sob os próprios termos. Só o enviamos para que os agentes possam responder e fazer o trabalho deles. Não vendemos esse conteúdo e não o usamos para treinar modelos de IA. A Seção 6 explica o que os agentes enviam em cada caso, e a Seção 10 lista todas as empresas que tratam dados para nós.",
      ],
    },
    {
      id: "data-we-collect",
      heading: "3. Dados que coletamos como controlador",
      blocks: [
        {
          list: [
            "**Dados de conta:** nome, e-mail, hash da senha, foto de perfil, idioma e fuso horário. Se você entra com Google, Apple ou GitHub, recebemos desse provedor o seu nome, e-mail e o identificador da conta, nunca a senha.",
            "**Dados do workspace:** nome do workspace, membros, cargos e convites.",
            "**Pedidos de suporte:** o que você nos envia quando pede ajuda: as suas palavras, o item que você reportou e o que ele diz, a tela em que você estava e as imagens ou o vídeo que você anexar.",
            "**Dados de uso e registros:** endereços IP, navegador e aparelho, sessões de login, eventos de segurança, requisições à API e o registro de cada chamada a um modelo (modelo, tokens e custo, com o workspace e o agente a que pertence), que guardamos para aplicar orçamentos e mostrar o uso. Quando algo quebra, o nosso servidor registra o erro, sem o conteúdo das mensagens, para podermos corrigi-lo. Guardamos também um registro de cada vez que a nossa equipe leu Conteúdo do Workspace com as ferramentas que a Seção 7 descreve: quem leu, qual item, quando e por quê, nunca o conteúdo.",
            "**Aparelhos:** no app de celular, o token de notificação de cada aparelho em que você entra. Nos computadores conectados e no app de Mac, o nome do computador, o sistema operacional e a versão do app.",
          ],
        },
      ],
    },
    {
      id: "how-we-use",
      heading: "4. Como usamos os dados de conta",
      blocks: [
        "Usamos os dados de conta para prestar e proteger o Serviço (incluindo detectar e impedir abusos), aplicar orçamentos e limites, responder a pedidos de suporte e cumprir obrigações legais. Também os usamos para enviar mensagens do Serviço: confirmações de e-mail, convites, redefinições de senha, pedidos de aprovação e as notificações que você ativou.",
        "Pela LGPD, tratamos os dados de conta para executar o nosso contrato com você (art. 7º, V), para cumprir obrigações legais (art. 7º, II) e pelo nosso legítimo interesse em manter o Serviço seguro (art. 7º, IX).",
        "Não vendemos dados pessoais e não usamos o Conteúdo do Workspace para treinar modelos de aprendizado de máquina.",
      ],
    },
    {
      id: "workspace-content",
      heading: "5. Conteúdo do Workspace, tratado em nome dos workspaces",
      blocks: [
        "O Conteúdo do Workspace inclui mensagens em canais, threads e mensagens diretas, arquivos do Drive e páginas da wiki. Inclui também tarefas, rotinas, eventos do calendário e aprovações, as instruções, configurações e a memória dos agentes, o que os agentes escrevem e fazem, e os dados que os agentes leem pelos conectores, bancos de dados e computadores que o workspace conecta. Nós o tratamos só para fazer funcionar o workspace e os agentes como o workspace os configurou, mostrá-lo aos membros do workspace, enviar as notificações que eles pedem, prestar suporte, manter o Serviço funcionando e seguro e para os casos da Seção 7 em que agimos por conta própria.",
        "O Conteúdo do Workspace pertence ao workspace: os membros veem o que os canais e as permissões dele permitem, e os donos e administradores dele o gerenciam. Os donos e administradores do workspace veem todos os canais, tarefas e páginas da wiki, inclusive os privados. Eles não leem mensagens diretas entre outras pessoas. As mensagens que você escreveu continuam no workspace depois que você sai dele ou exclui a sua conta, a não ser que o workspace as apague.",
      ],
    },
    {
      id: "agents",
      heading: "6. Como os agentes tratam o Conteúdo do Workspace",
      blocks: [
        "Agentes são modelos de IA que leem e agem dentro do workspace. O Conteúdo do Workspace sai dos nossos servidores nos casos abaixo. A Seção 10 lista as empresas que o tratam para nós.",
        {
          list: [
            "**Para responder.** Quando um agente trabalha, ele envia o contexto de que precisa (o contexto do workspace, as instruções do agente, a conversa, a memória relevante, os arquivos e os resultados das ferramentas) ao provedor de modelo escolhido para esse agente. Nos modelos próprios da plataforma, esse provedor é a OpenAI. Com uma chave ou uma conta que o workspace conectou, a chamada é feita na conta do próprio workspace e sob o contrato dele com esse provedor. Alguns provedores repassam a chamada à empresa que faz ou hospeda o modelo, que também a trata sob os termos desse provedor. Com um plano de IA, como o do Claude ou o do ChatGPT, conectado a um agente, o agente trabalha na conta da pessoa que conectou o plano e sob os termos do provedor.",
            "**Para decidir quem responde.** Um modelo de roteamento na TypeSafe lê um trecho curto da mensagem nova, com os nomes e as funções dos agentes do workspace, para decidir qual agente deve responder, se algum. Se a TypeSafe estiver indisponível, quem decide é o provedor de modelo do workspace. O roteamento nunca dá permissão nenhuma a um agente.",
            "**Memória.** Os agentes guardam memória das conversas (resumos, fatos e lições) para melhorar com o tempo. Algumas avaliações sobre a memória, como decidir se algo vale ser guardado, são feitas pela TypeSafe. A memória pode ser vista e apagada na página do agente, e é apagada junto com o workspace.",
            "**Conectores.** Quando o workspace conecta um serviço (como GitHub, Google, uma caixa de e-mail ou qualquer servidor MCP), guardamos os tokens de acesso cifrados e lemos ou escrevemos nesse serviço só dentro dos escopos que o workspace deu a cada agente. O serviço conectado trata esses dados sob os próprios termos.",
            "**Bancos de dados.** Conexões com bancos de dados são só de leitura. As credenciais ficam cifradas e cada consulta é verificada antes de rodar.",
            "**Computadores conectados.** Quando alguém conecta um computador, os agentes podem rodar comandos e usar um navegador nele, dentro das pastas e permissões definidas nesse computador. A visão ao vivo do navegador de um agente passa pela memória dos nossos servidores e não é gravada. Um resumo dos passos que o agente deu (como os endereços visitados e as ações) fica junto do trabalho dele, para a equipe ver o que ele fez.",
            "**O computador do workspace.** Os agentes de um workspace trabalham num computador que mantemos para esse workspace, em servidores que administramos no Brasil.",
            "**Armazenamento, e-mail e notificações.** Os arquivos enviados e os backups do banco de dados ficam guardados na Cloudflare (R2). Os e-mails saem pelo nosso próprio servidor de e-mail. As notificações no celular que citam uma mensagem passam pela Apple (APNs) e pelo Google (Firebase Cloud Messaging). Um pedido de suporte que você nos envia, com o que você anexar, chega à nossa equipe por e-mail.",
            "**Busca na web.** Quando um agente busca na web, as palavras da busca vão a um buscador. Quando ele abre uma página, o site vê o endereço pedido, como o de qualquer visitante.",
            "**GIFs.** Quando um agente ou uma pessoa busca um GIF, as palavras da busca vão à GIPHY.",
          ],
        },
        "Ações difíceis de desfazer (como fazer merge de código, publicar ou enviar em nome de alguém) viram um pedido de aprovação para uma pessoa antes de acontecer, a não ser que o workspace tenha configurado esse agente para agir sem perguntar. Texto que vem de fora do workspace (páginas da web, e-mails, arquivos) é marcado como não confiável antes de um agente ler.",
      ],
    },
    {
      id: "staff-access",
      heading: "7. Quando a nossa equipe pode ver o Conteúdo do Workspace",
      blocks: [
        "Nós não navegamos pelos workspaces. Fora do funcionamento do seu workspace, descrito nas Seções 5 e 6, a nossa equipe só lê o Conteúdo do Workspace:",
        {
          list: [
            "**A seu pedido,** para ajudar num pedido de suporte que um membro do seu workspace nos enviou: pelo app, pelo e-mail da conta dele ou por outro meio, quando confirmamos que o pedido é dele. Lemos aquilo de que o pedido trata e nada além do que o membro que pediu consegue ver. Respondemos só no endereço da conta desse membro. Para isso, uma mensagem direta só é lida quando alguém daquela conversa pediu.",
            "**Para corrigir uma falha,** quando algo no Serviço falhou ou travou, como o trabalho de um agente que terminou em erro ou parou de avançar. Lemos aquilo de que a falha trata, e nunca uma mensagem direta.",
            "**Por confiança e segurança,** para detectar e investigar suspeita de abuso, fraude, conteúdo ilegal ou ameaça à segurança do Serviço ou de outras pessoas, ou para fazer cumprir os nossos Termos de uso. Podemos fazer isso sem avisar o workspace na hora. Se restringirmos um workspace ou uma conta, dizemos por quê e como contestar, a não ser que uma ordem de uma autoridade nos proíba de dizer. Para isso, numa conversa direta lemos só o que foi dito a um agente ou por um agente, nunca mensagens entre pessoas, a não ser que alguém daquela conversa as tenha denunciado ou que a lei exija.",
            "**Quando a lei exige.**",
          ],
        },
        "A seu pedido e para corrigir uma falha, agimos conforme as instruções do workspace. Por confiança e segurança, nos apoiamos no nosso legítimo interesse em manter o Serviço e as outras pessoas seguros (art. 7º, IX, da LGPD e, quando se aplica, art. 6(1)(f) do GDPR) e, quando a lei exige, nessa obrigação legal. Você pode se opor como descrevem as Seções 12 e 13.",
        "A nossa equipe lê com ferramentas que entregam um item de cada vez. Cada leitura feita com essas ferramentas é feita por um desses motivos e é registrada antes de acontecer: quem leu, qual item, quando e por quê. Uma leitura do que o seu workspace escreveu, feita com essas ferramentas a seu pedido ou para corrigir uma falha, também aparece no registro de auditoria do seu workspace: o item, qual desses motivos e, quando foi a pedido, de quem (no caso de uma mensagem direta, só que houve a leitura e a pedido de quem). Uma leitura feita com elas por confiança e segurança é anotada ali quando a investigação termina e, no máximo, sete dias depois da leitura, a não ser que a lei nos proíba de dizer.",
        "As pessoas que operam a nossa infraestrutura conseguem chegar aos servidores e bancos de dados que guardam o Conteúdo do Workspace. Elas usam esse acesso só para manter o Serviço funcionando, como restaurar backups, ou para cumprir uma obrigação legal. Nenhum desses caminhos é usado para criar perfis, publicidade ou dados de treino.",
      ],
    },
    {
      id: "retention",
      heading: "8. Retenção",
      blocks: [
        {
          list: [
            "**Dados de conta:** enquanto a conta existir. Quando você exclui a sua conta no app, ela sai de todos os aparelhos na hora e é apagada 7 dias depois, a não ser que você a restaure antes disso, e sai dos nossos backups em até 30 dias depois disso, exceto registros que a lei nos obriga a manter. Qualquer workspace em que você era o único membro fecha no mesmo momento, e o conteúdo dele é apagado 7 dias depois, como descrito a seguir. Os workspaces em que você esteve guardam o seu nome e o seu e-mail nos registros de auditoria deles enquanto cada um existir.",
            "**Conteúdo do Workspace:** enquanto o workspace existir, e antes disso quando o workspace apaga um conteúdo. Quando um dono exclui um workspace, ele fecha para todos na hora e o conteúdo dele é apagado 7 dias depois, a não ser que um dono o restaure antes disso. Ele sai dos nossos backups em até 30 dias depois disso, exceto o conteúdo que a lei nos obriga a manter ou que é registro de abuso (abaixo), e exceto o que lemos para suporte ou para uma investigação, que segue a linha própria abaixo.",
            "**Registros:** registros de requisições e de segurança por até 90 dias. Registros de uso de modelos (tokens e custo) enquanto o workspace existir, porque os orçamentos e os relatórios de uso dependem deles.",
            "**Pedidos de suporte:** o que você nos enviou ao pedir ajuda, por 90 dias. Imagens e vídeo, por 30 dias.",
            "**Suporte e investigações:** o que lemos para responder a um pedido de suporte ou para analisar uma falha ou suspeita de abuso, por até 90 dias depois da leitura, mesmo que o workspace apague antes, a não ser que seja registro de abuso (abaixo). A nossa conclusão sobre um caso, que não contém nada do conteúdo, fica no registro do caso. O nosso registro de cada leitura feita com as ferramentas que a Seção 7 descreve (quem, quando, qual item e por quê, nunca o conteúdo) por um ano.",
            "**Contas que suspendemos ou encerramos por abuso:** podemos manter os registros da conta e do abuso além desses prazos, inclusive depois de um pedido de exclusão, pelo tempo necessário para exercer ou defender direitos, cumprir obrigações legais e impedir que as mesmas pessoas abusem do Serviço de novo, com base nos artigos 7º, VI e IX, e 16, I, da LGPD e, quando se aplica, no artigo 17(3)(b) e (e) e no artigo 6(1)(f) do GDPR.",
          ],
        },
      ],
    },
    {
      id: "security",
      heading: "9. Segurança",
      blocks: [
        "Os dados são cifrados em trânsito (TLS). Chaves de provedores de modelo, tokens de conectores e credenciais de bancos de dados são cifrados com criptografia de envelope por workspace e nunca voltam para o navegador nem para os apps. O acesso aos sistemas de produção é restrito às pessoas que operam o Serviço. Se soubermos de um incidente de segurança que possa trazer risco ou dano relevante às pessoas, avisaremos os workspaces afetados e a ANPD, como a LGPD exige.",
      ],
    },
    {
      id: "transfers",
      heading: "10. Onde os dados são tratados e quem os trata",
      blocks: [
        "O Serviço roda num servidor virtual que alugamos da Hostinger. Os arquivos enviados e os backups do banco de dados ficam guardados na Cloudflare (R2). Os computadores em que os agentes de um workspace trabalham rodam em servidores que administramos no Brasil. Os e-mails do Serviço saem pelo nosso próprio servidor de e-mail.",
        "**Empresas que tratam dados para nós:**",
        {
          list: [
            "**Hostinger:** o servidor virtual que roda a aplicação e o banco de dados.",
            "**Cloudflare (R2):** armazenamento dos arquivos enviados e dos backups do banco de dados.",
            "**OpenAI:** os modelos de IA próprios da plataforma (Seção 2).",
            "**TypeSafe:** escolher qual agente responde e fazer verificações curtas de IA (Seção 2).",
            "**GIPHY:** busca de GIFs.",
            "**Apple (APNs), Google (Firebase Cloud Messaging) e o serviço de notificações do fabricante do seu navegador:** entrega de notificações.",
          ],
        },
        "Os provedores de modelo e os serviços que um workspace conecta com a própria chave, plano ou conta trabalham sob o contrato do próprio workspace com eles e não entram nesta lista. Mantemos esta lista atualizada.",
        "**Transferência internacional de dados.** Algumas dessas empresas tratam dados fora do Brasil. Transferimos dados a elas só para prestar o Serviço e só nos casos que a LGPD permite. Para os dados de conta e para o que lemos por conta própria (Seção 7), o controlador é a Carvalho-Karsten Tecnologia Ltda. Para o restante do Conteúdo do Workspace, é o workspace, e nós somos o operador.",
      ],
    },
    {
      id: "apps",
      heading: "11. Apps de celular e de Mac",
      blocks: [
        "O app de celular envia notificações pela Apple (APNs) e pelo Google (Firebase Cloud Messaging). Uma notificação pode mostrar o nome de quem escreveu e o começo da mensagem, e você escolhe quais notificações recebe. O app de Mac e os computadores conectados guardam o login no próprio aparelho. Excluir a sua conta (o que também dá para fazer nos apps) desconecta todos os aparelhos.",
      ],
    },
    {
      id: "lgpd",
      heading: "12. Seus direitos pela LGPD",
      blocks: [
        "A Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018) lhe dá estes direitos: confirmação de que tratamos os seus dados, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos, portabilidade, informação sobre com quem compartilhamos dados, informação sobre a possibilidade de não dar consentimento e o que decorre disso, e revogação do consentimento. Você também pode se opor ao tratamento e peticionar à Autoridade Nacional de Proteção de Dados (ANPD).",
        "Para dados de conta, escreva para support@xquads.com. Você também pode corrigir o seu perfil e excluir a sua conta sozinho no app. Para dados pessoais no Conteúdo do Workspace, fale com os donos ou administradores do workspace, que os controla. Encaminharemos ao workspace os pedidos que recebermos e o ajudaremos a respondê-los como operador.",
        "O nosso encarregado pelo tratamento de dados pessoais é Gustavo Henrique Karsten, que atende em support@xquads.com.",
      ],
    },
    {
      id: "gdpr",
      heading: "13. Se você está no Espaço Econômico Europeu ou no Reino Unido",
      blocks: [
        "Se o GDPR ou o UK GDPR se aplica a você, você pode pedir acesso, retificação, exclusão, limitação e portabilidade, se opor ao tratamento e apresentar reclamação à sua autoridade de controle. Escreva para support@xquads.com. Pedidos sobre o Conteúdo do Workspace vão ao workspace, como descreve a Seção 12.",
      ],
    },
    {
      id: "dpa",
      heading: "14. Acordo de Tratamento de Dados",
      blocks: [
        "Um workspace pode pedir um Acordo de Tratamento de Dados (DPA) que cubra o nosso tratamento do Conteúdo do Workspace. Escreva para support@xquads.com.",
      ],
    },
    {
      id: "cookies",
      heading: "15. Cookies e armazenamento local",
      blocks: [
        "O Serviço usa só os cookies e o armazenamento local necessários para manter você conectado, proteger formulários e lembrar preferências como tema e idioma. Não usamos cookies de análise, de publicidade nem de rastreamento entre sites.",
      ],
    },
    {
      id: "children",
      heading: "16. Crianças e adolescentes",
      blocks: [
        "O Serviço é uma ferramenta de trabalho para adultos. Ele não se destina a menores de 18 anos, e não coletamos dados deles de propósito. Se você acredita que um menor nos deu dados pessoais, escreva para support@xquads.com e nós os apagaremos.",
      ],
    },
    {
      id: "changes",
      heading: "17. Mudanças nesta política",
      blocks: [
        "Podemos atualizar esta política. Mudanças relevantes serão anunciadas por e-mail ou no app antes de entrarem em vigor. A versão atual fica sempre nesta página. Esta política é escrita em português. Se a versão em inglês divergir, prevalece a versão em português.",
      ],
    },
    {
      id: "contact",
      heading: "18. Contato",
      blocks: [
        "Carvalho-Karsten Tecnologia Ltda (DockPlus AI), CNPJ 40.402.200/0001-95, Rua Leoberto Leal, 243, Sala 02, Escritório 22, Centro, São João Batista/SC, Brasil. Para pedidos de privacidade e proteção de dados, ajuda com o Serviço ou qualquer outro assunto, escreva para support@xquads.com. O nosso encarregado pelo tratamento de dados pessoais, Gustavo Henrique Karsten, lê o mesmo endereço. Site público: https://xquads.com.",
      ],
    },
  ],
};
