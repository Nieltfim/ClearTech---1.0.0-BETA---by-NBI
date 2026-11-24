export const soDigitos = (v: string) => v.replace(/\D/g, '');

export function mascaraCPF(valor: string) {
  const d = soDigitos(valor).slice(0, 11);
  let r = d.slice(0, 3);
  if (d.length > 3) r += '.' + d.slice(3, 6);
  if (d.length > 6) r += '.' + d.slice(6, 9);
  if (d.length > 9) r += '-' + d.slice(9, 11);
  return r;
}

export function mascaraTelefone(valor: string) {
  const d = soDigitos(valor).slice(0, 11);
  let r = '';
  if (d.length > 0) r = '(' + d.slice(0, 2);
  if (d.length > 2) r += ') ' + d.slice(2, 7);
  if (d.length > 7) r += '-' + d.slice(7, 11);
  return r;
}

export function cpfValido(cpf: string) {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (base: number) => {
    let soma = 0;
    for (let i = 0; i < base; i++) soma += Number(d[i]) * (base + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}
