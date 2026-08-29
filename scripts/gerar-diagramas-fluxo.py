"""Gera os fluxos originais digitalizados e os diagramas derivados do protótipo."""
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
    def __init__(self, w, h, titulo='', descricao=''):
        self.w, self.h, self.p = w, h, []
        self.titulo = titulo
        self.descricao = descricao

    def add(self, s):
        self.p.append(s)

    def text(self, x, y, txt, size=13, fill=MUTED, weight=400, anchor='middle', style=''):
        self.add(
            f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{style}>{esc(txt)}</text>'
        )

    def lines(self, x, y, linhas, size=13, fill=MUTED, weight=400,
              anchor='middle', gap=18, style=''):
        for i, linha in enumerate(linhas):
            self.text(x, y + i * gap, linha, size=size, fill=fill, weight=weight,
                      anchor=anchor, style=style)

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
        acessibilidade = ''
        if self.titulo:
            acessibilidade += f'<title>{esc(self.titulo)}</title>\n'
        if self.descricao:
            acessibilidade += f'<desc>{esc(self.descricao)}</desc>\n'
        return (
            f'<svg viewBox="0 0 {self.w} {self.h}" xmlns="http://www.w3.org/2000/svg" '
            f'role="img">\n'
            f'<defs><marker id="pta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
            f'markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M 0 1 L 9 5 L 0 9 z" fill="#9a9793"/></marker></defs>\n'
            + acessibilidade
            + f'<rect width="{self.w}" height="{self.h}" fill="{WHITE}"/>\n'
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
    h_caixa = 150 if enriquecido else 108
    y = 320
    cy = y + h_caixa / 2
    altura = 1120 if enriquecido else 1040
    s = Svg(
        2860, altura,
        'Fluxo de transferência V1 baseado no protótipo',
        'Ciclo completo demonstrável no protótipo, da reserva ao encerramento com ou sem divergência.',
    )
    toque = (lambda x: x) if enriquecido else (lambda _: None)

    s.text(40, 56, 'Fluxo de transferência V1', size=22, fill=INK, weight=700, anchor='start')
    s.text(
        40, 82,
        'Enriquecido com telas, modais e mensagens do protótipo.' if enriquecido
        else 'Somente estados e decisões que existem no protótipo atual.',
        size=14, fill=MUTED, anchor='start',
    )

    # Entradas demonstradas no modal de saída.
    s.box(40, 210, 210, 76, 'Requisição de material', 'Pedido interno da origem')
    s.box(40, 458, 210, 76, 'Saída direta', 'Estoque da obra de origem')
    s.seta([(250, 248), (282, 248), (282, cy - 28), (310, cy - 28)])
    s.seta([(250, 496), (282, 496), (282, cy + 28), (310, cy + 28)])

    # A transferência criada já trava saldo e já entra na fila da aprovação.
    s.box(312, y, 270, h_caixa, 'Reservado · aprovação pendente', 'Quantidade travada na origem',
          toque('▸ Registrar Saída / Nova transferência'))
    s.seta([(582, cy), (618, cy)])

    s.diamante(704, cy, 170, 118, 'Aprovador decide')
    s.seta([(789, cy), (822, cy)], 'aprova', 804, cy - 12)
    s.box(824, y, 224, h_caixa, 'Aprovado · envio pendente', 'Ainda está na origem',
          toque('▸ seção Aguardando sua aprovação'))
    s.seta([(1048, cy), (1090, cy)], 'registra despacho', 1068, cy - 12)

    s.box(1092, y, 226, h_caixa, 'Em trânsito', 'Saída + previsão de chegada',
          toque('▸ Modal / sheet: Registrar despacho'))
    s.seta([(1318, cy), (1360, cy)], 'alega chegada', 1339, cy - 12)

    s.box(1362, y, 240, h_caixa, 'FVM pendente', 'Chegou, mas não entrou no estoque',
          toque('▸ Alegar recebimento → Fazer a FVM'))
    s.seta([(1602, cy), (1644, cy)], 'confere quantidade', 1623, cy - 12)

    s.box(1646, y, 228, h_caixa, 'Aguardando NF', 'Conferido e já no estoque',
          toque('▸ FVM + Modal / sheet: Confirmar NF'),
          fill=AMBER_BG, stroke=MARIGOLD)
    s.seta([(1874, cy), (1910, cy)])
    s.diamante(1994, cy, 168, 118, 'Divergência?')

    # Caminho sem divergência: a NF é a última pendência.
    s.box(2112, 170, 226, 100, 'Recebido ok', 'NF confirmada · completo',
          toque('▸ toast + histórico + notificações'),
          fill=SKY_WASH, stroke=SKY_WASH, cor_txt='#06243f')
    s.seta([(1994, cy - 59), (1994, 220), (2110, 220)], 'não · confirma NF', 2046, 206)

    # Caminho divergente: NF e decisão da origem são pendências paralelas.
    s.box(2112, 492, 272, 128, 'Divergência registrada', 'NF e decisão da origem em paralelo',
          toque('▸ aviso crítico + card em Reservados'),
          fill='#fff0ed', stroke=CORAL)
    s.seta([(1994, cy + 59), (1994, 556), (2110, 556)], 'sim', 2020, 520)

    s.box(2440, 330, 250, 112, 'Divergência · aguardando origem', 'NF confirmada não encerra',
          toque('▸ detalhe segue com ações da origem'),
          fill='#fff0ed', stroke=CORAL)
    s.seta([(2384, 530), (2410, 530), (2410, 386), (2438, 386)], 'destino confirma NF', 2430, 475)

    s.diamante(2580, 580, 190, 122, 'Origem decide')
    s.seta([(2384, 580), (2483, 580)])
    s.seta([(2560, 442), (2560, 500), (2580, 519)], ponta=False)

    s.box(2430, 760, 300, 108, 'Finalizada com divergência', 'Falta assumida e auditável',
          toque('▸ Encerrar assumindo a falta'), fill=CORAL, stroke=CORAL, cor_txt=WHITE)
    s.seta([(2580, 641), (2580, 758)], 'encerra', 2614, 712)

    # Reenvio reserva somente o saldo faltante e reinicia a aprovação.
    s.seta([(2675, 580), (2790, 580), (2790, 126), (447, 126), (447, y - 2)],
           'envia o que faltou · reserva o saldo · passa pela aprovação novamente', 1500, 114)

    # Saídas terminais antes do despacho.
    s.box(608, 704, 194, 96, 'Reprovado', 'Saldo volta ao disponível',
          toque('▸ motivo obrigatório + mensagem'), stroke=CORAL, tracejado=True)
    s.seta([(704, cy + 59), (704, 702)], 'reprova', 730, 650)
    s.box(312, 704, 210, 96, 'Cancelado', 'Somente antes do despacho',
          toque('▸ modal / sheet: Cancelar'), stroke=CORAL, tracejado=True)
    s.seta([(398, y + h_caixa), (398, 702)], 'origem cancela', 350, 650, tracejado=True)
    s.seta([(704, 800), (704, 870), (418, 870)], ponta=False)
    s.seta([(418, 800), (418, 870), (145, 870), (145, 536)], 'devolve ao estoque da origem', 294, 890)

    legenda(s, 40, altura - 48, [
        ('processo', PAPER, HAIR, False),
        ('decisão', SKY_TINT, BLUE, False),
        ('aguardando NF', AMBER_BG, MARIGOLD, False),
        ('fim completo', SKY_WASH, SKY_WASH, False),
        ('fim com divergência', CORAL, CORAL, False),
        ('reprovado / cancelado', WHITE, CORAL, True),
    ])
    if enriquecido:
        s.text(40, altura - 82, '▸ touchpoint de UI — tela, modal, sheet, mensagem ou painel demonstrável no protótipo',
               size=12.5, fill=BLUE, anchor='start', weight=500)

    return s.render()


ORIG_GREY = '#f1f2f2'
ORIG_GREEN = '#a9ebc5'
ORIG_RED = '#ff6468'
ORIG_BLUE = '#bfd5f7'
ORIG_STROKE = '#9ba1a6'
QUESTION = '#0f3c78'
PREMISE = '#378add'


def original_box(s, x, y, w, h, linhas, fill=ORIG_GREY, stroke=ORIG_STROKE,
                 size=12.5, weight=600):
    s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" '
          f'stroke="{stroke}" stroke-width="1.5"/>')
    total = (len(linhas) - 1) * 17
    s.lines(x + w / 2, y + h / 2 - total / 2 + 4, linhas, size=size, fill=INK,
            weight=weight, gap=17)


