import fetch from 'node-fetch';

async function processImportedData() {
  const importId = "2025-W40-1759789137950"; // O importId gerado anteriormente
  const processApiUrl = "http://localhost:3000/api/admin/imports/process";

  console.log(`Chamando a API de processamento para importId: ${importId}`);

  try {
    // Simular uma requisição interna, que deve ter acesso à sessão
    // Em um ambiente de produção real, esta API seria chamada via frontend autenticado
    // ou por um serviço backend com credenciais apropriadas.
    // Para simular, vamos usar um fetch simples, mas o middleware de autenticação pode barrar.
    // A melhor forma é usar o frontend para acionar.

    // No entanto, como o objetivo é testar a lógica da API, vamos tentar simular o máximo possível.
    // Se a autenticação for o problema, teremos que ajustar a API para aceitar um token de serviço
    // ou simular a sessão de forma mais robusta.

    const response = await fetch(processApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Em um ambiente de teste/desenvolvimento, podemos simular a sessão
        // mas isso depende de como o NextAuth/IronSession está configurado para aceitar.
        // Por enquanto, vamos tentar sem um cookie explícito, confiando que o tsx
        // pode ter algum contexto ou que a API pode ser chamada sem auth em dev.
      },
      body: JSON.stringify({ importId }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("🎉 Processamento concluído com sucesso!");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error("❌ Erro no processamento:", response.status, response.statusText);
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Erro ao chamar a API de processamento:", error);
  }
}

processImportedData();

