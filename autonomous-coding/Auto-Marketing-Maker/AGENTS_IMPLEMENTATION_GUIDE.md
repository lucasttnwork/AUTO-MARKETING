# 🤖 Guia de Implementação - Agents Hub

## Visão Geral

Este documento descreve como implementar o sistema completo de Agentes de Copy com Context Engine, Prompt Studio e Tool Calling para a plataforma AMA.

---

## 📁 Arquivos Criados

### 1. `app_spec_agents_addition.txt`
Contém todas as adições que devem ser feitas ao `app_spec.txt`:
- Nova seção `<agents_hub>` completa
- Novas tabelas de banco de dados
- Novos endpoints de API
- Novos componentes de UI
- Novo step de implementação

### 2. `feature_list_agents_addition.json`
Contém **50 novos testes** detalhados para adicionar à `feature_list.json`:
- Testes funcionais para cada tipo de agente
- Testes do Context Engine
- Testes do Prompt Studio
- Testes de integração end-to-end
- Testes de estilo/UI

---

## 🔧 Como Aplicar as Mudanças

### Passo 1: Atualizar app_spec.txt

Abra `app_spec.txt` e adicione o conteúdo de `app_spec_agents_addition.txt` nos locais indicados:

1. **Dentro de `<core_features>`**, após `</reporting_communication>`:
   - Cole toda a seção `<agents_hub>...</agents_hub>`

2. **Em `<sidebar_left>`**:
   - Adicione "Agents" como item de menu após "Intel"

3. **Em `<database_schema>/<tables>`**:
   - Adicione as tabelas `agent_prompts` e `agent_generations`

4. **Em `<api_endpoints_summary>`**:
   - Adicione a seção `<agents_hub>` com todos os endpoints

5. **Em `<implementation_steps>`**:
   - Adicione o step 7.5 "Agents Hub and Copy Agents"

### Passo 2: Atualizar feature_list.json

Os 50 novos testes em `feature_list_agents_addition.json` devem ser adicionados ao final do array em `feature_list.json`.

**Importante**: 
- NÃO remova nenhum teste existente
- Adicione todos os novos testes com `"passes": false`
- Mantenha a ordem (testes novos vão ao final)

### Passo 3: Rodar o Agente

Após salvar os arquivos, rode:

```bash
python autonomous-coding/autonomous_agent_demo.py --project-dir autonomous-coding/Auto-Marketing-Maker
```

O agente verá os novos testes não passando e começará a implementá-los.

---

## 🏗️ Arquitetura do Sistema de Agentes

### Context Engine

```
┌─────────────────────────────────────────────────────────────┐
│                     Context Engine                          │
├─────────────────────────────────────────────────────────────┤
│  Quando um cliente é selecionado, o engine monta:           │
│                                                             │
│  1. brand_voice      → Extrai do arquivo brand_voice.json   │
│  2. icp_data         → Busca da tabela clients              │
│  3. constitution     → Regras da tabela constitution        │
│  4. top_performers   → Top 10 da tabela performance_memory  │
│  5. active_campaigns → Campanhas ativas do cliente          │
│  6. competitor_intel → Últimas análises de market_intel     │
│                                                             │
│  Resultado: JSON estruturado injetado no system prompt      │
└─────────────────────────────────────────────────────────────┘
```

### Prompt Studio

```
┌─────────────────────────────────────────────────────────────┐
│                     Prompt Studio                           │
├─────────────────────────────────────────────────────────────┤
│  Presets disponíveis:                                       │
│                                                             │
│  • Conversion-focused → Linguagem direta, CTAs fortes       │
│  • Consultative       → Tom educativo e consultivo          │
│  • Institutional      → Formal, corporativo                 │
│  • Friendly           → Casual, próximo, conversacional     │
│  • Urgent             → Escassez, urgência, FOMO            │
│                                                             │
│  Variáveis suportadas:                                      │
│  {{client_name}}, {{brand_voice}}, {{icp_summary}},         │
│  {{top_hooks}}, {{active_angles}}, {{pain_points}}          │
└─────────────────────────────────────────────────────────────┘
```

### Tool Calling (Funções Disponíveis para Agentes)

```javascript
// Ferramentas que os agentes podem chamar durante geração:

query_brand_voice(client_id)        // Retorna brand voice completo
query_icp(client_id)                // Retorna ICP com pain points
query_top_performers(client_id, element_type, limit)  
                                     // Busca melhores hooks/CTAs/headlines
query_active_campaigns(client_id)   // Lista campanhas ativas e seus ângulos
query_constitution(client_id)       // Retorna regras de compliance
query_competitor_intel(client_id)   // Últimas análises de concorrentes
save_to_creative_assets(...)        // Salva output gerado
log_generation(...)                 // Registra a geração para analytics
```

---

## 📊 Novas Tabelas de Banco de Dados

### agent_prompts
```sql
CREATE TABLE agent_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_type TEXT NOT NULL,
  client_id INTEGER, -- NULL para presets globais
  preset_name TEXT NOT NULL,
  system_prompt_template TEXT NOT NULL,
  variables TEXT DEFAULT '[]', -- JSON array de variáveis usadas
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### agent_generations
```sql
CREATE TABLE agent_generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_type TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  campaign_id INTEGER,
  input_brief TEXT NOT NULL,
  system_prompt_used TEXT,
  output_content TEXT,
  output_variations TEXT DEFAULT '[]', -- JSON array se múltiplas variações
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,
  model_used TEXT,
  user_rating INTEGER, -- 1-5
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

