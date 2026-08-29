"""Gera os dois diagramas do fluxo V1 na paleta do site."""
from pathlib import Path
from html import escape

# ---- paleta do site ----------------------------------------------------
INK      = '#111111'
MUTED    = '#615d59'
FAINT    = '#8b8783'
HAIR     = '#dcdbd9'
WHITE    = '#ffffff'
PAPER    = '#f6f5f4'
BLUE     = '#0075de'
SKY_TINT = '#e6f3fe'
SKY_WASH = '#62aef0'
MARIGOLD = '#ffb110'
CORAL    = '#f64932'
AMBER_BG = '#fff5e0'

FONT = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"


def esc(t):
    return escape(str(t), quote=False)


class Svg:
    def __init__(self, w, h):
        self.w, self.h, self.p = w, h, []

    def add(self, s):
        self.p.append(s)

    def text(self, x, y, txt, size=13, fill=MUTED, weight=400, anchor='middle', style=''):
        self.add(
            f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{style}>{esc(txt)}</text>'
        )

    def box(self, x, y, w, h, titulo, sub=None, toque=None,
            fill=PAPER, stroke=HAIR, cor_txt=INK, tracejado=False, r=12):
        dash = ' stroke-dasharray="6 5"' if tracejado else ''
        self.add(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="1.5"{dash}/>'
        )
        cx = x + w / 2
        linhas = [l for l in [sub, toque] if l]
        # centraliza verticalmente o bloco de texto
        alturas = [20] + [17] * len(linhas)
        total = sum(alturas)
        cy = y + (h - total) / 2 + 15
        self.text(cx, cy, titulo, size=15, fill=cor_txt, weight=600)
        cy += 20
        if sub:
            self.text(cx, cy, sub, size=12.5, fill=cor_txt if fill not in (WHITE, PAPER) else MUTED,
                      style=' opacity="0.78"')
            cy += 17
        if toque:
            self.text(cx, cy, toque, size=11.5, fill=BLUE if fill in (WHITE, PAPER) else cor_txt,
                      weight=500, style='' if fill in (WHITE, PAPER) else ' opacity="0.9"')

    def diamante(self, cx, cy, w, h, rotulo):
        pts = f'{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}'
        self.add(f'<polygon points="{pts}" fill="{SKY_TINT}" stroke="{BLUE}" stroke-width="1.5"/>')
        self.text(cx, cy + 5, rotulo, size=14, fill='#0a4f97', weight=600)

    def seta(self, pontos, rotulo=None, rx=None, ry=None, tracejado=False, cor=None, ponta=True):
        cor = cor or '#9a9793'
        d = ' '.join(f'{"M" if i == 0 else "L"} {x} {y}' for i, (x, y) in enumerate(pontos))
        dash = ' stroke-dasharray="6 5"' if tracejado else ''
        marcador = ' marker-end="url(#pta)"' if ponta else ''
        self.add(
            f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="1.6"{marcador}{dash}/>'
        )
        if rotulo:
            self.text(rx, ry, rotulo, size=11.5, fill=FAINT)

    def render(self):
        return (
            f'<svg viewBox="0 0 {self.w} {self.h}" xmlns="http://www.w3.org/2000/svg" '
            f'role="img">\n'
            f'<defs><marker id="pta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
            f'markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M 0 1 L 9 5 L 0 9 z" fill="#9a9793"/></marker></defs>\n'
            f'<rect width="{self.w}" height="{self.h}" fill="{WHITE}"/>\n'
            + '\n'.join(self.p) + '\n</svg>\n'
        )


def legenda(s, x, y, itens):
    for rotulo, fill, stroke, tracejado in itens:
        dash = ' stroke-dasharray="4 3"' if tracejado else ''
        s.add(f'<rect x="{x}" y="{y-11}" width="16" height="16" rx="4" fill="{fill}" '
              f'stroke="{stroke}" stroke-width="1.5"{dash}/>')
        s.text(x + 24, y + 2, rotulo, size=12.5, fill=MUTED, anchor='start')
        x += 40 + len(rotulo) * 7.1