def original_diamond(s, cx, cy, w, h, linhas, fill):
    pontos = f'{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}'
    s.add(f'<polygon points="{pontos}" fill="{fill}" stroke="{ORIG_STROKE}" stroke-width="1.5"/>')
    total = (len(linhas) - 1) * 16
    s.lines(cx, cy - total / 2 + 4, linhas, size=11.5, fill=INK, weight=600, gap=16)


def original_end(s, x, y, w, h, linhas, fill):
    corte = 22
    pontos = f'{x+corte},{y} {x+w},{y} {x+w-corte},{y+h} {x},{y+h}'
    s.add(f'<polygon points="{pontos}" fill="{fill}" stroke="{ORIG_STROKE}" stroke-width="1.5"/>')
    total = (len(linhas) - 1) * 16
    s.lines(x + w / 2, y + h / 2 - total / 2 + 4, linhas, size=11.5,
            fill=INK, weight=700, gap=16)


def marcador(s, x, y, numero, cor=QUESTION):
    s.add(f'<circle cx="{x}" cy="{y}" r="16" fill="{cor}"/>')
    s.text(x, y + 5, numero, size=14, fill=WHITE, weight=700)


def anotacoes(s, y, altura, linhas):
    s.add(f'<rect x="40" y="{y}" width="{s.w - 80}" height="{altura}" rx="12" '
          f'fill="{SKY_TINT}" stroke="#b8d8f4"/>')
    atual = y + 30
    for numero, titulo, detalhe, cor in linhas:
        marcador(s, 66, atual - 5, numero, cor)
        s.text(94, atual, titulo, size=13, fill=QUESTION, weight=700, anchor='start')
        atual += 22
        if detalhe:
            s.text(94, atual, detalhe, size=12.5, fill=MUTED, anchor='start')
            atual += 30
        else:
            atual += 12


