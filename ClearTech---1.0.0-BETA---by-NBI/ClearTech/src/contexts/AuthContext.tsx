import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth';
import { registrarAoSessaoInvalida } from '../services/api';
import { buscarPerfil } from '../services/perfil';
import { apagarToken } from '../services/tokenStorage';
import { DadosCadastro, Usuario } from '../services/tipos';

type AuthCtx = {
  /** Quem está logado (null = ninguém). */
  usuario: Usuario | null;
  /** true enquanto o app verifica, na abertura, se já existe um login salvo. */
  carregando: boolean;
  entrar: (identificador: string, senha: string) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => Promise<void>;
  /** Rebusca o usuário no servidor (ex.: para atualizar os pontos). */
  atualizarUsuario: () => Promise<void>;
  definirUsuario: (u: Usuario) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // 1) Na abertura do app: há token salvo? Ele ainda vale? Então já entra logado.
  useEffect(() => {
    let ativo = true;
    authService
      .carregarUsuarioSalvo()
      .then((u) => ativo && setUsuario(u))
      .catch(() => {})
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  // 2) Se QUALQUER chamada receber 401, desloga automaticamente.
  useEffect(() => {
    registrarAoSessaoInvalida(() => {
      apagarToken().finally(() => setUsuario(null));
    });
    return () => registrarAoSessaoInvalida(null);
  }, []);

  const entrar = useCallback(async (identificador: string, senha: string) => {
    setUsuario(await authService.login(identificador, senha));
  }, []);

  const cadastrar = useCallback(async (dados: DadosCadastro) => {
    setUsuario(await authService.cadastrar(dados));
  }, []);

  const sair = useCallback(async () => {
    await authService.sair();
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback(async () => {
    try {
      setUsuario(await buscarPerfil());
    } catch {
      // erro de rede: mantém os dados que já temos
    }
  }, []);

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, cadastrar, sair, atualizarUsuario, definirUsuario: setUsuario }),
    [usuario, carregando, entrar, cadastrar, sair, atualizarUsuario],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return c;
}
