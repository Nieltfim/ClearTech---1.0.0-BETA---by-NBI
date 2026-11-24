import { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { TelaInterna } from '../components/clear/TelaInterna';
import { Botao } from '../components/clear/Botao';
import { CampoTexto } from '../components/clear/CampoTexto';
import { cores, raio, sombra } from '../constants/clearTheme';
import { registrarMaterial } from '../services/registros';
import { useAuth } from '../contexts/AuthContext';
import { alerta } from '../utils/dialogo';

// Cantos do "visor" do QR Code
function Canto({ estilo }: { estilo: ViewStyle }) {
  return <View style={[s.canto, estilo]} />;
}

export default function RegistrarMaterial() {
  const { atualizarUsuario } = useAuth();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [enviando, setEnviando] = useState(false);
  const [lido, setLido] = useState(false); // impede processar várias leituras seguidas
  const [manual, setManual] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');

  // Ao voltar para esta tela, libera uma nova leitura
  useFocusEffect(
    useCallback(() => {
      setLido(false);
    }, []),
  );

  async function concluir(cod: string) {
    if (enviando) return;
    setEnviando(true);
    try {
      // O app envia SÓ o código. Peso, material, qualidade e pontos já foram definidos no ponto de coleta.
      const r = await registrarMaterial(cod);
      await atualizarUsuario(); // saldo novo
      router.push({
        pathname: '/registro-sucesso',
        params: { codigo: r.codigo, material: r.material, quantidade: r.quantidade, pontos: r.pontos, local: r.local },
      });
    } catch (e) {
      // 404 inválido · 409 já usado · 410 expirado/cancelado · 403 conta de comprador: a mensagem já vem pronta
      alerta('Não foi possível registrar', e instanceof Error ? e.message : 'Erro inesperado.');
      setTimeout(() => setLido(false), 2000); // evita ler o mesmo QR inválido em loop
    } finally {
      setEnviando(false);
    }
  }

  function aoLer({ data }: { data: string }) {
    if (lido) return;
    setLido(true);
    concluir(data);
  }

  function confirmarManual() {
    if (codigo.trim().length < 4) {
      setErro('Digite um código válido.');
      return;
    }
    setErro('');
    concluir(codigo.trim());
  }

  return (
    <TelaInterna
      titulo="Registrar Material"
      subtitulo="Escaneie o QR Code do ponto de coleta ou do comprovante para registrar seus materiais recicláveis."
      ativo="registrar"
    >
      <View style={s.visor}>
        {permissao?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={lido ? undefined : aoLer}
            />
            <Canto estilo={{ top: 16, left: 16, borderTopWidth: 4, borderLeftWidth: 4 }} />
            <Canto estilo={{ top: 16, right: 16, borderTopWidth: 4, borderRightWidth: 4 }} />
            <Canto estilo={{ bottom: 16, left: 16, borderBottomWidth: 4, borderLeftWidth: 4 }} />
            <Canto estilo={{ bottom: 16, right: 16, borderBottomWidth: 4, borderRightWidth: 4 }} />
          </>
        ) : (
          <View style={s.semCamera}>
            <Ionicons name="qr-code-outline" size={56} color={cores.verdeClaro} />
            <Text style={s.semCameraTexto}>
              {permissao ? 'Precisamos da câmera para ler o QR Code.' : 'Verificando permissão da câmera...'}
            </Text>
            {permissao && (
              <Botao
                titulo={permissao.canAskAgain ? 'Permitir câmera' : 'Abrir configurações'}
                pequeno
                onPress={() => (permissao.canAskAgain ? pedirPermissao() : Linking.openSettings())}
              />
            )}
          </View>
        )}
      </View>
      <Text style={s.legenda}>Aponte a câmera para o QR Code</Text>

      <View style={s.divisor}>
        <View style={s.linha} />
        <Text style={s.ou}>ou</Text>
        <View style={s.linha} />
      </View>

      {manual ? (
        <View style={{ gap: 12 }}>
          <CampoTexto rotulo="Código do registro" icone="keypad-outline" placeholder="Digite o código" value={codigo}
            onChangeText={setCodigo} autoCapitalize="characters" erro={erro} />
          <Botao titulo="Confirmar código" onPress={confirmarManual} carregando={enviando} />
        </View>
      ) : (
        <Botao titulo="Digitar código manualmente" variante="contorno" onPress={() => setManual(true)} />
      )}

      <View style={s.dica}>
        <Ionicons name="bulb-outline" size={20} color={cores.amarelo} />
        <Text style={s.dicaTexto}>
          <Text style={{ fontWeight: '800' }}>Dica: </Text>
          Você também pode registrar o material informando o tipo e o peso, caso não possua um QR Code.
        </Text>
      </View>
    </TelaInterna>
  );
}

const s = StyleSheet.create({
  visor: { height: 280, borderRadius: raio.g, overflow: 'hidden', backgroundColor: cores.verdeFundo, ...sombra },
  canto: { position: 'absolute', width: 36, height: 36, borderColor: cores.verdeClaro, borderRadius: 6 },
  semCamera: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  semCameraTexto: { textAlign: 'center', color: cores.textoSuave, fontSize: 14 },
  legenda: { textAlign: 'center', fontSize: 13, color: cores.textoSuave },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linha: { flex: 1, height: 1, backgroundColor: cores.borda },
  ou: { fontSize: 13, color: cores.textoSuave },
  dica: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#FFF8E1', borderRadius: raio.m, padding: 12 },
  dicaTexto: { flex: 1, fontSize: 13, lineHeight: 19, color: cores.texto },
});
