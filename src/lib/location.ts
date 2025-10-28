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

    // Se ainda não tiver IP, usar fallback
    if (!ip || ip === 'unknown') {
      return getDefaultLocation();
    }

    // Verificar cache
    const cached = locationCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Fazer requisição para API de geolocalização com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.warn('Erro ao obter localização, usando fallback:', error);
    return getDefaultLocation(ip);
  }
}

// Função para obter localização padrão
function getDefaultLocation(ip?: string): LocationData {
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

// Função para obter IP público
async function getPublicIP(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.warn('Erro ao obter IP público:', error);
    return 'unknown';
  }
}

// Função para obter IP do cliente (server-side)
export function getClientIP(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return ip || 'unknown';
}

