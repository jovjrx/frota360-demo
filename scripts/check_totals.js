/**
 * Script para verificar os cálculos dos totais
 */

// Valores mostrados na tela
const despesasAdm = 232.82;
const alugueis = 290.00;
const financiamento = 93.50;

console.log('📊 Valores mostrados nos cards:');
console.log('Despesas Adm:', despesasAdm.toFixed(2));
console.log('Aluguéis:', alugueis.toFixed(2));
console.log('Financiamento:', financiamento.toFixed(2));
console.log('');

console.log('➕ Soma simples:');
const somaSimples = despesasAdm + alugueis + financiamento;
console.log(`${despesasAdm} + ${alugueis} + ${financiamento} = ${somaSimples.toFixed(2)}`);
console.log('');

// Se despesasAdm JÁ inclui o financiamento
console.log('🔍 Se despesasAdm JÁ inclui parcelas de financiamento:');
const despesasAdmSemParcelas = despesasAdm - financiamento;
console.log(`despesasAdm - financiamento = ${despesasAdm} - ${financiamento} = ${despesasAdmSemParcelas.toFixed(2)}`);
console.log('');

// Cálculo do 7% base
console.log('💡 Cálculo estimado:');
const entradas = 1603.74; // valor mostrado
const base7percent = entradas * 0.07;
console.log(`7% de ${entradas} = ${base7percent.toFixed(2)}`);

const jurosEstimado = despesasAdm - base7percent;
console.log(`Juros estimado = ${despesasAdm} - ${base7percent.toFixed(2)} = ${jurosEstimado.toFixed(2)}`);
console.log('');

console.log('✅ Conclusão:');
console.log('Se despesasAdm (232,82) = 7% base (112,26) + juros (120,56)');
console.log('Então as parcelas (93,50) são mostradas separadamente');
console.log('E o backend NÃO está incluindo parcelas no despesasAdm');
console.log('Ou há um bug no backend!');
