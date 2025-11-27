import React, { useState, useEffect } from 'react';
import { priceTierMapAPI, PriceTierMap } from '../../services/priceTierMapApi';
import { priceTiersAPI, PriceTier } from '../../services/priceTiersApi';

interface PartPricingProps {
    partId: string;
}

const PartPricing: React.FC<PartPricingProps> = ({ partId }) => {
    const [prices, setPrices] = useState<PriceTierMap[]>([]);
    const [tiers, setTiers] = useState<PriceTier[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingPrice, setEditingPrice] = useState<PriceTierMap | null>(null);
    const [formData, setFormData] = useState({
        tier_id: '',
        price: ''
    });

    useEffect(() => {
        loadData();
    }, [partId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pricesData, tiersData] = await Promise.all([
                priceTierMapAPI.getPartPrices(partId),
                priceTiersAPI.getPriceTiers()
            ]);
            setPrices(pricesData);
            setTiers(tiersData);
        } catch (error) {
            console.error('Error loading pricing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPrice) {
                await priceTierMapAPI.updatePrice(editingPrice.id, {
                    price: parseFloat(formData.price)
                });
            } else {
                await priceTierMapAPI.createPrice({
                    part_id: partId,
                    tier_id: formData.tier_id,
                    price: parseFloat(formData.price)
                });
            }
            await loadData();
            closeModal();
        } catch (error: any) {
            console.error('Error saving price:', error);
            alert(error.response?.data?.detail || 'Failed to save price');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this price?')) return;
        try {
            await priceTierMapAPI.deletePrice(id);
            await loadData();
        } catch (error) {
            console.error('Error deleting price:', error);
        }
    };

    const openEditModal = (priceMap: PriceTierMap) => {
        setEditingPrice(priceMap);
        setFormData({
            tier_id: priceMap.tier_id,
            price: priceMap.price?.toString() || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPrice(null);
        setFormData({
            tier_id: '',
            price: ''
        });
    };

    // Filter out tiers that already have a price assigned (unless editing)
    const availableTiers = tiers.filter(tier =>
        !prices.some(p => p.tier_id === tier.id) || (editingPrice && editingPrice.tier_id === tier.id)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary"
                    disabled={availableTiers.length === 0}
                >
                    Add Price
                </button>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="table-auto w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {prices.map((priceMap) => (
                                <tr key={priceMap.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                        {priceMap.tier_name || 'Unknown Tier'}
                                        {priceMap.tier_kind && (
                                            <span className="ml-2 badge badge-secondary text-xs">
                                                {priceMap.tier_kind}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-500">
                                        {tiers.find(t => t.id === priceMap.tier_id)?.description || '-'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right font-mono">
                                        {priceMap.price ? `$${priceMap.price.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right">
                                        <button
                                            onClick={() => openEditModal(priceMap)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(priceMap.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                        Loading prices...
                                    </td>
                                </tr>
                            )}
                            {!loading && prices.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                        No specific pricing configured for this part.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">
                            {editingPrice ? 'Edit Price' : 'Add Price'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Price Tier</label>
                                    <select
                                        required
                                        value={formData.tier_id}
                                        onChange={(e) => setFormData({ ...formData, tier_id: e.target.value })}
                                        className="input"
                                        disabled={!!editingPrice}
                                    >
                                        <option value="">Select a tier...</option>
                                        {editingPrice ? (
                                            <option value={editingPrice.tier_id}>
                                                {editingPrice.tier_name || 'Unknown Tier'}
                                            </option>
                                        ) : (
                                            availableTiers.map(tier => (
                                                <option key={tier.id} value={tier.id}>
                                                    {tier.tier_name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Price</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="input pl-7"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartPricing;
