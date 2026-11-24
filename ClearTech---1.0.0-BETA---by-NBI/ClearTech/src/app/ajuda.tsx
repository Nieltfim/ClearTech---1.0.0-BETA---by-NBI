import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TelaInterna } from '../components/clear/TelaInterna';
import { CampoTexto } from '../components/clear/CampoTexto';
import { cores, raio, sombra } from '../constants/clearTheme';
import { FAQ } from '../constants/dados';

const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Ajuda() {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<string | null>(null); // id da pergunta aberta

  const lista = FAQ.filter((f) => normalizar(f.pergunta).includes(normalizar(busca)));

  return (
    <TelaInterna titulo="Central de Ajuda" subtitulo="Encontre respostas para suas dúvidas." ativo="perfil" voltar>
      <CampoTexto rotulo="Buscar" icone="search-outline" placeholder="Buscar dúvida..." value={busca} onChangeText={setBusca} />

      <View style={s.lista}>
        {lista.length === 0 && <Text style={s.vazio}>Nenhuma dúvida encontrada.</Text>}
        {lista.map((item, i) => {
          const aberta = aberto === item.id;
          return (
            <View key={item.id} style={i > 0 && s.borda}>
              <Pressable style={s.pergunta} onPress={() => setAberto(aberta ? null : item.id)}
                accessibilityRole="button" accessibilityState={{ expanded: aberta }}>
                <Text style={s.perguntaTexto}>{item.pergunta}</Text>
                <Ionicons name={aberta ? 'chevron-up' : 'chevron-down'} size={18} color={cores.textoSuave} />
              </Pressable>
              {aberta && <Text style={s.resposta}>{item.resposta}</Text>}
            </View>
          );
        })}
      </View>
    </TelaInterna>
  );
}

const s = StyleSheet.create({
  lista: { backgroundColor: cores.branco, borderRadius: raio.g, paddingHorizontal: 16, ...sombra },
  borda: { borderTopWidth: 1, borderTopColor: cores.borda },
  pergunta: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 12 },
  perguntaTexto: { flex: 1, fontSize: 15, fontWeight: '600', color: cores.texto },
  resposta: { fontSize: 14, lineHeight: 21, color: cores.textoSuave, paddingBottom: 14 },
  vazio: { textAlign: 'center', color: cores.textoSuave, paddingVertical: 24 },
});
