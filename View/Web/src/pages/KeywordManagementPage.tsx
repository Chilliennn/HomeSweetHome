import React from 'react';
import { observer } from 'mobx-react-lite';
import { AdminLayout } from '../components/ui';
import { KeywordManagementScreen } from '../SafetyUI';
import { keywordManagementViewModel } from '@home-sweet-home/viewmodel';

const KeywordManagementPage: React.FC = observer(() => {
    return (
        <AdminLayout>
            <KeywordManagementScreen vm={keywordManagementViewModel} />
        </AdminLayout>
    );
});

export default KeywordManagementPage;
