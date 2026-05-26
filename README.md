# 🛒 Fórum de Compras | OutSystems

Plataforma de documentação e troca de conhecimento para desenvolvedores do módulo de Compras no OutSystems.

🔗 **Produção:** [forum-compras.vercel.app](https://forum-compras.vercel.app)

---

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 14 | Framework (App Router) |
| Tailwind CSS | Estilização |
| Supabase | Auth + PostgreSQL + Storage |
| TipTap | Editor de texto rico |
| Vercel | Deploy (gratuito) |

---

## Funcionalidades

- ✅ Autenticação com e-mail e senha
- ✅ Editor de texto rico (negrito, itálico, listas, código, links, imagens)
- ✅ Upload de imagens (até 5 por post, máx 5MB)
- ✅ Categorias do módulo Compra (14 categorias)
- ✅ Comentários em posts
- ✅ Reações (Útil, Resolveu, Tenho dúvida)
- ✅ Busca por título e conteúdo
- ✅ Paginação (10 posts por página)
- ✅ Fixar posts no topo (admin)
- ✅ Contador de visualizações
- ✅ Modo dark/light
- ✅ 100% responsivo
- ✅ Galeria de imagens com lightbox

---

## Rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuito)

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/SEU-USUARIO/forum-compras.git
cd forum-compras

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 4. Rodar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Variáveis de ambiente

| Variável | Onde usar | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas Server | Chave admin (nunca expor no client) |

---

## Configurar Supabase

### 1. Criar projeto

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Escolha região South America (São Paulo)
3. Copie URL e chaves em Project Settings → API

### 2. Criar tabelas

Execute o arquivo `supabase/schema.sql` no SQL Editor do Supabase.

### 3. Configurar Storage

1. Vá em Storage → New Bucket
2. Nome: `post-images`
3. Marque como **Public**
4. Adicione policy de upload:

```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

-- Permitir leitura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');
```

### 4. Configurar Auth

- Vá em Authentication → Providers → Email
- Para uso interno: **desabilite** "Confirm email"
- Isso permite login imediato sem verificação

---

## Deploy no Vercel

### 1. Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: forum de compras v1.0"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/forum-compras.git
git push -u origin main
```

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com) → Sign up com GitHub
2. Clique em "Add New Project"
3. Importe o repositório `forum-compras`
4. Framework: Next.js (detectado automaticamente)
5. Clique em "Deploy"

### 3. Configurar variáveis de ambiente

No painel do Vercel:
1. Vá em Settings → Environment Variables
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` → sua URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → sua chave anon
   - `SUPABASE_SERVICE_ROLE_KEY` → sua chave service_role
3. Clique em "Save"
4. Faça um redeploy (Deployments → Redeploy)

### 4. Domínio

- O Vercel gera automaticamente: `forum-compras-xxx.vercel.app`
- Para customizar: Settings → Domains → adicione `forum-compras.vercel.app`
- Domínio próprio: adicione e configure DNS conforme instruções do Vercel

### 5. Deploy automático

Já vem configurado! A cada `git push` na branch `main`, o Vercel faz deploy automaticamente.

---

## Configurar CORS no Supabase

No painel do Supabase:
1. Vá em Settings → API
2. Em "Additional Redirect URLs", adicione:
   - `https://forum-compras.vercel.app`
   - `https://forum-compras-*.vercel.app` (para previews)
   - `http://localhost:3000` (desenvolvimento)

---

## Guia rápido: Como adicionar um post

1. Faça login em `/login`
2. Clique em **"Novo Post"** (sidebar ou header)
3. Preencha:
   - **Título** (obrigatório, máx 150 caracteres)
   - **Categoria** (selecione do dropdown)
   - **Conteúdo** (use o editor rico — mínimo 50 caracteres)
   - **Imagens** (opcional, até 5 imagens)
4. Clique em **"Publicar Post"**
5. Pronto! O post aparece na home.

---

## Estrutura do projeto

```
forum-compras/
├── app/                    # Rotas (App Router)
│   ├── page.tsx            # Home — listagem
│   ├── login/              # Autenticação
│   ├── perfil/             # Perfil do usuário
│   └── posts/
│       ├── novo/           # Criar post
│       └── [id]/           # Visualizar + editar
├── components/             # Componentes reutilizáveis
├── lib/                    # Supabase client + helpers
├── types/                  # Tipos TypeScript
├── supabase/               # Schema SQL
└── public/                 # Assets estáticos
```

---

## Licença

Uso interno — Time de Compras, OutSystems.
