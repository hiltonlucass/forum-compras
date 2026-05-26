import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID do post é obrigatório' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar post
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:autor_id (nome, cargo),
      categorias:categoria_id (nome)
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
  }

  // Buscar comentários
  const { data: comments } = await supabase
    .from('comentarios')
    .select('conteudo, criado_em, profiles:autor_id (nome)')
    .eq('post_id', id)
    .order('criado_em', { ascending: true });

  // Gerar HTML para PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; }
        h1 { font-size: 24px; margin-bottom: 8px; color: #1E3A5F; }
        .meta { color: #6b7280; font-size: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
        .badge { display: inline-block; background: #eef4fb; color: #1E3A5F; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
        .content { font-size: 14px; line-height: 1.7; }
        .content img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
        .content pre { background: #1a1a2e; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
        .content code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        .comments { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
        .comments h2 { font-size: 16px; margin-bottom: 16px; }
        .comment { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 8px; }
        .comment-meta { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
        .comment-text { font-size: 13px; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <span class="badge">${post.categorias?.nome || ''}</span>
      <h1>${post.titulo}</h1>
      <div class="meta">
        Por <strong>${post.profiles?.nome || 'Anônimo'}</strong>
        ${post.profiles?.cargo ? ` • ${post.profiles.cargo}` : ''}
        • ${new Date(post.criado_em).toLocaleDateString('pt-BR')}
        • ${post.visualizacoes || 0} visualizações
      </div>
      <div class="content">${post.conteudo}</div>
      ${comments && comments.length > 0 ? `
        <div class="comments">
          <h2>Comentários (${comments.length})</h2>
          ${comments.map((c: any) => `
            <div class="comment">
              <div class="comment-meta">${c.profiles?.nome || 'Anônimo'} • ${new Date(c.criado_em).toLocaleDateString('pt-BR')}</div>
              <div class="comment-text">${c.conteudo}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div class="footer">Fórum de Compras • OutSystems • Exportado em ${new Date().toLocaleDateString('pt-BR')}</div>
    </body>
    </html>
  `;

  // Retornar como HTML que o navegador pode imprimir como PDF
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${post.titulo}.html"`,
    },
  });
}
