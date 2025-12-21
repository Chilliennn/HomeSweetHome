import React from 'react';
import { AdminLayout } from '../components/ui';
import { RelationshipsScreen } from '../AdminUI';

const RelationshipsPage: React.FC = () => {
    return (
        <AdminLayout>
            <RelationshipsScreen />
        </AdminLayout>
    );
};

export default RelationshipsPage;
