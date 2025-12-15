// View/Web/src/pages/KeywordManagementPage.tsx

import { supabase } from '@home-sweet-home/model';
import { KeywordRepository } from '@home-sweet-home/model';
import { KeywordService } from '@home-sweet-home/model';
import { KeywordManagementViewModel } from '@home-sweet-home/viewmodel';
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
