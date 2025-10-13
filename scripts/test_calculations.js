// Teste de cálculos baseado na imagem do Eliseu

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
};

console.log('\n🧮 TESTE DE CÁLCULOS - Eliseu da Silva Lauback\n');
console.log('═══════════════════════════════════════════════\n');

// Dados da imagem
const ganhosTotal = 267.80;
const ivaPercent = 0.06; // 6%
const taxaBasePercent = 0.07; // 7%
const jurosPercent = 0.04; // 4% (do financiamento)

console.log('📊 VALORES BRUTOS:');
console.log(`   Ganhos totais: ${formatCurrency(ganhosTotal)}`);
console.log('');

// Passo 1: IVA
const ivaValor = ganhosTotal * ivaPercent;
console.log('🔹 PASSO 1 - IVA (6%):');
console.log(`   ${formatCurrency(ganhosTotal)} × 6% = ${formatCurrency(ivaValor)}`);
console.log('');

// Passo 2: Ganhos após IVA
const ganhosMenosIVA = ganhosTotal - ivaValor;
console.log('🔹 PASSO 2 - Ganhos após IVA:');
console.log(`   ${formatCurrency(ganhosTotal)} - ${formatCurrency(ivaValor)} = ${formatCurrency(ganhosMenosIVA)}`);
console.log('');

// Passo 3: Taxa administrativa base (7%)
const despesasBase = ganhosMenosIVA * taxaBasePercent;
console.log('🔹 PASSO 3 - Taxa administrativa base (7%):');
console.log(`   ${formatCurrency(ganhosMenosIVA)} × 7% = ${formatCurrency(despesasBase)}`);
console.log('');

// Passo 4: Juros do financiamento (4%)
const despesasJuros = ganhosMenosIVA * jurosPercent;
console.log('🔹 PASSO 4 - Juros do financiamento (4%):');
console.log(`   ${formatCurrency(ganhosMenosIVA)} × 4% = ${formatCurrency(despesasJuros)}`);
console.log('');

// Passo 5: Total despesas administrativas
const despesasAdmTotal = despesasBase + despesasJuros;
const taxaTotalPercent = taxaBasePercent + jurosPercent;
console.log('🔹 PASSO 5 - Total Despesas Administrativas:');
console.log(`   ${formatCurrency(despesasBase)} + ${formatCurrency(despesasJuros)} = ${formatCurrency(despesasAdmTotal)}`);
console.log(`   (equivalente a ${(taxaTotalPercent * 100).toFixed(0)}% de ${formatCurrency(ganhosMenosIVA)})`);
console.log('');

// Comparação com valor da imagem
const despesasAdmImagem = 80.19;
console.log('⚠️  COMPARAÇÃO:');
console.log(`   ✅ Valor CORRETO calculado: ${formatCurrency(despesasAdmTotal)}`);
console.log(`   ❌ Valor ERRADO na imagem: ${formatCurrency(despesasAdmImagem)}`);
console.log(`   📊 Diferença: ${formatCurrency(despesasAdmImagem - despesasAdmTotal)}`);
console.log('');

console.log('═══════════════════════════════════════════════\n');
console.log('💡 EXPLICAÇÃO DO ERRO:\n');
console.log('   O sistema ESTAVA somando a PARCELA DO FINANCIAMENTO');
console.log('   nas despesas administrativas, quando deveria somar');
console.log('   apenas os JUROS (percentual).\n');
console.log('   ✅ CORRETO: Desp.Adm = 7% + 4% juros = 11% sobre ganhos pós-IVA');
console.log('   ❌ ERRADO:  Desp.Adm = 7% + 4% juros + parcela do empréstimo');
console.log('');

// Exemplo completo
console.log('═══════════════════════════════════════════════\n');
console.log('📋 RESUMO COMPLETO (valores corretos):\n');

const combustivel = 0;
const viaverde = 0;
const aluguel = 0;
const parcelaFinanciamento = 0; // Vamos assumir que não tem parcela, só juros

const liquidoFinal = ganhosMenosIVA - despesasAdmTotal - combustivel - viaverde - aluguel - parcelaFinanciamento;

console.log(`   Ganhos totais:       ${formatCurrency(ganhosTotal)}`);
console.log(`   IVA (6%):           -${formatCurrency(ivaValor)}`);
console.log(`   ────────────────────────────`);
console.log(`   Após IVA:            ${formatCurrency(ganhosMenosIVA)}`);
console.log('');
console.log(`   Taxa base (7%):     -${formatCurrency(despesasBase)}`);
console.log(`   Juros (4%):         -${formatCurrency(despesasJuros)}`);
console.log(`   ────────────────────────────`);
console.log(`   Desp.Adm total:     -${formatCurrency(despesasAdmTotal)}`);
console.log('');
console.log(`   Combustível:        -${formatCurrency(combustivel)}`);
console.log(`   Via Verde:          -${formatCurrency(viaverde)}`);
console.log(`   Aluguel:            -${formatCurrency(aluguel)}`);
console.log(`   Financ. (parcela):  -${formatCurrency(parcelaFinanciamento)}`);
console.log(`   ════════════════════════════`);
console.log(`   💰 LÍQUIDO FINAL:    ${formatCurrency(liquidoFinal)}`);
console.log('');