def cabecalho_original(s, titulo):
    s.text(40, 48, titulo, size=22, fill=INK, weight=700, anchor='start')
    s.text(40, 76, 'Digitalização fiel do material fornecido · perguntas em azul não alteram o fluxo original.',
           size=13.5, fill=MUTED, anchor='start')


def desenhar_original_criacao():
    s = Svg(
        1700, 760,
        'Fluxo 1: Criação — original da Suplos digitalizado',
        'O fluxo original conecta requisição de material ou saída de estoque ao mesmo modal e lista a transferência em duas áreas.',
    )
    cabecalho_original(s, 'Fluxo 1: Criação — original da Suplos')

    original_box(s, 55, 280, 250, 74, ['START - Fluxo de Transfs'])
    original_box(s, 420, 145, 280, 74, ['Requisição de Mat'])
    original_box(s, 420, 385, 280, 74, ['Saída Estoque - Transferencia'])
    original_box(s, 810, 145, 300, 314, [
        'Modal de dados de transferência',
        '[Itens]',
        '[Apropriação (se houver Sempre)]',
        '[Destino (obra)]',
        '[Assinatura]',
        '[Apresentar aprovadores UX]',
        '[DATA DE ENTREGA]',
        'etc',
    ], size=12)
    original_box(s, 1360, 270, 260, 84, ['End - Fluxo de Criação'])
    original_box(s, 1350, 410, 280, 76, ['APRESENTARÁ NA ABA EM', '/STOCKS/TRANSFERS'])
    original_box(s, 1350, 510, 280, 76, ['APRESENTARÁ NA ABA EM', '/REQUISITIONS'])

    s.seta([(305, 307), (360, 307), (390, 182), (418, 182)])
    s.seta([(305, 329), (360, 329), (390, 422), (418, 422)])
    s.seta([(700, 182), (755, 182), (790, 280), (808, 280)])
    s.seta([(700, 422), (755, 422), (790, 330), (808, 330)])
    s.seta([(1110, 302), (1260, 302), (1358, 312)], 'MENSAGEM DE CONCLUSÃO', 1230, 286)
    s.seta([(1490, 354), (1490, 408)])
    s.seta([(1490, 486), (1490, 508)])

    marcador(s, 405, 128, '1', PREMISE)
    marcador(s, 1330, 548, '2')
    anotacoes(s, 620, 104, [
        ('1', 'Premissa que validei antes de modelar meu fluxo',
         '“Requisição de Material” é uma entrada interna da obra de origem; quem tem sobra inicia a transferência.', PREMISE),
        ('2', 'Pergunta que motivou a mudança no meu fluxo',
         'Por que uma saída direta também iria para /requisitions? No protótipo, a origem fica registrada sem misturar as duas entradas.', QUESTION),
    ])
    return s.render()


