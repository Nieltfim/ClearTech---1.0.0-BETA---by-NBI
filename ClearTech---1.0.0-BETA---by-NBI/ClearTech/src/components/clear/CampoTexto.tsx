import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, raio } from '../../constants/clearTheme';

type Props = TextInputProps & {
  rotulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  erro?: string;
  senha?: boolean;
};

export function CampoTexto({ rotulo, icone, erro, senha, ...rest }: Props) {
  const [oculto, setOculto] = useState(!!senha);
  const [foco, setFoco] = useState(false);

  return (
    <View style={s.grupo}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <View style={[s.caixa, foco && s.caixaFoco, !!erro && s.caixaErro]}>
        <Ionicons name={icone} size={18} color={cores.textoSuave} />
        <TextInput
          {...rest}
          secureTextEntry={senha && oculto}
          onFocus={(e) => {
            setFoco(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor="#9AA8A0"
          style={s.input}
        />
        {senha && (
          <Pressable onPress={() => setOculto((v) => !v)} hitSlop={10} accessibilityLabel="Mostrar ou ocultar senha">
            <Ionicons name={oculto ? 'eye-outline' : 'eye-off-outline'} size={20} color={cores.textoSuave} />
          </Pressable>
        )}
      </View>
      {!!erro && <Text style={s.erro}>{erro}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  grupo: { gap: 6 },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.texto },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.branco,
  },
  caixaFoco: { borderColor: cores.verdeClaro },
  caixaErro: { borderColor: cores.erro },
  input: { flex: 1, fontSize: 15, color: cores.texto, paddingVertical: 10 },
  erro: { fontSize: 12, color: cores.erro },
});
