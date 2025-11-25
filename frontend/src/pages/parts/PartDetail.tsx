import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { partsAPI } from '../../services/partsApi';
import { Part } from '../../types/parts';

const PartDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [part, setPart] = useState<Part | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchPart(id);
        }
    }, [id]);

    const fetchPart = async (partId: string) => {
        try {
            const data = await partsAPI.getPart(partId);
            setPart(data);
        } catch (error) {
            console.error('Error fetching part:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!part || !window.confirm('Are you sure you want to delete this part?')) return;

        try {
            await partsAPI.deletePart(part.id);
            navigate('/parts');
        } catch (error) {
            console.error('Error deleting part:', error);
        }
    };

    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (!part) return <div className="text-center py-8">Part not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {part.part_number}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{part.name}</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <button
                        onClick={handleDelete}
                        className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
                    >
                        Delete
                    </button>
                    <Link
                        to={`/parts/${part.id}/edit`}
                        className="btn-primary"
                    >
                        Edit Part
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Category</dt>
                                <dd className="mt-1 text-sm text-gray-900">{part.category?.name || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                                <dd className="mt-1 text-sm text-gray-900">{part.manufacturer?.name || '-'}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                <dd className="mt-1 text-sm text-gray-900">{part.description || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Weight</dt>
                                <dd className="mt-1 text-sm text-gray-900">{part.weight_kg ? `${part.weight_kg} kg` : '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${part.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {part.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Specifications */}
                    {part.specifications && Object.keys(part.specifications).length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                {Object.entries(part.specifications).map(([key, value]) => (
                                    <div key={key}>
                                        <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{String(value)}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Metadata */}
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">System Info</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">ID</dt>
                                <dd className="text-xs font-mono text-gray-900 break-all">{part.id}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartDetail;