def desenhar_original_aprovacao():
    s = Svg(
        2460, 1120,
        'Fluxo 2: Aprovação — original da Suplos digitalizado',
        'As ramificações de parâmetro ligado e desligado são reproduzidas com a mesma árvore de aprovar e reprovar.',
    )
    cabecalho_original(s, 'Fluxo 2: Aprovação — original da Suplos')

    original_box(s, 40, 475, 230, 74, ['FLUXO DE TRANSFERÊNCIA', '(APROVADOR)'])
    original_box(s, 315, 135, 265, 66, ['PUXAR QUAIS USERS PODEM SER', 'APROVADORES'])

    def ramo(y, fill, ligado):
        original_box(s, 650, y, 245, 64, [f'PARAMETRO DE APROVADOR = {ligado}'], fill=fill)
        original_diamond(s, 1040, y + 32, 112, 98, ['AÇÃO'], fill)
        original_box(s, 1165, y - 70, 230, 64, ['REPROVAR TRANSFERENCIA'], fill=fill)
        original_box(s, 1165, y + 70, 230, 64, ['APROVAR TRANSFERENCIA'], fill=fill)
        original_box(s, 1450, y - 102, 260, 128, [
            'CAMPOS DOS MODAIS',
            '1. MOTIVO DA REPROVAÇÃO =',
            'CAMPO DE TEXTO',
            '2. ASSINATURA',
            '3. CAPTURAR EMAIL/nome DO USER',
        ], fill=fill, size=10.5)
        original_box(s, 1765, y - 102, 260, 128, [
            'RECUSA, APRESENTAR DADOS',
            'STATUS DE REPROVADO +',
            'OBSERVAÇÃO (CAMPO PARA',
            'PREENCHER)',
        ], fill=fill, size=10.5)
        original_box(s, 1665, y + 70, 260, 64, ['APRESENTAR CARD NA OBRA', 'DESTINO'], fill=fill)
        original_end(s, 2075, y - 36, 130, 62, ['FIM'], fill)
        original_box(s, 2250, y - 36, 170, 70, ['Listar card e atualizar em', 'stocks/transfers'], fill=ORIG_GREEN, size=10.5)

        s.seta([(895, y + 32), (982, y + 32)])
        s.seta([(1096, y + 14), (1130, y - 38), (1163, y - 38)])
        s.seta([(1096, y + 50), (1130, y + 102), (1163, y + 102)])
        s.seta([(1395, y - 38), (1448, y - 38)])
        s.seta([(1710, y - 38), (1763, y - 38)])
        s.seta([(2025, y - 38), (2073, y - 5)])
        s.seta([(1395, y + 102), (1663, y + 102)])
        s.seta([(1925, y + 102), (2028, y + 102), (2073, y + 10)])
        s.seta([(2205, y - 5), (2248, y - 2)])

    ramo(275, ORIG_GREEN, 'ON')
    ramo(690, ORIG_RED, 'OFF')

    s.seta([(270, 494), (610, 307), (648, 307)])
    s.seta([(270, 530), (610, 722), (648, 722)])
    s.seta([(270, 490), (290, 168), (313, 168)])
    s.seta([(580, 168), (620, 168), (620, 275), (648, 275)])

    marcador(s, 1010, 635, '1')
    marcador(s, 1010, 520, '2')
    anotacoes(s, 920, 154, [
        ('1', 'Pergunta que expôs a inconsistência',
         'Se o parâmetro está OFF, por que o fluxo original ainda oferece Aprovar e Reprovar? No protótipo atual, a aprovação é obrigatória e explícita.', QUESTION),
        ('2', 'Mudança aplicada ao meu fluxo',
         'As duas árvores idênticas não foram copiadas. O meu fluxo mostra uma única fila de aprovação, uma decisão e os caminhos de aprovado/reprovado.', QUESTION),
    ])
    return s.render()


