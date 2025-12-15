// View/Web/src/pages/KeywordManagementPage.tsx

import { supabase } from '../../../../Model/Service/APIService/supabase';
import { KeywordRepository } from '../../../../Model/Repository/AdminRepository/KeywordRepository';
import { KeywordService } from '../../../../Model/Service/CoreService/KeywordService';
import { KeywordManagementViewModel } from '../../../../ViewModel/KeyManagementViewModel/KeyManagementViewModel';
import { KeywordManagementScreen } from '../components/AdminUI/KeywordManagementScreen';

interface Props {
    onNavigate?: (page: string) => void;
}

export function KeywordManagementPage({ onNavigate }: Props) {
    const repo = new KeywordRepository(supabase);
    const service = new KeywordService(repo);
    const vm = new KeywordManagementViewModel(service);

    return <KeywordManagementScreen vm={vm} onNavigate={onNavigate} />;
}
