-- ============================================================
-- FÓRUM DE COMPRAS — Schema Completo para Supabase
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. TABELA: profiles
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  cargo TEXT DEFAULT 'Desenvolvedor OutSystems',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver perfis
CREATE POLICY "Perfis são públicos para leitura"
  ON profiles FOR SELECT
  USING (true);

-- Usuário pode editar apenas seu próprio perfil
CREATE POLICY "Usuário pode atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Inserção via trigger (sistema)
CREATE POLICY "Sistema pode inserir perfis"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. TABELA: categorias
-- ============================================================
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT DEFAULT 'folder'
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler categorias
CREATE POLICY "Categorias são públicas para leitura"
  ON categorias FOR SELECT
  USING (true);

-- Apenas admins podem gerenciar categorias (via service_role ou dashboard)
-- Para simplificar, permitimos insert/update para autenticados
CREATE POLICY "Usuários autenticados podem criar categorias"
  ON categorias FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar categorias"
  ON categorias FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Inserir categorias padrão do módulo Compra
INSERT INTO categorias (nome, descricao, icone) VALUES
  ('Dashboard', 'Visão geral e indicadores', 'layout-dashboard'),
  ('Busca', 'Pesquisa e filtros avançados', 'search'),
  ('Requisições', 'Requisições de compra', 'file-text'),
  ('Gerenciador', 'Gerenciamento de processos', 'settings'),
  ('Pedidos', 'Pedidos de compra', 'shopping-cart'),
  ('Medições', 'Medições e aferições', 'ruler'),
  ('Contratos Criados', 'Contratos elaborados internamente', 'file-plus'),
  ('Contratos Recebidos', 'Contratos recebidos de fornecedores', 'file-input'),
  ('Central de Importações', 'Importação de dados e documentos', 'globe'),
  ('Follow-Up', 'Acompanhamento de processos', 'bell'),
  ('SLA', 'Acordos de nível de serviço', 'clock'),
  ('Minhas Aprovações', 'Aprovações pendentes do usuário', 'check-circle'),
  ('Pedidos Recebidos', 'Pedidos recebidos para processamento', 'inbox'),
  ('Compartilhados Comigo', 'Itens compartilhados por outros usuários', 'users');

-- ============================================================
-- 3. TABELA: posts
-- ============================================================
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  autor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE SET NULL,
  fixado BOOLEAN DEFAULT FALSE,
  visualizacoes INT DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler posts
CREATE POLICY "Posts são públicos para leitura"
  ON posts FOR SELECT
  USING (true);

-- Usuários autenticados podem criar posts
CREATE POLICY "Usuários autenticados podem criar posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = autor_id);

-- Apenas o autor pode editar seu post
CREATE POLICY "Autores podem editar seus posts"
  ON posts FOR UPDATE
  USING (auth.uid() = autor_id);

-- Apenas o autor pode deletar seu post
CREATE POLICY "Autores podem deletar seus posts"
  ON posts FOR DELETE
  USING (auth.uid() = autor_id);

-- ============================================================
-- 4. TABELA: imagens_post
-- ============================================================
CREATE TABLE imagens_post (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nome_arquivo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE imagens_post ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver imagens de posts
CREATE POLICY "Imagens são públicas para leitura"
  ON imagens_post FOR SELECT
  USING (true);

-- Autor do post pode inserir imagens
CREATE POLICY "Autor do post pode inserir imagens"
  ON imagens_post FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT autor_id FROM posts WHERE id = post_id)
  );

-- Autor do post pode deletar imagens
CREATE POLICY "Autor do post pode deletar imagens"
  ON imagens_post FOR DELETE
  USING (
    auth.uid() = (SELECT autor_id FROM posts WHERE id = post_id)
  );

-- ============================================================
-- 5. TABELA: comentarios
-- ============================================================
CREATE TABLE comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler comentários
CREATE POLICY "Comentários são públicos para leitura"
  ON comentarios FOR SELECT
  USING (true);

-- Usuários autenticados podem comentar
CREATE POLICY "Usuários autenticados podem comentar"
  ON comentarios FOR INSERT
  WITH CHECK (auth.uid() = autor_id);

-- Autor pode editar seu comentário
CREATE POLICY "Autores podem editar seus comentários"
  ON comentarios FOR UPDATE
  USING (auth.uid() = autor_id);

-- Autor pode deletar seu comentário
CREATE POLICY "Autores podem deletar seus comentários"
  ON comentarios FOR DELETE
  USING (auth.uid() = autor_id);

-- ============================================================
-- 6. TABELA: reacoes
-- ============================================================
CREATE TABLE reacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('util', 'resolvido', 'duvida')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  -- Evita reação duplicada do mesmo tipo pelo mesmo usuário no mesmo post
  UNIQUE (post_id, autor_id, tipo)
);

ALTER TABLE reacoes ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver reações
CREATE POLICY "Reações são públicas para leitura"
  ON reacoes FOR SELECT
  USING (true);

-- Usuários autenticados podem reagir
CREATE POLICY "Usuários autenticados podem reagir"
  ON reacoes FOR INSERT
  WITH CHECK (auth.uid() = autor_id);

-- Usuário pode remover sua própria reação
CREATE POLICY "Usuários podem remover suas reações"
  ON reacoes FOR DELETE
  USING (auth.uid() = autor_id);

-- ============================================================
-- 7. TRIGGER: Criar perfil automaticamente ao registrar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. TRIGGER: Atualizar "atualizado_em" automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 9. ÍNDICES DE PERFORMANCE
-- ============================================================

-- Posts: ordenação por data e filtro por categoria/autor
CREATE INDEX idx_posts_criado_em ON posts (criado_em DESC);
CREATE INDEX idx_posts_categoria_id ON posts (categoria_id);
CREATE INDEX idx_posts_autor_id ON posts (autor_id);
CREATE INDEX idx_posts_fixado ON posts (fixado DESC, criado_em DESC);

-- Comentários: busca por post e ordenação
CREATE INDEX idx_comentarios_post_id ON comentarios (post_id, criado_em ASC);
CREATE INDEX idx_comentarios_autor_id ON comentarios (autor_id);

-- Reações: contagem por post
CREATE INDEX idx_reacoes_post_id ON reacoes (post_id);
CREATE INDEX idx_reacoes_autor_id ON reacoes (autor_id);

-- Imagens: busca por post
CREATE INDEX idx_imagens_post_id ON imagens_post (post_id);

-- ============================================================
-- 10. STORAGE BUCKET (executar separadamente se necessário)
-- ============================================================
-- No painel do Supabase: Storage → New Bucket
-- Nome: post-images
-- Public: true
--
-- Policy de upload (adicionar via dashboard):
-- Permitir INSERT para authenticated users
-- Permitir SELECT para todos (público)
