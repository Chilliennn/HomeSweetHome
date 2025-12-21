import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AdminLayout } from '../components/ui';
import { KeywordManagementScreen } from '../SafetyUI';
import { KeywordManagementViewModel } from '@home-sweet-home/viewmodel';

const KeywordManagementPage: React.FC = observer(() => {
    const [vm] = useState(() => new KeywordManagementViewModel());

    return (
        <AdminLayout>
            <KeywordManagementScreen vm={vm} />
        </AdminLayout>
    );
});

export default KeywordManagementPage;
