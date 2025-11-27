import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PartDetailContent from './PartDetailContent';

const PartDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) {
        return <div className="text-center py-8">Invalid part ID</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-4">
                <button
                    onClick={() => navigate('/parts')}
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Parts Catalog
                </button>
            </div>
            <div className="card">
                <PartDetailContent partId={id} />
            </div>
        </div>
    );
};

export default PartDetail;
