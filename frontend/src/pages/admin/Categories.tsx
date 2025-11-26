/**
 * Categories Page - CRUD for product categories
 */
import { useState, useEffect } from 'react';
import { categoriesAPI, Category, CategoryCreate } from '../../services/categoriesApi';

const Categories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<CategoryCreate>({
        category_name_en: '',
        category_name_pr: '',
        category_name_fr: '',
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await categoriesAPI.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await categoriesAPI.updateCategory(editingCategory.id, formData);
            } else {
                await categoriesAPI.createCategory(formData);
            }
            await loadCategories();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category');
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            category_name_en: category.category_name_en,
            category_name_pr: category.category_name_pr || '',
            category_name_fr: category.category_name_fr || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await categoriesAPI.deleteCategory(id);
            await loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            category_name_en: '',
            category_name_pr: '',
            category_name_fr: '',
        });
    };

    const filteredCategories = categories.filter(cat =>
        cat.category_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.category_name_pr && cat.category_name_pr.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cat.category_name_fr && cat.category_name_fr.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-600 mt-1">Manage product categories</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        + Add Category
                    </button>
                </div>

                {/* Search */}
                <div className="card mb-6">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input"
                    />
                </div>

                {/* Categories Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No categories found
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">English Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Portuguese Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">French Name</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCategories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {category.category_name_en}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {category.category_name_pr || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {category.category_name_fr || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingCategory ? 'Edit Category' : 'Add Category'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">English Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.category_name_en}
                                    onChange={(e) => setFormData({ ...formData, category_name_en: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Engine Parts"
                                />
                            </div>
                            <div>
                                <label className="label">Portuguese Name</label>
                                <input
                                    type="text"
                                    value={formData.category_name_pr || ''}
                                    onChange={(e) => setFormData({ ...formData, category_name_pr: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Peças de Motor"
                                />
                            </div>
                            <div>
                                <label className="label">French Name</label>
                                <input
                                    type="text"
                                    value={formData.category_name_fr || ''}
                                    onChange={(e) => setFormData({ ...formData, category_name_fr: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Pièces de Moteur"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
