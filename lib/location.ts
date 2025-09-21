// Serviço de localização por IP
export interface LocationData {
  city: string;
  country: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  ip: string;
}

// Cache de localizações para evitar muitas requisições
const locationCache = new Map<string, { data: LocationData; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Função para obter localização por IP
export async function getLocationByIP(ip?: string): Promise<LocationData> {
  try {
    // Se não tiver IP, usar IP público
    if (!ip) {
      ip = await getPublicIP();
    }

    // Verificar cache
    const cached = locationCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Fazer requisição para API de geolocalização
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) {
      throw new Error('Falha ao obter localização');
    }

    const data = await response.json();
    
    const locationData: LocationData = {
      city: data.city || 'Desconhecida',
      country: data.country_name || 'Desconhecido',
      region: data.region || 'Desconhecida',
      coordinates: {
        lat: data.latitude || 0,
        lng: data.longitude || 0
      },
      ip: ip
    };

    // Salvar no cache
    locationCache.set(ip, { data: locationData, timestamp: Date.now() });

    return locationData;
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    
    // Fallback para localização padrão (Lisboa)
    return {
      city: 'Lisboa',
      country: 'Portugal',
      region: 'Lisboa',
      coordinates: {
        lat: 38.7223,
        lng: -9.1393
      },
      ip: ip || 'unknown'
    };
  }
}

// Função para obter IP público
async function getPublicIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Erro ao obter IP público:', error);
    return 'unknown';
  }
}

// Função para obter IP do cliente (server-side)
export function getClientIP(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return ip || 'unknown';
}
