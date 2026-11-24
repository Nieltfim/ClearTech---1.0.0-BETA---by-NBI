// Dados de exemplo (mock). Troque por chamadas à sua API quando ela existir.

     

export type TipoAtividade = 'material' | 'resgate';
export type Atividade = { id: string; data: string; descricao: string; pontos: number; tipo: TipoAtividade };

export const HISTORICO: Atividade[] = [
  { id: '1', data: '10/05/2026', descricao: 'Registro de Plástico (PET)', pontos: 50, tipo: 'material' },
  { id: '2', data: '08/05/2026', descricao: 'Cashback iFood', pontos: -200, tipo: 'resgate' },
  { id: '3', data: '05/05/2026', descricao: 'Registro de Papel', pontos: 30, tipo: 'material' },
  { id: '4', data: '02/05/2026', descricao: 'Registro de Vidro', pontos: 40, tipo: 'material' },
  { id: '5', data: '28/04/2026', descricao: 'Cashback Amazon', pontos: -250, tipo: 'resgate' },
  { id: '6', data: '20/04/2026', descricao: 'Registro de Metal', pontos: 60, tipo: 'material' },
];

export const CATEGORIAS = ['Todos', 'Alimentação', 'Vestuário', 'Eletrônicos', 'Saúde', 'Lazer'];

export type Loja = {
  id: string;
  nome: string;
  sigla: string;
  cor: string;
  categoria: string;
  cashback: string;
  pontos: number;
};

export const LOJAS: Loja[] = [
  { id: 'ifood', nome: 'iFood', sigla: 'iF', cor: '#EA1D2C', categoria: 'Alimentação', cashback: '10%', pontos: 300 },
  { id: 'amazon', nome: 'Amazon', sigla: 'am', cor: '#232F3E', categoria: 'Eletrônicos', cashback: '10%', pontos: 250 },
  { id: 'renner', nome: 'Renner', sigla: 'R', cor: '#D71920', categoria: 'Vestuário', cashback: '10%', pontos: 200 },
  { id: 'uber', nome: 'Uber', sigla: 'U', cor: '#111111', categoria: 'Lazer', cashback: '10%', pontos: 200 },
  { id: 'netshoes', nome: 'Netshoes', sigla: 'N', cor: '#5B2A86', categoria: 'Vestuário', cashback: '10%', pontos: 200 },
  { id: 'carrefour', nome: 'Carrefour', sigla: 'C', cor: '#1D4F9C', categoria: 'Alimentação', cashback: '10%', pontos: 250 },
];

export const FAQ = [
  { id: '1', pergunta: 'Como funciona a ClearTech?', resposta: 'Você leva seus materiais recicláveis a um ponto de coleta parceiro, registra o material no app e recebe pontos que podem ser trocados por cashback em lojas parceiras.' },
  { id: '2', pergunta: 'Como registrar um material reciclável?', resposta: 'Abra "Registrar", aponte a câmera para o QR Code do ponto de coleta ou digite o código manualmente.' },
  { id: '3', pergunta: 'Como recebo meus pontos?', resposta: 'Os pontos são adicionados à sua conta assim que o registro é confirmado. A quantidade depende do tipo e do peso do material.' },
  { id: '4', pergunta: 'Como resgatar um benefício?', resposta: 'Na aba "Benefícios", escolha a loja, toque em "Resgatar" e confirme. Você precisa ter pontos suficientes.' },
  { id: '5', pergunta: 'O que posso reciclar?', resposta: 'Plástico, papel, vidro e metal. Consulte o ponto de coleta para saber as condições de cada material.' },
  { id: '6', pergunta: 'Como funciona o cashback?', resposta: 'Ao resgatar, você recebe um percentual de volta em compras nas lojas parceiras, conforme indicado em cada cartão.' },
  { id: '7', pergunta: 'Problemas com o QR Code', resposta: 'Verifique se a câmera está liberada, se há luz suficiente e se o código está inteiro. Se persistir, use a digitação manual.' },
  { id: '8', pergunta: 'Como alterar meus dados pessoais?', resposta: 'Vá em "Perfil", edite os campos permitidos e toque em "Salvar alterações".' },
];
