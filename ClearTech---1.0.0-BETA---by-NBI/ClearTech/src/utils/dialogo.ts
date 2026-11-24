import { Alert, Platform } from 'react-native';

export type BotaoDialogo = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

/**
 * Alerta que funciona em TODAS as plataformas.
 * No celular usa o Alert nativo. Na web, o Alert do React Native não faz nada,
 * então usamos window.alert / window.confirm.
 */
export function alerta(titulo: string, mensagem?: string, botoes?: BotaoDialogo[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensagem, botoes);
    return;
  }

  const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;

  // Um botão (ou nenhum): só informa e depois executa a ação, se houver
  if (!botoes || botoes.length <= 1) {
    window.alert(texto);
    botoes?.[0]?.onPress?.();
    return;
  }

  // Dois ou mais: confirmar = ação principal, cancelar = botão "cancel"
  const cancelar = botoes.find((b) => b.style === 'cancel');
  const principal = botoes.find((b) => b.style !== 'cancel');
  if (window.confirm(texto)) principal?.onPress?.();
  else cancelar?.onPress?.();
}