---

## 🎨 Estrutura de UI Sugerida

### Página /agents (Agents Hub)

```
┌─────────────────────────────────────────────────────────────────┐
│  Agents Hub                                        [Search...]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 COPY AGENTS                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ ✉️ Email │ │ 🌐 Land │ │ 📱Social│ │ 📢 Ads  │               │
│  │ Sequence│ │  Page   │ │  Media  │ │  Copy   │               │
│  │         │ │         │ │         │ │         │               │
│  │[Generate]│ │[Generate]│ │[Generate]│ │[Generate]│              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                 │
│  🎬 CONTENT AGENTS                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │ 🎥 Video│ │ 📅Content│ │ 💬 SMS/ │                           │
│  │ Script  │ │ Strategy│ │WhatsApp │                           │
│  │         │ │         │ │         │                           │
│  │[Generate]│ │[Generate]│ │[Generate]│                          │
│  └─────────┘ └─────────┘ └─────────┘                           │
│                                                                 │
│  📊 RECENT GENERATIONS                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Email · Acme Corp · Welcome Email · 2 min ago      [View] │ │
│  │ Ad Copy · TechStart · Facebook Ads · 15 min ago    [View] │ │
│  │ Landing · GreenLeaf · Product Page · 1 hour ago    [View] │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Interface de Geração do Agente

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    Email Sequence Agent                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLIENT *                                                       │
│  ┌─────────────────────────────────────────────────┐           │
│  │ 🏢 Select a client...                        ▼ │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  EMAIL TYPE                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │Welcome │ │Abandon │ │Post-   │ │Re-     │                   │
│  │  ✓     │ │ Cart   │ │Purchase│ │engage  │                   │
│  └────────┘ └────────┘ └────────┘ └────────┘                   │
│                                                                 │
│  PROMPT PRESET                                                  │
│  ┌─────────────────────────────────────────────────┐           │
│  │ Friendly                                     ▼ │           │
│  └─────────────────────────────────────────────────┘           │
│  [▸ Advanced: Edit System Prompt]                               │
│                                                                 │
│  BRIEF *                                                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │ Describe the email purpose, key message,        │           │
│  │ and any specific requirements...                │           │
│  │                                                 │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  [          🚀 Generate Email          ]                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  OUTPUT                                              [⟳] [📋]  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📧 Subject: Welcome to [Brand] - Your Journey Starts    │   │
│  │                                                         │   │
│  │ 👁️ Preview: Discover what makes us different...         │   │
│  │                                                         │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │                                                         │   │
│  │ Hi {{first_name}},                                      │   │
│  │                                                         │   │
│  │ Welcome to the [Brand] family! We're thrilled to have   │   │
│  │ you on board...                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [💾 Save to Assets]  [🔗 Link to Campaign]  [✏️ Edit]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist de Implementação

### Backend
- [ ] Criar tabelas `agent_prompts` e `agent_generations`
- [ ] Implementar GET /api/agents/list
- [ ] Implementar GET /api/agents/context/:clientId (Context Engine)
- [ ] Implementar POST /api/agents/:type/generate
- [ ] Implementar POST /api/agents/:type/generate/stream (SSE)
- [ ] Implementar CRUD de prompts customizados
- [ ] Implementar tool functions para query de dados

### Frontend
- [ ] Adicionar "Agents" ao Sidebar.jsx
- [ ] Criar página /agents (Agents hub com grid de cards)
- [ ] Criar componente AgentCard
- [ ] Criar componente AgentGenerationInterface
- [ ] Criar componente PromptPresetSelector
- [ ] Criar componente CustomPromptEditor
- [ ] Criar componente OutputPreview
- [ ] Implementar streaming de output
- [ ] Mover Email Builder e Landing Page de Reports para Agents

### Migrations
- [ ] Adicionar presets padrão na tabela agent_prompts
- [ ] Popular variáveis suportadas

---

## 🎯 Ordem de Prioridade de Implementação

1. **Estrutura básica** - Sidebar, rota /agents, página com cards
2. **Context Engine** - API que monta contexto do cliente
3. **Agente básico** - Um agente funcionando (Email) com streaming
4. **Prompt Studio** - Presets e editor customizado
5. **Demais agentes** - Landing Page, Social Media, etc.
6. **Tool Calling** - Query de dados durante geração
7. **Save/History** - Salvar outputs e histórico
8. **Polimento** - UI/UX, animações, responsividade

---

## 📝 Notas Importantes

1. **Não remova os builders de Reports imediatamente** - Primeiro implemente em Agents, depois remova de Reports (para evitar quebrar funcionalidade existente).

2. **Context Engine é crítico** - Sem o contexto do cliente, os agentes gerarão conteúdo genérico. Priorize essa implementação.

3. **Streaming é essencial** - Gerações de copy podem demorar 10-30 segundos. SSE evita que o usuário pense que travou.

4. **Testes incrementais** - Implemente e teste um agente por vez antes de passar para o próximo.

---

*Documento criado para auxiliar na implementação do sistema de Agentes da plataforma AMA.*









