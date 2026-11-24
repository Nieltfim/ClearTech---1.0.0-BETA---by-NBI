import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TelaInterna } from '../components/clear/TelaInterna';
import { cores, raio, sombra } from '../constants/clearTheme';
import { listarAtividades } from '../services/atividades';
import { Atividade } from '../services/tipos';
import { formatarData } from '../utils/formatar';

type Filtro = 'todos' | 'material' | 'resgate';

const FILTROS: { chave: Filtro; rotulo: string }[] = [
  { chave: 'todos', rotulo: 'Todos' },
  { chave: 'material', rotulo: 'Registros de Material' },
  { chave: 'resgate', rotulo: 'Resgates de Benefícios' },
];

export default function Historico() {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [itens, setItens] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Busca no servidor ao abrir a tela e sempre que o filtro mudar. O servidor já devolve só os itens do usuário logado.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      listarAtividades(filtro === 'todos' ? undefined : filtro)
        .then((d) => { if (ativo) { setItens(d); setErro(''); } })
        .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Erro inesperado.'); })
        .finally(() => { if (ativo) setCarregando(false); });
      return () => { ativo = false; };
    }, [filtro]),
  );

  return (
    <TelaInterna
      titulo="Histórico de Atividades"
      subtitulo="Acompanhe seus registros de materiais e resgates de benefícios."
      ativo="pontos"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {FILTROS.map((f) => {
          const on = f.chave === filtro;
          return (
            <Pressable key={f.chave} onPress={() => setFiltro(f.chave)} style={[s.chip, on && s.chipOn]}
              accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[s.chipTexto, on && s.chipTextoOn]}>{f.rotulo}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.lista}>
        {carregando && <ActivityIndicator color={cores.verde} style={{ paddingVertical: 24 }} />}
        {!!erro && <Text style={s.erro}>{erro}</Text>}
        {!carregando && !erro && itens.length === 0 && <Text style={s.vazio}>Nenhuma atividade encontrada.</Text>}
        {itens.map((item, i) => {
          const positivo = item.pontos > 0;
          return (
            <View key={item.id} style={[s.linha, i > 0 && s.linhaBorda]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.descricao}>{item.descricao}</Text>
                <Text style={s.data}>{formatarData(item.data)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[s.pontos, { color: positivo ? cores.verde : cores.vermelho }]}>
                  {positivo ? '+' : ''}{item.pontos}
                </Text>
                <View style={[s.selo, { backgroundColor: positivo ? cores.verdeFundo : '#FDE8E8' }]}>
                  <Text style={[s.seloTexto, { color: positivo ? cores.verde : cores.vermelho }]}>
                    {item.tipo === 'material' ? 'Material' : 'Resgate'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </TelaInterna>
  );
}

const s = StyleSheet.create({
  chips: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 14, minHeight: 38, justifyContent: 'center', borderRadius: raio.pill, backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.borda },
  chipOn: { backgroundColor: cores.verde, borderColor: cores.verde },
  chipTexto: { fontSize: 13, fontWeight: '600', color: cores.texto },
  chipTextoOn: { color: cores.branco },
  lista: { backgroundColor: cores.branco, borderRadius: raio.g, paddingHorizontal: 16, ...sombra },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  linhaBorda: { borderTopWidth: 1, borderTopColor: cores.borda },
  descricao: { fontSize: 14, fontWeight: '600', color: cores.texto },
  data: { fontSize: 12, color: cores.textoSuave },
  pontos: { fontSize: 16, fontWeight: '800' },
  selo: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: raio.pill },
  seloTexto: { fontSize: 11, fontWeight: '700' },
  vazio: { textAlign: 'center', color: cores.textoSuave, paddingVertical: 24 },
  erro: { textAlign: 'center', color: cores.vermelho, paddingVertical: 24 },
});
