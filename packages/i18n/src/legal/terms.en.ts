import type { LegalDocument } from "./types";

export const termsEn: LegalDocument = {
  title: "Terms of Use",
  summary: "The agreement for using xquads: your workspace, your agents, and what each side is responsible for.",
  courtesy:
    "This is a courtesy translation. If it differs from the Portuguese version, the Portuguese version prevails.",
  updated: "2026-11-28",
  sections: [
    {
      id: "agreement",
      heading: "1. Agreement",
      blocks: [
        'These Terms of Use (the "Terms") are a binding agreement between Carvalho-Karsten Tecnologia Ltda, a Brazilian company that does business as DockPlus AI (CNPJ 40.402.200/0001-95, "we", "us"), and the person or entity that creates an account or a workspace ("you"). By creating an account, joining a workspace, or otherwise using xquads on the web at https://agents.xquads.com, the Mac app or the phone apps for iPhone and Android (the "Service"), you accept these Terms and our Privacy Policy. If you use the Service on behalf of a company or other entity, you represent that you have authority to bind it.',
        "You must be at least 18 years old and able to enter into a contract to use the Service.",
      ],
    },
    {
      id: "service",
      heading: "2. The Service",
      blocks: [
        "The Service is a workspace where people and AI agents work together. It includes channels, threads and direct messages, and agents with their own roles, instructions, memory and budgets. It also includes tasks, wiki, Drive, calendar and routines, approvals, connectors to other services, and the option to connect computers on which agents can work.",
        "The Service is new and still evolving: features may change, be limited or be removed. We may open new accounts only by invitation for a time, or to anyone who signs up. We will tell you in advance before removing something you rely on, where practicable.",
      ],
    },
    {
      id: "accounts",
      heading: "3. Accounts and workspaces",
      blocks: [
        "You are responsible for the accuracy of your account information, for the security of your credentials, and for all activity under your account. A workspace's owners and admins decide who joins it, what roles they have, which agents exist and what those agents may do. Where these Terms say a workspace owns, decides or answers for something, they mean the person or entity that created it, or on whose behalf it was created, acting through its owners and admins. Notify us promptly at support@xquads.com if you believe an account, a key or a connected computer has been compromised.",
      ],
    },
    {
      id: "agents",
      heading: "4. Agents and what they do",
      blocks: [
        "Agents act on the instructions, permissions, connectors, budgets and computers that you and your workspace give them. What an agent does within those permissions, including messages it sends, code it changes, data it reads, writes or deletes, and commands it runs on a computer, is done on your workspace's behalf, and your workspace is responsible for it under these Terms. Each agent has a person responsible for it.",
        "Actions that are hard to undo become an approval request for a person before they happen, unless your workspace set that agent to act without asking. Approving one is your decision. The Service shows what will be done, but you are responsible for reviewing it.",
        "AI output can be wrong, incomplete or out of date, even when it sounds confident. Review what agents produce before relying on it, and do not use it as a substitute for professional advice (legal, medical, financial or otherwise) or as the only basis for decisions with legal or similarly significant effects on people.",
      ],
    },
    {
      id: "acceptable-use",
      heading: "5. Acceptable use",
      blocks: [
        "You agree not to use the Service, or let agents be used, to:",
        {
          list: [
            "break the law, infringe others' rights, or process personal data without a lawful basis",
            "send spam or unsolicited messages, or harass, threaten, deceive or impersonate anyone",
            "create or distribute malware, phishing, or content that sexualizes minors, promotes violence or is otherwise unlawful",
            "get around the Service's limits and safeguards, such as budgets, rate limits, approvals, permissions, or the checks on connected computers and databases",
            "attack the Service or others through it, including probing for vulnerabilities, overloading it, or planting instructions meant to take over other people's agents",
            "access a service, computer or data you are not authorized to use, or use a connected service against its own terms",
            "violate the usage policies of the AI model providers that run your agents.",
          ],
        },
        "We may suspend an agent, a connector or an account, with notice where practicable, when activity threatens the security, integrity or lawful operation of the Service or of others. We may investigate suspected violations of this section, including by reading Workspace Content as the Privacy Policy describes.",
      ],
    },
    {
      id: "content",
      heading: "6. Your content",
      blocks: [
        '"Workspace Content" means what you and the other people in your workspace put into the Service and what your agents produce in it. Your workspace owns its Workspace Content, and as between you and us, the output agents produce for you is yours, subject to the terms of the model provider that produced it. Output may be similar to what the same models produce for others.',
        "You grant us the limited rights needed to operate the Service: to store, process, transmit and display Workspace Content in order to run your workspace and agents, send it to the providers your agents use and to the companies that process it for us, as described in the Privacy Policy, provide support, keep the Service working and secure, enforce these Terms and comply with the law. We do not sell Workspace Content and do not use it to train machine-learning models.",
        "Your workspace is the controller of the personal data in its Workspace Content, and we process that data on its instructions as a processor, as described in the Privacy Policy. For trust and safety, the security of the Service and what the law requires of us, we act as a controller in our own right, as Section 7 of the Privacy Policy describes.",
      ],
    },
    {
      id: "third-parties",
      heading: "7. Model providers, connectors and your own accounts",
      blocks: [
        "Agents run on AI models from third parties. The platform's own models come from OpenAI, and a routing service, TypeSafe, reads a short excerpt of each new message to decide which agent answers. To produce answers, the Service sends what people write to agents, and the files and context the agents need, to these providers. Section 2 of the Privacy Policy describes this in full.",
        "A workspace may also connect its own API key or AI plan with another provider, for example Anthropic, which makes Claude, OpenAI, Google or DeepSeek. Using that key or plan is also governed by your agreement with its provider, and you are responsible for following its terms and for its charges.",
        "Connectors give agents access to other services (such as GitHub, Google or an email inbox). Those services are provided by third parties under their own terms. Their availability and what they do with data are outside our control.",
      ],
    },
    {
      id: "computers",
      heading: "8. Connected computers",
      blocks: [
        "If you connect a computer, you install software that lets agents run commands and use a browser on it, within the folders and permissions you set on that computer. You are responsible for the computer, for what you allow there, and for keeping backups of what matters. Permissions can only be widened on the computer itself, and you can disconnect it at any time.",
      ],
    },
    {
      id: "data-protection",
      heading: "9. Data protection",
      blocks: [
        "Each party will comply with its obligations under the LGPD for the personal data in your Workspace Content, and under the GDPR or UK GDPR where they also apply. A workspace may request a Data Processing Addendum (DPA) at support@xquads.com. The current list of companies that process data for us is in the Privacy Policy. A support request a member of your workspace sends us is your workspace's instruction to us to read what the request is about.",
      ],
    },
    {
      id: "fees",
      heading: "10. No fees, fair use and budgets",
      blocks: [
        "The Service has no paid plan, and we do not charge for its use. These rules apply:",
        {
          list: [
            "**Fair use.** Some features run on AI services we provide at no charge, such as the platform's own models and choosing which agent answers. We may limit them for a workspace whose use is far above normal.",
            "**Budgets.** Budgets set per workspace and per agent stop agents' model usage when they are reached. They are part of the Service, not a defect of it. Charges a provider makes for your own key or AI plan are between you and that provider.",
          ],
        },
      ],
    },
    {
      id: "ip",
      heading: "11. Intellectual property and feedback",
      blocks: [
        "The Service's software is open source under the GNU Affero General Public License, version 3 (AGPL-3.0), which governs your rights to that code. Except for your Workspace Content and the rights that license grants, we and our licensors keep all rights in the Service, including the xquads name and marks. Feedback you choose to send us may be used without obligation to you.",
      ],
    },
    {
      id: "termination",
      heading: "12. Term and termination",
      blocks: [
        "You may stop using the Service and delete your account at any time in the app. Your account is removed 7 days later, and you can restore it until then. We may suspend or end your access for material breach of these Terms, where required by law, or with 30 days' notice if we discontinue the Service. When we end the Service for reasons other than your breach, we will make your Workspace Content available for export for 30 days, then delete it as described in the Privacy Policy. Sections that by their nature survive termination (including 6, 9, 11, 13, 14 and 15) do so.",
      ],
    },
    {
      id: "disclaimers",
      heading: "13. Disclaimers",
      blocks: [
        'The Service, including everything agents produce and do, is provided "as is" and "as available". We do not warrant that the Service or agents will be uninterrupted, error-free, accurate or fit for your purposes. To the extent the law allows, we give no warranties beyond those these Terms state.',
      ],
    },
    {
      id: "liability",
      heading: "14. Limitation of liability",
      blocks: [
        "To the extent the law allows, neither party is liable for indirect damages or for lost profits, revenue or data. To the same extent, our aggregate liability arising out of the Service is limited to the amounts you paid us for the Service in the twelve months before the event giving rise to the claim. These limits do not apply to your breach of Section 5 or to liability that the law does not allow to be limited, including under the Brazilian Consumer Defense Code (Law 8.078/1990) where it applies.",
      ],
    },
    {
      id: "indemnification",
      heading: "15. Indemnification",
      blocks: [
        "You will defend and indemnify us against third-party claims arising from your Workspace Content, from what your agents did within the permissions you gave them, or from your breach of Section 5.",
      ],
    },
    {
      id: "law",
      heading: "16. Governing law",
      blocks: [
        "These Terms are governed by the laws of Brazil. The courts of the comarca of São João Batista, Santa Catarina, Brazil, have jurisdiction over any dispute about them, except where the law gives a consumer the right to sue in the courts of their own domicile.",
      ],
    },
    {
      id: "changes",
      heading: "17. Changes to these Terms",
      blocks: [
        "We may update these Terms. Material changes will be announced by email or in the app at least 14 days before they take effect. Continued use after the effective date is acceptance. The current version always lives at this page. These Terms are written in Portuguese. If the English version differs, the Portuguese version prevails.",
      ],
    },
    {
      id: "contact",
      heading: "18. Contact",
      blocks: [
        "Carvalho-Karsten Tecnologia Ltda (DockPlus AI), CNPJ 40.402.200/0001-95, Rua Leoberto Leal, 243, Sala 02, Escritório 22, Centro, São João Batista/SC, Brazil. For legal notices, help with the Service or anything else, write to support@xquads.com. Public site: https://xquads.com.",
      ],
    },
  ],
};
