#!/bin/bash

# =============================================================================
# Conduz PT - Setup Script
# =============================================================================

set -e

echo "🚀 Iniciando setup do Conduz PT..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

echo "📦 Instalando dependências..."
yarn install

echo ""
echo "🔧 Configurando variáveis de ambiente..."

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado${NC}"
    echo "Copiando .env.local.example para .env.local..."
    cp .env.local.example .env.local
    echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite .env.local com suas credenciais reais${NC}"
else
    echo -e "${GREEN}✅ Arquivo .env.local já existe${NC}"
fi

echo ""
echo "🔐 Verificando Firebase..."

if [ ! -f "firebase-service-account.json" ]; then
    echo -e "${YELLOW}⚠️  Arquivo firebase-service-account.json não encontrado${NC}"
    echo "Você precisa:"
    echo "1. Acessar Firebase Console"
    echo "2. Project Settings > Service Accounts"
    echo "3. Generate New Private Key"
    echo "4. Salvar como firebase-service-account.json na raiz do projeto"
else
    echo -e "${GREEN}✅ Arquivo firebase-service-account.json encontrado${NC}"
fi

echo ""
echo "🔍 Verificando TypeScript..."
yarn typecheck

echo ""
echo "🏗️  Testando build..."
yarn build

echo ""
echo -e "${GREEN}✅ Setup concluído com sucesso!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "1. Edite .env.local com suas credenciais"
echo "2. Configure firebase-service-account.json"
echo "3. Execute: yarn dev"
echo ""
echo "🎉 Pronto para começar!"
