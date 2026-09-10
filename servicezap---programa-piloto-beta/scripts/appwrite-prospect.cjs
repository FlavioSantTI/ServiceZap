/**
 * SCRIPT DE INTEGRAÇÃO, BANCO DE DADOS E PROSPECÇÃO DO SERVICEZAP COM APPWRITE
 * 
 * Uso:
 *   node scripts/appwrite-prospect.js --setup      (Cria banco e coleção no Appwrite)
 *   node scripts/appwrite-prospect.js --list       (Lista leads capturados)
 *   node scripts/appwrite-prospect.js --prospect   (Gera script e links de prospecção para os leads)
 *   node scripts/appwrite-prospect.js --seed       (Insere leads de teste para validar o fluxo)
 */

const { Client, Databases, ID, Query } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente se existir arquivo .env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[match[1]]) process.env[match[1]] = val;
      }
    });
  }
} catch (e) {
  // .env não encontrado ou não necessário
}

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'servicezap_db';
const COLLECTION_ID = process.env.VITE_APPWRITE_COLLECTION_ID || 'leads_servicezap';

console.log('⚡ ==========================================');
console.log('⚡ ServiceZap - Script de Prospecção Appwrite');
console.log('⚡ ==========================================');

if (!PROJECT_ID || !API_KEY) {
  console.log('⚠️ AVISO: VITE_APPWRITE_PROJECT_ID ou APPWRITE_API_KEY não configurados no ambiente.');
  console.log('   O script executará em MODO LOCAL com base em dados de arquivo/simulação.');
  console.log('   Para conectar ao seu Appwrite Cloud, defina no .env:');
  console.log('   - VITE_APPWRITE_PROJECT_ID="seu_project_id"');
  console.log('   - VITE_APPWRITE_DATABASE_ID="servicezap_db"');
  console.log('   - APPWRITE_API_KEY="sua_secret_api_key"\n');
}

let databases = null;

if (PROJECT_ID && API_KEY) {
  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);
  databases = new Databases(client);
}

// Arquivo de fallback local
const LOCAL_DB_FILE = path.resolve(process.cwd(), 'leads_backup.json');

function getLocalLeads() {
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [
    {
      $id: 'lead_demo_1',
      name: 'Marcos Silva',
      whatsapp: '5511987654321',
      service_type: 'Instalação e Manutenção de Ar Condicionado',
      daily_volume: '100 a 500 / dia',
      status: 'pendente_avaliacao',
      created_at: new Date().toISOString(),
      notes: 'Gostaria de não perder clientes enquanto está na escada trabalhando.'
    },
    {
      $id: 'lead_demo_2',
      name: 'Luciana Ferreira',
      whatsapp: '5521998877665',
      service_type: 'Serviços Elétricos e Padrão de Luz',
      daily_volume: 'Menos de 100 / dia',
      status: 'pendente_avaliacao',
      created_at: new Date().toISOString(),
      notes: 'Demora até 3 horas para responder clientes quando está em obra.'
    }
  ];
}

function saveLocalLeads(leads) {
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

/**
 * 1. MODO SETUP: Cria o Banco e Coleção com atributos no Appwrite
 */
async function runSetup() {
  if (!databases) {
    console.error('❌ Para rodar o setup no Appwrite, preencha PROJECT_ID e APPWRITE_API_KEY.');
    return;
  }

  console.log(`🔧 Verificando/Criando Database "${DATABASE_ID}" no Appwrite...`);
  try {
    try {
      await databases.create(DATABASE_ID, 'ServiceZap Database');
      console.log('✅ Banco de dados criado com sucesso!');
    } catch (e) {
      if (e.code === 409) {
        console.log('ℹ️ Banco de dados já existe.');
      } else {
        throw e;
      }
    }

    console.log(`🔧 Verificando/Criando Coleção "${COLLECTION_ID}"...`);
    try {
      await databases.createCollection(
        DATABASE_ID,
        COLLECTION_ID,
        'Leads Candidatos Piloto',
        ['read("any")', 'create("any")', 'update("any")']
      );
      console.log('✅ Coleção de Leads criada!');
    } catch (e) {
      if (e.code === 409) {
        console.log('ℹ️ Coleção de Leads já existe.');
      } else {
        throw e;
      }
    }

    console.log('🔧 Criando atributos do Lead (name, whatsapp, service_type, status, etc.)...');
    const attributes = [
      { key: 'name', type: 'string', size: 128, required: true },
      { key: 'whatsapp', type: 'string', size: 32, required: true },
      { key: 'service_type', type: 'string', size: 256, required: true },
      { key: 'daily_volume', type: 'string', size: 64, required: false },
      { key: 'status', type: 'string', size: 32, required: true, default: 'pendente_avaliacao' },
      { key: 'created_at', type: 'string', size: 64, required: false },
      { key: 'notes', type: 'string', size: 1000, required: false }
    ];

    for (const attr of attributes) {
      try {
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required,
          attr.default
        );
        console.log(`   + Atributo criado: ${attr.key}`);
      } catch (err) {
        if (err.code === 409) {
          console.log(`   ~ Atributo já existente: ${attr.key}`);
        } else {
          console.warn(`   ! Aviso no atributo ${attr.key}:`, err.message);
        }
      }
    }

    console.log('\n🎉 Setup concluído! O Appwrite está pronto para receber e avaliar candidaturas.');
  } catch (error) {
    console.error('❌ Erro no setup:', error);
  }
}

/**
 * 2. MODO LIST: Lista os leads armazenados
 */
