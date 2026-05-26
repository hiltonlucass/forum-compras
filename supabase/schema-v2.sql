-- ============================================================
-- FÓRUM DE COMPRAS — Schema V2 (Funcionalidades Avançadas)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. TAGS nos posts (campo array já existe, vamos criar tabela de tags)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags são públicas para leitura" ON tags FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar tags" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Post tags são públicas para leitura" ON post_tags FOR SELECT USING (true);
CREATE POLICY "Autenticados podem vincular tags" ON post_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Autenticados podem remover tags" ON post_tags FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX idx_post_tags_post_id ON post_tags (post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags (tag_id);
CREATE INDEX idx_tags_nome ON tags (nome);

-- ============================================================
-- 2. NOTIFICAÇÕES
-- ============================================================
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('comentario', 'reacao', 'mencao')),
  mensagem TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  remetente_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê suas notificações"
  ON notificacoes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Sistema pode criar notificações"
  ON notificacoes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuário pode marcar como lida"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário pode deletar suas notificações"
  ON notificacoes FOR DELETE
  USING (auth.uid() = usuario_id);

CREATE INDEX idx_notificacoes_usuario ON notificacoes (usuario_id, lida, criado_em DESC);

-- ============================================================
-- 3. HISTÓRICO DE EDIÇÕES
-- ============================================================
CREATE TABLE IF NOT EXISTS post_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  editado_por UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Histórico é público para leitura"
  ON post_historico FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir histórico"
  ON post_historico FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX idx_post_historico_post ON post_historico (post_id, criado_em DESC);

-- ============================================================
-- 4. TRIGGER: Criar notificação ao comentar
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  post_title TEXT;
BEGIN
  -- Buscar autor do post
  SELECT autor_id, titulo INTO post_author_id, post_title
  FROM posts WHERE id = NEW.post_id;

  -- Não notificar se o autor comentou no próprio post
  IF post_author_id = NEW.autor_id THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do comentarista
  SELECT nome INTO commenter_name
  FROM profiles WHERE id = NEW.autor_id;

  -- Criar notificação
  INSERT INTO notificacoes (usuario_id, tipo, mensagem, post_id, remetente_id)
  VALUES (
    post_author_id,
    'comentario',
    commenter_name || ' comentou no seu post "' || LEFT(post_title, 50) || '"',
    NEW.post_id,
    NEW.autor_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_comment
  AFTER INSERT ON comentarios
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

-- ============================================================
-- 5. TRIGGER: Salvar histórico antes de editar post
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_post_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Salvar versão anterior
  INSERT INTO post_historico (post_id, titulo, conteudo, editado_por)
  VALUES (OLD.id, OLD.titulo, OLD.conteudo, OLD.autor_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_update
  BEFORE UPDATE ON posts
  FOR EACH ROW
  WHEN (OLD.conteudo IS DISTINCT FROM NEW.conteudo OR OLD.titulo IS DISTINCT FROM NEW.titulo)
  EXECUTE FUNCTION public.save_post_history();
