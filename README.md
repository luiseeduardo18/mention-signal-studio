# Mention Signal Studio

Crie o MVP completo do SaaS "AI Visibility Local", usando TypeScript, React, Tailwind, shadcn/ui e Lovable Cloud/Supabase, fiel a este PRD resumido. Produto para pequenas agências de SEO local monitorarem menções de marcas e concorrentes em respostas padronizadas de modelos de IA. Landing page premium bilíngue EN/PT-BR, login/cadastro, organizações, projetos de empresas (site, setor, cidade, país), até 3 concorrentes, até 10 perguntas editáveis por projeto, botão de executar análises, integração segura de backend configurável Gemini/OpenAI, persistir respostas brutas, modelo, prompts e timestamp, extrair menções de forma conservadora e auditável, dashboard de menções e comparação, histórico, relatório para impressão/PDF, página de preços Free/Starter $19/Agency $49 e configurações. Não usar estatísticas falsas: estados vazios e mensagens claras quando chave/API não configurada. Não alegar replicar o ChatGPT de consumidor. Segurança com RLS multitenant e API keys exclusivamente no servidor, limite de gastos e rate limit; validação de entrada. Plano de assinatura apenas visual até Stripe estar realmente ligado; não simular checkout. Layout SaaS moderno clean, responsivo, paleta índigo/azul, boa tipografia, sidebar e gráficos leves. README com setup, .env.example e instruções de GitHub. Ordem de execução: 1 landing e auth 2 DB/RLS 3 projetos/perguntas 4 backend LLM 5 resultados e relatórios. Critérios: usuário só acessa sua organização; erro de API nunca fabrica análise; metodologia dos relatórios explícita. Salve um arquivo docs/PRD.md no repositório contendo escopo, fluxos, modelo de dados, aceitação, riscos, cronograma 4 semanas. Não publicar sem conferência.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/236e850e-0240-478f-9f33-c34c52d22796).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
