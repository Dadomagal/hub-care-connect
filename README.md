# HUB - Processos

Aplicação web em React + Vite para simulação de fluxos hospitalares no HUB (Hospital Universitário de Brasília), com foco em:

- Teletriagem e fila virtual do paciente
- Jornada oncológica com orientações e documentos
- Navegação indoor por mapa em camadas (andares)
- Painel da equipe com kanban de atendimento, prontuário e feedback

## Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Vitest (testes unitários)
- Playwright (base instalada para testes E2E)

## Pré-requisitos

- Node.js 18+
- npm (ou Bun)

## Instalação

No diretório do projeto:

```bash
npm install
```

Opcional com Bun:

```bash
bun install
```

## Executar em localhost

### Ambiente de desenvolvimento

```bash
npm run dev
```

Depois, abra a URL mostrada no terminal (normalmente http://localhost:5173).

## Como testar o projeto em localhost

### 1) Teste manual da interface

1. Abra o projeto em localhost com npm run dev.
2. Entre como Paciente e valide:
	- Triagem
	- Oncologia
	- Mapa
	- Fila
	- Feedback
3. Entre como Equipe de Saúde e valide:
	- Kanban de teletriagem
	- Drag and drop entre colunas
	- Prontuário ao clicar em Pacientes Cadastrados
	- Exibição de feedback por paciente

### 2) Testes automatizados (Vitest)

Executar uma vez:

```bash
npm run test
```

Modo observação:

```bash
npm run test:watch
```

## Build e preview

Gerar build de produção:

```bash
npm run build
```

Visualizar build localmente:

```bash
npm run preview
```

## Scripts úteis

- npm run dev: inicia o servidor de desenvolvimento
- npm run build: gera build de produção
- npm run build:dev: gera build em modo desenvolvimento
- npm run preview: serve o build localmente
- npm run lint: executa lint
- npm run test: executa testes unitários
- npm run test:watch: executa testes em modo watch
