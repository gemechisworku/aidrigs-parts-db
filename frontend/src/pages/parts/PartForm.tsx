import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { partsAPI } from '../../services/partsApi';
import { Part, Category, Manufacturer } from '../../types/parts';

const PartForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [formData, setFormData] = useState<Partial<Part>>({
        part_number: '',
        name: '',
        description: '',
        category_id: '',
        manufacturer_id: '',
        weight_kg: 0,
        is_active: true,
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMetadata();
        if (isEditMode) {
            fetchPart();
        }
    }, [id]);

    const fetchMetadata = async () => {
        try {
            const [cats, mfgs] = await Promise.all([
                partsAPI.getCategories(),
                partsAPI.getManufacturers(),
            ]);
            setCategories(cats);
            setManufacturers(mfgs);
        } catch (err) {
            console.error('Error fetching metadata:', err);
        }
    };

    const fetchPart = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const part = await partsAPI.getPart(id);
            setFormData(part);
        } catch (err) {
            setError('Failed to load part details');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isEditMode && id) {
                await partsAPI.updatePart(id, formData);
            } else {
                await partsAPI.createPart(formData);
            }
            navigate('/parts');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save part');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    if (isLoading && isEditMode) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {isEditMode ? 'Edit Part' : 'New Part'}
                    </h2>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="part_number" className="label">
                                Part Number *
                            </label>
                            <input
                                type="text"
                                name="part_number"
                                id="part_number"
                                required
                                className="input"
                                value={formData.part_number}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="name" className="label">
                                Part Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                className="input"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="description" className="label">
                                Description
                            </label>
                            <textarea
                                name="description"
                                id="description"
                                rows={3}
                                className="input"
                                value={formData.description || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="category_id" className="label">
                                Category
                            </label>
                            <select
                                name="category_id"
                                id="category_id"
                                className="input"
                                value={formData.category_id || ''}
                                onChange={handleChange}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="manufacturer_id" className="label">
                                Manufacturer
                            </label>
                            <select
                                name="manufacturer_id"
                                id="manufacturer_id"
                                className="input"
                                value={formData.manufacturer_id || ''}
                                onChange={handleChange}
                            >
                                <option value="">Select Manufacturer</option>
                                {manufacturers.map(mfg => (
                                    <option key={mfg.id} value={mfg.id}>{mfg.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="weight_kg" className="label">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="weight_kg"
                                id="weight_kg"
                                className="input"
                                value={formData.weight_kg || 0}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="sm:col-span-2 flex items-center pt-6">
                            <input
                                id="is_active"
                                name="is_active"
                                type="checkbox"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={formData.is_active}
                                onChange={handleChange}
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                Active
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate('/parts')}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary"
                        >
                            {isLoading ? 'Saving...' : 'Save Part'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PartForm;
