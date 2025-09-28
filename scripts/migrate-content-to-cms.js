const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
try {
  const serviceAccount = require('../firebase-service-account.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  console.log('⚠️  Using mock Firebase for migration (development mode)');
  // Mock Firebase for development
  const mockDb = {
    collection: (name) => ({
      add: async (data) => {
        console.log(`📝 Would add to ${name}:`, data);
        return { id: `mock_${Date.now()}` };
      }
    })
  };
  global.mockFirestore = mockDb;
}

const db = global.mockFirestore || getFirestore();

// Content migration data
const contentData = {
  home: {
    pt: {
      'hero.title': 'Mais do que conduzir, você faz a estrada acontecer!',
      'hero.subtitle': 'Gestão 360º para motoristas, frotas e empresas — Plataforma certa, apoio real, ganhos garantidos.',
      'hero.description': 'A Conduz.pt é o braço TVDE da Alvorada Magistral. Oferecemos soluções completas para motoristas, empresas e gestores de frota com tecnologia avançada e suporte humano.',
      'hero.ctaPrimary': 'Cadastrar como Motorista',
      'hero.ctaSecondary': 'Entrar em contacto',
      'hero.badge': 'TVDE PORTUGAL',
      'hero.highlight.title': 'Porquê a Conduz?',
      'hero.highlight.description': 'Onboarding em dias, não semanas. Suporte humano e resolutivo. Tecnologia que reduz custos e burocracia. Compliance TVDE garantido.',
      'howItWorks.title': 'Como funciona',
      'howItWorks.subtitle': '3 passos simples para começar',
      'howItWorks.feature': 'PROCESSO',
      'segments.title': 'Soluções para todos',
      'segments.subtitle': 'Ofertas por segmento',
      'segments.feature': 'SEGMENTOS',
      'segments.drivers.title': 'Para Motoristas',
      'segments.drivers.description': 'Benefícios, comissões transparentes, carro próprio ou alugado',
      'segments.drivers.cta': 'Seja motorista',
      'segments.companies.title': 'Para Empresas',
      'segments.companies.description': 'Faturação mensal, centros de custo, relatórios',
      'segments.companies.cta': 'Pedir proposta',
      'metrics.title': 'Os Nossos Números',
      'metrics.subtitle': 'Indicadores que comprovam a nossa eficiência',
      'metrics.feature': 'RESULTADOS',
      'cta.title': 'Pronto para Começar a Faturar?',
      'cta.subtitle': 'Junte-se aos motoristas que já escolheram a Conduz',
      'cta.button': 'Começar agora',
      'cta.feature': 'PRÓXIMO PASSO'
    },
    en: {
      'hero.title': 'More than driving, you make the road happen!',
      'hero.subtitle': '360º management for drivers, fleets and companies — Right platform, real support, guaranteed earnings.',
      'hero.description': 'Conduz.pt is the TVDE arm of Alvorada Magistral. We offer complete solutions for drivers, companies and fleet managers with advanced technology and human support.',
      'hero.ctaPrimary': 'Register as Driver',
      'hero.ctaSecondary': 'Get in touch',
      'hero.badge': 'TVDE PORTUGAL',
      'hero.highlight.title': 'Why Conduz?',
      'hero.highlight.description': 'Onboarding in days, not weeks. Human and effective support. Technology that reduces costs and bureaucracy. Guaranteed TVDE compliance.',
      'howItWorks.title': 'How it works',
      'howItWorks.subtitle': '3 simple steps to start',
      'howItWorks.feature': 'PROCESS',
      'segments.title': 'Solutions for everyone',
      'segments.subtitle': 'Offers by segment',
      'segments.feature': 'SEGMENTS',
      'segments.drivers.title': 'For Drivers',
      'segments.drivers.description': 'Benefits, transparent commissions, own or rented car',
      'segments.drivers.cta': 'Be a driver',
      'segments.companies.title': 'For Companies',
      'segments.companies.description': 'Monthly billing, cost centers, reports',
      'segments.companies.cta': 'Request proposal',
      'metrics.title': 'Our Numbers',
      'metrics.subtitle': 'Indicators that prove our efficiency',
      'metrics.feature': 'RESULTS',
      'cta.title': 'Ready to Start Earning?',
      'cta.subtitle': 'Join the drivers who have already chosen Conduz',
      'cta.button': 'Start now',
      'cta.feature': 'NEXT STEP'
    }
  },
  about: {
    pt: {
      'mission.title': 'A Nossa Missão',
      'mission.subtitle': 'Simplificar o TVDE em Portugal com tecnologia avançada, suporte humano e compliance garantido',
      'mission.feature': 'MISSÃO',
      'mission.card.title': 'Visão e Valores',
      'mission.card.description': 'Construindo o futuro da mobilidade TVDE',
      'mission.card.content': 'A Conduz.pt nasceu para simplificar o TVDE em Portugal. Somos o braço de mobilidade da Alvorada Magistral, combinando mais de 30 anos de experiência em gestão com tecnologia de ponta para oferecer soluções completas para motoristas, empresas e gestores de frota.',
      'approach.title': 'A Nossa Abordagem',
      'approach.subtitle': 'Metodologia testada para resultados excepcionais no TVDE',
      'approach.feature': 'ABORDAGEM',
      'experience.title': 'A Nossa Experiência',
      'experience.subtitle': 'Números que comprovam a nossa eficiência e dedicação',
      'experience.feature': 'EXPERIÊNCIA',
      'experience.card.title': 'História de Sucesso',
      'experience.card.description': 'Da gestão empresarial ao TVDE de excelência',
      'experience.card.content': 'A Alvorada Magistral atua há mais de 30 anos em gestão empresarial em Portugal, Itália, Espanha e outros países. A Conduz.pt representa a nossa entrada no mercado TVDE, trazendo toda esta experiência para revolucionar a mobilidade portuguesa.',
      'team.title': 'A Nossa Equipa',
      'team.subtitle': 'Profissionais dedicados ao sucesso dos nossos motoristas e parceiros',
      'team.feature': 'EQUIPA',
      'cta.title': 'Pronto para Fazer Parte da Conduz?',
      'cta.subtitle': 'Junte-se a nós e descubra como podemos simplificar o seu TVDE',
      'cta.feature': 'PRÓXIMO PASSO',
      'cta.button': 'Contactar Agora'
    },
    en: {
      'mission.title': 'Our Mission',
      'mission.subtitle': 'Simplify TVDE in Portugal with advanced technology, human support and guaranteed compliance',
      'mission.feature': 'MISSION',
      'mission.card.title': 'Vision and Values',
      'mission.card.description': 'Building the future of TVDE mobility',
      'mission.card.content': 'Conduz.pt was born to simplify TVDE in Portugal. We are the mobility arm of Alvorada Magistral, combining more than 30 years of management experience with cutting-edge technology to offer complete solutions for drivers, companies and fleet managers.',
      'approach.title': 'Our Approach',
      'approach.subtitle': 'Tested methodology for exceptional TVDE results',
      'approach.feature': 'APPROACH',
      'experience.title': 'Our Experience',
      'experience.subtitle': 'Numbers that prove our efficiency and dedication',
      'experience.feature': 'EXPERIENCE',
      'experience.card.title': 'Success Story',
      'experience.card.description': 'From business management to TVDE excellence',
      'experience.card.content': 'Alvorada Magistral has been operating for more than 30 years in business management in Portugal, Italy, Spain and other countries. Conduz.pt represents our entry into the TVDE market, bringing all this experience to revolutionize Portuguese mobility.',
      'team.title': 'Our Team',
      'team.subtitle': 'Professionals dedicated to the success of our drivers and partners',
      'team.feature': 'TEAM',
      'cta.title': 'Ready to Be Part of Conduz?',
      'cta.subtitle': 'Join us and discover how we can simplify your TVDE',
      'cta.feature': 'NEXT STEP',
      'cta.button': 'Contact Now'
    }
  },
  contact: {
    pt: {
      'hero.title': 'Fale com a Conduz.pt',
      'hero.subtitle': 'Tire dúvidas, cadastre-se ou solicite uma proposta',
      'hero.feature': 'CONTACTO',
      'form.title': 'Formulário de Contato',
      'form.subtitle': 'Preencha os dados para ser motorista ou empresa parceira',
      'form.feature': 'FORMULÁRIO',
      'form.description': 'Preencha o formulário abaixo e nossa equipa entrará em contacto em até 24h.',
      'form.fields.name': 'Nome Completo',
      'form.fields.namePlaceholder': 'Digite seu nome completo',
      'form.fields.email': 'Email',
      'form.fields.emailPlaceholder': 'seu@email.com',
      'form.fields.phone': 'Telefone',
      'form.fields.phonePlaceholder': 'Seu número de telefone',
      'form.fields.interest': 'Tipo de Interesse',
      'form.fields.interestPlaceholder': 'Selecione uma opção',
      'form.fields.message': 'Mensagem',
      'form.fields.messagePlaceholder': 'Descreva a sua dúvida ou solicitação',
      'form.submit.button': 'Enviar mensagem',
      'form.submit.loading': 'Enviando...',
      'form.success.title': 'Mensagem enviada!',
      'form.success.description': 'Obrigado por entrar em contacto. Em breve retornaremos.',
      'form.error.title': 'Erro ao enviar',
      'form.error.description': 'Ocorreu um problema. Tente novamente ou use outro canal.',
      'form.privacy': 'Ao enviar este formulário, concorda com nossa política de privacidade.',
      'location.title': 'Nossa Localização',
      'location.description': 'Será um prazer atendê-lo',
      'location.directEmail': 'Se preferir',
      'location.directEmailDescription': 'Envie-nos um email diretamente para discussões detalhadas sobre projetos e parcerias.',
      'location.phone': 'Por telefone',
      'location.phoneDescription': 'Fale conosco via WhatsApp para respostas rápidas e suporte imediato.'
    },
    en: {
      'hero.title': 'Talk to Conduz.pt',
      'hero.subtitle': 'Ask questions, register or request a proposal',
      'hero.feature': 'CONTACT',
      'form.title': 'Contact Form',
      'form.subtitle': 'Fill in the data to be a driver or partner company',
      'form.feature': 'FORM',
      'form.description': 'Fill out the form below and our team will contact you within 24 hours.',
      'form.fields.name': 'Full Name',
      'form.fields.namePlaceholder': 'Enter your full name',
      'form.fields.email': 'Email',
      'form.fields.emailPlaceholder': 'your@email.com',
      'form.fields.phone': 'Phone',
      'form.fields.phonePlaceholder': 'Your phone number',
      'form.fields.interest': 'Type of Interest',
      'form.fields.interestPlaceholder': 'Select an option',
      'form.fields.message': 'Message',
      'form.fields.messagePlaceholder': 'Describe your question or request',
      'form.submit.button': 'Send message',
      'form.submit.loading': 'Sending...',
      'form.success.title': 'Message sent!',
      'form.success.description': 'Thank you for contacting us. We will return soon.',
      'form.error.title': 'Error sending',
      'form.error.description': 'A problem occurred. Try again or use another channel.',
      'form.privacy': 'By submitting this form, you agree to our privacy policy.',
      'location.title': 'Our Location',
      'location.description': 'It will be a pleasure to serve you',
      'location.directEmail': 'If you prefer',
      'location.directEmailDescription': 'Send us an email directly for detailed discussions about projects and partnerships.',
      'location.phone': 'By phone',
      'location.phoneDescription': 'Talk to us via WhatsApp for quick responses and immediate support.'
    }
  },
  'services-drivers': {
    pt: {
      'hero.title': 'Seja Motorista TVDE',
      'hero.subtitle': 'Comece a faturar em dias, não semanas. Onboarding rápido, suporte 7/7 e tecnologia que simplifica.',
      'hero.badge': 'PARA MOTORISTAS',
      'hero.cta.primary': 'Quero ser Motorista',
      'hero.cta.secondary': 'Saber Mais',
      'benefits.title': 'Porquê Escolher a Conduz?',
      'benefits.subtitle': 'Vantagens exclusivas para motoristas TVDE em Portugal',
      'benefits.feature': 'VANTAGENS',
      'benefits.card.title': 'Benefícios Únicos',
      'benefits.card.description': 'Tudo o que precisa para ter sucesso no TVDE',
      'benefits.card.content': 'A Conduz.pt oferece o melhor pacote para motoristas TVDE em Portugal. Desde o onboarding rápido até ao suporte contínuo, garantimos que tem tudo para maximizar os seus ganhos.',
      'services.title': 'Os Nossos Serviços',
      'services.subtitle': 'Tudo incluído para o seu sucesso como motorista TVDE',
      'services.feature': 'SERVIÇOS',
      'process.title': 'Como Funciona',
      'process.subtitle': '3 passos simples para começar a faturar',
      'process.feature': 'PROCESSO',
      'pricing.title': 'Planos e Comissões',
      'pricing.subtitle': 'Transparência total nos custos e comissões',
      'pricing.feature': 'PREÇOS',
      'support.title': 'Suporte Sempre Disponível',
      'support.subtitle': 'Equipa dedicada para o seu sucesso',
      'support.feature': 'SUPORTE',
      'cta.title': 'Pronto para Começar a Faturar?',
      'cta.subtitle': 'Junte-se aos motoristas que já escolheram a Conduz',
      'cta.feature': 'PRÓXIMO PASSO',
      'cta.button': 'Quero ser Motorista'
    },
    en: {
      'hero.title': 'Be a TVDE Driver',
      'hero.subtitle': 'Start earning in days, not weeks. Fast onboarding, 7/7 support and technology that simplifies.',
      'hero.badge': 'FOR DRIVERS',
      'hero.cta.primary': 'I want to be a Driver',
      'hero.cta.secondary': 'Learn More',
      'benefits.title': 'Why Choose Conduz?',
      'benefits.subtitle': 'Exclusive advantages for TVDE drivers in Portugal',
      'benefits.feature': 'ADVANTAGES',
      'benefits.card.title': 'Unique Benefits',
      'benefits.card.description': 'Everything you need to succeed in TVDE',
      'benefits.card.content': 'Conduz.pt offers the best package for TVDE drivers in Portugal. From fast onboarding to continuous support, we guarantee you have everything to maximize your earnings.',
      'services.title': 'Our Services',
      'services.subtitle': 'Everything included for your success as a TVDE driver',
      'services.feature': 'SERVICES',
      'process.title': 'How it Works',
      'process.subtitle': '3 simple steps to start earning',
      'process.feature': 'PROCESS',
      'pricing.title': 'Plans and Commissions',
      'pricing.subtitle': 'Total transparency in costs and commissions',
      'pricing.feature': 'PRICES',
      'support.title': 'Always Available Support',
      'support.subtitle': 'Dedicated team for your success',
      'support.feature': 'SUPPORT',
      'cta.title': 'Ready to Start Earning?',
      'cta.subtitle': 'Join the drivers who have already chosen Conduz',
      'cta.feature': 'NEXT STEP',
      'cta.button': 'I want to be a Driver'
    }
  },
  'services-companies': {
    pt: {
      'hero.title': 'Soluções para Empresas',
      'hero.subtitle': 'Gestão completa de mobilidade corporativa com faturação mensal, centros de custo e relatórios detalhados.',
      'hero.badge': 'PARA EMPRESAS',
      'hero.cta.primary': 'Pedir Proposta',
      'hero.cta.secondary': 'Marcar Demo',
      'benefits.title': 'Vantagens Empresariais',
      'benefits.subtitle': 'Soluções B2B especializadas para a sua empresa',
      'benefits.feature': 'VANTAGENS',
      'benefits.card.title': 'Gestão Corporativa',
      'benefits.card.description': 'Controlo total da mobilidade da sua empresa',
      'benefits.card.content': 'A Conduz.pt oferece soluções empresariais completas para gestão de mobilidade corporativa, com faturação centralizada, controlo de custos e relatórios detalhados.',
      'services.title': 'Serviços Empresariais',
      'services.subtitle': 'Soluções completas para gestão de mobilidade corporativa',
      'services.feature': 'SERVIÇOS',
      'process.title': 'Implementação Empresarial',
      'process.subtitle': 'Processo estruturado para implementação nas empresas',
      'process.feature': 'IMPLEMENTAÇÃO',
      'pricing.title': 'Planos Empresariais',
      'pricing.subtitle': 'Soluções escaláveis para empresas de todos os tamanhos',
      'pricing.feature': 'PLANOS',
      'support.title': 'Suporte Empresarial',
      'support.subtitle': 'Equipa B2B dedicada ao sucesso da sua empresa',
      'support.feature': 'SUPORTE',
      'cta.title': 'Pronto para Otimizar a Mobilidade da Sua Empresa?',
      'cta.subtitle': 'Vamos conversar sobre as suas necessidades específicas',
      'cta.feature': 'PRÓXIMO PASSO',
      'cta.button': 'Pedir Proposta'
    },
    en: {
      'hero.title': 'Solutions for Companies',
      'hero.subtitle': 'Complete corporate mobility management with monthly billing, cost centers and detailed reports.',
      'hero.badge': 'FOR COMPANIES',
      'hero.cta.primary': 'Request Proposal',
      'hero.cta.secondary': 'Schedule Demo',
      'benefits.title': 'Business Advantages',
      'benefits.subtitle': 'Specialized B2B solutions for your company',
      'benefits.feature': 'ADVANTAGES',
      'benefits.card.title': 'Corporate Management',
      'benefits.card.description': 'Total control of your company\'s mobility',
      'benefits.card.content': 'Conduz.pt offers complete business solutions for corporate mobility management, with centralized billing, cost control and detailed reports.',
      'services.title': 'Business Services',
      'services.subtitle': 'Complete solutions for corporate mobility management',
      'services.feature': 'SERVICES',
      'process.title': 'Business Implementation',
      'process.subtitle': 'Structured process for company implementation',
      'process.feature': 'IMPLEMENTATION',
      'pricing.title': 'Business Plans',
      'pricing.subtitle': 'Scalable solutions for companies of all sizes',
      'pricing.feature': 'PLANS',
      'support.title': 'Business Support',
      'support.subtitle': 'B2B team dedicated to your company\'s success',
      'support.feature': 'SUPPORT',
      'cta.title': 'Ready to Optimize Your Company\'s Mobility?',
      'cta.subtitle': 'Let\'s talk about your specific needs',
      'cta.feature': 'NEXT STEP',
      'cta.button': 'Request Proposal'
    }
  }
};

async function migrateContent() {
  console.log('🚀 Starting content migration to CMS...');
  
  try {
    let itemCount = 0;

    // Iterate through each page
    for (const [pageName, locales] of Object.entries(contentData)) {
      console.log(`📄 Processing page: ${pageName}`);
      
      // Iterate through each locale
      for (const [locale, content] of Object.entries(locales)) {
        console.log(`🌐 Processing locale: ${locale}`);
        
        // Iterate through each content item
        for (const [key, value] of Object.entries(content)) {
          try {
            if (!key || typeof key !== 'string') continue;
            const keyParts = key.split('.');
            if (keyParts.length < 2) continue;
            const [section, ...keyPartsRest] = keyParts;
            const contentKey = keyPartsRest.join('.');
            
            const contentItem = {
              page: pageName,
              section: section,
              key: contentKey,
              content: {
                [locale]: value
              },
              active: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              updatedBy: 'system-migration'
            };
            
            await db.collection('content_management').add(contentItem);
            itemCount++;
          } catch (itemError) {
            console.error(`Error processing item ${key}:`, itemError);
          }
        }
      }
    }
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Total items migrated: ${itemCount}`);
    console.log(`📄 Pages: ${Object.keys(contentData).join(', ')}`);
    console.log(`🌐 Locales: ${Object.keys(contentData.home || {}).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateContent();
