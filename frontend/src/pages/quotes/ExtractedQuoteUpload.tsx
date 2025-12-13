import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { extractedQuotesAPI, ExtractedQuote, ExtractedQuoteItem } from '../../services/extractedQuotesApi';
import { countriesAPI, Country } from '../../services/countriesApi';
import { portsAPI, Port } from '../../services/portsApi';
import CreatableSelect from '../../components/common/CreatableSelect';

type TabType = 'info' | 'items' | 'attachment';

// Incoterm options
const INCOTERM_OPTIONS = [
    { value: 'EXW', label: 'EXW – Ex Works' },
    { value: 'FCA', label: 'FCA – Free Carrier' },
    { value: 'CPT', label: 'CPT – Carriage Paid To' },
    { value: 'CIP', label: 'CIP – Carriage and Insurance Paid To' },
    { value: 'DAP', label: 'DAP – Delivered At Place' },
    { value: 'DPU', label: 'DPU – Delivered At Place Unloaded' },
    { value: 'DDP', label: 'DDP – Delivered Duty Paid' },
];

const ExtractedQuoteUpload: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>('info');

    // Dropdown data
    const [countries, setCountries] = useState<Country[]>([]);
    const [ports, setPorts] = useState<Port[]>([]);
    const [newPortName, setNewPortName] = useState('');

    // Form state
    const [formData, setFormData] = useState<Partial<ExtractedQuote>>({
        quote_number: '',
        quote_date: null,
        valid_until: null,
        vehicle_vin: '',
        vehicle_make: '',
        vehicle_model: '',
        customer_name: '',
        customer_city: '',
        customer_country: '',
        customer_phone: '',
        customer_email: '',
        currency: 'USD',
        origin_incoterm: '',
        origin_port: '',
        items: []
    });

    // Load countries and ports
    useEffect(() => {
        const loadData = async () => {
            try {
                const [countriesData, portsData] = await Promise.all([
                    countriesAPI.getCountries(0, 300),
                    portsAPI.getPorts()
                ]);
                setCountries(countriesData);
                setPorts(portsData);
            } catch (error) {
                console.error('Error loading dropdown data:', error);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            loadQuote(id);
        }
    }, [id]);

    useEffect(() => {
        let interval: number | undefined;
        if (uploading) {
            interval = window.setInterval(() => {
                setElapsedTime(t => t + 1);
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [uploading]);

    const loadQuote = async (quoteId: string) => {
        setLoading(true);
        try {
            const quote = await extractedQuotesAPI.getExtractedQuote(quoteId);
            setFormData(quote);
        } catch (error) {
            console.error('Error loading quote:', error);
            alert('Failed to load quote');
            navigate('/quotes/extracted');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            alert('Only PDF, JPEG, and PNG files are allowed');
            return;
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('File size must be less than 50MB');
            return;
        }

        setUploading(true);
        setElapsedTime(0);

        try {
            const quote = await extractedQuotesAPI.uploadQuoteFile(file);
            setFormData(quote);
            setActiveTab('info'); // Switch to info tab after upload
            alert('Quote extracted successfully!');
        } catch (error: any) {
            console.error('Error uploading file:', error);
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                alert('Upload timed out. The file may be too large or the extraction service is slow. Please try again.');
            } else {
                alert(error.response?.data?.detail || 'Failed to upload and extract quote');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.id) {
            alert('No quote to save');
            return;
        }

        setLoading(true);
        try {
            await extractedQuotesAPI.updateExtractedQuote(formData.id, {
                ...formData,
                items: formData.items as ExtractedQuoteItem[]
            });
            alert('Quote updated successfully!');
            navigate('/quotes/extracted');
        } catch (error: any) {
            console.error('Error saving quote:', error);
            alert(error.response?.data?.detail || 'Failed to save quote');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [
                ...(formData.items || []),
                {
                    part_name: '',
                    quantity: 1,
                    unit_price: 0,
                    discount: 0,
                    total_price: 0,
                    position: (formData.items?.length || 0) + 1
                }
            ]
        });
    };

    const updateItem = (index: number, field: keyof ExtractedQuoteItem, value: any) => {
        const items = [...(formData.items || [])];
        items[index] = { ...items[index], [field]: value };

        // Auto-calculate total_price
        if (field === 'quantity' || field === 'unit_price' || field === 'discount') {
            const item = items[index];
            const qty = field === 'quantity' ? value : item.quantity;
            const price = field === 'unit_price' ? value : item.unit_price;
            const discount = field === 'discount' ? value : (item.discount || 0);
            items[index].total_price = qty * price * (1 - discount / 100);
        }

        setFormData({ ...formData, items });
    };

    const removeItem = (index: number) => {
        const items = [...(formData.items || [])];
        items.splice(index, 1);
        setFormData({ ...formData, items });
    };

    const handleCreatePort = async () => {
        if (!newPortName.trim()) return;

        try {
            const newPort = await portsAPI.createPort({
                port_code: newPortName.trim().toUpperCase().replace(/\s+/g, '_'),
                port_name: newPortName.trim(),
            });
            setPorts([...ports, newPort]);
            setFormData({ ...formData, origin_port: newPort.port_name || newPort.port_code });
            setNewPortName('');
        } catch (error) {
            console.error('Error creating port:', error);
            alert('Failed to create new port');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <button onClick={() => navigate('/quotes/extracted')} className="text-indigo-600 hover:text-indigo-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to List
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'View & Edit Extracted Quote' : 'Upload Quote for Extraction'}
                </h1>
                <p className="text-gray-600">
                    {isEditMode ? 'Review and edit extracted data' : 'Upload a PDF or image to extract quote data'}
                </p>
            </div>

            {/* File Upload Section */}
            {!isEditMode && !formData.id && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Quote File</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PDF, PNG, or JPEG (max 50MB)</p>
                        </label>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Extracting data...</span>
                                <span className="font-medium text-indigo-600">{formatTime(elapsedTime)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>
                            {elapsedTime > 60 && (
                                <p className="text-xs text-yellow-600 mt-2">
                                    Still processing... This may take up to 120 seconds for complex quotes.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Tabbed Interface */}
            {formData.id && (
                <>
                    {/* Tab Navigation */}
                    <div className="bg-white rounded-t-xl shadow-sm border border-b-0 border-gray-100">
                        <div className="flex border-b border-gray-200">
                            <TabButton tab="info" label="Quote Information" />
                            <TabButton tab="items" label={`Quote Items (${formData.items?.length || 0})`} />
                            {formData.attachment_filename && (
                                <TabButton tab="attachment" label="Attachment" />
                            )}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 p-6 mb-6">
                        {/* Quote Information Tab */}
                        {activeTab === 'info' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Quote Number</label>
                                            <input
                                                type="text"
                                                value={formData.quote_number || ''}
                                                onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Currency</label>
                                            <select
                                                value={formData.currency || 'USD'}
                                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                                className="input"
                                            >
                                                <option value="">Select currency...</option>
                                                {Array.from(new Set(countries.filter(c => c.currency_code).map(c => c.currency_code)))
                                                    .sort()
                                                    .map((currencyCode) => {
                                                        const country = countries.find(c => c.currency_code === currencyCode);
                                                        return (
                                                            <option key={currencyCode} value={currencyCode}>
                                                                {currencyCode} - {country?.currency_name || currencyCode}
                                                            </option>
                                                        );
                                                    })}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Quote Date</label>
                                            <input
                                                type="date"
                                                value={formData.quote_date || ''}
                                                onChange={(e) => setFormData({ ...formData, quote_date: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Valid Until</label>
                                            <input
                                                type="date"
                                                value={formData.valid_until || ''}
                                                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">Customer Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="label">Customer Name</label>
                                            <input
                                                type="text"
                                                value={formData.customer_name || ''}
                                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">City</label>
                                            <input
                                                type="text"
                                                value={formData.customer_city || ''}
                                                onChange={(e) => setFormData({ ...formData, customer_city: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Country</label>
                                            <select
                                                value={formData.customer_country || ''}
                                                onChange={(e) => setFormData({ ...formData, customer_country: e.target.value })}
                                                className="input"
                                            >
                                                <option value="">Select country...</option>
                                                {countries.map((country) => (
                                                    <option key={country.code} value={country.name}>
                                                        {country.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.customer_phone || ''}
                                                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Email</label>
                                            <input
                                                type="email"
                                                value={formData.customer_email || ''}
                                                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">Vehicle Information</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="label">VIN</label>
                                            <input
                                                type="text"
                                                value={formData.vehicle_vin || ''}
                                                onChange={(e) => setFormData({ ...formData, vehicle_vin: e.target.value })}
                                                className="input font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Make</label>
                                            <input
                                                type="text"
                                                value={formData.vehicle_make || ''}
                                                onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Model</label>
                                            <input
                                                type="text"
                                                value={formData.vehicle_model || ''}
                                                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">Shipping Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Origin Incoterm</label>
                                            <select
                                                value={formData.origin_incoterm || ''}
                                                onChange={(e) => setFormData({ ...formData, origin_incoterm: e.target.value })}
                                                className="input"
                                            >
                                                <option value="">Select incoterm...</option>
                                                {INCOTERM_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Origin Port</label>
                                            <CreatableSelect
                                                options={ports.map(port => ({
                                                    value: port.port_name || port.port_code,
                                                    label: `${port.port_name || port.port_code}${port.country ? ` (${port.country})` : ''}`
                                                }))}
                                                value={formData.origin_port || ''}
                                                onChange={(value) => setFormData({ ...formData, origin_port: value })}
                                                onCreate={async (value: string) => {
                                                    try {
                                                        const newPort = await portsAPI.createPort({
                                                            port_code: value.toUpperCase().replace(/\s+/g, '_').substring(0, 5),
                                                            port_name: value,
                                                        });
                                                        setPorts([...ports, newPort]);
                                                        return newPort.port_name || newPort.port_code;
                                                    } catch (error) {
                                                        console.error('Error creating port:', error);
                                                        throw error;
                                                    }
                                                }}
                                                placeholder="Select or create port..."
                                                className="input"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quote Items Tab */}
                        {activeTab === 'items' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-md font-semibold text-gray-900">Quote Items</h3>
                                    <button onClick={addItem} className="btn-secondary text-sm">+ Add Item</button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Part Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Discount%</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {formData.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{index + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.part_name}
                                                            onChange={(e) => updateItem(index, 'part_name', e.target.value)}
                                                            className="input text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                            className="input text-sm w-20"
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                                            className="input text-sm w-28"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.discount || 0}
                                                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value))}
                                                            className="input text-sm w-20"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                                        {(Number(item.total_price) || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {formData.items?.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            No items added. Click "Add Item" to add quote items.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Attachment Tab */}
                        {activeTab === 'attachment' && formData.attachment_filename && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-md font-semibold text-gray-900">Attachment Preview</h3>
                                        <p className="text-sm text-gray-500">{formData.attachment_filename}</p>
                                    </div>
                                    <button
                                        onClick={() => extractedQuotesAPI.downloadQuoteFile(formData.id!, formData.attachment_filename!)}
                                        className="btn-secondary text-sm"
                                    >
                                        Download File
                                    </button>
                                </div>
                                <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                                    {formData.attachment_mime_type?.includes('pdf') ? (
                                        <iframe
                                            src={extractedQuotesAPI.getQuoteFilePreviewUrl(formData.id!)}
                                            className="w-full h-[600px]"
                                            title="Quote attachment preview"
                                        />
                                    ) : (
                                        <img
                                            src={extractedQuotesAPI.getQuoteFilePreviewUrl(formData.id!)}
                                            alt="Quote attachment"
                                            className="w-full h-auto"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <button onClick={() => navigate('/quotes/extracted')} className="btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : 'Save Quote'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExtractedQuoteUpload;
