// Ferramenta de linha de comando para testar o fluxo SEM o sistema à parte.
//   npm run cli -- novo-ponto "Ecoponto Centro" "Av. Djalma Batista, 1000" [lat] [lng] ["Seg-Sex 8h-17h"]
//   npm run cli -- emitir <idDoPonto> <material> <peso_kg> <qualidade>     (qualidade: 1, 0.5 ou 0)
//   npm run cli -- materiais
//   npm run cli -- limpar-obsoletas [--confirmar]   (remove tabelas de versões anteriores)
const { db } = require('./db');
const s = require('./servicos');

const [, , comando, ...a] = process.argv;
try {
  if (comando === 'novo-ponto') {
    const [nome, endereco, lat, lng, horario] = a;
    const p = s.criarPontoColeta({ nome, endereco, latitude: lat ? Number(lat) : null, longitude: lng ? Number(lng) : null, horario: horario ?? null });
    console.log(`\nPonto de coleta criado: #${p.id} ${p.nome}`);
    console.log(`\n  CHAVE DE API (guarde agora; ela não será mostrada de novo):\n  ${p.api_key}\n`);
    console.log('  O sistema à parte deve enviá-la no cabeçalho  X-Api-Key');
  } else if (comando === 'emitir') {
    const [pontoId, material, peso, qualidade] = a;
    const ponto = db.prepare('SELECT * FROM pontos_coleta WHERE id = ?').get(Number(pontoId));
    if (!ponto) throw new Error('Ponto de coleta não encontrado.');
    const e = s.emitirEntrega(ponto, { material, peso_kg: peso, qualidade });
    console.log('\nEntrega registrada:');
    console.log(JSON.stringify(e, null, 2));
    if (e.codigo) console.log(`\n  CÓDIGO PARA O QR CODE:  ${e.codigo}\n`);
  } else if (comando === 'limpar-obsoletas') {
    // Tabelas criadas por versões anteriores deste projeto e que o código atual não usa.
    // Só são removidas com --confirmar, e NUNCA se tiverem dados (exceto lojas/codigos_coleta, que eram dados de exemplo).
    const OBSOLETAS = ['usuarios', 'atividades', 'codigos_coleta', 'lojas'];
    const EXEMPLO = ['lojas', 'codigos_coleta'];
    const confirmar = a.includes('--confirmar');
    const existentes = OBSOLETAS.filter((t) => db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(t));
    if (!existentes.length) console.log('Nada a limpar.');
    for (const t of existentes) {
      const n = db.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get().n;
      const apagavel = n === 0 || EXEMPLO.includes(t);
      if (!apagavel) { console.log(`• ${t}: ${n} linhas -> MANTIDA (tem dados; confira antes de apagar à mão)`); continue; }
      if (confirmar) { db.exec(`DROP TABLE "${t}"`); console.log(`• ${t}: ${n} linhas -> removida`); }
      else console.log(`• ${t}: ${n} linhas -> seria removida`);
    }
    if (existentes.length && !confirmar) console.log('\nNada foi apagado. Para remover: npm run cli -- limpar-obsoletas --confirmar');
  } else if (comando === 'materiais') {
    console.table(s.listarMateriais().map((m) => ({ id: m.id, material: m.nome, 'pontos/kg': m.pontos_por_kg })));
  } else {
    console.log('Comandos: novo-ponto | emitir | materiais | limpar-obsoletas   (veja o topo de src/cli.js)');
  }
} catch (erro) {
  console.error('Erro:', erro.message);
  process.exit(1);
}
