import { StyleSheet, Text, View } from 'react-native';
import { TelaInterna } from '../components/clear/TelaInterna';
import { cores, raio, sombra } from '../constants/clearTheme';

// Texto de exemplo: tenha-o revisado por um profissional jurídico antes de publicar (LGPD).
const SECOES = [
  { titulo: '1. Coleta de Dados', texto: 'Coletamos apenas os dados necessários para o funcionamento da ClearTech, como nome, CPF, telefone e e-mail.' },
  { titulo: '2. Uso das Informações', texto: 'Seus dados são utilizados para autenticação, registro de atividades e concessão de benefícios.' },
  { titulo: '3. Segurança dos Dados', texto: 'Adotamos medidas técnicas e organizacionais para proteger suas informações, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018).' },
  { titulo: '4. Seus Direitos', texto: 'Você pode solicitar a alteração ou a exclusão dos seus dados a qualquer momento.' },
];

export default function Termos() {
  return (
    <TelaInterna titulo="Política de Privacidade" subtitulo="Última atualização: 10 de maio de 2026" voltar>
      <View style={s.card}>
        {SECOES.map((sec) => (
          <View key={sec.titulo} style={{ gap: 4 }}>
            <Text style={s.secao}>{sec.titulo}</Text>
            <Text style={s.texto}>{sec.texto}</Text>
          </View>
        ))}
      </View>
    </TelaInterna>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: cores.branco, borderRadius: raio.g, padding: 18, gap: 18, ...sombra },
  secao: { fontSize: 16, fontWeight: '800', color: cores.texto },
  texto: { fontSize: 14, lineHeight: 22, color: cores.textoSuave },
});