async function runList() {
  console.log('📋 Buscando leads cadastrados no banco...\n');

  if (databases) {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      console.log(`Encontrados ${response.documents.length} leads no Appwrite:\n`);
      response.documents.forEach((doc, idx) => {
        printLead(doc, idx + 1);
      });
      return;
    } catch (err) {
      console.log('ℹ️ Erro ao consultar Appwrite (' + err.message + '). Listando leads locais:');
    }
  }

  const local = getLocalLeads();
  console.log(`Encontrados ${local.length} leads no armazenamento local:\n`);
  local.forEach((doc, idx) => {
    printLead(doc, idx + 1);
  });
}

function printLead(doc, index) {
  console.log(`--------------------------------------------------`);
  console.log(`#${index} [${doc.status ? doc.status.toUpperCase() : 'PENDENTE'}]`);
  console.log(`👤 Nome: ${doc.name}`);
  console.log(`📱 WhatsApp: ${doc.whatsapp}`);
  console.log(`🔧 Serviço: ${doc.service_type}`);
  console.log(`📊 Volume: ${doc.daily_volume || 'N/I'}`);
  console.log(`📅 Data: ${doc.created_at || 'Recente'}`);
  if (doc.notes) console.log(`📝 Notas: ${doc.notes}`);
}

/**
 * 3. MODO PROSPECT: Gera links e scripts de WhatsApp prontos para prospecção ativa
 */
async function runProspect() {
  console.log('🎯 MODO DE PROSPECÇÃO DE LEADS (AVALIAÇÃO & FECHAMENTO)\n');
  
  let leads = [];

  if (databases) {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      leads = response.documents;
    } catch (err) {
      console.log('ℹ️ Buscando da base local...');
      leads = getLocalLeads();
    }
  } else {
    leads = getLocalLeads();
  }

  const pendentes = leads.filter(l => l.status === 'pendente_avaliacao' || !l.status || l.status === 'em_analise');

  if (pendentes.length === 0) {
    console.log('Nenhum lead pendente de avaliação no momento.');
    return;
  }

  console.log(`Foram encontrados ${pendentes.length} leads aguardando avaliação/prospecção.\n`);

  pendentes.forEach((lead, i) => {
    const cleanPhone = (lead.whatsapp || '').replace(/\D/g, '');
    const firstName = (lead.name || 'Prestador').split(' ')[0];
    const service = lead.service_type || 'seus serviços';

    // Script de Prospecção Altamente Persuasivo & Personalizado
    const mensagem = 
`Olá ${firstName}! Aqui é da equipe do ServiceZap. ⚡

Recebemos seu formulário de candidatura para o Programa Piloto do seu negócio de ${service}.

Analisamos suas informações e seu perfil foi PRÉ-APROVADO para uma das 5 vagas exclusivas com 3 meses de acesso 100% gratuito no Plano Básico (sem custos e sem cartão).

Queremos te ajudar a nunca mais perder um orçamento por demorar a responder clientes enquanto está atendendo.

Podemos liberar seu acesso e te ajudar a conectar via QR Code em 3 minutos hoje?`;

    const encodedMsg = encodeURIComponent(mensagem);
    const waLink = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    console.log(`=======================================================`);
    console.log(`🔥 LEAD #${i + 1}: ${lead.name} (${cleanPhone})`);
    console.log(`🔧 Ramo: ${service}`);
    console.log(`\n💬 Mensagem de Prospecção Pronta:\n${mensagem}`);
    console.log(`\n🚀 Link Direto para Iniciar a Conversa no WhatsApp:`);
    console.log(waLink);
    console.log(`=======================================================\n`);
  });

  console.log('💡 DICA DE PROSPECÇÃO:');
  console.log('   Ao entrar em contato pelo link acima, o lead receberá a confirmação de que sua avaliação foi aceita, aumentando em mais de 70% a taxa de conexão imediata.');
}

/**
 * 4. MODO SEED: Insere leads de teste
 */
async function runSeed() {
  console.log('🌱 Inserindo leads de teste...');
  const testLeads = [
    {
      name: 'Rodrigo Medeiros',
      whatsapp: '5511971234567',
      service_type: 'Eletricista Residencial e Industrial',
      daily_volume: '100 a 500 / dia',
      status: 'pendente_avaliacao',
      created_at: new Date().toISOString(),
      notes: 'Perde clientes quando está no meio de instalações elétricas.'
    },
    {
      name: 'Juliana Pires',
      whatsapp: '5519982345678',
      service_type: 'Clínica de Estética e Agendamentos',
      daily_volume: 'Menos de 100 / dia',
      status: 'pendente_avaliacao',
      created_at: new Date().toISOString(),
      notes: 'Clientes reclamam de demora quando a equipe está em procedimento.'
    }
  ];

  if (databases) {
    try {
      for (const lead of testLeads) {
        await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), lead);
        console.log(`✅ Lead salvo no Appwrite: ${lead.name}`);
      }
      return;
    } catch (e) {
      console.warn('Falha ao inserir no Appwrite, salvando no banco local:', e.message);
    }
  }

  const current = getLocalLeads();
  saveLocalLeads([...testLeads, ...current]);
  console.log('✅ Leads de teste salvos no arquivo local com sucesso!');
}

// Roteador de comandos da CLI
const arg = process.argv[2];
if (arg === '--setup') {
  runSetup();
} else if (arg === '--list') {
  runList();
} else if (arg === '--prospect') {
  runProspect();
} else if (arg === '--seed') {
  runSeed();
} else {
  console.log('Comandos disponíveis:');
  console.log('  node scripts/appwrite-prospect.js --setup    -> Configura banco e coleção no Appwrite');
  console.log('  node scripts/appwrite-prospect.js --list     -> Lista leads cadastrados');
  console.log('  node scripts/appwrite-prospect.js --prospect -> Gera scripts e links de prospecção para WhatsApp');
  console.log('  node scripts/appwrite-prospect.js --seed     -> Insere leads de teste');
  runProspect();
}
