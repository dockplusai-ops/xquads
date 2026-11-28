import type { LegalDocument } from "./types";

export const privacyEn: LegalDocument = {
  title: "Privacy Policy",
  summary: "What we collect, which AI providers receive your content, who can see your workspace, and your rights.",
  courtesy:
    "This is a courtesy translation. If it differs from the Portuguese version, the Portuguese version prevails.",
  updated: "2026-11-28",
  sections: [
    {
      id: "overview",
      heading: "1. Overview",
      blocks: [
        'Carvalho-Karsten Tecnologia Ltda, a Brazilian company that does business as DockPlus AI (CNPJ 40.402.200/0001-95, "we"), operates xquads: a workspace where people and AI agents work together. xquads is available on the web at https://agents.xquads.com, as a Mac app and as a phone app for iPhone and Android (the "Service"). This policy distinguishes three roles:',
        {
          list: [
            "For **account data**, the information people give us to create and use an account, we are the data controller.",
            "For **Workspace Content**, everything a workspace's people and agents put into or produce in it, we are a data processor acting on the workspace's instructions. The workspace is the controller, meaning the person or entity that created it or on whose behalf it was created.",
            "For the few cases in Section 7 where we act for ourselves (trust and safety, the security of the Service, and what the law requires of us), we are the controller of the personal data in the Workspace Content we read for that.",
          ],
        },
        "**AI providers.** What you write to agents, and the files and context they need, is sent to third-party AI model providers so the agents can answer. Section 2 names them.",
      ],
    },
    {
      id: "ai-providers",
      heading: "2. AI providers that receive your content",
      blocks: [
        "Agents are AI models run by other companies. To produce an answer, the Service sends what people write to agents, and the files and context the agents need, to an AI model provider. These companies receive that content:",
        {
          list: [
            "**OpenAI.** The platform's own models come from OpenAI. When an agent works on them, OpenAI receives the agent's instructions, the conversation, the files and the context the agent needs to answer.",
            "**TypeSafe.** A routing service. It reads a short excerpt of a new message to decide which agent answers. The Service also uses it for short checks, such as whether something is worth keeping in an agent's memory or whether an action should wait for a person.",
            "**Providers a workspace connects.** A workspace may connect its own keys or accounts with other providers, for example Anthropic, which makes Claude, OpenAI, Google or DeepSeek. Those providers receive that workspace's content under the workspace's own agreement with them.",
          ],
        },
        "Each provider processes this content under its own terms. We send it only so agents can answer and do their work. We do not sell it, and we do not use it to train AI models. Section 6 explains what agents send in each case, and Section 10 lists every company that processes data for us.",
      ],
    },
    {
      id: "data-we-collect",
      heading: "3. Data we collect as controller",
      blocks: [
        {
          list: [
            "**Account data:** name, email address, password hash, profile photo, language and time zone. If you sign in with Google, Apple or GitHub, we receive your name, email address and the account identifier from that provider, never its password.",
            "**Workspace data:** the workspace's name, members, roles and invitations.",
            "**Support requests:** what you send us when you ask for help: your words, the thing you reported and what it says, the screen you were on, and any pictures or video you attach.",
            "**Usage and log data:** IP addresses, browser and device, sign-in sessions, security events, API requests, and the record of each model call (model, tokens and cost, with the workspace and agent it belongs to), which we keep to enforce budgets and show usage. When something breaks, our server records the error, without message content, so we can fix it. We also keep a record of each time our team read Workspace Content with the tools that Section 7 describes: who read, which item, when and why, never the content itself.",
            "**Devices:** for the phone app, the push notification token of each device you sign in on. For connected computers and the Mac app, the computer's name, operating system and app version.",
          ],
        },
      ],
    },
    {
      id: "how-we-use",
      heading: "4. How we use account data",
      blocks: [
        "We use account data to provide and secure the Service (including detecting and stopping abuse), apply budgets and limits, respond to support requests and meet legal obligations. We also use it to send service messages: email confirmations, invitations, password resets, approval requests and the notifications you turned on.",
        "Under the LGPD, we process account data to perform our contract with you (Article 7, V), to meet legal obligations (Article 7, II) and for our legitimate interest in keeping the Service secure (Article 7, IX).",
        "We do not sell personal data and do not use Workspace Content to train machine-learning models.",
      ],
    },
    {
      id: "workspace-content",
      heading: "5. Workspace Content, processed on behalf of workspaces",
      blocks: [
        "Workspace Content includes messages in channels, threads and direct messages, files in the Drive and wiki pages. It also includes tasks, routines, calendar events and approvals, the instructions, settings and memory of agents, what agents write and do, and the data agents read through the connectors, databases and computers the workspace connects. We process it only to run the workspace and its agents as the workspace configures them, to show it to the workspace's members, to send the notifications they ask for, to provide support, to keep the Service working and secure, and in the cases of Section 7 where we act for ourselves.",
        "Workspace Content belongs to the workspace: members see what its channels and permissions allow, and its owners and admins manage it. Workspace owners and administrators can see every channel, task and wiki page, private ones included. They can't read direct messages between other people. Messages you posted stay in the workspace after you leave it or delete your account, unless the workspace deletes them.",
      ],
    },
    {
      id: "agents",
      heading: "6. How agents process Workspace Content",
      blocks: [
        "Agents are AI models that read and act inside the workspace. Workspace Content leaves our servers in the following cases. Section 10 lists the companies that process it for us.",
        {
          list: [
            "**Answering.** When an agent works, it sends the context it needs (the workspace's context, the agent's instructions, the conversation, relevant memory, files and the results of its tools) to the model provider chosen for that agent. On the platform's own models, that provider is OpenAI. With a key or an account the workspace connected, the call is made under the workspace's own account and agreement with that provider. Some providers pass the call on to the company that makes or hosts the model, which then also processes it under that provider's terms. With an AI plan, such as Claude or ChatGPT, connected to an agent, the agent works under the account of the person who connected the plan and under the provider's terms.",
            "**Deciding who replies.** A routing model at TypeSafe reads a short excerpt of a new message, with the names and roles of the workspace's agents, to decide which agent, if any, should reply. If TypeSafe is unavailable, the workspace's model provider decides. Routing never grants an agent any permission.",
            "**Memory.** Agents keep memory from conversations (summaries, facts and lessons) so they improve over time. Some judgments about memory, such as whether something is worth keeping, are made by TypeSafe. Memory can be seen and removed in the agent's page, and it is deleted with the workspace.",
            "**Connectors.** When the workspace connects a service (such as GitHub, Google, an email inbox or any MCP server), we store its access tokens encrypted and read or write that service only within the scopes the workspace gave each agent. The connected service processes that data under its own terms.",
            "**Databases.** Database connections are read-only. Credentials are stored encrypted and each query is checked before it runs.",
            "**Connected computers.** When someone connects a computer, agents can run commands and use a browser there, within the folders and permissions set on that computer. The live view of an agent's browser passes through our servers' memory and is not recorded. A summary of the steps the agent took (such as addresses visited and actions) is kept with its work so the team can see what it did.",
            "**The workspace's computer.** A workspace's agents work on a computer we run for that workspace, on servers we manage in Brazil.",
            "**Storage, email and notifications.** Uploaded files and database backups are stored with Cloudflare (R2). Emails go out through our own mail server. Phone notifications that quote a message pass through Apple (APNs) and Google (Firebase Cloud Messaging). A support request you send us, with what you attach, reaches our team by email.",
            "**Web search.** When an agent searches the web, the words it searches for go to a search engine. When it opens a page, the site sees the address it asked for, like any visitor's.",
            "**GIFs.** When an agent or a person searches for a GIF, the search words go to GIPHY.",
          ],
        },
        "Actions that are hard to undo (such as merging code, deploying or sending on someone's behalf) become an approval request for a person before they happen, unless the workspace set that agent to act without asking. Text that comes from outside the workspace (web pages, emails, files) is marked as untrusted before an agent reads it.",
      ],
    },
    {
      id: "staff-access",
      heading: "7. When our staff can see Workspace Content",
      blocks: [
        "We do not browse workspaces. Outside the running of your workspace that Sections 5 and 6 describe, our team reads Workspace Content only:",
        {
          list: [
            "**At your request,** to help with a support request a member of your workspace sent us: from the app, from the email address of their account, or another way once we confirmed it is theirs. We read what the request is about and no more than the member who asked can see. We answer only at the address of that member's account. For this, a direct message is read only when someone in that conversation asked.",
            "**To fix a fault,** when something in the Service failed or got stuck, such as an agent's work that ended in an error or stopped moving. We read what that failure is about, and never a direct message.",
            "**For trust and safety,** to detect and investigate suspected abuse, fraud, unlawful content or a threat to the security of the Service or of other people, or to enforce our Terms of Use. We may do this without telling the workspace at the time. If we restrict a workspace or an account, we say why and how to contest it, unless an authority's order forbids us to say so. For this, in a direct conversation we read only what was said to an agent or by one, never messages between people, unless someone in that conversation reported them or the law requires it.",
            "**When the law requires it.**",
          ],
        },
        "At your request and to fix a fault we act on the workspace's instructions. For trust and safety we rely on our legitimate interest in keeping the Service and other people safe (LGPD Article 7, IX, and, where it applies, GDPR Article 6(1)(f)) and, where the law requires it, on that legal obligation. You may object as Sections 12 and 13 describe.",
        "Our team reads with tools that give one item at a time. Each read made with those tools is made for one of these reasons and is recorded before it happens: who read, which item, when and why. A read of what your workspace wrote, made with those tools at your request or to fix a fault, also appears in your workspace's audit log: the item, which of these reasons it was, and, for a request, whose (for a direct message, only that a read happened and at whose request). A read made with them for trust and safety is noted there when the investigation ends, and seven days after the read at the latest, unless the law forbids us to say so.",
        "The people who operate our infrastructure can reach the servers and databases that store Workspace Content. They use that access only to keep the Service running, such as restoring backups, or to meet a legal obligation. None of these paths is used to build profiles, advertising or training data.",
      ],
    },
    {
      id: "retention",
      heading: "8. Retention",
      blocks: [
        {
          list: [
            "**Account data:** for the life of the account. When you delete your account in the app, it is signed out everywhere at once and removed 7 days later, unless you restore it before then, and leaves our backups within 30 days after that, except records we must keep by law. Any workspace in which you were the only member closes at the same time, and its content is deleted 7 days later as described next. The workspaces you were in keep your name and email address in their audit logs for as long as each of them exists.",
            "**Workspace Content:** for the life of the workspace, and earlier when the workspace deletes specific content. When an owner deletes a workspace, it closes for everyone at once and its content is deleted 7 days later, unless an owner restores it before then. It leaves our backups within 30 days after that, except content we must keep by law or as a record of abuse (below), and except what we read for support or an investigation, which follows its own line below.",
            "**Logs:** request and security logs for up to 90 days. Model usage records (tokens and cost) for the life of the workspace, because budgets and usage reports depend on them.",
            "**Support requests:** what you sent us when asking for help, for 90 days. Pictures and video for 30 days.",
            "**Support and investigations:** what we read to answer a support request or to look into a fault or suspected abuse, for up to 90 days after we read it, even if the workspace deletes it sooner, unless it is a record of abuse (below). Our conclusion about a case, which holds none of the content, stays with the case's record. Our record of each read made with the tools that Section 7 describes (who, when, which item and why, never the content) for one year.",
            "**Accounts we suspend or close for abuse:** we may keep the records of the account and of the abuse beyond these periods, including after deletion is requested, for as long as needed to exercise or defend rights, to meet legal obligations, and to keep the same people from abusing the Service again, under Articles 7(VI), 7(IX) and 16(I) of the LGPD and, where it applies, Article 17(3)(b) and (e) and Article 6(1)(f) of the GDPR.",
          ],
        },
      ],
    },
    {
      id: "security",
      heading: "9. Security",
      blocks: [
        "Data is encrypted in transit (TLS). Model provider keys, connector tokens and database credentials are encrypted with per-workspace envelope encryption and are never sent back to the browser or the apps. Access to production systems is restricted to the people who operate the Service. If we learn of a security incident that may cause relevant risk or harm to people, we will notify the affected workspaces and the ANPD, as the LGPD requires.",
      ],
    },
    {
      id: "transfers",
      heading: "10. Where data is processed and who processes it",
      blocks: [
        "The Service runs on a virtual server we rent from Hostinger. Uploaded files and database backups are stored with Cloudflare (R2). The computers where a workspace's agents work run on servers we manage in Brazil. Transactional email goes out through our own mail server.",
        "**Companies that process data for us:**",
        {
          list: [
            "**Hostinger:** the virtual server that runs the application and its database.",
            "**Cloudflare (R2):** storage of uploaded files and of database backups.",
            "**OpenAI:** the platform's own AI models (Section 2).",
            "**TypeSafe:** choosing which agent answers, and short AI checks (Section 2).",
            "**GIPHY:** GIF search.",
            "**Apple (APNs), Google (Firebase Cloud Messaging) and the push service of your browser's maker:** delivery of notifications.",
          ],
        },
        "The model providers and services a workspace connects with its own key, plan or account work under the workspace's own agreement with them and are not on this list. We keep this list current.",
        "**International transfers.** Some of these companies process data outside Brazil. We transfer data to them only to provide the Service and only as the LGPD allows. For account data and for what we read for ourselves (Section 7), the controller is Carvalho-Karsten Tecnologia Ltda. For the rest of Workspace Content, it is the workspace, and we are its processor.",
      ],
    },
    {
      id: "apps",
      heading: "11. Phone and Mac apps",
      blocks: [
        "The phone app sends notifications through Apple (APNs) and Google (Firebase Cloud Messaging). A notification may show the name of who wrote and the beginning of the message, and you choose which notifications you get. The Mac app and connected computers keep their sign-in on the device. Deleting your account (also available in the apps) signs every device out.",
      ],
    },
    {
      id: "lgpd",
      heading: "12. Your rights under the LGPD",
      blocks: [
        "The Brazilian General Data Protection Law (Lei Geral de Proteção de Dados, LGPD, Law 13.709/2018) gives you these rights: confirmation that we process your data, access, correction, anonymization, blocking or deletion of unnecessary or excessive data, portability, information about who we share data with, information about refusing consent and what follows from it, and withdrawal of consent. You may also object to processing and petition the Brazilian data protection authority (Autoridade Nacional de Proteção de Dados, ANPD).",
        "For account data, write to support@xquads.com. You can also correct your profile and delete your account yourself in the app. For personal data in Workspace Content, contact the owners or admins of the workspace, which controls it. We will refer requests we receive to that workspace and help it answer them as its processor.",
        "Our data protection officer (encarregado) is Gustavo Henrique Karsten, reachable at support@xquads.com.",
      ],
    },
    {
      id: "gdpr",
      heading: "13. If you are in the EEA or the UK",
      blocks: [
        "If the GDPR or the UK GDPR applies to you, you may request access, rectification, erasure, restriction and portability, object to processing, and lodge a complaint with your supervisory authority. Write to support@xquads.com. Requests about Workspace Content go to the workspace, as Section 12 describes.",
      ],
    },
    {
      id: "dpa",
      heading: "14. Data Processing Addendum",
      blocks: [
        "A workspace may request a Data Processing Addendum (DPA) covering our processing of Workspace Content. Write to support@xquads.com.",
      ],
    },
    {
      id: "cookies",
      heading: "15. Cookies and local storage",
      blocks: [
        "The Service uses only the cookies and local storage needed to keep you signed in, protect forms, and remember preferences such as theme and language. We do not use analytics, advertising or cross-site tracking cookies.",
      ],
    },
    {
      id: "children",
      heading: "16. Children",
      blocks: [
        "The Service is a work tool for adults. It is not directed to anyone under 18, and we do not knowingly collect their personal data. If you believe a minor has given us personal data, write to support@xquads.com and we will delete it.",
      ],
    },
    {
      id: "changes",
      heading: "17. Changes to this policy",
      blocks: [
        "We may update this policy. Material changes will be announced by email or in the app before they take effect. The current version always lives at this page. This policy is written in Portuguese. If the English version differs, the Portuguese version prevails.",
      ],
    },
    {
      id: "contact",
      heading: "18. Contact",
      blocks: [
        "Carvalho-Karsten Tecnologia Ltda (DockPlus AI), CNPJ 40.402.200/0001-95, Rua Leoberto Leal, 243, Sala 02, Escritório 22, Centro, São João Batista/SC, Brazil. For privacy and data protection requests, help with the Service or anything else, write to support@xquads.com. Our data protection officer (encarregado), Gustavo Henrique Karsten, reads the same address. Public site: https://xquads.com.",
      ],
    },
  ],
};