def desenhar_original_recebimento():
    s = Svg(
        2160, 850,
        'Fluxo 3: Recebimento — original da Suplos digitalizado',
        'O fluxo original recebe itens pela área de transferências ou delivery, abre confirmação com FVM opcional e atualiza as duas obras.',
    )
    cabecalho_original(s, 'Fluxo 3: Recebimento — original da Suplos')

    original_box(s, 55, 230, 220, 78, ['FLUXO DE TRANSFERÊNCIA ENTRE', 'ESTOQUES'], fill=ORIG_BLUE, size=11)
    original_box(s, 340, 230, 230, 78, ['TRANSFERÊNCIA APROVADA', '(COM OU SEM APROVADOR)'], fill=ORIG_BLUE, size=11)
    original_box(s, 650, 210, 255, 118, ['LISTAR ITENS A RECEBER COMO', 'CARD E SEU DETALHAMENTO', 'INTERNO'], fill=ORIG_BLUE, size=11)
    original_box(s, 1260, 210, 235, 118, ['RECEBER O ITEM EM ESTOQUE', '(ENTRADA DE ESTOQUE)'], fill=ORIG_BLUE, size=11)
    original_box(s, 1625, 210, 220, 118, ['CONFIRMAÇÃO DE RECEBIMENTO'], fill=ORIG_BLUE, size=11)
    original_end(s, 1950, 236, 140, 66, ['FIM'], ORIG_BLUE)
    original_box(s, 1900, 380, 210, 74, ['Listar card e atualizar em', 'stocks/transfers', 'NAS DUAS OBRAS'], fill=ORIG_GREEN, size=10.5)

    original_box(s, 735, 455, 210, 66, ['STOCKS/TRANSFERS'], fill=ORIG_BLUE, size=11)
    original_box(s, 735, 555, 210, 66, ['DELIVERY'], fill=ORIG_BLUE, size=11)
    original_end(s, 1055, 493, 130, 90, ['O FLUXO', 'PODE SER', 'FEITO POR'], ORIG_BLUE)
    original_box(s, 1260, 458, 260, 144, ['ABRIR O MODAL CONFIRMAR DE', 'ENTREGAS', 'COM FVM OPCIONAL'], fill=ORIG_BLUE, size=11)

    s.seta([(275, 269), (338, 269)])
    s.seta([(570, 269), (648, 269)])
    s.seta([(905, 269), (1258, 269)])
    s.seta([(1495, 269), (1623, 269)])
    s.seta([(1845, 269), (1948, 269)])
    s.seta([(2020, 302), (2020, 378)])
    s.seta([(455, 308), (455, 488), (733, 488)])
    s.seta([(455, 308), (455, 588), (733, 588)])
    s.seta([(945, 488), (1053, 520)])
    s.seta([(945, 588), (1053, 556)])
    s.seta([(1185, 538), (1258, 530)])
    s.seta([(1520, 530), (1570, 530), (1570, 269), (1623, 269)])

    marcador(s, 1390, 430, '1')
    marcador(s, 1100, 470, '2', PREMISE)
    anotacoes(s, 680, 124, [
        ('1', 'Pergunta que mudou meu fluxo',
         'Se a FVM é opcional, como registrar “saíram 10, chegaram 8”? No protótipo, a conferência de quantidade é obrigatória; critérios de qualidade podem ser configuráveis.', QUESTION),
        ('2', 'Premissa assumida no protótipo',
         'Stocks/Transfers e Delivery foram tratados como pontos de entrada para a mesma conferência, não como comportamentos diferentes.', PREMISE),
    ])
    return s.render()


def tela_box(s, x, y, w, h, titulo, linhas=(), tipo='tela'):
    estilos = {
        'tela': (SKY_TINT, BLUE),
        'overlay': (WHITE, '#7aaed9'),
        'acao': (AMBER_BG, MARIGOLD),
        'compartilhado': ('#f0eefb', '#7d68bb'),
    }
    fill, stroke = estilos[tipo]
    s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" '
          f'fill="{fill}" stroke="{stroke}" stroke-width="1.5" '
          f'{"stroke-dasharray=\"6 5\"" if tipo == "overlay" else ""}/>')
    s.text(x + 16, y + 28, titulo, size=14, fill=INK, weight=700, anchor='start')
    for i, linha in enumerate(linhas):
        s.text(x + 16, y + 51 + i * 18, linha, size=11.5, fill=MUTED, anchor='start')


