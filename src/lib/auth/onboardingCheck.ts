import { GetServerSidePropsContext } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export interface OnboardingCheckResult {
  shouldRedirect: boolean;
  redirectDestination?: string;
  driver?: any;
}

/**
 * Verifica se o motorista completou o onboarding
 * @param context - Contexto do Next.js
 * @param driverId - ID do motorista (opcional, será buscado se não fornecido)
 * @returns Resultado da verificação
 */
export async function checkOnboardingCompletion(
  context: GetServerSidePropsContext,
  driverId?: string
): Promise<OnboardingCheckResult> {
  try {
    let driver;
    
    if (driverId) {
      // Se o ID foi fornecido, buscar diretamente
      const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
      if (!driverDoc.exists) {
        return {
          shouldRedirect: true,
          redirectDestination: '/login',
        };
      }
      driver = {
        id: driverDoc.id,
        ...driverDoc.data(),
      };
    } else {
      // Buscar pelo UID do usuário
      const userData = (context as any).userData;
      if (!userData?.uid) {
        return {
          shouldRedirect: true,
          redirectDestination: '/login',
        };
      }

      const driverSnap = await adminDb.collection('drivers').where('uid', '==', userData.uid).limit(1).get();
      
      if (driverSnap.empty) {
        return {
          shouldRedirect: true,
          redirectDestination: '/login',
        };
      }

      const driverDoc = driverSnap.docs[0];
      driver = {
        id: driverDoc.id,
        ...driverDoc.data(),
      };
    }

    // Verificar se completou o onboarding
    const hasSelectedPlan = driver.selectedPlan && driver.selectedPlan !== null;
    const documentsUploaded = driver.documents ? 
      Object.values(driver.documents).filter((doc: any) => doc.uploaded).length : 0;
    
    // Se não completou o onboarding, redirecionar
    if (!hasSelectedPlan || documentsUploaded === 0) {
      return {
        shouldRedirect: true,
        redirectDestination: '/drivers/onboarding',
      };
    }

    return {
      shouldRedirect: false,
      driver,
    };
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return {
      shouldRedirect: true,
      redirectDestination: '/login',
    };
  }
}

