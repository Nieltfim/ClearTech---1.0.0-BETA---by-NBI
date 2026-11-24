const db = require('./db');
const prompt = require('prompt-sync')();
const crypto = require('crypto');
const qrcode = require('qrcode-terminal');

let material_Nome = "";

function RegistrarCodigo_db(codigo, material, quantidade, pontos, local){
    return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO codigos_coleta (codigo, material, quantidade, pontos, local) VALUES (?, ?, ?, ?, ?)'
    db.run(sql, [codigo, material, quantidade, pontos, local], function(err){
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

function GerarCodigo(tamanho){
    return crypto.randomBytes(tamanho).toString('base64').slice(0, tamanho).toUpperCase()
}

function tipoMaterial(){
    console.log("--Matériais Registrados no Sistema--\n1. Metal\n2. Papel\n3. Vidro\n4. Plástico\n5. Orgânico\n6. Madeira\n------------------------------------")
    const material = prompt("Insira o nome do matérial entre os existentes: ").toLowerCase();

    material_Nome = material;

    if((material=="metal")||(material=="1")){
        return 20
    }
    else if((material=="papel")||(material=="2")){
        return 10
    }
    else if((material=="vidro")||(material=="3")){
        return 15
    }
    else if((material=="plastico")||(material=="4")){
        return 15
    }
    else if((material=="organico")||(material=="1")){
        return 5
    }
    else if((material=="metal")||(material=="1")){
        return 10
    }
    else{
        console.log("Insira um matérial válido e tente novamente")
        return "invalido"
    }
}

function purezaMaterial(){
    console.log("--Pureza do matérial para calculo--\n1.0: material correto e limpo\n0.5: material parcialmente contaminado;\n0.0: material inadequado para reciclagem.\n(INSIRA RESPOSTA EM NUMERAL)\n");
    const pureza= parseFloat(prompt("Resposta: "));
    if(pureza>1.0 || pureza<0) return "inadequado";
    if(pureza==0){ 
        console.log("\nMatérial inadequado para reciclagem. Operação Finalizada.");
        return "inadequado"
    };
    return pureza
}

function quantidadeMaterial(){
    console.log("--------------------------")
    const valor_material_kg = parseFloat(prompt("Insira o valor da pesagem do matérial em Kilogramas: "))
    console.log("--------------------------")
    if(valor_material_kg==0){
        console.log("Valor do peso deve ser inserido diferente de 0, tente novamente.")
        return "inválido"
    }
    return valor_material_kg;
}

function gerarQrCode(codigo_i_valor){
    console.log("----------------------------------")
    qrcode.generate(codigo_i_valor, { small: true }, (qr) => {
        console.log(qr);
    })
}


async function MenuPrincipal(){

    let i = true;

    while(i==true){
        console.log("--Sistema de registro de códigos--")
        console.log("1. Gerar código e QrCode \n2. Insira local da agência\n3. Sair\n(INSIRA VALORES EM NUMERAL)")

        let resp = prompt("Resposta: ")
        let local = "";

        console.clear()

        switch(resp.trim()){
            case "1":
                let codigo_i = GerarCodigo(12);

                let Valormaterial = tipoMaterial();
                if(Valormaterial=="invalido") break;

                let quantidade = quantidadeMaterial();
                if(quantidade=="inválido") break;

                let pureza = purezaMaterial();
                if(pureza=="inadequado") break;

                let pontos = (parseFloat(pureza)*parseFloat(quantidade)*parseFloat(Valormaterial));

                gerarQrCode(codigo_i);

                try{
                    const id = await RegistrarCodigo_db(codigo_i, material_Nome, quantidade, pontos, local);
                    console.log(`Registrado no banco de dados com sucesso, usar qrcode ou código: ${codigo_i}!`)
                    console.log("----------------------------------")
                }
                catch (err) {
                    console.error("Falha ao salvar no banco de dados: ", err.message);
                };

                break;
            
            case "2":
                local = prompt("Insira localização da agência: ")
                break;

            case "3":
                db.close();
                console.clear();
                i=false;
                break
        }
    }

}

MenuPrincipal()
