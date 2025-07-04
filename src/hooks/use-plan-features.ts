'use client';

import { useClientStore } from '@/hooks/use-client-store.tsx';
import { planFeatures, type Feature } from '@/lib/plans';

export function usePlanFeatures() {
    const { currentClient } = useClientStore();

    const hasFeature = (feature: Feature): boolean => {
        if (!currentClient) {
            return false;
        }
        return planFeatures[currentClient.plan].includes(feature);
    };

    return { hasFeature };
}