def desenhar_fluxo_telas():
    s = Svg(
        2720, 1480,
        'Fluxo de telas do protótipo web e mobile',
        'Mapa das rotas, telas, drawers, modais, sheets e navegação que compartilham a mesma máquina de estados.',
    )
    s.text(40, 52, 'Fluxo de telas do protótipo', size=22, fill=INK, weight=700, anchor='start')
    s.text(40, 80, 'Web e mobile usam a mesma transferência e a mesma máquina de estados; a navegação muda conforme o contexto.',
           size=13.5, fill=MUTED, anchor='start')

    # Faixa web.
    s.add('<rect x="24" y="112" width="2672" height="590" rx="18" fill="#fbfbfa" stroke="#e4e2df"/>')
    s.text(50, 150, 'WEB · escritório', size=15, fill=INK, weight=700, anchor='start')

    tela_box(s, 70, 190, 300, 130, '/stocks · Estoque', [
        'Aba Estoque · Entrada / Saída', 'Aba Movimentações · linhas clicáveis',
    ])
    tela_box(s, 70, 430, 300, 150, '/stocks/transfers · Painel', [
        'Saindo / Chegando · cards de status', 'Lista / calendário · atrasos / próximas', 'Modo aprovador da outra empresa',
    ])
    tela_box(s, 460, 190, 290, 130, 'Registrar Saída de Estoque', [
        'Saída direta ou requisição', 'Destino · itens · assinatura',
    ], 'overlay')
    tela_box(s, 460, 430, 290, 150, '/stocks/transfers/:id · Detalhe', [
        'Drawer · status · saldos · histórico', 'Ações variam por estado e obra',
    ], 'overlay')

    tela_box(s, 850, 150, 300, 116, 'Aprovação', ['Aprovar direto no painel', 'Reprovar abre motivo'], 'acao')
    tela_box(s, 850, 290, 300, 116, 'Pré-despacho', ['Registrar despacho', 'Cancelar transferência'], 'acao')
    tela_box(s, 850, 430, 300, 116, 'Chegada', ['Alegar recebimento', 'Seguir agora ou deixar FVM pendente'], 'acao')
    tela_box(s, 850, 570, 300, 100, 'FVM', ['Quantidade obrigatória', 'Critérios configuráveis'], 'acao')

    tela_box(s, 1250, 150, 300, 116, 'Confirmar NF', ['Número + anexo', 'Sem divergência → completa'], 'acao')
    tela_box(s, 1250, 300, 300, 136, 'Divergência', ['Aviso crítico para a origem', 'NF não encerra a pendência'], 'acao')
    tela_box(s, 1250, 490, 300, 150, 'Decisão da origem', ['Enviar somente o saldo faltante', 'ou encerrar assumindo a falta'], 'acao')

    tela_box(s, 1700, 185, 330, 130, 'Notificações + toasts', ['Ações atualizam sino, timeline e saldos', 'Recebimento notifica as três partes'], 'compartilhado')
    tela_box(s, 1700, 430, 330, 130, 'Entradas do app mobile', [
        '/stocks/transfers/receiving · moldura', '/embed/mobile · app sem moldura',
    ], 'tela')
    tela_box(s, 2160, 300, 380, 150, 'Store + máquina de estados', ['Uma entidade de transferência', 'Mesmos estados, papéis, saldos e histórico', 'para as duas experiências'], 'compartilhado')

    s.seta([(370, 230), (458, 230)])
    s.seta([(370, 500), (458, 500)])
    s.seta([(605, 320), (605, 430)])
    s.seta([(750, 505), (812, 505), (812, 208), (848, 208)])
    s.seta([(750, 505), (812, 505), (812, 348), (848, 348)])
    s.seta([(750, 505), (848, 488)])
    s.seta([(1000, 546), (1000, 568)])
    s.seta([(1150, 620), (1200, 620), (1200, 208), (1248, 208)])
    s.seta([(1150, 620), (1200, 620), (1200, 368), (1248, 368)])
    s.seta([(1400, 436), (1400, 488)])
    s.seta([(1550, 240), (1698, 240)], tracejado=True)
    s.seta([(1550, 560), (1650, 560), (1650, 250), (1698, 250)], tracejado=True)
    s.seta([(2030, 250), (2140, 250), (2140, 360), (2158, 360)], tracejado=True)
    s.seta([(370, 550), (400, 550), (400, 680), (1600, 680), (1600, 495), (1698, 495)], 'header: abrir mobile', 1040, 672)

    # Faixa mobile.
    s.add('<rect x="24" y="730" width="2672" height="690" rx="18" fill="#fbfbfa" stroke="#e4e2df"/>')
    s.text(50, 770, 'MOBILE · canteiro', size=15, fill=INK, weight=700, anchor='start')

    tela_box(s, 70, 820, 260, 118, 'Transferências', ['Direção · cards · lista', 'FAB: Nova transferência'])
    tela_box(s, 70, 975, 260, 118, 'Estoque', ['Entrada / Saída', 'Saldos e reservas'])
    tela_box(s, 70, 1130, 260, 118, 'Movimentações', ['Filtros · histórico', 'Linha abre detalhe'])
    tela_box(s, 70, 1285, 260, 100, 'Alertas', ['Notificação abre detalhe'])

    tela_box(s, 430, 820, 300, 138, 'Nova transferência', ['Passo 1 · origem e destino', 'Passo 2 · insumos', 'Passo 3 · observação e assinatura'])
    tela_box(s, 430, 1045, 300, 138, 'Detalhe', ['Dados · itens · timeline', 'Botões conforme estado e papel'])
    tela_box(s, 850, 790, 300, 164, 'Bottom sheets', ['Despacho · Reprovação · Cancelamento', 'Chegada · NF · Encerrar divergência', 'Adicionar insumo · Controles da demo'], 'overlay')
    tela_box(s, 850, 1045, 300, 138, 'FVM · tela inteira', ['Conferência de quantidade', 'Avaliação por critérios'])
    tela_box(s, 1260, 1045, 300, 118, 'Resultado da FVM', ['Voltar para a lista', 'ou ver a transferência'])
    tela_box(s, 1260, 810, 300, 118, 'Modo aprovador', ['Fila adicional no topo', 'Aprovar / reprovar sem trocar de app'], 'acao')
    tela_box(s, 1700, 900, 350, 150, 'Navegação compartilhada', ['Abas mantêm as quatro áreas', 'Fluxos longos viram pilha', 'Sheets resolvem decisões curtas'], 'compartilhado')
    tela_box(s, 2160, 900, 380, 150, 'Mesma máquina do web', ['Qualquer ação mobile atualiza', 'a lista, o drawer, os saldos', 'e o histórico na versão web'], 'compartilhado')

    s.seta([(330, 865), (428, 865)])
    s.seta([(330, 1034), (380, 1034), (380, 895), (428, 895)], 'Saída', 382, 1018)
    s.seta([(330, 1189), (380, 1189), (380, 1114), (428, 1114)])
    s.seta([(330, 1335), (380, 1335), (380, 1145), (428, 1145)])
    s.seta([(730, 1114), (848, 1114)])
    s.seta([(730, 1114), (790, 1114), (790, 872), (848, 872)])
    s.seta([(1150, 1114), (1258, 1104)])
    s.seta([(1410, 1045), (1410, 965), (1152, 965), (1152, 1114)], 'ver transferência', 1300, 952)
    s.seta([(200, 820), (200, 790), (1410, 790), (1410, 808)], 'simular outra empresa', 790, 782)
    s.seta([(1560, 870), (1698, 948)], tracejado=True)
    s.seta([(2050, 975), (2158, 975)], tracejado=True)
    s.seta([(2540, 975), (2620, 975), (2620, 420), (2542, 420)], tracejado=True)

    legenda(s, 50, 1450, [
        ('tela / rota', SKY_TINT, BLUE, False),
        ('modal / drawer / sheet', WHITE, '#7aaed9', True),
        ('ação do fluxo', AMBER_BG, MARIGOLD, False),
        ('estado compartilhado', '#f0eefb', '#7d68bb', False),
    ])
    return s.render()


DESTINO = Path('public/case')
DESTINO.mkdir(parents=True, exist_ok=True)
DESTINO.joinpath('fluxo_original_1_criacao.svg').write_text(desenhar_original_criacao(), encoding='utf-8')
DESTINO.joinpath('fluxo_original_2_aprovacao.svg').write_text(desenhar_original_aprovacao(), encoding='utf-8')
DESTINO.joinpath('fluxo_original_3_recebimento.svg').write_text(desenhar_original_recebimento(), encoding='utf-8')
DESTINO.joinpath('fluxo_transferencia_v1_linha_unica.svg').write_text(desenhar(False), encoding='utf-8')
DESTINO.joinpath('fluxo_v1_enriquecido.svg').write_text(desenhar(True), encoding='utf-8')
DESTINO.joinpath('fluxo_telas_prototipo.svg').write_text(desenhar_fluxo_telas(), encoding='utf-8')
print('seis diagramas gerados')
