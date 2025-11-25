import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { partsAPI } from '../../services/partsApi';
import { Part, Category, Manufacturer } from '../../types/parts';

const PartList: React.FC = () => {
    const [parts, setParts] = useState<Part[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category_id: '',
        manufacturer_id: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchParts();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [filters]);

    const fetchData = async () => {
        try {
            const [cats, mfgs] = await Promise.all([
                partsAPI.getCategories(),
                partsAPI.getManufacturers(),
            ]);
            setCategories(cats);
            setManufacturers(mfgs);
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    const fetchParts = async () => {
        setIsLoading(true);
        try {
            const data = await partsAPI.getParts(filters);
            setParts(data);
        } catch (error) {
            console.error('Error fetching parts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
                <Link to="/parts/new" className="btn-primary">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Part
                </Link>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label">Search</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="search"
                                className="input pl-10"
                                placeholder="Search by name or number..."
                                value={filters.search}
                                onChange={handleFilterChange}
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label">Category</label>
                        <select
                            name="category_id"
                            className="input"
                            value={filters.category_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label">Manufacturer</label>
                        <select
                            name="manufacturer_id"
                            className="input"
                            value={filters.manufacturer_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Manufacturers</option>
                            {manufacturers.map(mfg => (
                                <option key={mfg.id} value={mfg.id}>{mfg.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Part Details
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Manufacturer
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    Loading parts...
                                </td>
                            </tr>
                        ) : parts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    No parts found. Try adjusting your filters or add a new part.
                                </td>
                            </tr>
                        ) : (
                            parts.map((part) => (
                                <tr key={part.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{part.part_number}</div>
                                                <div className="text-sm text-gray-500">{part.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{part.category?.name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{part.manufacturer?.name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${part.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {part.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/parts/${part.id}`} className="text-red-600 hover:text-red-900 mr-4">
                                            View
                                        </Link>
                                        <Link to={`/parts/${part.id}/edit`} className="text-gray-600 hover:text-gray-900">
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PartList;