def desenhar(enriquecido: bool) -> str:
    H = 148 if enriquecido else 104          # altura das caixas
    Y = 300                                   # topo da linha principal
    CY = Y + H / 2
    s = Svg(2520, 880 if enriquecido else 820)

    t = (lambda x: x) if enriquecido else (lambda _: None)

    # ---- título ----
    s.text(40, 56, 'Fluxo de transferência V1', size=22, fill=INK, weight=700, anchor='start')
    s.text(40, 82,
           'Enriquecido com telas, modais e mensagens.' if enriquecido
           else 'O ciclo de vida completo, só de estados.',
           size=14, fill=MUTED, anchor='start')

    # ---- entradas ----
    s.box(40, 170, 190, 74, 'Requisição de material', 'Pedido interno da obra')
    s.box(40, 396, 190, 74, 'Estoque', 'Saída direta')
    s.seta([(230, 207), (268, 207), (268, CY - 26), (300, CY - 26)])
    s.seta([(230, 433), (268, 433), (268, CY + 26), (300, CY + 26)])

    # ---- reservado ----
    s.box(302, Y, 240, H, 'Reservado', 'Qtd. travada · aprovação pendente',
          t('▸ Modal: Registrar Saída de Estoque'))
    s.seta([(542, CY), (580, CY)])

    # ---- aprovado? ----
    s.diamante(660, CY, 160, 116, 'Aprovado?')
    s.seta([(740, CY), (776, CY)], 'sim', 758, CY - 12)

    # ---- aprovado ----
    s.box(778, Y, 214, H, 'Aprovado', 'Envio pendente',
          t('▸ notifica origem e destino'))
    s.seta([(992, CY), (1042, CY)])

    # ---- em trânsito ----
    s.box(1044, Y, 224, H, 'Em trânsito', 'Data de saída + previsão',
          t('▸ Modal: Registrar despacho'))
    s.seta([(1268, CY), (1318, CY)])

    # ---- avaliação de entrega ----
    s.box(1320, Y, 236, H, 'Avaliação de entrega', 'Quantidade + critérios',
          t('▸ Modal: Confirmar Entrega'))
    s.seta([(1556, CY), (1606, CY)])

    # ---- aguardando NF ----
    s.box(1608, Y, 214, H, 'Aguardando NF', 'Material já no estoque',
          t('▸ Modal: Confirmar NF + anexo'),
          fill=AMBER_BG, stroke=MARIGOLD)
    s.seta([(1822, CY), (1872, CY)])

    # ---- divergência? ----
    s.diamante(1952, CY, 160, 116, 'Divergência?')

    # ---- recebido ok ----
    s.box(2064, 150, 214, 92, 'Recebido ok', 'Completo',
          t('▸ mensagem de conclusão'), fill=SKY_WASH, stroke=SKY_WASH, cor_txt='#06243f')
    s.seta([(1952, CY - 58), (1952, 196), (2062, 196)], 'não', 1975, 250)

    # ---- recebido com divergência ----
    s.box(2064, 452, 236, 92, 'Recebido com divergência', 'Registrada para auditoria',
          t('▸ aba /stocks/transfers'), fill=CORAL, stroke=CORAL, cor_txt='#ffffff')
    s.seta([(1952, CY + 58), (1952, 498), (2062, 498)], 'sim', 1975, 420)

    # ---- vai reenviar? ----
    s.diamante(2400, 498, 150, 108, 'Vai reenviar?')
    s.seta([(2300, 498), (2325, 498)])

    # ---- divergência final ----
    s.box(2260, 652, 236, 96, 'Divergência final', 'Encerrada e auditável',
          t('▸ card fecha nas duas obras'))
    s.seta([(2400, 552), (2400, 650)], 'não', 2424, 606)

    # ---- reenvio: volta para Reservado ----
    s.seta([(2400, 444), (2400, 118), (409, 118), (409, Y - 2)],
           'sim — reenvia corrigido e passa pela aprovação de novo', 1180, 108)

    # ---- reprovado ----
    s.box(560, 620, 200, 84, 'Reprovado', 'Volta ao estoque',
          t('▸ mensagem de recusa'), stroke=CORAL, tracejado=True)
    s.seta([(660, CY + 58), (660, 618)], 'não', 684, 590)

    # ---- cancelado ----
    s.box(302, 620, 200, 84, 'Cancelado', 'Antes do despacho',
          t('▸ mensagem de cancelamento'), stroke=CORAL, tracejado=True)
    s.seta([(380, Y + H), (380, 618)], 'pelo criador', 330, 560, tracejado=True)

    # ambos devolvem a quantidade ao disponível da origem
    s.seta([(660, 704), (660, 764), (402, 764)], ponta=False)
    s.seta([(402, 704), (402, 764), (135, 764), (135, 472)], 'volta ao estoque', 250, 782)

    # ---- bypass do parâmetro de aprovação ----
    s.seta([(460, Y - 2), (460, 232), (1156, 232), (1156, Y - 2)],
           'parâmetro de aprovação desligado: nasce em envio pendente e vai direto ao despacho',
           808, 222, tracejado=True)

    # ---- legenda ----
    legenda(s, 40, 806 if not enriquecido else 846, [
        ('processo', PAPER, HAIR, False),
        ('decisão', SKY_TINT, BLUE, False),
        ('aguardando NF', AMBER_BG, MARIGOLD, False),
        ('fim completo', SKY_WASH, SKY_WASH, False),
        ('fim com divergência', CORAL, CORAL, False),
        ('reprovado / cancelado', WHITE, CORAL, True),
    ])
    if enriquecido:
        s.text(40, 806, '▸ touchpoint de UI — modal, mensagem ou aba onde a transição aparece',
               size=12.5, fill=BLUE, anchor='start', weight=500)

    return s.render()


Path('public/case/fluxo_transferencia_v1_linha_unica.svg').write_text(desenhar(False))
Path('public/case/fluxo_v1_enriquecido.svg').write_text(desenhar(True))
print('dois diagramas gerados')
