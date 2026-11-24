import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TelaInterna } from '../components/clear/TelaInterna';
import { Botao } from '../components/clear/Botao';
import { CampoTexto } from '../components/clear/CampoTexto';
import { cores, raio, sombra } from '../constants/clearTheme';
import { alerta } from '../utils/dialogo';
import { CATEGORIAS } from '../constants/dados';
import { listarLojas, resgatarLoja } from '../services/beneficios';
import { Loja } from '../services/tipos';
import { useAuth } from '../contexts/AuthContext';

// Remove acentos e maiúsculas para a busca ignorar "Alimentação" vs "alimentacao"
const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Beneficios() {
  const { usuario, atualizarUsuario } = useAuth();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const saldo = usuario?.pontos ?? 0;

  // Ao abrir a tela: carrega os benefícios e atualiza o saldo no servidor.
  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      listarLojas()
        .then(setLojas)
        .catch((e) => alerta('Erro', e instanceof Error ? e.message : 'Erro inesperado.'))
        .finally(() => setCarregando(false));
      atualizarUsuario();
    }, [atualizarUsuario]),
  );

  const lista = lojas.filter(
    (l) => (categoria === 'Todos' || l.categoria === categoria) && normalizar(l.nome).includes(normalizar(busca)),
  );

  function resgatar(loja: Loja) {
    // A conferência de saldo na tela é só conveniência; quem decide é o servidor.
    alerta(`Resgatar ${loja.nome}?`, `Serão usados ${loja.pontos} pontos para um cashback de ${loja.cashback}.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            const r = await resgatarLoja(loja.id);
            await atualizarUsuario(); // saldo novo na tela
            alerta('Resgate realizado', `Cashback ${r.loja} solicitado. Saldo atual: ${r.saldoAtual} pontos.`);
          } catch (e) {
            alerta('Não foi possível resgatar', e instanceof Error ? e.message : 'Erro inesperado.');
          }
        },
      },
    ]);
  }

  return (
    <TelaInterna titulo="Resgatar Benefícios" subtitulo="Troque seus pontos por cashbacks em lojas parceiras." ativo="beneficios">
      <View style={s.saldo}>
        <Ionicons name="leaf" size={18} color={cores.verdeClaro} />
        <Text style={s.saldoTexto}>Seu saldo: <Text style={s.saldoValor}>{saldo} pontos</Text></Text>
      </View>

      <CampoTexto rotulo="Buscar" icone="search-outline" placeholder="Buscar loja parceira..." value={busca} onChangeText={setBusca} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {CATEGORIAS.map((c) => {
          const on = c === categoria;
          return (
            <Pressable key={c} onPress={() => setCategoria(c)} style={[s.chip, on && s.chipOn]} accessibilityRole="button">
              <Text style={[s.chipTexto, on && s.chipTextoOn]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {carregando && <ActivityIndicator color={cores.verde} style={{ paddingVertical: 24 }} />}
      {!carregando && lista.length === 0 && <Text style={s.vazio}>Nenhum parceiro encontrado.</Text>}

      <View style={s.grade}>
        {lista.map((loja) => (
          <View key={loja.id} style={s.card}>
            <View style={[s.logo, { backgroundColor: loja.cor }]}>
              <Text style={s.logoTexto}>{loja.sigla}</Text>
            </View>
            <Text style={s.nome}>{loja.nome}</Text>
            <Text style={s.cashback}>Cashback de {loja.cashback}</Text>
            <Text style={s.pontos}>{loja.pontos} pontos</Text>
            <Botao titulo="Resgatar" pequeno onPress={() => resgatar(loja)} estilo={{ alignSelf: 'stretch' }} />
          </View>
        ))}
      </View>
    </TelaInterna>
  );
}

const s = StyleSheet.create({
  saldo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: cores.verdeFundo, borderRadius: raio.m, padding: 12 },
  saldoTexto: { fontSize: 14, color: cores.texto },
  saldoValor: { fontWeight: '800', color: cores.verde },
  chips: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 14, minHeight: 36, justifyContent: 'center', borderRadius: raio.pill, backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.borda },
  chipOn: { backgroundColor: cores.verde, borderColor: cores.verde },
  chipTexto: { fontSize: 13, fontWeight: '600', color: cores.texto },
  chipTextoOn: { color: cores.branco },
  vazio: { textAlign: 'center', color: cores.textoSuave, paddingVertical: 24 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', backgroundColor: cores.branco, borderRadius: raio.g, padding: 14, gap: 4, alignItems: 'center', ...sombra },
  logo: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logoTexto: { color: cores.branco, fontWeight: '800', fontSize: 18 },
  nome: { fontSize: 15, fontWeight: '800', color: cores.texto },
  cashback: { fontSize: 12, color: cores.textoSuave },
  pontos: { fontSize: 13, fontWeight: '700', color: cores.verde, marginBottom: 8 },
});
